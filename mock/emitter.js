
module.exports = (receptor, session) => {
  const emitter = {
    _receptor: receptor,
    _antena_send: _antena_send,
    session: session,
    onmessage: null,
    request,
    send,
  };
  if (session in receptor._connections) {
    if (!Array.isArray(receptor._connection[session]))
      throw new Error("Already connected");
    setImmediate(flush, emitter, connection._emitters[session]);
  }
  receptor._connections[session] = emitter;
  return emitter;
};

const flush = (emitter, pendings) => {
  for (let index = 0; index < pendings.length; index++) {
    emitter.onmessage(pendings[index]);
  }
};

function request (query) {
  let result = null;
  let done = false;
  this._receptor.onrequest(this.session, query, (argument) => {
    done = true;
    result = argument;
  });
  if (!done)
    throw new Error("The mock-receptor did not invoke the callback synchronously.");
  return result;
}

function send (message) {
  this._receptor.onmessage(this.session, message);
}

function _antena_send (message) {
  this.onmessage(message);
}
