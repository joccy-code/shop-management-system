# Shop Manager

Mobile-first shop management web app for small retail businesses in Ethiopia.

Working product name: **Shop Manager** (configurable via `APP_NAME` / `VITE_APP_NAME`).

## Stack

| Area | Choice |
| --- | --- |
| Frontend | React, TypeScript, Vite, Tailwind CSS, React Router, TanStack Query |
| Backend | Node.js, Express, TypeScript, Zod, Prisma |
| Database | PostgreSQL |
| Tests | Vitest, React Testing Library, Supertest |

## Repository layout

```text
shop-management-system/
  frontend/          React app
  backend/           Express API + Prisma
  docs/              Architecture and deployment notes
  package.json       npm workspaces root
```

## Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 14+ (18 is fine)

Do not reinstall system packages if they are already available.

## First-time setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure backend environment

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env`:

- Set `DATABASE_URL` to a database you control, for example `shop_manager`
- Set `SESSION_SECRET` to a long random string (32+ characters)
- Keep `APP_CURRENCY=ETB` and `APP_TIMEZONE=Africa/Addis_Ababa` unless you intentionally change them

Optional frontend display settings:

```bash
cp frontend/.env.example frontend/.env
```

### 3. Create the database safely

Create an empty database for this app. Do **not** drop unrelated databases.

Example with `psql`:

```bash
psql -U postgres -c "CREATE DATABASE shop_manager;"
```

On Windows, if `psql` is not on PATH:

```powershell
& "C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -c "CREATE DATABASE shop_manager;"
```

### 4. Generate Prisma client and apply migrations

```bash
npm run prisma:generate -w backend
npm run prisma:migrate:deploy -w backend
```

For local schema iteration you can also use:

```bash
npm run prisma:migrate -w backend
```

### 5. Create your shop account

Phase 1 shipped no login credentials. As of Phase 2, open the app and use
**Create one** on the login screen to register a shop and its first owner
account (shop name, your name, phone number, and password).

## Development

Run API and UI in two terminals:

```bash
npm run dev:backend
npm run dev:frontend
```

- Frontend: http://127.0.0.1:5173
- API health: http://127.0.0.1:3001/api/v1/health
- API readiness: http://127.0.0.1:3001/api/v1/ready

The Vite dev server proxies `/api` to the backend.

## Useful scripts

```bash
npm run typecheck
npm run test
npm run build
```

Workspace-specific:

```bash
npm run test -w backend
npm run test -w frontend
npm run build -w backend
npm run build -w frontend
```

## Current status (Phases 1–7)

Implemented:

- Monorepo foundation
- Prisma schema and initial migration for shops, users, sessions, products, sales, expenses, customers, and subscription placeholders
- Health and readiness endpoints
- Mobile bottom navigation and desktop sidebar shell
- English message dictionary for future localization
- **Phone + password authentication**: register a shop and owner account, sign in, sign out, and a session-backed `/auth/me` check that gates every in-app route. Sessions are random tokens hashed server-side and stored with an expiry; phone numbers are normalized (`0912345678` and `+251912345678` resolve to the same account).
- **Product catalog CRUD**: create, edit, and archive products scoped to the signed-in shop, with categories you can create inline from the product form.
- **Stock adjustments**: every stock change (initial stock on create, or a manual adjustment) is recorded as an auditable inventory movement; adjustments cannot drive stock negative, and products at or below their low-stock threshold are flagged in the UI.
- **Sales checkout**: search products, confirm payment (cash, bank transfer, Telebirr, other, or credit), and save the sale in one database transaction. Stock is reduced only when the sale commits. Repeating the same checkout with the same idempotency key does not create a second sale. A sale can be voided, which returns stock.
- **Expenses and customer credit**: record expenses and void them instead of deleting them. Credit and partial sales require a customer. Repayments cannot exceed the outstanding balance.
- **Dashboard and reports**: today's sales, this month's sales, expenses, estimated profit, low stock, a simple sales trend, best sellers, inventory value, and outstanding customer balances. All figures are queried from the database.
- **Installable PWA**: web app manifest, icons, and a service worker that caches the app shell and static files. API responses are not cached. Saving a sale still requires a connection.
- **Production hardening**: login and registration rate limits, an origin check on cross-site posts, password change, paginated lists, and a [release checklist](docs/release-checklist.md).

Not implemented yet:

- Full offline sale sync. The design is in [docs/offline-sales.md](docs/offline-sales.md). If the network fails, the app says a connection is required and does not pretend the sale was saved.
- SMS-based OTP delivery (phone sign-in uses a password, since no SMS provider is configured)
- Subscription billing. The subscription table remains unused and there is no paywall.

## Troubleshooting

**API fails to start with environment errors**  
Check `backend/.env` against `backend/.env.example`. `DATABASE_URL` and `SESSION_SECRET` are required.

**`/api/v1/ready` returns 503**  
PostgreSQL is unreachable or migrations were not applied. Confirm the service is running and `DATABASE_URL` is correct.

**Frontend cannot reach the API in development**  
Start the backend on port 3001. The Vite proxy expects that port.

## Documentation

- [Architecture](docs/architecture.md)
- [API](docs/api.md)
- [Deployment notes](docs/deployment.md)
- [Release checklist](docs/release-checklist.md)
- [Offline sales plan](docs/offline-sales.md)

## License

Private project unless otherwise stated.
