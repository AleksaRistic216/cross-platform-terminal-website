import { hasLicence } from "@/lib/client-api";

/**
 * Tells the checkout whether a purchase has finished landing.
 *
 * Crypto payments confirm out of band: the buyer pays in the NOWPayments widget, the IPN reaches
 * `/api/payment-webhook` some seconds or minutes later, and only then does the account exist. The
 * checkout polls this so it can say "done" when it is actually done. The old flow had a button the
 * buyer pressed themselves, which reported success to people who had paid nothing and to people
 * whose provisioning had not run yet.
 *
 * Granting the licence is the last step of `provisionPurchase`, so `hasLicence` is exactly the
 * "fully provisioned, email sent" marker.
 */

/**
 * Best-effort throttle. This reveals whether an address owns a licence, so it should not be a free
 * enumeration oracle — though it exposes nothing `/api/create-invoice` does not already. Memory is
 * per serverless instance, so treat this as friction against a naive loop, not a real rate limiter.
 */
const hits = new Map<string, { n: number; resetAt: number }>();
const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 40;

function throttled(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);

  if (!entry || now > entry.resetAt) {
    hits.set(ip, { n: 1, resetAt: now + WINDOW_MS });
    if (hits.size > 5000) {
      for (const [key, value] of hits) if (now > value.resetAt) hits.delete(key);
    }
    return false;
  }

  entry.n += 1;
  return entry.n > MAX_PER_WINDOW;
}

export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (throttled(ip)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }

  const { email } = await request.json().catch(() => ({ email: null }));

  if (!email || !String(email).includes("@")) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }

  try {
    return Response.json({ provisioned: await hasLicence(String(email)) });
  } catch (e) {
    // A lookup outage must not look like a failed purchase: report "not yet" and let the buyer
    // fall back to their email.
    console.error("[licence-status] Lookup failed:", e);
    return Response.json({ provisioned: false, unavailable: true });
  }
}
