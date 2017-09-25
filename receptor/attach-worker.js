
var WebworkerSocketPool = require("../util/worker-socket-pool.js");
var Onrequest = require("./dispatch/onrequest.js");
var Onconnect = require("./dispatch/onconnect.js");

module.exports = function (receptor, worker) {
  var pool = WebworkerSocketPool(worker);
  var views = null;
  var handlers = {
    message: pool.onmessage,
    close: pool.onclose,
    open: function (data) {
      worker.postMessage(data);
      Onconnect(receptor, data.path, pool.add(data.index));
    },
    sync: function (data) {
      Onrequest(receptor, data.method, data.path, data.headers, data.body, function (status, reason, headers, body) {
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
      Onrequest(receptor, data.method, data.path, data.headers, data.body, function (status, reason, headers, body) {
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
    pool.terminate();
    pool = null;
    handlers = null;
  };
};
