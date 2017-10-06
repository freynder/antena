
var Split = require("./split.js");
var Trace = require("./trace.js");
var Fork = require("./fork.js");

exports.split = Split(exports);
exports.fork = Fork(exports);
exports.trace = Trace(exports);
