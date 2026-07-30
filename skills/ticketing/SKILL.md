---
name: ticketing
description: >
  Slices a spec into tickets sized to one build run each — every ticket
  carrying its own parts list, its runnable check, its dependencies, and the
  sub-agent fan-out it contains. Writes them to .foreman/tickets/ and posts the
  board without picking one. Use when the user arrives with a spec, a PRD, a
  plan, or a settled interview and needs it turned into work that can be
  started; when a job is too big for one session and needs breaking down; and
  whenever another skill needs a spec made actionable. Do not use to decide
  which ticket runs next — that is the user's call.
---

# Ticketing

A spec says what should be true when the work is done. A ticket says what
somebody does next. The gap between them is where projects stall: everyone has
read the spec, nobody can start.

Two rules bound this skill, and both matter more than the format below.

**It picks nothing.** The board comes back to the user and they choose. A skill
that slices a spec and then starts on ticket 1 has taken the one decision it
was not given.

**It writes no implementation code.** Slicing is planning. The tickets are the
deliverable.

## 1. Read the spec whole

It arrives from one of two places, read the same way:

- `.foreman/spec-<slug>.md` — what a Foggy run settled.
- **The user's own** — `SPEC.md`, `PLAN.md`, a PRD, an issue body, a path they
  named, or prose pasted straight into the request.

Then check it against the repo, because a spec is a fact to reconcile and not a
brief to execute. Where it names a file, symbol, or dependency, confirm that
still exists. Where it contradicts what you find, state the contradiction in one
line and grill it by
[`../foreman/references/memory.md`](../foreman/references/memory.md)'s conflict
rules before slicing on it.

**An unsettled decision is not a ticket.** A spec with a hole in it — no auth
model, no storage choice, two incompatible options left side by side — produces
tickets that encode a guess, and the guess is invisible by the time someone
builds it. Name the hole, put it on the ticket's `Open:` line, and say plainly
that it wants an interview
([`../foreman/references/asking.md`](../foreman/references/asking.md)) rather
than a build. Everything else in the spec still slices.

## 2. Slice by capability, not by layer

**One ticket is one build run: one census, one budget, one gate.**

The tempting slice is by layer — a schema ticket, an API ticket, a UI ticket.
It is the wrong one. None of the three can be proved alone, so every check is
deferred to the last ticket and the first two get merged on faith. Slice
**vertically** instead: the thinnest change that leaves something working, end
to end, with a check that passes on its own.

Four tests. Each failure has one fix:

| Test | If it fails |
|---|---|
| Can it name one runnable check that proves it done? | Too vague — it is a heading, not a ticket. |
| Would it fit one budget block, one rung, one review? | Too big — split it. |
| Does it leave the tree working? | Layer-sliced — re-slice vertically. |
| Does it wait on three other tickets? | Fine, but say so on `Depends:`. |

Then order them so the earliest ticket is the one that unblocks the most, and
number them in that order. Two tickets nothing separates get the order the spec
gave them.

Prefer fewer, honest tickets. A spec cut into fifteen is a to-do list, and the
overhead of a census and a gate on each will cost more than the code.

## 3. Name the fan-out inside each ticket

The person slicing has read the whole spec; the person building has read one
ticket of it. So the sub-agent work is spotted **here**, written down, and
dispatched later — not rediscovered by someone with less context.

What belongs on `Fanout:`:

- **Reads, freely.** A census of an unfamiliar subsystem, tracing a call path,
  reading external docs, surveying a pattern across many files. Each keeps its
  file dump out of the builder's context, and they run in parallel.
- **Writes, only on a real seam.** Separate packages, separate services, files
  that genuinely never meet. Two agents editing one file overwrite each other
  and neither knows.
- **The completion criterion and the word budget** for each dispatch. "Name the
  file and function that issues the session cookie, under 100 words" returns an
  answer; "investigate the auth flow" returns an essay.

Write `none — single writer` when that is the truth, and most of the time it is.
Inventing a seam to make a ticket look parallel is worse than missing one: the
merge costs more than the work, and the ticket was sized to one hand anyway.

## 4. Write one file per ticket

`.foreman/tickets/<n>-<slug>.md`. Same directory as memory and the spec, so the
`*` in `.foreman/.gitignore` already covers it — create that file if it is
absent. Tickets are working state, not a deliverable, and are never committed.

```
Ticket:  3 — Rate-limit the export endpoint
State:   open
Goal:    <what this is for, in the user's words — one line>
Parts:   <capability>          ← phase 2 censuses each of these
         <capability>
Fanout:  <what a sub-agent carries, and the seam that separates it>
Depends: <ticket numbers that must land first, or none>
Check:   <the runnable thing that proves this ticket done>
Spec:    <path> — <the section this came from>
Open:    <a decision this ticket cannot settle, or none>
```

`State:` is one of `open`, `building`, `done` — and it is the **only** record of
progress. There is no board file: a second place to store state is a second
place for it to be wrong.

## 5. Post the board, then stop

Derived from the `State:` lines, printed rather than stored:

```
.foreman/tickets/ — 4 tickets, 1 done

1 done      CSV writer              check: pytest -q tests/test_csv.py
2 building  Export endpoint         depends: 1   fanout: none
3 open      Rate-limit the export   depends: 2   fanout: 2 reads ∥ (docs, census)
4 open      Admin download button   depends: 2   fanout: none

Open: ticket 3 has no rate-limit store chosen — one question settles it.
Pick one: say the number.
```

Then stop. Do not open ticket 1 because it is obviously first, and do not build
"just the scaffolding" while the user decides — a ticket set nobody has picked
from is not an invitation.

## Re-slicing an existing set

`.foreman/tickets/` already holding files means someone has been here. Read them
before writing anything: a `done` ticket is history and is not re-cut, and a
`building` ticket may have work sitting in the tree right now.

Where the new spec contradicts an existing ticket, grill it — one line on the
contradiction, one question — rather than overwriting. A silently replaced
ticket discards a decision the user made, and they will not know it happened.
Add what is new, renumber nothing, and say what changed in one line.

## Completion

Every part of the spec lands in exactly one ticket, or is named as out of scope.
Every ticket carries a `Check:` and a `Fanout:` verdict — including `none`. No
ticket depends on a higher number than itself unless the cycle is called out.
The board is posted, and no ticket has been picked or started.

A ticket set whose files have no `Check:` line has not been sliced, only
described.
