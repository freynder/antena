
module.exports = (options = {}, session = Math.random().toString(36).substring(2)) => {
  if (typeof options === "string")
    options = {splitter:options};
  const secure = options.secure || location.protocol === "https:" ? "s" : "";
  const hostname = options.hostname || location.hostname;
  const port = (options.port||location.port) ? ":" + (options.port||location.port) : "";
  const splitter = options.splitter || "__antena__";
  const emitter = new WebSocket("ws"+secure+"://"+hostname+port+"/"+splitter+"/"+session);
  emitter._antena_url = "http"+secure+"://"+hostname+port+"/"+splitter+"/"+session;
  emitter.session = session;
  emitter.request = request;
  return emitter;
};

function request (query) {
  const request = new XMLHttpRequest();
  request.open("PUT", this._antena_url, false);
  request.setRequestHeader("Content-Type", "text/plain;charset=UTF-8");
  request.send(query);
  if (request.status !== 200)
    throw new Error("Unexpected HTTP status code: "+request.status);
  return request.responseText;
}
