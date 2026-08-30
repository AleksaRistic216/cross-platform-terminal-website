"use client";

import { usePathname } from "next/navigation";
import type { CSSProperties, MouseEvent, ReactNode } from "react";

/*
 * An in-page anchor that actually jumps.
 *
 * `next/link` with a same-route href like "/#pricing" hands the click to the App Router, which
 * treats it as a navigation to the page you are already on and does not run the browser's hash
 * scroll — so every nav link on the landing page silently did nothing.
 *
 * Here the same-page case is done natively with `scrollIntoView`, which honours `scroll-behavior`
 * and the `scroll-padding-top` that keeps headings clear of the fixed header. A link that really
 * does change page falls through to the browser, which applies the hash on load.
 */

type Props = {
  /** "/#pricing" from anywhere, or "#pricing" for an explicitly same-page jump. */
  href: string;
  className?: string;
  style?: CSSProperties;
  /** Runs on activation regardless of destination — closing the mobile menu, say. */
  onNavigate?: () => void;
  children: ReactNode;
};

export default function HashLink({ href, className, style, onNavigate, children }: Props) {
  const pathname = usePathname();

  const hashIndex = href.indexOf("#");
  const id = href.slice(hashIndex + 1);
  const targetPath = hashIndex === 0 ? pathname : href.slice(0, hashIndex) || "/";

  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    onNavigate?.();

    // Leave modified clicks alone: they are "open in a new tab", not "jump down the page".
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) {
      return;
    }
    if (targetPath !== pathname) return;

    const el = document.getElementById(id);
    if (!el) return;

    e.preventDefault();
    // Deferred a frame so anything this click closes (the mobile menu) has re-laid out first,
    // otherwise we scroll to where the target used to be.
    requestAnimationFrame(() => {
      el.scrollIntoView();
      // replaceState rather than pushState: it keeps the URL honest without pushing entries the
      // App Router did not create and would have to reconcile on Back.
      history.replaceState(null, "", `#${id}`);
    });
  }

  return (
    <a href={href} className={className} style={style} onClick={handleClick}>
      {children}
    </a>
  );
}
