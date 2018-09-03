
const signal = (error) => {
  throw error;
};

module.exports = (options = {}, session = Math.random().toString(36).substring(2)) => {
  if (typeof options === "string")
    options = {splitter:options};
  const secure = options.secure || location.protocol === "https:" ? "s" : "";
  const hostname = options.hostname || location.hostname;
  const port = (options.port||location.port) ? ":" + (options.port||location.port) : "";
  const splitter = options.splitter || "__antena__";
  const emitter = {
    _websocket: {
      _url: "http"+secure+"://"+hostname+port+"/"+splitter+"/-"+session,
      send
    },
    _url: "http"+secure+"://"+hostname+port+"/"+splitter+"/~"+session,
    onerror: signal,
    onpull: null,
    session,
    pull,
    push
  };
  const websocket = new WebSocket("ws"+secure+"://"+hostname+port+"/"+splitter+"/"+session);
  websocket.onopen = onopen;
  websocket.onerror = onerror;
  websocket.onmessage = onmessage;
  websocket.onclose = onclose;
  websocket._antena_emitter = emitter;
  return emitter;
};

function onopen (event) {
  this._antena_emitter._websocket = this;
}

function onmessage (event) {
  this._antena_emitter.onpush(event.data);
}

function onerror (event) {
  this._antena_emitter.onerror(event);
}

function onclose (event) {
  this._antena_emitter.onerror(new Error("WebSocket connection closed: "+event.code+" ("+event.reason+")"));
}

function send (message) {
  const request = new XMLHttpRequest();
  request.open("PUT", this._url);
  request.send(message);
}

function push (message) {
  this._websocket.send(message);
}

function pull (query) {
  const request = new XMLHttpRequest();
  request.open("PUT", this._url, false);
  request.send(query);
  if (request.status !== 200)
    throw new Error("Unexpected HTTP status code: "+request.status);
  return request.responseText;
}
