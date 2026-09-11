/**
 * The intent pages: one per thing a developer actually types into a search box.
 *
 * These are not adverts with a question mark on top. Each one answers the question properly,
 * including with tools that are not CPT, and only then says where CPT fits. A page that sends
 * someone away with their problem solved is still worth writing — it ranks, it earns links, and
 * the one reader in twenty who wanted exactly what CPT does arrives already trusting the page.
 *
 * Content is data rather than JSX so the set stays uniform and so `scripts/vs-refresh.mjs` and the
 * sitemap can enumerate it. Inline links use a `[label](href)` form, rendered by GuideBody.
 */

export type Block =
  | { kind: "p"; text: string }
  | { kind: "h2"; text: string }
  | { kind: "list"; items: string[] }
  | { kind: "steps"; items: string[] }
  | { kind: "code"; lines: string[] }
  | { kind: "note"; text: string }
  /** A capture of the real product, under public/. Width and height are the file's own pixels. */
  | { kind: "image"; src: string; alt: string; width: number; height: number; caption?: string };

export type Guide = {
  slug: string;
  /** The <h1>. Phrased as the reader would phrase it. */
  title: string;
  /** <title> — kept close to the search phrasing without being a keyword smear. */
  metaTitle: string;
  description: string;
  /** One-line summary for the index page. */
  summary: string;
  blocks: Block[];
  related: string[];
};

export const GUIDES: Guide[] = [
  {
    slug: "same-terminal-setup-on-windows-and-linux",
    title: "Getting the same terminal setup on Windows and Linux",
    metaTitle: "The same terminal setup on Windows and Linux",
    description:
      "Synced dotfiles, WSL, a cross-platform emulator, or one app built for both — four ways to make Windows and Linux behave the same, and what each costs.",
    summary:
      "Dotfiles, WSL, a portable emulator, or one app for both — with the trade-off each one actually makes.",
    blocks: [
      {
        kind: "p",
        text: "If you work on a Windows laptop and a Linux machine, the problem is rarely the shell. It is that everything around the shell differs: the copy-paste keys, where the tabs are, whether Ctrl+W closes a pane or deletes a word, how the font renders, and which config file you are supposed to edit this time. Four approaches actually work. They are not equally good, and which one wins depends on how much of your week is spent on each machine.",
      },
      { kind: "h2", text: "1. Sync dotfiles and accept two front ends" },
      {
        kind: "p",
        text: "The cheapest option: keep your shell config in a git repository, symlink it into place on both machines, and let each OS use whatever terminal it likes. A [chezmoi](https://www.chezmoi.io/) or bare-repo setup gets you there in an afternoon.",
      },
      {
        kind: "p",
        text: "This fixes the shell and nothing else. Your prompt, aliases and functions follow you; your window chrome and keybindings do not. If you mostly live inside Neovim or tmux, that may be enough, because the part you touch is already inside the terminal rather than around it.",
      },
      { kind: "h2", text: "2. Use WSL and make Windows pretend to be Linux" },
      {
        kind: "p",
        text: "WSL2 gives you a real Linux userspace on Windows, and Windows Terminal integrates with it properly. Run the same shell, the same tools and the same dotfiles on both machines, and the difference mostly disappears.",
      },
      {
        kind: "p",
        text: "The catch is everything that crosses the boundary. Filesystem performance across /mnt/c is poor enough to be noticeable in a large repository, native Windows toolchains are awkward to reach from inside WSL, and anything that wants a GUI, a USB device or a specific driver becomes a research project. WSL is excellent when your work is entirely inside Linux and Windows is just the hardware you were issued.",
      },
      { kind: "h2", text: "3. Run one cross-platform emulator on both" },
      {
        kind: "p",
        text: "Several terminals build for both platforms, so you can carry one config across. [WezTerm](/vs/wezterm) is the strongest of these: Lua config, a built-in multiplexer, and native builds for Linux, macOS, Windows and the BSDs. [Alacritty](/vs/alacritty) does the same job with a single TOML file if you want less. Both are free and open source.",
      },
      {
        kind: "p",
        text: "This is the right answer for a lot of people, and it costs nothing. What you are signing up for is assembling the workspace yourself — the emulator gives you a fast grid, and tabs, splits, persistence and layout come from tmux, a window manager, and a config file you maintain.",
      },
      { kind: "h2", text: "4. One application, shipped identically for both" },
      {
        kind: "p",
        text: "The last option is a workspace that is the same program on both platforms rather than the same config on two programs. That is what Cross Platform Terminal is: the same shortcuts, the same dockable layout, the same settings screens, from one build per OS.",
      },
      {
        kind: "list",
        items: [
          "Extract and run. No installer on Windows, an AppImage or tarball on Linux.",
          "Dockable panels, edge rails and pinned panes, so the layout is part of the app rather than something you rebuild in tmux on each machine.",
          "Per-view layouts: each view keeps its own arrangement, and the arrangement is the same on both machines.",
          "Quirks that differ between platforms — escape sequences, input edge cases, rendering glitches — are handled inside the app rather than by you.",
        ],
      },
      {
        kind: "note",
        text: "CPT is a paid subscription with no free tier, and macOS is still in progress. If either of those is a blocker, options 1 to 3 are genuinely good and free — start there.",
      },
      { kind: "h2", text: "Which to pick" },
      {
        kind: "list",
        items: [
          "Mostly one OS, occasionally the other: sync dotfiles and stop there.",
          "Windows hardware, Linux work: WSL2 plus Windows Terminal.",
          "Both machines daily, happy to assemble the stack: WezTerm or Alacritty plus tmux.",
          "Both machines daily, want it to already be assembled: that is the gap CPT is built for.",
        ],
      },
    ],
    related: [
      "keep-a-terminal-session-alive-after-closing-the-app",
      "tmux-alternatives-on-windows",
    ],
  },
  {
    slug: "keep-a-terminal-session-alive-after-closing-the-app",
    title: "How to keep a terminal session alive after closing the terminal",
    metaTitle: "Keep a terminal session running after closing the window",
    description:
      "Why a long-running command dies when you close the terminal, and the four fixes: nohup, screen, tmux, or a terminal that detaches sessions itself.",
    summary:
      "SIGHUP, and the four standard ways around it — from nohup to a terminal that detaches by itself.",
    blocks: [
      {
        kind: "p",
        text: "Close a terminal window and the build running inside it dies. That is not a bug: the kernel sends SIGHUP to the foreground process group when the controlling terminal goes away, and most programs take the hint and exit. Everything below is a way of making sure the process is not attached to a terminal that can disappear.",
      },
      { kind: "h2", text: "nohup and disown — for one command, right now" },
      {
        kind: "code",
        lines: [
          "# start it detached from the hangup signal",
          "nohup ./long-build.sh > build.log 2>&1 &",
          "",
          "# or rescue something already running: Ctrl+Z, then",
          "bg",
          "disown -h %1",
        ],
      },
      {
        kind: "p",
        text: "This is the smallest possible fix and it works everywhere. What you lose is the session: you cannot get back to an interactive prompt, you are reading a log file instead of watching output, and anything that wants a TTY — a prompt, a progress bar, an editor — will misbehave.",
      },
      { kind: "h2", text: "screen — the old reliable" },
      {
        kind: "code",
        lines: [
          "screen -S build      # start a named session",
          "# Ctrl+A then d       detach",
          "screen -ls           # list sessions",
          "screen -r build      # reattach",
        ],
      },
      {
        kind: "p",
        text: "GNU screen keeps a real PTY alive in the background, so you get your interactive session back exactly as you left it. It is installed almost everywhere and it has been doing this since the 1980s.",
      },
      { kind: "h2", text: "tmux — what most people use" },
      {
        kind: "code",
        lines: [
          "tmux new -s build    # start a named session",
          "# Ctrl+B then d       detach",
          "tmux ls              # list sessions",
          "tmux attach -t build # reattach",
        ],
      },
      {
        kind: "p",
        text: "tmux does the same thing with a better split and window model, a scriptable config, and a large plugin ecosystem. If you are on Linux or macOS and you do this regularly, tmux is the answer, and it is free.",
      },
      {
        kind: "p",
        text: "The costs are real, though: a second keybinding layer on top of the one your terminal already has, a prefix key to press before everything, a config file to maintain, and a set of concepts — sessions, windows, panes — that sit beside the tabs and panes your terminal already draws. On Windows it is [awkward at best](/guides/tmux-alternatives-on-windows).",
      },
      { kind: "h2", text: "A terminal that detaches on its own" },
      {
        kind: "p",
        text: "The fourth option is for the terminal to run its shells outside the UI process in the first place, so closing the window is not an event the shell can notice. Cross Platform Terminal does this behind one checkbox: Settings, then Widgets, then Terminal — “Keep shells running when the app closes”.",
      },
      {
        kind: "image",
        src: "/shots/keep-shells-running-setting.png",
        alt: "CPT's terminal settings with “Keep shells running when the app closes” switched on, and below it the limits for how long a detached session is kept and how many can exist at once.",
        width: 600,
        height: 150,
        caption:
          "The setting in CPT 0.5.7. The two lines under it decide how long a background session is kept before it is ended (a day, by default) and how many there can be at once.",
      },
      {
        kind: "p",
        text: "With it on, shells run in a background process rather than inside the app. Close CPT with a server or a build running, reopen it, and the pane comes back with its scrollback and the process still going. There is no prefix key and no second set of keybindings, because it is the same panes and tabs you were already using.",
      },
      {
        kind: "image",
        src: "/shots/terminal-sessions-window.png",
        alt: "CPT reopened after being closed: a pane still showing a Python web server that kept running, and the Terminal Sessions window listing three sessions — one open here, two detached, each with Open and End buttons.",
        width: 1112,
        height: 424,
        caption:
          "Settings → Terminal Sessions, two minutes after closing CPT and opening it again. The server started in api-server never stopped and is back in its pane; the shells in web-app and infra kept running in the background, and Open puts either one back in a pane.",
      },
      {
        kind: "list",
        items: [
          "Closing a pane that is sitting at a prompt ends that shell, as you would expect. Closing one with something still running asks first: keep it running in the background, or end it. Closing the whole app never asks — everything is kept.",
          "Sessions are local to the machine and to the profile. This is not a replacement for tmux over SSH, which is a different problem.",
          "Every session is listed under Settings → Terminal Sessions, where you can open it in a pane or end it.",
        ],
      },
      { kind: "h2", text: "Which to pick" },
      {
        kind: "list",
        items: [
          "One command, one time: nohup.",
          "Over SSH, on a server: tmux or screen. Nothing local can help you there.",
          "Every day, on your own machine, on Linux or macOS: tmux is free and very good.",
          "Every day, on your own machine, and you would rather not run a multiplexer at all: that is what CPT's detachable sessions are for.",
        ],
      },
    ],
    related: ["tmux-alternatives-on-windows", "same-terminal-setup-on-windows-and-linux"],
  },
  {
    slug: "tmux-alternatives-on-windows",
    title: "tmux alternatives on Windows",
    metaTitle: "tmux alternatives on Windows",
    description:
      "tmux has no native Windows build. What works instead: WSL, psmux, Zellij, Windows Terminal panes, or a terminal with persistence built in.",
    summary:
      "What actually works when you want tmux on Windows and there is no native tmux to install.",
    blocks: [
      {
        kind: "p",
        text: "There is no native Windows build of tmux. tmux is built on POSIX PTYs and Unix domain sockets; Windows has ConPTY, which is a different thing with different semantics. Everything below is either Linux-in-a-box or a different tool.",
      },
      { kind: "h2", text: "Run it inside WSL" },
      {
        kind: "p",
        text: "The most faithful answer. Install WSL2, install tmux inside it, and you have real tmux with your real config. It multiplexes the Linux processes inside that distribution.",
      },
      {
        kind: "p",
        text: "It does not multiplex Windows processes. Your PowerShell sessions, your MSVC builds and your native Windows tooling live outside the box tmux is running in, so if your work is genuinely on Windows rather than merely on Windows hardware, this solves the wrong half of the problem.",
      },
      { kind: "h2", text: "tmux under Git Bash or MSYS2" },
      {
        kind: "p",
        text: "MSYS2 packages tmux and it does run. Expect friction: it works with the MSYS2 PTY layer rather than ConPTY, native Windows console programs behave oddly inside it, and clipboard integration and mouse handling need coaxing. Fine for a POSIX-shaped workflow that already lives in MSYS2; frustrating as a general-purpose multiplexer.",
      },
      { kind: "h2", text: "Windows Terminal panes" },
      {
        kind: "p",
        text: "[Windows Terminal](/vs/windows-terminal) has tabs and split panes, free and built in, and they work with PowerShell, cmd and WSL alike. If what you wanted from tmux was splits, you already have them.",
      },
      {
        kind: "p",
        text: "What it does not have is persistence. Close the window and the shells go with it — there is no detach and reattach, which for many people is the entire reason they ran tmux.",
      },
      { kind: "h2", text: "psmux" },
      {
        kind: "p",
        text: "[psmux](https://github.com/psmux/psmux) is a multiplexer written for Windows from the ground up, in Rust, with no WSL, Cygwin or MSYS2 underneath. It runs PowerShell, cmd, Git Bash and WSL shells side by side, detaches and reattaches sessions the way tmux does, and installs with `winget install psmux` on Windows 10 or 11. Free and MIT-licensed. If you want tmux's model on native Windows shells, try this first.",
      },
      { kind: "h2", text: "Zellij" },
      {
        kind: "p",
        text: "[Zellij](https://zellij.dev/) is a modern multiplexer with a friendlier default UX than tmux. Since [version 0.44](https://github.com/zellij-org/zellij/releases/tag/v0.44.0) (March 2026) it runs natively on Windows — a `zellij.exe` you start from PowerShell or Windows Terminal — with the same session management it has on Linux and macOS. Free and MIT-licensed. The Windows port is recent and the releases since have been fixing it, so expect some rough edges.",
      },
      { kind: "h2", text: "A terminal with persistence built in" },
      {
        kind: "p",
        text: "The other way out is a terminal that keeps its shells outside the UI process, so there is no multiplexer to install. Cross Platform Terminal does this natively on Windows: turn on “Keep shells running when the app closes”, and shells move to a background daemon. Close the app mid-build, reopen it, and the session reattaches with scrollback and the build still running.",
      },
      {
        kind: "list",
        items: [
          "It is the app's own tabs and panes, so there is no prefix key and no second keybinding layer. That, not persistence itself, is the difference from psmux and Zellij, which now persist native Windows shells too.",
          "The same build and the same shortcuts work on Linux, which is usually why the question came up in the first place.",
          "It is local only — for a session on a remote host, you still want tmux on that host.",
          "It is paid, with no trial. psmux and Zellij are free.",
        ],
      },
      { kind: "h2", text: "Which to pick" },
      {
        kind: "list",
        items: [
          "Your work is Linux, Windows is just the laptop: WSL2 plus tmux. Free, faithful, done.",
          "You only wanted splits: Windows Terminal already does that, free.",
          "You wanted tmux for native Windows shells: psmux, or Zellij if you prefer its UX. Both free.",
          "You wanted shells that survive closing the terminal, with no multiplexer to learn, and the same app on Linux: that is the gap CPT fills.",
          "You are on a remote host: tmux on the host. Nothing local applies.",
        ],
      },
    ],
    related: [
      "keep-a-terminal-session-alive-after-closing-the-app",
      "same-terminal-setup-on-windows-and-linux",
    ],
  },
  {
    slug: "see-what-your-coding-agent-is-doing-in-the-terminal",
    title: "Seeing what your coding agent is actually doing",
    metaTitle: "See your coding agent's status in the terminal",
    description:
      "Several agents in several panes and no idea which is blocked on a question. Why terminals cannot tell, the workarounds, and what per-pane status fixes.",
    summary:
      "Four agents in four panes and no idea which one is blocked on a question. What to do about it.",
    blocks: [
      {
        kind: "p",
        text: "The workflow that arrived with coding agents is several of them at once: one refactoring, one writing tests, one reading a codebase you have never seen. The failure mode arrives with it. Four panes are open, three are thinking, one has been waiting twenty minutes for you to answer a yes/no question, and there is no way to tell which without clicking through them.",
      },
      {
        kind: "p",
        text: "A terminal cannot help you by default, because it does not know what is in the pane. It has a PTY with bytes coming out of it. Whether those bytes are a compiler, a REPL or an agent waiting on approval is not something it models.",
      },
      { kind: "h2", text: "What people do about it now" },
      {
        kind: "list",
        items: [
          "Notification hooks. Claude Code and most agent CLIs can run a command on events, so you can fire a desktop notification when one stops. This works, and it is the best free option — it needs configuring per agent, per machine, and it tells you something finished without telling you which pane.",
          "Terminal bell plus a visual flash. Coarse: everything rings the same bell.",
          "A tmux status line hack that greps the pane's output. Fragile, and it breaks whenever the agent's output format changes.",
          "Clicking through the panes. What almost everyone actually does.",
        ],
      },
      { kind: "h2", text: "Why detection is harder than it looks" },
      {
        kind: "p",
        text: "The obvious approach — look at the process name in the pane — fails immediately in practice. Agents are launched through wrappers: npx, uv, a node shim, a virtualenv's bin directory. The process you find is node, or python, and the interesting name is somewhere up or down the tree, or in argv.",
      },
      {
        kind: "p",
        text: "Then there is state. “Busy” is not one bit. An agent that is working, an agent that is waiting for you to approve a tool call, and an agent that failed are three completely different things to a person glancing at a screen, and only one of them wants their attention right now.",
      },
      { kind: "h2", text: "What per-pane agent status looks like" },
      {
        kind: "p",
        text: "Cross Platform Terminal reads the process tree and argv, so an agent is found even behind npx, uv, node or a virtualenv shim. A pane running one gets a badge naming the tool and echoing its status line.",
      },
      {
        kind: "list",
          items: [
          "Recognised: Claude Code, GitHub Copilot, Codex CLI, Gemini CLI, Aider, Cursor Agent, opencode and Amp.",
          "Five states rather than one busy bit: idle, working, waiting for input, finished, failed.",
          "Tabs spin while any foreground command runs — not only agents — with a short debounce so quick commands do not flash them.",
          "Shift+Enter inserts a newline instead of submitting, which is the small thing that stops being small after the fiftieth prompt.",
          "An AI Inventory panel lists the skills, agents, commands, hooks, MCP servers and instruction files available in the repository the focused terminal is sitting in, each tagged project, user or plugin.",
        ],
      },
      {
        kind: "note",
        text: "This is deliberately not an agent of its own. CPT does not want to be the thing writing your code — it runs the CLI you already chose and tells you what it is doing. If you want the terminal itself to be the AI product, [Warp](/vs/warp) is further down that road and has a free tier.",
      },
      { kind: "h2", text: "If you are not going to change terminals" },
      {
        kind: "p",
        text: "Set up notification hooks in each agent CLI and give each pane a distinct title. It is not as good, it costs nothing, and it removes most of the twenty-minute stalls.",
      },
    ],
    related: [
      "get-notified-when-claude-code-needs-input",
      "new-line-in-claude-code-without-sending",
      "same-terminal-setup-on-windows-and-linux",
      "gpu-accelerated-terminal-explained",
    ],
  },
  {
    slug: "get-notified-when-claude-code-needs-input",
    title: "How to get notified when Claude Code is waiting for you",
    metaTitle: "Get notified when Claude Code needs your input",
    description:
      "Claude Code can ring a bell, raise a desktop notification or run your own script when it is waiting on you. How to set each up, inside tmux too.",
    summary:
      "A bell, a desktop notification or a hook — the free ways to stop checking the pane, and where they run out.",
    blocks: [
      {
        kind: "p",
        text: "You start Claude Code on a long task, switch to something else, and come back twenty minutes later to find it stopped after thirty seconds to ask whether it may run a command. Most of the fix is already built into Claude Code and costs nothing. It is a settings change, or at most a one-line hook.",
      },
      { kind: "h2", text: "Start with what Claude Code already does" },
      {
        kind: "p",
        text: "When Claude finishes a task or pauses for a permission prompt, and you appear to be away from the terminal, Claude Code fires a notification. By default it becomes a desktop notification only in [Ghostty](/vs/ghostty), [kitty](/vs/kitty) and iTerm2. In any other terminal, the one-line fix is to have it ring the terminal bell instead ([Claude Code's terminal docs](https://code.claude.com/docs/en/terminal-config)):",
      },
      {
        kind: "code",
        lines: [
          "// ~/.claude/settings.json",
          "{",
          '  "preferredNotifChannel": "terminal_bell"',
          "}",
        ],
      },
      {
        kind: "p",
        text: "Most terminals can flash, bounce the taskbar or play a sound on a bell, so check your terminal's bell settings before writing anything more elaborate. The desktop notification also reaches your local machine over SSH, so a remote session can still get your attention.",
      },
      { kind: "h2", text: "A Notification hook, for a real desktop notification anywhere" },
      {
        kind: "p",
        text: "For a proper notification in a terminal that does not get one by default, add a Notification hook. It runs a command of your choosing alongside the built-in behaviour rather than replacing it. Put it in ~/.claude/settings.json for every project, or in a project's .claude/settings.json to share it with the repository ([hooks guide](https://code.claude.com/docs/en/hooks-guide)). On Linux:",
      },
      {
        kind: "code",
        lines: [
          "{",
          '  "hooks": {',
          '    "Notification": [',
          "      {",
          '        "matcher": "",',
          '        "hooks": [',
          "          {",
          '            "type": "command",',
          "            \"command\": \"notify-send 'Claude Code' 'Claude Code needs your attention'\"",
          "          }",
          "        ]",
          "      }",
          "    ]",
          "  }",
          "}",
        ],
      },
      {
        kind: "list",
        items: [
          "Linux: notify-send needs a notification daemon, which headless servers, SSH sessions and most containers lack. On Debian and Ubuntu it comes from the libnotify-bin package.",
          "macOS: Anthropic's example uses osascript with “display notification”. It fails silently until Script Editor has notification permission in System Settings.",
          "Windows: the documented PowerShell example opens a MessageBox dialog, which can land behind your terminal window. For a toast in the corner of the screen instead, use BurntToast (below).",
        ],
      },
      {
        kind: "code",
        lines: [
          "# Windows: a toast instead of a dialog — BurntToast, MIT, from the PowerShell Gallery",
          "Install-Module -Name BurntToast",
          "New-BurntToastNotification -Text 'Claude Code', 'Needs your attention'",
          "",
          "# macOS: terminal-notifier, MIT, from Homebrew",
          "brew install terminal-notifier",
          "terminal-notifier -title 'Claude Code' -message 'Needs your attention'",
        ],
      },
      {
        kind: "p",
        text: "Run each one by hand first. Once a notification appears, make it the hook's command — on Windows, wrapped in powershell.exe -Command.",
      },
      { kind: "h2", text: "Only the notifications you want" },
      {
        kind: "p",
        text: "An empty matcher fires on every notification type. Two are the ones that matter here: permission_prompt, when a tool call has been waiting for your approval for about six seconds, and idle_prompt, when Claude finished about sixty seconds ago and you have not typed since. Set the matcher to permission_prompt|idle_prompt and the sign-in and MCP notifications stay quiet ([hooks reference](https://code.claude.com/docs/en/hooks)).",
      },
      {
        kind: "p",
        text: "There is also a Stop hook, which fires every time Claude finishes responding. It is the right hook for running a script after each turn, and a noisy one for notifications, because it fires even while you are sitting in front of the pane.",
      },
      { kind: "h2", text: "Inside tmux" },
      {
        kind: "p",
        text: "tmux swallows the escape sequences Claude Code uses for desktop notifications unless you let them through. Anthropic's docs give the passthrough line. tmux's own monitor-silence option is the agent-agnostic backstop: it highlights a window in the status line once it has gone quiet for the given number of seconds, which is what an agent looks like when it stops to wait.",
      },
      {
        kind: "code",
        lines: [
          "# ~/.tmux.conf",
          "set -g allow-passthrough on     # let notifications reach the outer terminal",
          "setw -g monitor-silence 30      # highlight windows silent for 30 seconds",
        ],
      },
      { kind: "h2", text: "Where the free setup runs out" },
      {
        kind: "list",
        items: [
          "It is per agent. Claude Code's hooks do nothing for Codex, Gemini CLI or Aider in the next pane, and each one needs its own configuration, if it has any.",
          "It is per machine. A Linux desktop and a Windows laptop need different commands, and you maintain both.",
          "It tells you that something needs you, not where. The hook receives the session's working directory as JSON on stdin, so a small script can put the project name in the notification. It still will not take you to the right pane.",
        ],
      },
      { kind: "h2", text: "Where CPT fits" },
      {
        kind: "p",
        text: "Cross Platform Terminal moves this into the terminal rather than into each agent's config. It recognises Claude Code, GitHub Copilot, Codex CLI, Gemini CLI, Aider, Cursor Agent, opencode and Amp from the process tree and argv, even behind npx, uv, node or a virtualenv shim. It gives the pane a badge naming the tool, and tells waiting-for-input apart from working, idle, finished and failed. From v0.5.7 it also notifies the desktop when an agent needs you, with no hook to write. It behaves the same on Linux and Windows. More on that in [seeing what your coding agent is doing](/guides/see-what-your-coding-agent-is-doing-in-the-terminal).",
      },
      {
        kind: "note",
        text: "CPT is a paid subscription with no free tier and no trial, and there is no macOS build yet. If you run one agent on one machine, the settings line or the hook above is all you need — set that up and stop there.",
      },
      { kind: "h2", text: "Which to pick" },
      {
        kind: "list",
        items: [
          "Ghostty, kitty or iTerm2: nothing to do, notifications already work.",
          "Any other terminal, and a bell is enough: preferredNotifChannel set to terminal_bell.",
          "You want a real desktop notification: a Notification hook matched on permission_prompt|idle_prompt.",
          "Several agents from different vendors, or on both Linux and Windows: that is where per-pane detection in CPT starts to earn its price.",
        ],
      },
    ],
    related: [
      "see-what-your-coding-agent-is-doing-in-the-terminal",
      "new-line-in-claude-code-without-sending",
      "keep-a-terminal-session-alive-after-closing-the-app",
    ],
  },
  {
    slug: "gpu-accelerated-terminal-explained",
    title: "What “GPU-accelerated terminal” actually means",
    metaTitle: "What a GPU-accelerated terminal actually does",
    description:
      "Why terminals started using the GPU, what the phrase does and does not promise, when you can feel the difference, and how the common approaches differ.",
    summary:
      "The phrase is on every terminal's front page. Here is what it does and does not buy you.",
    blocks: [
      {
        kind: "p",
        text: "Every terminal released in the last decade claims GPU acceleration, which makes the phrase close to meaningless as a differentiator. It does mean something specific, though, and it is worth knowing what — mostly so you can tell when it will not help you.",
      },
      { kind: "h2", text: "The problem it solves" },
      {
        kind: "p",
        text: "A terminal is a grid of cells. A large window is maybe 200 by 60, so 12,000 cells, each with a glyph, a foreground colour, a background colour and attributes. Redraw that on the CPU, one glyph at a time, at 120Hz while something is streaming output, and you are doing a lot of per-cell work in a loop — which is why older terminals visibly struggle when you cat a large file or scroll fast.",
      },
      {
        kind: "p",
        text: "The GPU approach: rasterise each glyph once into a texture atlas, then describe the whole grid as data and let the GPU composite it. The CPU stops touching pixels and starts describing cells.",
      },
      { kind: "h2", text: "What the approaches have in common, and where they differ" },
      {
        kind: "list",
        items: [
          "[Alacritty](/vs/alacritty) uses OpenGL and needs OpenGL ES 2.0 or better.",
          "[kitty](/vs/kitty) uses OpenGL directly with no large UI toolkit underneath.",
          "[WezTerm](/vs/wezterm) is GPU-accelerated with WebGPU front-end options and a fallback adapter.",
          "[Windows Terminal](/vs/windows-terminal) uses a DirectWrite-based text layout and rendering engine.",
          "Electron-based terminals like [Tabby](/vs/tabby) and [Hyper](/vs/hyper) go through the browser engine's compositor, which is a different set of trade-offs.",
          "Cross Platform Terminal renders the entire grid in a single draw call.",
        ],
      },
      {
        kind: "p",
        text: "The number that matters is not “does it use the GPU” but how many draw calls and state changes a frame costs. One call for the grid means frame cost is close to flat as the window grows, which is the thing you feel on a 4K display with several panes open.",
      },
      { kind: "h2", text: "When you will not notice" },
      {
        kind: "list",
        items: [
          "Reading and typing. Nothing is redrawing; every terminal here is instant.",
          "Over SSH on a slow link — the bottleneck is the network, not the renderer.",
          "In a VM or over remote desktop without GPU passthrough, where you may land on a software rasteriser and lose the benefit entirely.",
        ],
      },
      { kind: "h2", text: "When you will" },
      {
        kind: "list",
        items: [
          "Streaming output: build logs, test runners, an agent writing a long diff.",
          "Fast scrollback through a large buffer.",
          "Large windows, high DPI, and several panes redrawing at once.",
          "Ligature-heavy fonts, where glyph shaping is cached rather than recomputed.",
        ],
      },
      {
        kind: "note",
        text: "If a terminal feels slow and it already claims GPU rendering, the cause is usually elsewhere: your shell prompt shelling out to git on every keystroke, an unbounded scrollback, or a font fallback chain scanning hundreds of families. Check those before changing terminals.",
      },
    ],
    related: [
      "see-what-your-coding-agent-is-doing-in-the-terminal",
      "same-terminal-setup-on-windows-and-linux",
    ],
  },
  {
    slug: "new-line-in-claude-code-without-sending",
    title: "How to type a new line in Claude Code without sending the prompt",
    metaTitle: "New line in Claude Code without sending: Shift+Enter, Ctrl+J",
    description:
      "Enter sends. Ctrl+J and backslash-Enter add a line in any terminal; Shift+Enter depends on the terminal — where it works, where /terminal-setup fixes it.",
    summary:
      "Ctrl+J works everywhere. Where Shift+Enter works out of the box, where /terminal-setup fixes it, and where it never will.",
    blocks: [
      {
        kind: "p",
        text: "You are writing a prompt in Claude Code, press Enter to start a new paragraph, and it sends half a thought. Enter submits. Two keys add a line instead in every terminal, and a third — Shift+Enter, the one most people reach for — depends on which terminal you are in.",
      },
      { kind: "h2", text: "The two that work everywhere" },
      {
        kind: "list",
        items: [
          "Ctrl+J inserts a new line, in any terminal, with no setup.",
          "Type a backslash, then press Enter. Claude Code takes \\ followed by Enter as a line break rather than a submit.",
        ],
      },
      {
        kind: "p",
        text: "Both come from [Claude Code's terminal docs](https://code.claude.com/docs/en/terminal-config), which say they \"work in every terminal with no setup\". Pasting a multi-line block keeps its line breaks too ([interactive mode](https://code.claude.com/docs/en/interactive-mode)).",
      },
      { kind: "h2", text: "Shift+Enter, terminal by terminal" },
      {
        kind: "p",
        text: "Whether Shift+Enter adds a line depends on the terminal, not on Claude Code. Anthropic's docs sort terminals into three groups:",
      },
      {
        kind: "list",
        items: [
          "Works with no setup: [Ghostty](/vs/ghostty), [kitty](/vs/kitty), iTerm2, [WezTerm](/vs/wezterm), [Warp](/vs/warp), Apple Terminal and [Windows Terminal](/vs/windows-terminal).",
          "Works after running /terminal-setup once: VS Code, Cursor, Devin Desktop, [Alacritty](/vs/alacritty) and Zed.",
          "Not available: gnome-terminal, and JetBrains IDEs such as PyCharm and Android Studio. Use Ctrl+J or \\ then Enter there.",
        ],
      },
      { kind: "h2", text: "What /terminal-setup changes" },
      {
        kind: "p",
        text: "In VS Code, Cursor, Devin Desktop, Alacritty and Zed, /terminal-setup writes a Shift+Enter keybinding into that terminal's own configuration file. Existing bindings are left in place: a message saying the binding is already configured means nothing was changed. In VS Code, Cursor and Devin Desktop it also changes two editor settings — it turns the integrated terminal's GPU acceleration off and sets its mouse-wheel scroll sensitivity — so it is worth knowing before you run it.",
      },
      {
        kind: "note",
        text: "Run /terminal-setup in the terminal itself, not inside tmux or screen. It needs to write to the host terminal's configuration, which it cannot reach from inside a multiplexer.",
      },
      { kind: "h2", text: "Inside tmux" },
      {
        kind: "p",
        text: "tmux needs its own configuration before Shift+Enter gets through, even when the terminal around it supports it. Anthropic's docs give three lines:",
      },
      {
        kind: "code",
        lines: [
          "# ~/.tmux.conf",
          "set -g allow-passthrough on",
          "set -s extended-keys on",
          "set -as terminal-features 'xterm*:extkeys'",
        ],
      },
      { kind: "h2", text: "On macOS: Option+Enter" },
      {
        kind: "p",
        text: "Option+Enter also inserts a new line, but most macOS terminals do not send Option as a modifier by default, so it does nothing until you turn on Option as Meta in the terminal's settings. In VS Code that is \"terminal.integrated.macOptionIsMeta\": true. In JetBrains IDEs, the Claude Code plugin has its own setting for Option+Enter ([JetBrains docs](https://code.claude.com/docs/en/jetbrains)).",
      },
      { kind: "h2", text: "If it still sends" },
      {
        kind: "list",
        items: [
          "Update Claude Code first. Its [changelog](https://code.claude.com/docs/en/changelog) records fixes for Shift+Enter submitting on Windows Terminal Preview 1.25 (v2.1.89) and for Shift+Enter printing stray characters in Ghostty over SSH (v2.1.69).",
          "Would rather Enter added a line and Shift+Enter sent? Map the chat:newline and chat:submit actions in Claude Code's keybindings file ([keybindings docs](https://code.claude.com/docs/en/keybindings)).",
          "In Vim mode, Enter still submits from INSERT mode. Use o or O in NORMAL mode, or Ctrl+J.",
        ],
      },
      { kind: "h2", text: "Where CPT fits" },
      {
        kind: "p",
        text: "In Cross Platform Terminal, Shift+Enter inserts a new line instead of submitting, on Linux and Windows alike, with nothing to configure. That is not a reason to switch on its own: on Windows, Windows Terminal already does it, and Ctrl+J costs nothing anywhere. CPT is worth a look if you also want one terminal that behaves the same on both systems, or live status for several agents at once — see [seeing what your coding agent is doing](/guides/see-what-your-coding-agent-is-doing-in-the-terminal).",
      },
      {
        kind: "note",
        text: "CPT is a paid subscription with no free tier and no trial, and there is no macOS build yet. For this problem alone, Ctrl+J is the answer.",
      },
      { kind: "h2", text: "Which to use" },
      {
        kind: "list",
        items: [
          "Any terminal, right now: Ctrl+J, or \\ then Enter.",
          "Ghostty, kitty, iTerm2, WezTerm, Warp, Apple Terminal or Windows Terminal: Shift+Enter already works.",
          "VS Code, Cursor, Alacritty or Zed: run /terminal-setup once, outside tmux.",
          "Inside tmux: add the three lines above.",
          "gnome-terminal or a JetBrains IDE: Ctrl+J.",
        ],
      },
    ],
    related: [
      "get-notified-when-claude-code-needs-input",
      "see-what-your-coding-agent-is-doing-in-the-terminal",
    ],
  },
];

export function guideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
