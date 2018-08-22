rm /tmp/antena-test-node-large.sock
node server.js /tmp/antena-test-node-large.sock &
PID=$!
sleep 1
node client.js /tmp/antena-test-node-large.sock
kill $PID