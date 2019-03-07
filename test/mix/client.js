
const Emitter = require("../../lib/emitter.js")

module.exports = (address, session, callback) => {
  console.log(session+"...");
  Emitter(address, session, (error, emitter) => {
    if (error)
      return callback(error);
    emitter.then(callback, callback);
    emitter.onpush = (message) => {
      console.assert(message === "barbar", "Wrong post -> push");
      emitter.terminate();
    };
    emitter.onterminate = () => {
      console.assert(emitter.pull("qux") === "quxqux", "Wrong termination pull");
    };
    console.assert(emitter.pull("foo") === "foofoo", "Wrong pull");
    emitter.post("bar");
  });
};
