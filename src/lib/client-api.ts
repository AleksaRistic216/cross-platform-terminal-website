/**
 * Client API (api-client.limitlesssoft.com) — account and licence provisioning.
 *
 * The inter-app key lives only here, on the server. It must never reach the browser, so nothing in
 * this file may be imported from a client component.
 */

const BASE_URL = process.env.CLIENT_API_BASE_URL ?? "https://api-client.limitlesssoft.com";
const API_KEY = process.env.INTER_APP_API_KEY;

/** Cross Platform Terminal in the Client app's Applications table. */
const APPLICATION_ID = Number(process.env.CPT_APPLICATION_ID ?? 2);

/** The single "pay once, own it" licence tier. */
const LICENCE_ID = Number(process.env.CPT_LICENCE_ID);

function headers() {
  if (!API_KEY) throw new Error("INTER_APP_API_KEY is not configured");
  return { "Content-Type": "application/json", "X-Api-Key": API_KEY };
}

/**
 * Creates the buyer's account.
 *
 * POST /accounts always inserts — it sends no Id, so it never takes the update branch — and the
 * Users table carries no unique index on Username. Calling this twice for the same email therefore
 * produces two rows with the same username, after which login resolves to one of them and any
 * licence attached to the other is invisible. Callers MUST check hasLicence() first and skip
 * provisioning when it returns true; payment webhooks retry.
 */
export async function createAccount(username: string, password: string): Promise<void> {
  const res = await fetch(`${BASE_URL}/accounts`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ username, password, nickname: username }),
  });

  if (!res.ok) {
    throw new Error(`Client API account creation failed (${res.status})`);
  }
}

/** Idempotent on the API side: granting twice extends the existing row. */
export async function grantLicence(username: string): Promise<void> {
  if (!Number.isFinite(LICENCE_ID) || LICENCE_ID <= 0) {
    throw new Error("CPT_LICENCE_ID is not configured");
  }

  const res = await fetch(
    `${BASE_URL}/accounts/${encodeURIComponent(username)}/licences`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        applicationId: APPLICATION_ID,
        licenceId: LICENCE_ID,
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
    `${BASE_URL}/accounts/${encodeURIComponent(username)}/licences?applicationId=${APPLICATION_ID}`,
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
