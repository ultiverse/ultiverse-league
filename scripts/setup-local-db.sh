#!/bin/bash

# Setup local database for Ultiverse League
# This script creates the local database and runs migrations

set -e

echo "🔧 Setting up local database..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    echo "   - macOS (Postgres.app): Open Postgres.app"
    echo "   - macOS (Homebrew): brew services start postgresql"
    echo "   - Linux: sudo systemctl start postgresql"
    exit 1
fi

# Database credentials (defaults, override with environment variables)
DB_USER="${DATABASE_USERNAME:-postgres}"
DB_NAME="${DATABASE_NAME:-ultiverse}"

echo "📊 Creating database '$DB_NAME' if it doesn't exist..."

# Try to create the database (ignore error if it already exists)
psql -U "$DB_USER" -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    psql -U "$DB_USER" -c "CREATE DATABASE $DB_NAME;"

echo "✅ Database '$DB_NAME' ready"

echo "🔄 Running migrations..."
cd "$(dirname "$0")/.."
pnpm -C apps/api migration:run

echo "✅ Database setup complete!"
echo ""
echo "Next steps:"
echo "  1. Copy .env.local.example to .env.local and update credentials if needed"
echo "  2. Run 'pnpm dev:api' to start the API server"
