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

if [ ! -f "$BACKEND_DIR/.env" ]; then
  echo "ERROR: $BACKEND_DIR/.env is missing on the VPS."
  echo "Copy backend/.env.example to backend/.env, set production values, then rerun the pipeline."
  exit 1
fi

if ! command -v node >/dev/null || ! command -v npm >/dev/null; then
  echo "ERROR: Node.js and npm are required on the VPS (Node 20+)."
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
