/**
 * Set-password links: where they point, and the rules a new password has to meet.
 *
 * The set-password page imports this as well as the server, so nothing here may read a secret or
 * pull in a server-only module.
 */

export const SET_PASSWORD_PATH = "/set-password";

/**
 * Must match the Client API's validator. If this side were looser, the page would accept a password
 * the API then refused; if it were stricter, a buyer could be turned away for a password the
 * account system would have taken.
 */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 64;

/**
 * How long a link lasts, for copy on the page only. The Client API is what enforces it, and the
 * emails state the lifetime from the expiry the API actually returned — see `linkLifetime`.
 */
export const LINK_LIFETIME_MINUTES = 30;

/** Why a password would be refused, in words for the person typing it — or null if it is fine. */
export function passwordProblem(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Use at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Use ${PASSWORD_MAX_LENGTH} characters or fewer.`;
  }
  return null;
}

/** The link that goes in the email. */
export function passwordLinkUrl(siteUrl: string, email: string, token: string): string {
  const url = new URL(SET_PASSWORD_PATH, siteUrl);
  url.searchParams.set("email", email);
  url.searchParams.set("token", token);
  return url.toString();
}

/** "30 minutes", worked out from the expiry the Client API returned rather than assumed. */
export function linkLifetime(expiresAt: Date, now: Date = new Date()): string {
  const minutes = Math.max(1, Math.round((expiresAt.getTime() - now.getTime()) / 60_000));
  return minutes === 1 ? "1 minute" : `${minutes} minutes`;
}
