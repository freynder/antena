# node unix
rm /tmp/antena.sock
node server.js /tmp/antena.sock &
sleep 1
node client-node.js /tmp/antena.sock
kill $!

# node port
node server.js 8080 &
sleep 1
node client-node.js 8080
kill $!

# browser
browserify client-browser.js > client-browser-bundle.js
node server.js 8080 &
sleep 1
open "http://localhost:8080"
sleep 4
kill $!
