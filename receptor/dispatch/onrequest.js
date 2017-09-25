
module.exports = function onrequest (receptor, method, path, headers, body, callback) {
  var segments = path.split("/");
  segments.shift();
  while (true) {
    if (receptor._onrequest)
      return receptor._onrequest(method, "/"+segments.join("/"), headers, body, callback);
    receptor = (segments[0] in receptor._childs) ? receptor._childs[segments.shift()] : receptor._default;
  }
};
