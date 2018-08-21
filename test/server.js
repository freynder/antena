
const Fs = require("fs");
const Net = require("net");
const Http = require("http");
const Path = require("path");
const Client = require("./client.js");
const Receptor = require("../receptor.js");

const server1 = Net.createServer();
const server2 = Net.createServer();
const server3 = Http.createServer();

server3.on("request", (req, res) => {
  if (req.url === "/index.html" || req.url === "/client-browser-bundle.js") {
    Fs.createReadStream(Path.join(__dirname, req.url)).pipe(res);
  } else {
    res.writeHead(404);
    res.end();
  }
});

server1.listen("/tmp/antena-test.sock");
server2.listen(8000);
server3.listen(8080);

const receptor = Receptor();
receptor.attach(server1);
receptor.attach(server2);
receptor.attach(server3, "antena-traffic");
receptor.onmessage = (session, message) => {
  console.log("ONMESSAGE", session, message);
  receptor.send(session, message+message);
}
receptor.onrequest = (session, request, callback) => {
  console.log("ONREQUEST", session, request);
  callback(request+request);
}

Client(receptor, "mock-session");
