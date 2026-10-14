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
The current shop comes from the server session (via the `requireAuth`
middleware), never from a client-supplied shop id. Every product, category,
and inventory movement query is scoped to `req.auth.shopId`.

## Authentication

Phase 2 uses phone number + password sign-in rather than SMS one-time codes,
since no SMS provider is configured in this environment:

- Passwords are hashed with bcrypt (`backend/src/lib/password.ts`).
- Phone numbers are normalized to a single canonical form so `0912345678` and
  `+251912345678` resolve to the same account (`backend/src/lib/phone.ts`).
- Sessions are random 256-bit tokens; only a SHA-256 hash of the token is
  stored in the `sessions` table, and the raw token lives in an `httpOnly`
  cookie (`backend/src/lib/session-token.ts`).
- `requireAuth` resolves the cookie to a session on every request and attaches
  `req.auth` (`userId`, `shopId`, `role`, `displayName`).

Swapping in real SMS OTP delivery later only requires changing how a session
is issued (an OTP verification step instead of a password check); the session
and cookie model stays the same.

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

## What Phase 2 adds

- Phone + password authentication (register, login, logout, session-backed
  `/auth/me`)
- Product catalog CRUD with shop-scoped categories
- Stock adjustments backed by an auditable inventory movement log, with
  low-stock and out-of-stock indicators in the UI

## What comes next

- Phase 3: transactional sales checkout
- Phase 4: expenses and customer credit
- Phase 5: dashboard and reports
- Phase 6: PWA installability
- Phase 7: production readiness hardening
