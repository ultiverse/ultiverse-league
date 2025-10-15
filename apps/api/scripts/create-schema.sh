#!/bin/bash

# Create schema if it doesn't exist (for staging environment)
# This runs before migrations during Render deployment

if [ "$NODE_ENV" = "staging" ]; then
  echo "Creating staging schema if it doesn't exist..."
  PGPASSWORD=$DATABASE_PASSWORD psql \
    -h $DATABASE_HOST \
    -p $DATABASE_PORT \
    -U $DATABASE_USERNAME \
    -d $DATABASE_NAME \
    -c "CREATE SCHEMA IF NOT EXISTS staging;"
  echo "Staging schema ready"
fi
