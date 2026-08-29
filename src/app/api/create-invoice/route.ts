import { NowPaymentsSDK } from "@nowpaymentsio/nowpayments-sdk-nodejs";
import { provisionPurchase } from "@/lib/provision";

const sdk = new NowPaymentsSDK({
  apiKey: process.env.NOWPAYMENTS_API_KEY!,
  ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET!,
  ipnCallbackUrl: "https://crossplatformterminal.com/api/payment-webhook",
});

const BASE_PRICE = 8;

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
      const msg = e instanceof Error ? e.message : String(e);
      console.error("[create-invoice] Free provisioning failed:", msg);
      return Response.json({ error: msg }, { status: 500 });
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
