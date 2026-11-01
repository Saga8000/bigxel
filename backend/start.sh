#!/bin/sh
# Container entrypoint: apply migrations, optionally load demo data, then serve.
set -e
alembic upgrade head
if [ "$SEED_DEMO" = "true" ]; then
  python -m app.seed
fi
exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT:-8000}" --proxy-headers --forwarded-allow-ips="*"
