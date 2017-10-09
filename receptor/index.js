
var Attach = require("./method/attach.js");
var Handler = require("./method/handler.js");
var Merge = require("./method/merge.js");
var Trace = require("./method/trace.js");
var Factory = require("./factory.js");

module.exports = Factory({
  attach: Attach,
  handler: Handler,
  merge: Merge,
  trace: Trace
});
