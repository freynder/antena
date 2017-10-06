# antena

Antena is an API to uniformely perform (a)synchronous http requests and websocket connections.
The end points of an Antena communication channel are different: one is called *receptor* while the other is called *emitter*.
To be operational, receptors must be attached to a node http server or a web worker.
While emitters should receive information to connect to a receptor at their creation.
A [demo page](https://rawgit.com/lachrist/antena-demo/master/index.html) is available for experimenting Antena's API.

```js
var Receptor = require("antena/receptor/node");
var Http = require("http");

var server = Http.createServer();
Receptor({}).merge({
  "echo": Receptor({
    onconnect: function (path, con) {
      con.on("message", function (message) {
        con.send(message.toUpperCase());
      });
    }
  }),
  "ping": Receptor({
    onrequest: function (method, path, headers, body, callback) {
      callback(200, "ok", {}, "pong");
    }
  })
}).attach(server);
server.listen(8080);
```

```js
var Emitter = require("antena/emitter/node");

var emitters = Emitter(8080, false).split(["ping", "echo"]);
var con = emitters.echo.connect("/");
con.on("message", function (message) { console.log(message) });
con.on("open", function () { con.send("hello!") });
emitters.ping.request("GET", "/", {}, "", function (error, status, reason, headers, body) {
  if (error || status !== 200)
    throw error || new Error(status+" "+reason);
  console.log(body);
});
```

```
pong
HELLO!
```

## `Handlers`

### `handlers.onrequest(method, path, headers, body, callback)`

* `handlers :: antena.Handlers`
* `method :: string`
* `path :: string`
* `headers :: {string}`
* `body :: string`
* `callback(status, reason, headers, body)`
  * `status :: number`
  * `reason :: string`
  * `headers :: {string}`
  * `body :: string`

### `handlers.onconnect(path, websocket)`

* `handlers :: antena.Handlers`
* `path :: string`
* `websocket :: antena.Websocket`

## `Receptor`

`antena.Receptor := antena.ReceptorServer | antena.ReceptorWorker`

### `receptor = require("antena/receptor")(handlers)`

* `handlers :: antena.Handlers`
* `receptor :: antena.ReceptorServer`

### `receptor = require("antena/receptor/worker")(handlers)`

* `handlers :: antena.Handlers`
* `receptor :: antena.ReceptorWorker`

### `receptor2 = receptor1.merge(receptors)`

* `receptor1 :: antena.Receptor`
* `receptors :: {antena.Receptor}`
* `receptor2 :: antena.Receptor`

### `receptor2 = receptor1.trace(name)`

* `receptor1 :: antena.Receptor`
* `name :: string`
* `receptor2 :: antena.Receptor`

### `receptor.attach(server)`

`receptor :: antena.ReceptorServer`
`server :: http.Server`

### `terminate = receptor.attach(worker)`

* `receptor :: antena.ReceptorWorker`
* `worker :: Worker`
* `terminate()`

### `onrequest = receptor.handler("request")`

* `receptor :: antena.ReceptorServer`
* `onrequest(request, response)`
  * `request :: http.IncomingMessage`
  * `response :: http.ServerResponse`

### `onupgrade = receptor.handler("upgrade")`

* `receptor :: antena.ReceptorNode`
* `onupgrade(request, socket, head)`
  * `request :: http.IncomingMessage`
  * `socket :: net.Socket`
  * `head :: Buffer`

## `Emitter`

### `emitter = require("antena/emitter/node")(host, secure)`

* `host :: string`
* `secure :: boolean`
* `emitter :: antena.Emitter`

### `emitter = require("antena/emitter/browser")(host, secure)`

* `host :: string`
* `secure :: boolean`
* `emitter :: antena.Emitter`

### `emitter = require("antena/emitter/worker")(size)`

* `size :: number`
* `emitter :: antena.Emitter`

### `emitter = require("antena/emitter/mock")(receptor)`

* `receptor :: antena.ReceptorNode | antena.ReceptorBrowser`
* `emitter :: antena.Emitter`

### `emitter.request(method, path, headers, body, callback)`

* `emitter :: antena.Emitter`
* `method :: string`
* `path :: string`
* `headers :: {string}`
* `body :: string`
* `callback(error, status, reason, headers, body)`
  * `error :: Error | null`
  * `status :: number | undefined`
  * `reason :: string | undefined`
  * `headers :: {string} | undefined`
  * `body :: string | undefined`

### `[error2, status2, reason2, headers2, body2] = emitter.request(method1, path1, headers1, body1)`

* `emitter :: antena.Emitter`
* `method1 :: string`
* `path1 :: string`
* `headers1 :: {string}`
* `body1 :: string`
* `error2 :: Error | null`
* `status2 :: number | undefined`
* `reason2 :: string | undefined`
* `headers2 :: {string} | undefined`
* `body2 :: string | undefined`

### `websocket = emitter.connect(path)`

* `emitter :: antena.Emitter`
* `path :: string`
* `websocket :: antena.Websocket`

### `emitter2 = emitter1.fork(splitter)`

* `emitter1 :: antena.Emitter`
* `splitter :: string`
* `emitter2 :: antena.Emitter`

### `emitters = emitter.split(splitters)`

* `emitter :: antena.Emitter`
* `splitter :: [string]`
* `emitters :: {antena.Emitter}`

### `emitter2 = emitter1.trace(name)`

* `emitter1 :: antena.Emitter`
* `name :: string`
* `emitter2 :: antena.Emitter`

## `Websocket`

### `state = websocket.readyState`

* `websocket :: antena.Websocket`
* `state : number`

### Event: `"open"`

### `websocket.send(message)`

* `websocket :: antena.Websocket`
* `message :: string | ArrayBuffer`

### Event: `"message"`

* `message :: string | ArrayBuffer`

### `websocket.close(code, reason)`

* `websocket :: antena.Websocket`
* `code(number)`
* `reason(string)`

### Event: `"close"`

* `code :: number`
* `reason :: string`

### Event: `"error"`

* `error :: Error`
