# Handoff — `first-launch-placement` (slice S-06)

Written by `/10x-tdd` phase 2: the warm-up rules exist in `core` and are green; phase 2 is committed (`403644c`). The next agent must not miss: e2e could not run in this session (MachPort), so the orchestrator must run `npx playwright test` on `403644c`; this phase adds no scene wiring, so no e2e change is expected.

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | plan-review commits + `d79ba20` (p1) + `403644c` (test p2) + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 2 of nine) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/warmup.test.ts` | 11 tests: composition for E2–E6 x 20 seeds from real `stages` (independent oracle for "playable"), `validateTask` on every task, `firstPlayableSteps`, `warmupResult` threshold / never up / never below E1 / null counts as not correct |
| `src/core/round/warmup.ts` | `buildWarmup`, `warmupResult`, type `WarmupRules` |
| `src/core/round/pick.ts` | new `firstPlayableSteps(stage, n)` |
| `src/data/balance.ts` | `balance.warmup = { length: 6, previousCount: 3, currentSteps: 2, minFirstTry: 4 }` (`defaultStage` still present; removed in phase 4/6) |
| `scripts/sample.ts` | `--warmup` flag prints one warm-up per stage (E1: "bez rozgrzewki"), exit 1 on violations |
| `context/changes/first-launch-placement/plan.md` | rows 1.3, 2.1–2.4 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs returning `[]` / unchanged stage) | `npx vitest run tests/warmup.test.ts`: 8 failed, first `AssertionError: E1: expected [] to have a length of 2 but got +0`, then `E2 seed=1: expected [] to have a length of 6 but got +0` |
| GREEN | `tests/warmup.test.ts` 11 passed |
| Break 1: `buildWarmup` uses `stage.steps` (whole stage) | 5 failed (`E2 seed=1 task 3 E2.5.sub_bridge_20: expected false to be true`); restored. Meta-check: composition checked against real curriculum data, the narrow-half test also asserts the set is smaller than the stage |
| Break 2: `firstTry <= minFirstTry` | 2 failed (`E2 first=4: expected 'E1' to be 'E2'`); restored |
| `npm run lint` / `npm run typecheck` | clean |
| `npm test` | 753 passed in 51 files (baseline 671 / 49, delta +82 incl. p1 +71 and p2 +11) |
| deploy + ops shell tests; `npm run sample -- E1..E6` | ok; `Naruszenia: 0` x6; `sample -- E2..E6 --warmup --seed 3` print 6 tasks, 0 violations |
| `npm run build` | ok, `e2e hook: absent` |
| `npx playwright test` | e2e: not runnable in this session (MachPort) — orchestrator gate (3 failed / 5 did not run, all `MachPortRendezvous Permission denied`) |

## 4. Next command

`/10x-tdd first-launch-placement phase 3`

## 5. Open

- Row 2.4 ticked with `(e2e: orchestrator gate)`: orchestrator must run `npx playwright test` on `403644c`.
- `[reviewer]` rows 1.4 and 2.5 (teacher read, `reviews/teacher-read.md`) not done here. Seed-3 samples looked sensible; note E2 warm-up draws E1.4 weekday / E1.11 months from E1 and E6 draws a `calendar_time` task ("Ile dni ma tydzień?") as an early E6 step.
- `[human]` rows unchanged: 5.7, 6.5, 7.5–7.9; balance numbers (6 / 3 / 2 / 4) are a ZADANIA §1 gap, row 7.x.

## 6. Autonomous decisions

1. Stubs with wrong values first so RED is an assertion failure; phase kept `Driver: tdd`; the `balance.warmup` data and `sample --warmup` flag were done inline (scaffolding), not TDD'd separately.
2. `firstPlayableSteps` treats a step as playable when any skill passes the existing private `playable` predicate (answer tiles/keypad with a registered generator), matching the plan's "first playable steps".
3. `buildWarmup` takes the previous-stage tasks first and passes one shared `rng` through `pickSkills` then `generateTask`; `pickSkills` of the narrowed stage reuses `{...stage, steps}`.
4. Row 1.3 ticked on the orchestrator's run-log line "S-06 p1 tdd" (8 passed on d79ba20).
