
module.exports = (receptor, session, callback) => {
  const emitter = {
    __proto__: null,
    _receptor: receptor,
    _termcb: null,
    session,
    pull,
    post,
    onpush,
    terminate,
    destroy
  };
  const connection = {
    __proto__: null,
    emitter,
    push: push0
  };
  if (receptor._connect(session, connection)) {
    callback(null, emitter);
  } else {
    receptor.onerror(session, new Error("Emitter already connected"));
    callback(new Error("Emitter already connected"));
  }
};

function push0 (token) {
  this.push = push;
};

function push (message) {
  setTimeout(pushcb, 0, this.emitter, message);
}

const pushcb = (emitter, message) => {
  emitter.onpush(message);
};

const onpush = (message) => {
  throw new Error("Lost push message: "+message);
};

function post (message) {
  if (!this._receptor)
    throw new Error("Emitter terminated/destroyed");
  setTimeout(postcb, 0, this._receptor, this.session, message);
};

const postcb = (receptor, session, message) => {
  receptor.onpost(session, message);
};

function pull (message) {
  if (!this._receptor)
    throw new Error("Emitter terminated/destroyed");
  let result = null;
  let done = false;
  this._receptor.onpull(this.session, message, (argument) => {
    done = true;
    result = argument;
  });
  if (!done)
    throw new Error("Callback not synchronously called");
  return result;
}

function terminate (callback) {
  if (!this._receptor)
    return callback(new Error("Emitter already terminated/destroyed"));
  this._receptor._disconnect(this.session);
  this._receptor = null;
  callback(null);
};

function destroy () {
  if (!this._receptor)
    return false;
  this._receptor._disconnect(this.session);
  this._receptor = null;
  receptor.onerror(session, new Errro("Emitter destroyed by the user"));
};
