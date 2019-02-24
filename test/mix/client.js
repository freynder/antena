
const Emitter = require("../../emitter.js")

module.exports = (address, session, callback) => {
  const emitter = Emitter(address, session);
  let input = "";
  emitter.onmessage = (event) => {
    if (event.type !== "message")
      throw new Error("Expected 'open' for event.type: "+JSON.stringify(event));
    if (event.target !== emitter)
      throw new Error("Expected emitter for event.target: "+JSON.stringify(event));
    if (event.data !== "bar")
      throw new Error("Expected 'bar' for event.data, got: "+JSON.stringify(event));
    console.log("onmessage", session);
    emitter.close();
  };
  emitter.onclose = (event) => {
    if (event.type !== "close")
      throw new Error("Expected 'close' for event.type: "+JSON.stringify(event));
    if (event.target !== emitter)
      throw new Error("Expected emitter for event.target: "+JSON.stringify(event));
    if (event.wasClean !== true)
      throw new Error("Expected true for event.wasClean: "+JSON.stringify(event));
    console.log("onclose", session);
    callback();
  };
  emitter.onopen = (event) => {
    if (event.type !== "open")
      throw new Error("Expected 'open' for event.type: "+JSON.stringify(event));
    if (event.target !== emitter)
      throw new Error("Expected emitter for event.target: "+JSON.stringify(event));
    console.log("onopen", session);
    const result = emitter.request("foo");
    if (result !== "foo")
      throw new Error("Expected 'foo', got: "+result);
    console.log("request", session);
    emitter.send("bar");
    console.log("send", session);
  }
};
