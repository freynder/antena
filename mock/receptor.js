
module.exports = () => ({
  _emitters: Object.create(null),
  onmessage: null,
  onrequest: null,
  send
});

function send (session, message) {
  if (session in this._emitters)
    return this._emitters[session].onmessage(message)
  this._emitters[session] = [message];
  this._emitters[session].onmessage = Array.prototype.push();
}
