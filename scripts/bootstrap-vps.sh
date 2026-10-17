#!/usr/bin/env bash
# One-time VPS setup. Run on the server as a user who can sudo:
#   sudo bash /var/www/shop-management/scripts/bootstrap-vps.sh
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/shop-management}"
BACKEND_DIR="$APP_DIR/backend"
DEPLOY_USER="${SUDO_USER:-${USER}}"
DEPLOY_GROUP="$(id -gn "$DEPLOY_USER")"

if [ "$(id -u)" -ne 0 ]; then
  echo "ERROR: run this script with sudo."
  exit 1
fi

echo "Installing Node.js 22, nginx, curl, and PostgreSQL client tools if needed"
if ! command -v node >/dev/null; then
  apt-get update
  apt-get install -y ca-certificates curl gnupg
  mkdir -p /etc/apt/keyrings
  curl -fsSL https://deb.nodesource.com/gpgkey/nodesource-repo.gpg.key \
    | gpg --dearmor -o /etc/apt/keyrings/nodesource.gpg
  echo "deb [signed-by=/etc/apt/keyrings/nodesource.gpg] https://deb.nodesource.com/node_22.x nodistro main" \
    > /etc/apt/sources.list.d/nodesource.list
  apt-get update
  apt-get install -y nodejs
fi

apt-get update
apt-get install -y nginx curl postgresql-client

install -d -o "$DEPLOY_USER" -g "$DEPLOY_GROUP" -m 755 "$APP_DIR"

if [ ! -f "$BACKEND_DIR/.env" ]; then
  if [ ! -f "$BACKEND_DIR/.env.example" ]; then
    echo "ERROR: $BACKEND_DIR/.env.example is missing. Copy the app files first."
    exit 1
  fi
  echo "Creating $BACKEND_DIR/.env from the example. Edit DATABASE_URL before deploy."
  cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
  python3 - "$BACKEND_DIR/.env" <<'PY'
from pathlib import Path
import secrets
import sys
path = Path(sys.argv[1])
text = path.read_text()
replacements = {
    "NODE_ENV=development": "NODE_ENV=production",
    "COOKIE_SECURE=false": "COOKIE_SECURE=false",
    "CORS_ORIGIN=http://127.0.0.1:5173": "CORS_ORIGIN=",
    "SESSION_SECRET=replace-with-a-long-random-string-at-least-32-chars": "SESSION_SECRET=" + secrets.token_urlsafe(48),
    "LOG_LEVEL=info": "LOG_LEVEL=info",
}
for old, new in replacements.items():
    text = text.replace(old, new)
path.write_text(text)
PY
  chown "$DEPLOY_USER:$DEPLOY_GROUP" "$BACKEND_DIR/.env"
  chmod 600 "$BACKEND_DIR/.env"
fi

unit_src="$APP_DIR/deploy/shop-manager.service"
unit_dst="/etc/systemd/system/shop-manager.service"
if [ -f "$unit_src" ]; then
  sed -e "s/DEPLOY_USER/$DEPLOY_USER/g" -e "s/DEPLOY_GROUP/$DEPLOY_GROUP/g" "$unit_src" >"$unit_dst"
  systemctl daemon-reload
  systemctl enable shop-manager
fi

nginx_src="$APP_DIR/deploy/nginx-shop-manager.conf"
if [ -f "$nginx_src" ]; then
  cp "$nginx_src" /etc/nginx/sites-available/shop-manager
  ln -sfn /etc/nginx/sites-available/shop-manager /etc/nginx/sites-enabled/shop-manager
  rm -f /etc/nginx/sites-enabled/default
  nginx -t
  systemctl enable nginx
  systemctl reload nginx
fi

echo
echo "Bootstrap finished for user $DEPLOY_USER."
echo "1. Edit $BACKEND_DIR/.env and set DATABASE_URL to your PostgreSQL database."
echo "2. Create the database if needed, then rerun the GitLab pipeline or:"
echo "     sudo -u $DEPLOY_USER bash $APP_DIR/scripts/remote-deploy.sh"
