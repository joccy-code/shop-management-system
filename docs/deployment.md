# Deployment notes (Ubuntu VPS + Nginx + GitLab CI)

Shop Manager is built on GitLab CI and copied to `/var/www/shop-management` over SSH.

## Pipeline

`.gitlab-ci.yml` runs on `main`:

1. **verify_application** — install, generate Prisma, migrate a CI Postgres, typecheck, test, and build.
2. **test_vps_ssh** — confirm the deploy key can sign in and write `/var/www/shop-management`.
3. **deploy_vps** — copy the repo to the VPS and run `scripts/remote-deploy.sh`.

Required GitLab CI/CD variables (Settings → CI/CD → Variables):

| Variable | Type | Purpose |
| --- | --- | --- |
| `SSH_PRIVATE_KEY` | File | Private deploy key. Include the BEGIN/END lines and a trailing newline. |
| `SSH_KNOWN_HOSTS` | File | Output of `ssh-keyscan -H <VPS_HOST>`. |
| `VPS_USER` | Variable | SSH user that owns `/var/www/shop-management`. |
| `VPS_HOST` | Variable | VPS hostname or IP. |

The public half of `SSH_PRIVATE_KEY` must be in `~/.ssh/authorized_keys` on the VPS.

## One-time VPS bootstrap

Copy the app once (or let the first pipeline copy fail on a missing `.env`, then finish this):

```bash
sudo bash /var/www/shop-management/scripts/bootstrap-vps.sh
```

That installs Node 22 and Nginx if needed, writes a systemd unit, and enables the Nginx site. Then edit `/var/www/shop-management/backend/.env`:

- `NODE_ENV=production`
- `DATABASE_URL` pointing at PostgreSQL on this host
- unique `SESSION_SECRET` (32+ characters; bootstrap generates one)
- `COOKIE_SECURE=true` only after HTTPS is enabled
- `CORS_ORIGIN` empty so the UI and API share one origin
- `APP_CURRENCY=ETB` and `APP_TIMEZONE=Africa/Addis_Ababa` unless you change them on purpose

Create the database if it does not exist:

```bash
sudo -u postgres psql -c "CREATE DATABASE shop_manager;"
```

Rerun the GitLab pipeline, or:

```bash
sudo -u "$USER" bash /var/www/shop-management/scripts/remote-deploy.sh
```

## Runtime shape

1. Vite writes static files to `frontend/dist`.
2. Express listens on `127.0.0.1:3001` (systemd unit `shop-manager`, or a pid file if systemd is not available).
3. Nginx serves `frontend/dist` and proxies `/api/` to the API.
4. PostgreSQL stays on the VPS or a private managed database.
5. Run `npm run prisma:migrate:deploy -w backend` before the API starts (the deploy script does this).

Confirm after boot:

- `GET /api/v1/health`
- `GET /api/v1/ready`

The API trusts one proxy hop so Nginx can supply the client IP used by login rate limits. Serve `sw.js`, `manifest.webmanifest`, and `icons/` from the same origin. The service worker must not cache `/api`.

## Nginx (installed by bootstrap)

See `deploy/nginx-shop-manager.conf`. Add TLS with certbot when a domain points at the VPS:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d example.com
```

Then set `COOKIE_SECURE=true` in `backend/.env` and restart:

```bash
sudo systemctl restart shop-manager
```

## Security reminders

- Terminate TLS at Nginx when a domain is ready.
- Restrict database access to the application host.
- Never commit `.env` files or database passwords. The pipeline excludes them from the tarball.
- Rotate secrets if they leak.
- Do not log passwords, session cookies, or payment references in plain text.
- Subscription billing and payment-provider webhooks are later work and must use server-side verification.
