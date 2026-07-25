#!/usr/bin/env node
// lazy-man-dev — installer.
//
//   node install.js              link skills into ~/.claude/skills, wire the hook, run doctor
//   node install.js --project    install into ./.claude/skills instead
//   node install.js --copy       copy instead of link (edits then need a re-run)
//   node install.js --no-hook    skip settings.json entirely
//   node install.js --uninstall  remove the skills and the hook
//   node install.js --dry-run    print the plan, change nothing

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const SKILLS = ['foreman', 'reuse-census', 'lean-review', 'verifying-work', 'shipping'];

const flag = (f) => process.argv.includes(f);
if (flag('--help') || flag('-h')) {
  console.log(fs.readFileSync(__filename, 'utf8').split('\n').slice(1, 10).join('\n').replace(/^\/\/ ?/gm, ''));
  process.exit(0);
}

const dry = flag('--dry-run');
const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const skillsRoot = flag('--project')
  ? path.join(process.cwd(), '.claude', 'skills')
  : path.join(claudeDir, 'skills');
const settingsPath = path.join(claudeDir, 'settings.json');
const hookPath = path.join(__dirname, 'hooks', 'foreman-subagent.js');

const say = (msg) => console.log(`${dry ? '[dry] ' : ''}${msg}`);
const rm = (p) => { try { fs.rmSync(p, { recursive: true, force: true }); } catch {} };

// --- uninstall --------------------------------------------------------------
if (flag('--uninstall')) {
  for (const name of SKILLS) {
    const dest = path.join(skillsRoot, name);
    if (fs.existsSync(dest)) { say(`remove ${dest}`); if (!dry) rm(dest); }
  }
  if (fs.existsSync(settingsPath)) {
    const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8').replace(/^﻿/, ''));
    const arr = settings.hooks && settings.hooks.SubagentStart;
    if (Array.isArray(arr)) {
      settings.hooks.SubagentStart = arr.filter(e => !JSON.stringify(e).includes('foreman-subagent.js'));
      if (!settings.hooks.SubagentStart.length) delete settings.hooks.SubagentStart;
      say(`unwire hook from ${settingsPath}`);
      if (!dry) fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
    }
  }
  console.log('\nUninstalled.\n');
  process.exit(0);
}

// --- skills -----------------------------------------------------------------
if (!dry) fs.mkdirSync(skillsRoot, { recursive: true });

for (const name of SKILLS) {
  const src = path.join(__dirname, 'skills', name);
  const dest = path.join(skillsRoot, name);
  if (!fs.existsSync(src)) {
    console.error(`[FAIL] missing source skill: ${src}`);
    process.exit(1);
  }
  if (dry) { say(`${flag('--copy') ? 'copy' : 'link'} ${name} → ${dest}`); continue; }

  rm(dest);
  if (flag('--copy')) {
    fs.cpSync(src, dest, { recursive: true });
    say(`copied ${name}`);
  } else {
    try {
      // 'junction' is the one directory link Windows grants without elevation;
      // POSIX takes 'dir'. Falling back to a copy beats failing the install.
      fs.symlinkSync(src, dest, process.platform === 'win32' ? 'junction' : 'dir');
      say(`linked ${name}`);
    } catch (e) {
      fs.cpSync(src, dest, { recursive: true });
      say(`copied ${name} (link refused: ${e.code}) — re-run install after editing`);
    }
  }
}

// --- hook -------------------------------------------------------------------
if (flag('--no-hook')) {
  say('skipped hook wiring — sub-agents will not inherit the ladder');
} else {
  let settings = {};
  if (fs.existsSync(settingsPath)) {
    try {
      settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8').replace(/^﻿/, ''));
      const backup = `${settingsPath}.bak`;
      say(`backup → ${backup}`);
      if (!dry) fs.copyFileSync(settingsPath, backup);
    } catch (e) {
      console.error(`[FAIL] ${settingsPath} is not valid JSON — fix it by hand, or re-run with --no-hook`);
      process.exit(1);
    }
  }

  settings.hooks = settings.hooks || {};
  const existing = (settings.hooks.SubagentStart || [])
    .filter(e => !JSON.stringify(e).includes('foreman-subagent.js'));

  settings.hooks.SubagentStart = existing.concat([{
    hooks: [{
      type: 'command',
      command: `node "${hookPath.replace(/\\/g, '/')}"`,
      commandWindows: `if (Get-Command node -ErrorAction SilentlyContinue) { node "${hookPath}" }`,
      timeout: 5,
      statusMessage: 'Loading the ladder...',
    }],
  }]);

  say(`wire SubagentStart hook in ${settingsPath}`);
  if (!dry) {
    fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n');
  }
}

// --- verify -----------------------------------------------------------------
if (dry) {
  console.log('\nDry run — nothing changed. Drop --dry-run to apply.\n');
  process.exit(0);
}

console.log('\nInstalled. Checking readiness...');
try {
  execFileSync(process.execPath, [path.join(__dirname, 'doctor.js')].concat(flag('--project') ? ['--project'] : []),
    { stdio: 'inherit' });
} catch {
  console.log('Doctor reported blocking issues above. Fix them, then re-run: node doctor.js\n');
  process.exit(1);
}
console.log('Start a NEW Claude Code session — hooks load at session start.\n');
