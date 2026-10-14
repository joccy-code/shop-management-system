# Architecture overview

Shop Manager is a monorepo with two packages:

- `frontend` — React + Vite mobile-first UI
- `backend` — Express + Prisma API

## Why same-origin API access

In development, Vite proxies `/api` to the Express server.
In production, Nginx should do the same.

This keeps session cookies first-party, reduces CORS complexity, and matches the planned cookie-based authentication model.

## Account isolation

Every business table includes a `shop_id`.
After authentication is added, the current shop comes from the server session, never from a client-supplied shop id.

## Money and time

- Currency: Ethiopian birr (`ETB`)
- Business timezone: `Africa/Addis_Ababa`
- Money columns use PostgreSQL `DECIMAL`
- Application math uses `decimal.js`

## What Phase 1 includes

- Project scaffolding and scripts
- Prisma schema and first migration
- Health and readiness endpoints
- Responsive shell navigation
- English message dictionary ready for later Amharic and Afaan Oromo catalogs

## What comes next

- Phase 2: phone-based auth, products, stock adjustments
- Phase 3: transactional sales checkout
- Phase 4: expenses and customer credit
- Phase 5: dashboard and reports
- Phase 6: PWA installability
- Phase 7: production readiness hardening
