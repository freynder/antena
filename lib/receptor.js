
const Crypto = require("crypto");

const ConnectionListener = require("./node/connection-listener.js");
const RequestMiddleware = require("./browser/request-middleware.js");
const UpgradeMiddleware = require("./browser/upgrade-middleware.js");

const onpost = (session, message) => {
  throw new Error("Post lost from "+session+": "+message);
};

const onpull = (session, message) => {
  throw new Error("Pull lost from "+session+": "+message);
};

module.exports = () => ({
  _connections: {__proto__:null},
  _sessions: {__proto__:null},
  _messagess: {__proto__:null},
  _callbacks: {__proto__:null},
  _connect: connect,
  _disconnect: disconnect,
  _authentify: authentify,
  _revoke: revoke,
  terminate,
  push,
  onpost,
  onpull,
  ConnectionListener,
  RequestMiddleware,
  UpgradeMiddleware,
});

function authentify (token) {
  return this._sessions[token];
}

function revoke (token) {
  const session = this._sessions[token];
  if (session) {
    this._sessions[token] = undefined;
    if (session in this._callbacks) {
      process.nextTick(this._callbacks[session]);
      delete this._callbacks[session];
    }
  }
  return Boolean(session);
}

function terminate (session, callback) {
  if (session in this._callbacks)
    return callback(new Error("Terminate already pending"));
  if (!this._connections[session])
    return callback(new Error("Connection not found"));
  this._callbacks[session] = callback;
  this._connections[session]._antena_terminate();
}

function connect (session, connection) {
  if (session in this._connections)
    return false;
  for (let token in this._sessions) {
    if (this._sessions[token] === session) {
      this._sessions[token] = undefined;
      if (session in this._callbacks) {
        process.nextTick(this._callbacks[session], new Error("Token revoked by another connection"));
        delete this._callbacks[session];
      }
    }
  }
  let token
  do {
    token = Crypto.randomBytes(6).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  } while (token in this._sessions);
  this._sessions[token] = session;
  this._connections[session] = connection;
  connection._antena_push(token);
  if (session in this._messagess) {
    const messages = this._messagess[session];
    for (let index = 0; index < messages.lenght; index++)
      connection._antena_push(messages[index]);
    delete this._messagess[session];
  }
  return true;
}

function disconnect (session, connection) {
  if (!this._connections[session])
    return false;
  if (this._connections[session] !== connection)
    return false;
  delete this._connections[session];
  return true;
}

function push (session, message) {
  if (session in this._connections) {
    this._connections[session]._antena_push(message);
  } else if (session in this._messagess) {
    this._messagess[session].push(message);
  } else {
    this._messagess[session] = [message];
  }
}
