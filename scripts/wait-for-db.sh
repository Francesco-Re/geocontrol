#!/bin/sh
# Wait for MySQL to be ready
set -e
host="$DB_HOST"
port="$DB_PORT"

until nc -z "$host" "$port"; do
  echo "Waiting for MySQL at $host:$port..."
  sleep 2
done

exec "$@"