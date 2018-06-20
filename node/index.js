
const Os = require("os");
const Path = require("path");
const Fs = require("fs");
const ChildProcess = require("child_process");
const Ws = require("ws");
const Request = require("./request.js");
const Fork = require("../fork.js");

const child = ChildProcess.fork(Path.join(__dirname, "child.js"));

module.exports = function (host, secure) {
  if (!new.target)
    throw new Error("Antena is a constructor");
  this.platform = "node";
  this._prefix = "";
  this._channel = Path.join(Os.platform() === "win32" ? process.env.TEMP : "/tmp", "antena-"+(new Date()).getTime().toString(36)+"-"+Math.random().toString(36).substring(2));
  this._secure = Boolean(secure);
  if (typeof host === "string" && host.indexOf("/") !== -1) {
    if (secure)
      throw new Error("Secure unix domain socket are not supported");
    this._options = {socketPath:host};
    this._request_url = "http://localhost";
    this._websocket_url = "ws+unix://"+host+":";
  } else {
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
    this._request_url = "http"+(secure?"s":"")+"://"+this._options.hostname+":"+this._options.port;
    this._websocket_url = "ws"+(secure?"s":"")+"://"+this._options.hostname+":"+this._options.port;
  }
  return this;
};

module.exports.prototype.fork = Fork;

module.exports.prototype.request = function (method, path, headers, body, callback) {
  const options = Object.assign({
    method: method || "GET",
    path: this._prefix+(path||""),
    headers: (headers||{}),
  }, this._options);
  if (callback) {
    Request(this._secure, options, body||"", callback);
  } else {
    child.send([this._channel, this._secure, options, body||""]);
    while (true) {
      try {
        Fs.readFileSync(this._channel+".sem");
        break;
      } catch (error) {}
    }
    const [message, response] = JSON.parse(Fs.readFileSync(this._channel+".res", "utf8"));
    Fs.unlinkSync(this._channel+".sem");
    Fs.unlinkSync(this._channel+".res");
    if (message)
      throw new Error(message);
    return response;
  };
};

module.exports.prototype.WebSocket = function (path) {
  return new Ws(this._websocket_url+this._prefix+(path||""));
};

// function request (method, path, headers, body) {
//   method = method || "GET";
//   path = path || "";
//   headers = headers || {};
//   body = body || "";
//   if (!callback) {
//     const args = ["--request", method, "--include", "--silent"];
//     if (body)
//       args.push("--data-binary", "@-");
//     for (let h in headers)
//       args.push("--header", h+": "+headers[h]);
//     if (this._options.socketPath)
//       args.push("--unix-socket", this._options.socketPath, this._request_url+this._prefix+path);
//     else
//       args.push(this._request_url+this._prefix+path);
//     const result = ChildProcess.spawnSync("curl", args, {input:body||"", encoding:"utf8"});
//     if (result.error)
//       throw result.error;
//     if (result.status !== 0)
//       throw Error("curl "+args.join(" ")+" failed with: "+result.status+" "+result.stderr);
//     const index = result.stdout.indexOf("\r\n\r\n");
//     if (index === -1)
//       throw Error("Cannot extract the header from:\n"+result.stdout);
//     const lines = result.stdout.substring(0, index).split("\r\n");
//     if (lines.length === 0)
//       throw Error("Cannot extract the status line from:\n"+result.stdout);
//     const [match, version, status, message] = /^HTTP\/([0-9]\.[0-9]|[0-9]) ([0-9][0-9][0-9]) (.*)$/.exec(lines.shift());
//     return [
//       Number(status),
//       message,
//       ParseHeaders(lines),
//       result.stdout.substring(index+4)
//     ];
//   }
// };
