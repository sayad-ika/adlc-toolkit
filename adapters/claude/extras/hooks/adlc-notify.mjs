#!/usr/bin/env node
// ADLC gate notification hook for Claude Code.
//
// Wire it to the Notification (and optionally Stop) hook events — see
// ../README.md. When Claude pauses and a gate marker (.awaiting-approval)
// exists, this emits a terminal notification sequence (OSC 9) so your
// terminal — Windows Terminal, iTerm2, WezTerm, Ghostty and others — shows a
// desktop toast: "ADLC gate ready: REQ-014 (review)". Silent otherwise, and
// silent on any error.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';

const PHASE = { 1: 'spec', 2: 'architect', 3: 'implement', 4: 'review', 5: 'wrap up' };

function findVault(start) {
  let dir = start;
  for (let i = 0; i < 6; i++) {
    if (existsSync(join(dir, '.adlc'))) return join(dir, '.adlc');
    const up = dirname(dir);
    if (up === dir) break;
    dir = up;
  }
  return null;
}

try {
  let input = '';
  try { input = readFileSync(0, 'utf8'); } catch {}
  let payload = {};
  try { payload = JSON.parse(input); } catch {}
  const cwd = payload?.cwd || payload?.workspace?.current_dir || process.cwd();
  const vault = findVault(cwd);
  if (!vault) process.exit(0);
  const waiting = [];
  for (const kind of ['specs', 'bugs']) {
    const root = join(vault, kind);
    if (!existsSync(root)) continue;
    for (const e of readdirSync(root, { withFileTypes: true })) {
      if (!e.isDirectory()) continue;
      if (!existsSync(join(root, e.name, '.awaiting-approval'))) continue;
      let phase = '';
      try {
        const st = JSON.parse(readFileSync(join(root, e.name, 'pipeline-state.json'), 'utf8'));
        phase = PHASE[st.currentPhase] ? ` (${PHASE[st.currentPhase]})` : '';
      } catch {}
      waiting.push(`${e.name}${phase}`);
    }
  }
  if (waiting.length === 0) process.exit(0);
  const msg =
    waiting.length === 1
      ? `ADLC gate ready: ${waiting[0]}`
      : `ADLC: ${waiting.length} gates waiting (${waiting[0]}, …)`;
  // OSC 9 desktop-notification sequence, returned the way the hooks API
  // expects. If your Claude Code version predates terminalSequence support,
  // see README for the plain-command fallback.
  process.stdout.write(JSON.stringify({ terminalSequence: `\x1b]9;${msg}\x07` }));
} catch {
  process.exit(0);
}
