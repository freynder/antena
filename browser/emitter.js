
module.exports = (options = {}, session = Math.random().toString(36).substring(2)) => {
  if (typeof options === "string")
    options = {splitter:options};
  const secure = options.secure || location.protocol === "https:" ? "s" : "";
  const hostname = options.hostname || location.hostname;
  const port = (options.port||location.port) ? ":" + (options.port||location.port) : "";
  const splitter = options.splitter || "__antena__";
  const client = {
    _request_url: "http"+secure+"://"+hostname+port+"/"+splitter+"/"+session,
    _connect_url: "ws"+secure+"://"+hostname+port+"/"+splitter+"/"+session,
    _websocket: [],
    onmessage: null,
    session,
    send,
    request
  };
  client._websocket.send = Array.prototype.push;
  const websocket = new WebSocket(client._connect_url);
  websocket._antena_client = client;
  websocket.onopen = onopen;
  websocket.onmessage = onmessage;
  return client;
};

function onmessage (event) {
  this._antena_client.onmessage(event.data);
}

function onopen (event) {
  for (let index = 0; index < this._antena_client._websocket.length; index++)
    this.send(this._antena_client._websocket[index]);
  this._antena_client._websocket = this;
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