import { createHash } from "node:crypto";

import type { Order } from "@polar-sh/sdk/models/components/order.js";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js";
import { WebhookOrderPaidPayload$inboundSchema } from "@polar-sh/sdk/models/components/webhookorderpaidpayload.js";
import { WebhookSubscriptionRevokedPayload$inboundSchema } from "@polar-sh/sdk/models/components/webhooksubscriptionrevokedpayload.js";
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

  /*
   * Parsing is kept out of the handlers deliberately. A schema failure means this SDK version
   * predates the payload Polar sent, which no redelivery can fix, so it is accepted and logged. A
   * failure *inside* a handler is the opposite case — worth a 5xx so Polar tries again — and
   * sharing one `try` would quietly turn a failed provisioning into "accepted, ignored".
   */
  if (type === "order.paid") {
    let event;
    try {
      event = WebhookOrderPaidPayload$inboundSchema.parse(payload);
    } catch (e) {
      console.error("[polar/webhook] Signed order.paid payload could not be parsed:", e);
      return Response.json({ ok: true, ignored: true }, { status: 202 });
    }
    return handleOrderPaid(event.data);
  }

  if (type === "subscription.revoked") {
    let event;
    try {
      event = WebhookSubscriptionRevokedPayload$inboundSchema.parse(payload);
    } catch (e) {
      console.error("[polar/webhook] Signed subscription.revoked payload could not be parsed:", e);
      return Response.json({ ok: true, ignored: true }, { status: 202 });
    }
    return handleRevoked(event.data);
  }

  // Subscribed to something extra in the dashboard. Nothing to do, and no reason to retry.
  return Response.json({ ok: true });
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

async function handleOrderPaid(order: Order): Promise<Response> {
  /*
   * The address Polar actually charged, not the one our checkout suggested. The buyer can change it
   * on the Polar page, and the account they get should be the one they think they bought.
   */
  const email = order.customer.email;

  if (!email || !email.includes("@")) {
    console.error(`[polar/webhook] Order ${order.id} has no usable customer email`);
    return Response.json({ error: "Missing customer email" }, { status: 400 });
  }

  const subscription = order.subscription;

  if (!subscription) {
    // A one-off purchase. Nothing we sell on Polar is one-off, so this is a product configured
    // wrongly rather than a customer to provision — and guessing a period would be worse.
    console.error(
      `[polar/webhook] Order ${order.id} for ${email} carries no subscription; not provisioning`
    );
    return Response.json({ ok: true, ignored: true }, { status: 202 });
  }

  const paidThrough = subscription.currentPeriodEnd;

  /*
   * The one sanity check worth making. Everything downstream trusts this date, and a period ending
   * before the payment that bought it would mean Polar sent state from before the renewal rolled
   * over — in which case granting it would leave a paid-up customer locked out until the *next*
   * cycle. A 5xx is right: Polar retries, and by then the subscription has moved on.
   */
  if (!(paidThrough instanceof Date) || Number.isNaN(paidThrough.getTime())) {
    console.error(`[polar/webhook] Order ${order.id}: unusable current_period_end`, paidThrough);
    return Response.json({ error: "Unusable billing period" }, { status: 500 });
  }

  if (paidThrough.getTime() <= order.createdAt.getTime()) {
    console.error(
      `[polar/webhook] Order ${order.id}: period ends ${paidThrough.toISOString()}, ` +
        `before the payment at ${order.createdAt.toISOString()}. Asking Polar to redeliver.`
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
async function handleRevoked(subscription: Subscription): Promise<Response> {
  const email = subscription.customer.email;

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
