const Antena = require("../node");
const Client = require("./client.js");
Client((new Antena(process.argv[2], process.argv[3])).fork("foo"));
setTimeout(() => { process.exit(0) }, 1000);