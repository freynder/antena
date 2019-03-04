
const Messaging = require("./messaging.js");

module.exports = function () {
  return (socket) => {
    socket.setNoDelay(true);
    Messaging(socket);
    socket._antena_receptor = this;
    socket._antena_session = null;
    socket._antena_receive = receive0;
    socket._antena_connection = null;
    socket.on("error", onerror0);
    socket.on("end", onend0);
  };
};

const destroy = (socket, error) => {
  socket.removeAllListeners("error");
  socket.removeAllListeners("data");
  socket.removeAllListeners("end");
  socket.destroy();
  if (error) {
    socket._antena_receptor.onerror(socket._antena_session, error);
  }
};

function push (message) {
  this.socket1._antena_send(message);
}

function onerror0 (error) {
  destroy(this, error);
}

function onerror1 (error) {
  this._antena_receptor._disconnect(this._antena_session);
  if (this._antena_connection.socket2)
    destroy(this._antena_connection.socket2);
  destroy(this, error);
}

function onerror2 (error) {
  this._antena_receptor._disconnect(this._antena_session);
  destroy(this._antena_connection.socket1);
  destroy(this, error);
}

function onend0 () {
  destroy(this, new Error("End before session message"));
}

function onend1 () {
  if (!this._antena_connection.ending) {
    onerror.call(this, new Error(""));
  }
}

function onend2 () {
  this._antena_connection.ending = true;
  this._antena_connection.socket1.end();
  this._antena_connection.socket2.end();
  this._antena_receptor._disconnect(this._antena_session);
}

function receive0 (message) {
  if (message[0] === "@") {
    const session = message.substring(1);
    const connection = {
      __proto__: null,
      push,
      socket1: this,
      socket2: null,
      ending: true
    };
    this._antena_session = session;
    if (this._antena_receptor._connect(session, connection)) {
      this._antena_connection = connection;
      this._antena_receive = receive1;
      this.removeAllListeners("error");
      this.removeAllListeners("end");
      this.on("error", onerror1);
      this.on("end", onend1);
    } else {
      destroy(this, new Error("Cannot connect asynchronous socket"));
    }
  } else if (message[0] === "$") {
    const token = message.substring(1);
    const session = this._antena_receptor._sessions[token];
    const connection = this._antena_receptor._connections[session];
    this._antena_session = session;
    if (connection.push === push) {
      if (connection.socket2) {
        destroy(this, new Error("Cannot connect synchronous socket"))
      } else {
        connection.socket2 = this;
        this._antena_connection = connection;
        this._antena_receive = receive2;
        this.removeAllListeners("error");
        this.removeAllListeners("end");
        this.on("error", onerror2);
        this.on("end", onend2);
      }
    } else {
      destroy(this, new Error("Cannot connect synchronous socket (incompatible connection)"));
    }
  } else {
    destroy(this, new Error("Session message should start with either '$' (sync) or '@' (async)"));
  }
}

function receive1 (message) {
  onerror.call(this, new Error("Should not receive any message, got: "+message));
}

function receive2 (message) {
  if (message[0] === "?") {
    this._antena_receptor.onpull(this._antena_session, message.substring(1), (message) => {
      this._antena_send(message);
    });
  } else if (message[0] === "!") {
    this._antena_receptor.onpost(this._antena_session, message.substring(1));
  } else {
    onerror.call(this, new Error("Messages should start with either '?' (pull) or '!' (post), got: "+message));
  }
}
