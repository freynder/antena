const Client = require("./client.js");
Client("antena-traffic", "browser-session", (error) => {
  if (error) {
    throw error;
  }
});