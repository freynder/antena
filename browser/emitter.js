
module.exports = (options = {}, session = Math.random().toString(36).substring(2)) => {
  const secure = options.secure || location.protocol === "https:" ? "s" : "";
  const hostname = options.hostname || location.hostname;
  const port = options.port ? ":" + options.port : ""
  const splitter = options.splitter || "_";
  const emitter = {
    _request_url: "http"+secure+"://"+hostname+port+"/"+splitter+"/"+session,
    _connect_url: "ws"+secure+"://"+hostname+port+"/"+splitter+"/"+session,
    _websocket: [],
    onmessage: null,
    session,
    send,
    request
  };
  emitter._websocket.send = Array.prototype.push;
  const websocket = new WebSocket(emitter._connect_url);
  websocket._antena_emitter = emitter;
  websocket.onopen = onopen;
  websocket.onmessage = onmessage;
  return emitter;
};

function onmessage (event) {
  this._antena_emitter.onmessage(event.data);
}

function onopen (event) {
  for (let index = 0; index < this._antena_emitter._websocket.length; index++)
    this.send(this._antena_emitter._websocket[index]);
  this._antena_emitter._websocket = this;
}

function send (message) {
  this._websocket.send(message);
}

function request (query) {
  const request = new XMLHttpRequest();
  request.open("PUT", this._request_url, false);
  request.send(query);
  if (request.status !== 200)
    throw new Error("Unexpected HTTP status code: "+request.status);
  return request.responseText;
}
