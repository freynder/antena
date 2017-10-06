
var AttachServer = require("./method/attach-server.js");
var Handler = require("./method/handler.js");
var Merge = require("./method/merge.js");
var Trace = require("./method/trace.js");
var Factory = require("./factory.js");

module.exports = Factory({
  attach: AttachServer,
  handler: Handler,
  merge: Merge,
  trace: Trace
});
