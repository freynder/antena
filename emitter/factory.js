
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
