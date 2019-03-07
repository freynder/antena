
const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

module.exports = (options = {}, session, callback) => {
  if (typeof options === "string")
    options = {splitter:options};
  const secure = options.secure || location.protocol === "https:" ? "s" : "";
  const hostname = options.hostname || location.hostname;
  const port = (options.port||location.port) ? ":" + (options.port||location.port) : "";
  const splitter = options.splitter || "__antena__";
  const websocket = new WebSocket("ws"+secure+"://"+hostname+port+"/"+splitter+"/"+session);
  websocket.onclose = (event) => {
    callback(new Error("Websocket closed: "+event.code+" "+event.reason));
  };
  websocket.onmessage = ({data:token}) => {
    const emitter = {
      _websocket: websocket,
      _url1: "http"+secure+"://"+hostname+port+"/"+splitter+"/"+token,
      _url2: null,
      destroy,
      terminate,
      post,
      pull,
      onterminate,
      onfinish,
      onpush,
    };
    websocket._antena_emitter = emitter;
    websocket.onclose = onclose;
    websocket.onmessage = onmessage;
    callback(null, websocket);
  };
};

///////////////
// WebSocket //
///////////////

function onmessage ({data}) {
  this._antena_emitter.onpush(data);
}

function onclose (event) {
  const error = null;
  if (!event.wasClean) {
    error = new Error("Unclean websocket closure");
  } else if (event.code !== 1000) {
    new Error("Abnormal websocket closure: "+event.code+" "+event.reason)
  }
  if (!error) {
    if (!this._antena_emitter._url2)
      this._antena_emitter._url2 = this._antena_emitter._url1 + ".";
    this._antena_emitter.onterminate();
  }
  this._antena_emitter._url1 = null;
  this._antena_emitter.onfinish(error);
}

////////////////////
// Emitter Method //
////////////////////

const onpush = (message) => {
  throw new Error("Lost a push message: "+message);
};

const onfinish = (error) => {
  if (error) {
    throw error
  }
}

const onterminate = () => {};

function post (message) {
  if (!this._url1)
    throw new Error("Emitter closed");
  if (!this._url2)
    return this._websocket.send(message);
  const request = new XMLHttpRequest();
  if (message) {
    request.open("PUT", this._url2, true);
  } else {
    request.open("GET", this._url2, true);
    request.setRequestHeader("Cache-Control", "no-cache");
  }
  request.setRequestHeader("User-Agent", "*");
  request.send(message);
}

function terminate () {
  if (this._websocket.readyState !== OPEN)
    return false;
  this._url2 = this._url1 + ".";
  this._websocket.close(1000, "Client-side closure");
  return true;
}

function destroy () {
  if (!this._url1)
    return false;
  this._websocket.onmessage = null;
  this._websocket.onclose = null;
  this._url1 = null;
  if (this._websocket.readyState !== CLOSING)
    this._websocket.close(1001, "Destroyed");
  this.onfinish(new Error("Destroyed by the user"));
  return true;
}

function pull (message) {
  if (!this._url1)
    throw new Error("Emitter closed");
  const request = new XMLHttpRequest();
  if (message) {
    request.open("PUT", this._url1, false);
  } else {
    request.open("GET", this._url1, false);
    request.setRequestHeader("Cache-Control", "no-cache");
  }
  request.setRequestHeader("User-Agent", "*");
  request.overrideMimeType("text/plain;charset=UTF-8");
  request.send(message);
  if (request.status !== 200)
    throw new Error("HTTP Error: "+request.status+" "+request.statusText);
  return request.responseText;
}
