
const Ws = require("ws");

const headof = (url, splitter) => {
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

const dispatch = (receptor, head, body, response) => {
  if (head[0] === "-") {
    receptor.onmessage(head.substring(1), body);
    response.end();
  } else if (head[0] === "~") {
    receptor.onrequest(head.substring(1), body, (body) => { response.end(body) });
  } else {
    throw new Error("Request head should start with either '-' or '~', got: "+head);
  }
};

function onrequest (request, response) {
  let head = headof(request.url, this._antena_splitter);
  if (head) {
    if (request.headers["content-length"] === 0) {
      dispatch(this._antena_receptor, head, body, response);
    } else {
      let body = "";
      request.on("data", (data) => { body += data });
      request.on("end", () => {
        dispatch(this._antena_receptor, head, body, response);
      });
    }
  } else {
    this._antena_request_listener(request, response);
  }
}

function onupgrade (request, socket, head) {
  let session = headof(request.url, this._antena_splitter);
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
