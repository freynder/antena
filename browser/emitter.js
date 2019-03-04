
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
    websocket.onclose = onclose;
    websocket.onmessage = onmessage;
    websocket._url = "http"+secure+"://"+hostname+port+"/"+splitter+"/"+token;
    websocket._termcb = null;
    websocket.session = session;
    websocket.terminate = terminate;
    websocket.destroy = destroy;
    websocket.onpush = onpush;
    websocket.onclose = onclose;
    websocket.pull = pull;
    websocket.post = WebSocket.prototype.send;
    callback(null, websocket);
  };
};

//////////////////////////
// WebSocket Listerners //
//////////////////////////

function onmessage ({data}) {
  this.onpush(data);
}

const onpush = (message) => {
  throw new Error("Lost a push message: "+message);
};

function onclose (event) {
  if (this._termcb) {
    const callback = this._termcb;
    this._termcb = null;
    if (event.wasClean) {
      if (event.code === 1000) {
        this._url = null;
        callback(null);
      } else {
        callback(new Error("Abnormal websocket closure: "+event.code+" "+event.reason));
      }
    } else {
      callback(new Error("Unclean websocket closure"));
    }
  }
}

////////////////////
// Emitter Method //
////////////////////

function terminate (callback) {
  if (this._termcb)
    return callback(new Error("Terminate is already pending"));
  if (!this._url)
    return callback(new Error("Emitter already terminated/destroyed"));
  this.close(1000, "Normal Closure");
  this._termcb = callback;
}

function destroy () {
  if (!this._url)
    return false;
  this.onmessage = null;
  this.onclose = null;
  this._url = null;
  if (this.readyState !== CLOSING)
    this.close(1001, "Destroyed");
  if (this._termcb) {
    const callback = this._termcb;
    this._termcb = null;
    callback(new Error("Emitter destroyed by the user"));
  }
  return true;
}

function pull (message) {
  if (!this._url)
    throw new Error("Emitter terminated/destroyed");
  const request = new XMLHttpRequest();
  if (message) {
    request.open("PUT", this._url, false);
  } else {
    request.open("GET", this._url, false);
    request.setRequestHeader("Cache-Control", "no-cache");
  }
  request.setRequestHeader("User-Agent", "*");
  request.overrideMimeType("text/plain;charset=UTF-8");
  request.send(message);
  if (request.status !== 200)
    throw new Error(request.status+" "+request.statusText);
  return request.responseText;
}
