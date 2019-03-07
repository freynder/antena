
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
    socket.on("close", onclose0);
    socket.on("end", onend);
  };
};

function onclose0 () {
  this.destroy(new Error("'close' before session message"));
}

function onerror1 (error) {
  this._antena_receptor._disconnect(this._antena_session, this);
}

function onend () {
  if (this.writable) {
    this.end();
  }
}

function onend1 () {
  this._antena_receptor._disconnect(this._antena_session, this);
}

function terminate () {
  this.end();
  this._antena_receptor._disconnect(this._antena_session, this);
}

function receive0 (message) {
  this.removeListener("close", onclose0);
  if (message[0] === "@") {
    const session = message.substring(1);
    this._antena_session = session;
    this._antena_push = this._antena_send;
    this._antena_terminate = terminate;
    if (this._antena_receptor._connect(session, this)) {
      this.on("end", onend1);
      this.on("error", onerror1);
      this._antena_receive = receive1;
    } else {
      this.destroy(new Error("Already connected"));
    }
  } else if (message[0] === "$") {
    this._antena_token = message.substring(1);
    this._antena_session = this._antena_receptor._authentify(this._antena_token);
    if (this._antena_session) {
      this._antena_receive = receive2;
    } else {
      this.destroy(new Error("Invalid token"));
    }
  } else {
    this.destroy(new Error("Invalid session message"));
  }
}

function receive1 (message) {
  this.destroy(new Error("Synchronous node socket should not receive any message"));
}

function receive2 (message) {
  if (this._antena_receptor._authentify(this._antena_token) === this._antena_session) {
    if (message[0] === "?") {
      this._antena_receptor.onpull(this._antena_session, message.substring(1), (message) => {
        this._antena_send(message);
      });
    } else if (message[0] === "!") {
      this._antena_receptor.onpost(this._antena_session, message.substring(1));
    } else if (message === ".") {
      this._antena_receptor._revoke(this._antena_token);
    } else {
      this.destroy(new Error("Asynchronous node socket got an invalid message"));
    }
  } else {
    this.destroy(this, new Error("Asynchronous node socket used a rvoked token"));
  }
}
