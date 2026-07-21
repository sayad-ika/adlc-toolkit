# Claude Code extras — statusline + gate notifications

Two optional quality-of-life scripts for Claude Code users. Neither touches
the pipeline: skip them and nothing changes. Both read your `.adlc/` folder
and stay silent when there is nothing to say.

## What you get

- **Statusline** — a persistent line at the bottom of your terminal:
  `ADLC REQ-014-payment-retries · phase 3 (implement) · GATE WAITING`.
  Your pipeline state stops living only in scrollback. Costs zero tokens.
- **Gate notification** — a desktop toast when the pipeline pauses at a gate,
  so you can look away during long phases: `ADLC gate ready: REQ-014 (review)`.

## Setup

Both are wired in your Claude Code `settings.json` (usually
`~/.claude/settings.json`). Replace `<toolkit>` with the toolkit's absolute
path (the same path your installed skills point at).

**Statusline:**

```json
{
  "statusLine": {
    "type": "command",
    "command": "node <toolkit>/adapters/claude/extras/statusline/adlc-statusline.mjs"
  }
}
```

**Gate notification** (fires on Claude Code's `Notification` event — when
Claude pauses for input — and checks whether an ADLC gate is what's waiting):

```json
{
  "hooks": {
    "Notification": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "node <toolkit>/adapters/claude/extras/hooks/adlc-notify.mjs"
          }
        ]
      }
    ]
  }
}
```

The toast uses the OSC 9 terminal sequence — supported by Windows Terminal,
iTerm2, WezTerm, Ghostty, and others. If your terminal ignores it, the hook
just does nothing. Hook and statusline schemas evolve; if something doesn't
take, check the current Claude Code docs for `statusline` and `hooks` and
adjust the snippet — the scripts themselves only read stdin JSON and print.

## Notes

- Other tools (Cursor, Copilot, Codex, Gemini) have no equivalent hook
  surface — these extras are Claude-only, and the pipeline works the same
  without them.
- Both scripts fail silent by design: a broken statusline is worse than no
  statusline.
- They are regenerated into `adapters/claude/extras/` by the build from
  `core/extras/claude/` — edit them there (or override via `local/`).
