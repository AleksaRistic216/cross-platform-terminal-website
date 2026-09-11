# Start here — marketing, step by step

Updated 2026-09-11. Written for someone who does not code. Do the steps in order. Every text you
need is in a grey box: copy it exactly, and change only what is marked **[like this]**.

Anything technical — files, code, the website itself — you can hand to Claude. Just ask in plain
words, e.g. *"merge the website update"*.

---

## Words you will see

| Word | What it means |
|---|---|
| **HN** / **Hacker News** | A website, <https://news.ycombinator.com>, where programmers share links and discuss them. Very influential with developers, hostile to advertising. |
| **Reddit** | A huge forum site split into topic communities. |
| **Subreddit** (r/something) | One community on Reddit, e.g. r/commandline. Each has its own rules in its sidebar. |
| **Karma** | Points your account earns when people upvote you. Many subreddits block accounts with none. |
| **Thread** | One post plus all the replies under it. |
| **Reply** | What you will write — an answer under someone else's question. |

---

## The two rules behind everything

1. **Say who you are, in the first line, every time:** *"I'm part of the CPT team, so take this
   with salt."* Pretending to be an ordinary happy customer is the one thing that gets your
   accounts banned and the website marked as spam everywhere — permanently.
2. **Only say what you actually know.** You are not a developer, so never post about "my coding
   setup" or "what works for me when I program". What you *can* say honestly is what CPT does, what
   it costs, and what the free alternatives are.

---

## This week

### Step 1 — Website update ✅ done

Nothing to do. These pages went live on 11 September:

- [CPT compared with Wave Terminal](https://www.crossplatformterminal.com/vs/wave)
- [How to get notified when Claude Code needs you](https://www.crossplatformterminal.com/guides/get-notified-when-claude-code-needs-input)
- [tmux alternatives on Windows](https://www.crossplatformterminal.com/guides/tmux-alternatives-on-windows)
  — corrected: it now recommends two free tools that newly work on Windows

Pages like these are how people find CPT through Google. They take a few months to start
bringing visitors, so do not expect anything from them yet.

### Step 2 — Make a Reddit account and connect it (10 minutes)

Reddit is where most people ask the questions CPT answers. Connecting it lets the Monday search
find those questions for you.

1. Make an account at <https://www.reddit.com>. Use a personal-sounding name, not "CPT_official" —
   Reddit distrusts brand accounts.
2. While logged in, open <https://www.reddit.com/prefs/apps>, scroll down, and click
   **create another app…** (or **create an app**).
3. Fill in:
   - **name:** `cpt-mention-watch`
   - type: select **script**
   - **redirect uri:** `http://localhost:8080` (Reddit requires something here; it is never used)
4. Click **create app**. You will see two codes:
   - a short code under the words "personal use script" — the **client ID**
   - a longer code next to **secret** — the **client secret**

   If Reddit shows a form asking you to *request* access instead, fill it in and describe it as:
   "A personal, read-only script that searches public posts. It never posts anything."
5. Send both codes to Claude and say **"save my Reddit keys"**. Claude puts them in a private file
   that is never uploaded anywhere.

**A new Reddit account needs warming up.** For the first two or three weeks, only answer questions
you genuinely know the answer to and do not mention CPT. After that, keep CPT to about one mention
for every five helpful replies.

### Step 3 — Make a Hacker News account (3 minutes)

Nothing to post there yet; the account just needs to exist and get a little older.

1. Go to <https://news.ycombinator.com/login>.
2. Under **Create Account**, pick a username and password. No email needed.

### About the two HN threads from earlier today — skip both

Both were people asking developers about their own coding habits ("how do you use multiple
sessions", "what's your AI coding setup"). Answering them honestly needs someone who codes, so the
right move is to leave them. Nothing is lost.

---

## Which threads you *can* answer

The good ones for you look like this: someone asks **"is there a tool that does X?"**, and X is
something CPT genuinely does — for example:

- "Is there a terminal that works the same on Windows and Linux?"
- "Can I keep my terminal sessions running after I close the app, on Windows?"
- "Is there a way to see which of my Claude Code sessions needs me?"

Every Monday, Claude finds these and drafts the reply for you (see the end of this file). Each
reply follows the same shape — this is only to show you what one looks like:

```
I'm part of the CPT team, so take this with salt.

[The free options that answer their question, first — Claude fills this in.]

If you need [the thing they asked for] on both Windows and Linux, that is what CPT does. It's a paid subscription with no trial, and there's no macOS version yet, so try the free options first.
```

Skip any thread where the person asked for something **free** — CPT is paid, so it is not an answer
for them.

---

## If anyone replies to you

You will get replies, sometimes rude ones. The rules:

- Reply **at most once** to the same person in a thread.
- Never argue about the price. `That's fair, it's not for everyone.` ends it.
- Never delete a comment, and never change one after someone has replied to it.
- If you are not sure of an answer, write `Good question, let me check with the team.` — then ask
  Claude, and come back with the answer.
- Not replying is always allowed.

Ready answers for the questions that always come up:

**"Why pay when Ghostty / kitty / Alacritty is free?"**
```
Fair question. If you use one computer system and don't run AI coding tools all day, they're the better choice, and we'd genuinely point you at Ghostty or kitty. CPT is for people who work on Windows part of the week and Linux the rest and want it to behave the same on both, plus live status for AI coding tools in each pane. If that's not your problem, it's not worth €7.49 to you.
```

**"Crypto only? That's sketchy."**
```
Understandable reaction. The honest version: crypto can't be charged automatically, so there's no stored card and nothing renews on its own. Every month or year is bought deliberately, and a subscription ends simply by not renewing it. The downside is real too: no refunds, because crypto payments can't be reversed.
```

**"No trial?"**
```
That's the fairest criticism. What we can offer instead: the downloads are public so you can see exactly what you'd get, every release is dated on the changelog so you can see how often it improves, and reported bugs usually get fixed the same day. A trial is on the list.
```

**"No macOS?"**
```
Not yet. Linux and Windows today; macOS is in progress, and we'd rather not give a date we're not sure of.
```

**"Closed source? For a terminal?"**
```
Yes, and it's a fair thing to weigh. The alternatives are open source. What we can say is that the release history is public and dated, the downloads don't need an account, and bugs are usually fixed the same day they're reported. If open source is a must, kitty and WezTerm are excellent.
```

**Anything technical you don't understand**
```
Good question, let me check with the team and come back to you.
```

---

## Social media posts (optional, lowest priority)

CPT has no accounts on X, Bluesky, Mastodon or LinkedIn yet, and posting to an account nobody
follows reaches almost nobody. **Skip this until the steps above are done.** If you start one,
start with **Bluesky** (<https://bsky.app>, free) and name it after the product — this account *is*
the product speaking, so it does not need the "I'm part of the team" line.

This week's post, ready to paste:

```
This week in CPT: 16 releases.
• Shells that outlive the app window (opt-in)
• Search the scrollback
• Side-by-side and smart layouts
• A light mode
https://www.crossplatformterminal.com/changelog
```

---

## Every Monday after this (about 20 minutes)

1. Open Claude Code in this project and type **`/marketing`**.
2. Claude searches Reddit and HN for people asking questions CPT can help with, and tells you which
   threads are worth answering. It writes the replies for you.
3. You open each thread, read it, and post the reply **yourself**, from your own account.
4. Claude also makes **one new piece every week**, even when no threads turn up: a new guide on the
   website, an article to repost on dev.to, or a directory listing. The list of what's done and
   what's next is in `marketing/content-pipeline.md`. Tell Claude what you posted so that list
   stays true.

Claude writes; **you** post. Nothing here posts for you, on purpose.

---

## Never

- A second account to agree with yourself, or asking friends to upvote. This gets the whole website
  banned.
- Posting as if you were just a customer. Always the "I'm part of the CPT team" line.
- Claiming something CPT does not do, or saying "soon" about macOS.
- Launching on HN ("Show HN") or Product Hunt yet. You get one chance at each — wait until the
  trial and macOS decisions are made.
