# Deployment

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
```

## Vercel

`vercel.json` sets `"framework": "nextjs"` and nothing else — Vercel infers build settings automatically. Push to `main` to trigger a production deploy.

## Environment variables

All server-side unless marked otherwise. Every one is read lazily at request time, never at module
load: Next inlines statically-resolvable `process.env` reads into the build, so a value added to
Vercel after the last build would otherwise stay undefined until something forced a rebuild.

### Licensing and email (required)

| Variable | What it is |
|---|---|
| `INTER_APP_API_KEY` | Client API inter-app key. Never reaches the browser. |
| `CPT_LICENCE_ID` | The subscription licence tier's id in the Client app. |
| `CPT_APPLICATION_ID` | CPT's row in the Applications table. Defaults to `2`. |
| `CLIENT_API_BASE_URL` | Defaults to `https://api-client.limitlesssoft.com`. |
| `CLIENT_PORTAL_URL` | Defaults to `https://client.limitlesssoft.com`. |
| `RESEND_API_KEY` | Sends the welcome, renewal and reminder emails. |
| `RESEND_FROM` | Defaults to `Cross Platform Terminal <noreply@crossplatformterminal.com>`. |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin. Used in emails, the sitemap, and Polar's return URL. |
| `CRON_SECRET` | Guards `/api/renewal-reminders`. **Unset ⇒ the route refuses to run**, deliberately. |

### Crypto payments — NOWPayments

| Variable | What it is |
|---|---|
| `NOWPAYMENTS_API_KEY` | Creates the invoice. |
| `NOWPAYMENTS_IPN_SECRET` | Verifies the IPN signature on `/api/payment-webhook`. |
| `DISCOUNT_CODES` | `CODE:percent` pairs, comma-separated, e.g. `LAUNCH:25,FRIEND:100`. Crypto path only. |

### Card payments — Polar

Absent or incomplete, the card button answers "card payments are unavailable" and the crypto path
carries on working. See "Polar, and what it is not" in `architecture.md`.

| Variable | What it is |
|---|---|
| `POLAR_ACCESS_TOKEN` | Organization access token. Scopes needed: `checkouts:write`, `checkouts:read`, `subscriptions:read`. |
| `POLAR_WEBHOOK_SECRET` | The secret shown when the webhook endpoint is created. |
| `POLAR_PRODUCT_MONTHLY` | Product id of the monthly recurring product. |
| `POLAR_PRODUCT_YEARLY` | Product id of the yearly recurring product. |
| `POLAR_SERVER` | `sandbox` to use sandbox.polar.sh. Anything else (or unset) means production. |

**Sandbox and production do not share anything.** Token, product ids and webhook secret all come
from one environment or the other, and they move as a set.

The webhook endpoint is configured in Polar at
`https://<your-domain>/api/polar/webhook`, delivering **Raw JSON**, subscribed to `order.paid` and
`subscription.revoked`. Nothing else is needed; other events are accepted and ignored.

## Build & lint

```bash
npm run build        # production build
npm run lint         # ESLint (config in eslint.config.mjs)
```

## Updating screenshots

Run the helper script whenever the app UI changes and new baselines land on `screenshot-baselines`:

```bash
bash scripts/update-screenshots.sh
git add public/screenshots/
git commit -m "sync screenshots"
git push
```

The script reads `screenshots.config.json` to know which files to pull. Add or remove entries there to control which screenshots appear in the hero stack. See `docs/screenshots.md` for details.

## Enabling macOS downloads

When a macOS build is added to the `ar-workspace-release` GitHub releases:

1. Open `src/app/download/page.tsx`.
2. Add a `macos` field to the `Release` type and an asset match (e.g. `.dmg`).
3. Replace the disabled macOS card with a live `<DownloadButton>`.

No other changes needed — the download page already fetches the latest release at runtime.

## Release checklist

1. Sync screenshots if the app UI changed (see above).
2. Push `main` — Vercel deploys automatically.
3. The `/download` page picks up new release assets automatically via the GitHub API — no code change needed when a new version is published.
