
const Http = require("http");
const Https = require("https");

function ondata (data) {
  this._antena_body += data;
}

function onend () {
  this._antena_callback(null, [
    this.statusCode,
    this.statusMessage,
    this.headers,
    this._antena_body
  ]);
}

module.exports = (secure, options, body, callback) => {
  (secure ? Https : Http).request(options, (response) => {
    response._antena_body = "";
    response._antena_callback = callback;
    response.on("error", callback);
    response.on("data", ondata);
    response.on("end", onend);
  }).on("error", callback).end(body);
};
