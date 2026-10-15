# Offline sales plan

Shop Manager can be installed as a PWA. The service worker caches the app shell and static assets only. It does not cache `/api` responses or financial records.

Offline sale recording is **not implemented**. If a sale cannot reach the server, the screen says a connection is required. The app does not show a success receipt for an unsaved sale.

## Later design

When offline sales are built, they should follow these rules:

1. Store a pending sale on the device with a client-generated idempotency key.
2. Show pending sales separately from synced receipts.
3. Send the pending sale with that same `Idempotency-Key` so a retry cannot create a duplicate.
4. Recalculate price and stock on the server at sync time. The device copy is a draft, not the receipt.
5. If stock or price changed while the device was offline, return a clear conflict instead of silently accepting the old total.
6. If two devices sell the last unit, the server accepts only the sale that still has stock and asks the other device to resolve the conflict.
7. Retry failed syncs without marking them successful.
8. Never merge two shops' pending queues.

Until that work exists, checkout stays online-only.
