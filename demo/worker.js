var Emitter = require("../emitter/worker.js");
var emitters = Emitter().split(["random", "unhandled", "ping"]);
// Websocket connection //
var con = emitters.random.connect("/");
con.on("open", function () { console.log("connection establised") });
con.on("message", function (message) { console.log(message) });
// Synchronous XMLHttpRequest //
var [error, status, reason, headers, body] = emitters.unhandled.request("GET", "/", {}, "");
if (error)
  throw error;
console.log(status+" "+reason);
// Asynchronous XMLHttpRequest //
var counter = 0;
setInterval(function () {
  var id = ++counter;
  console.log("ping"+id);
  emitters.ping.request("GET", "/", {}, "", function (error, status, reason, headers, body) {
    if (error || status !== 200)
      throw error || new Error(status+" "+reason);
    console.log(body+id);
  });
}, 1000);