const Emitter = require("../../lib/emitter.js");
const session = "overflow";
Emitter(process.argv[process.argv.length - 1], session, (error, emitter) => {
  if (error)
    throw error;
  let state = true;  
  emitter.onpush = (message) => {
    console.log("onpush", message);
    if (state) {
      state = false;
      if (message !== "ab") throw new Error("Wrong first message");
    } else {
      if (message !== "cd") throw new Error("Wrong second message");
      emitter.terminate();
    }
  };
});