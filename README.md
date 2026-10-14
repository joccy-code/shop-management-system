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

A development seed script will be added in Phase 2 with auth and sample products. Phase 1 intentionally does not create login credentials.

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

## Current status (Phase 1)

Implemented:

- Monorepo foundation
- Prisma schema and initial migration for shops, users, sessions, products, sales, expenses, customers, and subscription placeholders
- Health and readiness endpoints
- Mobile bottom navigation and desktop sidebar shell
- Empty page shells for Home, Sales, Products, Reports, Expenses, Customers, and Settings
- English message dictionary for future localization

Not implemented yet:

- Authentication
- Product CRUD
- Sales checkout
- Expenses and customer credit workflows
- Live dashboard statistics
- PWA offline sales

## Troubleshooting

**API fails to start with environment errors**  
Check `backend/.env` against `backend/.env.example`. `DATABASE_URL` and `SESSION_SECRET` are required.

**`/api/v1/ready` returns 503**  
PostgreSQL is unreachable or migrations were not applied. Confirm the service is running and `DATABASE_URL` is correct.

**Frontend cannot reach the API in development**  
Start the backend on port 3001. The Vite proxy expects that port.

## Documentation

- [Architecture](docs/architecture.md)
- [Deployment notes](docs/deployment.md)

## License

Private project unless otherwise stated.
