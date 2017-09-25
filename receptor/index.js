
var Prototype = require("./prototype");

function onrequest (method, path, headers, body, callback) {
  callback(400, "no-handler", {}, this._stack);
}

function onconnect (path, con) {
  con.send(this._stack);
  con.close(4000, "no-handler");
}

module.exports = function (methods) {
  var self = Object.create(Prototype);
  if (typeof methods.onrequest !== "function" && typeof methods.onconnect !== "function")
    self._stack = (new Error("No handler")).stack;
  self._onrequest = typeof methods.onrequest === "function" ? methods.onrequest : onrequest;
  self._onconnect = typeof methods.onconnect === "function" ? methods.onconnect : onconnect;
  return self;
};
