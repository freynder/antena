
const Emitter = require("../../emitter.js")

module.exports = (address, session, callback) => {
  Emitter(address, session, (error, emitter) => {
    if (error)
      return callback(error);
    let input = "";
    emitter.onpush = (message) => {
      if (message !== "bar")
        throw new Error("Expected 'bar', got: "+JSON.stringify(event));
      console.log("onpush", session);
      emitter.terminate(callback);
    };
    const result = emitter.pull("foo");
    if (result !== "foo")
      throw new Error("Expected 'foo', got: "+result);
    console.log("pull", session);
    emitter.post("bar");
    console.log("post", session);
  });
};
