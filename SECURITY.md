# Security notes — demo build

This repository is configured for a browser-only demonstration, not production financial use.

- No Supabase credentials or service-role keys are required or included.
- Demo records and uploaded receipt data URLs are stored in browser `localStorage` and can be read or modified by that browser's user.
- Never upload real payment receipts, identity documents, passwords, or sensitive personal data.
- No real payments or investment transactions are accepted or verified.
- Do not reuse this architecture for a production financial service. A production release requires server-side authentication, authorization, validation, durable database storage, secure file storage, audit logs, and payment-provider integration.
