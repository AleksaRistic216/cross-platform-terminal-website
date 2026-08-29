import { Resend } from "resend";

const FROM = process.env.RESEND_FROM ?? "Cross Platform Terminal <noreply@crossplatformterminal.com>";

/**
 * Sends the buyer their sign-in details. The password is generated per purchase and is not stored
 * anywhere on this side, so this email is the only copy — a send failure has to fail the caller
 * loudly rather than be swallowed.
 */
export async function sendCredentials(email: string, password: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY is not configured");

  const { error } = await new Resend(apiKey).emails.send({
    from: FROM,
    to: email,
    subject: "Your Cross Platform Terminal licence",
    text: [
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
    ].join("\n"),
  });

  if (error) throw new Error(`Credential email failed: ${error.message}`);
}
