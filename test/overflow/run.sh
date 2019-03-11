rm /tmp/antena-test-node-large.sock
node server.js /tmp/antena-test-node-large.sock &
sleep 1
node client.js /tmp/antena-test-node-large.sock
wait $!