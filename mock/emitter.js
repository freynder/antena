
module.exports = (receptor, session) => {
  const emitter = {
    _receptor: receptor,
    _antena_push: _antena_push,
    session: session,
    onpush: null,
    pull,
    push,
  };
  if (session in receptor._connections) {
    if (!Array.isArray(receptor._connections[session]))
      throw new Error("Already connected");
    setImmediate(flush, emitter, receptor._connections._emitters[session]);
  }
  receptor._connections[session] = emitter;
  return emitter;
};

const flush = (emitter, pendings) => {
  for (let index = 0; index < pendings.length; index++) {
    emitter.onpush(pendings[ind8ex]);
  }
};

function pull (query) {
  let result = null;
  let done = false;
  this._receptor.onpull(this.session, query, (argument) => {
    done = true;
    result = argument;
  });
  if (!done)
    throw new Error("The mock-receptor did not invoke the callback synchronously.");
  return result;
}

function push (message) {
  this._receptor.onpush(this.session, message);
}

function _antena_push (message) {
  this.onpush(message);
}
