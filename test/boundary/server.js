
const Net = require("net");
const Receptor = require("../../lib/receptor.js");

const server = Net.createServer();
server.listen(process.argv[process.argv.length - 1]);

const receptor = Receptor();
const listener = receptor.ConnectionListener();
server.on("connection", (socket) => {
  listener(socket);
  setTimeout(() => {
    const buffer = Buffer.alloc(5);
    buffer.writeUInt32LE(6, 0);
    buffer.write("a", 4, 1, "utf8");
    socket.write(buffer);
    setTimeout(() => {
      const buffer = Buffer.alloc(7);
      buffer.write("b", 0, 1, "utf8");
      buffer.writeUInt32LE(6, 1);
      buffer.write("cd", 5, 2, "utf8");
      socket.write(buffer);
    }, 1000);
  }, 1000);
});

setTimeout(() => { server.close() }, 2000);
