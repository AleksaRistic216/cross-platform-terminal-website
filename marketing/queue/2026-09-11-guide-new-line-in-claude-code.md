# Preview — new website guide

> This is a copy for reading, not for posting. It is exactly what will appear at
> https://www.crossplatformterminal.com/guides/new-line-in-claude-code-without-sending once it goes live.
>
> **What to do:** read it. If it's fine, tell Claude **"merge the website update"**. If anything
> reads wrong or unclear, tell Claude which part.

**Shown in Google as:** New line in Claude Code without sending: Shift+Enter, Ctrl+J

**Google snippet:** Enter sends. Ctrl+J and backslash-Enter add a line in any terminal; Shift+Enter depends on the terminal — where it works, where /terminal-setup fixes it.

---

# How to type a new line in Claude Code without sending the prompt

You are writing a prompt in Claude Code, press Enter to start a new paragraph, and it sends half a thought. Enter submits. Two keys add a line instead in every terminal, and a third — Shift+Enter, the one most people reach for — depends on which terminal you are in.

## The two that work everywhere

- Ctrl+J inserts a new line, in any terminal, with no setup.
- Type a backslash, then press Enter. Claude Code takes \ followed by Enter as a line break rather than a submit.

Both come from [Claude Code's terminal docs](https://code.claude.com/docs/en/terminal-config), which say they "work in every terminal with no setup". Pasting a multi-line block keeps its line breaks too ([interactive mode](https://code.claude.com/docs/en/interactive-mode)).

## Shift+Enter, terminal by terminal

Whether Shift+Enter adds a line depends on the terminal, not on Claude Code. Anthropic's docs sort terminals into three groups:

- Works with no setup: [Ghostty](https://www.crossplatformterminal.com/vs/ghostty), [kitty](https://www.crossplatformterminal.com/vs/kitty), iTerm2, [WezTerm](https://www.crossplatformterminal.com/vs/wezterm), [Warp](https://www.crossplatformterminal.com/vs/warp), Apple Terminal and [Windows Terminal](https://www.crossplatformterminal.com/vs/windows-terminal).
- Works after running /terminal-setup once: VS Code, Cursor, Devin Desktop, [Alacritty](https://www.crossplatformterminal.com/vs/alacritty) and Zed.
- Not available: gnome-terminal, and JetBrains IDEs such as PyCharm and Android Studio. Use Ctrl+J or \ then Enter there.

## What /terminal-setup changes

In VS Code, Cursor, Devin Desktop, Alacritty and Zed, /terminal-setup writes a Shift+Enter keybinding into that terminal's own configuration file. Existing bindings are left in place: a message saying the binding is already configured means nothing was changed. In VS Code, Cursor and Devin Desktop it also changes two editor settings — it turns the integrated terminal's GPU acceleration off and sets its mouse-wheel scroll sensitivity — so it is worth knowing before you run it.

> **Note:** Run /terminal-setup in the terminal itself, not inside tmux or screen. It needs to write to the host terminal's configuration, which it cannot reach from inside a multiplexer.

## Inside tmux

tmux needs its own configuration before Shift+Enter gets through, even when the terminal around it supports it. Anthropic's docs give three lines:

```
# ~/.tmux.conf
set -g allow-passthrough on
set -s extended-keys on
set -as terminal-features 'xterm*:extkeys'
```

## On macOS: Option+Enter

Option+Enter also inserts a new line, but most macOS terminals do not send Option as a modifier by default, so it does nothing until you turn on Option as Meta in the terminal's settings. In VS Code that is "terminal.integrated.macOptionIsMeta": true. In JetBrains IDEs, the Claude Code plugin has its own setting for Option+Enter ([JetBrains docs](https://code.claude.com/docs/en/jetbrains)).

## If it still sends

- Update Claude Code first. Its [changelog](https://code.claude.com/docs/en/changelog) records fixes for Shift+Enter submitting on Windows Terminal Preview 1.25 (v2.1.89) and for Shift+Enter printing stray characters in Ghostty over SSH (v2.1.69).
- Would rather Enter added a line and Shift+Enter sent? Map the chat:newline and chat:submit actions in Claude Code's keybindings file ([keybindings docs](https://code.claude.com/docs/en/keybindings)).
- In Vim mode, Enter still submits from INSERT mode. Use o or O in NORMAL mode, or Ctrl+J.

## Where CPT fits

In Cross Platform Terminal, Shift+Enter inserts a new line instead of submitting, on Linux and Windows alike, with nothing to configure. That is not a reason to switch on its own: on Windows, Windows Terminal already does it, and Ctrl+J costs nothing anywhere. CPT is worth a look if you also want one terminal that behaves the same on both systems, or live status for several agents at once — see [seeing what your coding agent is doing](https://www.crossplatformterminal.com/guides/see-what-your-coding-agent-is-doing-in-the-terminal).

> **Note:** CPT is a paid subscription with no free tier and no trial, and there is no macOS build yet. For this problem alone, Ctrl+J is the answer.

## Which to use

- Any terminal, right now: Ctrl+J, or \ then Enter.
- Ghostty, kitty, iTerm2, WezTerm, Warp, Apple Terminal or Windows Terminal: Shift+Enter already works.
- VS Code, Cursor, Alacritty or Zed: run /terminal-setup once, outside tmux.
- Inside tmux: add the three lines above.
- gnome-terminal or a JetBrains IDE: Ctrl+J.

---

**Related guides shown at the bottom:** https://www.crossplatformterminal.com/guides/get-notified-when-claude-code-needs-input, https://www.crossplatformterminal.com/guides/see-what-your-coding-agent-is-doing-in-the-terminal
