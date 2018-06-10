
const Http = require("http");
const Https = require("https");
const ChildProcess = require("child_process");
const Ws = require("ws");
const ParseHeaders = require("./parse-headers.js");
const Fork = require("./fork.js");

module.exports = function (host, secure) {
  this._prefix = "";
  if (typeof host === "string" && host.indexOf("/") !== -1) {
    if (secure)
      throw new Error("Secure unix domain socket are not supported");
    this._protocol = Http;
    this._options = {socketPath:host};
    this._request_url = "http://localhost";
    this._connect_url = "ws+unix://"+host+":";
  } else {
    this._protocol = secure ? Https : Http;
    secure = secure ? "s" : "";
    if (Number(host)) {
      this._options = {
        hostname: "localhost",
        port: Number(host)
      };
    } else {
      const [hostname,port] = host.split(":");
      this._options = {
        hostname: hostname,
        port: port || (secure ? 443 : 80)
      };
    }
    this._request_url = "http"+secure+"://"+this._options.hostname+":"+this._options.port;
    this._connect_url = "ws"+secure+"://"+this._options.hostname+":"+this._options.port;
  }
};

module.exports.prototype.fork = Fork;

function ondata (data) {
  this._antena_body += data;
}

function onend () {
  this._antena_callback(null, [
    this.statusCode,
    this.statusMessage,
    this.headers,
    this._antena_body
  ]);
}

module.exports.prototype.request = function request (method, path, headers, body, callback) {
  method = method || "GET";
  path = path || "";
  headers = headers || {};
  body = body || "";
  if (!callback) {
    const args = ["--request", method, "--include", "--silent"];
    if (body)
      args.push("--data-binary", "@-");
    for (let h in headers)
      args.push("--header", h+": "+headers[h]);
    if (this._options.socketPath)
      args.push("--unix-socket", this._options.socketPath, this._request_url+this._prefix+path);
    else
      args.push(this._request_url+this._prefix+path);
    const result = ChildProcess.spawnSync("curl", args, {input:body||"", encoding:"utf8"});
    if (result.error)
      throw result.error;
    if (result.status !== 0)
      throw Error("curl "+args.join(" ")+" failed with: "+result.status+" "+result.stderr);
    const index = result.stdout.indexOf("\r\n\r\n");
    if (index === -1)
      throw Error("Cannot extract the header from:\n"+result.stdout);
    const lines = result.stdout.substring(0, index).split("\r\n");
    if (lines.length === 0)
      throw Error("Cannot extract the status line from:\n"+result.stdout);
    const [match, version, status, message] = /^HTTP\/([0-9]\.[0-9]|[0-9]) ([0-9][0-9][0-9]) (.*)$/.exec(lines.shift());
    return [
      Number(status),
      message,
      ParseHeaders(lines),
      result.stdout.substring(index+4)
    ];
  }
  this._protocol.request(Object.assign({
    method: method,
    path: this._prefix+path,
    headers: headers,
  }, this._options), (response) => {
    response._antena_body = "";
    response._antena_callback = callback;
    response.on("error", callback);
    response.on("data", ondata);
    response.on("end", onend);
  }).on("error", callback).end(body);
};

module.exports.prototype.connect = function connect (path) {
  path = path || "";
  var ws = new Ws(this._connect_url+this._prefix+path);
  ws.binaryType = "arraybuffer";
  return ws;
};
