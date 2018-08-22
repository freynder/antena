
const Net = require("net");
const Receptor = require("../../receptor.js");

const server = Net.createServer();
server.listen(process.argv[process.argv.length - 1]);

const receptor = Receptor();

let state;

receptor.attach(server);

receptor.onrequest = (origin, query, callback) => {
  console.log("request", origin, query);
  if (state) {
    callback(state);
  } else {
    state = callback;
  }
};

receptor.onmessage = (origin, message) => {
  console.log("message", origin, message);
  if (state) {
    state(message);
  } else {
    state = message;
  }
};
