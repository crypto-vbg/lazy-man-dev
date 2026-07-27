---
name: shipping
description: Turn finished work into an issue, a branch, a commit, and a PR — or one more commit onto the PR that is already open. The only skill in this pack that touches git, and it runs only when you type it.
disable-model-invocation: true
---

# Shipping

Everything else in this pack builds. This alone **ships**, and it exists behind
a deliberate act: you type it. No skill can reach it, and no agent fires it on
your behalf — that is the whole point of `disable-model-invocation` here.

Read [`../foreman/references/memory.md`](../foreman/references/memory.md) for
the memory format before the preflight. Every question below is asked **once**
and then lives in `Standing`.

## The line this skill does not cross

`--force`, `--force-with-lease`, `--no-verify`, `--amend` on anything already
pushed, and any commit made directly onto the base branch. None of these run,
including when a step fails and one of them looks like the fix. A failing hook
is a finding to report, not an obstacle to bypass.

## 1. Preflight

Gather before asking anything:

```bash
git status --porcelain          # what is actually uncommitted
git branch --show-current       # where you are standing
git remote -v                   # the repo
gh auth status                  # can we talk to GitHub at all
gh pr view --json number,url,state,headRefName   # is this branch already shipped?
```

Read `.foreman/memory.md`. Then check three things and stop on any of them:

- **Nothing to ship** — clean tree and no unpushed commits. Say so; stop.
- **Not verified** — the work has no passing proof command from this session.
  Shipping unproven code is the failure this pack is built to prevent. Run the
  `Standing.checks` command now; red means stop and report.
- **Secrets in the diff** — scan for `.env` files, key material, tokens, and
  credentials. One is a hard stop, not a warning.

**The one case that does not hard-stop: there is no check to run.**
`Standing.checks` is absent *and* the repo has nothing to read one from — no
test script in the manifest, no CI workflow, no linter, nothing that could go
red. A greenfield repo and a docs-only change both land here legitimately, and a
gate that can never open is a gate people route around.

Look before concluding it: a `test` script, `.github/workflows/`, a `Makefile`
target, `pyproject.toml`'s dev dependencies. Find one → run it, and record it to
`Standing.checks` so this is asked once. Find none → carry
`verified: none — <reason>` into the plan block, name what a human would run
instead, and let the user approve *that*. Never invent a command, and never
report an absent check as a passing one.

**Then name the mode**, because the rest of this skill has two shapes:

- **New** — no open PR for this branch. Issue, branch, commit, push, PR.
- **Update** — `gh pr view` returned an **open** PR whose head is the branch you
  are standing on. The issue exists, the branch exists, the PR exists. Shipping
  again means one more commit on top and a push. It does **not** mean a second
  issue and a second PR for work already under review.

Review feedback is the ordinary case here, and the first shipping run of a piece
of work is rarely the last. A closed or merged PR is not update mode — that is
new work on a finished thread, so it takes the new path, and step 2 grills the
contradiction if memory says otherwise.

*Done when:* the change set is known, clean of secrets, either proven green or
explicitly carried as unverified with the reason, and the mode is named.

## 2. Reconcile

Compare three sources: what memory holds, what the repo shows, and what you
were just asked for.

Aligned, or merely missing a field → continue; ask absent fields in step 3.

**Contradictory** → grill, per the memory reference: state the conflict in one
line, then ask by
[`../foreman/references/asking.md`](../foreman/references/asking.md) — one
question, your recommendation attached — and write the answer to `Standing`.
Facts you look up yourself; only the decision is theirs.

Watch for the common one: memory's `Log` says this work already shipped, and it
is still sitting uncommitted. Step 1's `gh pr view` usually settles it — an open
PR means this is update mode and there is no contradiction, only a second round.
A **closed, merged, or absent** PR is the real conflict: find out which before
opening a second one.

*Done when:* no contradiction remains between memory, repo, and request.

## 3. Plan

One block, one confirmation. This is the only approval gate — everything after
it runs without further questions.

```
issue:   <title>
         <2–4 line body: what and why>
base:    <target branch>            [from Standing, or asked now]
branch:  <name, per Standing.branching>
commit:  <message, per Standing.commits>
files:   <N> files, <+A/-B>
verified: <command> → exit <code>   [or: none — <reason>; a human must run <what>]
pr:      <title> — Closes #<issue>
```

`verified:` carries the command, never an adjective. It sits in the block the
user approves precisely so that shipping unverified work is a thing they say yes
to with their eyes open, rather than something the preflight waved through.

Ask only what `Standing` does not already answer. If `base` is absent, this is
the moment to ask it — once — and record it. A repo with an unusual base
(`develop`, `staging`) must be asked, never inferred from what looks default.

**Update mode posts the shorter block**, because everything the long one asks
has already been answered and approved once:

```
pr:      #<n> <title> — <url>          [open, <base> ← <branch>]
commit:  <message, per Standing.commits>
files:   <N> files, <+A/-B>
verified: <command> → exit <code>      [or: none — <reason>]
```

No issue line, no base line, no branch line — those are settled by the PR that
already exists. Re-asking them invites an answer that contradicts the open PR.

Post the block and wait for a yes. Anything other than a clear yes stops here.

*Done when:* the user has approved the block.

## 4. Execute

In order. Stop on the first failure and report it — no retry with a bypass flag.

**New mode:**

```bash
gh issue create --title "<title>" --body "<body>"     # → #N
git checkout -b <branch>                              # never commit onto base
git add <the files in the plan>                       # named paths, not -A
git commit -m "<message>"
git push -u origin <branch>
gh pr create --base <base> --head <branch> \
  --title "<title>" --body "<body, ending: Closes #N>"
```

Notes that matter:

- **Stage named paths**, never `git add -A`. A blanket add is how unrelated
  work and stray local files reach a PR.
- **Branch before committing.** If you are already standing on the base branch
  with the changes uncommitted, `checkout -b` carries them across.
- **The issue comes first** so its number can appear in the branch, the commit,
  and the PR's closing line. One thread, three places.
- The PR body ends with `Closes #N` so merging closes the issue.

**Update mode:**

```bash
git add <the files in the plan>       # named paths, same rule
git commit -m "<message>"
git push                              # no -u; upstream is already set
```

Three commands, and the PR picks the commit up on its own. What matters is
what is *absent*:

- **No second issue and no second PR.** The thread already exists; a duplicate
  splits the review across two places and leaves one of them to rot.
- **No `--force`, no `--force-with-lease`, no `--amend`.** The rule at the top
  of this file is at its most tempting here, because the last commit is yours
  and tidying it looks free. It is not: a reviewer may have read it, and
  someone else may have pushed on top.
- **A rejected push is a finding, not an obstacle.** It means the remote branch
  moved — someone pushed to the PR, or a maintainer committed a suggestion.
  Report the rejection and stop. Do not force, and do not rebase; both are the
  user's to run.

*Done when:* the PR URL exists — created in new mode, updated in update mode.
Print it either way.

## 5. Record

Append one `Log` entry to `.foreman/memory.md`, and write any `Standing` field
that got answered along the way:

```
shipped: issue #<n>, branch <name>, PR #<n> → <base>
```

Update mode does not append a second entry — it adds one line to the existing
one, so the ledger keeps one row per thread rather than one per push:

```
updated: PR #<n>, <commit subject>
```

Then say what remains for the human: review, merge, deploy. **Merging is not
shipping's job** — it opens the PR and stops.

*Done when:* memory reflects the shipped state and the PR link is in the
response.
