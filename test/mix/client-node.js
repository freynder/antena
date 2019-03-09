const Client = require("./client.js");
Client(process.argv[2], "node-session-"+String(process.argv[2]), (error) => {
  if (error)
    throw error;
  console.log("ok");
});