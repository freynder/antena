
const Ws = require("ws");
const Split = require("./split.js");

module.exports = function (splitter = "__antena__") {
  const wss = new Ws.Server({noServer:true});
  return (request, socket, head, next) => {
    const session = Split(request.url, splitter);
    if (session) {
      wss.handleUpgrade(request, socket, head, (websocket) => {
        websocket._antena_push = push;
        websocket._antena_session = session;
        websocket._antena_receptor = this;
        if (this._connect(session, websocket)) {
          websocket.on("close", onclose);
          websocket.on("message", onmessage);
        } else {
          websocket.close(1002, "Already Connected");
          this.onerror(session, new Error("Websocket already connected"));
        }
      });
    } else if (next) {
      next();
    }
    return Boolean(session);
  };
};

function push (message) {
  this.send(message);
}

function onclose (code, reason) {
  this._antena_receptor._disconnect(this._antena_session, this);
}

function onmessage (message) {
  this._antena_receptor.onpost(this._antena_session, message);
}
