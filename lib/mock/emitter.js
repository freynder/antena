
const StandalonePromise = require("../standalone-promise.js")

module.exports = (receptor, session, callback) => {
  const emitter = StandalonePromise();
  emitter._receptor = receptor;
  emitter._token = null;
  emitter._terminated = false;
  emitter._antena_push = push;
  emitter.session = session;
  emitter.pull = pull;
  emitter.post = post;
  emitter.terminate = terminate;
  emitter.destroy = destroy;
  emitter.onpush = onpush;
  emitter.onterminate = onterminate;
  if (receptor._connect(session, emitter)) {
    callback(null, emitter);
  } else {
    callback(new Error("Emitter already connected"));
  }
};

////////////
// Helper //
////////////

const failure = (emitter, error) => {
  emitter._receptor._disconnect(emitter.session, emitter);
  emitter._pending = false;
  emitter._reject(error);
};

const success = (emitter) => {
  emitter.onterminate();
  emitter._receptor._revoke(emitter._token);
  emitter._pending = false;
  emitter._resolve(null);
};

const pushcb = (emitter, message) => {
  emitter.onpush(message);
};

const postcb = (emitter, message) => {
  emitter._receptor.onpost(emitter.session, message);
};

const terminatecb = (emitter) => {
  if (emitter._receptor._disconnect(emitter.session, emitter)) {
    setImmediate(success, emitter);
  }
};

////////////////
// Connection //
////////////////

function push (message) {
  if (this._token === null) {
    this._token = message;
  } else {
    setImmediate(pushcb, this, message);
  }
}

/////////////
// Emitter //
/////////////

const onterminate = () => {};

const onpush = (message) => {
  throw new Error("Lost push message: "+message);
};

function pull (message) {
  if (this._pending) {
    let result = null;
    let done = false;
    this._receptor.onpull(this.session, message, (argument0) => {
      done = true;
      result = argument0;
    });
    if (done)
      return result;
    failure(this, new Error("Callback not synchronously called"));
  }
  return null;
}

function terminate () {
  if (!this._pending || this._terminated)
    return false;
  this._terminated = true;
  setImmediate(terminatecb, this);
  return true;
}

function post (message) {
  if (this._pending)
    setImmediate(postcb, this, message);
  return this._pending;
};

function destroy () {
  if (!this._pending)
    return false;
  failure(this, new Error("Emitter destroyed by the user"));
  return true;
};
