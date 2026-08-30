# Site Architecture

## Routes

| Route | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Landing page — all sections |
| `/download` | `src/app/download/page.tsx` | Per-platform downloads (server component, ISR) |
| `/api/create-invoice` | `src/app/api/create-invoice/route.ts` | Starts a purchase |
| `/api/licence-status` | `src/app/api/licence-status/route.ts` | Has the purchase finished provisioning? |
| `/api/payment-webhook` | `src/app/api/payment-webhook/route.ts` | NOWPayments IPN → provisioning |

## Component tree

```
layout.tsx               ← metadata, font vars, global CSS
├── page.tsx             ← landing page, SoftwareApplication JSON-LD
│   ├── Navbar           ← fixed header, mobile menu, Escape to close
│   ├── Hero             ← headline, CTA pair, TerminalDemo
│   │   └── TerminalDemo ← the replaying session (client)
│   ├── Pillars          ← 4 claims, each with a spec tag
│   ├── Features         ← 6 feature cards
│   ├── CrossPlatform    ← platform quirks, then a folded shortcut table
│   ├── Pricing          ← one-time licence card + checkout modal (client)
│   ├── FAQ              ← accordion + FAQPage JSON-LD
│   └── Footer
└── download/page.tsx    ← platform cards, licence note
    ├── Navbar
    └── Footer
```

## Section anchor IDs

| Component | `id` | Linked from |
|---|---|---|
| Features | `#features` | Navbar |
| CrossPlatform | `#cross-platform` | Navbar |
| Pricing | `#pricing` | Navbar, Hero, Footer, download page |
| FAQ | `#faq` | Navbar, Footer |

`html { scroll-padding-top: 5rem }` in `globals.css` keeps anchored headings clear of the fixed
header. Adding a section without an entry above means adding a link too — an anchor with no target
is the failure mode this table exists to prevent.

## The hero demo

`TerminalDemo.tsx` replays a scripted CPT session as live DOM text. It replaced a stack of rotated
PNG screenshots, which at hero size rendered terminal type illegibly — the product's own UI could
not be read in its own hero.

- **Script** — `src/lib/demo-session.ts` exports `demo`, a list of ops (`type`, `run`, `out`, `key`,
  `split`, `newview`, `switchview`, `ai`, `tokens`, `caption`, `wait`). Changing what the demo shows
  means editing that file only.
- **Only real bindings.** Every shortcut shown in a `key` op must exist in the `shortcuts` table in
  `CrossPlatform.tsx`. Switching views is done by changing the active tab rather than a keystroke,
  because no binding for it is documented.
- **`applyInstant`** applies an op's effect without its timing. The player uses it for the
  structural ops; `stillFrame()` folds the whole script through it to produce the final frame, which
  is what renders under `prefers-reduced-motion: reduce`.
- **Gating** — the loop parks itself when the demo scrolls out of view (IntersectionObserver), when
  the tab is hidden, or when the viewer presses Pause. It does not unwind, so it resumes mid-step.
- **State** lives in a ref with a forced repaint rather than `useState`; the player mutates one
  object dozens of times per second and nothing outside the component reads it.

## Checkout flow

```
Pricing "Buy a licence"
  └─ email step  → POST /api/create-invoice
       ├─ alreadyOwned → portal link, no second purchase (the licence is perpetual)
       ├─ free (100% discount) → provisionPurchase() → success
       └─ otherwise → NOWPayments widget in an iframe
            └─ poll POST /api/licence-status every 4s
                 └─ provisioned:true → success screen
```

The success screen is driven by `hasLicence`, never by a button. `provisionPurchase` grants the
licence **last**, so a true result means the account exists and the credentials email has gone out.
An earlier version had an "I've paid" button that set the success state on click, which reported a
completed purchase to anyone who pressed it.

Polling stops after 20 minutes and tells the buyer their email will still arrive; it does not claim
the purchase failed, because a slow crypto confirmation is not a failure.

## Pricing, and what it actually is

**€8, once, perpetual.** `grantLicence` passes `expiresAt: null`, `create-invoice` creates a single
checkout, and nothing in the codebase creates a recurring charge. The site previously showed
"€8 / month", a "Subscription" badge, and a `UnitPriceSpecification` with `unitText: "MONTH"` in its
JSON-LD, all while selling a lifetime licence. If a change reintroduces subscription language,
it is wrong unless the backend changed first.

## Download page

A server component with `export const revalidate = 600`. `src/lib/release.ts` fetches the latest
GitHub release once per revalidation window for all visitors, optionally authenticated with
`GITHUB_TOKEN`.

The fetch used to run in the browser on every visit, against a 60-requests-per-hour-per-IP limit —
so visitors sharing an office or VPN address saw "Could not fetch release info". Keep it on the
server.

Assets are matched by extension:

| Extension | Platform |
|---|---|
| `.AppImage` | Linux AppImage |
| `.tar.gz` | Linux tar.gz |
| `.zip` | Windows |

macOS is hardcoded as a disabled "Coming soon" card. When a build exists, add a `.dmg` match and
enable it.

A missing asset renders a link to the GitHub releases index, never a greyed-out pill — the old
placeholder was indistinguishable from a disabled button.

## Screenshots

`public/screenshots/` and `screenshots.config.json` are currently unused by the site. The captures
in them are CI-runner screenshots of an idle shell — almost entirely empty black — and showing them
was worse than showing nothing. Re-capture from a real machine with real work on screen before
adding a gallery section back.

## Design tokens

All colours are CSS custom properties defined in `src/app/globals.css` via Tailwind v4's
`@theme inline` block. Use them in JSX with `style={{ color: "var(--color-accent)" }}` etc.

| Token | Value | Role |
|---|---|---|
| `--color-background` | `#0c0c0f` | Page background |
| `--color-surface` | `#13131a` | Card backgrounds |
| `--color-surface-2` | `#1c1c26` | Table header / footer rows, disabled states |
| `--color-border` | `#252535` | All borders and dividers |
| `--color-foreground` | `#e2e2ec` | Primary text |
| `--color-muted` | `#6a6a85` | Secondary / label text |
| `--color-accent` | `#e07040` | Orange CTAs, icons, highlights |
| `--color-accent-dim` | `rgba(224,112,64,0.12)` | Icon badge backgrounds, pill backgrounds |
| `--color-blue` | `#4d9de0` | Spare; not yet used |

### Shared classes

`globals.css` also defines the interactive states, so components no longer mutate `style` from
`onMouseEnter`/`onMouseLeave` handlers — those never fired on touch and left keyboard users with no
feedback at all.

| Class | Use |
|---|---|
| `.cpt-accent-btn` | Primary orange button/link, with hover, active and disabled states |
| `.cpt-quiet` | Muted control that brightens on hover |
| `:focus-visible` | A global accent focus ring — do not remove it per-component |

## Stack notes

- **Next.js 16 / React 19** — check `node_modules/next/dist/docs/` before writing Next-specific
  code; v16 has breaking API changes (see `AGENTS.md`). Route segment config such as `revalidate`
  must be a literal, not an imported constant.
- **Tailwind CSS v4** — configured via `@theme inline` in CSS, not `tailwind.config.*`. There is no
  `tailwind.config.ts`.
- **Fonts** — Geist Sans (`--font-sans`) and Geist Mono (`--font-mono`) loaded via
  `next/font/google` in `layout.tsx` and exposed as CSS vars.
- **`"use client"`** — `Navbar`, `TerminalDemo` and `Pricing` only. Everything else, the download
  page included, is a server component.
- **Internal links use `next/link`.** Plain `<a>` to an internal route trips the ESLint rule.
