const Ws = require("ws");
const wss = new Ws.Server({noServer:true});
module.exports = (onwebsocket) => (req, socket, head) => {
  const ws = wss.handleUpgrade(req, socket, head);
  onwebsocket(URL, ws);
};
