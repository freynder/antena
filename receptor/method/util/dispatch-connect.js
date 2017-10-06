
module.exports = function (receptor, path, con) {
  var segments = path.split("/");
  segments.shift();
  while (true) {
    if (receptor._onconnect)
      return receptor._onconnect("/"+segments.join("/"), con);
    receptor = (segments[0] in receptor._childs) ? receptor._childs[segments.shift()] : receptor._default;
  }
};
