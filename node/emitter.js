
const PosixSocket = require("posix-socket");
const Net = require("net");
const Messaging = require("./messaging.js");

const convert = (address) => {
  if (parseInt(address) === parseInt(address))
    address = "127.0.0.1:"+address;
  if (address.startsWith("localhost"))
    address = "127.0.0.1"+address.substring("localhost".length);
  const parts = address.split(":");
  parts[1] = parseInt(parts[1]);
  if (Net.isIPv4(parts[0]) && parts[1] === parts[1]) {
    return {
      domain: PosixSocket.AF_INET,
      sin_family: PosixSocket.AF_INET,
      sin_port: parts[1],
      sin_address: parts[0]
    };
  }
  if (Net.isIPv6(parts[0]) && parts[1] === parts[1]) {
    return {
      domain: PosixSocket.AF_INET6,
      sin6_family: PosixSocket.AF_INET6,
      sin6_port: parts[1],
      sin6_flowinfo: 0,
      sin6_address: parts[0],
      sin6_scope_id: 0
    };
  }
  return {
    domain: PosixSocket.AF_LOCAL,
    sun_family: PosixSocket.AF_LOCAL,
    sun_path: address
  }
};

const BUFFER = new ArrayBuffer(1024);
const HEAD_VIEW = new Uint32Array(BUFFER, 0, 1);
const BODY_VIEW = new Uint16Array(BUFFER, 4);

const output = (sockfd, message) => {
  if (message.length > BODY_VIEW.length) {
    BUFFER = new ArrayBuffer(2 * message.length + 4);
    HEAD_VIEW = new Uint32Array(BUFFER, 0, 1);
    BODY_VIEW = new Uint16Array(BUFFER, 4);
  }
  HEAD_VIEW[0] = message.length;
  for (let index = 0, length = message.length; index < length; index++)
    BODY_VIEW[index] = message.charCodeAt(index);
  
};

module.exports = (address, session) => {
  const paddress = convert(address);
  const emitter = {
    _sockfd: PosixSocket.socket(paddress.domain, PosixSocket.SOCK_STREAM, 0),
    _socket: Net.connect(address),
    onmessage: null,
    send,
    request
  };
  PosixSocket.connect(emitter._sockfd, paddress);
  if (paddress.domain !== PosixSocket.AF_LOCAL) {
    PosixSocket.setsockopt(emitter._sockfd, PosixSocket.IPPROTO_TCP, PosixSocket.TCP_NODELAY, 1);
    emitter._socket.setNoDelay(true);
  }
  const buffer = Buffer.allocUnsafe(Buffer.byteLength(session)+5);
  buffer.writeUInt32BE(buffer.length-4);
  buffer.write("?"+session, 4, buffer.length-4, "utf8");
  PosixSocket.send(emitter._sockfd, buffer.buffer, buffer.length, 0);
  console.log("init", buffer, JSON.stringify(buffer.toString("utf8")), Buffer.from(buffer.buffer).slice(0, buffer.length));
  emitter._socket._antena_emitter = emitter;
  // Messaging.initialize(emitter._socket);
  // Messaging.input(emitter._socket, onmessage);
  // Messaging.output(emitter._socket, "_"+session);
  return emitter;
};

function onmessage (string) {
  this._antena_emitter.onmessage(string);
}

function send (string) {
  Messaging.output(this._socket, string);
}

function request (string) {
  let length1 = BUFFER.write(string, 4);
  if (length1 > BUFFER.length - 64) {
    BUFFER = Buffer.allocUnsafe(Buffer.byteLength(string, "utf8") + 128);
    length1 = BUFFER.write(string, 4);
  }
  BUFFER.writeUInt32BE(length1);
  PosixSocket.send(this._sockfd, BUFFER.buffer, length1+4, 0);
  console.log("request", string, BUFFER.slice(0, length1 + 4));
  PosixSocket.recv(this._sockfd, BUFFER.buffer, 4, PosixSocket.MSG_WAITALL);
  console.log("recv-length", BUFFER.slice(0, 4));
  const length2 = BUFFER.readUInt32BE(0);
  if (length2 > BUFFER.length)
    BUFFER = Buffer.allocUnsafe(length2);
  PosixSocket.recv(this._sockfd, BUFFER.buffer, length2, PosixSocket.MSG_WAITALL);
  console.log("recv-body", BUFFER.slice(0, length2));
  return BUFFER.toString("utf8", 0, length2);
}
