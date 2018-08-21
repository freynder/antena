
const Emitter = require("../../emitter.js")
const emitter = Emitter(process.argv[2], "swaggy");

emitter.send("hello");
emitter.request("foobar");
console.log("done");
process.exit(0);