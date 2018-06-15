module.exports = (antena) => {
  antena.request("PUT", "/bar", {}, "async-request", (error, response) => {
    if (error)
      throw error;
    console.log("Response", response);
  });
  console.log(antena.request("PUT", "/bar", {}, "sync-request"));
  const websocket = antena.WebSocket("/bar");
  websocket.onmessage = (event) => { console.log(event.data) };
};