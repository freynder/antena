
const ConnectionListener = require("./node/connection-listener.js");
const RequestMiddleware = require("./browser/request-middleware.js");
const UpgradeMiddleware = require("./browser/upgrade-middleware.js");

const onmessage = (origin, message) => {
  throw new Error(`Message lost from ${origin}: ${message}`);
};
 
const onerror = (origin, error) => {
  error.message = `${origin} >> ${error.message}`;
  throw error;
};

const onrequest = (origin, request) => {
  throw new Error(`Request lost from ${origin}: ${request}`);
};

module.exports = () => ({
  _connections: {__proto__:null},
  send,
  onerror,
  onmessage,
  onrequest,
  ConnectionListener,
  RequestMiddleware,
  UpgradeMiddleware,
});

function send (session, message) {
  if (session in this._connections) {
    this._connections[session]._antena_send(message);
  } else {
    this._connections[session] = [message];
    this._connections[session]._antena_send = Array.prototype.push;
  }
}
