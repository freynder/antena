
var SocketLog = require("../../util/socket-log.js");
var Onrequest = require("../dispatch/onrequest.js");
var Onconnect = require("../dispatch/onconnect.js");

var rcounter = 0;
var ccounter = 0;

function onrequest (method, path, headers, body, callback) {
  var id = rcounter++;
  var name = this._name;
  var receptor = this._receptor;
  console.log(name+"req#"+id+" "+method+" "+path+" "+JSON.stringify(headers)+" "+body);
  Onrequest(receptor, method, path, headers, body, function (status, reason, headers, body) {
    console.log(name+"res#"+id+" "+status+" "+reason+" "+JSON.stringify(headers)+" "+body);
    callback(status, reason, headers, body);
  });
}

function onconnect (path, con) {
  var id = ccounter++;
  console.log(this._name+"con#"+id+" "+path);
  Onconnect(this._receptor, path, SocketLog(con, this._name+"con#"+id));
}

module.exports = function (prototype) {
  return function (name) {
    var self = Object.create(prototype);
    self._onrequest = onrequest;
    self._onconnect = onconnect;
    self._receptor = this;
    self._name = name || "";
    return self;
  };
};
