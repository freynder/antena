
const ConnectionListener = require("./node/connection-listener.js");
const RequestMiddleware = require("./browser/request-middleware.js");
const UpgradeMiddleware = require("./browser/upgrade-middleware.js");

module.exports = () => ({
  _connections: Object.create(null),
  push,
  ConnectionListener,
  RequestMiddleware,
  UpgradeMiddleware,
});

function push (session, message) {
  if (session in this._connections) {
    this._connections[session]._antena_push(message);
  } else {
    this._connections[session] = [message]
    this._connections[session]._antena_push = Array.prototype.push;
  }
}
