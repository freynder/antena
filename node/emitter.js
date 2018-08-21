
const Net = require("net");
const PosixSocket = require("posix-socket");
const Messaging = require("./messaging.js");

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

let BUFFER, HEAD_VIEW, BODY_VIEW;

const initialize = (length) => {
  BUFFER = new ArrayBuffer(1024);
  HEAD_VIEW = new Uint32Array(BUFFER, 0, 1);
  BODY_VIEW = new Uint16Array(BUFFER, 4);
}

initialize(1024);

const output = (sockfd, message) => {
  const length = 2 * message.length + 4;
  if (length > BUFFER.length)
    initialize(length);
  HEAD_VIEW[0] = length;
  for (let index = 0, length = message.length; index < length; index++)
    BODY_VIEW[index] = message.charCodeAt(index);
  PosixSocket.send(sockfd, BUFFER, length, 0);
};

module.exports = (address, session) => {
  HEAD_VIEW[0] = 1;
  if ((new Uint8Array(BUFFER))[0] !== 1)
    throw new Error("Big endian systems are not supported");
  address = convert(address);
  const emitter = {
    _sockfd: PosixSocket.socket(address.domain, PosixSocket.SOCK_STREAM, 0),
    _socket: Net.connect(address.net),
    session: session,
    onmessage: null,
    send,
    request
  };
  PosixSocket.connect(emitter._sockfd, address.posix);
  if (address.domain !== PosixSocket.AF_LOCAL)
    PosixSocket.setsockopt(emitter._sockfd, PosixSocket.IPPROTO_TCP, PosixSocket.TCP_NODELAY, 1);
  output(emitter._sockfd, "@"+session);
  const buffer = Buffer.allocUnsafe(Buffer.byteLength(session)+5);
  emitter._socket._antena_emitter = emitter;
  emitter._socket.on("error", onerror);
  Messaging.initialize(emitter._socket);
  Messaging.input(emitter._socket, onmessage);
  Messaging.output(emitter._socket, "#"+session);
  return emitter;
};

function onmessage (string) {
  this._antena_emitter.onmessage(string);
}

function onerror (error) {
  if ("onerror" in this._antena_emitter) {
    this._antena_emitter.onerror(error);
  } else {
    throw error;
  }
}

function send (string) {
  output(this._sockfd, "!"+string);
}

function request (string) {
  output(this._sockfd, "?"+string);
  PosixSocket.recv(this._sockfd, BUFFER, 4, PosixSocket.MSG_WAITALL);
  const length = HEAD_VIEW[0];
  if (length - 4 > BUFFER.length)
    initialize(length + 4);
  PosixSocket.recv(this._sockfd, BUFFER, length - 4, PosixSocket.MSG_WAITALL);
  return String.fromCharCode.apply(null, new Uint16Array(BUFFER, 0, length));
}
