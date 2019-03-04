
const Split = require("./split.js");

module.exports = function (splitter = "__antena__") {
  return (request, response, next) => {
    const token = Split(request.url, splitter);
    if (token) {
      const session = this._sessions[token];
      response.sendDate = false;
      response._antena_session = session;
      response._antena_receptor = this;
      response.on("error", onerror);
      if (session) {
        if (request.method === "GET") {
          this.onpull(session, "", (message) => {
            response.end(message, "utf8");
          });
        } else {
          request._antena_session = session;
          request._antena_message = "";
          request._antena_receptor = this;
          request._antena_response = response;
          request.on("error", onerror);
          request.on("data", ondata);
          request.on("end", onend);
        }
      } else {
        response.writeHead(400, "Token Revoked");
        response.end();
        this.onerror(null, new Error("Browser request: token revoked"));
      }
    } else if (next) {
      next();
    }
    return Boolean(token);
  };
};

function onerror (error) {
  this._antena_receptor.onerror(this._antena_session, error);
}

function ondata (data) {
  this._antena_message += data;
}

function onend () {
  this._antena_receptor.onpull(this._antena_session, this._antena_message, (message) => {
    this._antena_response.end(message, "utf8");
  });
}
