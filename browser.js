
const Fork = require("./fork.js");
const ParseHeaders = require("./parse-headers.js");

module.exports = function (host, secure) {
  if (!new.target)
    throw new Error("Antena is a constructor");
  host = host || location.host;
  secure = (location.origin.indexOf("https://") === 0 || secure) ? "s" : "";
  this._prefix = "";
  this._websocket_url = "ws"+secure+"://"+host;
  this._request_url = "http"+secure+"://"+host;
  return this;
};

module.exports.prototype.fork = Fork;

module.exports.prototype.WebSocket = function (path) {
  return new WebSocket(this._websocket_url+this._prefix+(path||""));
};

module.exports.prototype.request = function (method, path, headers, body, callback) {
  method = method || "GET";
  path = path || "";
  headers = headers || {};
  body = body || "";
  const request = new XMLHttpRequest();
  request.open(method, this._request_url+this._prefix+path, Boolean(callback));
  for (let name in headers)
    request.setRequestHeader(name, headers[name]);
  if (!callback) {
    request.send(body);
    return [
      request.status,
      request.statusText,
      ParseHeaders(request.getAllResponseHeaders().split("\r\n")),
      request.responseText
    ];
  }
  request.send(body);
  request.addEventListener("error", callback);
  request.addEventListener("load", () => {
    callback(null, [
      request.status,
      request.statusText,
      ParseHeaders(request.getAllResponseHeaders().split("\r\n")),
      request.responseText
    ]);
  });
};
