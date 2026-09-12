import { createHash } from "node:crypto";

import { Webhook, WebhookVerificationError } from "standardwebhooks";

import { getLicence, grantLicence } from "@/lib/client-api";
import { expiryFor } from "@/lib/plans";
import { provisionPurchase } from "@/lib/provision";
import { webhookSecret } from "@/lib/polar";

/**
 * Where a card payment turns into a CPT licence.
 *
 * Polar bills the card; this dates the licence. The two stay in step because the date written here
 * is always Polar's own `current_period_end` — the exact span the customer has been charged for —
 * rather than anything recomputed on this side. That has three useful consequences:
 *
 *   * A redelivered webhook is a no-op. `grantLicence` overwrites rather than extends, so writing
 *     the same absolute date twice changes nothing. (The crypto path goes to some trouble to encode
 *     a period into the order id for the same reason; here Polar already carries it.)
 *   * A renewal needs no special case. Polar charges the card, emits `order.paid` with the period
 *     pushed forward, and the licence follows it.
 *   * A cancellation needs no handling at all. Polar simply stops charging, no further `order.paid`
 *     arrives, and the licence lapses on its own date — exactly how an unrenewed crypto
 *     subscription ends today. Only `subscription.revoked`, which is Polar cutting access *early*
 *     (a refund or a chargeback), needs anything doing.
 *
 * Polar's licence-key benefit is not used; see `lib/polar.ts`.
 */

/** Absorbs sub-second truncation between the date we wrote and the one the database returns. */
const TOLERANCE_MS = 60_000;

export async function POST(request: Request) {
  // The raw bytes, not the parsed object: the signature covers the body exactly as it was sent.
  const body = await request.text();

  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    headers[key] = value;
  });

  let payload;
  try {
    payload = verifyDelivery(body, headers);
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      console.error(`[polar/webhook] Refused a delivery: ${describeRejection(e, headers)}`);
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
    // An unset secret lands here. Ours to fix rather than Polar's, but a retry costs nothing.
    console.error("[polar/webhook] Could not verify a delivery:", e);
    return Response.json({ error: "Verification failed" }, { status: 500 });
  }

  const type = (payload as { type?: unknown }).type;

  if (type === "order.paid") return handleOrderPaid(readPaidOrder(payload));
  if (type === "subscription.revoked") return handleRevoked(readRevokedSubscription(payload));

  // Subscribed to something extra in the dashboard. Nothing to do, and no reason to retry.
  return Response.json({ ok: true });
}

/**
 * The parts of an `order.paid` payload this route actually uses.
 *
 * Read straight out of the signed JSON rather than through the SDK's generated schema, and that is
 * the whole point: the schema validates the *entire* payload against one API version, so a field
 * changing anywhere in it — in a corner of the order this route has never looked at — failed the
 * parse and dropped the event. Polar stamps each endpoint with an API version and the SDK is
 * generated against another, so the two drift by design; ours sends `2026-10` to an SDK built for
 * `2026-04`.
 *
 * Losing an event that way is the worst shape a bug in here can take: the money is taken, the parse
 * fails, the delivery is accepted so Polar never retries, and the buyer is left holding a receipt
 * and no account. Five stable fields — two ids, an email, two dates — cannot drift like that, and
 * anything genuinely missing is caught by the checks in the handlers, loudly and retryably.
 */
interface PaidOrder {
  id: string;
  email: string | null;
  /** When Polar took the money. Null if absent or unparseable; the staleness check then uses now. */
  createdAt: Date | null;
  /** False for a one-off purchase, which is a misconfigured product rather than a customer. */
  hasSubscription: boolean;
  /** Polar's `current_period_end`: the span actually charged for. Null if missing or unparseable. */
  paidThrough: Date | null;
  billingReason: string;
}

/** The parts of a `subscription.revoked` payload this route uses. See {@link PaidOrder}. */
interface RevokedSubscription {
  id: string;
  email: string | null;
  currentPeriodEnd: Date | null;
}

function readPaidOrder(payload: unknown): PaidOrder {
  const data = field(payload, "data");
  const subscription = field(data, "subscription");

  return {
    id: text(field(data, "id")) ?? "<unknown>",
    email: text(field(field(data, "customer"), "email")),
    createdAt: date(field(data, "created_at")),
    hasSubscription: typeof subscription === "object" && subscription !== null,
    paidThrough: date(field(subscription, "current_period_end")),
    billingReason: text(field(data, "billing_reason")) ?? "unknown",
  };
}

function readRevokedSubscription(payload: unknown): RevokedSubscription {
  const data = field(payload, "data");

  return {
    id: text(field(data, "id")) ?? "<unknown>",
    email: text(field(field(data, "customer"), "email")),
    currentPeriodEnd: date(field(data, "current_period_end")),
  };
}

/** One property of a value that may not be an object at all. */
function field(value: unknown, name: string): unknown {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)[name]
    : undefined;
}

function text(value: unknown): string | null {
  return typeof value === "string" && value.trim() !== "" ? value.trim() : null;
}

/** An ISO date from the payload, or null. Never a silently wrong one — callers decide what to do. */
function date(value: unknown): Date | null {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Verifies a delivery against both of Polar's signing schemes and returns the signed JSON.
 *
 * Polar changed how the signing key is derived from the dashboard secret on 8 September 2026.
 * A secret issued before then is keyed on the UTF-8 bytes of the whole `whsec_…` string; one
 * issued on or after is plain Standard Webhooks, keyed on that string's base64 *decoding*. The
 * same displayed secret therefore produces two completely different HMACs, and which one is
 * correct depends only on the day the secret was minted.
 *
 * `validateEvent` in @polar-sh/sdk 0.49.0 knows only the older scheme: it base64-encodes the
 * secret before handing it to the Standard Webhooks verifier, which decodes it straight back into
 * the string's own bytes. Against a secret minted after the cut-off that can never match, and it
 * fails as "No matching signature found" — indistinguishable from simply holding the wrong secret,
 * which is an afternoon of rotating perfectly good credentials to find out.
 *
 * Polar's own remedy is an SDK 1.0 alpha that tries both keys. Trying both here costs one extra
 * HMAC on a delivery that was going to be refused anyway, and keeps a pre-release major off the
 * path that takes people's money.
 */
function verifyDelivery(body: string, headers: Record<string, string>): unknown {
  const secret = webhookSecret();

  // Standard Webhooks, as issued from 8 September 2026: the library strips `whsec_` and
  // base64-decodes the rest into the key.
  try {
    return new Webhook(secret).verify(body, headers);
  } catch (e) {
    if (!(e instanceof WebhookVerificationError)) throw e;
  }

  // Polar's older scheme. Pre-encoding is what the SDK does, and it round-trips through the
  // library's own decode to leave the key as the secret's literal bytes.
  return new Webhook(Buffer.from(secret, "utf-8").toString("base64")).verify(body, headers);
}

/**
 * Why a delivery was refused, in enough detail to tell the causes apart.
 *
 * A 401 out of `validateEvent` has three quite different meanings — the secret does not match, the
 * `webhook-timestamp` falls outside Standard Webhooks' five-minute tolerance, or the signature
 * headers never arrived at all. From Polar's delivery list those look identical, so diagnosing a
 * dead endpoint otherwise means guessing at configuration and spending a real card payment per
 * guess. That is exactly how this went wrong once already.
 *
 * The staleness case is the one worth naming explicitly: Polar's "Redeliver" button replays an
 * event that was signed minutes or hours earlier, so a replay of anything older than the tolerance
 * is refused however correct the secret is. Read as "bad secret", it sends you off changing
 * settings that were never wrong.
 *
 * Nothing logged here is a secret. The ids are Polar's own, and the configured secret appears only
 * as a truncated hash — enough to compare against the value in the dashboard, not enough to sign
 * anything with.
 */
function describeRejection(e: WebhookVerificationError, headers: Record<string, string>): string {
  const signedAt = Number(headers["webhook-timestamp"]);
  const age = Number.isFinite(signedAt) ? Math.round(Date.now() / 1000 - signedAt) : null;

  return [
    `reason=${JSON.stringify(e.message)}`,
    `webhook-id=${headers["webhook-id"] ?? "<missing>"}`,
    age === null
      ? "webhook-timestamp=<missing or unparseable>"
      : `signed ${age}s ago (tolerance 300s)`,
    `secret=${secretFingerprint()}`,
  ].join(" ");
}

/**
 * A fingerprint of the configured signing secret: the first 8 hex of its SHA-256, and its length.
 *
 * Enough to tell whether the value deployed here is the same string as the one Polar shows — run
 * the same hash over that value and compare — while being useless for forging a signature. The
 * length catches the copy-paste accidents a hash alone would only report as "different": a
 * truncated paste, a wrapping quote, a doubled value.
 */
function secretFingerprint(): string {
  try {
    const secret = webhookSecret();
    const digest = createHash("sha256").update(secret).digest("hex").slice(0, 8);
    return `sha256:${digest} len=${secret.length}`;
  } catch {
    // `webhookSecret()` throws when the variable is unset, which cannot reach this branch — an
    // unset secret fails before any signature is checked and leaves as a 500. Worth reporting
    // rather than swallowing: seeing it means the environment changed under a running request.
    return "<not set>";
  }
}

async function handleOrderPaid(order: PaidOrder): Promise<Response> {
  /*
   * The address Polar actually charged, not the one our checkout suggested. The buyer can change it
   * on the Polar page, and the account they get should be the one they think they bought.
   */
  const email = order.email;

  if (!email || !email.includes("@")) {
    console.error(`[polar/webhook] Order ${order.id} has no usable customer email`);
    return Response.json({ error: "Missing customer email" }, { status: 400 });
  }

  if (!order.hasSubscription) {
    // A one-off purchase. Nothing we sell on Polar is one-off, so this is a product configured
    // wrongly rather than a customer to provision — and guessing a period would be worse.
    console.error(
      `[polar/webhook] Order ${order.id} for ${email} carries no subscription; not provisioning`
    );
    return Response.json({ ok: true, ignored: true }, { status: 202 });
  }

  const paidThrough = order.paidThrough;

  if (!paidThrough) {
    console.error(`[polar/webhook] Order ${order.id}: missing or unusable current_period_end`);
    return Response.json({ error: "Unusable billing period" }, { status: 500 });
  }

  /*
   * The one sanity check worth making. Everything downstream trusts this date, and a period ending
   * before the payment that bought it would mean Polar sent state from before the renewal rolled
   * over — in which case granting it would leave a paid-up customer locked out until the *next*
   * cycle. A 5xx is right: Polar retries, and by then the subscription has moved on.
   *
   * Falling back to now when the order carries no readable `created_at` keeps the check alive
   * rather than skipping it: the event has only just arrived, so "the period ends before now" is
   * the same stale state, caught the same way.
   */
  const paidAt = order.createdAt ?? new Date();

  if (paidThrough.getTime() <= paidAt.getTime()) {
    console.error(
      `[polar/webhook] Order ${order.id}: period ends ${paidThrough.toISOString()}, ` +
        `before the payment at ${paidAt.toISOString()}. Asking Polar to redeliver.`
    );
    return Response.json({ error: "Stale billing period" }, { status: 500 });
  }

  const expiresAt = expiryFor(paidThrough);

  try {
    const { outcome } = await provisionPurchase(email, expiresAt);
    console.log(
      `[polar/webhook] ${email}: ${outcome} (order ${order.id}, ${order.billingReason}, ` +
        `through ${expiresAt.toISOString()})`
    );
  } catch (e) {
    console.error("[polar/webhook] Provisioning failed:", e);
    // Same bargain as the crypto webhook: a redelivery recomputes the identical date, and a paid
    // customer with no account is far worse than Polar trying again.
    return Response.json({ error: "Provisioning failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}

/**
 * Polar has ended a subscription outright — a refund or a chargeback, rather than someone
 * cancelling and running out their paid period.
 *
 * A natural cancellation never reaches here until the period is over anyway, so cutting access to
 * "now" is correct in both cases. What it must not do is shorten time the customer bought
 * *elsewhere*: an account can hold a licence that outlives this subscription because they paid in
 * crypto as well, and revoking a card payment is no reason to take that away.
 */
async function handleRevoked(subscription: RevokedSubscription): Promise<Response> {
  const email = subscription.email;

  if (!email || !email.includes("@")) {
    console.error(`[polar/webhook] Subscription ${subscription.id} has no usable customer email`);
    return Response.json({ error: "Missing customer email" }, { status: 400 });
  }

  let held;
  try {
    held = await getLicence(email);
  } catch (e) {
    console.error("[polar/webhook] Licence lookup failed during revoke:", e);
    return Response.json({ error: "Lookup failed" }, { status: 500 });
  }

  if (!held) {
    // Already lapsed, or never provisioned. Nothing to revoke.
    return Response.json({ ok: true });
  }

  if (held.expiresAt === null) {
    console.log(`[polar/webhook] ${email} holds a perpetual licence; leaving it alone`);
    return Response.json({ ok: true });
  }

  if (!subscription.currentPeriodEnd) {
    /*
     * Without the period there is no telling a licence this subscription paid for from one the same
     * person bought in crypto, and revoking the wrong one takes away access someone paid for. A 5xx
     * keeps it visible and retryable; a refunded customer keeping access a little longer is much
     * the cheaper mistake.
     */
    console.error(
      `[polar/webhook] Subscription ${subscription.id}: missing current_period_end; not revoking`
    );
    return Response.json({ error: "Unusable billing period" }, { status: 500 });
  }

  const grantedForThisSubscription = expiryFor(subscription.currentPeriodEnd);

  if (held.expiresAt.getTime() > grantedForThisSubscription.getTime() + TOLERANCE_MS) {
    console.log(
      `[polar/webhook] ${email} holds a licence to ${held.expiresAt.toISOString()}, past this ` +
        `subscription's ${grantedForThisSubscription.toISOString()}. Not revoking.`
    );
    return Response.json({ ok: true });
  }

  try {
    // The Client API drops expired licences from every lookup, so an expiry of "now" is how access
    // ends. Safe to repeat: writing it twice lands on the same already-expired state.
    await grantLicence(email, new Date());
    console.log(`[polar/webhook] Revoked ${email} (subscription ${subscription.id})`);
  } catch (e) {
    console.error("[polar/webhook] Revoke failed:", e);
    return Response.json({ error: "Revoke failed" }, { status: 500 });
  }

  return Response.json({ ok: true });
}
