
function ondata (buffer) {
  console.log("yo", buffer, JSON.stringify(buffer.toString()));
  if (this._antena_length === 0) {
    if (buffer.length < 4) {
      buffer.copy(this._antena_buffer);
      this._antena_length = buffer.length;
    } else {
      const boundary = buffer.readUInt32BE(0) + 4;
      if (buffer.length >= boundary) {
        this._antena_receive(buffer.toString("utf8", 4, boundary));
        if (buffer.length > boundary) {
          ondata.call(this, buffer.slice(0, boundary));
        }
      } else {
        if (this._antena_buffer.length <= buffer.length) {
          this._antena_buffer = buffer;
        } else {
          buffer.copy(this._antena_buffer);
        }
        this._antena_length = buffer.length;
        this._antena_boundary = boundary;
      }
    }
  } else {
    if (this._antena_buffer.length < this._antena_length + buffer.length) {
      this._antena_buffer = this._antena_buffer.copy(Buffer.allocUnsafe(this._antena_length + buffer.length));
    }
    buffer.copy(this._antena_buffer, this._antena_length);
    this._antena_length += buffer.length;
    if (this._antena_length >= 4 && this._antena_length - buffer.length < 4) {
      this._antena_boundary = this._antena_buffer.readUInt32BE(0) + 4;
    }
    if (this._antena_length >= this._antena_boundary) {
      this._antena_receive(this._antena_buffer.toString("utf8", 4, this._antena_boundary));
      const remainder = this._antena_buffer.slice(this._antena_boundary, this._antena_length);
      this._antena_length = 0;
      this._antena_boundary = Infinity;
      if (remainder.length) {
        ondata.call(this, remainder);
      }
    }
  }
}

exports.initialize = (socket) => {
  socket.on("data", ondata);
  socket._antena_length = 0;
  socket._antena_buffer = Buffer.allocUnsafe(1024);
  socket._antena_boundary = Infinity;
  socket._antena_socket = socket;
};

exports.input = (socket, callback) => {
  socket._antena_receive = callback;
};

exports.output = (socket, message) => {
  const length = Buffer.byteLength(message, "utf8");
  const buffer = Buffer.allocUnsafe(length+4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(message, 4, length, "utf8");
  socket.write(buffer);
};
