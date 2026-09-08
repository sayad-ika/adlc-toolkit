# Claude Code extras — statusline, gate notifications, vault budgets

Three optional scripts for Claude Code users. None touches the pipeline's
protocol: skip them and nothing changes. All read your `.adlc/` folder and stay
silent when there is nothing to say.

## What you get

- **Statusline** — a persistent line at the bottom of your terminal:
  `ADLC REQ-014-payment-retries · phase 3 (implement) · GATE WAITING`.
  Your pipeline state stops living only in scrollback. Costs zero tokens.
- **Gate notification** — a desktop toast when the pipeline pauses at a gate,
  so you can look away during long phases: `ADLC gate ready: REQ-014 (review)`.
- **Vault budgets** — the vault's size budgets become refusals instead of
  `/analyze` findings. A write that leaves `now.md` over 1KB is bounced back
  with the fix; a `Read` of a generated file the review packet excludes is
  denied; a reviewer whose `review-log.md` section passes 12KB is told to trim
  before it stops; every session starts with a one-line budget strip. This is
  the only mechanism in the toolkit that makes a budget a guarantee — the skills
  say the same things in prose, and prose drifted for two months on a measured
  vault (`now.md` at 68KB, `hot.md` at 3,800 lines).

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

**Vault budgets** (four events, one script — each case is a no-op unless its
event matches):

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [ { "type": "command", "command": "node <toolkit>/adapters/claude/extras/hooks/adlc-budget.mjs" } ] }
    ],
    "PreToolUse": [
      { "matcher": "Read",
        "hooks": [ { "type": "command", "command": "node <toolkit>/adapters/claude/extras/hooks/adlc-budget.mjs" } ] }
    ],
    "PostToolUse": [
      { "matcher": "Write|Edit|MultiEdit",
        "hooks": [ { "type": "command", "command": "node <toolkit>/adapters/claude/extras/hooks/adlc-budget.mjs" } ] }
    ],
    "SubagentStop": [
      { "hooks": [ { "type": "command", "command": "node <toolkit>/adapters/claude/extras/hooks/adlc-budget.mjs" } ] }
    ]
  }
}
```

What it enforces, and what it only warns about:

| Event | File | Budget | Action |
|---|---|---|---|
| PostToolUse | `now.md` | 1KB | **block** (exit 2) — move narrative to `sprints/` or the REQ folder |
| PostToolUse | `CLAUDE.md` | 5KB | **block** |
| PostToolUse | `context/*.md` (not `*-rationale.md`) | 8KB | **block** — `/config budgets` splits rulebook from rationale |
| PostToolUse | `hot.md` | 500 lines | warn — `/wrapup` rotates |
| PostToolUse | any `verification.md` | 8KB | warn — narrative belongs in `review-log.md` |
| PreToolUse | files matching `config.yml → review.packet.exclude` | — | **deny** the Read |
| PreToolUse | `hot.md` without a `limit` | — | **deny** — read the top N, never the whole file |
| SubagentStop | a `review-log.md` section touched in the last 15 min | 12KB | **block** the stop until trimmed |
| SessionStart | all of the above | — | one-line strip, `⚠` on anything over |

Budgets are hard-coded to the vault README's table; if you change one there,
change it here. The hook parses `review.packet.exclude` from `config.yml`
itself (no YAML library) — keep that block in the template's shape: `review:` →
`packet:` → `exclude:` → `- "glob"`.

The toast uses the OSC 9 terminal sequence — supported by Windows Terminal,
iTerm2, WezTerm, Ghostty, and others. If your terminal ignores it, the hook
just does nothing. Hook and statusline schemas evolve; if something doesn't
take, check the current Claude Code docs for `statusline` and `hooks` and
adjust the snippet — the scripts themselves only read stdin JSON and print.

## Notes

- Other tools (Cursor, Copilot, Codex, Gemini) have no equivalent hook
  surface — these extras are Claude-only, and the pipeline works the same
  without them.
- All three scripts fail silent by design: a broken statusline is worse than no
  statusline, and a budget hook that crashes must never block a write it
  couldn't measure.
- They are regenerated into `adapters/claude/extras/` by the build from
  `core/extras/claude/` — edit them there (or override via `local/`).
