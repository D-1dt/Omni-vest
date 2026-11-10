# Architecture rules

- Investments and vehicle orders are created only via server functions in `src/lib/orders.functions.ts` (prices from catalog, user from JWT) — browser has SELECT-only access so it can't forge ownership, price or status.
- 2-hour windows (`activates_at`, `verification_time`) are set by DB triggers from `now()` — client timestamps are never trusted.
- Delivery submission goes through the `submit_vehicle_delivery` RPC (SECURITY DEFINER, owner + time checked) — the linter warning about it is intentional.
- Receipts live in the private `receipts` bucket at `{user_id}/{uuid}.{ext}`, written only by the server after magic-byte validation — prevents spoofed files and cross-user access.
- AI endpoints (`/api/grok`) require a verified bearer token and build portfolio context from the DB, never from the request body; `/api/chat` stays public but is size-capped and same-origin only — prevents forged context and bulk abuse.
- `portfolios` is read-only for users (no INSERT/UPDATE grants); balances are derived from `investments` — the browser can't write its own balance.
- Purchases require a confirmed email and are capped per user per hour in `orders.functions.ts`; failed inserts delete their uploaded receipt.
- Quote/candle lookups only accept the listed public tickers — protects the market-data API quota.
- Public AI routes parse request bodies through a bounded stream reader before JSON decoding — limits memory use from oversized requests.
- The server response wrapper adds browser security headers consistently, including generic error responses — keeps protection on failure paths too.
- Vehicle offer prices and identifiers belong in the shared catalog used by both the purchase page and server-side order validation, so browser-supplied amounts are never authoritative.
- Roadster orders accept only a server-catalog-derived 50% deposit or full payment, preserving the selected amount through the existing checkout and receipt flow.
