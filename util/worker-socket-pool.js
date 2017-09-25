
var Events = require("events");

module.exports = function (poster) {

  var pool = [];

  function send (message) {
    if (this !== pool[this._index])
      throw new Error("INVALID_STATE_ERR");
    poster.postMessage({
      name: "message",
      index: this._index,
      message: message instanceof ArrayBuffer ? message : ""+message
    });
  }

  function close (code, reason) {
    if (this === pool[this._index]) {
      pool[this._index] = null;
      this.emit("close", code, reason);
      poster.postMessage({
        name: "close",
        index: this._index,
        code: parseInt(code),
        reason: ""+reason
      });
    }
  }

  return {
    free: function () {
      index = pool.indexOf(null);
      return index === -1 ? pool.length : index;
    },
    add: function (index) {
      var con = new Events();
      pool[index] = con;
      con.send = send;
      con.close = close;
      con._index = index;
      return con;
    },
    terminate: function () {
      pool.forEach(function (con) { con && con.emit("close", 1001, "CLOSE_GOING_AWAY") });
      pool = [];
    },
    onclose: function (data) {
      pool[data.index].emit("close", data.code, data.reason);
      pool[data.index] = null;
    },
    onmessage: function (data) {
      pool[data.index].emit("message", data.message);
    },
    onopen: function (data) {
      pool[data.index].emit("open");
    }
  };

};
