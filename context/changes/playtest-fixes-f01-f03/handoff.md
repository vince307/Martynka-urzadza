# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-tdd` step, phase 2 (F-03 variety in the warm-up), run 2026-10-20-playtest-boot. Phase 2 is
committed test-first; local gate green; e2e left to the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03` |
| Commits | phase 1 (49a682f), `test(playtest-fixes-f01-f03): Variety in the warm-up (F-03) (p2)` e6b1d9c, a docs commit with this handoff and the sha ticks |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | phase 2: 2.3 (e2e part, orchestrator); phases 3-9 open; 1.6 [reviewer] open |
| Working tree | clean after the commits |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/round/variety.ts` | added `pickVariedFromStage` (uniform `pickSkills` draw with a shared type tally and the cap) |
| `src/core/round/warmup.ts` | `buildWarmup` takes an optional last argument `variety` (default `balance.round.variety`); one tally for both halves, `spreadTypes` per half, second half seeded with the last type of the first, unseeded order when seeding makes an in-half neighbour |
| `tests/warmup.test.ts` | new `describe('buildWarmup variety (F-03)')`: per-stage E2-E6 x 200 seeds (cap over 6 when both pools have 3+ types, no neighbours in a half with top count <= 2), shared-cap case E3/E2 (ADD_SUB), cap-off case |

## 3. Verification

| command | result |
|---|---|
| RED (stub `pickVariedFromStage` = `pickSkills`, call site real) | `AssertionError: E2 seed=31 ORDINAL,MONEY_PAY,ADD_SUB,ADD_SUB,MONEY_PAY,ADD_SUB: expected 3 to be less than or equal to 2`; shared case `seed=12 ADD_SUB,CALENDAR,ADD_SUB,MISSING,ADD_SUB,WORD: expected 3 to be less than or equal to 2`; 6 failed, 13 passed |
| GREEN | `tests/warmup.test.ts` 19 passed |
| break: own tally per half | 6 red (E2-E6 and the shared-type case; e.g. `E3 seed=12 ADD_SUB,CALENDAR,ADD_SUB,MISSING,ADD_SUB,WORD: expected 3 to be less than or equal to 2`), restored; meta-check: ADD_SUB sits in both E2 and E3 pools, so the shared case proves the tally |
| break: no `spreadTypes` in the warm-up | 5 red (`E2 seed=3 BONDS,LENGTH,MONEY_CHANGE,MONEY_PAY,MONEY_PAY,ADD_SUB: expected 1 to be +0`), restored |
| npm run lint / typecheck | OK / OK |
| npm test | 3669 passed (phase 1 3662, +7) |
| deploy scripts, `sample` E1-E6, build | OK, exit 0 x6, `e2e hook: absent (2 chunks checked)` |
| e2e | not run (orchestrator at the gate; orchestrator result for phase 1: 139 passed, +0) |

## 4. Next command

`/10x-tdd playtest-fixes-f01-f03 phase 3`

## 5. Open

- Manual rows: 1.6 [reviewer]; rest as in the plan (3.5, 4.5-4.7, 6.4-6.6, 7.4, 7.5).
- Row 2.3: e2e part (`npx playwright test --workers=4`, baseline 139 + 0) is the orchestrator's; local part green.
- Tests restate the cap guarantee only for pools with 3+ types (smaller pools may relax the cap by design).

## 6. Autonomous decisions

- T-1 TDD gate: `pickVariedFromStage` absent, stayed `Driver: tdd`. Would change: none.
- T-2 Manual-gate/commit-message/next-phase prompts decided in place: planned set only, stopped after phase 2.
- T-3 `buildWarmup` got an optional trailing `variety` argument (default from `balance`) so callers compile unchanged; `warmup.ts` now imports `data/balance` like `curriculum.ts` does. Would change: pass rules from `TaskScene` if a boundary rule complains.
- T-4 Row 1.5 ticked with the orchestrator's e2e result; row 2.3 left for the orchestrator.
