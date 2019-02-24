
const CONNECTING = 0;
const OPEN = 1;
const CLOSING = 2;
const CLOSED = 3;

const noop = () => {};

module.exports = (receptor, session) => {
  const emitter = {
    _receptor: receptor,
    _antena_send: _antena_send,
    readySate: CONNECTING,
    session: session,
    onopen: noop,
    onmessage: noop,
    onclose: noop,
    close,
    request,
    send,
  };
  setTimeout(onopen, 0, emitter);
  return emitter;
};

const onopen = (emitter) => {
  if (emitter.session in emitter._receptor._connections) {
    if (Array.isArray(emitter._receptor._connections[emitter.session])) {
      const pendings = emitter._receptor._connections[emitter.session];
      emitter._receptor._connections[emitter.session] = emitter;
      emitter.onopen({
        type: "open",
        target: emitter
      });
      for (let index = 0; index < pendings.length; index++) {
        emitter.onmessage({data:pendings[index]});
      }
    } else {
      emitter.readyState = CLOSED;
      emitter.onclose({
        type: "close",
        target: emitter,
        wasClean: false,
        code: "ALREADY_CONNECTED",
        reason: "Already connected"
      });
    }
  } else {
    emitter._receptor._connections[emitter.session] = emitter;
    emitter.onopen({
      type: "open",
      target: emitter
    });
  }
};

const onclose = (emitter) => {
  emitter.readyState = CLOSED;
  delete emitter._receptor._connections[emitter.session];
  emitter.onclose({
    type: "close",
    target: emitter,
    wasClean: true,
    code: 1000,
    reason: ""
  });
};

function close () {
  this.readyState = CLOSING;
  setTimeout(onclose, 0, this);
}

function request (query) {
  let result = null;
  let done = false;
  this._receptor.onrequest(this.session, query, (argument) => {
    done = true;
    result = argument;
  });
  if (!done)
    throw new Error("Receptor did not invoke the callback synchronously");
  return result;
}

function send (message) {
  this._receptor.onmessage(this.session, message);
}

function _antena_send (message) {
  this.onmessage({
    type: "message",
    target: this,
    data:message
  });
}
