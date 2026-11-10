# Omni-Musk — Browser-Only Demo

Omni-Musk is a public demonstration build of the vehicle configurator and investment-portfolio experience. It is designed to deploy on Vercel while keeping demo records in each visitor's browser `localStorage`.

## Demo-mode behavior

- No sign-up, sign-in, password reset, Google authentication, Supabase Auth, or Supabase database.
- Visitors enter directly and use a shared demo identity inside their own browser.
- Investment submissions, vehicle orders, delivery details, and receipt previews are saved in that browser's `localStorage`.
- The existing two-hour simulated verification period is retained.
- Data is not uploaded to a database and is not shared with other visitors or devices.
- Clearing site data, changing browser/profile, or using another device starts a separate demo and may remove the visitor's saved demo records.
- This is not a real financial service. No money, investments, vehicle purchases, or payment verification are processed.

Receipt files are converted to data URLs and stored in `localStorage`. For reliability, the demo limits each receipt to approximately 1.5 MB. Do not upload sensitive or real payment documents. Browser storage has limited capacity; large or numerous files can fill it.

## Requirements

- Node.js 22 or newer
- npm

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

1. Push this project to a GitHub repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Confirm the framework is detected as **TanStack Start**. The repository includes `vercel.json` and a Vercel Nitro preset configuration.
4. Deploy. No Supabase project, database credentials, auth provider, or environment variables are required for the core demo flows.

The application still uses Vercel's server runtime for TanStack Start routing, the optional AI support chat, and server-side market-data functions. The demo's investment and vehicle records themselves are browser-only. The AI support chat requires an optional `LOVABLE_API_KEY`; live quote integrations can use an optional `FINNHUB_API_KEY`. Neither key is required for the main demo flows.

## Resetting a browser's demo data

In the browser's developer tools, open Application/Storage → Local Storage for the deployed site and delete the `omni-musk-demo-v1` key. This clears only that browser's local demo records.

## Important limitations

`localStorage` is not a secure database. Visitors can inspect and modify their own stored records using browser developer tools. There is no cross-device sync, shared admin review, server-side ownership validation, or secure payment processing in this demo build. Do not use it for real customers, real money, or sensitive personal information.
