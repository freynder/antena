const Client = require("./client.js");
const Emitter = require("../node");
Client(Emitter(process.argv[2], "node-session-"+process.argv[2]));
setTimeout(() => {
  process.exit(0);
}, 1000);