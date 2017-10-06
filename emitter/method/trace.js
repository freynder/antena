
var SocketLog = require("../../util/socket-log.js");

var rcounter = 0;
var ccounter = 0;

function request (method, path, headers, body, callback) {
  var name = this._name;
  var path = this._prefix+path;
  var id = rcounter++;
  console.log(name+"req#"+id+" "+method+" "+path+" "+JSON.stringify(headers)+" "+body);
  if (!callback) {
    var res = this._emitter.request(method, path, headers, body);
    console.log(name+"res#"+id+" "+res[0]+" "+res[1]+" "+JSON.stringify(res[2])+" "+res[3]);
    return res;
  }
  this._emitter.request(method, path, headers, body, function (error, status, reason, headers, body) {
    console.log(name+"res#"+id+" "+status+" "+reason+" "+JSON.stringify(headers)+" "+body);
    callback(error, status, reason, headers, body);
  });
}

function connect (path) {
  var id = ccounter++;
  console.log(this._name+"con#"+id+" "+this._prefix+path);
  return SocketLog(this._emitter.connect(this._prefix+path), this._name+"con#"+id);
}

module.exports = function (name) {
  var self = Object.create(Object.getPrototypeOf(this));
  self.request = request;
  self.connect = connect;
  self._prefix = "";
  self._emitter = this;
  self._name = name || "";
  return self;
};
