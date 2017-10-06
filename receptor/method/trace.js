
var SocketLog = require("../../util/socket-log.js");
var DispatchRequest = require("./util/dispatch-request.js");
var DispatchConnect = require("./util/dispatch-connect.js");

var rcounter = 0;
var ccounter = 0;

function onrequest (method, path, headers, body, callback) {
  var id = rcounter++;
  var name = this._name;
  var receptor = this._receptor;
  console.log(name+"req#"+id+" "+method+" "+path+" "+JSON.stringify(headers)+" "+body);
  DispatchRequest(receptor, method, path, headers, body, function (status, reason, headers, body) {
    console.log(name+"res#"+id+" "+status+" "+reason+" "+JSON.stringify(headers)+" "+body);
    callback(status, reason, headers, body);
  });
}

function onconnect (path, con) {
  var id = ccounter++;
  console.log(this._name+"con#"+id+" "+path);
  DispatchConnect(this._receptor, path, SocketLog(con, this._name+"con#"+id));
}

module.exports = function (name) {
  var receptor = Object.create(Object.getPrototypeOf(this));
  receptor._onrequest = onrequest;
  receptor._onconnect = onconnect;
  receptor._receptor = this;
  receptor._name = name || "";
  return receptor;
};
