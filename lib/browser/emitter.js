
const StandalonePromise = require("../standalone-promise.js")

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
    const emitter = StandalonePromise();
    emitter._pending = true;
    emitter._url1 = "http"+secure+"://"+hostname+port+"/"+splitter+"/+"+token;
    emitter._url2 = "http"+secure+"://"+hostname+port+"/"+splitter+"/*"+token;
    emitter._url3 = "http"+secure+"://"+hostname+port+"/"+splitter+"/."+token;
    emitter._websocket = websocket;
    emitter.destroy = destroy;
    emitter.terminate = terminate;
    emitter.pull = pull;
    emitter.post = post;
    emitter.onpush = onpush;
    emitter.onterminate = onterminate;
    websocket._antena_emitter = emitter;
    websocket.onmessage = onmessage;
    websocket.onclose = onclose;
    callback(null, emitter);
  };
};

////////////
// Helper //
////////////

const failure = (emitter, error) => {
  if (emitter._pending) {
    if (emitter._websocket.readyState !== OPEN)
      emitter._websocket.close(1001);
    emitter._pending = false;
    emitter._reject(error);
  }
};

const success = (emitter) => {
  if (emitter._pending) {
    emitter.onterminate();
    if (emitter._pending) {
      const request = new XMLHttpRequest();
      request.open("GET", emitter._url3, false);
      request.setRequestHeader("Cache-Control", "no-cache");
      request.setRequestHeader("User-Agent", "*");
      try {
        request.send();
      } catch (error) {
        return failure(emitter, error);
      }
      if (request.status !== 200)
        return failure(emitter, new Error("HTTP Error: "+request.status+" "+request.statusText));
      emitter._pending = false;
      emitter._resolve(null);  
    }
  }
};

///////////////
// WebSocket //
///////////////

function onmessage ({data}) {
  this._antena_emitter.onpush(data);
}

function onclose ({wasClean, code, reason}) {
  if (wasClean) {
    if (code === 1000) {
      success(this._antena_emitter)
    } else {
      failure(this._antena_emitter, new Error("Abnormal websocket closure: "+code+" "+reason));
    }
  } else {
    failure(this._antena_emitter, new Error("Unclean websocket closure"));
  }
}

//////////////
// Emitter  //
//////////////

const onpush = (message) => {
  throw new Error("Lost a push message: "+message);
};

const onterminate = () => {};

function terminate () {
  if (this._websocket.readyState !== OPEN)
    return false;
  this._websocket.close(1000);
  return true;
}

function destroy () {
  if (!this._url1)
    return false;
  failure(this, new Error("Destroyed by the user"));
  return true;
}

function post (message) {
  if (this._pending) {
    if (this._websocket.readyState === OPEN) {
      this._websocket.send(message);
    } else {
      const request = new XMLHttpRequest();
      request.open("PUT", this._url2, true);
      request.setRequestHeader("User-Agent", "*");
      try {
        request.send(message);
      } catch (error) {
        failure(this, error);
      }
    }
  }
  return this._pending;
}

function pull (message) {
  if (this._pending) {
    const request = new XMLHttpRequest();
    if (message) {
      request.open("PUT", this._url1, false);
    } else {
      request.open("GET", this._url1, false);
      request.setRequestHeader("Cache-Control", "no-cache");
    }
    request.setRequestHeader("User-Agent", "*");
    request.overrideMimeType("text/plain;charset=UTF-8");
    try {
      request.send(message);
    } catch (error) {
      failure(this, error);
      return null;
    }
    if (request.status === 200)
      return request.responseText;
    failure(this, new Error("HTTP Error: "+request.status+" "+request.statusText));
  }
  return null;
}
