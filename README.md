# Antena

Antena is yet an other JavaScript communication library.
Antena normalises the server-client model for node and browsers.
In Antena, the server is called receptor and its clients are called emitters.
Both receptors and emitters can perform push notifications but only emitters can perform synchronous pull requests.
For node emitters, synchronous pull requests are implemented using [posix-socket](https://www.npmjs.com/package/posix-socket) which is much faster than using the synchronous methods of `child_process` or `fs`.

```js
const AntenaReceptor = require("antena/lib/receptor");
const receptor = AntenaReceptor();
receptor.onpull = (session, message, callback) => {
  console.assert(session === "antena-rocks");
  callback(message+"World");
};
receptor.onpost = (session, message) => {
  console.assert(session === "antena-rocks");
  receptor.push(session, message+"Bar");
};
receptor.terminate = (session, (error) => {
  // Politely 
});
// For Node Emitters
const server1 = require("net").createServer(8080);
const onconnection = receptor.ConnectionListener()
server1.on("connection", onconnection);
// For Browser Emitters
const server2 = require("http").createServer(8000);
const onrequest = receptor.RequestMiddleware("_ANTENA_");
server2.on("request", (request, response) => {
  onrequest(request, response, () => {
    // Request not handled by antena
  });
});
const onupgrade = receptor.UpgradeMiddleware("_ANTENA_");
server2.on("upgrade", (request, socket, head) => {
  onupgrade(request, response, () => {
    // Upgrade not handled by Antena
  });
});
```

```js
const AntenaEmitter = require("antena/lib/emitter");
const callback = (error, emitter) => {
  if (error)
    throw error;
  emitter.then(() => {
    // The emitter closed normally.
    // The emitter can no longer be used.
  }, (error) => {
    // An (a)synchronous error occurred.
    // The emitter can no longer be used.
  });
  console.assert(emitter.pull("Hello") === "HelloWorld");
  emitter.push("Foo");
  emitter.onpush = (message) => {
    console.assert(messsage === "FooBar");
    emitter.terminate();
    // Emitter is still fully usable after calling terminate.
  };
  emitter.onterminate = () => {
    // Emitter will no longer receive push events.
    // Post an pull can still be performed in this callback.
    // After returning, the emitter will be resolved. 
  };
};
// Mock Emitter
AntenaEmitter(receptor, "antena-rocks", callback);
// Node Emitter
AntenaEmitter(8080, "antena-rocks", callback);
// Browser Emitter
AntenaEmitter("_ANTENA_", "antena-rocks", callback);
```

## Receptor

### `receptor = require("antena/receptor")()`

Create a new receptor.

* `receptor :: antena.Receptor`

### `receptor.push(session, message)`

Push a message to an emitter identified by its session.

* `session :: string`
* `message :: string`

### `receptor.terminate(session, (error) => { ... })`

Attempt to gracefully close a connection.

* `session :: string`
* `error :: Error`

### `receptor.onpost = (session, message) => { ... }`

Handler for `emitter.post(message)`.

* `session :: string`
* `message :: string`

### `receptor.onpull = (session, message, callback) => { ... }`

Handler for `emitter.pull(message)`.

* `receptor :: antena.Receptor`
* `session :: string`
* `message :: string`
* `callback(message)`
  * `message :: String`

### `onconnection = receptor.ConnectionListener()`

Create a listener for the `connection` event of a `net.Server`.

* `receptor :: antena.Receptor`
* `onconnection(socket)`
  * `socket :: net.Socket`

### `onrequest = receptor.RequestMiddleware([splitter])`

Create a middleware for the `request` event of a `http(s).Server`.

* `receptor :: antena.Receptor`
* `splitter :: string`, default: `"__antena__"`
  A string used to single out the traffic from an emitter.
* `handled = onrequest(request, response, [next])`
  * `request :: (http|https).IncomingMessage`
  * `response :: (http|https).ServerResponse`
  * `next()`:
    Called if the request was not handled by Antena (if defined).
  * `handled :: boolean`:
    Indicates whether the request was handled by Antena.

### `onupgrade = receptor.UpgradeMiddleware([splitter])`

Create a middleware for the `upgrade` event of a `http(s).Server`.

* `receptor :: antena.Receptor`
* `splitter :: string`, default: `"__antena__"`
  A string used to single out the traffic from an emitter.
* `handled = onupgrage(request, socket, head, [next])`
  * `request :: http.IncomingMessage`
  * `socket :: (net|tls).Socket`
  * `head :: Buffer`
  * `next()`:
    Called if the upgrade request was not handled by Antena (if defined).
  * `handled :: boolean`
    Indicate whether the upgrade request was handled by Antena.

## Emitter

Emitter are [promises](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) which represents the lifetime of the connection.

### `emitter = require("antena/emitter")(address, session)`

* `address :: object | string | number | antena.Receptor`:
  Antena will choose one of the below three mode:
  * If `window` is defined, Antena will perform a browser connection.
    The address should then be:
    * `object`:
      An option object with the following fields:
      * `secure :: boolean`, default: `location.protocol === "https:`
      * `hostname :: string`, default: `location.hostname`
      * `port :: number`, default: `location.port`
      * `splitter :: string`, default: `"__antena__"`
    * `string`, alias for `{splitter:address}`.
  * Else, if `address` is not an object, Antena will perform a node connection.
    The address should then be: 
    * `string`
      * Port string; eg `"8080"`: alias for `"[::1]:8080"`
      * Local socket address;  eg `/tmp/antena.sock`
      * IPv4 and port; eg `127.0.0.1:8080`
      * IPv6 and port: eg `[::1]:8080`
    * `number`, alias for `"[::1]:"+address`
  * Else, the address should be `antena.Receptor` and Antena will perform a local mock connection.
* `session :: string`:
  All subsequent push/pull requests will be tagged with this string.

### `emitter.session :: string`

### `emitter.terminate()`

Attempt to perform a graceful shutdown, the emitter is still fully usable.

* `callback(error)`
  * `error :: Error`

### `emitter.destroy()`

Immediately destroy the emitter, messages might be lost.

### `emitter.post(message)`

Immediately send a message to the receptor, may throw an error.

* `message :: string`

### `result = emitter.pull(query)`

Perform a synchronous request to the receptor, may throw an error.

* `query :: string` 
* `result :: string`

### `emitter.onpush = (message) => { ... }`

* `message :: string`
