
const Messaging = require("./messaging.js");

module.exports = (server) => {

  const connections = {};

  const receptor = {
    send,
    onrequest: null,
    onmessage: null
  };

  server.on("connection", (socket) => {
    socket.on("error", onerror);
    Messaging.initialize(socket);
    Messaging.input(socket, receive_initial);
  });

  function onerror (error) {
    console.log("Socket error "+this._antena_session+": "+error.message);
  };

  function send (session, message) {
    if (session in connections) {
      if (Array.isArray(connections[session])) {
        connections[session].push(message);
      } else {
        Messaging.output(connections[session], message);
      }
    } else {
      connections[session] = [message]
    }
  }

  function receive_initial (string) {
    console.log("initial", string);
    this._antena_session = string.substring(1);
    if (string[0] === "?") {
      Messaging.input(this, receive_request);
    } else if (string[0] === "_") {
      Messaging.input(this, receive_message);
      if (this._antena_session in connections && !Array.isArray(connections[this._antena_session])) {
        this.destroy(new Error("Already connected"));
      } else {
        if (Array.isArray(connections[this._antena_session])) {
          for (let index = 0; index < connections[this._antena_session].length; index++) {
            this.send(Output(connections[this._antena_session][index]));
          }
        }
        connections[this._antena_session] = this;
        this.on("close", onclose);
      }
    } else {
      this.destroy(new Error("Initial message should start with either '?' or '_'"));
    }
  }

  function onclose () {
    delete connections[this._antena_session];
  }

  function receive_request (string) {
    console.log("request", string);
    receptor.onrequest(this._antena_session, string, (string) => {
      Messaging.output(this, string);
    });
  }

  function receive_message (string) {
    console.log("message", string);
    receptor.onmessage(this._antena_session, string);
  }

  return receptor;

};
