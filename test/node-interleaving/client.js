
const Emitter = require("../../emitter.js")
const emitter = Emitter(process.argv[process.argv.length - 1], "swaggy");

emitter.send("hello");
emitter.request("foobar");
console.log("done");
process.exit(0);