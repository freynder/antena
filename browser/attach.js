
const Ws = require("ws");

const sessionof = (url, splitter) => {
  if (url.startsWith("http://")) {
    url = url.substring(url.indexOf("/", 7));
  }
  if (url.startsWith("/") && url.indexOf(splitter) === 1) {
    return url.substring(splitter.length + 2);
  }
};

const listenerof = (listeners) => {
  if (listeners.length === 0)
    return noop;
  if (listeners.length === 1)
    return listeners[0];
  const length = listeners.length;
  return function () {
    for (let index = 0; index < length; index++) {
      listeners[index].apply(this, arguments);
    }
  }
};

const noop = () => {};

function onerror (error) {
  error.AntenaSession = this._antena_session;
  this._antena_receptor.onerror(error);
}

function onclose (code, reason) {
  delete this._antena_receptor._connections[this._antena_session];
}

function onmessage (message) {
  this._antena_receptor.onmessage(this._antena_session, message);
}

function onrequest (request, response) {
  let session = sessionof(request.url, this._antena_splitter);
  if (session) {
    if (request.headers["content-length"] === 0) {
      this._antena_receptor.onrequest(session, "", (body) => { response.end(body) });
    } else {
      let body = "";
      request.on("data", (data) => { body += data });
      request.on("end", () => {
        this._antena_receptor.onrequest(session, body, (body) => { response.end(body) });
      });
    }
  } else {
    this._antena_request_listener(request, response);
  }
}

function onupgrade (request, socket, head) {
  let session = sessionof(request.url, this._antena_splitter);
  if (session) {
    this._antena_ws_server.handleUpgrade(request, socket, head, (websocket) => {
      if (session in this._antena_receptor._connections) {
        if (!Array.isArray(this._antena_receptor._connections[session]))
          return websocket.close(1002, "already-connected");
        for (let index = 0; index < this._antena_receptor._connections[session].length; index++) {
          websocket.send(this._antena_receptor._connections[session][index]);
        }
      }
      this._antena_receptor._connections[session] = websocket;
      websocket._antena_send = websocket.send;
      websocket._antena_session = session;
      websocket._antena_receptor = this._antena_receptor; 
      websocket.on("close", onclose);
      websocket.on("message", onmessage);
      websocket.on("error", onerror);
    });
  } else {
    this._antena_uprade_listener(request, socket, head);
  }
}

module.exports = (receptor, server, splitter = "__antena__") => {
  server._antena_ws_server = new Ws.Server({noServer:true});
  server._antena_receptor = receptor;
  server._antena_splitter = splitter;
  server._antena_request_listener = listenerof(server.listeners("request"));
  server._antena_upgrade_listener = listenerof(server.listeners("upgrade"));
  server.removeAllListeners("request");
  server.removeAllListeners("upgrade");
  server.on("request", onrequest);
  server.on("upgrade", onupgrade);
  return receptor;
};
