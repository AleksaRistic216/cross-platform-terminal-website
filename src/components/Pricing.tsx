"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

const included = [
  "Full terminal emulator (PTY-backed, all platforms)",
  "Unlimited views & dockable widgets",
  "AI Workflow Pipeline (Claude Code & Copilot)",
  "Automatic AI tool detection & status badge",
  "File browser widget",
  "In-app auto-update",
  "Linux (AppImage + tar.gz) and Windows builds",
  "Every future update, at no extra cost",
];

type ModalState = "closed" | "email" | "payment" | "success" | "alreadyOwned";

/** How long to keep asking whether the webhook has landed before telling the buyer to sit tight. */
const POLL_INTERVAL_MS = 4000;
const POLL_TIMEOUT_MS = 20 * 60_000;

export default function Pricing() {
  const [modal, setModal] = useState<ModalState>("closed");
  const [email, setEmail] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [finalAmount, setFinalAmount] = useState(8);
  const [embedUrl, setEmbedUrl] = useState("");
  const [portalUrl, setPortalUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [pollTimedOut, setPollTimedOut] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);
  const restoreFocusTo = useRef<HTMLElement | null>(null);

  const open = modal !== "closed";

  const closeModal = useCallback(() => {
    setModal("closed");
    setEmail("");
    setDiscountCode("");
    setDiscountPercent(0);
    setFinalAmount(24);
    setEmbedUrl("");
    setPortalUrl("");
    setError("");
    setPollTimedOut(false);
  }, []);

  // Escape closes, Tab stays inside, and the page behind stops scrolling.
  useEffect(() => {
    if (!open) return;

    restoreFocusTo.current = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    const focusables = () =>
      Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), input, iframe, [tabindex]:not([tabindex="-1"])'
        ) ?? []
      );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeModal();
        return;
      }
      if (e.key !== "Tab") return;

      const items = focusables();
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      restoreFocusTo.current?.focus?.();
    };
  }, [open, closeModal]);

  /*
   * While the payment widget is up, ask our own side whether provisioning has finished. The licence
   * is granted last, so this flips true only once the account exists and the email has gone out —
   * which is the only honest basis for showing a success screen.
   */
  useEffect(() => {
    if (modal !== "payment" || !email) return;

    let cancelled = false;
    const startedAt = Date.now();

    const tick = async () => {
      if (cancelled) return;

      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        setPollTimedOut(true);
        return;
      }

      try {
        const res = await fetch("/api/licence-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });
        const data = await res.json();
        if (!cancelled && data.provisioned) {
          setModal("success");
          return;
        }
      } catch {
        // Offline or a blip — just try again on the next tick.
      }

      if (!cancelled) timer = setTimeout(tick, POLL_INTERVAL_MS);
    };

    let timer = setTimeout(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [modal, email]);

  async function handleProceed() {
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/create-invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, discountCode: discountCode.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create invoice");
      if (data.alreadyOwned) {
        setPortalUrl(data.portalUrl);
        setModal("alreadyOwned");
        return;
      }
      if (data.free) {
        setModal("success");
        return;
      }
      setEmbedUrl(data.embedUrl);
      setDiscountPercent(data.discountPercent);
      setFinalAmount(data.finalAmount);
      setModal("payment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="pricing" className="py-24 px-6 border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--color-accent)" }}
          >
            Pricing
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
            Eight euros. Once.
          </h2>
          <p className="mt-4 text-base" style={{ color: "var(--color-muted)" }}>
            No subscription, no renewal, no upsell. Buy the licence and it is yours.
          </p>
        </div>

        {/* Pricing card */}
        <div className="flex justify-center">
          <div
            className="w-full max-w-md rounded-2xl border overflow-hidden"
            style={{
              background: "var(--color-surface)",
              borderColor: "var(--color-accent)",
              boxShadow: "0 0 0 1px rgba(224,112,64,0.15), 0 20px 60px rgba(224,112,64,0.08)",
            }}
          >
            <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p
                    className="text-xs font-semibold uppercase tracking-widest mb-1"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Pro
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                    Full access, every feature
                  </p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium shrink-0"
                  style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
                >
                  Lifetime licence
                </span>
              </div>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-5xl font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
                  €24
                </span>
                <span className="text-base mb-1.5" style={{ color: "var(--color-muted)" }}>
                  one-time
                </span>
              </div>
              <p className="mt-2 text-xs" style={{ color: "var(--color-muted)" }}>
                The licence never expires. There is nothing to cancel.
              </p>
            </div>

            <div className="px-8 py-6">
              <ul className="space-y-3">
                {included.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm">
                    <svg
                      className="w-4 h-4 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: "var(--color-accent)" }}
                      aria-hidden
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span style={{ color: "var(--color-foreground)" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="px-8 pb-8">
              <button
                onClick={() => setModal("email")}
                className="block w-full text-center py-3 rounded-lg font-semibold text-sm cursor-pointer cpt-accent-btn"
              >
                Buy a licence
              </button>
              <p className="mt-3 text-center text-xs" style={{ color: "var(--color-muted)" }}>
                Crypto payment via NOWPayments · sign-in details emailed to you
              </p>
              <p className="mt-1.5 text-center text-xs" style={{ color: "var(--color-muted)", opacity: 0.8 }}>
                All sales are final — no refunds.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {/* The grid keeps the dialog centred while still letting a tall widget scroll on a phone. */}
          <div className="min-h-full grid place-items-center">
            <div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label="Buy a Cross Platform Terminal licence"
              // The NOWPayments widget is authored at 410px; anything narrower squeezes it.
              className={modal === "payment" ? "w-full max-w-[410px]" : "w-full max-w-sm"}
            >
              {modal === "email" && (
                <div className="relative rounded-2xl p-8" style={{ background: "var(--color-surface)" }}>
                  <CloseButton onClick={closeModal} />

                  <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
                    Where should we send your licence?
                  </h3>
                  <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>
                    Your sign-in details go to this address once the payment confirms.
                  </p>

                  <label className="sr-only" htmlFor="cpt-email">
                    Email address
                  </label>
                  <input
                    id="cpt-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleProceed();
                    }}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none mb-3"
                    style={{
                      background: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-foreground)",
                    }}
                    autoFocus
                  />

                  <label className="sr-only" htmlFor="cpt-discount">
                    Discount code
                  </label>
                  <input
                    id="cpt-discount"
                    type="text"
                    placeholder="Discount code (optional)"
                    value={discountCode}
                    onChange={(e) => setDiscountCode(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleProceed();
                    }}
                    className="w-full px-4 py-2.5 rounded-lg text-sm outline-none mb-3"
                    style={{
                      background: "var(--color-background)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-foreground)",
                    }}
                  />

                  <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--color-muted)" }}>
                    Crypto payments cannot be reversed, so this purchase is final and cannot be
                    refunded.
                  </p>

                  {error && (
                    <p className="text-xs mb-3" role="alert" style={{ color: "#e06040" }}>
                      {error}
                    </p>
                  )}

                  <button
                    onClick={handleProceed}
                    disabled={loading}
                    className="w-full py-2.5 rounded-lg font-semibold text-sm cpt-accent-btn"
                  >
                    {loading ? "Creating payment…" : "Continue to payment"}
                  </button>
                </div>
              )}

              {modal === "alreadyOwned" && (
                <div className="relative rounded-2xl p-8 text-center" style={{ background: "var(--color-surface)" }}>
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
                    You already have a licence
                  </h3>
                  <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                    <strong style={{ color: "var(--color-foreground)" }}>{email}</strong> already holds a Cross
                    Platform Terminal licence, and it never expires — so there is nothing more to buy. Sign in from
                    the app with the password from your original email, or manage your account in the portal.
                  </p>
                  <a
                    href={portalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-2.5 rounded-lg font-semibold text-sm mb-2 cpt-accent-btn"
                  >
                    Open account portal
                  </a>
                  <button onClick={closeModal} className="w-full py-2 rounded-lg text-sm cpt-quiet" style={{ color: "var(--color-muted)" }}>
                    Close
                  </button>
                </div>
              )}

              {modal === "success" && (
                <div className="relative rounded-2xl p-8 text-center" style={{ background: "var(--color-surface)" }}>
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
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
                    Your licence is ready
                  </h3>
                  <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                    We&apos;ve sent your sign-in details to{" "}
                    <strong style={{ color: "var(--color-foreground)" }}>{email}</strong>. Download the app, open it,
                    and sign in when prompted.
                  </p>
                  <Link
                    href="/download"
                    className="block w-full py-2.5 rounded-lg font-semibold text-sm mb-2 cpt-accent-btn"
                  >
                    Go to downloads
                  </Link>
                  <button onClick={closeModal} className="w-full py-2 rounded-lg text-sm cpt-quiet" style={{ color: "var(--color-muted)" }}>
                    Close
                  </button>
                </div>
              )}

              {modal === "payment" && embedUrl && (
                <div className="w-full">
                  {discountPercent > 0 && (
                    <div
                      className="mb-2 px-4 py-2 rounded-lg text-sm text-center font-medium"
                      style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
                    >
                      {discountPercent}% off — €{finalAmount.toFixed(2)} one-time
                    </div>
                  )}

                  <div className="relative rounded-2xl overflow-hidden" style={{ background: "var(--color-surface)" }}>
                    <CloseButton onClick={closeModal} />
                    <iframe
                      title="Secure payment"
                      src={embedUrl}
                      width="410"
                      height="696"
                      style={{ border: 0, display: "block", width: "100%", maxWidth: "100%", height: 696 }}
                    />
                  </div>

                  {/*
                   * Status the buyer cannot fake. The previous "I've paid" button set the success
                   * state on click, so it lied to anyone who pressed it early — or at all.
                   */}
                  <div
                    className="mt-2 rounded-lg border px-4 py-3 text-xs text-center"
                    style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
                    aria-live="polite"
                  >
                    {pollTimedOut ? (
                      <>
                        Still waiting on the network. Your payment is not lost — the licence email arrives as soon as
                        the transaction confirms. You can close this window.
                      </>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        <span
                          className="w-1.5 h-1.5 rounded-full shrink-0"
                          style={{ background: "var(--color-accent)", animation: "cpt-pulse 1.4s ease-in-out infinite" }}
                        />
                        Waiting for confirmation. This screen updates itself — no need to refresh.
                      </span>
                    )}
                  </div>

                  <button
                    onClick={closeModal}
                    className="mt-2 w-full py-2 rounded-lg text-sm cpt-quiet"
                    style={{ color: "var(--color-muted)" }}
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full cpt-quiet"
      style={{ background: "var(--color-border)", color: "var(--color-muted)" }}
      aria-label="Close"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  );
}
