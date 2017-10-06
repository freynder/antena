
var AttachWorker = require("./method/attach-worker.js");
var Merge = require("./method/merge.js");
var Trace = require("./method/trace.js");
var Factory = require("./factory.js");

module.exports = Factory({
  attach: AttachWorker,
  merge: Merge,
  trace: Trace
});
