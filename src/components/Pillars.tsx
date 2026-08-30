const pillars = [
  {
    tag: "1 draw call",
    heading: "GPU-accelerated rendering.",
    body: "The entire terminal grid renders in a single GPU draw call. Smooth scrolling at any size, no CPU overhead on rendering.",
  },
  {
    tag: "PTY-backed",
    heading: "Terminal that just works.",
    body: "Full VT support, tabbed sessions, scrollback. No setup, no quirks.",
  },
  {
    tag: "handled for you",
    heading: "Quirks resolution.",
    body: "Cross-platform terminal quirks get caught and fixed — rendering glitches, escape sequence mismatches, input edge cases. You never debug them.",
  },
  {
    tag: "1 day",
    heading: "Bugs fixed fast.",
    body: "Report a bug or request a feature and we will have it implemented within a day.",
  },
];

export default function Pillars() {
  return (
    <section className="py-20 px-6 border-t" style={{ borderColor: "var(--color-border)" }}>
      <div className="max-w-6xl mx-auto">
        <div className="mb-12 text-center">
          <p
            className="text-xs font-semibold uppercase tracking-widest mb-3"
            style={{ color: "var(--color-accent)" }}
          >
            Why CPT
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            Built to get out of your way.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-9">
          {pillars.map((p) => (
            <div key={p.heading} className="flex flex-col gap-2">
              <span
                className="self-start text-[11px] font-mono px-2 py-0.5 rounded"
                style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
              >
                {p.tag}
              </span>
              <h3 className="text-xl font-bold tracking-tight" style={{ color: "var(--color-foreground)" }}>
                {p.heading}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
