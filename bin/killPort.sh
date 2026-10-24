#!/bin/bash

if [ -z "$1" ]; then
  echo "Usage: $0 <PORT>"
  exit 1
fi

PORT=$1

# Find the PID of the process using the specified port
PID=$(lsof -t -i:$PORT)

if [ -z "$PID" ]; then
  echo "No process is listening on port $PORT."
  exit 1
fi

# Kill the process
if kill -9 $PID > /dev/null 2>&1; then
  echo "Process $PID listening on port $PORT has been killed."
else
  echo "Failed to kill process $PID. It may not exist, or you might not have the necessary permissions."
fi
