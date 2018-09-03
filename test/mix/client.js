
const Emitter = require("../../emitter.js")

module.exports = (address, session) => {
  const emitter = Emitter(address, session);
  let input = "";
  emitter.onpush = (message) => {
    input += message;
  }
  function run () {
    emitter.push("hello");
    const result = emitter.pull("world");
    if (result !== "hello") {
      throw new Error("Expected "+JSON.stringify(session+"hello"+"world")+", got: "+JSON.stringify(result));
    }
  }
  run();
  setTimeout(run, 500);
  setTimeout(() => {
    console.log("DONE with: "+input);
  }, 1000);
};
