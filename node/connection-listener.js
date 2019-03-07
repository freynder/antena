
const Messaging = require("./messaging.js");

module.exports = function () {
  return (socket) => {
    socket.setNoDelay(true);
    Messaging(socket);
    socket._antena_receptor = this;
    socket._antena_receive = receive0;
    socket._antena_session = null;
    socket._antena_token = null;
    socket._antena_push = null;
    socket._antena_terminate = null;
    socket.on("error", onerror);
    socket.on("end", onend);
  };
};

const destroy (socket, error) {
  socket.removeListener("end", onend);
  socket.removeListener("error", onerror);
  socket.destroy();
  socket._antena_receptor._disconnect(socket._antena_session, socket);
  socket._antena_receptor.onerror(socket._antena_session, error);
}

function onerror (error) {
  destroy(this, error);
}

function onend () {
  if (this._antena_session) {
    destroy(socket, new Error("'end' before session message"));
  } else {
    this._antena_receptor._disconnect(this._antena_session, this);
  }
}

function terminate () {
  this.end();
  this._antena_receptor._disconnect(this._antena_session, this);
}

function receive0 (message) {
  if (message[0] === "@") {
    const session = message.substring(1);
    if (this._antena_receptor._connect(session, this)) {
      this._antena_session = session;
      this._antena_receive = receive1;
      this._antena_push = this._antena_send;
      this._antena_terminate = terminate;
    } else {
      destroy(this, new Error("Already connected"));
    }
  } else if (message[0] === "$") {
    const token = message.substring(1);
    const session = this._antena_receptor._authentify(token);
    if (session) {
      this._antena_token = token;
      this._antena_session = session;
      this._antena_receive = receive2;
    } else {
      destroy(this, new Error("Invalid token"));
    }
  } else {
    destroy(this, new Error("Invalid session message"));
  }
}

function receive1 (message) {
  destroy(this, new Error("Should not receive any message"));
}

function receive2 (message) {
  if (this._antena_receptor._authentify(this._antena_session, this._antena_token)) {
    if (message[0] === "?") {
      this._antena_receptor.onpull(this._antena_session, message.substring(1), (message) => {
        this._antena_send(message);
      });
    } else if (message[0] === "!") {
      this._antena_receptor.onpost(this._antena_session, message.substring(1));
    } else if (message === ".") {
      this._antena_receptor._revoke(session);
    } else {
      destroy(this, new Error("Invalid message"));
    }
  } else {
    destroy(this, new Error("Token revoked"));
  }
}
