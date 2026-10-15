# API reference

Base path: `/api/v1`

Authenticated routes use the `shop_manager_session` httpOnly cookie. The browser client also sends `X-Shop-Manager: 1`. A mutating request that includes a foreign `Origin` and omits that header is rejected with `403 CSRF_REJECTED`.

Successful responses use `{ "success": true, "data": ... }`. Errors use `{ "success": false, "error": { "code", "message" } }`.

## Auth

| Method | Path | Auth | Purpose |
| --- | --- | --- | --- |
| POST | `/auth/register` | No | Create a shop and owner. Rate limited. |
| POST | `/auth/login` | No | Sign in. Rate limited. |
| POST | `/auth/logout` | Cookie | Revoke the session. |
| GET | `/auth/me` | Yes | Current user and shop. |
| POST | `/auth/change-password` | Yes | Replace the password. |

## Catalog

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/products` | List or create products. |
| GET, PATCH, DELETE | `/products/:id` | Read, update, or archive. |
| POST | `/products/:id/stock-adjustments` | Adjust stock with a reason. |
| GET, POST | `/categories` | List or create categories. |

## Sales

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/sales` | Paginated sales. Optional `from`, `to`, `status`, `page`, `pageSize`. |
| POST | `/sales` | Create a sale. Optional `Idempotency-Key` header (max 80 characters). |
| GET | `/sales/:id` | One sale, including line snapshots and payments. |
| POST | `/sales/:id/void` | Void a sale and restore stock. Refused when repayments exist. |

The server prices every line from the current product. Client totals are ignored. A sale that is not fully paid requires `customerId`.

## Expenses

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/expenses` | Paginated recorded expenses. `includeVoided=true` includes voided rows. |
| POST | `/expenses` | Record an expense. Categories: rent, transport, utilities, wages, supplies, other. |
| PATCH | `/expenses/:id` | Edit a recorded expense, or send `{ "status": "VOIDED" }`. |

## Customers

| Method | Path | Purpose |
| --- | --- | --- |
| GET, POST | `/customers` | List (with outstanding balance) or create. |
| GET, PATCH | `/customers/:id` | Detail, including sales and repayments, or edit the profile. |
| DELETE | `/customers/:id` | Remove a customer who has no outstanding balance. Past sales stay in the history. |
| POST | `/customers/:id/repayments` | Record a repayment against one open sale. |

## Reports

All report routes are shop-scoped. `from` and `to` are inclusive calendar days in the shop timezone (`YYYY-MM-DD`).

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/reports/dashboard` | Today, month, selected period, low stock, recent sales, trend. |
| GET | `/reports/sales` | Revenue, collected cash, gross profit estimate, best sellers. |
| GET | `/reports/expenses` | Expense total by category. Voided expenses are excluded. |
| GET | `/reports/inventory` | On-hand cost value and potential selling value. |
| GET | `/reports/customer-balances` | Open credit by customer. |

Voided sales are excluded from revenue and profit. Unpaid balances are not counted as collected cash.
