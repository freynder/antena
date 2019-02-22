
const Fs = require("fs");
const Net = require("net");
const Http = require("http");
const Path = require("path");
const Client = require("./client.js");
const Receptor = require("../../receptor.js");

const server1 = Net.createServer();
const server2 = Net.createServer();
const server3 = Http.createServer();

const state = {};

server1.listen("/tmp/antena-test.sock");
server2.listen(8000);
server3.listen(8080);

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
receptor.onmessage = (session, message) => {
  receptor.send(session, "message-echo: "+message+" ");
  if (state[session]) {
    state[session](message);
    delete state[session];
  } else {
    state[session] = message;
  }
};
receptor.onrequest = (session, request, callback) => {
  receptor.send(session, "request-echo: "+request);
  if (state[session]) {
    callback(state[session]);
    delete state[session];
  } else {
    state[session] = callback;
  }
};

Client(receptor, "mock-session");
