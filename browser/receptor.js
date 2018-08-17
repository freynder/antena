
const Ws = require("ws");

module.exports = (server, splitter = "_") => {

  const receptor = {
    onrequest: null,
    onmessage: null,
    send: (session, message) => {
      if (session in connections) {
        if (Array.isArray(connections[session])) {
          connections[session].push(message);
        } else {
          connections[session].send(message);
        }
      } else {
        connections[session] = [message];
      }
    }
  };

  const connections = Object.create(null);

  const ws_server = new Ws.Server({noServer:true});

  const onwebsocket = (websocket) => {
    const session = websocket.upgradeRequest._antena_session;
    if (_session in connections) {
      if (!Array.isArray(connections[session]))
        return websocket.close(1002, "already-connected");
      for (let index = 0; index < connections[session].length; index++)
        websocket.send(connections[session][index]);
    }
    connections[session] = websocket;
    websocket.on("close", onclose);
    websocket.on("message", onmessage);
  };

  function onclose (code, reason) {
    delete connections[this._antena_session];
  }

  function onmessage (message) {
    options.receptor.onmessage(this._antena_session, message);
  }

  server.on("request", (request, response) => {
    const parts = /\/([^/]*)\/([^/]*)$/.exec(request.url);
    if (parts && parts[1] === splitter) {
      const session = parts[2];
      if (request.headers["content-length"] === 0) {
        options.receptor.onrequest(session, "", (body) => { response.end(body) });
      } else {
        const body = "";
        request.on("data", (data) => { body += data });
        request.on("end", () => {
          options.receptor.onrequest(session, body, (body) => { response.end(body) });
        });
      }
    }
  });

  server.on("upgrade", (request, socket, head) => {
    const parts = /\/([^/]*)\/([^/]*)$/.exec(request.url);
    if (parts && parts[1] === splitter) {
      request._antena_session = parts[2];
      ws_server.handleUpgrade(request, socket, head, onwebsocket);
    }
  });

  return receptor;

};
