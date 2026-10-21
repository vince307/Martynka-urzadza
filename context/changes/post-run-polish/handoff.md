# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by `/10x-tdd` phase 4 of run 2026-10-21-post-run-polish: the variety cap repair, committed as ccf03af. Do not edit `src/data/balance.ts`, `curriculum.ts`, `mastery.ts`: shares are the contract.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | docs/plan + `11f0c69` (p1) + `3be7518` (p2) + `8a0f76d` (p3) + `ccf03af` (p4) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | not changed by this step |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/round/variety.ts` | `pickVariedSkills` records each draw's rolled pool; private `repairCap` backtracks an assignment of types within the pools, no rng |
| `tests/variety.test.ts` | additions only: seeded repros E2.1 seeds 1, 21, E1.10 seed 107; 200-seed loop with brute-force existence and rng-state equality |
| `context/changes/post-run-polish/plan.md` | rows 1.4, 2.4, 3.4 ticked (e2e 143+0, orchestrator), rows 4.1-4.4 ticked with sha |

## 3. Verification

| command | result |
|---|---|
| RED (before repair) | `AssertionError: PLACE_VALUE,ADD_SUB,PLACE_VALUE,ADD_SUB,PLACE_VALUE: expected 3 to be less than or equal to 2` (E2.1 seed 1); also `COUNT,BONDS,COUNT,COMPARE_QTY,COUNT: expected 3 ...` (E1.10 seed 107); 4 tests red |
| GREEN | tests/variety.test.ts 10 passed |
| deliberate break 1 | skip the repair (early return) -> 4 red; restored |
| deliberate break 2 | replacement via `rng.pick` -> the rng-state/200-seed case red (oracle (a) bucket test stayed green: the rng-state check is what catches it); restored |
| meta-check | `withinCapPossible` is brute force over pools replayed by the test's own rng copy, never calls the repair |
| shares | `git diff main -- tests/variety.test.ts \| grep '^-[^-]'` empty; `git diff --stat main -- balance.ts curriculum.ts mastery.ts` empty; oracle (a) green |
| sample E1-E6 | output byte-identical to before (`cmp` x6) |
| lint, typecheck | OK |
| `npm test` | 3731 passed (phase-3 count 3727, +4) |
| deploy scripts, build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not run: orchestrator's part; row 4.5 left open (expected branch baseline + 0) |

## 4. Next command

`/10x-implement post-run-polish phase 5`

## 5. Open

- Manual rows: 2.5 [reviewer], 2.6 [human], 3.5 [visual], 6.5 [visual], 8.5 [reviewer]; row 4.5 waits for the orchestrator's e2e.
- DESIGN-GAP 153 rewrite (phase 5 onward); follow-ups in phase 8 (`follow-ups/review-fixes.md`): COMPARE_EXPR three-directive narration (trigger: teacher read 2.5 / playtest).
- Known risk (plan): the repair picks the first skill of the new type in the pool, so it shows slightly more in repaired rounds.

## 6. Autonomous decisions


- P2-1 Gate: phase fully TDD'able, no mixed-phase question. Commit message as proposed (`test(post-run-polish): the narrator reads the heading (p2)`); stopped after the phase. Would change: n/a.
- P2-2 Added `pl.round.heading` before the tests (kept nothing of `round.calculate`; the red came from the old signature taking the object), so the RED is a real assertion. Would change: n/a.
- P2-3 The existing "prefers the task speak" test used a numeric fake answer for a sign prompt; it now uses answer `'<'` (a real COMPARE_NUM shape) and expects the heading. Would change: n/a.
- P3-1 Row 3.2: no canvas unit test exists, so no break was run; recorded as the plan says. Hook `heading` is read from the scene field. Stopped after the phase. Would change: n/a.
- P4-1 Gate: phase fully TDD'able; commit message in Polish as the profile asks; stopped after the phase. Would change: n/a.
- P4-2 Test names via `it.each` tuples with `%s` (object `$id` form printed undefined). Would change: n/a.
