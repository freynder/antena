# Antena

Isomorph http client.

## `antena = require("antena/node")(host, secure)`

* `host :: string | number`
  Example of valid host:
  * `"localhost:8080"`
  * `"localhost"`
    Use default http ports (443 if secure is truthy else 80).
  * `"8080`
    Same as `"localhost:8080"`
  * `8080`
    Same as `"localhost:8080"`
  * `/tmp/unix-domain-socket.sock`
    Unix domain sockets can only be used if secure is falsy.
  * `\\\\?\\pipe\window-pipe`
    Windows pipes can only be used if secure is falsy.
* `secure :: boolean` 

## `antena = require("antena/browser")(host, secure)`

* `host :: string | undefined`
  * `"localhost:8080"`
  * `"localhost"`
    Use default http ports (443 if secure is truthy else 80).
  * `undefined`
    Same as providing the page's host (`window.location.host`).
* `secure :: boolean`
  Note that is the page is served accross `https`, this parameter will be overwritten to `true`;

## `antena = require("antena/mock")(host, secure)`

## `antena.request(method, path, headers, body, callback)`

* `method :: string`
* `path :: string`
* `headers :: object`
* `body :: string`
* `callback(error, [status, message, headers, body])`
  * `error :: Error`
  * `status :: number`
  * `message :: string`
  * `headers :: object`
  * `body :: string`

## `[status, message, headers2, body2] = antena.request(method, path, headers1, body1)`

* `method :: string`
* `path :: string`
* `hearders1 :: object`
* `body1 :: string`
* `status :: number`
* `message :: string`
* `headers2 :: object`
* `body2 :: string`

## `websocket = antena.WebSocket(path)`

* `path :: string`
* `websocket :: browser.WebSocket || ws.WebSocket`
  Browser style listeners: `onopen`, `onmessage`, `onerror` and `onclose` are isomorphic.

## `antena2 = antena1.fork(splitter)`

* `splitter :: string`

## plaform = antena.platform

* `platform :: string`
  Either `"node"`, `"browser"` or, `"mock"`.
