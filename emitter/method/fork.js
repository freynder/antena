
module.exports = function (splitter) {
  var emitter = Object.create(Object.getPrototypeOf(this));
  Object.assign(emitter, this);
  emitter._prefix += "/"+splitter;
  return emitter;
};
