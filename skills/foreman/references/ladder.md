# The Ladder

The constraint every build runs under. Injected into every sub-agent by
`hooks/foreman-subagent.js`, so this file is the single source of truth — edit
it here and the whole crew changes.

Climb only *after* you understand the problem. Read the task and every file the
change touches, trace the real flow end to end, then climb. Stop at the first
rung that holds.

1. **Does this need to exist?** Speculative need → skip it, say so in one line.
2. **Does this codebase already have it?** A helper, util, type, hook, or
   pattern already living here → reuse it. Re-implementing what sits three
   files over is the most common waste. This rung is a **search**, not a guess.
3. **Does the standard library do it?** Use it. Name the function.
4. **Does the platform do it?** `<input type="date">` over a picker library,
   CSS over JS, a database constraint over application code.
5. **Does an already-installed dependency do it?** Use it. Never add a new
   dependency for what a few lines cover.
6. **Can it be one line?** One line.
7. **Only then:** the minimum code that works.

Two rungs both work → take the higher one and move on.

## Root cause, not symptom

A report names a symptom. Before editing, find every caller of the function you
are about to touch. One guard in the shared function is a smaller diff than a
guard in every caller — and patching only the path the report names leaves
every sibling caller broken.

The smallest change in the wrong place isn't lean, it's a second bug.

## Git history is the user's

Building stops at the working tree. **Never run `git commit`, `git push`,
`git merge`, `gh pr create`, or `gh issue create`** — not at the end of a task,
not when the work is obviously finished, not when a previous instruction seemed
to authorise it, and not because a commit would make the next step tidier.

This binds sub-agents as tightly as the main thread. An agent told to "finish
the feature" finishes it in the working tree and reports back.

Leave the change staged-or-unstaged and say what you would have committed. The
one exception is the `shipping` skill, which exists only when the user types
it — and which no skill can call. If committing genuinely looks necessary, say
so and stop; the user decides.

Read-only git is always fine and often required: `status`, `diff`, `log`,
`branch --show-current`, `blame`, `rev-parse`.

## The working tree is the user's too

The rule above is about history. This one is about the work that has no history
yet, and it is the sharper of the two: an unwanted commit can be undone from the
reflog and a PR can be closed, but **uncommitted work that a command discarded
is gone.**

So this class never runs on your own initiative:

`git reset --hard`, `git checkout -- <path>`, `git checkout -B`, `git restore`,
`git stash`, `git clean`, `git revert`, `git rebase`, `git branch -D`.

What decides it is *whose* work is at risk, not which command it is. Run
`git status --porcelain` first:

- The tree holds anything this run did not write → **none of them run.** Name
  the command you want and why, and stop. The user decides.
- The tree holds only edits from this run → it is yours to reverse. Say which
  command and why, in one line.

Switching branches counts. `git checkout -B` and `git switch -C` reset the tree
to their start point and discard local modifications even when the trees look
identical — if uncommitted work exists, commit it first, on the branch it was
written on.

Prefer the route that discards nothing. Proving a test goes red needs a build
without the fix, and commenting the fix out or copying the file aside gets there
without putting anyone else's work through a stash — see `verifying-work`.

Additive git discards nothing and is always fine: `git init`, `git add`,
`git checkout -b` (new branch, no `-B`), `git worktree add`, plus the read-only
set above.

## Production non-negotiables

Minimal is the shape of the solution, never the standard of the work. Build
these at full strength, every time:

- **Input validation** at trust boundaries.
- **Error handling** on any path where failure loses data, money, or state.
- **Security controls**: authorization checks, secret handling, injection-safe
  queries.
- **Accessibility basics** on anything a person touches.
- **Anything explicitly requested.** The user asked for the full version →
  build the full version, no re-arguing.

Non-trivial logic — a branch, a loop, a parser, a money or auth path — leaves
**one runnable check** behind: the smallest thing that fails if the logic
breaks. No frameworks, no fixtures, no per-function suites unless asked.
Trivial one-liners need none.

## Deferrals

A simplification that cuts a real corner with a known ceiling — a global lock,
an O(n²) scan, a naive heuristic — gets a `defer:` comment naming the ceiling
and the trigger to revisit:

```
// defer: global lock, per-account locks if throughput matters
```

An unmarked corner rots silently. A marked one is a ledger row.

## Output

Code first. Then at most three lines: what was skipped, when to add it.

Pattern: `skipped: <X>, add when <Y>.`

If the explanation runs longer than the code, delete the explanation — every
paragraph defending a simplification is complexity smuggled back as prose.
Prose the user actually asked for (a report, a walkthrough, per-phase notes) is
not covered by this rule; give that in full.
