
var Http = require("http");
var Https = require("https");
var ChildProcess = require("child_process");
var Ws = require("ws");
var ParseHost = require("../util/parse-host.js");
var ParseResponse = require("../util/parse-response.js");
var Factory = require("./factory.js");

function request (method, path, headers, body, callback) {
  method = method || "GET";
  path = path || "";
  headers = headers || {};
  body = body || "";
  if (!callback) {
    var args = ["--request", method, "--include", "--silent"];
    if (body)
      args.push("--data-binary", "@-");
    for (var h in headers)
      args.push("--header", h+": "+headers[h]);
    if (this._host.unix)
      args.push("--unix-socket", this._host.unix, this._rprefix+this._prefix+path);
    else
      args.push(this._rprefix+this._prefix+path);
    var result = ChildProcess.spawnSync("curl", args, {input:body||"", encoding:"utf8"});
    if (result.error)
      throw result.error;
    if (result.status !== 0)
      return [new Error("curl "+args.join(" ")+" failed with: "+result.status+" "+result.stderr)];
    return ParseResponse(result.stdout);
  }
  this._protocol.request({
    hostname: this._host.hostname,
    port: this._host.port,
    socketPath: this._host.unix,
    method: method,
    headers: headers,
    path: this._prefix+path,
    body: body
  }).on("response", function (res) {
    var body = "";
    res.on("error", callback);
    res.on("data", function (data) { body += data });
    res.on("end", function () {
      callback(null, res.statusCode, res.statusMessage, res.headers, body);
    });
  }).on("error", callback).end(body, "utf8");
}

function connect (path) {
  path = path || "";
  var ws = new Ws(this._cprefix+this._prefix+path);
  ws.binaryType = "arraybuffer";
  return ws;
}

module.exports = function (host, secure) {
  host = ParseHost(host);
  secure = secure ? "s" : "";
  var emitter = Factory(request, connect);
  emitter._host = host;
  emitter._protocol = secure ? Https : Http;
  if (host.unix) {
    emitter._rprefix = "http"+secure+"://localhost";
    emitter._cprefix = "ws"+secure+"+unix://"+host.unix+":";
  } else {
    emitter._rprefix = "http"+secure+"://"+host.hostname+(host.port?":"+host.port:"");
    emitter._cprefix = "ws"+secure+"://"+host.hostname+(host.port?":"+host.port:"");
  }
  return emitter;
};
