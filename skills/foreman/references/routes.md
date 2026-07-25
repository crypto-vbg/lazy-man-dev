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
| **Learn** | "How does X work", "where does Y live", "what calls Z". | 2 only | **No** |

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
decisions named, each one put to the user and answered, written down as a spec
or a set of tickets. Interview one question at a time and recommend an answer
for each — a wall of questions is unanswerable. Look up every *fact* yourself;
only the *decisions* go to the user. When the fog clears, re-enter at phase 1
on the **Build** route with a fresh context.

**Judge and Learn write nothing.** They report. If the report makes the fix
obvious, offer it — don't apply it unasked.

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
