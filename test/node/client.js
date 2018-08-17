
const Emitter = require("../../node/emitter.js");

const emitter = Emitter(process.argv[2], "yolo");

emitter.onmessage = (message) => {
  console.log(message);
}

emitter.send("async");

console.log(emitter.request("sync"));

