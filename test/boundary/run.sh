rm /tmp/antena-test-node-boundary.sock ; node server.js /tmp/antena-test-node-boundary.sock &
sleep 1
node client.js /tmp/antena-test-node-boundary.sock
wait $!