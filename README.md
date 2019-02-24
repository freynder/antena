# Antena

Antena is yet an other JavaScript communication library.
Antena normalises the server-client model for node and browsers.
In Antena, the server is called receptor and its clients are called emitters.
Both receptors and emitters can perform push notifications but only emitters can perform synchronous pull requests.
For node emitters, synchronous pull requests are implemented using [posix-socket](https://www.npmjs.com/package/posix-socket) which is much faster than using the synchronous methods of `child_process` and `fs`.

```js
const AntenaReceptor = require("antena/receptor");
const receptor = AntenaReceptor();
receptor.onpush = (session, message) => {
  console.assert(session === "antena-rocks");
  receptor.push(session, message+"World");
};
receptor.onpull = (session, query, callback) => {
  console.assert(session === "antena-rocks");
  callback(query+"World!!!");
};
// For Node Emitters
const serverN = require("net").createServer(8080);
const onconnection = receptor.ConnectionListener();
serverN.on("connection", onconnection);
// For Browser Emitters
const serverB = require("http").createServer(8000);
const onrequest = receptor.RequestMiddleware("foobar");
serverB.on("request", (request, response) => {
  onrequest(request, response, () => {
    // Request not handled by antena
  });
});
const onupgrade = receptor.UpgradeMiddleware("foobar");
serverB.on("upgrade", (request, socket, head) => {
  onupgrade(request, response, () => {
    // Upgrade not handled by Antena
  });
});
```

```js
const AntenaEmitter = require("antena/emitter");
const session = "antena-rocks";
const emitter = AntenaEmitter(8080, session); // Node Emitter
const emitter = AntenaBrowser("foobar", session); // Browser Emitter
emitter.push("Hello");
emitter.onpush = (message) => {
  console.log(message); // prints HelloWorld
};
console.log(emitter.pull("Hello")); // prints HelloWorld!!!
```

## Receptor

### `receptor = require("antena/receptor")()`

Create a new receptor.

* `receptor :: antena.Receptor`

### `receptor.send(session, message)`

Push a message to an emitter identified by its session.

* `session :: string`
* `message :: string`

### `receptor.onerror = (session, error) => { ... }`

* `session :: string`
* `error :: Error`

### `receptor.onmessage = (session, message) => { ... }`

Handler for `emitter.send(message)`.

* `session :: string`
* `message :: string`

### `receptor.onrequest = (session, query, callback) => { ... }`

Handler for `emitter.request(message)`.

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

An emitter is essentially a WebSocket with a mean to perform synchronous requests.

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

### `emitter.readyState :: number`

### `emitter.close = () => { ... }`

### `emitter.send(message)`

* `message :: string`

### `result = emitter.request(query)`

* `query :: string` 
* `result :: string`

### `emitter.onopen = ({type, target}) => { ... }`

* `type :: "open"`
* `target :: antena.Emitter`

### `emitter.onmessage = ({type, target, data}) => { ... }`

* `type :: "message"`
* `target :: antena.Emitter`
* `data :: string`

### `emitter.onclose = ({type, target, wasClean, code, reason}) => { ... }`

* `type :: "close"`
* `target :: antena.Emitter`
* `wasClean :: boolean`
* `code :: number | string`
* `reason :: string`
