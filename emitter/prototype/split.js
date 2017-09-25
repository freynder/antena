
module.exports = function (prototype) {
  return function (splitters) {
    var emitters = {};
    for (var i=0; i<splitters.length; i++) {
      emitters[splitters[i]] = Object.create(prototype);
      Object.assign(emitters[splitters[i]], this);
      emitters[splitters[i]]._prefix += "/"+splitters[i];
    }
    return emitters;
  };
};
