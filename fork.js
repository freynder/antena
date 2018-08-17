module.exports = function fork (splitter) {
  const spawn = Object.create(Object.getPrototypeOf(this));
  Object.assign(spawn, this);
  spawn._prefix += "/"+splitter;
  return spawn;
};