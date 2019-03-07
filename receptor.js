
const Crypto = require("crypto");

const ConnectionListener = require("./node/connection-listener.js");
const RequestMiddleware = require("./browser/request-middleware.js");
const UpgradeMiddleware = require("./browser/upgrade-middleware.js");

const onpost = (session, message) => {
  throw new Error("Post lost from "+session+": "+message);
};
 
const onerror = (session, error) => {
  error.message = session+" >> "+error.message;
  throw error;
};

const onpull = (session, message) => {
  throw new Error("Pull lost from "+origin+": "+pull);
};

module.exports = () => ({
  _connections: {__proto__:null},
  _tokens: {__proto__:null},
  _messagess: {__proto__:null},
  _callbacks: {__proto__:null},
  _connect: connect,
  _disconnect: disconnect,
  _authentify: authentify,
  _revoke: revoke,
  destroy,
  push,
  onerror,
  onpost,
  onpull,
  ConnectionListener,
  RequestMiddleware,
  UpgradeMiddleware,
});

function authentify (session, token) {
  return this._tokens[session] === token;
}

function revoke (session, token) {
  if (this._tokens[session] !== token)
    return false;
  delete this._tokens[session];
  if (session in this._callbacks) {
    process.nextTick(this._callbacks[session]);
    delete this._callbacks[session];
  }
}

function dismiss (session, callback) {
  if (session in this._callbacks)
    return callback(new Error("Dismiss already pending"));
  if (session in this._connections)
    this._connections[session]._antena_dimiss();
  if (session in this._tokens)
    this._callbacks[session] = callback;
  return true;
}

function connect (session, connection) {
  if (session in this._connections)
    return false;
  if (session in this._tokens) {
    delete this._tokens[session];
    if (session in this._callbacks) {
      process.nextTick(this._callbacks[session]);
      delete this._callbacks[session];
    }
  }
  let token
  do {
    token = Crypto.randomBytes(6).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  } while (token in this._sessions)
  this._tokens[session] = token;
  this._connections[session] = connection;
  connection.push(token);
  if (session in this._messagess) {
    const messages = this._messagess[session];
    for (let index = 0; index < messages.lenght; index++)
      connection.push(messages[index]);
    delete this._messagess[session];
  }
  return true;
}

function disconnect (session) {
  delete this._connections[session];
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
