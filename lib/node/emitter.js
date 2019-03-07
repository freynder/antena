
const Net = require("net");
const PosixSocket = require("posix-socket");
const Messaging = require("./messaging.js");
const StandalonePromise = require("../standalone-promise.js")

let BUFFER = Buffer.from(new ArrayBuffer(1024));

const noop = () => {};

module.exports = (address, session, callback) => {
  address = convert(address);
  let sockfd;
  const socket = Net.connect(address.net);
  const cleanup = (error) => {
    if (callback) {
      if (error === false)
        error = new Error("Could not receive token before closure");
      socket.destroy();
      if (sockfd) {
        try {
          PosixSocket.close(sockfd);
        } catch (e) {
          error = new Error(error.message + " AND " + e.message);
        }
      }
      process.nextTick(callback, error);
      callback = null;
    }
  };
  socket.once("error", cleanup);
  socket.once("close", cleanup);
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
      const emitter = StandalonePromise();
      emitter._sockfd = sockfd;
      emitter._socket = socket;
      emitter.onpush = onpush;
      emitter.onterminate = onterminate;
      emitter.session = session;
      emitter.destroy = destroy;
      emitter.terminate = terminate;
      emitter.post = post;
      emitter.pull = pull;
      socket.removeListener("error", cleanup);
      socket.removeListener("close", cleanup);
      socket._antena_emitter = emitter;
      socket._antena_receive = receive;
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

const success = (emitter) => {
  if (emitter._pending) {
    emitter.onterminate();
    if (emitter._pending) {
      try {
        output(emitter._sockfd, ".");
        PosixSocket.shutdown(emitter._sockfd, PosixSocket.SHUT_WR);
        if (PosixSocket.recv(emitter._sockfd, BUFFER.buffer, 1, 0) !== 0) {
          throw new Error("Received some data instead of a FIN packet");
        }
      } catch (error) {
        return failure(emitter, error);
      }
      try {
        PosixSocket.close(emitter._sockfd);
      } catch (error) {
        emitter._sockfd = null;
        return failure(emitter, error);
      }
      emitter._pending = false;
      emitter._resolve(null);
    }
  }
};

const failure = (emitter, error) => {
  if (emitter.pending) {
    if (emitter._sockfd) {
      try {
        PosixSocket.close(emitter._sockfd);
      } catch (caught) {
        error = new Error(error.message + " AND " + caught.message);
      }
    }
    if (!emitter._socket.destroyed)
      emitter._socket.destroy();
    emitter._pending = false;
    emitter._reject(error);
  }
};

////////////////
// net.Socket //
////////////////

function receive (message) {
  this._antena_emitter.onpush(message);
}

function onerror (error) {
  failure(this._antena_emitter, error);
}

function onclose () {
  success(this._antena_emitter);
}

/////////////
// Emitter //
/////////////

const onpush = (message) => {
  throw new Error("Lost push message: "+message);
};

const onterminate = () => {};

function destroy () {
  if (!this._pending)
    return false;
  failure(this, new Error("Destroyed by the user"));
  return true;
}

function terminate () {
  if (!this._socket.writable)
    return false;
  this._socket.end();
  return true;
}

function post (message) {
  if (this._pending) {
    try {
      output(this._sockfd, "!"+message);
    } catch (error) {
      failure(this, error);
    }
  }
  return this._pending;
}

function pull (string) {
  if (this._pending) {
    try {
      output(this._sockfd, "?" + string);
      if (PosixSocket.recv(this._sockfd, BUFFER.buffer, 4, PosixSocket.MSG_WAITALL) < 4)
        throw new Error("Could not recv the head of the pull response (4 bytes)");
      const bytelength = BUFFER.readUInt32LE(0) - 4;
      if (bytelength > BUFFER.byteLength)
        BUFFER = Buffer.from(new ArrayBuffer(bytelength));
      if (PosixSocket.recv(this._sockfd, BUFFER.buffer, bytelength, PosixSocket.MSG_WAITALL) < bytelength)
        throw new Error("Could not recv the body of the pull response ("+bytelength+" bytes)");
      return BUFFER.toString("utf8", 0, bytelength);
    } catch (error) {
      failure(this, error);
    }
  }
  return null;
}
