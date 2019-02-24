
const Net = require("net");
const PosixSocket = require("posix-socket");
const Messaging = require("./messaging.js");

const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

const signal = (error) => { throw error };

const noop = () => {};

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

let BUFFER, VIEW;

const initialize = (length) => {
  BUFFER = new ArrayBuffer(length);
  VIEW = new DataView(BUFFER);
}

initialize(1024);

const output = (sockfd, message) => {
  const bytelength = 2 * message.length + 4;
  if (bytelength > BUFFER.byteLength)
    initialize(bytelength);
  VIEW.setUint32(0, bytelength, true);
  for (let index = 0, offset = 4, length = message.length; index < length; (index++, offset += 2))
    VIEW.setUint16(offset, message.charCodeAt(index), true);
  PosixSocket.send(sockfd, BUFFER, bytelength, 0);
};

module.exports = (address, session) => {
  address = convert(address);
  const sockfd = PosixSocket.socket(address.domain, PosixSocket.SOCK_STREAM, 0);
  PosixSocket.connect(sockfd, address.posix);
  if (address.domain !== PosixSocket.AF_LOCAL)
    PosixSocket.setsockopt(sockfd, PosixSocket.IPPROTO_TCP, PosixSocket.TCP_NODELAY, 1);
  output(sockfd, "?"+session);
  const socket = Net.connect(address.net);
  const emitter = {
    _sockfd: sockfd,
    _socket: socket,
    readyState: CONNECTING,
    session,
    close,
    send,
    request,
    onopen: noop,
    onmessage: noop,
    onclose: noop
  };
  Messaging(socket);
  socket._antena_emitter = emitter;
  socket._antena_receive = receive;
  socket.on("connect", onconnect);
  socket.on("error", onerror);
  socket.on("end", onend);
  socket.on("close", onclose);
  return emitter;
};

function onconnect () {
  this._antena_send("!"+this._antena_emitter.session);
  this._antena_emitter.readyState = OPEN;
  this._antena_emitter.onopen({
    type: "open",
    target: this._antena_emitter
  });
}

function onerror (error) {
  this.removeAllListeners("error");
  this.destroy();
  if (this._antena_emitter.readyState !== CLOSED) {
    this._antena_emitter.readyState = CLOSED;
    this._antena_emitter.onclose({
      type: "close",
      target: this._antena_emitter,
      wasClean: false,
      code: error.errno,
      reason: error.message
    });
  }
}

function onend () {
  const state = this._antena_emitter.readyState;
  if (state !== CLOSED) {
    this._antena_emitter.readyState = CLOSED;
    if (state === CLOSING) {
      this._antena_emitter.onclose({
        type: "close",
        target: this._antena_emitter,
        wasClean: true,
        code: 1000,
        reason: "Normal Closure"
      });
    } else {
      this._antena_emitter.onclose({
        type: "close",
        target: this._antena_emitter,
        wasClean: false,
        code: 1001,
        reason: "Going Away"
      });
    }
  }
};

function onclose () {
  if (this._antena_emitter.readyState !== CLOSED) {
    throw new Error("This should never happen: either the connection is closed cleanly with end or it had an error");
  }
}

function receive (string) {
  this._antena_emitter.onmessage({
    type: "message",
    target: this._antena_emitter,
    data: string
  });
}

function close () {
  if (this.readyState !== CLOSING && this.readyState !== CLOSED) {
    this.readyState = CLOSING;
    this._socket.end();
    setTimeout(() => {
      if (this.readyState !== CLOSED) {
        this._socket.destroy();
        this.readyState === CLOSED;
        this.onclose({
          type: "close",
          target: this,
          wasClean: false,
          code: 1002,
          reason: "Closing handshake timeout"
        });
      }
    }, 30 * 1000);
  }
}

function send (string) {
  if (this.readyState !== OPEN)
    throw new Error("InvalidStateError: the connection is not open");
  this._socket._antena_send(string);
}

function request (string) {
  output(this._sockfd, string);
  PosixSocket.recv(this._sockfd, BUFFER, 4, PosixSocket.MSG_WAITALL);
  const bytelength = VIEW.getUint32(0, true) - 4;
  if (bytelength > BUFFER.byteLength)
    initialize(bytelength);
  PosixSocket.recv(this._sockfd, BUFFER, bytelength, PosixSocket.MSG_WAITALL);
  return Buffer.from(BUFFER, 0, bytelength).toString("utf16le");
}
