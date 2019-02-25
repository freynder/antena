
const Split = require("./split.js");

module.exports = function (splitter = "__antena__") {
  return (request, response, next) => {
    let head = Split(request.url, splitter);
    if (!head)
      return (next && next(), false);
    if (request.method === "GET") {
      this.onrequest(head, "", (body) => {
        response.end(body, "utf8")
      });
    } else {
      let body = "";
      request.on("data", (data) => { body += data });
      request.on("end", () => {
        this.onrequest(head, body, (body) => {
          response.end(body, "utf8")
        });
      });
    }
    return true;
  };
};