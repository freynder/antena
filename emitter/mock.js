
var Events = require("events");
var Prototype = require("./prototype");
var Onrequest = require("../receptor/dispatch/onrequest.js");
var Onconnect = require("../receptor/dispatch/onconnect.js");

function request (method, path, headers, body, callback) {
  method = method || "GET";
  path = path || "";
  headers = headers || {};
  body = body || "";
  /* https://github.com/abbr/deasync/issues/83 */
  if (!callback) {
    throw new Error([
      "Mock emitters cannot handle synchronous HTTP requests since it ",
      "would involve transforming asynchronous calls into synchronous ",
      "calls. This is made difficult/impossible on purpose since doing ",
      "so would break the run-to-completion semantic. There is a node ",
      "module called deasync which tries to circumvent this limitation ",
      "but it does not support nested calls ",
      "cf: https://github.com/abbr/deasync/issues/83."
    ].join(""));
  }
  setTimeout(Onrequest, 0, this._receptor, method, this._prefix+path, headers, body, function (status, reason, headers, body) {
    setTimeout(callback, 0, null, status, reason, headers, body);
  });
};

function connect (path) {
  path = path || "";
  var con1 = new Events();
  var con2 = new Events();
  con1.close = close;
  con2.close = close;
  con1.send = send;
  con2.send = send;
  con1.pair = con2;
  con2.pair = con1;
  setTimeout(Onconnect, 0, this._receptor, this._prefix+path, con2);
  setTimeout(con1.emit.bind(con1), 0, "open");
  return con1;
}

function close (code, reason) {
  this.emit("close", code, reason);
  var pair = this.pair;
  setTimeout(function () {
    pair.emit("close", code, reason);
  }, 0);
}

function send (message) {
  message = message instanceof ArrayBuffer ? message.slice() : ""+message;
  setTimeout(function (pair) { pair.emit("message", message) }, 0, this.pair);
}

module.exports = function (receptor) {
  var self = Object.create(Prototype);
  self.request = request;
  self.connect = connect;
  self._prefix = "";
  self._receptor = receptor;
  return self;
};
