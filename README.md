# Antena

Antena is yet an other JavaScript communication library.
Antena normalises the server-client model for node and browsers.
In Antena, the server is called receptor and its clients are called emitters.
Both receptors and emitters can perform push notifications but only emitters can perform synchronous pull requests.
For node emitters, synchronous pull requests are implemented using `https://www.npmjs.com/package/posix-socket` which is much faster than using the synchronous methods of `child_process` and `fs`.

```js
receptor.onpush = (session, message) => {
  receptor.push(session, message+"World");
};
receptor.onpull = (session, message, callback) => {
  callback(message+"World!!!");
};
```

```js
emitter.push("Hello");
emitter.onpush = (message) => {
  console.log(message); // prints HelloWorld
};
console.log(emitter.pull("Hello")); // prints HelloWorld!!!
```

## Receptor

```js
const server = require("net").createServer();
server.on("connection", receptor.ConnectionListener());
```

```js
const server = require("http").createServer();
const onrequest = receptor.RequestMiddleware();
server.on("request", (request, response) => {
  if (!onrequest(request, response)) {
    // handle request
  }
});
const onupgrade = receptor.UpgradeMiddleware();
server.on("upgrade", (request, socket, head) => {
  if (!onupgrade(request, socket, head)) {
    // handle upgrade
  }
});
```

```js
const server = require("http").createServer();
const onrequest = receptor.RequestMiddleware();
server.on("request", (request, response) => {
  onrequest(request, response, () => {
    // handle request
  });
});
const onupgrade = receptor.UpgradeMiddleware();
server.on("upgrade", (request, socket, head) => {
  onupgrade(request, socket, head, () => {
    // handle upgrade
  });
});
```

### `receptor = require("antena/receptor")()`

Create a new receptor.

* `receptor :: antena.Receptor`

### `receptor.push(session, message)`

Push a message to a emitter identified by its session.

* `receptor :: antena.Receptor`
* `session :: string`
* `message :: string`

### `receptor.onpush = (session, message) => { ... }`

Handler for `emitter.push(message)`.

* `receptor :: antena.Receptor`
* `session :: string`
* `message :: string`

### `receptor.onpull = (session, query, callback) => { ... }`

Handler for `emitter.pull(message)`.

* `receptor :: antena.Receptor`
* `session :: string`
* `query :: string`
* `callback(result)`
  * `result :: String`

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
    If defined, this function will be called if the request was not handled by Antena.
  * `handled :: boolean`
    Indicate whether the request was handled by antena.

### `onupgrade = receptor.UpgradeMiddleware([splitter])`

Create middleware for the `upgrade` event of a `http(s).Server`.

* `receptor :: antena.Receptor`
* `splitter :: string`, default: `"__antena__"`
  A string used to single out the traffic from an emitter.
* `handled = onupgrage(request, socket, head, [next])`
  * `request :: http.IncomingMessage`
  * `socket :: (net|tls).Socket`
  * `head :: Buffer`
  * `next()`:
    If defined, this function will be called if the upgrade request was not handled by Antena.
  * `handled :: boolean`
    Indicate whether the request was handled by antena.

## Emitter

### `emitter = require("antena/emitter")(address, session)`

* `address :: object | string | number | antena.Receptor`:
  Antena will choose between the three mode below:
  * Browser: if `window` is defined
    * `string`, splitter; eg `"__antena__"` is an alias for `{splitter:"__antena__"}`
    * `object`, options:
      * `secure :: `boolean`, default: `location.protocol === "https:`
      * `hostname :: string`, default: `location.hostname`
      * `port :: number`, default: `location.port`
      * `splitter :: string`: default: `"__antena__"`
  * Node: if `window` is not defined and `address` is not an object
    * `number`, port number; eg `8080`: is an alias for `"[::1]:8080"`
    * `string`
      * Port string; eg `"8080"`: alias for `"[::1]:8080"`
      * Local socket address;  eg `/tmp/antena.sock`
      * IPv4 and port; eg `127.0.0.1:8080`
      * IPv6 and port: eg `[::1]:8080`
  * Mock: if `window`  is not defined and `address` is an object, address must be an `antena.Receptor` 
* `session :: string`

### `emitter.push(message)`

Push a message to the emitter's receptor.

* `emitter :: antena.Emitter`
* `message :: string`

### `emitter.onpush = (message) => { ... }`

Listen for pushes from the emitter's receptor.

* `emitter :: antena.Emitter`
* `message :: string`

### `result = emitter.pull(query)`

Pull a result from the emitter's receptor.

* `emitter :: antena.Emitter`
* `query :: string` 
* `result :: string`
