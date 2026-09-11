# dev.to repost — "How to get notified when Claude Code is waiting for you"

> Drafts, not posts. Nothing here has been published.
>
> This is the guide already live at
> https://www.crossplatformterminal.com/guides/get-notified-when-claude-code-needs-input, reworded
> only where a link had to become a full address. Every claim was checked against Anthropic's docs
> when the guide was written.

## How to post it (about 5 minutes)

1. Make an account at <https://dev.to> — use the CPT team name, since this is the team's article.
2. Click **Create Post**, and fill in three small things first:
   - **Title:**
     ```
     How to get notified when Claude Code is waiting for you
     ```
   - **Tags** (type each, press Enter after it): `claudecode`, `ai`, `productivity`, `terminal`
   - **Canonical URL** — open the options menu next to the Publish button (a gear or "…" icon) and
     paste this into the Canonical URL box. It tells Google the original lives on our site, so the
     two copies help each other instead of competing:
     ```
     https://www.crossplatformterminal.com/guides/get-notified-when-claude-code-needs-input
     ```
3. Copy everything inside the big grey box below into the main text area.
4. Click **Save draft**, then **Preview**. If it looks right, **Publish**.

If you can't find the Canonical URL box, save it as a draft and ask Claude — don't publish without it.

```markdown
*Written by the team behind Cross Platform Terminal (CPT), a paid terminal. Almost everything below is free and works in any terminal; CPT gets one paragraph at the end.*

You start Claude Code on a long task, switch to something else, and come back twenty minutes later to find it stopped after thirty seconds to ask whether it may run a command. Most of the fix is already built into Claude Code and costs nothing. It is a settings change, or at most a one-line hook.

## Start with what Claude Code already does

When Claude finishes a task or pauses for a permission prompt, and you appear to be away from the terminal, Claude Code fires a notification. By default it becomes a desktop notification only in Ghostty, kitty and iTerm2. In any other terminal, the one-line fix is to have it ring the terminal bell instead ([Claude Code's terminal docs](https://code.claude.com/docs/en/terminal-config)):

    // ~/.claude/settings.json
    {
      "preferredNotifChannel": "terminal_bell"
    }

Most terminals can flash, bounce the taskbar or play a sound on a bell, so check your terminal's bell settings before writing anything more elaborate. The desktop notification also reaches your local machine over SSH, so a remote session can still get your attention.

## A Notification hook, for a real desktop notification anywhere

For a proper notification in a terminal that does not get one by default, add a Notification hook. It runs a command of your choosing alongside the built-in behaviour rather than replacing it. Put it in `~/.claude/settings.json` for every project, or in a project's `.claude/settings.json` to share it with the repository ([hooks guide](https://code.claude.com/docs/en/hooks-guide)). On Linux:

    {
      "hooks": {
        "Notification": [
          {
            "matcher": "",
            "hooks": [
              {
                "type": "command",
                "command": "notify-send 'Claude Code' 'Claude Code needs your attention'"
              }
            ]
          }
        ]
      }
    }

- **Linux:** notify-send needs a notification daemon, which headless servers, SSH sessions and most containers lack. On Debian and Ubuntu it comes from the libnotify-bin package.
- **macOS:** Anthropic's example uses osascript with "display notification". It fails silently until Script Editor has notification permission in System Settings.
- **Windows:** the documented PowerShell example opens a MessageBox dialog, which can land behind your terminal window. For a toast in the corner of the screen instead, use BurntToast:

      # Windows: a toast instead of a dialog — BurntToast, MIT, from the PowerShell Gallery
      Install-Module -Name BurntToast
      New-BurntToastNotification -Text 'Claude Code', 'Needs your attention'

      # macOS: terminal-notifier, MIT, from Homebrew
      brew install terminal-notifier
      terminal-notifier -title 'Claude Code' -message 'Needs your attention'

Run each one by hand first. Once a notification appears, make it the hook's command — on Windows, wrapped in `powershell.exe -Command`.

## Only the notifications you want

An empty matcher fires on every notification type. Two are the ones that matter here: `permission_prompt`, when a tool call has been waiting for your approval for about six seconds, and `idle_prompt`, when Claude finished about sixty seconds ago and you have not typed since. Set the matcher to `permission_prompt|idle_prompt` and the sign-in and MCP notifications stay quiet ([hooks reference](https://code.claude.com/docs/en/hooks)).

There is also a Stop hook, which fires every time Claude finishes responding. It is the right hook for running a script after each turn, and a noisy one for notifications, because it fires even while you are sitting in front of the pane.

## Inside tmux

tmux swallows the escape sequences Claude Code uses for desktop notifications unless you let them through. Anthropic's docs give the passthrough line. tmux's own `monitor-silence` option is the agent-agnostic backstop: it highlights a window in the status line once it has gone quiet for the given number of seconds, which is what an agent looks like when it stops to wait.

    # ~/.tmux.conf
    set -g allow-passthrough on     # let notifications reach the outer terminal
    setw -g monitor-silence 30      # highlight windows silent for 30 seconds

## Where the free setup runs out

- **It is per agent.** Claude Code's hooks do nothing for Codex, Gemini CLI or Aider in the next pane, and each one needs its own configuration, if it has any.
- **It is per machine.** A Linux desktop and a Windows laptop need different commands, and you maintain both.
- **It tells you that something needs you, not where.** The hook receives the session's working directory as JSON on stdin, so a small script can put the project name in the notification. It still will not take you to the right pane.

## Where CPT fits

Cross Platform Terminal moves this into the terminal rather than into each agent's config. It recognises Claude Code, GitHub Copilot, Codex CLI, Gemini CLI, Aider, Cursor Agent, opencode and Amp from the process tree and argv, even behind npx, uv, node or a virtualenv shim. It gives the pane a badge naming the tool, and tells waiting-for-input apart from working, idle, finished and failed. From v0.5.7 it also notifies the desktop when an agent needs you, with no hook to write. It behaves the same on Linux and Windows.

It is a paid subscription with no free tier and no trial, and there is no macOS build yet. If you run one agent on one machine, the settings line or the hook above is all you need — set that up and stop there.

## Which to pick

- **Ghostty, kitty or iTerm2:** nothing to do, notifications already work.
- **Any other terminal, and a bell is enough:** `preferredNotifChannel` set to `terminal_bell`.
- **You want a real desktop notification:** a Notification hook matched on `permission_prompt|idle_prompt`.
- **Several agents from different vendors, or on both Linux and Windows:** that is where per-pane detection in [CPT](https://www.crossplatformterminal.com/guides/see-what-your-coding-agent-is-doing-in-the-terminal) starts to earn its price.
```

## If someone comments

Use the ready answers at the end of `marketing/START-HERE.md`. For a technical question you can't
answer: `Good question, let me check with the team and come back to you.` — then ask Claude.
