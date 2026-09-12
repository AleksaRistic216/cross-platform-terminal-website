"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { LINK_LIFETIME_MINUTES, SET_PASSWORD_PATH } from "@/lib/password-link";
import { formatDate } from "@/lib/plans";

/**
 * Where Polar drops the buyer after a card payment.
 *
 * The card clears in a second or two; the `order.paid` webhook that opens their account lands a
 * moment later. So this waits on our own side rather than on Polar's redirect, and only says
 * "we've emailed you" once the email has actually been sent — `provisionPurchase` grants the
 * licence last, so a licence existing is the marker for "fully provisioned".
 */

const POLL_INTERVAL_MS = 2500;

/**
 * A card payment that has not provisioned within this long is stuck on something we cannot fix from
 * the browser. The money is taken and the webhook retries for hours, so the honest thing is to stop
 * spinning and point at the email.
 */
const POLL_TIMEOUT_MS = 4 * 60_000;

type State = "paying" | "provisioning" | "ready" | "failed" | "unavailable" | "slow";

export default function PurchaseComplete({ checkoutId }: { checkoutId: string }) {
  const [state, setState] = useState<State>(checkoutId ? "paying" : "unavailable");
  const [email, setEmail] = useState("");
  const [endsAt, setEndsAt] = useState<string | null>(null);

  useEffect(() => {
    if (!checkoutId) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setState("slow");
        return;
      }

      try {
        const res = await fetch("/api/polar/status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutId }),
        });
        const data = await res.json();

        if (cancelled) return;

        if (data.email) setEmail(data.email);

        if (data.state === "ready") {
          setEndsAt(data.endsAt ?? null);
          setState("ready");
          return;
        }
        if (data.state === "failed") {
          setState("failed");
          return;
        }
        if (data.state === "paying" || data.state === "provisioning") {
          setState(data.state);
        }
      } catch {
        // Offline or a blip — try again on the next tick.
      }

      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    timer = setTimeout(tick, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [checkoutId]);

  return (
    <section className="py-24 px-6">
      <div
        className="max-w-md mx-auto rounded-2xl p-8 text-center border"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        {state === "ready" ? (
          <>
            <Tick />
            <h1 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
              You&apos;re subscribed
            </h1>
            <p className="text-sm mb-2" style={{ color: "var(--color-muted)" }}>
              We&apos;ve emailed a link{email ? " to " : ""}
              {email && <strong style={{ color: "var(--color-foreground)" }}>{email}</strong>}. Open it
              to choose your password, then download the app and sign in. The link works for{" "}
              {LINK_LIFETIME_MINUTES} minutes — if it runs out,{" "}
              <Link href={SET_PASSWORD_PATH} className="underline" style={{ color: "var(--color-accent)" }}>
                get a new one
              </Link>
              .
            </p>
            {endsAt && (
              <p className="text-xs mb-6" style={{ color: "var(--color-muted)" }}>
                Your subscription runs to {formatDate(new Date(endsAt))} and renews itself on the same
                card. Cancel any time from the link on your Polar receipt.
              </p>
            )}
            <Link
              href="/download"
              className="block w-full py-2.5 rounded-lg font-semibold text-sm cpt-accent-btn"
            >
              Go to downloads
            </Link>
          </>
        ) : state === "failed" ? (
          <>
            <h1 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
              That payment didn&apos;t go through
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
              Nothing was charged. You can start again from the pricing page, or pay with crypto
              instead.
            </p>
            <Link
              href="/pricing"
              className="block w-full py-2.5 rounded-lg font-semibold text-sm cpt-accent-btn"
            >
              Back to pricing
            </Link>
          </>
        ) : state === "unavailable" ? (
          <>
            <h1 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
              Nothing to show here
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
              This page is where a card payment lands. If you have just paid and reached it by
              accident, your confirmation email is on its way regardless.
            </p>
            <Link
              href="/pricing"
              className="block w-full py-2.5 rounded-lg font-semibold text-sm cpt-accent-btn"
            >
              Back to pricing
            </Link>
          </>
        ) : state === "slow" ? (
          <>
            <h1 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
              Payment received — still setting up
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
              Your payment went through and your account is being set up. The email with your
              sign-in link arrives on its own, so you can close this page. If nothing has come
              within an hour, reply to your Polar receipt and we&apos;ll sort it out.
            </p>
            <Link
              href="/download"
              className="block w-full py-2.5 rounded-lg font-semibold text-sm cpt-accent-btn"
            >
              Go to downloads
            </Link>
          </>
        ) : (
          <>
            <h1 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
              {state === "paying" ? "Confirming your payment" : "Setting up your account"}
            </h1>
            <p
              className="text-sm flex items-center justify-center gap-2"
              style={{ color: "var(--color-muted)" }}
              aria-live="polite"
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: "var(--color-accent)", animation: "cpt-pulse 1.4s ease-in-out infinite" }}
              />
              This takes a few seconds. The page updates itself — no need to refresh.
            </p>
          </>
        )}
      </div>
    </section>
  );
}

function Tick() {
  return (
    <div
      className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
      style={{ background: "var(--color-accent-dim)" }}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        style={{ color: "var(--color-accent)" }}
        aria-hidden
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
      </svg>
    </div>
  );
}
