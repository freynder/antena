
var Url = require("url");
var DispatchRequest = require("./dispatch-request.js");

module.exports = function (receptor) {
  return function (req, res) {
    var body = "";
    req.on("data", function (data) { body += data });
    req.on("end", function () {
      DispatchRequest(receptor, req.method, Url.parse(req.url).path, req.headers, body, function (status, reason, headers, body) {
        res.writeHead(status, reason, headers);
        res.end(body);
      });
    });
  }
}
