docker build -t mongodb-rs:latest ./.github/

docker run -d -p 27001:27001 -p 27002:27002 -p 27003:27003 --name mongo -e "REPLICA_SET_NAME=rs0" mongodb-rs
