# Cross Platform Terminal — marketing site

The public site for Cross Platform Terminal (CPT): landing page, download page, and the checkout
that provisions a licence.

Built with Next.js 16 (App Router, Turbopack) and Tailwind CSS 4. Deployed on Vercel.

## Running locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # production build
npm run lint
```

## Environment

Checkout and provisioning need these set (see `.env`):

| Variable | Purpose |
|---|---|
| `NOWPAYMENTS_API_KEY` / `NOWPAYMENTS_IPN_SECRET` | Crypto checkout and webhook signature |
| `INTER_APP_API_KEY` | Auth for the Client API — server only, never expose |
| `CLIENT_API_BASE_URL` | Client API host (defaults to the production one) |
| `CPT_APPLICATION_ID` / `CPT_LICENCE_ID` | Which application and licence tier to grant |
| `CLIENT_PORTAL_URL` | Where existing customers manage their account |
| `RESEND_API_KEY` / `RESEND_FROM` | Licence emails |
| `DISCOUNT_CODES` | `CODE:PERCENT,CODE:PERCENT`; 100% provisions without payment |
| `GITHUB_TOKEN` | Optional. Lifts the rate limit on the release lookup |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin for metadata, sitemap and robots |

## What the product costs

One payment of €8 for a perpetual licence — `grantLicence` sets `expiresAt: null` and there is no
recurring billing anywhere in the checkout. Anything on the site that describes a subscription is a
bug; see `src/components/FAQ.tsx`, whose answers are sourced from `src/lib/`.

## Docs

- [`docs/architecture.md`](docs/architecture.md) — routes, component tree, checkout flow
- [`docs/deployment.md`](docs/deployment.md) — deploying
- [`docs/screenshots.md`](docs/screenshots.md) — the screenshot pipeline
