module.exports = function (lines) {
  const headers = {};
  for (let i=1, l=lines.length; i<l; i++) {
    let index = lines[i].indexOf(": ");
    if (index !== -1) {
      headers[lines[i].substring(0, index).toLowerCase()] = lines[i].substring(index+2);
    }
  }
  return headers;
};