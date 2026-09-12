import { getLicence } from "@/lib/client-api";
import { paidThroughOf } from "@/lib/plans";
import { polar, polarConfigured } from "@/lib/polar";
import { clientIp, createThrottle } from "@/lib/throttle";

/**
 * Tells `/purchase/complete` how far along a card purchase is.
 *
 * Polar sends the buyer back the moment the card clears, which is *before* the `order.paid` webhook
 * has opened their account. So there are two questions, not one: has Polar taken the money, and has
 * our side finished provisioning? Answering only the first would show "check your email" to someone
 * whose email had not been sent yet.
 *
 * Unlike `/api/licence-status`, no `notBefore` is needed: the card path refuses to open a checkout
 * for an address that already holds a live licence, so "they have one now" can only mean this
 * purchase landed.
 */

/** The checkout id is unguessable, but this still talks to two APIs per call. */
const throttled = createThrottle(40);

export async function POST(request: Request) {
  if (throttled(clientIp(request))) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { checkoutId } = await request.json().catch(() => ({ checkoutId: null }));

  if (!checkoutId || typeof checkoutId !== "string") {
    return Response.json({ error: "checkoutId required" }, { status: 400 });
  }

  if (!polarConfigured()) {
    return Response.json({ state: "unavailable" });
  }

  try {
    const checkout = await polar().checkouts.get({ id: checkoutId });

    if (checkout.status === "failed" || checkout.status === "expired") {
      return Response.json({ state: "failed" });
    }

    if (checkout.status !== "succeeded") {
      return Response.json({ state: "paying" });
    }

    const email = checkout.customerEmail;
    if (!email) {
      // Succeeded but nothing to look up. The webhook provisions from Polar's own customer record
      // regardless, so this is a display problem, not a lost sale.
      return Response.json({ state: "provisioning" });
    }

    const licence = await getLicence(email);

    if (!licence) {
      return Response.json({ state: "provisioning", email });
    }

    return Response.json({
      state: "ready",
      email,
      endsAt: licence.expiresAt ? paidThroughOf(licence.expiresAt).toISOString() : null,
    });
  } catch (e) {
    // An outage here must not read as a failed purchase — the money is taken either way, and the
    // welcome email is the buyer's real receipt. Say "still working on it" and let the poll retry.
    console.error("[polar/status] Lookup failed:", e);
    return Response.json({ state: "provisioning", unavailable: true });
  }
}
