docker run -d -p 27001:27001 -p 27002:27002 -p 27003:27003 --name mongo -e "REPLICA_SET_NAME=rs0" zxilly/mongodb-rs

echo "Waiting for MongoDB to accept connections"
TIMER=0
until docker exec --tty mongo mongo --port 27001 --eval "db.serverStatus()"
do
  sleep 1
  echo "."
  TIMER=$((TIMER + 1))

  if [[ $TIMER -eq 10 ]]; then
    echo "MongoDB did not initialize within 10 seconds. Exiting."
    exit 2
  fi
done
