
module.exports = function (receptors) {
  var receptor = Object.create(Object.getPrototypeOf(this));
  receptor._childs = receptors;
  receptor._default = this;
  return receptor;
};
