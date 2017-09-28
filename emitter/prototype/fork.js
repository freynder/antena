
module.exports = function (prototype) {
  return function (splitter) {
    var emitter = Object.create(prototype);
    Object.assign(emitter, this);
    emitter._prefix += "/"+splitter;
    return emitter;
  };
};
