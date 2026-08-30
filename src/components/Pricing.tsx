"use client";

import { useState } from "react";

const included = [
  "Full terminal emulator (PTY-backed, all platforms)",
  "Unlimited views & dockable widgets",
  "AI Workflow Pipeline (Claude Code & Copilot)",
  "Automatic AI tool detection & status badge",
  "File browser widget",
  "In-app auto-update",
  "Linux (AppImage + tar.gz) and Windows builds",
  "All future updates included",
];

type ModalState = "closed" | "email" | "payment" | "success" | "alreadyOwned";

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

  function closeModal() {
    setModal("closed");
    setEmail("");
    setDiscountCode("");
    setDiscountPercent(0);
    setFinalAmount(8);
    setEmbedUrl("");
    setPortalUrl("");
    setError("");
  }

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
    <section id="pricing" className="py-24 px-6">
      {/* Divider */}
      <div className="max-w-6xl mx-auto mb-16">
        <div className="h-px" style={{ background: "var(--color-border)" }} />
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-accent)" }}>
            Pricing
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            Simple, honest pricing
          </h2>
          <p className="mt-4 text-base" style={{ color: "var(--color-muted)" }}>
            One plan. Everything included. Pay once, own it.
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
            {/* Card header */}
            <div className="px-8 pt-8 pb-6 border-b" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: "var(--color-accent)" }}>
                    Pro
                  </p>
                  <p className="text-sm" style={{ color: "var(--color-muted)" }}>
                    Full access, every feature
                  </p>
                </div>
                <span
                  className="text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
                >
                  Subscription
                </span>
              </div>

              <div className="mt-6 flex items-end gap-1">
                <span className="text-5xl font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
                  €8
                </span>
                <span className="text-base mb-1.5" style={{ color: "var(--color-muted)" }}>
                  / month
                </span>
              </div>
            </div>

            {/* Features list */}
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
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <span style={{ color: "var(--color-foreground)" }}>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA */}
            <div className="px-8 pb-8">
              <button
                onClick={() => setModal("email")}
                className="block w-full text-center py-3 rounded-lg font-semibold text-sm transition-opacity cursor-pointer"
                style={{ background: "var(--color-accent)", color: "#fff" }}
                onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.85")}
                onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
              >
                Buy Now
              </button>
              <p className="mt-3 text-center text-xs" style={{ color: "var(--color-muted)" }}>
                Secure crypto payment via NOWPayments
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal backdrop */}
      {modal !== "closed" && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
        >
          {/* Email step */}
          {modal === "email" && (
            <div
              className="relative rounded-2xl p-8 w-full max-w-sm"
              style={{ background: "var(--color-surface)" }}
            >
              <button
                onClick={closeModal}
                className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center rounded-full"
                style={{ background: "var(--color-border)", color: "var(--color-muted)" }}
                aria-label="Close"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <h3 className="text-lg font-semibold mb-1" style={{ color: "var(--color-foreground)" }}>
                Enter your email
              </h3>
              <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>
                Your sign-in details will be sent to this address after payment.
              </p>

              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleProceed(); }}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none mb-3"
                style={{
                  background: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
                autoFocus
              />

              <input
                type="text"
                placeholder="Discount code (optional)"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleProceed(); }}
                className="w-full px-4 py-2.5 rounded-lg text-sm outline-none mb-3"
                style={{
                  background: "var(--color-background)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-foreground)",
                }}
              />

              {error && (
                <p className="text-xs mb-3" style={{ color: "#e06040" }}>{error}</p>
              )}

              <button
                onClick={handleProceed}
                disabled={loading}
                className="w-full py-2.5 rounded-lg font-semibold text-sm transition-opacity"
                style={{ background: "var(--color-accent)", color: "#fff", opacity: loading ? 0.6 : 1 }}
              >
                {loading ? "Creating payment…" : "Continue to payment"}
              </button>
            </div>
          )}

          {/* Already owned — no second purchase, and nothing secret is shown */}
          {modal === "alreadyOwned" && (
            <div
              className="relative rounded-2xl p-8 w-full max-w-sm text-center"
              style={{ background: "var(--color-surface)" }}
            >
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
                You already have a licence
              </h3>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                <strong style={{ color: "var(--color-foreground)" }}>{email}</strong> already holds a
                Cross Platform Terminal licence, so there is nothing more to buy. Sign in from the
                app with the password from your original email, or manage your account in the portal.
              </p>
              <a
                href={portalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-2.5 rounded-lg font-semibold text-sm mb-2"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                Open account portal
              </a>
              <button
                onClick={closeModal}
                className="w-full py-2 rounded-lg text-sm"
                style={{ color: "var(--color-muted)" }}
              >
                Close
              </button>
            </div>
          )}

          {/* Success — credentials are emailed; nothing secret is rendered here */}
          {modal === "success" && (
            <div
              className="relative rounded-2xl p-8 w-full max-w-sm text-center"
              style={{ background: "var(--color-surface)" }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "var(--color-accent-dim)" }}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-accent)" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--color-foreground)" }}>
                Check your email
              </h3>
              <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
                We&apos;ve sent your sign-in details to{" "}
                <strong style={{ color: "var(--color-foreground)" }}>{email}</strong>. Open the app
                and sign in when prompted.
              </p>
              <button
                onClick={closeModal}
                className="w-full py-2.5 rounded-lg font-semibold text-sm"
                style={{ background: "var(--color-accent)", color: "#fff" }}
              >
                Done
              </button>
            </div>
          )}

          {/* Payment widget step */}
          {modal === "payment" && embedUrl && (
            <div style={{ maxWidth: "100%", width: 410 }}>
              {discountPercent > 0 && (
                <div
                  className="mb-2 px-4 py-2 rounded-lg text-sm text-center font-medium"
                  style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
                >
                  {discountPercent}% discount applied — €{finalAmount.toFixed(2)} / month
                </div>
              )}
              <div className="relative rounded-2xl overflow-hidden" style={{ background: "var(--color-surface)" }}>
                <button
                  onClick={closeModal}
                  className="absolute top-3 right-3 z-10 w-7 h-7 flex items-center justify-center rounded-full"
                  style={{ background: "var(--color-border)", color: "var(--color-muted)" }}
                  aria-label="Close"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <iframe
                  src={embedUrl}
                  width="410"
                  height="696"
                  frameBorder="0"
                  scrolling="no"
                  style={{ overflowY: "hidden", display: "block", maxWidth: "100%" }}
                />
              </div>
              <button
                onClick={() => setModal("success")}
                className="mt-2 w-full py-2 rounded-lg text-sm font-medium transition-opacity"
                style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", color: "var(--color-muted)" }}
              >
                I&apos;ve paid
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
