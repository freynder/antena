
const Split = require("./split.js");

module.exports = function (splitter = "__antena__") {
  return (request, response, next) => {
    const prefix = Split(request.url, splitter);
    if (prefix) {
      const token = prefix.substring(1);
      const session = this._authentify(token);
      response.sendDate = false;
      response.setHeader("Content-Type", "text/plain;charset=UTF-8");
      if (session) {
        if (request.method !== "GET") {
          request._antena_session = session;
          request._antena_message = "";
          request._antena_receptor = this;
          request.on("data", ondata);
        }
        if (prefix[0] === "+") {
          if (request.method === "GET") {
            this.onpull(session, "", (message) => {
              response.end(message, "utf8");
            });
          } else {
            request._antena_response = response;
            request.on("end", onend1);
          }
        } else if (prefix[0] === "*") {
          request.on("end", onend2);
          response.end();
        } else if (prefix[0] === ".") {
          if (!this._revoke(token))
            response.writeHead(400, "Fail to revoke token");  
          response.end();
        } else {
          response.writeHead(400, "Invalid message");
          response.end();
        }
      } else {
        response.writeHead(400, "Token Revoked");
        response.end();
      }
    } else if (next) {
      next();
    }
    return Boolean(prefix);
  }
};

function ondata (data) {
  this._antena_message += data;
}

function onend1 () {
  this._antena_receptor.onpull(this._antena_session, this._antena_message, (message) => {
    this._antena_response.end(message, "utf8");
  });
}

function onend2 () {
  this._antena_receptor.onpost(this._antena_session, this._antena_message);
}
