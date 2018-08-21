const Client = require("./client.js");
const Emitter = require("../browser");
Client(Emitter({splitter:"antena-traffic"}, "browser-session"));