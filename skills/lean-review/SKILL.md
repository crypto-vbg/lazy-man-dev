---
name: lean-review
description: >
  Reviews a diff or a whole repo along two axes, as parallel sub-agents that
  report separately — Correct (bugs, spec drift, security, house standards) and
  Lean (what in this code should not exist: reinvented stdlib, speculative
  abstraction, dead flexibility, needless dependencies). Use when the user asks
  to review a branch, PR, or working changes, asks whether something is
  over-engineered, asks what can be deleted, or wants a codebase audited for
  bloat.
---

# Lean Review

A change can pass one axis and fail the other: correct code that is three times
the size it needs to be, or a beautifully small diff that does the wrong thing.
Merging the two reports lets the passing axis mask the failing one, so the axes
run apart and report apart.

## 1. Pin the scope

Three scopes. Pick the one that matches where the change actually is — asking
for a ref when the work has never been committed is the common way this step
goes wrong.

**Working tree** — the change is uncommitted. This is what `foreman` phase 5
always hands you, because that pack stops at the working tree by design, and it
is what "review my changes" usually means when no ref is mentioned.

```
git diff HEAD                        # staged and unstaged, against the last commit
git status --porcelain               # and the untracked files, which the diff misses
```

Untracked files are part of the change and `git diff` will not show them: read
each one named in `status` output. **Ask for no ref here** — there isn't one,
and `git diff <ref>...HEAD` would come back empty because nothing was committed.

The caller may name **paths that are out of scope** — work that was already in
the tree before this run started. Exclude them from both briefs and say in one
line which you excluded; reviewing someone else's uncommitted work as though it
were the change is how a clean diff collects findings it did not earn.

**Diff review** — the change is committed, and the fixed point is whatever the
user named: a SHA, `main`, a tag, `HEAD~3`.

```
git diff <fixed-point>...HEAD        # three-dot: against the merge-base
git log <fixed-point>..HEAD --oneline
```

Confirm the ref resolves and the diff is non-empty **before** spawning
anything — a bad ref should fail here, not twice inside two sub-agents. An
empty diff against a valid ref usually means the work is uncommitted: switch to
the working-tree scope rather than reporting nothing to review.

**Repo audit** — no change under review at all; the scope is the whole tree, and
the user asked for a sweep rather than a review. Skip the `Correct` axis unless
they asked for it, and rank `Lean` findings biggest cut first. Do not arrive
here by falling back: an audit answers a different question, and reaching it
because a ref was missing silently drops the correctness axis from a review that
needed it.

## 2. Find what "correct" means here

Gather, in this order, whatever exists:

1. The originating spec, issue, or PRD — from issue refs in the commit
   messages, a path the user gave, or a spec file matching the branch name. If
   there is none, say so; the axis still runs on the rest.
2. Documented standards — `CONTRIBUTING.md`, `CODING_STANDARDS.md`,
   `CLAUDE.md`, `AGENTS.md`, lint config.

A documented repo standard **overrides** any baseline below it. Skip anything
tooling already enforces — a linter does not need a second opinion.

## 3. Spawn both axes in parallel

One message, two `Agent` calls. Each sub-agent gets the diff command, the commit
list where one exists, any out-of-scope paths, and its brief pasted in full — it
cannot see this file. On the working-tree scope there is no commit list; give
the untracked file names in its place, or the agent reviews only what `git diff`
happened to show it.

### Correct — brief

> Report, per file and hunk: (a) bugs — wrong logic, unhandled error paths,
> race conditions, off-by-ones; (b) missing production basics — input
> validation at trust boundaries, authz checks, injection-safe queries,
> secret handling, accessibility on user-facing surfaces; (c) spec drift —
> requirements missing, partial, or implemented wrong, quoting the spec line;
> (d) behaviour nobody asked for; (e) breaches of the documented standards
> listed above, citing file and rule. Then check this baseline of code smells
> and name any you see, quoting the hunk — a documented standard overrides it,
> and each is a judgement call, never a hard violation:
>
> - **Mysterious Name** — a name that hides what it does → rename it; if no honest name comes, the design is murky.
> - **Duplicated Code** — the same logic shape in two hunks → extract it, call it twice.
> - **Feature Envy** — a function reaching into another object's data more than its own → move it onto that data.
> - **Data Clumps** — the same few params always travelling together → make them one type.
> - **Primitive Obsession** — a string or int standing in for a domain concept → give the concept a type.
> - **Repeated Switches** — the same cascade on the same type in several places → one map or polymorphism.
> - **Shotgun Surgery** — one logical change scattered across many files → gather what changes together.
> - **Divergent Change** — one file edited for several unrelated reasons → split it.
> - **Speculative Generality** — abstraction for a need the spec does not have → delete it.
> - **Message Chains** — `a.b().c().d()` the caller should not depend on → hide the walk.
> - **Middle Man** — a layer that only delegates → call the real target.
> - **Refused Bequest** — a subclass ignoring most of what it inherits → use composition.
>
> Mark each finding `bug`, `risk`, or `judgement`. Under 400 words.

### Lean — brief

> Find what should not exist. One line per finding, no prose:
> `<file>:L<line>: <tag> <what>. <replacement>.`
>
> - `delete:` dead code, unused flexibility, a speculative feature. Replacement: nothing.
> - `stdlib:` a hand-rolled thing the standard library ships. Name the function.
> - `native:` a dependency or code doing what the platform already does. Name the feature.
> - `reuse:` a re-implementation of something already in this repo. Name the existing `path:symbol`.
> - `yagni:` an abstraction with one implementation, config nobody sets, a layer with one caller.
> - `shrink:` same logic, fewer lines. Show the shorter form.
>
> Out of scope, do not report: correctness bugs, security holes, performance.
> Another axis owns those. One smoke test or `assert`-based self-check is the
> required minimum, never flag it for deletion; a `defer:` comment is a
> deliberate marker, never flag it either.
>
> End with `net: -<N> lines possible.` Nothing to cut: `Lean already. Ship.`

## 4. Aggregate

Print both reports under `## Correct` and `## Lean`, verbatim. Do **not** merge
or re-rank them — that reranking is exactly what the split prevents.

Close with one line: the count per axis and the worst finding *within each*.
No single overall verdict; two axes, two answers.

## Boundaries

Reports, applies nothing. When the caller is the `foreman` skill, phase 5 owns
what happens to the findings; standalone, offer the fixes and wait.
