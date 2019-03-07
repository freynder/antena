
const Net = require("net");
const PosixSocket = require("posix-socket");
const Messaging = require("./messaging.js");

let BUFFER = Buffer.from(new ArrayBuffer(1024));

const noop = () => {};

module.exports = (address, session, callback) => {
  address = convert(address);
  let sockfd;
  const socket = Net.connect(address.net);
  const cleanup = (error) => {
    try { PosixSocket.close(sockfd) } catch (error) {}
    socket.removeAllListeners("error");
    socket.removeAllListeners("connect");
    socket.removeAllListeners("data");
    socket._antena_receive = noop;
    socket.destroy();
    callback(error);
  };
  socket.once("error", cleanup);
  socket.once("connect", () => {
    Messaging(socket);
    socket._antena_send("@"+session);
    socket._antena_receive = (token) => {
      try {
        sockfd = PosixSocket.socket(address.domain, PosixSocket.SOCK_STREAM, 0);
        if (address.domain !== PosixSocket.AF_LOCAL)
          PosixSocket.setsockopt(sockfd, PosixSocket.IPPROTO_TCP, PosixSocket.TCP_NODELAY, 1);
        PosixSocket.connect(sockfd, address.posix);
        output(sockfd, "$"+token);
      } catch (error) {
        return cleanup(error);
      }
      const emitter = {
        _sockfd: sockfd,
        _socket: socket,
        onpush,
        onterminate,
        onclose,
        session,
        terminate,
        destroy,
        post,
        pull
      };
      socket._antena_emitter = emitter;
      socket._antena_receive = receive;
      socket._antena_error = null;
      socket.removeListener("error", cleanup);
      socket.on("error", onerror);
      socket.on("close", onclose);
      callback(null, emitter);
    };
  });
};

////////////
// Helper //
////////////

const convert = (address) => {
  if (typeof address === "number" || /^[0-9]+$/.test(address))
    address = "[::1]:"+address;
  const ipv4 = /^([0-9.]+)\:([0-9]+)$/.exec(address);
  if (ipv4) {
    return {
      domain: PosixSocket.AF_INET,
      posix: {
        sin_family: PosixSocket.AF_INET,
        sin_port: parseInt(ipv4[2]),
        sin_addr: ipv4[1]
      },
      net: {
        port: parseInt(ipv4[2]),
        host: ipv4[1],
        family: 4
      }
    };
  }
  const ipv6 = /^\[([0-9a-fA-F:]+)\]\:([0-9]+)$/.exec(address);
  if (ipv6) {
    return {
      domain: PosixSocket.AF_INET6,
      posix: {
        sin6_family: PosixSocket.AF_INET6,
        sin6_port: parseInt(ipv6[2]),
        sin6_flowinfo: 0,
        sin6_addr: ipv6[1],
        sin6_scope_id: 0
      },
      net: {
        port: parseInt(ipv6[2]),
        host: ipv6[1],
        family: 6
      }
    };
  }
  return {
    domain: PosixSocket.AF_LOCAL,
    posix: {
      sun_family: PosixSocket.AF_LOCAL,
      sun_path: address
    },
    net: {
      path: address
    }
  };
};

const output = (sockfd, message) => {
  if (!sockfd)
    throw new Error("Emitter closed");
  let bytelength = BUFFER.write(message, 4, "utf8") + 4;
  if (bytelength > BUFFER.length - 8) {
    bytelength = Buffer.byteLength(message, "utf8") + 4;
    BUFFER = Buffer.from(new ArrayBuffer(bytelength + 8));
    BUFFER.write(message, 4, "utf8");
  }
  BUFFER.writeUInt32LE(bytelength, 0);
  if (PosixSocket.send(sockfd, BUFFER.buffer, bytelength, 0) < bytelength) {
    throw new Error("Could not send the entire message ("+bytelength+" bytes)");
  }
};

//////////////////////////
// net.Socket Callbacks //
//////////////////////////

function receive (message) {
  this._antena_emitter.onpush(message);
}

function onclose () {
  if (this._antena_error) {
    try { PosixSocket.close(this._antena_emitter._sockfd) } catch (error) {}
  } else {
    this._antena_emitter.onterminate();
    try {
      output(this._sockfd, ".");
      PosixSocket.shutdown(this._sockfd, PosixSocket.SHUT_WR);
      if (PosixSocket.recv(this._sockfd, BUFFER.buffer, 1, 0) !== 0)
        throw new Error("Received some data instead of a FIN packet");
      PosixSocket.close(this._antena_emitter._sockfd);
    } catch (error) {
      this._antena_error = error;
    }
  }
  this._antena_emitter._sockfd = null;
  this._antena_emitter.onclose(this._antena_error);
}

function onerror (error) {
  this._antena_error = this._antena_error || error;
}

////////////////////
// Emitter Method //
////////////////////

const onpush = (message) => {
  throw new Error("Lost push message: "+message);
};

function destroy () {
  if (!this._sockfd)
    return false;
  this._socket.removeAllListeners("error");
  this._socket.removeAllListeners("close");
  this._socket.removeAllListeners("data");
  this._socket.destroy();
  try { PosixSocket.close(this._sockfd) } catch (error) {}
  this._sockfd = null;
  this.onclose(new Error("Emitter destroyed by the user"));
  return true;
}

function terminate () {
  if (!this.writable)
    return false;
  this._socket.end();
  return true;
}

function post (message) {
  output(this._sockfd, "!"+message);
}

function pull (string) {
  output(this._sockfd, "?" + string);
  if (PosixSocket.recv(this._sockfd, BUFFER.buffer, 4, PosixSocket.MSG_WAITALL) < 4)
    throw new Error("Could not recv the head of the pull response (4 bytes)");
  const bytelength = BUFFER.readUInt32LE(0) - 4;
  if (bytelength > BUFFER.byteLength)
    BUFFER = Buffer.from(new ArrayBuffer(bytelength));
  if (PosixSocket.recv(this._sockfd, BUFFER.buffer, bytelength, PosixSocket.MSG_WAITALL) < bytelength)
    throw new Error("Could not recv the body of the pull response ("+bytelength+" bytes)");
  return BUFFER.toString("utf8", 0, bytelength);
}
