#!/bin/sh
# Runs automatically on first Postgres container start (docker-entrypoint-initdb.d).
# The base image only creates $POSTGRES_DB on init; Gitea needs its own database
# on the same instance, so create it here.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-EOSQL
    SELECT 'CREATE DATABASE "${GITEA_DB_NAME}"'
    WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '${GITEA_DB_NAME}')\gexec
EOSQL
