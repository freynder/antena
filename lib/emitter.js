const process = (function () { return this } ()).process;
// https://github.com/iliakan/detect-node
if (Object.prototype.toString.call(process) === "[object process]") {
  const browserify_do_no_require1 = __dirname + "/mock/emitter.js";
  const browserify_do_no_require2 = __dirname + "/node/emitter.js";
  // In case antena is browserified and then fed to a node-based headless browser,
  // we want to use the real node require and not the shim provided by Browserify. 
  const MockEmitter = process.mainModule.require(browserify_do_no_require1);
  const NodeEmitter = process.mainModule.require(browserify_do_no_require2);
  module.exports = (address, session, callback) => (typeof address === "object" ? MockEmitter : NodeEmitter)(address, session, callback);
} else {
  module.exports = require("./browser/emitter.js");
}