import { NowPaymentsSDK } from "@nowpaymentsio/nowpayments-sdk-nodejs";
import { hasLicence } from "@/lib/client-api";
import { provisionPurchase } from "@/lib/provision";

const sdk = new NowPaymentsSDK({
  apiKey: process.env.NOWPAYMENTS_API_KEY!,
  ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET!,
  ipnCallbackUrl: "https://crossplatformterminal.com/api/payment-webhook",
});

const BASE_PRICE = 8;

const PORTAL_URL = process.env.CLIENT_PORTAL_URL ?? "https://client.limitlesssoft.com";

function parseDiscountCodes(): Map<string, number> {
  const map = new Map<string, number>();
  for (const entry of (process.env.DISCOUNT_CODES ?? "").split(",")) {
    const [code, pct] = entry.trim().split(":");
    if (code && pct) map.set(code.toUpperCase(), Number(pct));
  }
  return map;
}

export async function POST(request: Request) {
  const { email, discountCode } = await request.json();

  if (!email || !String(email).includes("@")) {
    return Response.json({ error: "Valid email required" }, { status: 400 });
  }

  // Before taking any money: a licence is perpetual and covers the account, so a second purchase
  // for the same email would buy nothing. Point them at the portal instead.
  try {
    if (await hasLicence(String(email))) {
      return Response.json({ alreadyOwned: true, portalUrl: PORTAL_URL });
    }
  } catch (e) {
    // A lookup failure must not block a legitimate sale — worst case a repeat buyer reaches
    // checkout, and provisionPurchase still refuses to double-provision.
    console.error("[create-invoice] Licence lookup failed, continuing:", e);
  }

  let discountPercent = 0;
  if (discountCode) {
    const codes = parseDiscountCodes();
    const pct = codes.get(String(discountCode).toUpperCase());
    if (pct === undefined) {
      return Response.json({ error: "Invalid discount code" }, { status: 400 });
    }
    discountPercent = pct;
  }

  // 100% discount — provision immediately, no payment to wait for
  if (discountPercent >= 100) {
    try {
      await provisionPurchase(String(email));
      return Response.json({ free: true, emailed: true });
    } catch (e) {
      // Log the real cause; show the buyer something that isn't our configuration.
      console.error("[create-invoice] Free provisioning failed:", e);
      return Response.json(
        { error: "We couldn't set up your licence. Please contact support." },
        { status: 500 }
      );
    }
  }

  const finalAmount = parseFloat(
    (BASE_PRICE * (1 - discountPercent / 100)).toFixed(2)
  );

  const checkout = await sdk.createCheckout({
    amount: finalAmount,
    currency: "eur",
    orderId: `cpt-${Date.now()}`,
    description: String(email),
  });

  return Response.json({
    embedUrl: `https://nowpayments.io/embeds/payment-widget?iid=${checkout.id}`,
    finalAmount,
    discountPercent,
  });
}
