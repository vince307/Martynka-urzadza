# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by `/10x-implement` phase 5 of run 2026-10-21-post-run-polish: "Obrazki" drops the background line, committed as bb295b4. Do not edit `src/data/balance.ts`, `curriculum.ts`, `mastery.ts`: shares are the contract.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | docs/plan + `11f0c69` (p1) + `3be7518` (p2) + `8a0f76d` (p3) + `ccf03af` (p4) + `bb295b4` (p5) + 91a1be1 (p6) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | not changed by this step |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/artHealth.ts` | `pictureCutCount` (task + room + ui lists of a `cutByTable` record); `ArtHealthLinesInput.cut` doc says pictures |
| `src/scenes/UIScene.ts` | `openSettings` passes `pictureCutCount(bootLoad.cutByTable)` |
| `tests/artHealth.test.ts` | describe `pictureCutCount`, 4 cases |
| `context/changes/post-run-polish/plan.md` | rows 6.1-6.3 ticked; 6.4 and 6.5 open |

## 3. Verification

| command | result |
|---|---|
| RED (stub summing all five lists) | `AssertionError: expected 4 to be 2`; `expected 3 to be +0` (sounds+font only); 3 of 4 cases red |
| GREEN | `tests/artHealth.test.ts` 22 passed |
| `npm test` | 3732 passed (phase-5 3728, +4) |
| break | count all five lists -> 3 cases red; restored, green |
| meta-check | the sounds-only and shape cases build the record with the real `cutByTable` over a table of ids, so they are the shape `BootScene` writes |
| `grep -c "cut.length" src/scenes/UIScene.ts` | 0 |
| lint, typecheck, deploy scripts, sample E1-E6, build | OK (`e2e hook: absent`) |
| e2e full suite | orchestrator's part; rows 4.5, 5.5, 6.4 open |

## 4. Next command

`/10x-tdd post-run-polish phase 7`

## 5. Open

- Manual rows: 2.5 [reviewer], 2.6 [human], 3.5 [visual], 6.5 [visual], 8.5 [reviewer]; rows 4.5, 5.5 and 6.4 wait for the orchestrator's e2e.
- Phase 8: CLAUDE.md still names `artCutBackground` (grep 8.1 includes CLAUDE.md); rewrite there. Follow-ups in `follow-ups/review-fixes.md`: COMPARE_EXPR three-directive narration (trigger: teacher read 2.5 / playtest).

## 6. Autonomous decisions


- P2-1 Gate: phase fully TDD'able, no mixed-phase question. Commit message as proposed (`test(post-run-polish): the narrator reads the heading (p2)`); stopped after the phase. Would change: n/a.
- P2-2 Added `pl.round.heading` before the tests (kept nothing of `round.calculate`; the red came from the old signature taking the object), so the RED is a real assertion. Would change: n/a.
- P2-3 The existing "prefers the task speak" test used a numeric fake answer for a sign prompt; it now uses answer `'<'` (a real COMPARE_NUM shape) and expects the heading. Would change: n/a.
- P3-1 Row 3.2: no canvas unit test exists, so no break was run; recorded as the plan says. Hook `heading` is read from the scene field. Stopped after the phase. Would change: n/a.
- P4-1 Gate: phase fully TDD'able; commit message in Polish as the profile asks; stopped after the phase. Would change: n/a.
- P4-2 Test names via `it.each` tuples with `%s` (object `$id` form printed undefined). Would change: n/a.
- P5-1 The Skill tool was not invoked separately; plan phase 5 followed directly (Driver impl). Spec run in-agent, Chromium started. Stopped after the phase. Would change: n/a.
- P6-1 Skill tool not invoked separately; plan phase 6 followed directly (Driver tdd, fully testable, no mixed question). Stub summed all five lists (the planned break) so RED was a real assertion. Commit message as planned; stopped after the phase. Would change: n/a.
