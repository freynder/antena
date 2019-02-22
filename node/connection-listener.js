
const Messaging = require("./messaging.js");

module.exports = function () {
  return (socket) => {
    Messaging(socket);
    socket._antena_receptor = this;
    socket._antena_receive = receive_initial;
    socket.on("error", onerror);
    socket.setNoDelay(true);
  };
};

function onerror (error) {
  this._antena_receptor.onerror(this._antena_session, error);
}

function receive_initial (string) {
  this._antena_session = string.substring(1);
  if (string[0] === "?") {
    this._antena_receive = receive_request;
  } else if (string[0] === "!") {
    this._antena_receive = receive_message;
    const connection = this._antena_receptor._connections[this._antena_session];
    if (connection && !Array.isArray(connection)) {
      this.destroy(new Error("Already connected"));
    } else {
      if (Array.isArray(connection)) {
        for (let index = 0; index < connection.length; index++) {
          this._antena_send(connection[index]);
        }
      }
      this._antena_receptor._connections[this._antena_session] = this;
      this.on("close", onclose);
    }
  } else {
    this.destroy(new Error("Initial message should start with either '?' or '!', got: "+string));
  }
}

function onclose () {
  delete this._antena_receptor._connections[this._antena_session];
}

function receive_request (string) {
  this._antena_receptor.onrequest(this._antena_session, string, (string) => {
    this._antena_send(string);
  });
}

function receive_message (string) {
  this._antena_receptor.onmessage(this._antena_session, string);
}
