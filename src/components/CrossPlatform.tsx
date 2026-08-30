const shortcuts = [
  { action: "Copy selection", keys: "Ctrl+Shift+C" },
  { action: "Paste text", keys: "Ctrl+Shift+V" },
  { action: "Paste image", keys: "Ctrl+V" },
  { action: "New terminal tab", keys: "Ctrl+Shift+T" },
  { action: "Split below", keys: "Ctrl+Shift+G" },
  { action: "Split right", keys: "Ctrl+Shift+F" },
  { action: "Close tab / widget", keys: "Ctrl+Shift+W" },
  { action: "New view", keys: "Alt+T" },
  { action: "Rename view", keys: "Alt+R" },
  { action: "Redistribute layout", keys: "Ctrl+Shift+Alt+L" },
];

const quirks = [
  {
    platform: "Windows",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M3 12V6.75l6-1.32v6.57H3zM21 12v-6.75l-6-1.32v8.07H21zM3 13.5h6v6.57l-6-1.32V13.5zM15 13.5h6v5.25l-6-1.32V13.5z" />
      </svg>
    ),
    items: [
      {
        title: "Clipboard that actually works",
        body: "Ctrl+Shift+V pastes text. Ctrl+V pastes images. Same shortcuts on every platform - no relearning when you switch machines.",
      },
      {
        title: "Instant large paste",
        body: "Windows ConPTY throttles large pastes, making them slow and stuttery. CPT bypasses this - long text pastes instantly, regardless of size.",
      },
      {
        title: "Any shell you want",
        body: "PowerShell, PowerShell Core, cmd.exe, or Git Bash - pick your shell in Settings. Git Bash uses the ConPTY-compatible binary (git/bin/bash.exe), not the MinTTY wrapper.",
      },
      {
        title: "No console window",
        body: "Built with the Windows GUI subsystem. No flashing black console window on launch, no separate terminal hiding behind your workspace.",
      },
    ],
  },
  {
    platform: "Linux",
    icon: (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.504 0c-.155 0-.315.008-.48.021C7.576.191 3.924 3.58 3.217 7.94c-.284 1.718-.143 3.331.393 4.772.08.21.156.396.217.529.054.12.098.205.126.254l.08.133a4.47 4.47 0 01.464 1.01c.093.372.078.684-.033.96-.278.693-1.184 1.28-1.888 2.063-.27.302-.5.63-.634.996-.136.368-.164.79-.054 1.222.185.723.68 1.287 1.34 1.619.659.333 1.46.43 2.218.292.759-.137 1.455-.476 1.971-.971.515-.495.857-1.152.954-1.908.118-.928-.13-1.69-.5-2.4a10.72 10.72 0 01-.37-.813c-.115-.29-.192-.553-.203-.771-.013-.248.04-.432.186-.587.296-.317.845-.488 1.415-.574.573-.087 1.19-.082 1.748-.025.558.057 1.05.18 1.374.363.327.184.486.42.444.714-.04.283-.24.59-.527.836-.284.245-.65.435-1.04.547-.39.11-.8.134-1.15.068a2.09 2.09 0 01-.857-.37.528.528 0 00-.724.137.524.524 0 00.127.726c.37.267.81.435 1.296.514.487.08 1.02.057 1.537-.083.517-.139.998-.39 1.39-.738.39-.348.683-.801.77-1.344.09-.554-.053-1.092-.39-1.54-.336-.447-.836-.787-1.432-1.01-.597-.222-1.28-.316-1.944-.332a10.57 10.57 0 00-.81.021c.098-.23.21-.477.33-.734.318-.69.702-1.44 1.015-2.206.316-.77.555-1.558.555-2.3 0-2.656-2.15-4.806-4.805-4.806zM12 1.5c2.93 0 5.306 2.376 5.306 5.306 0 .648-.215 1.36-.509 2.093-.297.735-.673 1.48-.987 2.164a15.37 15.37 0 00-.348.793c.303-.018.62-.02.943-.013.718.018 1.464.128 2.126.367.666.24 1.25.622 1.65 1.165.402.54.575 1.193.468 1.877-.108.683-.46 1.237-.93 1.66-.469.42-1.04.718-1.648.883-.608.166-1.237.192-1.82.094a3.62 3.62 0 01-1.622-.658 1.052 1.052 0 01-.232-1.466 1.05 1.05 0 011.461-.232c.204.143.436.228.676.27.241.04.502.025.77-.049.267-.073.53-.207.74-.39.208-.18.367-.4.408-.647.042-.255-.04-.497-.222-.702-.183-.205-.474-.384-.832-.516-.356-.133-.765-.208-1.16-.22a8.7 8.7 0 00-.63.017 12.04 12.04 0 01-.248.604c-.345.748-.76 1.518-1.097 2.24-.337.723-.592 1.41-.592 1.982 0 .445.072.851.21 1.224.136.37.334.69.558.976.45.578.959 1.034 1.234 1.54.278.506.347 1.042.24 1.842-.09.69-.38 1.25-.82 1.67-.437.42-1.025.717-1.672.837-.646.12-1.338.03-1.924-.276-.586-.305-1.022-.82-1.173-1.446-.08-.311-.067-.618.028-.9.096-.284.276-.56.52-.836.49-.553 1.219-1.077 1.47-1.67.13-.31.152-.658.07-1.01a5.015 5.015 0 00-.53-1.155l-.088-.147a4.3 4.3 0 01-.147-.296c-.065-.147-.145-.345-.228-.573-.498-1.318-.626-2.786-.37-4.356C6.978 4.03 10.22 1.5 12 1.5z" />
      </svg>
    ),
    items: [
      {
        title: "AppImage works on modern distros",
        body: "Modern Fedora and Ubuntu ship FUSE 3 only, which breaks standard AppImages. Cross Platform Terminal ships with the type2 runtime that supports both FUSE 2 and FUSE 3 - it just runs.",
      },
      {
        title: "Atomic updates",
        body: "The in-app updater replaces the binary atomically via rename(2) while the app is running. The next launch picks up the new binary - no package manager, no sudo.",
      },
      {
        title: "Shell from $SHELL",
        body: "New terminals inherit $SHELL automatically. Override it per-session in Settings → Terminal → Shell, or leave it unset and it follows your environment.",
      },
    ],
  },
];

export default function CrossPlatform() {
  return (
    <section id="cross-platform" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Divider */}
        <div className="h-px mb-24" style={{ background: "var(--color-border)" }} />

        {/* Header */}
        <div className="text-center mb-16">
          <p className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: "var(--color-accent)" }}>
            Cross-Platform
          </p>
          <h2
            className="text-3xl md:text-4xl font-bold tracking-tight"
            style={{ color: "var(--color-foreground)" }}
          >
            One cross-platform terminal. Linux, Windows, macOS.
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base" style={{ color: "var(--color-muted)" }}>
            The same shortcuts work identically on Linux, Windows, and macOS. No mental context-switching,
            no muscle-memory retraining when you switch machines.
          </p>
        </div>

        {/* Platform quirks */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {quirks.map((platform) => (
            <div
              key={platform.platform}
              className="rounded-xl border p-6"
              style={{ background: "var(--color-surface)", borderColor: "var(--color-border)" }}
            >
              <div className="flex items-center gap-2 mb-5">
                <span style={{ color: "var(--color-accent)" }}>{platform.icon}</span>
                <h3 className="font-semibold text-sm" style={{ color: "var(--color-foreground)" }}>
                  {platform.platform}
                </h3>
                <span
                  className="ml-auto text-xs px-2 py-0.5 rounded-full"
                  style={{ background: "var(--color-accent-dim)", color: "var(--color-accent)" }}
                >
                  quirks resolved
                </span>
              </div>
              <div className="flex flex-col gap-4">
                {platform.items.map((item) => (
                  <div key={item.title} className="flex gap-3">
                    <svg
                      className="w-4 h-4 mt-0.5 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      style={{ color: "var(--color-accent)" }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                    <div>
                      <p className="text-sm font-medium mb-0.5" style={{ color: "var(--color-foreground)" }}>
                        {item.title}
                      </p>
                      <p className="text-sm leading-relaxed" style={{ color: "var(--color-muted)" }}>
                        {item.body}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Shortcut table — reference material, folded away by default. */}
        <details className="max-w-lg mx-auto mt-16 group">
          <summary
            className="cursor-pointer list-none flex items-center justify-center gap-2 text-sm rounded-lg border px-4 py-2.5 cpt-quiet"
            style={{ borderColor: "var(--color-border)", color: "var(--color-muted)" }}
          >
            <span>See the full shortcut table</span>
            <svg
              className="w-4 h-4 transition-transform group-open:rotate-180"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </summary>

        <div
          className="rounded-xl border overflow-hidden mt-4"
          style={{ borderColor: "var(--color-border)" }}
        >
          <div
            className="grid grid-cols-2 px-5 py-2.5 border-b text-xs font-semibold uppercase tracking-widest"
            style={{ background: "var(--color-surface-2)", borderColor: "var(--color-border)", color: "var(--color-muted)" }}
          >
            <span>Action</span>
            <span>Shortcut</span>
          </div>
          {shortcuts.map((s, i) => (
            <div
              key={s.action}
              className="grid grid-cols-2 px-5 py-3 items-center text-sm border-b last:border-b-0"
              style={{
                borderColor: "var(--color-border)",
                background: i % 2 === 0 ? "var(--color-surface)" : "transparent",
              }}
            >
              <span style={{ color: "var(--color-muted)" }}>{s.action}</span>
              <span
                className="font-mono text-xs px-2 py-0.5 rounded justify-self-start"
                style={{ background: "var(--color-surface-2)", color: "var(--color-foreground)" }}
              >
                {s.keys}
              </span>
            </div>
          ))}
          <div
            className="px-5 py-2.5 text-xs"
            style={{ background: "var(--color-surface-2)", color: "var(--color-muted)" }}
          >
            All rebindable in Settings → Keyboard Shortcuts or{" "}
            <code
              className="font-mono px-1 rounded text-[11px]"
              style={{ background: "var(--color-border)", color: "var(--color-foreground)" }}
            >
              shortcuts.json
            </code>
          </div>
        </div>
        </details>
      </div>
    </section>
  );
}
