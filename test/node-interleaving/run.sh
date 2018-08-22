rm /tmp/antena-test-2.sock
node server.js /tmp/antena-test-2.sock &
PID=$!
sleep 1
node client.js /tmp/antena-test-2.sock
kill $PID