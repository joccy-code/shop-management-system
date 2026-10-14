# Deployment notes (Ubuntu VPS + Nginx)

These notes prepare Shop Manager for a later Ubuntu VPS deployment.
Do **not** deploy or change a live server without explicit authorization.

## Target shape

1. Build the frontend static files with Vite.
2. Run the Express API with Node.js behind a process manager such as systemd or PM2.
3. Put Nginx in front for HTTPS and reverse proxy.
4. Keep PostgreSQL on the same VPS or a managed database.
5. Proxy `/api` to the backend so the browser talks to one origin.

## Suggested Nginx sketch

```nginx
server {
  listen 443 ssl http2;
  server_name example.com;

  # ssl_certificate and ssl_certificate_key go here

  root /var/www/shop-manager/frontend/dist;
  index index.html;

  location /api/ {
    proxy_pass http://127.0.0.1:3001;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

## Production environment checklist

- Set `NODE_ENV=production`.
- Use a strong unique `SESSION_SECRET` (32+ characters).
- Set `COOKIE_SECURE=true` and prefer `COOKIE_SAME_SITE=lax` or `strict`.
- Point `DATABASE_URL` at PostgreSQL over a private network when possible.
- Keep `CORS_ORIGIN` empty when Nginx serves UI and API on the same origin.
- Never commit `.env` files or database passwords.
- Run `npm run prisma:migrate:deploy -w backend` before starting the API.
- Confirm `GET /api/v1/health` and `GET /api/v1/ready` after boot.

## Security reminders

- Terminate TLS at Nginx.
- Restrict database access to the application host.
- Rotate secrets if they leak.
- Do not log passwords, session cookies, or payment references in plain text.
- Subscription billing and payment-provider webhooks are later work and must use server-side verification.
