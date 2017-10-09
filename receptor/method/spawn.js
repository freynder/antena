
var WebworkerSocketPool = require("../../util/worker-socket-pool.js");
var DispatchRequest = require("./util/dispatch-request.js");
var DispatchConnect = require("./util/dispatch-connect.js");

module.exports = function (url) {
  var self = this;
  var worker = new Worker(url);
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
  worker.onmessage = function (message) {
    if (views)
      return handlers[message.data.name](message.data);
    views = {};
    views.lock = new Uint8Array(message.data, 0, 1);
    views.length = new Uint32Array(message.data, 4, 1);
    views.data = new Uint16Array(message.data, 8);
  };
  return function () {
    worker.terminate();
    worker.onmessage = null;
    for (var i=0; pool.get[i] !== void 0; i++) {
      if (pool.get[i] !== null) {
        pool.get[i].readyState = 3;
        pool.get[i].emit("close", 1001, "CLOSE_GOING_AWAY")
      }
    };
    pool = null;
    views = null;
    handlers = null;
  };
};
