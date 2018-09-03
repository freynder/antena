
const Emitter = require("../../emitter.js")
const emitter = Emitter(process.argv[process.argv.length - 1], "swaggy");

const array = new Array(2048);
array.fill("a");
const string = array.join("");

emitter.push(string);
emitter.onpush = (message) => {
  if (message !== string) {
    throw new Error("Message mismatch");
  }
  process.exit(0);
}; 

const response = emitter.pull(string); 
if (response !== string) {
  throw new Error("Request mismatch, got: "+response);
}
