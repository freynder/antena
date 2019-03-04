
const Fs = require("fs");
const Net = require("net");
const Http = require("http");
const Path = require("path");
const Client = require("./client.js");
const Receptor = require("../../receptor.js");

const server1 = Net.createServer();
const server2 = Net.createServer();
const server3 = Http.createServer();

server1.listen(process.argv[2]);
server2.listen(Number(process.argv[3]));
server3.listen(Number(process.argv[4]));

const receptor = Receptor();

server1.on("connection", receptor.ConnectionListener());

server2.on("connection", receptor.ConnectionListener());

const request_middleware = receptor.RequestMiddleware("antena-traffic");

server3.on("request", (req, res) => {
  if (!request_middleware(req, res)) {
    if (req.url === "/index.html" || req.url === "/client-browser-bundle.js") {
      Fs.createReadStream(Path.join(__dirname, req.url)).pipe(res);
    } else {
      res.writeHead(404);
      res.end();
    }
  }
});

server3.on("upgrade", receptor.UpgradeMiddleware("antena-traffic"));

receptor.onerror = (session, error) => {
  console.log("Error @"+session+": "+error.message);
  process.exit(1);
};

receptor.onpost = (session, post) => {
  console.log("onpost", session);
  console.log("push", session);
  receptor.push(session, post);
};

receptor.onpull = (session, pull, callback) => {
  console.log("onpull", session);
  callback(pull);
};

Client(receptor, "mock-session", () => {});
