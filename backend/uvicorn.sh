#!/usr/bin/env bash
set -e

echo "🔄 Running database migrations..."
alembic upgrade head

echo "🚀 Starting Protega API..."
exec uvicorn protega_api.main:app --host 0.0.0.0 --port ${API_PORT:-8000} --reload

