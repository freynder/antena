const Http = require("http");
const Https = require("https");
const Fs = require("fs");
const Ws = require("ws");

const wss = new Ws.Server({noServer:true});
const server = (process.argv[3]?Https:Http).createServer((request, response) => {
  if (request.url === "/")
    request.url = "/index.html";
  if (request.url === "/index.html" || request.url === "/client-browser-bundle.js") {
    Fs.createReadStream(__dirname+request.url).pipe(response);
  } else {
    console.log("Request "+request.url);
    console.log({method:request.method, url:request.url, headers:request.headers});
    request.pipe(response);
  }
});
server.on("upgrade", (request, socket, head) => {
  console.log("Websocket "+request.url);
  wss.handleUpgrade(request, socket, head, (websocket) => {
    websocket.send("fablabla!");
  });
});
server.listen(process.argv[2]);