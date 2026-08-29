import { NowPaymentsSDK } from "@nowpaymentsio/nowpayments-sdk-nodejs";
import { provisionPurchase } from "@/lib/provision";

const sdk = new NowPaymentsSDK({
  ipnSecret: process.env.NOWPAYMENTS_IPN_SECRET!,
});

export async function POST(request: Request) {
  const payload = await request.json();
  const sig = request.headers.get("x-nowpayments-sig") ?? "";

  let event;
  try {
    event = sdk.parseWebhook(payload, sig);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 401 });
  }

  if (event.type !== "payment.status_changed" || event.payment.status !== "paid") {
    return Response.json({ ok: true });
  }

  const email = payload.order_description;
  if (!email || !String(email).includes("@")) {
    console.error("[webhook] No customer email in order_description", payload);
    return Response.json({ error: "Missing customer email" }, { status: 400 });
  }

  try {
    const { alreadyProvisioned } = await provisionPurchase(String(email));
    console.log(
      alreadyProvisioned
        ? `[webhook] ${email} already provisioned (payment ${event.payment.payment_id})`
        : `[webhook] Provisioned ${email} (payment ${event.payment.payment_id})`
    );
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[webhook] Provisioning failed:", msg);
    // A non-2xx makes NOWPayments retry, which is what we want here: provisioning is idempotent,
    // and a paid customer with no account is worse than a repeated delivery attempt.
    return Response.json({ error: msg }, { status: 500 });
  }

  return Response.json({ ok: true });
}
