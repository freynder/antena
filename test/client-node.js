const Antena = require("../node");
const Client = require("./client.js");
const antena = new Antena(process.argv[2], process.argv[3]);
if (antena.platform !== "node")
  throw new Error("Should be node");
Client(antena.fork("foo"));
setTimeout(() => { process.exit(0) }, 1000);