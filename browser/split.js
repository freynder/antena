module.exports = (url, splitter) => {
  if (url.startsWith("http://")) {
    url = url.substring(url.indexOf("/", 7));
  }
  if (url.startsWith("/") && url.indexOf(splitter) === 1) {
    return url.substring(splitter.length + 2);
  }
};