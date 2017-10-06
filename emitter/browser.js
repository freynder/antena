
var Events = require("events");
var ParseHeaders = require("../util/parse-headers.js");
var Factory = require("./factory.js");

function request (method, path, headers, body, callback) {
  method = method || "GET";
  path = path || "";
  headers = headers || {};
  body = body || "";
  var req = new XMLHttpRequest();
  req.open(method, this._rprefix+this._prefix+path, Boolean(callback));
  for (var name in headers)
    req.setRequestHeader(name, headers[name]);
  if (!callback) {
    try {
      req.send(body);
    } catch (error) {
      return [error];
    }
    var headers = ParseHeaders(req.getAllResponseHeaders().split("\r\n"));
    return [null, req.status, req.statusText, headers, req.responseText];
  }
  req.send(body);
  req.addEventListener("error", callback);
  req.addEventListener("load", function () {
    var headers = ParseHeaders(req.getAllResponseHeaders().split("\r\n"));
    callback(null, req.status, req.statusText, headers, req.responseText);
  });
}

function send (message) {
  this._inner.send(message);
}

function close (code, reason) {
  this._inner.close(code, reason);
}

function connect (path) {
  path = path || "";
  var wrapper = new Events();
  wrapper.close = close;
  wrapper.send = send;
  wrapper._inner = new WebSocket(this._cprefix+this._prefix+path);
  wrapper._inner.binaryType = "arraybuffer";
  wrapper._inner.onopen = function () { wrapper.emit("open") };
  wrapper._inner.onclose = function (event) { wrapper.emit("close", event.code, event.reason) };
  wrapper._inner.onmessage = function (event) { wrapper.emit("message", event.data) };
  return wrapper;
}

module.exports = function (host, secure) {
  host = host || location.host;
  secure = (location.origin.indexOf("https://") === 0 || secure) ? "s" : "";
  var emitter = Factory(request, connect);
  emitter._cprefix = "ws"+secure+"://"+host;
  emitter._rprefix = "http"+secure+"://"+host;
  return emitter;
};
