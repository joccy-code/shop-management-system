#!/usr/bin/env bash
# Create backend/.env on first deploy. Never overwrite an existing file.
set -euo pipefail

BACKEND_DIR="${1:-/var/www/shop-management/backend}"
CI_ENV_FILE="${2:-}"
ENV_FILE="$BACKEND_DIR/.env"
EXAMPLE_FILE="$BACKEND_DIR/.env.example"

read_ci_env() {
  local file="$1"
  [ -f "$file" ] || return 0
  while IFS= read -r line || [ -n "$line" ]; do
    case "$line" in
      ""|\#*) continue ;;
      DATABASE_URL=*) DATABASE_URL="${line#DATABASE_URL=}" ;;
      SESSION_SECRET=*) SESSION_SECRET="${line#SESSION_SECRET=}" ;;
      COOKIE_SECURE=*) COOKIE_SECURE="${line#COOKIE_SECURE=}" ;;
      CORS_ORIGIN=*) CORS_ORIGIN="${line#CORS_ORIGIN=}" ;;
    esac
  done <"$file"
}

if [ -n "$CI_ENV_FILE" ]; then
  read_ci_env "$CI_ENV_FILE"
fi

if [ -f "$ENV_FILE" ]; then
  echo "backend/.env already exists on the VPS"
  exit 0
fi

if [ ! -f "$EXAMPLE_FILE" ]; then
  echo "ERROR: $EXAMPLE_FILE is missing; cannot create backend/.env"
  exit 1
fi

if [ -z "${DATABASE_URL:-}" ]; then
  DATABASE_URL="postgresql://postgres:1234@127.0.0.1:5432/shop_manager?schema=public"
fi

if [ -z "${SESSION_SECRET:-}" ] || [ "${#SESSION_SECRET}" -lt 32 ]; then
  if command -v openssl >/dev/null; then
    SESSION_SECRET="$(openssl rand -hex 32)"
  elif command -v python3 >/dev/null; then
    SESSION_SECRET="$(python3 -c 'import secrets; print(secrets.token_hex(32))')"
  else
    SESSION_SECRET="$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
  fi
fi

COOKIE_SECURE="${COOKIE_SECURE:-false}"

umask 077
cat >"$ENV_FILE" <<EOF
NODE_ENV=production
PORT=3001
APP_NAME=Shop Manager
APP_CURRENCY=ETB
APP_TIMEZONE=Africa/Addis_Ababa
DATABASE_URL=$DATABASE_URL
SESSION_COOKIE_NAME=shop_manager_session
SESSION_SECRET=$SESSION_SECRET
SESSION_TTL_HOURS=168
COOKIE_SECURE=$COOKIE_SECURE
COOKIE_SAME_SITE=lax
CORS_ORIGIN=${CORS_ORIGIN:-}
LOG_LEVEL=info
EOF
chmod 600 "$ENV_FILE"

echo "Created backend/.env for production. Existing file will not be changed on later deploys."
