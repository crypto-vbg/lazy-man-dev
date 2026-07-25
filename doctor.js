#!/usr/bin/env node
// lazy-man-dev — readiness check.
//
// Answers one question: will lazy-man-dev run at full capacity right now?
// Every failure prints the command that fixes it. Exit 1 on any [fail].

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SKILLS = ['foreman', 'reuse-census', 'lean-review', 'verifying-work', 'shipping'];
const REFS = ['ladder.md', 'routes.md', 'memory.md'];

const project = process.argv.includes('--project');
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const skillsRoot = project
  ? path.join(process.cwd(), '.claude', 'skills')
  : path.join(claudeDir, 'skills');
const settingsPath = path.join(claudeDir, 'settings.json');

let fails = 0, warns = 0;
const line = (flag, msg, fix) => {
  const tag = { ok: '[ ok ]', warn: '[warn]', fail: '[FAIL]' }[flag];
  console.log(`${tag} ${msg}`);
  if (fix && flag !== 'ok') console.log(`       → ${fix}`);
  if (flag === 'fail') fails++;
  if (flag === 'warn') warns++;
};

// Minimal frontmatter reader: `key: value` plus folded `key: >` blocks.
// Enough for the three fields we validate; a YAML dependency would not be.
function frontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  const out = {};
  const lines = m[1].split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!kv) continue;
    let [, key, val] = kv;
    if (val === '>' || val === '|') {
      const buf = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) buf.push(lines[++i].trim());
      val = buf.join(' ');
    }
    out[key] = val.trim();
  }
  return out;
}

const has = (cmd, args) => {
  try { execFileSync(cmd, args, { stdio: 'pipe' }); return true; } catch { return false; }
};

console.log(`\nlazy-man-dev doctor\nskills root: ${skillsRoot}\n`);

// --- 1. Runtime -------------------------------------------------------------
const major = Number(process.versions.node.split('.')[0]);
major >= 14
  ? line('ok', `node ${process.version}`)
  : line('fail', `node ${process.version} is too old`, 'install Node 14 or newer — the hook needs it');

// --- 2. Skills are installed and well-formed --------------------------------
if (!fs.existsSync(skillsRoot)) {
  line('fail', `skills root missing: ${skillsRoot}`, 'node install.js');
} else {
  for (const name of SKILLS) {
    const md = path.join(skillsRoot, name, 'SKILL.md');
    if (!fs.existsSync(md)) {
      line('fail', `${name} is not installed`, 'node install.js');
      continue;
    }
    const fm = frontmatter(fs.readFileSync(md, 'utf8'));
    if (!fm) { line('fail', `${name}: no YAML frontmatter`, 'the SKILL.md is corrupt — reinstall'); continue; }
    if (fm.name !== name) {
      line('fail', `${name}: frontmatter name is "${fm.name}"`, `it must match the directory name`);
    } else if (!fm.description) {
      line('fail', `${name}: empty description`, 'a skill with no description can never be discovered');
    } else if (fm.description.length > 1024) {
      line('fail', `${name}: description is ${fm.description.length} chars`, 'the hard limit is 1024');
    } else {
      line('ok', `${name}`);
    }
  }

  // --- 3. The git guardrail, checked structurally ---------------------------
  const shipMd = path.join(skillsRoot, 'shipping', 'SKILL.md');
  if (fs.existsSync(shipMd)) {
    const fm = frontmatter(fs.readFileSync(shipMd, 'utf8')) || {};
    fm['disable-model-invocation'] === 'true'
      ? line('ok', 'git guardrail: shipping is user-invoked only')
      : line('fail', 'shipping is model-invocable — the git guardrail is OPEN',
             'set `disable-model-invocation: true` in skills/shipping/SKILL.md, or an agent can ship on its own');
  }

  // --- 4. Reference files foreman points at ---------------------------------
  for (const ref of REFS) {
    const p = path.join(skillsRoot, 'foreman', 'references', ref);
    fs.existsSync(p)
      ? line('ok', `reference: ${ref}`)
      : line('fail', `reference missing: ${ref}`, 'foreman links to it and will run degraded — reinstall');
  }
}

// --- 5. The hook: wired, runnable, and carrying the guardrail ---------------
let hookCmd = null;
if (!fs.existsSync(settingsPath)) {
  line('warn', 'no settings.json — sub-agents will not inherit the ladder',
       'node install.js   (or pass --no-hook to accept this)');
} else {
  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    line('fail', `settings.json is not valid JSON: ${e.message}`, `fix ${settingsPath} by hand`);
  }
  const entries = settings.hooks && settings.hooks.SubagentStart;
  const found = JSON.stringify(entries || '').match(/"[^"]*foreman-subagent\.js[^"]*"/);
  if (!found) {
    line('warn', 'SubagentStart hook not wired — sub-agents will not inherit the ladder',
         'node install.js');
  } else {
    hookCmd = found[0];
    const hookFile = (hookCmd.match(/[A-Za-z]:[\\/][^"]*foreman-subagent\.js|\/[^"]*foreman-subagent\.js/) || [])[0];
    if (hookFile && !fs.existsSync(hookFile.replace(/\\\\/g, '\\'))) {
      line('fail', 'the wired hook path does not exist', `settings.json points at ${hookFile} — re-run node install.js`);
    } else {
      line('ok', 'SubagentStart hook wired');
    }
  }
}

const localHook = path.join(__dirname, 'hooks', 'foreman-subagent.js');
if (fs.existsSync(localHook)) {
  try {
    const out = execFileSync(process.execPath, [localHook], { encoding: 'utf8' });
    const ctx = JSON.parse(out).hookSpecificOutput.additionalContext;
    /Never run `git commit`/.test(ctx)
      ? line('ok', `hook emits the ladder (${ctx.length} chars, git guardrail present)`)
      : line('fail', 'the hook runs but its payload has no git guardrail',
             'skills/foreman/references/ladder.md lost its "Git history is the user\'s" section');
  } catch (e) {
    line('fail', `the hook does not run: ${e.message.split('\n')[0]}`, 'sub-agents will silently build unconstrained');
  }
}

// --- 6. What shipping needs -------------------------------------------------
has('git', ['--version'])
  ? line('ok', 'git')
  : line('fail', 'git not found', 'shipping cannot run without it');

if (!has('gh', ['--version'])) {
  line('warn', 'GitHub CLI (gh) not found — /shipping cannot open issues or PRs',
       'winget install GitHub.cli   (macOS: brew install gh)   then: gh auth login');
} else if (!has('gh', ['auth', 'status'])) {
  line('warn', 'gh is installed but not authenticated', 'gh auth login');
} else {
  line('ok', 'gh authenticated');
}

// --- Verdict ----------------------------------------------------------------
console.log();
if (fails) {
  console.log(`NOT READY — ${fails} blocking issue${fails > 1 ? 's' : ''}, ${warns} warning${warns === 1 ? '' : 's'}.`);
  console.log('Fix the [FAIL] lines above; each one degrades lazy-man-dev below full capacity.\n');
  process.exit(1);
}
console.log(warns
  ? `READY, degraded — ${warns} warning${warns > 1 ? 's' : ''}. Core skills work; the flagged parts do not.\n`
  : 'READY — full capacity.\n');
