---
name: verifying-work
description: >
  Gates any completion claim behind evidence from a command run fresh in this
  session. Converts "should work", "that's fixed", "tests pass" into a named
  proof command, its full output, and its exit code. Use before reporting work
  as done, before saying a bug is fixed or a build passes, when accepting a
  sub-agent's report of success, and whenever the user asks whether something
  actually works.
---

# Verifying Work

A claim without a command behind it is a guess wearing a confident voice. The
most expensive failure in agentic coding is not a wrong edit — it is a wrong
edit **reported as done**, because the human stops looking.

Fatigue and optimism both point the same way: toward being finished. This is
the gate that points the other way.

## The gate

Five steps, in order, every time. No step is skippable by inspection.

1. **State the claim** in one sentence. "The login redirect is fixed."
2. **Name the proof command** — the exact command whose output decides the
   claim. If no command can decide it, the claim is not yet checkable: say so
   rather than asserting it.
3. **Run it fresh, in this session.** Not remembered from earlier, not inferred
   from a prior run, not reported by someone else.
4. **Read the full output and the exit code.** A suite that prints `PASS` and
   exits non-zero did not pass. A run that ends in `0 tests ran` proved nothing.
5. **Report the claim with its evidence** — command, the deciding lines, exit
   code — or report the failure with the same evidence.

## Phrases that mean the gate has not run

Each of these is the gate being skipped, not a result:

- "should work now" / "that should do it"
- "probably fixed" / "I believe this resolves it"
- "tests pass" with no command in the transcript
- "the sub-agent confirmed it works"
- "the change is straightforward, so it will work"

Reach for the command instead. If the command cannot be run — no test harness,
no credentials, no device — say exactly that and name what a human must run.

## Traps

- **Borrowed evidence.** A sub-agent reporting success is a claim, not a proof.
  Sub-agents are optimistic for the same reasons you are. Re-run the command in
  your own session, or ask for its verbatim output and exit code.
- **Partial checks.** One passing test file is evidence about one file. A
  typecheck is not a test run. A build is not a behaviour check. Match the
  breadth of the command to the breadth of the claim.
- **Stale output.** Output from before the last edit describes code that no
  longer exists.
- **A test that cannot fail.** A test that passes against the broken code
  proves nothing about the fix. See the regression protocol.
- **Green by absence.** Zero collected tests, a skipped suite, a filter that
  matched nothing — all exit 0 and none are evidence.

## Regression protocol

For any bug fix, the test must be shown to catch *this* bug:

1. Run the new test **without** the fix. Reach for the reversal that discards
   nothing: comment the fix out, or copy the file aside and put it back. Do
   **not** `git stash`, `git checkout --`, or `git reset` a tree that holds work
   this run did not write — the ladder's working-tree rule outranks the
   convenience of a one-word reversal, and a stash is how unrelated uncommitted
   work disappears. The test must fail, and fail for the reported reason.
2. Restore the fix. The test must pass, and the file must be byte-identical to
   what it was before step 1 — a botched restore is a second bug wearing a green
   suite.
3. Report both runs.

A test that never went red is a test that will never tell you the bug came
back.

## Evidence format

```
claim:    <what is being asserted>
command:  <exactly what was run>
exit:     <code>
evidence: <the deciding lines of output, not the whole log>
```

For a bug fix, two blocks: one red without the fix, one green with it.

## Completion

Every claim in the final report carries a command and an exit code, or is
labelled unverified with the reason. Reporting a failure honestly passes this
gate; reporting an unverified success does not.
