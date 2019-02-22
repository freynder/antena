
const Ws = require("ws");
const Split = require("./split.js");

module.exports = function (splitter = "__antena__") {
  const wss = new Ws.Server({noServer:true});
  return (request, socket, head, next) => {
    let session = Split(request.url, splitter);
    if (!session)
      return (next && next(), false);
    wss.handleUpgrade(request, socket, head, (websocket) => {
      if (session in this._connections) {
        if (!Array.isArray(this._connections[session]))
          return websocket.close(1002, "already-connected");
        for (let index = 0; index < this._connections[session].length; index++) {
          websocket.send(this._connections[session][index]);
        }
      }
      this._connections[session] = websocket;
      websocket._antena_send = websocket.send;
      websocket._antena_session = session;
      websocket._antena_receptor = this;
      websocket.on("close", onclose);
      websocket.on("message", onmessage);
      websocket.on("error", onerror);
    });
    return true;
  };
};

function onerror (error) {
  this._antena_receptor.onerror(this._antena_session, error);
}

function onclose (code, reason) {
  delete this._antena_receptor._connections[this._antena_session];
}

function onmessage (message) {
  this._antena_receptor.onmessage(this._antena_session, message);
}
