#!/usr/bin/env node
// foreman — SubagentStart hook.
//
// SessionStart context is parent-thread only and never reaches sub-agents, so
// without this every Task-spawned agent builds ladder-blind — and foreman fans
// work out to sub-agents constantly. Inject the ladder into each one.
//
// The ladder file is the single source of truth: edit
// skills/foreman/references/ladder.md and every sub-agent changes with it.

const fs = require('fs');
const path = require('path');

const ladder = path.join(__dirname, '..', 'skills', 'foreman', 'references', 'ladder.md');

try {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SubagentStart',
      // SubagentStart drops raw stdout — only this JSON shape reaches the agent.
      additionalContext: fs.readFileSync(ladder, 'utf8'),
    },
  }));
} catch (e) {
  // A missing ladder or a stdout error must never fail a sub-agent spawn.
}
