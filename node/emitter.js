
const Net = require("net");
const PosixSocket = require("posix-socket");
const Messaging = require("./messaging.js");

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
    session: session,
    close: close,
    send: send,
    request: request,
    onopen: noop,
    onpush: noop,
    onerror: signal,
    onclose: noop
  };
  Messaging(socket);
  socket._antena_emitter = emitter;
  socket._antena_receive = receive;
  socket.once("connect", onconnect);
  socket.on("error", onerror);
  socket.on("close", onclose);
  return emitter;
};

function onconnect () {
  this._antena_send("!"+this._antena_emitter.session);
  this._antena_emitter.onopen();
}

function onerror (error) {
  this._antena_emitter.onerror(error);
}

function onclose () {
  this._antena_emitter.onclose();
}

function receive (string) {
  this._antena_emitter.onmessage({data:string});
}

function close () {
  this._socket.end();
}

function send (string) {
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
