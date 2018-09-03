
const Ws = require("ws");
const Split = require("./split.js");

module.exports = function (splitter = "__antena__") {
  const wss = new Ws.Server({noServer:true});
  const onwebsocket = (websocket) => {
    const session = websocket._socket._antena_session;
    if (session in this._connections) {
      if (!Array.isArray(this._connections[session]))
        return websocket.close(1002, "already-connected");
      for (let index = 0; index < this._connections[session].length; index++) {
        websocket.send(this._connections[session][index]);
      }
    }
    this._connections[session] = websocket;
    websocket._antena_push = websocket.send;
    websocket._antena_session = session;
    websocket._antena_receptor = this; 
    websocket.on("close", onclose);
    websocket.on("message", onmessage);
    websocket.on("error", onerror);
  };
  return (request, socket, head, next) => {
    let session = Split(request.url, splitter);
    if (!session)
      return (next && next(), false);
    socket._antena_session = session;
    wss.handleUpgrade(request, socket, head, onwebsocket);
    return true;
  };
};

function onerror (error) {
  error.AntenaSession = this._antena_session;
  this._antena_receptor.onerror(error);
}

function onclose (code, reason) {
  delete this._antena_receptor._connections[this._antena_session];
}

function onmessage (message) {
  this._antena_receptor.onpush(this._antena_session, message);
}
