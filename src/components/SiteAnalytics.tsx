"use client";

import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

/**
 * Drops the `token` from a set-password link before an analytics event leaves the browser. The
 * token opens the account until it is used, and the page view can be recorded before the page has
 * had a chance to take it out of the address bar.
 *
 * A client component because `beforeSend` is a function, and a server component cannot hand one
 * to a client component.
 */
function redact<T extends { url: string }>(event: T): T {
  const url = new URL(event.url);
  if (!url.searchParams.has("token")) return event;

  url.searchParams.delete("token");
  return { ...event, url: url.toString() };
}

export default function SiteAnalytics() {
  return (
    <>
      <Analytics beforeSend={redact} />
      <SpeedInsights beforeSend={redact} />
    </>
  );
}
