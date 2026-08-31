import HashLink from "@/components/HashLink";

/*
 * The asterisk that qualifies every "future updates included" claim on the site. It lands on the
 * FAQ answer that scopes the promise — minor and patch releases of the major version you bought —
 * so the claim is never made without the caveat one click away.
 */
export default function UpdateFootnote() {
  return (
    <HashLink
      href="/#faq-updates"
      label="Which updates are included?"
      className="align-super text-[0.85em] font-semibold cpt-quiet"
      style={{ color: "var(--color-accent)" }}
    >
      *
    </HashLink>
  );
}
