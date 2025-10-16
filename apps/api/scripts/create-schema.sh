#!/bin/bash

# Create schema if it doesn't exist (for staging environment)
# This runs before migrations during Render deployment

if [ "$NODE_ENV" = "staging" ]; then
  echo "🔧 Creating staging schema if it doesn't exist..."

  # Check if psql is available
  if ! command -v psql &> /dev/null; then
    echo "⚠️  psql not found, installing..."
    apt-get update && apt-get install -y postgresql-client
  fi

  # Create schema using DATABASE_URL
  if [ -n "$DATABASE_URL" ]; then
    echo "Using DATABASE_URL for connection"
    psql "$DATABASE_URL" \
      -c "CREATE SCHEMA IF NOT EXISTS staging;" \
      && echo "✅ Staging schema ready" \
      || echo "❌ Failed to create staging schema"
  else
    echo "⚠️  DATABASE_URL not set, falling back to individual variables"
    PGPASSWORD=$DATABASE_PASSWORD psql \
      -h $DATABASE_HOST \
      -p $DATABASE_PORT \
      -U $DATABASE_USERNAME \
      -d $DATABASE_NAME \
      -c "CREATE SCHEMA IF NOT EXISTS staging;" \
      && echo "✅ Staging schema ready" \
      || echo "❌ Failed to create staging schema"
  fi
else
  echo "ℹ️  Not staging environment, skipping schema creation"
fi
