// https://github.com/iliakan/detect-node
if (Object.prototype.toString.call(typeof process !== "undefined" ? process : 0) === "[object process]") {
  const browserify_do_no_require1 = "./mock/emitter.js";
  const browserify_do_no_require2 = "./node/emitter.js";
  const MockEmitter = require(browserify_do_no_require1);
  const NodeEmitter = require(browserify_do_no_require2);
  module.exports = (address, session, callback) => (typeof address === "object" ? MockEmitter : NodeEmitter)(address, session, callback);
} else {
  module.exports = require("./browser/emitter.js");
}