
const Emitter = require("../../emitter.js")

module.exports = (address, session) => {
  const emitter = Emitter(address, session);
  let input = "";
  emitter.onmessage = (message) => {
    input += message;
  }
  function run () {
    emitter.send("hello");
    const response = emitter.request("world");
    if (response !== "hello") {
      throw new Error("Expected "+JSON.stringify(session+"hello"+"world")+", got: "+JSON.stringify(response));
    }
  }
  run();
  setTimeout(run, 500);
  setTimeout(() => {
    console.log("DONE with: "+input);
  }, 1000);
};
