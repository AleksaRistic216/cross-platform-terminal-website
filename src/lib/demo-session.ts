/**
 * The scripted session that plays in the hero.
 *
 * This is data, not markup: `TerminalDemo` walks the op list and mutates a small state machine, so
 * changing what the demo shows means editing this file only.
 *
 * Every keystroke used here is a real binding — keep it that way. The list lives in
 * `CrossPlatform.tsx`; if a shortcut is not in that table it must not appear in the demo. Switching
 * views is done by clicking the tab for exactly this reason: there is no documented binding for it.
 */

export type Color = "fg" | "dim" | "green" | "blue" | "accent" | "cyan" | "magenta";

export type Span = {
  t: string;
  c?: Color;
  /** Draw the shell prompt in place of `t`. Set by the player when a typed line is committed. */
  prompt?: true;
};
export type Line = Span[];

export type Op =
  /** Back to the opening frame — one view, one pane, nothing running. */
  | { k: "reset" }
  /** Caption under the terminal. Doubles as the demo's accessible narration. */
  | { k: "caption"; text: string }
  | { k: "wait"; ms: number }
  /** Types into the focused pane's prompt, character by character. */
  | { k: "type"; text: string; cps?: number }
  /** Commits the typed line to scrollback, as the shell would. */
  | { k: "run" }
  /** Streams output lines into the focused pane. */
  | { k: "out"; lines: Line[]; stagger?: number }
  /** Floating keycaps, e.g. ["Ctrl", "Shift", "F"]. */
  | { k: "key"; keys: string[]; hold?: number }
  | { k: "split"; dir: "right" | "down" }
  | { k: "newview"; name: string }
  | { k: "switchview"; index: number }
  /** The live AI status badge in the status bar. */
  | { k: "ai"; tool: string | null }
  | { k: "tokens"; to: number; ms: number };

const g = (t: string): Span => ({ t, c: "green" });
const d = (t: string): Span => ({ t, c: "dim" });
const a = (t: string): Span => ({ t, c: "accent" });

export const HOST = "you@laptop";
export const CWD = "~/src/cpt";

export const demo: Op[] = [
  // The component paints the *last* frame before the player starts, so that a visitor who has not
  // hydrated yet still sees a populated workspace rather than an empty terminal. This pause lets
  // that frame be read before the loop wipes it.
  { k: "wait", ms: 900 },
  { k: "reset" },
  { k: "caption", text: "One workspace, one pane. Your shell, unchanged." },
  { k: "wait", ms: 900 },

  { k: "type", text: "cargo build --release", cps: 21 },
  { k: "run" },
  {
    k: "out",
    stagger: 280,
    lines: [
      [g("   Compiling"), { t: " cpt-render v0.9.2" }],
      [g("   Compiling"), { t: " cpt-pty v0.9.2" }],
      [g("    Finished"), { t: " `release` profile [optimized] in 12.41s" }],
    ],
  },
  { k: "wait", ms: 650 },

  { k: "caption", text: "Split the pane. Same keys on Linux, Windows and macOS." },
  { k: "key", keys: ["Ctrl", "Shift", "F"], hold: 950 },
  { k: "split", dir: "right" },
  { k: "wait", ms: 450 },

  { k: "type", text: "claude", cps: 13 },
  { k: "run" },
  {
    k: "out",
    stagger: 220,
    lines: [
      [a("✻"), { t: " Claude Code " }, d("v2.1.4")],
      [d("  /help for help · cwd: " + CWD)],
    ],
  },
  { k: "ai", tool: "Claude Code" },
  { k: "caption", text: "CPT notices the AI tool and tracks it live. Zero config." },
  { k: "tokens", to: 12400, ms: 1500 },

  { k: "type", text: "port the win32 pty shim to the new trait", cps: 34 },
  { k: "run" },
  {
    k: "out",
    stagger: 340,
    lines: [
      [a("●"), d(" Read src/pty/win32.rs")],
      [a("●"), { t: " Updated src/pty/win32.rs " }, g("+38"), d(" · "), { t: "−12", c: "magenta" }],
      [a("●"), { t: " cargo check " }, g("passed")],
    ],
  },
  { k: "tokens", to: 31800, ms: 1200 },
  { k: "wait", ms: 500 },

  { k: "caption", text: "A second view, with a layout entirely its own." },
  { k: "key", keys: ["Alt", "T"], hold: 950 },
  { k: "newview", name: "Logs" },
  { k: "type", text: "journalctl -fu cpt", cps: 22 },
  { k: "run" },
  {
    k: "out",
    stagger: 300,
    lines: [
      [d("19:41:02 "), { t: "cpt[4412]: view \"Logs\" created" }],
      [d("19:41:02 "), { t: "cpt[4412]: pane attached pty /dev/pts/7" }],
      [d("19:41:03 "), { t: "cpt[4412]: gpu: " }, g("1 draw call"), { t: " · 3840×2160 @ 144hz" }],
    ],
  },
  { k: "wait", ms: 900 },

  { k: "caption", text: "Switch back — Main is exactly where you left it." },
  { k: "switchview", index: 0 },
  { k: "wait", ms: 2600 },
];
