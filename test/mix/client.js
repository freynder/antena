
const Emitter = require("../../emitter.js")

module.exports = (address, session) => {
  const emitter = Emitter(address, session);
  emitter.onopen = () => {
    let input = "";
    emitter.onmessage = ({data:message}) => {
      input += message;
    }
    function run () {
      emitter.send("hello");
      const result = emitter.request("world");
      if (result !== "hello") {
        throw new Error("Expected "+JSON.stringify(session+"hello"+"world")+", got: "+JSON.stringify(result));
      }
    }
    run();
    setTimeout(run, 500);
    setTimeout(() => {
      console.log("DONE with: "+input);
      emitter.close();
    }, 1000);
  }
};
