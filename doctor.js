#!/usr/bin/env node
// lazy-man-dev — readiness check.
//
// Answers one question: will lazy-man-dev run at full capacity right now?
// Every failure prints the command that fixes it. Exit 1 on any [fail].

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SKILLS = ['foreman', 'reuse-census', 'lean-review', 'verifying-work', 'researching', 'shipping'];
const REFS = ['ladder.md', 'routes.md', 'memory.md', 'asking.md'];

const project = process.argv.includes('--project');
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const skillsRoot = project
  ? path.join(process.cwd(), '.claude', 'skills')
  : path.join(claudeDir, 'skills');
const settingsPath = path.join(claudeDir, 'settings.json');

// Two questions, deliberately kept apart.
//
// PAYLOAD — are the skills themselves sound? Always read from beside this file.
// That is the source clone when you run doctor from a checkout, and the cached
// copy when Claude Code installed the plugin, so it is right either way.
//
// DELIVERY — can Claude Code actually reach them? Two independent channels, and
// a machine may legitimately have either. Checking payload at the delivery
// address is what would make a plugin install look like six missing skills.
const payloadRoot = path.join(__dirname, 'skills');
const manifestPath = path.join(__dirname, '.claude-plugin', 'plugin.json');
const pluginHooksPath = path.join(__dirname, 'hooks', 'hooks.json');

let fails = 0, warns = 0;
const line = (flag, msg, fix) => {
  const tag = { ok: '[ ok ]', warn: '[warn]', fail: '[FAIL]', info: '[info]' }[flag];
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

// `claude` is a .cmd shim on Windows, which execFile cannot spawn without a
// shell. The command is a literal — no args array, which Node deprecates here.
const run = (cmd) => {
  try {
    return execFileSync(cmd, { encoding: 'utf8', stdio: 'pipe', shell: true });
  } catch { return null; }
};

console.log(`\nlazy-man-dev doctor\npayload: ${payloadRoot}\n`);

// --- 1. Runtime -------------------------------------------------------------
const major = Number(process.versions.node.split('.')[0]);
major >= 14
  ? line('ok', `node ${process.version}`)
  : line('fail', `node ${process.version} is too old`, 'install Node 14 or newer — the hook needs it');

// --- 2. Skills are present and well-formed ----------------------------------
if (!fs.existsSync(payloadRoot)) {
  line('fail', `skills missing: ${payloadRoot}`, 'this checkout is incomplete — re-clone, or reinstall the plugin');
} else {
  for (const name of SKILLS) {
    const md = path.join(payloadRoot, name, 'SKILL.md');
    if (!fs.existsSync(md)) {
      line('fail', `${name} is missing`, 'this checkout is incomplete — re-clone, or reinstall the plugin');
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
  const shipMd = path.join(payloadRoot, 'shipping', 'SKILL.md');
  if (fs.existsSync(shipMd)) {
    const fm = frontmatter(fs.readFileSync(shipMd, 'utf8')) || {};
    fm['disable-model-invocation'] === 'true'
      ? line('ok', 'git guardrail: shipping is user-invoked only')
      : line('fail', 'shipping is model-invocable — the git guardrail is OPEN',
             'set `disable-model-invocation: true` in skills/shipping/SKILL.md, or an agent can ship on its own');
  }

  // --- 4. Reference files foreman points at ---------------------------------
  for (const ref of REFS) {
    const p = path.join(payloadRoot, 'foreman', 'references', ref);
    fs.existsSync(p)
      ? line('ok', `reference: ${ref}`)
      : line('fail', `reference missing: ${ref}`, 'foreman links to it and will run degraded — reinstall');
  }
}

// --- 5. Delivery: can Claude Code reach any of this? ------------------------
// Either channel alone is a complete install. Only having neither is a failure,
// so a plugin user is never told to run install.js and vice versa.
let delivered = 0;

// Channel B runs first only so channel A knows whether an uninstalled plugin is
// worth mentioning. On a machine already wired the classic way it is not: the
// files sitting in the checkout are the source, not a second install to make.
let classic = false;
if (fs.existsSync(path.join(skillsRoot, 'foreman', 'SKILL.md'))) {
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8').replace(/^﻿/, ''));
    } catch (e) {
      line('fail', `settings.json is not valid JSON: ${e.message}`, `fix ${settingsPath} by hand`);
    }
  }
  const entries = settings.hooks && settings.hooks.SubagentStart;
  const found = JSON.stringify(entries || '').match(/"[^"]*foreman-subagent\.js[^"]*"/);
  if (!found) {
    line('warn', `skills at ${skillsRoot} but no SubagentStart hook — sub-agents will not inherit the ladder`,
         'node install.js');
  } else {
    const hookFile = (found[0].match(/[A-Za-z]:[\\/][^"]*foreman-subagent\.js|\/[^"]*foreman-subagent\.js/) || [])[0];
    if (hookFile && !fs.existsSync(hookFile.replace(/\\\\/g, '\\'))) {
      line('fail', 'the wired hook path does not exist', `settings.json points at ${hookFile} — re-run node install.js`);
    } else {
      line('ok', `classic install wired (${skillsRoot})`);
    }
  }
  classic = true;
  delivered++;
}

// Channel A — plugin. The manifest and hooks.json travel with the plugin, so
// nothing in the user's settings.json has to be true for this to work.
if (fs.existsSync(manifestPath)) {
  let manifest = null;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8').replace(/^﻿/, ''));
  } catch (e) {
    line('fail', `.claude-plugin/plugin.json is not valid JSON: ${e.message}`, 'fix it — the plugin cannot load at all');
  }
  if (manifest) {
    let hooksOk = false;
    if (!fs.existsSync(pluginHooksPath)) {
      line('fail', 'plugin ships no hooks/hooks.json — sub-agents would build ladder-blind',
           'restore hooks/hooks.json; a plugin cannot read hooks/settings-snippet.json');
    } else {
      try {
        const h = JSON.parse(fs.readFileSync(pluginHooksPath, 'utf8').replace(/^﻿/, ''));
        const sub = JSON.stringify((h.hooks && h.hooks.SubagentStart) || '');
        if (!sub.includes('foreman-subagent.js')) {
          line('fail', 'hooks/hooks.json has no SubagentStart entry for foreman-subagent.js',
               'sub-agents would inherit nothing');
        } else if (!sub.includes('CLAUDE_PLUGIN_ROOT')) {
          line('fail', 'hooks/hooks.json uses an absolute path',
               'a plugin is copied to a cache dir — the command must use ${CLAUDE_PLUGIN_ROOT}');
        } else if (!sub.includes('commandWindows')) {
          line('warn', 'hooks/hooks.json has no commandWindows guard',
               'on a Windows box without node on PATH the hook errors on every sub-agent spawn');
          hooksOk = true;
        } else {
          hooksOk = true;
        }
      } catch (e) {
        line('fail', `hooks/hooks.json is not valid JSON: ${e.message}`, 'fix it — the plugin hook will not load');
      }
    }

    if (hooksOk) {
      // Payload is sound; the remaining question is whether this machine
      // enabled it. `claude` may not be on PATH, and that is not a failure.
      const list = run('claude plugin list');
      if (/lazy-man-dev/.test(list || '')) {
        line('ok', 'plugin installed, hook ships with it');
        delivered++;
      } else if (list === null && !classic) {
        // Cannot prove it either way. Counting it as delivered keeps doctor from
        // failing a working plugin install just because `claude` is not on PATH.
        line('info', 'plugin payload is valid (claude CLI not on PATH — enablement unverified)');
        console.log('       confirm inside Claude Code with: /plugin');
        delivered++;
      } else if (classic) {
        line('ok', 'plugin payload is valid (not installed — this machine uses the classic install)');
      }

      // The marketplace file is what `/plugin marketplace add` reads. It is
      // never consulted after install, so a broken one fails silently for every
      // new user and for nobody who already has it.
      const mkt = path.join(__dirname, '.claude-plugin', 'marketplace.json');
      if (!fs.existsSync(mkt)) {
        line('warn', 'no .claude-plugin/marketplace.json — nobody can add this repo as a marketplace',
             'only affects distribution; an installed plugin keeps working');
      } else {
        try {
          const m = JSON.parse(fs.readFileSync(mkt, 'utf8').replace(/^﻿/, ''));
          const entry = (m.plugins || []).find(p => p.name === manifest.name);
          if (!m.name || !m.owner || !Array.isArray(m.plugins)) {
            line('fail', 'marketplace.json is missing name, owner, or plugins', 'all three are required');
          } else if (!entry) {
            line('fail', `marketplace.json lists no plugin named "${manifest.name}"`,
                 `the entry name is what users install — it must match plugin.json`);
          } else {
            line('ok', `marketplace: /plugin install ${entry.name}@${m.name}`);
          }
        } catch (e) {
          line('fail', `marketplace.json is not valid JSON: ${e.message}`, 'no one can add the marketplace');
        }
      }
      // Else a bare clone: files right, nothing consuming them. Left to the
      // delivery verdict below, so one condition does not report twice.
    }
  }
}

if (!delivered) {
  line('fail', 'nothing delivers these skills to Claude Code — it cannot see them');
  console.log('       → /plugin marketplace add crypto-vbg/lazy-man-dev');
  console.log('         /plugin install lazy-man-dev@lazy-man-dev');
  console.log('       → or the classic install: node install.js');
} else if (delivered > 1) {
  // Both channels load the same six names. Claude Code then has two skills
  // called foreman, and which one answers is not something you control.
  line('warn', 'installed twice — plugin AND classic; the six skills are defined twice',
       'keep one: node install.js --uninstall   (or) /plugin uninstall lazy-man-dev');
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
  line('warn', 'GitHub CLI (gh) not found — the shipping skill cannot open issues or PRs',
       'winget install GitHub.cli   (macOS: brew install gh)   then: gh auth login');
} else if (!has('gh', ['auth', 'status'])) {
  line('warn', 'gh is installed but not authenticated', 'gh auth login');
} else {
  line('ok', 'gh authenticated');
}

// --- 7. Optional integrations are optional ----------------------------------
// Not a check. It exists because the routes table reads like a dependency list
// and people install five packs they never needed.
line('info', `nothing else to install — every route runs on these ${SKILLS.length} skills alone`);
console.log('       mattpocock/skills and ponytail are optional; foreman detects');
console.log('       them at runtime and delegates only if they are already there.');

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
