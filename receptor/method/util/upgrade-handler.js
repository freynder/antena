
var Url = require("url");
var Ws = require("ws");
var DispatchConnect = require("./dispatch-connect.js");

module.exports = function (receptor) {
  var ws = new Ws.Server({noServer:true});
  return function (req, socket, head) {
    ws.handleUpgrade(req, socket, head, function (con) {
      DispatchConnect(receptor, Url.parse(req.url).path, con);
    });
  };
};
