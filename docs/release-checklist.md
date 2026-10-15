# Release checklist

Use this before a production deploy. Do not deploy without explicit authorization.

## Application

- [ ] `npm run typecheck`, `npm run test`, and `npm run build` pass.
- [ ] Register, add a product, record a cash sale, and confirm stock decreased.
- [ ] Repeat the same sale request with the same `Idempotency-Key` and confirm one sale exists.
- [ ] Record a partial payment with a customer, then a repayment that would exceed the balance, and confirm it is rejected.
- [ ] Void an expense and confirm it disappears from dashboard expense totals.
- [ ] Open the app at about 360px wide and confirm there is no horizontal scrolling on Home, Sales, Products, and Reports.

## Environment

- [ ] `NODE_ENV=production`
- [ ] `SESSION_SECRET` is unique and at least 32 characters
- [ ] `COOKIE_SECURE=true`
- [ ] `COOKIE_SAME_SITE=lax` (or `strict` if the UI and API share a site)
- [ ] `DATABASE_URL` points at a private PostgreSQL instance
- [ ] `CORS_ORIGIN` is empty when Nginx serves the UI and API on one origin
- [ ] `APP_CURRENCY=ETB` and `APP_TIMEZONE=Africa/Addis_Ababa` unless intentionally changed
- [ ] `npm run prisma:migrate:deploy -w backend` has been run
- [ ] `GET /api/v1/health` returns success and `GET /api/v1/ready` returns success

## Host

- [ ] TLS terminates at Nginx
- [ ] PostgreSQL is not reachable from the public internet
- [ ] Process manager restarts the API
- [ ] Logs do not include passwords, session cookies, or payment references
- [ ] No stack traces are returned to browsers
- [ ] The service worker file is served, and `/api` responses are not cached by it

## Explicitly out of scope

- Subscription billing stays unused. Do not activate paid access from a frontend message.
- Offline sale recording is not implemented. A failed save must show that a connection is required.
