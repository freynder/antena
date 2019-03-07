
const Fs = require("fs");
const Net = require("net");
const Http = require("http");
const Path = require("path");
const Client = require("./client.js");
const Receptor = require("../../lib/receptor.js");

const server1 = Net.createServer();
const server2 = Net.createServer();
const server3 = Http.createServer();

server1.listen(process.argv[2]);
server2.listen(Number(process.argv[3]));
server3.listen(Number(process.argv[4]));

const receptor = Receptor();

receptor.onpost = (session, message) => {
  receptor.push(session, message + message);
};

receptor.onpull = (session, message, callback) => {
  callback(message + message);
};

Client(receptor, "mock-session", (error) => {
  if (error) {
    throw error;
  }
});

server1.on("connection", receptor.ConnectionListener());

server2.on("connection", receptor.ConnectionListener());

const sockets = new Set();

const request_middleware = receptor.RequestMiddleware("antena-traffic");
server3.on("request", (request, response) => {
  sockets.add(request.socket);
  sockets.add(response.socket);
  if (!request_middleware(request, response)) {
    if (request.url === "/index.html" || request.url === "/client-browser-bundle.js") {
      Fs.createReadStream(Path.join(__dirname, request.url)).pipe(response);
    } else {
      response.writeHead(404);
      response.end();
    }
  }
});

const upgrade_middleware = receptor.UpgradeMiddleware("antena-traffic");
server3.on("upgrade", (request, socket, head) => {
  sockets.add(socket);
  if (!upgrade_middleware(request, socket, head)) {
    throw new Error("Upgrade request not handled");
  }
});

setTimeout(() => {
  server1.close(() => {
    console.log("server1 closed");
  });
  server2.close(() => {
    console.log("server2 closed");
  });
  server3.close(() => {
    console.log("server3 closed");
  });
  sockets.forEach((socket) => {
    if (!socket.destroyed) {
      socket.destroy();
    }
  });
}, 4000);

process.on("exit", () => {
  console.log("process exit");
});
