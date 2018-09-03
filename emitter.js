if (typeof window === "undefined") {
  const browserify_do_no_require1 = "./mock/emitter.js";
  const browserify_do_no_require2 = "./node/emitter.js";
  const MockEmitter = require(browserify_do_no_require1);
  const NodeEmitter = require(browserify_do_no_require2);
  module.exports = (address, session) => (typeof address === "object" ? MockEmitter : NodeEmitter)(address, session);
} else {
  module.exports = require("./browser/emitter.js");
}
