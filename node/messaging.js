
let BUFFER = Buffer.allocUnsafe(1024);

module.exports = (socket) => {
  socket._antena_buffer = Buffer.allocUnsafe(1024);
  socket._antena_current = 0;
  socket._antena_target = Infinity;
  socket._antena_send = send;
  socket.on("data", ondata);
}

function send (message) {
  let bytelength = BUFFER.write(message, 4, "utf8") + 4;
  if (bytelength > BUFFER.length - 8) {
    bytelength = Buffer.byteLength(message, "utf8") + 4;
    BUFFER = Buffer.allocUnsafe(bytelength + 8);
    BUFFER.write(message, 4, "utf8");
  }
  BUFFER.writeUInt32LE(bytelength, 0);
  this.write(BUFFER.slice(0, bytelength));
};

function ondata (buffer) {
  if (this._antena_current === 0) {
    if (buffer.length < 4) {
      buffer.copy(this._antena_buffer);
      this._antena_current = buffer.length;
    } else {
      const bytelength = buffer.readUInt32LE(0);
      if (buffer.length >= bytelength) {
        this._antena_receive(buffer.toString("utf8", 4, bytelength));
        if (buffer.length > bytelength) {
          ondata.call(this, buffer.slice(bytelength));
        }
      } else {
        if (buffer.length >= this._antena_buffer.length) {
          this._antena_buffer = buffer;
        } else {
          buffer.copy(this._antena_buffer);
        }
        this._antena_current = buffer.length;
        this._antena_target = bytelength;
      }
    }
  } else {
    if (this._antena_buffer.length < this._antena_current + buffer.length) {
      const temporary = this._antena_buffer;
      this._antena_buffer = Buffer.allocUnsafe(this._antena_current + buffer.length);
      temporary.copy(this._antena_buffer);
    }
    buffer.copy(this._antena_buffer, this._antena_current);
    this._antena_current += buffer.length;
    if (this._antena_current >= 4 && this._antena_current - buffer.length < 4) {
      this._antena_target = this._antena_buffer.readUInt32LE(0);
    }
    if (this._antena_current >= this._antena_target) {
      this._antena_receive(this._antena_buffer.toString("utf8", 4, this._antena_target));
      this._antena_current = 0;
      this._antena_target = Infinity;
      if (this._antena_current > this._antena_target) {
        ondata.call(this, this._antena_buffer.slice(this._antena_target, this._antena_current));
      }
    }
  }
}
