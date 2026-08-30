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
 * The single "pay once, own it" licence tier.
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

/** Idempotent on the API side: granting twice extends the existing row. */
export async function grantLicence(username: string): Promise<void> {
  const id = licenceId();

  const res = await fetch(
    `${baseUrl()}/accounts/${encodeURIComponent(username)}/licences`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        applicationId: applicationId(),
        licenceId: id,
        expiresAt: null, // pay once, own it
      }),
    }
  );

  if (!res.ok) {
    throw new Error(`Client API licence grant failed (${res.status})`);
  }
}

export async function hasLicence(username: string): Promise<boolean> {
  const res = await fetch(
    `${baseUrl()}/accounts/${encodeURIComponent(username)}/licences?applicationId=${applicationId()}`,
    { headers: headers(), cache: "no-store" }
  );

  // An unknown account is not an error here — it just has no licence yet.
  if (res.status === 404) return false;
  if (!res.ok) throw new Error(`Client API licence lookup failed (${res.status})`);

  const licences = await res.json();
  return Array.isArray(licences) && licences.length > 0;
}

/** URL-safe, ~128 bits. Shown to the buyer once, in the email, and never stored here. */
export function generatePassword(): string {
  return Buffer.from(crypto.getRandomValues(new Uint8Array(16))).toString("base64url");
}
