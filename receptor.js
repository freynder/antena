
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
  _sessions: {__proto__:null},
  _messagess: {__proto__:null},
  _connect: connect,
  _disconnect: disconnect,
  push,
  onerror,
  onpost,
  onpull,
  ConnectionListener,
  RequestMiddleware,
  UpgradeMiddleware,
});

function sessionof (token) {
  return this._sessions[token];
}

function connect (session, connection) {
  if (session in this._connections)
    return false;
  let token;
  do {
    token = Crypto.randomBytes(6).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  } while (token in this._sessions)
  this._sessions[token] = session;
  this._connections[session] = connection;
  connection.push(token);
  if (session in this._messagess) {
    const messages = this._messagess[session];
    for (let index = 0; index < messages.lenght; index++)
      connection.push(messages[index]);
    delete this._messagess[session];
  }
  return true;
};

function disconnect (session) {
  delete this._connections[session];
  for (let token in this._sessions) {
    if (this._sessions[token] === session) {
      return delete this._sessions[token];
    }
  }
}

function push (session, message) {
  if (session in this._connections) {
    this._connections[session].push(message);
  } else if (session in this._messagess) {
    this._messagess[session].push(message);
  } else {
    this._messagess[session] = [message];
  }
}
