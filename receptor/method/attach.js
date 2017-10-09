
var RequestHandler = require("./util/request-handler.js");
var UpgradeHandler = require("./util/upgrade-handler.js");

module.exports = function (server) {
  server.on("request", RequestHandler(this));
  server.on("upgrade", UpgradeHandler(this));
};
