
const Messaging = require("./messaging.js");

module.exports = (receptor, server) => {
  server._antena_receptor = receptor;
  server.on("connection", onconnection);
  server.on("error", onerror);
};

function onconnection (socket) {
  socket._antena_receptor = this._antena_receptor;
  socket.on("error", onerror);
  socket.setNoDelay(true);
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
  if (string[0] === "@") {
    Messaging.input(this, receive);
  } else if (string[0] === "#") {
    Messaging.input(this, receive_error);
    const connection = this._antena_receptor._connections[this._antena_session];
    if (connection && !Array.isArray(connection)) {
      this.destroy(new Error("Already connected"));
    } else {
      if (Array.isArray(connection)) {
        for (let index = 0; index < connection.length; index++) {
          Messaging.output(this, connection[index]);
        }
      }
      this._antena_send = _antena_send;
      this._antena_receptor._connections[this._antena_session] = this;
      this.on("close", onclose);
    }
  } else {
    this.destroy(new Error("Initial message should start with either '@' or '#', got: "+string));
  }
}

function _antena_send (string) {
  Messaging.output(this, string);
}

function onclose () {
  delete this._antena_receptor._connections[this._antena_session];
}

function receive (string) {
  if (string[0] === "?") {
    this._antena_receptor.onrequest(this._antena_session, string.substring(1), (string) => {
      Messaging.output(this, string);
    });
  } else if (string[0] === "!") {
    this._antena_receptor.onmessage(this._antena_session, string.substring(1));
  } else {
    this.destroy(new Error("Incoming message should start with either '?' or '!', got: "+string));
  }
}

function receive_error (string) {
  this.destroy(new Error("This socket should not receive anything, got: "+string));
}
