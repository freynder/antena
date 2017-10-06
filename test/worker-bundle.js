(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

var Split = require("./method/split.js");
var Trace = require("./method/trace.js");
var Fork = require("./method/fork.js");

var prototype = {
  split: Split,
  fork: Fork,
  trace: Trace
};

module.exports = function (request, connect) {
  var emitter = Object.create(prototype);
  emitter.request = request;
  emitter.connect = connect;
  emitter._prefix = "";
  return emitter;
};

},{"./method/fork.js":2,"./method/split.js":3,"./method/trace.js":4}],2:[function(require,module,exports){

module.exports = function (splitter) {
  var emitter = Object.create(Object.getPrototypeOf(this));
  Object.assign(emitter, this);
  emitter._prefix += "/"+splitter;
  return emitter;
};

},{}],3:[function(require,module,exports){

module.exports = function (splitters) {
  var emitters = {};
  for (var i=0; i<splitters.length; i++) {
    emitters[splitters[i]] = Object.create(Object.getPrototypeOf(this));
    Object.assign(emitters[splitters[i]], this);
    emitters[splitters[i]]._prefix += "/"+splitters[i];
  }
  return emitters;
};

},{}],4:[function(require,module,exports){

var SocketLog = require("../../util/socket-log.js");

var rcounter = 0;
var ccounter = 0;

function request (method, path, headers, body, callback) {
  var name = this._name;
  var path = this._prefix+path;
  var id = rcounter++;
  console.log(name+"req#"+id+" "+method+" "+path+" "+JSON.stringify(headers)+" "+body);
  if (!callback) {
    var res = this._emitter.request(method, path, headers, body);
    console.log(name+"res#"+id+" "+res[0]+" "+res[1]+" "+JSON.stringify(res[2])+" "+res[3]);
    return res;
  }
  this._emitter.request(method, path, headers, body, function (error, status, reason, headers, body) {
    console.log(name+"res#"+id+" "+status+" "+reason+" "+JSON.stringify(headers)+" "+body);
    callback(error, status, reason, headers, body);
  });
}

function connect (path) {
  var id = ccounter++;
  console.log(this._name+"con#"+id+" "+this._prefix+path);
  return SocketLog(this._emitter.connect(this._prefix+path), this._name+"con#"+id);
}

module.exports = function (name) {
  var self = Object.create(Object.getPrototypeOf(this));
  self.request = request;
  self.connect = connect;
  self._prefix = "";
  self._emitter = this;
  self._name = name || "";
  return self;
};

},{"../../util/socket-log.js":7}],5:[function(require,module,exports){
(function (global){

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

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"../util/worker-socket-pool.js":8,"./factory.js":1}],6:[function(require,module,exports){
var Emitter = require("../emitter/worker.js");
var emitters = Emitter().split(["random", "unhandled", "ping"]);
// Websocket connection //
var con = emitters.random.connect("/");
con.on("open", function () { console.log("connection establised") });
con.on("message", function (message) { console.log(message) });
// Synchronous XMLHttpRequest //
var [error, status, reason, headers, body] = emitters.unhandled.request("GET", "/", {}, "");
if (error)
  throw error;
console.log(status+" "+reason);
// Asynchronous XMLHttpRequest //
var counter = 0;
setInterval(function () {
  var id = ++counter;
  console.log("ping"+id);
  emitters.ping.request("GET", "/", {}, "", function (error, status, reason, headers, body) {
    if (error || status !== 200)
      throw error || new Error(status+" "+reason);
    console.log(body+id);
  });
}, 1000);
},{"../emitter/worker.js":5}],7:[function(require,module,exports){

var Events = require("events");

module.exports = function (con, name) {
  var wrapper = new Events();
  wrapper.send = function (message) {
    console.log(name+" >> "+message);
    con.send(message);
  };
  wrapper.close = function (code, reason) {
    console.log(name+" close "+code+" "+reason);
    con.close(code, reason);
  };
  con.on("message", function (message) {
    console.log(name+" << "+message);
    wrapper.emit("message", message);
  });
  con.on("close", function (code, reason) {
    console.log(name+" onclose "+code+" "+reason);
    wrapper.emit("close", code, reason);
  });
  con.on("open", function () {
    console.log(name+" onopen");
    wrapper.emit("open");
  });
  con.on("error", function (error) {
    console.log(name+" onerror "+error.message);
    wrapper.emit("error", error);
  });
  return wrapper;
};

},{"events":9}],8:[function(require,module,exports){

var Events = require("events");

module.exports = function (poster) {

  var pool = [];

  function send (message) {
    if (this.readyState !== 1)
      throw new Error("INVALID_STATE_ERR");
    poster.postMessage({
      name: "message",
      index: this._pair,
      message: message instanceof ArrayBuffer ? message : ""+message
    });
  }

  function close (code, reason) {
    if (this.readyState === 0 || this.readyState === 1) {
      this.readyState = 2;
      poster.postMessage({
        name: "close1",
        index: this._pair,
        code: parseInt(code),
        reason: ""+reason
      });
    }
  }

  return {
    create: function () {
      var index = 0;
      while (pool[index])
        index++;
      pool[index] = new Events();
      pool[index].send = send;
      pool[index].close = close;
      pool[index].readyState = 0;
      return index;
    },
    get: function (index) {
      return pool[index];
    },
    open: function (index, pair) {
      pool[index]._pair = pair;
      pool[index].readyState = 1;
      pool[index].emit("open");
    },
    onmessage: function (data) {
      if (pool[data.index].readyState === 1) {
        pool[data.index].emit("message", data.message);
      } else if (pool[data.index].readyState !== 2) {
        throw new Error("Inconsistent state");
      }
    },
    onclose1: function (data) {
      if (pool[data.index].readyState === 3)
        throw new Error("Inconsistent state");
      pool[data.index].readyState = 3;
      pool[data.index].emit("close", data.code, data.reason);
      poster.postMessage({
        name: "close2",
        index: pool[data.index]._pair,
        code: data.code,
        reason: data.reason
      });
      pool[data.index] = null;
    },
    onclose2: function (data) {
      if (pool[data.index].readyState !== 2)
        throw new Error("Inconsistent state");
      pool[data.index].readyState = 3;
      pool[data.index].emit("close", data.code, data.reason);
      pool[data.index] = null;
    }
  };
};

},{"events":9}],9:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}]},{},[6]);
