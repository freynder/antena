
var Spawn = require("./method/spawn.js");
var Merge = require("./method/merge.js");
var Trace = require("./method/trace.js");
var Factory = require("./factory.js");

module.exports = Factory({
  spawn: Spawn,
  merge: Merge,
  trace: Trace
});
