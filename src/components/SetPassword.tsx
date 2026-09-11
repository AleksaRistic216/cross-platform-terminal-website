"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";

import {
  LINK_LIFETIME_MINUTES,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordProblem,
  SET_PASSWORD_PATH,
} from "@/lib/password-link";

/**
 * `set` is the form behind an emailed link; `request` asks for a new link, and is what the page
 * shows with no link at all — which makes it the lost-password page too.
 */
type View = "set" | "saved" | "request" | "requested";

const inputStyle = {
  background: "var(--color-background)",
  border: "1px solid var(--color-border)",
  color: "var(--color-foreground)",
};

export default function SetPassword({ email: linkEmail, token }: { email: string; token: string }) {
  const [view, setView] = useState<View>(token && linkEmail ? "set" : "request");
  const [email, setEmail] = useState(linkEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  /*
   * The token opens the account for the next half hour. It is in memory now, so take it out of the
   * address bar, where it would otherwise sit in history, in a screen share, or in a copied URL.
   * The email stays, so a reload lands on the request form already filled in.
   */
  useEffect(() => {
    if (!token) return;
    const clean = linkEmail
      ? `${SET_PASSWORD_PATH}?email=${encodeURIComponent(linkEmail)}`
      : SET_PASSWORD_PATH;
    window.history.replaceState(null, "", clean);
  }, [token, linkEmail]);

  async function savePassword(e: FormEvent) {
    e.preventDefault();

    const problem = passwordProblem(password);
    if (problem) {
      setError(problem);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: linkEmail, token, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setPassword("");
        setConfirm("");
        setView("saved");
        return;
      }

      if (res.status === 410) {
        setPassword("");
        setConfirm("");
        setNotice("That link has run out or has already been used. We can send you a new one.");
        setView("request");
        return;
      }

      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function requestLink(e: FormEvent) {
    e.preventDefault();

    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/password-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        setNotice("");
        setView("requested");
        return;
      }

      setError(data.error ?? "Something went wrong. Please try again.");
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="py-24 px-6">
      <div
        className="w-full max-w-sm mx-auto rounded-2xl border p-8"
        style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
      >
        <p
          className="text-xs font-semibold uppercase tracking-widest mb-3"
          style={{ color: "var(--color-accent)" }}
        >
          Your account
        </p>

        {view === "set" && (
          <form onSubmit={savePassword} noValidate>
            <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--color-foreground)" }}>
              Choose your password
            </h1>
            <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>
              For <strong style={{ color: "var(--color-foreground)" }}>{linkEmail}</strong>. You will
              sign in to the app with this email and the password you choose here.
            </p>

            {/* Lets a password manager file the new password under the right account. */}
            <input type="email" name="username" autoComplete="username" value={linkEmail} readOnly hidden />

            <label className="block text-xs mb-1.5" htmlFor="cpt-new-password" style={{ color: "var(--color-muted)" }}>
              New password ({PASSWORD_MIN_LENGTH}–{PASSWORD_MAX_LENGTH} characters)
            </label>
            <input
              id="cpt-new-password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={PASSWORD_MAX_LENGTH}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none mb-3"
              style={inputStyle}
              autoFocus
            />

            <label className="block text-xs mb-1.5" htmlFor="cpt-confirm-password" style={{ color: "var(--color-muted)" }}>
              Type it again
            </label>
            <input
              id="cpt-confirm-password"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              maxLength={PASSWORD_MAX_LENGTH}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none mb-4"
              style={inputStyle}
            />

            {error && (
              <p className="text-xs mb-3" role="alert" style={{ color: "#e06040" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm cpt-accent-btn"
            >
              {loading ? "Saving…" : "Save password"}
            </button>
          </form>
        )}

        {view === "saved" && (
          <div aria-live="polite">
            <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--color-foreground)" }}>
              Password saved
            </h1>
            <p className="text-sm mb-6" style={{ color: "var(--color-muted)" }}>
              Open the app and sign in with{" "}
              <strong style={{ color: "var(--color-foreground)" }}>{linkEmail}</strong> and the password
              you just chose.
            </p>
            <Link
              href="/download"
              className="block w-full py-2.5 rounded-lg font-semibold text-sm text-center cpt-accent-btn"
            >
              Go to downloads
            </Link>
          </div>
        )}

        {view === "request" && (
          <form onSubmit={requestLink} noValidate>
            <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--color-foreground)" }}>
              Set a new password
            </h1>

            {notice && (
              <p
                className="mb-4 px-4 py-2.5 rounded-lg text-xs leading-relaxed"
                role="status"
                style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
              >
                {notice}
              </p>
            )}

            <p className="text-sm mb-5" style={{ color: "var(--color-muted)" }}>
              Enter the email your subscription is on. We will send a link for choosing a new
              password — it works once, for {LINK_LIFETIME_MINUTES} minutes.
            </p>

            <label className="sr-only" htmlFor="cpt-reset-email">
              Email address
            </label>
            <input
              id="cpt-reset-email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg text-sm outline-none mb-4"
              style={inputStyle}
              autoFocus
            />

            {error && (
              <p className="text-xs mb-3" role="alert" style={{ color: "#e06040" }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg font-semibold text-sm cpt-accent-btn"
            >
              {loading ? "Sending…" : "Email me a link"}
            </button>
          </form>
        )}

        {view === "requested" && (
          <div aria-live="polite">
            <h1 className="text-2xl font-bold tracking-tight mb-2" style={{ color: "var(--color-foreground)" }}>
              Check your email
            </h1>
            <p className="text-sm mb-4" style={{ color: "var(--color-muted)" }}>
              If <strong style={{ color: "var(--color-foreground)" }}>{email.trim()}</strong> has a
              Cross Platform Terminal account, a link to set your password is on its way. It works
              once, for {LINK_LIFETIME_MINUTES} minutes.
            </p>
            <p className="text-xs" style={{ color: "var(--color-muted)" }}>
              Nothing after a few minutes? Check your spam folder, or{" "}
              <button
                type="button"
                onClick={() => setView("request")}
                className="underline cursor-pointer"
                style={{ color: "var(--color-accent)" }}
              >
                send it again
              </button>
              . A new link replaces the old one.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
