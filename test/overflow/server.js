
const Net = require("net");
const Receptor = require("../../lib/receptor.js");

const server = Net.createServer();
server.listen(process.argv[process.argv.length - 1]);

const receptor = Receptor();
server.on("connection", receptor.ConnectionListener());

receptor.onpull = (session, message, callback) => {
  console.log("onpull", session);
  if (message !== "a".repeat(100000))
    throw new Error("Pull missmatch");
  callback("b".repeat(100000));
};

receptor.onpost = (session, message) => {
  console.log("onpost", session);
  if (message !== "c".repeat(100000))
    throw new Error("Post mismatch");
  console.log("push", session);
  receptor.push(session, "d".repeat(100000));
};

setTimeout(() => { server.close() }, 2000);
