
const Messaging = require("./messaging.js");

module.exports = (receptor, server) => {
  server._antena_receptor = receptor;
  server.on("connection", onconnection);
  server.on("error", onerror);
};

function onconnection (socket) {
  socket._antena_receptor = this._antena_receptor;
  socket.on("error", onerror);
  Messaging.initialize(socket);
  Messaging.input(socket, receive_initial);
};

function onerror (error) {
  if ("onerror" in this._antena_receptor) {
    error.AntenaSession = this._antena_session;
    this._antena_receptor.onerror(error);
  } else {
    throw error;
  }
}

function receive_initial (string) {
  this._antena_session = string.substring(1);
  if (string[0] === "?") {
    Messaging.input(this, receive_request);
  } else if (string[0] === "_") {
    Messaging.input(this, receive_message);
    const connection = this._antena_receptor._connections[this._antena_session];
    if (connection && !Array.isArray(connection)) {
      this.destroy(new Error("Already connected"));
    } else {
      if (Array.isArray(connection)) {
        for (let index = 0; index < connection.length; index++) {
          this.send(Messaging.output(connection[index]));
        }
      }
      this._antena_send = _antena_send;
      this._antena_receptor._connections[this._antena_session] = this;
      this.on("close", onclose);
    }
  } else {
    this.destroy(new Error("Initial message should start with either '?' or '_'"));
  }
}

function _antena_send (string) {
  Messaging.output(this, string);
}

function onclose () {
  delete this._antena_receptor._connections[this._antena_session];
}

function receive_request (string) {
  this._antena_receptor.onrequest(this._antena_session, string, (string) => {
    Messaging.output(this, string);
  });
}

function receive_message (string) {
  this._antena_receptor.onmessage(this._antena_session, string);
}
