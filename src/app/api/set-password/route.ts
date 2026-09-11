import { setPasswordWithLink } from "@/lib/client-api";
import { passwordProblem } from "@/lib/password-link";
import { clientIp, createThrottle } from "@/lib/throttle";

/**
 * Sets a password from a set-password link.
 *
 * The Client API does the checking — it holds the token's hash, its expiry and whether it has been
 * used — so this route only checks the shape of the request and translates the answer. The token
 * is 256 bits, so there is nothing to guess; the throttle only stops a loop from costing Client API
 * calls.
 *
 * A dead link answers 410 and nothing else, whatever the reason, so the page can offer a new link
 * without learning (or revealing) whether the account exists.
 */
const throttled = createThrottle(20);

export async function POST(request: Request) {
  if (throttled(clientIp(request))) {
    return Response.json(
      { error: "Too many attempts. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const { email, token, password } = await request.json().catch(() => ({}));

  if (!email || !String(email).includes("@") || !token) {
    return Response.json(
      { error: "This link is incomplete. Open it again from the email, or ask for a new one." },
      { status: 400 }
    );
  }

  const chosen = typeof password === "string" ? password : "";
  const problem = passwordProblem(chosen);
  if (problem) {
    return Response.json({ error: problem }, { status: 400 });
  }

  try {
    const result = await setPasswordWithLink(String(email), String(token), chosen);

    if (result === "set") return Response.json({ ok: true });
    if (result === "invalidLink") return Response.json({ error: "expired" }, { status: 410 });

    return Response.json(
      { error: "That password wasn't accepted. Please try a different one." },
      { status: 400 }
    );
  } catch (e) {
    console.error("[set-password] Failed:", e);
    return Response.json(
      { error: "We couldn't save your password just now. Please try again in a moment." },
      { status: 503 }
    );
  }
}
