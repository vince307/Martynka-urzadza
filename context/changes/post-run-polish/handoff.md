# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by `/10x-implement` phase 8 of run 2026-10-21-post-run-polish: rule files, comments and follow-ups, committed as d7685b4. Do not edit `src/data/balance.ts`, `curriculum.ts`, `mastery.ts`: shares are the contract.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | docs/plan + p1 `11f0c69`, p2 `3be7518`, p3 `8a0f76d`, p4 `ccf03af`, p5 `bb295b4`, p6 `91a1be1`, p7 `7004a50`, p8 `d7685b4` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | not changed by this step |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `CLAUDE.md` | variety sentence (whole round, rng-free repair), boot sentence (ordinary cut line, picture-only count), new sentence for this change |
| `src/core/round/prompt.ts` | header comment names `headingOf` |
| `context/changes/post-run-polish/follow-ups/review-fixes.md` | 15 `Trigger:` entries |
| `context/changes/post-run-polish/plan.md` | rows 8.1-8.3 ticked; 8.4 (orchestrator e2e), 8.5 [reviewer] open |

## 3. Verification

| command | result |
|---|---|
| grep `artCutBackground` (src tests CLAUDE.md AGENTS.md), `round.calculate` | empty |
| `grep -c '^Trigger:'` follow-ups | 15 |
| `validate-rule-files.sh` | PASS (489 paths, 0 missing) |
| lint, typecheck, `npm test` | OK, 3736 passed (phase-7 3736, +0) |
| deploy scripts, sample E1-E6, build | OK (`e2e hook: absent`) |
| e2e full suite | orchestrator's part; 8.4 open |

## 4. Next command

`/10x-e2e post-run-polish phase 9`

## 5. Open

- Manual rows: 2.5 [reviewer], 2.6 [human], 3.5 [visual], 6.5 [visual], 8.5 [reviewer]; rows 7.4 and 8.4 wait for the orchestrator's e2e.
- Phase 9 is e2e: do not run the implement epilogue (status implemented) before it.
- AGENTS.md had nothing untrue; variety.ts comment still accurate (draw order refers to the spread tie-break).

## 6. Autonomous decisions


- P2-1 Gate: phase fully TDD'able, no mixed-phase question. Commit message as proposed (`test(post-run-polish): the narrator reads the heading (p2)`); stopped after the phase. Would change: n/a.
- P2-2 Added `pl.round.heading` before the tests (kept nothing of `round.calculate`; the red came from the old signature taking the object), so the RED is a real assertion. Would change: n/a.
- P2-3 The existing "prefers the task speak" test used a numeric fake answer for a sign prompt; it now uses answer `'<'` (a real COMPARE_NUM shape) and expects the heading. Would change: n/a.
- P3-1 Row 3.2: no canvas unit test exists, so no break was run; recorded as the plan says. Hook `heading` is read from the scene field. Stopped after the phase. Would change: n/a.
- P4-1 Gate: phase fully TDD'able; commit message in Polish as the profile asks; stopped after the phase. Would change: n/a.
- P4-2 Test names via `it.each` tuples with `%s` (object `$id` form printed undefined). Would change: n/a.
- P5-1 The Skill tool was not invoked separately; plan phase 5 followed directly (Driver impl). Spec run in-agent, Chromium started. Stopped after the phase. Would change: n/a.
- P6-1 Skill tool not invoked separately; plan phase 6 followed directly (Driver tdd, fully testable, no mixed question). Stub summed all five lists (the planned break) so RED was a real assertion. Commit message as planned; stopped after the phase. Would change: n/a.
- P7-1 Skill tool not invoked separately; plan phase 7 followed directly (Driver tdd kept, fully testable, no mixed question). The faceLabel case was green before the change (documented in the test as a pin). `visual.ts` imports `TASK_LAYOUT` from `data/layout` (core may import data). Commit message as planned; stopped after the phase. Would change: n/a.
- P8-1 Skill tool not invoked separately; plan phase 8 followed directly (Driver impl). Reworded CLAUDE.md so the identifier `artCutBackground` does not appear (grep 8.1 must be empty). Stopped after the phase. Would change: n/a.
