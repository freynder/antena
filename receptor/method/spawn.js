
var WebworkerSocketPool = require("../../util/worker-socket-pool.js");
var DispatchRequest = require("./util/dispatch-request.js");
var DispatchConnect = require("./util/dispatch-connect.js");

function terminate () {
  Worker.prototype.terminate.call(this);
  for (var i=0; this._pool.get[i] !== void 0; i++) {
    if (pool.get[i] !== null) {
      this._pool.get[i].readyState = 3;
      this._pool.get[i].emit("close", 1001, "CLOSE_GOING_AWAY");
    }
  }
}

module.exports = function (url, options) {
  var self = this;
  var worker = new Worker(url, options);
  var pool = WebworkerSocketPool(worker);
  var views = null;
  var handlers = {
    message: pool.onmessage,
    close1: pool.onclose1,
    close2: pool.onclose2,
    open1: function (data) {
      var index = pool.create();
      pool.open(index, data.pair);
      worker.postMessage({
        name: "open2",
        index: data.pair,
        pair: index
      });
      DispatchConnect(self, data.path, pool.get(index));
    },
    sync: function (data) {
      DispatchRequest(self, data.method, data.path, data.headers, data.body, function (status, reason, headers, body) {
        var copy = {};
        for (var key in copy)
          copy[key] = ""+headers[key];
        var response = JSON.stringify({
          status: parseInt(status),
          reason: ""+reason,
          headers: copy,
          body: ""+body
        });
        views.length[0] = response.length;
        for (var i=0, l=Math.min(response.length, views.data.length); i<l; i++)
          views.data[i] = response.charCodeAt(i);
        views.lock[0] = 0;
      });
    },
    async: function (data) {
      DispatchRequest(self, data.method, data.path, data.headers, data.body, function (status, reason, headers, body) {
        var copy = {};
        for (var key in copy)
          copy[key] = ""+headers[key];
        worker.postMessage({
          name: "async",
          index: data.index,
          status: parseInt(status),
          reason: ""+reason,
          headers: copy,
          body: ""+body
        });
      });
    }
  };
  worker.addEventListener("message", function (event) {
    if (views)
      return handlers[event.data.name](event.data);
    views = {};
    views.lock = new Uint8Array(event.data, 0, 1);
    views.length = new Uint32Array(event.data, 4, 1);
    views.data = new Uint16Array(event.data, 8);
  });
  worker._pool = pool;
  worker.terminate = terminate;
  return worker;
};
