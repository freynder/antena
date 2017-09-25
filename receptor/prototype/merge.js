
module.exports = function (prototype) {
  return function (receptors) {
    for (var key in receptors) {
      if (!receptors[key]._childs && !(receptors[key]._onrequest && receptors[key]._onconnect)) {
        throw new Error("childs["+JSON.stringify(key)+"] is not a receptor");
      }
    }
    var self = Object.create(prototype);
    self._childs = receptors;
    self._default = this;
    return self;
  };
};
