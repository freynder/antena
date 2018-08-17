
module.exports = (onrequest) => (req, res) => {
  const body = "";
  req.on("data", (data) => { body += data });
  req.on("end", () => {
    onrequest(req.method, req.url, req.rawHeaders, body, (status, message, headers, body) => {
      body = Buffer.from(body, "utf8");
      headers["Content-Type"] = headers["Content-Type"] || "text/plain";
      headers["Content-Length"] = headers["Content-Length"] || body.length;
      res.writeHead(status, message, headers);
      res.end(body);
    });
  });
};
