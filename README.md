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

### emitter = require("antena/emitter")(address, session)

* `address :: object | string | number | antena.Receptor`:
  Antena will choose between the three mode below:
  * Browser: if `window` is defined
    * `string`, splitter; eg `"__antena__"` is an alias for `{splitter:"__antena__"}`
    * `object`, options:
      * `secure :: boolean`, default: `location.protocol === "https:`
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

### result = emitter.request(query)

* `emitter :: antena.Emitter`
* `query :: string` 
* `result :: string`

### emitter.send(message)

* `emitter :: antena.Emitter`
* `message :: string`

### emitter.onmessage = (message) => { ... }

* `emitter :: antena.Emitter`
* `message :: string`
