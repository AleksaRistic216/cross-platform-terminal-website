import { issuePasswordLink } from "@/lib/client-api";
import { sendPasswordLink } from "@/lib/email";
import { clientIp, createThrottle } from "@/lib/throttle";

/**
 * "Email me a link to set my password" — the lost-password path, and the way back for a buyer
 * whose link from the purchase email ran out.
 *
 * The answer is the same whether or not the address has an account, so the form cannot be used to
 * find out who is a customer. Two limits stop it being used to flood an inbox: this per-address
 * throttle (best effort, per instance), and the Client API's per-account cooldown, which holds
 * across instances. A request inside the cooldown is answered like any other and sends nothing.
 */
const throttled = createThrottle(5);
const COOLDOWN_SECONDS = 60;

export async function POST(request: Request) {
  if (throttled(clientIp(request))) {
    return Response.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    );
  }

  const { email } = await request.json().catch(() => ({ email: null }));

  if (!email || !String(email).includes("@")) {
    return Response.json({ error: "Please enter a valid email address." }, { status: 400 });
  }

  const address = String(email).trim();

  try {
    const link = await issuePasswordLink(address, COOLDOWN_SECONDS);
    if (link.status === "issued") {
      await sendPasswordLink(address, link);
    }
  } catch (e) {
    console.error("[password-link] Failed:", e);
    return Response.json(
      { error: "We couldn't send the link just now. Please try again in a moment." },
      { status: 503 }
    );
  }

  return Response.json({ ok: true });
}
