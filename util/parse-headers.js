
module.exports = function (lines) {
  var headers = {};
  for (var i=1, l=lines.length; i<l; i++) {
    var index = lines[i].indexOf(": ");
    if (index !== -1) {
      headers[lines[i].substring(0, index).toLowerCase()] = lines[i].substring(index+2);
    }
  }
  return headers;
};
