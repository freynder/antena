
const Receptor = require("../../node/receptor.js");
const Net = require("net");

const server = Net.createServer();

const receptor = Receptor(server);

server.listen(process.argv[2], () => {
  console.log("Listening on: "+JSON.stringify(server.address()));
});

receptor.onmessage = (session, message) => {
  console.log("ONMESSAGE", session, message);
  receptor.send(session, "yolo");
}

receptor.onrequest = (session, request, callback) => {
  console.log("ONREQUEST", session, request);
  callback("swag"+request);
}
