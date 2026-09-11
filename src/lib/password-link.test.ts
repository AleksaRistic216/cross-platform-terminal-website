import assert from "node:assert/strict";
import test from "node:test";

import {
  linkLifetime,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  passwordLinkUrl,
  passwordProblem,
} from "./password-link.ts";

/*
 * The set-password link is the only way a new buyer gets into their account, so a link that
 * mangles the address or a length rule out of step with the Client API locks a paying customer
 * out. Run with `npm test`.
 */

test("passwordProblem accepts exactly the lengths the Client API accepts", () => {
  assert.equal(passwordProblem("a".repeat(PASSWORD_MIN_LENGTH)), null);
  assert.equal(passwordProblem("a".repeat(PASSWORD_MAX_LENGTH)), null);
  assert.match(passwordProblem("a".repeat(PASSWORD_MIN_LENGTH - 1)) ?? "", /at least/);
  assert.match(passwordProblem("a".repeat(PASSWORD_MAX_LENGTH + 1)) ?? "", /or fewer/);
  assert.match(passwordProblem("") ?? "", /at least/);
});

test("passwordLinkUrl survives addresses that are not URL-safe", () => {
  // A "+" left unencoded in a query string reads back as a space, and the Client API would then
  // look up an account that does not exist.
  const email = "jane+cpt@example.com";
  const url = new URL(passwordLinkUrl("https://www.crossplatformterminal.com", email, "abc_-123"));

  assert.equal(url.origin, "https://www.crossplatformterminal.com");
  assert.equal(url.pathname, "/set-password");
  assert.equal(url.searchParams.get("email"), email);
  assert.equal(url.searchParams.get("token"), "abc_-123");
});

test("linkLifetime states the lifetime the Client API gave, not an assumed one", () => {
  const now = new Date("2026-09-11T12:00:00Z");

  assert.equal(linkLifetime(new Date("2026-09-11T12:30:00Z"), now), "30 minutes");
  // A few seconds of latency between issuing and emailing must not read as "29 minutes".
  assert.equal(linkLifetime(new Date("2026-09-11T12:29:57Z"), now), "30 minutes");
  assert.equal(linkLifetime(new Date("2026-09-11T12:01:00Z"), now), "1 minute");
  // Never "0 minutes" or a negative number, even with a skewed clock.
  assert.equal(linkLifetime(new Date("2026-09-11T11:59:00Z"), now), "1 minute");
});
