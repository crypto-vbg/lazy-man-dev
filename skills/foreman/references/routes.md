# Routes

Six routes. Pick one from the request's leading signal. The route decides which
phases run — running all six phases on a typo is the exact bloat this pack
exists to prevent.

| Route | Signal | Phases | Writes code? |
|---|---|---|---|
| **Trivial** | A single obvious edit whose location is already known: typo, rename, config value, version bump, a fix the user has already pointed at. | 4 only | Yes |
| **Build** | Add, extend, or refactor something that fits in one session: a feature, an endpoint, a component, a migration. | 1–6 | Yes |
| **Broken** | Something throws, fails, regressed, flakes, or runs slow. | 1–6, with the **red loop** first | Yes |
| **Foggy** | Too big or too vague for one session: greenfield, "should we…", a rewrite, a request with unsettled decisions inside it. | 1–3, then stop | **No** |
| **Judge** | "Review this", "is this over-engineered", "audit the repo", "what can we delete". | 5 only | **No** |
| **Learn** | "How does X work", "where does Y live", "what calls Z" — and "what even *is* X", when the concept is new to the user. | 2 only | **No** |

## Route rules

**Trivial is a claim you must be able to defend.** It holds only while the
change stays inside one file and the ladder's root-cause check finds no sibling
callers. The moment either breaks, promote to **Build** and start at phase 1 —
say so in one line when you do.

**Broken earns its own opening move.** Before theorising, get one command that
already goes **red** on this bug. No red loop, no diagnosis — a fix you cannot
watch turn green is a guess. Phase 5's gate is the regression test that keeps
it green.

**Foggy does not build.** The deliverable is a settled understanding: the
decisions named, settled, and written down as a spec or a set of tickets.
Interview by [`asking.md`](asking.md) — sort the decisions, ask only the
load-bearing ones, default the rest. Three questions is the budget.

**Persist the spec before you stop.** A fresh context discards the interview, so
the agreement has to live somewhere durable or it does not survive the break.
Write it to `.foreman/spec-<slug>.md` — the same directory as memory, so the `*`
in `.foreman/.gitignore` already covers it (create that file if it is absent).
Where `to-tickets` is installed and the spec became GitHub issues, those are the
durable record instead — say which you wrote. A spec that lives only in the chat
is lost the moment the context resets.

**An existing `spec-<slug>.md` is a fact to reconcile, not a file to overwrite.**
Read it first. Where it contradicts what was just agreed, grill by
[`memory.md`](memory.md)'s conflict rules — state the contradiction in one line,
ask one question — before rewriting anything. Silently replacing a spec discards
a decision the user already made, and they will not know it happened.

When the fog clears, re-enter at phase 1 on the **Build** route with a fresh
context and point it at that spec. Phase 1 reads it as it reads memory; it is
the parts list phase 2 censuses against and the yardstick phase 5 checks for
drift.

**Research before you interview.** Two kinds of fog look identical at first and
need opposite moves. *Undecided* fog — the user knows the domain and has not
chosen — is settled by interview. *Unfamiliar* fog — the user knows the end
goal but not the concept, the protocol, or the library — cannot be. Asking
someone to choose between OAuth flows they have never heard of extracts a guess
and dresses it as a decision.

Tell them apart by trying to phrase the first question. If answering it
requires vocabulary the user has not used, that is unfamiliar fog: run
`researching` first, then put each decision back in terms of its
**consequence** rather than its mechanism. Only then interview.

**Judge and Learn write nothing.** They report. If the report makes the fix
obvious, offer it — don't apply it unasked.

**Learn answers with a path, not a verdict.** Phase 2 is the right phase but its
default instruments have the wrong output shape: the census reports reuse
verdicts and `researching` reports ranked options, and neither of those answers
"what calls `Z`". On this route the deliverable is **the trace** — entry point →
the symbol → every caller, each as `<path>:<symbol>`, with one line on what the
subsystem does and one on where a change would land. Reach for the census only
when the question is really "do we already have one of these", and for
`researching` when it is "what even *is* X" — its `concept:` block is the answer
there.

**Undo is not a route.** Two different requests hide under it. Discarding
*uncommitted* work follows the ladder's working-tree rule: check
`git status --porcelain`, and if the tree holds anything this run did not write,
name the command and stop. Undoing *committed* work — a revert, a reset, a closed
PR — is a history write, so no route performs it: name the exact command
(`git revert <sha>`, `gh pr close <n>`) and let the user run it. Building the
*forward* fix that supersedes a bad commit is a normal **Broken** or **Build**
run, and usually the better answer.

## Optional: composing with other packs

**Nothing below is a dependency.** Every route runs to completion on this pack
alone — that is the design, not a fallback. The skills named here are ones
*some* users happen to have; where one is present it does a phase more richly,
and where it is absent the phase runs inline exactly as specified above. A
missing skill costs nothing and is never worth reporting.

Your available-skills list already names what is installed on this machine.
Read it — do not probe the filesystem, and **never invoke a name to find out
whether it exists.** A name absent from that list does not exist: run the phase
inline instead.

| Phase | Runs inline by default; delegate only if this is already installed |
|---|---|
| Foggy interview | `grilling`, `grill-with-docs` |
| Foggy → spec → tickets | `to-spec`, `to-tickets`, `wayfinder` for multi-session fog |
| Broken, phase 1 | `diagnosing-bugs` |
| Build, phase 4 | `implement`, `tdd` |
| Gate, correctness axis | `code-review` |
| Gate, bloat axis | `ponytail-review`; `ponytail-audit` for a repo-wide sweep |
| Build, whole phase, under the ladder | `ponytail` (lite / full / ultra) |
| Incoming issue backlog | `triage` |
| A module's shape or vocabulary | `codebase-design`, `domain-modeling` |
| Deferral ledger | `ponytail-debt`, if the repo uses `ponytail:` markers |

Two rules bind every delegation:

**Announce it in one line** — "phase 4 → `/implement`" — so the route stays
legible. Silent delegation is how a user loses track of what ran.

**Delegating a phase never skips its gate.** Phase 3's budget, phase 5's
verification, and phase 5's review bind whatever ran the phase. A delegated
`/implement` still reports its line count against the declared budget.
