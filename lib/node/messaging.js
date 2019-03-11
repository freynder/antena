
let BUFFER = Buffer.allocUnsafe(1024);

module.exports = (socket) => {
  socket._antena_buffer = Buffer.allocUnsafe(1024);
  socket._antena_length = 0;
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
  debugger;
  while (buffer.length) {
    // Not enough data to compute the message's bytelength
    if (this._antena_length + buffer.length < 4) {
      buffer.copy(this._antena_buffer, this._antena_length);
      this._antena_length += buffer.length;
      break;
    }
    // Optimization when the antena buffer is empty
    if (this._antena_length === 0) {
      const target = buffer.readUInt32LE(0);
      if (buffer.length >= target) {
        this._antena_receive(buffer.toString("utf8", 4, target));
        buffer = buffer.slice(target);
        continue;
      }
    }
    // Make sure the antena buffer has enough byte to read the message's bytelength
    if (this._antena_length < 4) {
      buffer.copy(this._antena_buffer, this._antena_length, 0, 4 - this._antena_length);
      buffer = buffer.slice(4 - this._antena_length);
      this._antena_length = 4;
    }
    // Read the message's bytelength
    const target = this._antena_buffer.readUInt32LE(0);
    // Copy the part of the input buffer that is still in the current message boundary
    const tocopy = Math.min(buffer.length, target - this._antena_length);
    if (this._antena_buffer.length < target + tocopy) {
      const temporary = this._antena_buffer;
      this._antena_buffer = Buffer.allocUnsafe(target + tocopy);
      temporary.copy(this._antena_buffer, 0, 0, this._antena_length);
    }
    buffer.copy(this._antena_buffer, this._antena_length, 0, tocopy);
    buffer = buffer.slice(tocopy);
    this._antena_length += tocopy;
    // We reached the message boundary
    if (this._antena_length === target) {
      this._antena_receive(this._antena_buffer.toString("utf8", 4, target));
      this._antena_length = 0;
    }
  }
}
