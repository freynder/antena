module.exports = function (host) {
  if (Number(host))
    return {hostname:"localhost", port:Number(host)};
  if (host.indexOf("/") !== -1)
    return {unix:host};
  if (host.indexOf(":") !== -1)
    return {hostname:host.split(":")[0], port:Number(host.split(":")[1])};
  return {hostname:host};
};
