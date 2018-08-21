# Antena

Antena is yet an other communication library.

## Receptor

### receptor = require("antena/receptor")()

Create a new receptor.
* `receptor :: antena.Receptor`

### receptor.attach(server, splitter)

Attach a server to a receptor to handle communication with remote emitters.

* `receptor :: antena.Receptor`
* `server :: net.Server | http.Server | https.Server`:
  * `net.Server`:
    Handle connection from node emitters by listening to the `connection` event.
  * `http.Server | https.Server`:
    Handle connection from browser emitters by overwriting the `request` and `upgrade` listeners.
    Events whose url starts with the `splitter` parameter will be handled by Antena.
    Other events will be dispatched to *existing* event handlers.
* `splitter :: string`, default `"__antena__"`:
  If `server` is a http(s) server, this string will be used to separate Antena traffic from regular traffic.

### receptor.onrequest = (session, query, callback) => { ... }

Handler for `emitter.request(query)`.

* `receptor :: antena.Receptor`
* `session :: string`
* `request :: string`
* `callback :: function`
  * `result :: String`

### receptor.onmessage = (session, message) => { ... }

Handler for `emitter.send(message)`.

* `receptor :: antena.Receptor`
* `session :: string`
* `message :: string`

## Emitter

### emitter = require("antena/node/emitter")(address, session)

Create a new node emitter.

* `address :: string | number`:
  * Port number, eg `8080`: alias for `"[::1]:8080"`
  * Port string, eg `"8080"`: alias for "[::1]:8080"
  * IPC, eg `/tmp/antena.sock`: a path to unix domain socket.
  * IPv4, eg `127.0.0.1:8080`: concatenation of a IPv4 address and a port
  * IPv6, eg `[::1]:8080`: concatenation of an IPv6 address and a port
* `session :: string`:
  A supposedly unique session ID for the receptor to separate between emitter connections.
* `emitter :: antena.Emitter`

### emitter = require("antena/browser/emitter")(options, session)

Create a new browser emitter.

* `options :: object`:
  * `secure :: boolean`, default: `location.protocol === "https:`
  * `hostname :: string`, default: `location.hostname`
  * `port :: number`, default: `location.port`
  * `splitter :: string`: default: `"__antena__"`
* `session :: string`
* `emitter :: antena.Emitter`

### emitter = require("antena/mock/emitter")(receptor, session)

Create a new mock emitter.

* `receptor :: antena.Receptor`
* `session :: string`
* `emitter :: antena.Emitter`

### result = emitter.request(query)

* `emitter :: antena.Emitter`
* `query :: string`: 
* `result :: string`: the receptor's response

### emitter.send(message)

* `emitter :: antena.Emitter`
* `message :: string`

### emitter.onmessage = (message) => { ... }

* `emitter :: antena.Emitter`
* `message :: string`
