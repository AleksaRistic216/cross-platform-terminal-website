"use client";

import { useEffect } from "react";

/*
 * Opens a <details> that the URL hash points at.
 *
 * An answer linked to directly — a shared `/#faq-updates`, or the asterisk footnote followed from
 * another page — otherwise arrives collapsed: the browser scrolls the summary into view and the
 * answer the link was about stays hidden.
 *
 * Same-page clicks are handled in HashLink instead, which never fires `hashchange` because it sets
 * the hash with replaceState.
 */
export default function OpenHashDetails() {
  useEffect(() => {
    function openTarget() {
      const id = window.location.hash.slice(1);
      if (!id) return;

      const details = document.getElementById(id)?.closest("details");
      if (!details || details.open) return;

      details.open = true;
      // Opening it grows the page below the summary; re-align so the answer is what you land on.
      details.scrollIntoView();
    }

    openTarget();
    window.addEventListener("hashchange", openTarget);
    return () => window.removeEventListener("hashchange", openTarget);
  }, []);

  return null;
}
