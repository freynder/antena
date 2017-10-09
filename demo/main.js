var Receptor = require("../receptor/worker.js");
Receptor({}).merge({
  "random": Receptor({
    onconnect: function (path, con) {
      function loop () {
        if (con.readyState === 1) {
          var random = Math.round(2 * 1000 * Math.random());
          con.send(random);
          setTimeout(loop, random);
        }
      }
      loop();
    }
  }),
  "ping": Receptor({
    onrequest: function (method, path, headers, body, callback) {
      callback(200, "ok", {}, "pong");
    }
  })
}).spawn("worker-bundle.js");