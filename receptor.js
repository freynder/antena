
const Http = require("http");
const Https = require("https");
const AttachBrowser = require("./browser/attach.js");
const AttachNode = require("./node/attach.js");

module.exports = () => ({_connections: Object.create(null), send, attach});

function send (session, message) {
  if (session in this._connections) {
    this._connections[session]._antena_send(message);
  } else {
    this._connections[session] = [message]
    this._connections[session]._antena_send = Array.prototype.push;
  }
}

function attach (server, splitter) {
  if (server instanceof Http.Server || server instanceof Https.Server) {
    AttachBrowser(this, server, splitter)
  } else {
    AttachNode(this, server);
  }
}
