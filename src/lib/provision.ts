import { createAccount, generatePassword, grantLicence, hasLicence } from "@/lib/client-api";
import { sendCredentials } from "@/lib/email";

/**
 * Turns a paid-for email address into a working sign-in.
 *
 * Shared by the payment webhook and the 100%-discount path so both provision identically.
 *
 * Deliberately skips everything when the account already holds a licence: NOWPayments retries
 * webhooks, POST /accounts always inserts, and Username has no unique index — so re-running this
 * blindly would leave a customer with duplicate rows and a licence on the wrong one.
 */
export async function provisionPurchase(email: string): Promise<{ alreadyProvisioned: boolean }> {
  if (await hasLicence(email)) {
    return { alreadyProvisioned: true };
  }

  const password = generatePassword();

  await createAccount(email, password);
  await grantLicence(email);

  // Last, and allowed to throw: the account is useless to the buyer if they never learn the
  // password, so a send failure must surface rather than report success.
  await sendCredentials(email, password);

  return { alreadyProvisioned: false };
}
