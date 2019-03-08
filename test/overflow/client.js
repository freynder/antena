const Emitter = require("../../lib/emitter.js");
const session = "overflow";
Emitter(process.argv[process.argv.length - 1], session, (error, emitter) => {
  if (error)
    throw error;
  emitter.then(() => {}, (error) => { throw error });
  console.log("pull", session);
  const response = emitter.pull("a".repeat(100000));
  if (response !== "b".repeat(100000))
    throw new Error("Pull mismatch");
  console.log("post", session);
  emitter.post("c".repeat(100000));
  emitter.onpush = (message) => {
    console.log("onpush", session);
    if (message !== "d".repeat(100000))
      throw new Error("Push mismatch");
    emitter.terminate(0);
  };
});