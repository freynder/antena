
const BrowserEmitter = require("browser/emitter.js");

if (typeof window === "undefined") {
  const dynamic = "node/emitter.js";
  module.exports = require(dynamic);
} else {
  module.exports = BrowserEmitter("browser/emitter.js");
}
