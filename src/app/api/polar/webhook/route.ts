import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";
import type { Order } from "@polar-sh/sdk/models/components/order.js";
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js";

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

  let event;
  try {
    event = validateEvent(body, headers, webhookSecret());
  } catch (e) {
    if (e instanceof WebhookVerificationError) {
      return Response.json({ error: "Invalid signature" }, { status: 401 });
    }
    /*
     * Signed by Polar but unparseable — most likely an event type this SDK version predates. A
     * retry cannot fix that, so accept it loudly rather than making Polar redeliver it for days.
     */
    console.error("[polar/webhook] Signed payload could not be parsed:", e);
    return Response.json({ ok: true, ignored: true }, { status: 202 });
  }

  switch (event.type) {
    case "order.paid":
      return handleOrderPaid(event.data);
    case "subscription.revoked":
      return handleRevoked(event.data);
    default:
      // Subscribed to something extra in the dashboard. Nothing to do, and no reason to retry.
      return Response.json({ ok: true });
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
