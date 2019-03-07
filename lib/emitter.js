if (typeof window === "undefined") {
  const browserify_do_no_require1 = "./mock/emitter.js";
  const browserify_do_no_require2 = "./node/emitter.js";
  const MockEmitter = require(browserify_do_no_require1);
  const NodeEmitter = require(browserify_do_no_require2);
  module.exports = (address, session, callback) => (typeof address === "object" ? MockEmitter : NodeEmitter)(address, session, callback);
} else {
  module.exports = require("./browser/emitter.js");
}
