import { getLicence } from "@/lib/client-api";
import { DEFAULT_PLAN, isPlanId, paidThroughOf, PLANS } from "@/lib/plans";
import { polar, polarConfigured, productIdFor, productMismatch, siteUrl } from "@/lib/polar";

/**
 * Starts a card subscription: hands the buyer a Polar checkout URL to be redirected to.
 *
 * The crypto path (`/api/create-invoice`) has to work out the licence date itself, because a
 * one-off invoice is all NOWPayments gives it. Nothing of the sort happens here: Polar owns the
 * billing period once the subscription exists, so this route decides only *whether* the buyer
 * should be sent to a checkout at all, and `/api/polar/webhook` dates the licence from whatever
 * period Polar actually charged for.
 */

const PORTAL_URL = process.env.CLIENT_PORTAL_URL ?? "https://client.limitlesssoft.com";

export async function POST(request: Request) {
  const { email, plan: planId } = await request.json().catch(() => ({ email: null }));

  if (!email || !String(email).includes("@")) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }

  if (!polarConfigured()) {
    // A missing token is our problem, not the buyer's, and the crypto button still works.
    console.error("[polar/checkout] Polar is not configured; refusing the card path");
    return Response.json(
      { error: "Card payments are unavailable right now. Please pay with crypto, or try later." },
      { status: 503 }
    );
  }

  const plan = PLANS[isPlanId(planId) ? planId : DEFAULT_PLAN];

  /*
   * Fail closed on a lookup blip, as `/api/create-invoice` does. The checks below are the only
   * thing standing between a buyer and a *recurring* charge for time they already hold, so guessing
   * "they have nothing" is how somebody ends up paying twice over.
   */
  let held;
  try {
    held = await getLicence(String(email));
  } catch (e) {
    console.error("[polar/checkout] Licence lookup failed, refusing to open a checkout:", e);
    return Response.json(
      { error: "We couldn't check your account just now. Please try again in a moment." },
      { status: 503 }
    );
  }

  // One of the grandfathered €24 lifetime licences. Nothing to sell them; see `provisionPurchase`.
  if (held && held.expiresAt === null) {
    return Response.json({ perpetual: true, portalUrl: PORTAL_URL });
  }

  /*
   * They already have time on the clock — almost always a crypto payment they made earlier, since
   * a card subscriber never lapses in the first place. Starting a card subscription today would
   * bill them from today for a period they have already bought, so this refuses and tells them
   * when to come back. Extending is still one crypto payment away.
   */
  if (held?.expiresAt) {
    return Response.json({
      alreadyActive: true,
      endsAt: paidThroughOf(held.expiresAt).toISOString(),
    });
  }

  /*
   * Last line of defence against the price on the page and the price in Polar drifting apart. See
   * `productMismatch` for why this refuses the sale rather than shrugging and charging whatever
   * Polar has.
   */
  try {
    const mismatch = await productMismatch(plan);
    if (mismatch) {
      console.error(`[polar/checkout] Refusing to sell the ${plan.id} plan: ${mismatch}`);
      return Response.json(
        { error: "Card payments are unavailable right now. Please pay with crypto, or try later." },
        { status: 503 }
      );
    }
  } catch (e) {
    console.error("[polar/checkout] Could not verify the product against the plan:", e);
    return Response.json(
      { error: "Card payments are unavailable right now. Please pay with crypto, or try later." },
      { status: 503 }
    );
  }

  const checkout = await polar().checkouts.create({
    products: [productIdFor(plan.id)],
    customerEmail: String(email),
    // Polar owns its own coupons; ours are a crypto-path thing and are not passed through.
    allowDiscountCodes: true,
    // Polar substitutes the real id, and `/purchase/complete` polls on it.
    successUrl: `${siteUrl()}/purchase/complete?checkout_id={CHECKOUT_ID}`,
    // Never read back as truth — the webhook trusts the customer Polar actually charged. This is
    // here so a support question can be answered from the Polar dashboard alone.
    metadata: { plan: plan.id, quotedEmail: String(email) },
  });

  return Response.json({ url: checkout.url, plan: plan.id });
}
