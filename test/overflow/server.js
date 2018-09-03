
const Net = require("net");
const Receptor = require("../../receptor.js");

const server = Net.createServer();
server.listen(process.argv[process.argv.length - 1]);

const receptor = Receptor();
server.on("connection", receptor.ConnectionListener());

receptor.onpull = (origin, query, callback) => {
  callback(query);
};

receptor.onpush = (origin, message) => {
  receptor.push(origin, message);
};
