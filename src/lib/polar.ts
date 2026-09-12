/**
 * Polar (polar.sh) — card payments, and nothing else.
 *
 * Polar is the merchant of record for the card path: it takes the money, charges the card again at
 * the start of each period, handles VAT and issues the invoice. That is the whole of its job here.
 *
 * In particular, Polar's own licence-key benefit is deliberately **not** used. A CPT licence lives
 * in the Client API (`lib/client-api.ts`) and is granted by `provisionPurchase` — identically for a
 * card payment and a crypto one — so the app has exactly one place to check and a buyer who
 * switches payment method keeps the same account. The Polar product should therefore be created
 * with no benefits attached at all.
 *
 * The access token must never reach the browser, so nothing in this file may be imported from a
 * client component.
 */

import { Polar } from "@polar-sh/sdk";

import type { Plan, PlanId } from "@/lib/plans";

/**
 * Every value is read lazily rather than at module load.
 *
 * Next inlines statically-resolvable `process.env` reads at build time, so a value added to Vercel
 * after the last build would otherwise stay undefined until something forced a rebuild. The same
 * trap `lib/client-api.ts` documents for `CPT_LICENCE_ID`.
 */
function required(name: string): string {
  const value = process.env[name];

  if (value === undefined || value.trim() === "") {
    throw new Error(`${name} is not set`);
  }

  return value.trim();
}

/**
 * `sandbox` points the SDK at sandbox-api.polar.sh, which is a completely separate world: its own
 * organisation, products, tokens and test cards. Products created in one are invisible to the
 * other, so this and the product ids below always have to move together.
 */
function server(): "production" | "sandbox" {
  return process.env.POLAR_SERVER?.trim() === "sandbox" ? "sandbox" : "production";
}

export function polar(): Polar {
  return new Polar({ accessToken: required("POLAR_ACCESS_TOKEN"), server: server() });
}

export function webhookSecret(): string {
  return required("POLAR_WEBHOOK_SECRET");
}

/** Which Polar product sells which plan. One recurring product per billing period. */
const PRODUCT_ENV: Record<PlanId, string> = {
  monthly: "POLAR_PRODUCT_MONTHLY",
  yearly: "POLAR_PRODUCT_YEARLY",
};

export function productIdFor(plan: PlanId): string {
  return required(PRODUCT_ENV[plan]);
}

/**
 * Whether the card path can work at all right now.
 *
 * Used to answer "card payments are unavailable" politely instead of throwing a configuration error
 * at a buyer who was only trying to pay us.
 */
export function polarConfigured(): boolean {
  try {
    required("POLAR_ACCESS_TOKEN");
    required("POLAR_WEBHOOK_SECRET");
    productIdFor("monthly");
    productIdFor("yearly");
    return true;
  } catch {
    return false;
  }
}

/**
 * Why a Polar product cannot be sold against this plan, or null if it can.
 *
 * `lib/plans.ts` is supposed to be the only place a price or a period length is written down, and
 * for the crypto path it is: `create-invoice` charges `plan.amount` directly, and a unit test holds
 * the quoted price and the charged price together. The card path breaks that, because the number
 * Polar actually charges lives in Polar's dashboard, out of reach of the repository. Nothing stops
 * someone editing it there and leaving the site advertising the old price.
 *
 * So the drift is caught at the last possible moment instead: right before a buyer is sent to a
 * checkout, the product is read back and checked against the plan it claims to sell. A mismatch
 * refuses the sale. That is deliberately the harsh choice — a card button that is briefly broken is
 * an afternoon's annoyance, whereas charging a price the page never quoted is the kind of mistake
 * that is found by a chargeback.
 */
export async function productMismatch(plan: Plan): Promise<string | null> {
  const id = productIdFor(plan.id);
  const product = await polar().products.get({ id });

  if (product.isArchived) return `product ${id} is archived`;
  if (!product.isRecurring) return `product ${id} is one-off, not a subscription`;

  const wantedInterval = plan.months === 12 ? "year" : "month";
  if (product.recurringInterval !== wantedInterval) {
    return `product ${id} bills per ${product.recurringInterval}, plan wants per ${wantedInterval}`;
  }
  if ((product.recurringIntervalCount ?? 1) !== 1) {
    return `product ${id} bills every ${product.recurringIntervalCount} ${wantedInterval}s`;
  }

  const price = product.prices.find(isLivePrice);
  if (!price) return `product ${id} has no live fixed price`;

  if (price.priceCurrency.toLowerCase() !== "eur") {
    return `product ${id} is priced in ${price.priceCurrency}, the site quotes EUR`;
  }

  const wantedCents = Math.round(plan.amount * 100);
  if (price.priceAmount !== wantedCents) {
    return `product ${id} charges ${price.priceAmount}c, the site quotes ${wantedCents}c`;
  }

  return null;
}

/** A fixed, unarchived price. The other kinds (metered, seat-based, pay-what-you-want) are not ours. */
function isLivePrice<T>(price: T): price is T & { priceAmount: number; priceCurrency: string } {
  const candidate = price as {
    amountType?: unknown;
    isArchived?: unknown;
    priceAmount?: unknown;
    priceCurrency?: unknown;
  };

  return (
    candidate.amountType === "fixed" &&
    candidate.isArchived !== true &&
    typeof candidate.priceAmount === "number" &&
    typeof candidate.priceCurrency === "string"
  );
}

/** Where Polar should send the buyer back to. Absolute, because it is leaving our origin. */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL || "https://www.crossplatformterminal.com";
}

/**
 * Every address with a live card subscription, lower-cased.
 *
 * The renewal reminder exists because a crypto subscription cannot charge itself. A card one does,
 * so telling a card subscriber that their access "runs out in 7 days" would be false — and alarming
 * — three days before Polar quietly renews it. The licence rows themselves carry no trace of which
 * way they were paid for, so the only honest way to tell them apart is to ask Polar who it is still
 * billing.
 *
 * `active` covers the statuses Polar will still charge for. A subscription cancelled but running
 * out its paid period is *not* active, which is right: that person really is about to lapse and
 * should get the email.
 */
export async function activeSubscriberEmails(): Promise<Set<string>> {
  const emails = new Set<string>();

  for await (const page of await polar().subscriptions.list({ active: true, limit: 100 })) {
    for (const subscription of page.result.items) {
      const email = subscription.customer.email;
      if (email) emails.add(email.toLowerCase());
    }
  }

  return emails;
}
