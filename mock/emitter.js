
module.exports = (receptor, session) => {
  const emitter = {
    _session: session,
    _receptor: receptor,
    onmessage: null
    request,
    send,
  };
  if (session in receptor._emitters) {
    if (!Array.isArray(receptor._emitters[session]))
      throw new Error("Already connected");
    setImmediate(flush, emitter, receptor._emitters[session]);
  }
  receptor._emitters[session] = emitter;
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
  this._receptor.onrequest(this._session, query, (argument) => {
    done = true;
    result = argument;
  });
  if (!done)
    throw new Error("The mock-receptor did not invoke the callback synchronously.");
  return result;
}

function send (message) {
  this._receptor.onmessage(this._session, message);
}
