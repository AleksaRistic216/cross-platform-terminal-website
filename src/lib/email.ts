import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "Cross Platform Terminal <noreply@crossplatformterminal.com>";

async function send(to: string, subject: string, lines: string[]): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const { error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to,
    subject,
    text: lines.join("\n"),
  });

  if (error) throw new Error(`Email send failed: ${error.message}`);
}

/**
 * Sends the buyer their sign-in details. The password is generated per purchase and is not stored
 * anywhere on this side, so this email is the only copy — a send failure has to fail the caller
 * loudly rather than be swallowed.
 */
export async function sendCredentials(email: string, password: string): Promise<void> {
  await send(email, "Your Cross Platform Terminal licence", [
    "Thanks for buying Cross Platform Terminal.",
    "",
    "Sign in from the app with:",
    "",
    `  Username: ${email}`,
    `  Password: ${password}`,
    "",
    "Open the app and sign in when prompted. Your licence covers this account,",
    "and you can release a device from the licence dialog to move to another machine.",
    "",
    "Keep this email — the password is not stored anywhere and cannot be shown again.",
  ]);
}

/**
 * For a buyer who already had a Client account. We never learn their password, so there is nothing
 * to send them but the news that the licence is on it.
 */
export async function sendLicenceAdded(email: string): Promise<void> {
  await send(email, "Your Cross Platform Terminal licence", [
    "Thanks for buying Cross Platform Terminal.",
    "",
    `The licence has been added to your existing account (${email}).`,
    "Sign in from the app with the password you already use.",
    "",
    "If you have forgotten it, reply to this email and we will sort it out.",
  ]);
}
