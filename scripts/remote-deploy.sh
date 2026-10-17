#!/usr/bin/env bash
# Runs on the VPS after GitLab CI copies the app into /var/www/shop-management.
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/shop-management}"
BACKEND_DIR="$APP_DIR/backend"
PID_FILE="$BACKEND_DIR/shop-manager.pid"
LOG_FILE="$BACKEND_DIR/shop-manager.log"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:3001/api/v1/health}"
READY_URL="${READY_URL:-http://127.0.0.1:3001/api/v1/ready}"

cd "$APP_DIR"

CI_ENV_FILE="${CI_ENV_FILE:-/tmp/shop-ci-env}"

if ! command -v openssl >/dev/null && ! command -v python3 >/dev/null && ! command -v node >/dev/null; then
  if sudo -n true >/dev/null 2>&1 && [ -f "$APP_DIR/scripts/bootstrap-vps.sh" ]; then
    echo "No secret generator found; running VPS bootstrap"
    sudo -n bash "$APP_DIR/scripts/bootstrap-vps.sh"
  fi
fi

bash "$APP_DIR/scripts/ensure-backend-env.sh" "$BACKEND_DIR" "$CI_ENV_FILE"
rm -f "$CI_ENV_FILE"

if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  if sudo -n true >/dev/null 2>&1 && [ -f "$APP_DIR/scripts/bootstrap-vps.sh" ]; then
    echo "Node.js is missing; running VPS bootstrap"
    sudo -n bash "$APP_DIR/scripts/bootstrap-vps.sh"
  fi
fi

if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "ERROR: Node.js and npm are required on the VPS (Node 20+)."
  echo "Run: sudo bash $APP_DIR/scripts/bootstrap-vps.sh"
  exit 1
fi

node_major="$(node -p "process.versions.node.split('.')[0]")"
if [ "$node_major" -lt 20 ]; then
  echo "ERROR: Node.js 20+ is required. Found $(node -v)."
  exit 1
fi

echo "Installing dependencies"
npm ci --include=dev

echo "Generating Prisma client and applying migrations"
npm run prisma:generate -w backend

create_local_database_if_needed() {
  local db_url
  db_url="$(grep -E '^DATABASE_URL=' "$BACKEND_DIR/.env" | head -n 1 | cut -d= -f2- || true)"
  case "$db_url" in
    *127.0.0.1:5432/shop_manager*|*localhost:5432/shop_manager*) ;;
    *) return 0 ;;
  esac
  if ! command -v psql >/dev/null && ! sudo -n -u postgres true >/dev/null 2>&1; then
    return 0
  fi
  echo "Ensuring local PostgreSQL database shop_manager exists"
  if sudo -n -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='shop_manager'" 2>/dev/null | grep -q 1; then
    return 0
  fi
  sudo -n -u postgres createdb shop_manager >/dev/null 2>&1 || \
    sudo -n -u postgres psql -c "CREATE DATABASE shop_manager;" >/dev/null 2>&1 || \
    createdb shop_manager >/dev/null 2>&1 || true
}

create_local_database_if_needed
npm run prisma:migrate:deploy -w backend

echo "Building backend and frontend"
npm run build

restart_with_systemd() {
  if sudo -n systemctl restart shop-manager >/dev/null 2>&1; then
    echo "Restarted shop-manager via systemd"
    return 0
  fi
  if systemctl --user restart shop-manager >/dev/null 2>&1; then
    echo "Restarted shop-manager via user systemd"
    return 0
  fi
  return 1
}

restart_with_pidfile() {
  if [ -f "$PID_FILE" ]; then
    old_pid="$(cat "$PID_FILE" || true)"
    if [ -n "${old_pid:-}" ] && kill -0 "$old_pid" >/dev/null 2>&1; then
      echo "Stopping previous API pid $old_pid"
      kill "$old_pid" || true
      for _ in $(seq 1 10); do
        kill -0 "$old_pid" >/dev/null 2>&1 || break
        sleep 1
      done
      if kill -0 "$old_pid" >/dev/null 2>&1; then
        kill -9 "$old_pid" || true
      fi
    fi
    rm -f "$PID_FILE"
  fi

  echo "Starting API with node"
  cd "$BACKEND_DIR"
  nohup node dist/index.js >>"$LOG_FILE" 2>&1 &
  echo $! >"$PID_FILE"
  cd "$APP_DIR"
}

if ! restart_with_systemd; then
  restart_with_pidfile
fi

check_url() {
  local url="$1"
  if command -v curl >/dev/null; then
    curl -fsS "$url"
    return
  fi
  node -e "fetch(process.argv[1]).then(async (r)=>{if(!r.ok)process.exit(1);process.stdout.write(await r.text())}).catch(()=>process.exit(1))" "$url"
}

echo "Checking health endpoints"
for i in $(seq 1 20); do
  if check_url "$HEALTH_URL" >/dev/null 2>&1; then
    break
  fi
  if [ "$i" -eq 20 ]; then
    echo "ERROR: API health check did not succeed at $HEALTH_URL"
    if [ -f "$LOG_FILE" ]; then
      tail -n 80 "$LOG_FILE" || true
    fi
    exit 1
  fi
  sleep 1
done

check_url "$HEALTH_URL"
echo
check_url "$READY_URL"
echo
echo "Deploy finished"
