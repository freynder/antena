
const Split = require("./split.js");

const dispatch = (receptor, head, body, response) => {
  if (head[0] === "-") {
    receptor.onpush(head.substring(1), body);
    response.end();
  } else if (head[0] === "~") {
    receptor.onpull(head.substring(1), body, (body) => { response.end(body) });
  } else {
    throw new Error("Request head should start with either '-' or '~', got: "+head);
  }
};

module.exports = function (splitter = "__antena__") {
  return (request, response, next) => {
    let head = Split(request.url, splitter);
    if (!head)
      return (next && next(), false);
    if (request.headers["content-length"]) {
      let body = "";
      request.on("data", (data) => { body += data });
      request.on("end", () => {
        dispatch(this, head, body, response);
      });
    } else {
      dispatch(this, head, body, response);
    }
    return true;
  };
};