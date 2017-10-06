
function onrequest (method, path, headers, body, callback) {
  callback(400, "no-handler", {}, this._stack);
}

function onconnect (path, con) {
  con.send(this._stack);
  con.close(4000, "no-handler");
}

module.exports = function (prototype) {
  return function (handlers) {
    var receptor = Object.create(prototype);
    if (typeof handlers.onrequest !== "function" && typeof handlers.onconnect !== "function")
      receptor._stack = (new Error("No handler")).stack;
    receptor._onrequest = typeof handlers.onrequest === "function" ? handlers.onrequest : onrequest;
    receptor._onconnect = typeof handlers.onconnect === "function" ? handlers.onconnect : onconnect;
    return receptor;
  }
};
