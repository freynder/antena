
var WorkerSocketPool = require("../util/worker-socket-pool.js");
var Factory = require("./factory.js");

function request (method, path, headers, body, callback) {
  method = method || "GET";
  path = path || "";
  headers = headers || {};
  body = body || "";
  var copy = {};
  for (var key in headers)
    copy[key] = ""+headers[key];
  if (!callback) {
    this._views.lock[0] = 1;
    global.postMessage({
      name: "sync",
      method: method,
      path: this._prefix+path,
      headers: copy,
      body: body
    });
    while (this._views.lock[0]);
    if (this._views.length[0] > this._views.data.length)
      return [new Error("Response too long for "+method+" "+path)];
    var data = JSON.parse(String.fromCharCode.apply(null, this._views.data.slice(0, this._views.length[0])));;
    return [null, data.status, data.reason, data.headers, data.body];
  }
  for (var i=0; i<=this._callbacks.length; i++) {
    if (!this._callbacks[i]) {
      this._callbacks[i] = callback;
      return global.postMessage({
        name: "async",
        index: i,
        method: ""+method,
        path: this._prefix+path,
        headers: copy,
        body: body
      });
    }
  }
}

function connect (path) {
  path = path || "";
  var index = this._poolcreate();
  global.postMessage({
    name: "open1",
    path: this._prefix+path,
    pair: index
  });
  return this._poolget(index);
}

var singleton = false;

module.exports = function (size) {
  if (singleton)
    throw new Error("Only one worker emitter can be created...");
  singleton = true;
  var callbacks = [];
  var pool = WorkerSocketPool(global);
  var handlers = {
    close1: pool.onclose1,
    close2: pool.onclose2,
    message: pool.onmessage,
    open2: function (data) { pool.open(data.index, data.pair) },
    async: function (data) {
      callbacks[data.index](null, data.status, data.reason, data.headers, data.body);
      delete callbacks[data.index];
    }
  };
  onmessage = function (message) {
    handlers[message.data.name](message.data)
  };
  var shared = new SharedArrayBuffer(2*(size||1024)+8);
  global.postMessage(shared);
  var views = {};
  views.lock = new Uint8Array(shared, 0, 1);
  views.length = new Uint32Array(shared, 4, 1);
  views.data = new Uint16Array(shared, 8);
  var emitter = Factory(request, connect);
  emitter._callbacks = callbacks;
  emitter._views = views;
  emitter._poolcreate = pool.create;
  emitter._poolget = pool.get;
  return emitter;
};