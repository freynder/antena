const Emitter = require("../../emitter.js")
const emitter = Emitter(process.argv[process.argv.length - 1], "swaggy");
emitter.onopen = () => {
  const array = new Array(2048);
  array.fill("a");
  const string = array.join("");
  emitter.send(string);
  emitter.onmessage = ({data:message}) => {
    if (message !== string) {
      throw new Error("Message mismatch");
    }
    process.exit(0);
  };
  const response = emitter.request(string);
  if (response !== string) {
    throw new Error("Request mismatch, got: "+response);
  }
}