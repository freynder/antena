
var RequestHandler = require("./util/request-handler.js");
var UpgradeHandler = require("./util/upgrade-handler.js");

module.exports = function (name) {
  if (name === "request")
    return RequestHandler(this);
  if (name === "upgrade")
    return UpgradeHandler(this);
  throw new Error("Unknown handler name: "+name);
};
