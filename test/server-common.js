module.exports = (server) => {
  server.onmessage = (session, message) => {
    console.log("ONMESSAGE", session, message);
    server.send(session, message+message);
  }
  server.onrequest = (session, request, callback) => {
    console.log("ONREQUEST", session, request);
    callback(request+request);
  }
};