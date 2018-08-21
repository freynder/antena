
const Emitter = require("../../emitter.js")

module.exports = (address, session) => {
  const emitter = Emitter(address, session);
  emitter.onmessage = (message) => {
   console.log("ONMESSAGE", emitter.session, message);
  }
  console.log("SEND", emitter.session, "hello")
  emitter.send("hello");
  console.log("REQUEST", emitter.session, "world");
  console.log("RESPONSE", emitter.session, emitter.request("world"));
};
