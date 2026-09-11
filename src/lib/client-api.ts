/**
 * Client API (api-client.limitlesssoft.com) — account and licence provisioning.
 *
 * The inter-app key lives only here, on the server. It must never reach the browser, so nothing in
 * this file may be imported from a client component.
 */

const baseUrl = () =>
  process.env.CLIENT_API_BASE_URL ?? "https://api-client.limitlesssoft.com";

/** Cross Platform Terminal in the Client app's Applications table. */
const applicationId = () => Number(process.env.CPT_APPLICATION_ID ?? 2);

/**
 * The subscription licence tier.
 *
 * Read lazily rather than at module load: Next inlines statically-resolvable process.env reads at
 * build time, so a value added after the last build would otherwise stay undefined until a rebuild.
 */
function licenceId(): number {
  const raw = process.env.CPT_LICENCE_ID;

  if (raw === undefined || raw.trim() === "") {
    throw new Error("CPT_LICENCE_ID is not set");
  }

  const parsed = Number(raw.trim());
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `CPT_LICENCE_ID must be a positive integer, got ${JSON.stringify(raw)}`
    );
  }

  return parsed;
}

function headers() {
  const apiKey = process.env.INTER_APP_API_KEY;
  if (!apiKey) throw new Error("INTER_APP_API_KEY is not set");
  return { "Content-Type": "application/json", "X-Api-Key": apiKey };
}

/**
 * Creates the buyer's account if the username is free.
 *
 * Returns true when it created one, false when the account already existed. The Client API makes
 * this decision — it will not touch an existing account, password included — so this is safe to
 * retry, which matters because payment webhooks redeliver.
 */
export async function createAccount(username: string, password: string): Promise<boolean> {
  const res = await fetch(`${baseUrl()}/accounts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ username, password, nickname: username }),
  });

  if (!res.ok) {
    throw new Error(`Client API account creation failed (${res.status})`);
  }

  const body = await res.json().catch(() => ({}));
  return body?.created === true;
}

/**
 * What the buyer currently holds.
 *
 * `expiresAt: null` is a perpetual licence — one of the €24 lifetime licences sold before the
 * subscription. Those are grandfathered and must never be given a date; see `provisionPurchase`.
 */
export interface HeldLicence {
  expiresAt: Date | null;
}

/**
 * The buyer's live licence for CPT, or null if they have none.
 *
 * The Client API filters expired licences out of this response, so a lapsed subscriber reads as
 * "no licence" — which is exactly how the rest of the flow should treat them. When an account
 * somehow holds several, the one that lasts longest wins, matching how the Terminal API picks the
 * licence it reports to the app.
 */
export async function getLicence(username: string): Promise<HeldLicence | null> {
  const res = await fetch(
    `${baseUrl()}/accounts/${encodeURIComponent(username)}/licences?applicationId=${applicationId()}`,
    { headers: headers(), cache: "no-store" }
  );

  // An unknown account is not an error here — it just has no licence yet.
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Client API licence lookup failed (${res.status})`);

  const licences = await res.json();
  if (!Array.isArray(licences) || licences.length === 0) return null;

  const held = licences.map((licence): HeldLicence => ({
    expiresAt: licence?.expiresAt ? new Date(licence.expiresAt) : null,
  }));

  // A perpetual licence beats any dated one; otherwise the latest date wins.
  return held.reduce((best, candidate) => {
    if (best.expiresAt === null || candidate.expiresAt === null) {
      return best.expiresAt === null ? best : candidate;
    }
    return candidate.expiresAt > best.expiresAt ? candidate : best;
  });
}

/**
 * Sets the licence's expiry to an absolute date, creating the licence if the account has none.
 *
 * The Client API *overwrites* the expiry rather than extending it, which is what makes renewal
 * safe under webhook redelivery: the caller works out the date the payment should produce, and
 * writing it twice is a no-op. It also means a wrong date here silently shortens a paid-up
 * subscription, so callers compute it from `lib/plans.ts` and nowhere else.
 *
 * `expiresAt: null` grants a licence that never expires. Only the legacy path does that now.
 */
export async function grantLicence(
  username: string,
  expiresAt: Date | null
): Promise<void> {
  const id = licenceId();

  const res = await fetch(
    `${baseUrl()}/accounts/${encodeURIComponent(username)}/licences`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        applicationId: applicationId(),
        licenceId: id,
        expiresAt: expiresAt ? expiresAt.toISOString() : null,
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Client API licence grant failed (${res.status})`);
  }
}

/** One row of the renewal-reminder sweep. */
export interface ExpiringLicence {
  username: string;
  expiresAt: Date;
}

/**
 * Subscriptions running out within `withinDays`, so the reminder job can nudge them.
 *
 * Nothing auto-charges a crypto subscription, so a subscriber who is not reminded simply stops
 * being one. Perpetual licences are never returned — they have no date to expire on.
 */
export async function getExpiringLicences(withinDays: number): Promise<ExpiringLicence[]> {
  const res = await fetch(
    `${baseUrl()}/accounts/expiring-licences?applicationId=${applicationId()}&withinDays=${withinDays}`,
    { headers: headers(), cache: "no-store" }
  );

  if (!res.ok) {
    throw new Error(`Client API expiring-licence lookup failed (${res.status})`);
  }

  const rows = await res.json();
  if (!Array.isArray(rows)) return [];

  return rows
    .filter((row) => typeof row?.username === "string" && row?.expiresAt)
    .map((row) => ({ username: row.username, expiresAt: new Date(row.expiresAt) }));
}

/** A single-use link that lets the account holder choose their own password. */
export interface PasswordLink {
  token: string;
  expiresAt: Date;
}

export type PasswordLinkResult =
  | ({ status: "issued" } & PasswordLink)
  /** No account under that username. */
  | { status: "noAccount" }
  /** A link went out less than `cooldownSeconds` ago, so no new one was made. */
  | { status: "tooSoon" };

/**
 * Asks the Client API for a set-password link for this account.
 *
 * The Client API owns the token: it keeps only a hash of it, lets it run out after 30 minutes and
 * forgets it once used, so this side needs no database and never sees a password. Issuing replaces
 * any link the account already had.
 *
 * `cooldownSeconds` is for the public "email me a new link" form, where it stops the form being
 * used to flood somebody's inbox. Provisioning passes none: a paying buyer always gets a link,
 * retries included.
 */
export async function issuePasswordLink(
  username: string,
  cooldownSeconds = 0
): Promise<PasswordLinkResult> {
  const res = await fetch(
    `${baseUrl()}/accounts/${encodeURIComponent(username)}/password-links`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ cooldownSeconds }),
    }
  );

  if (res.status === 404) return { status: "noAccount" };
  if (res.status === 429) return { status: "tooSoon" };
  if (!res.ok) throw new Error(`Client API password link failed (${res.status})`);

  const body = await res.json().catch(() => ({}));
  const expiresAt = new Date(body?.expiresAt);

  if (typeof body?.token !== "string" || body.token === "" || Number.isNaN(expiresAt.getTime())) {
    throw new Error("Client API returned a malformed password link");
  }

  return { status: "issued", token: body.token, expiresAt };
}

/**
 * `invalidLink` covers every way a link can be dead — expired, already used, replaced by a newer
 * one, or for an account that does not exist. The Client API answers all of them the same, so the
 * page cannot be used to learn which.
 */
export type SetPasswordResult = "set" | "invalidLink" | "rejected";

/** Sets the account's password, spending the link. */
export async function setPasswordWithLink(
  username: string,
  token: string,
  password: string
): Promise<SetPasswordResult> {
  const res = await fetch(
    `${baseUrl()}/accounts/${encodeURIComponent(username)}/password`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ token, password }),
    }
  );

  if (res.ok) return "set";
  if (res.status === 403) return "invalidLink";
  if (res.status === 400) return "rejected";
  throw new Error(`Client API password change failed (${res.status})`);
}

/**
 * URL-safe, ~128 bits, and never shown to anybody. The Client API will not open an account without
 * a password, so a new account gets this one; the buyer then chooses their own through a
 * set-password link, which replaces it.
 */
export function generatePassword(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url");
}
