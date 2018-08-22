
const Net = require("net");
const Receptor = require("../../receptor.js");

const server = Net.createServer();
server.listen(process.argv[process.argv.length - 1]);

const receptor = Receptor();

receptor.attach(server);

receptor.onrequest = (origin, query, callback) => {
  callback(query);
};

receptor.onmessage = (origin, message) => {
  receptor.send(origin, message);
};