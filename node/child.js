const Fs = require("fs");
const Request = require("./request.js");
const empty = Buffer.from("");
process.on("message", ([channel, secure, options, body]) => {
  Request(secure, options, body, (error, response) => {
    Fs.writeFile(channel+".res", JSON.stringify([error?error.message:null, response]), "utf8", (error) => {
      if (error)
        throw error;
      Fs.writeFile(channel+".sem", empty, (error) => {
        if (error) {
          throw error;
        }
      });
    });
  });
});
process.on("disconnect", () => {
  process.exit(0);
});