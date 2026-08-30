import { createAccount, generatePassword, grantLicence, hasLicence } from "@/lib/client-api";
import { sendCredentials, sendLicenceAdded } from "@/lib/email";

/**
 * Turns a paid-for email address into a working sign-in.
 *
 * Shared by the payment webhook and the 100%-discount path so both provision identically.
 *
 * The order matters. Granting the licence is the *last* step, which makes it the marker for "this
 * purchase is fully provisioned": every earlier failure leaves the account without a licence, so a
 * webhook redelivery re-enters here and finishes the job instead of reporting success on a buyer
 * who never received anything. An earlier version granted before emailing and used the licence as
 * the idempotency check, so one dropped email left a paid account permanently unreachable.
 */
export async function provisionPurchase(email: string): Promise<{ alreadyProvisioned: boolean }> {
  if (await hasLicence(email)) {
    return { alreadyProvisioned: true };
  }

  const password = generatePassword();

  // Safe to repeat: the Client API creates only when the username is free, and tells us which
  // happened. It never resets an existing account's password.
  const created = await createAccount(email, password);

  // Allowed to throw. The generated password is stored nowhere, so if this email does not go out
  // the buyer has no way in — better to fail the webhook and be retried than to grant the licence
  // and call it done.
  if (created) {
    await sendCredentials(email, password);
  } else {
    // The account predates this purchase — most likely the buyer already uses another Limitless
    // Soft product. We do not know their password and must not reset it.
    await sendLicenceAdded(email);
  }

  await grantLicence(email);

  return { alreadyProvisioned: false };
}
