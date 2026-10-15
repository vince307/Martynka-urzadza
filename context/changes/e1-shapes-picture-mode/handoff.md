# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by `/10x-tdd` phase 5 of run `2026-10-15-fix-s14c-s14d`. Phase 5 is committed and green except e2e (not runnable here). Picture mode is a pure draw filter; no save field, save stays v2.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode` |
| Commits | phases 1-4 `a230f1a`, `b9b16d5`, `670e988`, `c6c6600`; phase 5 `d29760e`, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress | 4.5 ticked citing the orchestrator note (86 passed on `c6c6600`); 5.1-5.3 ticked with `d29760e`; 5.4 e2e (orchestrator), 5.5 `[reviewer]`, 4.6, 4.7, 3.5, 1.5, 2.7, 2.8 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/pictureMode.ts` (new) | `pictureMode(learner, month, rules = balance.pictureMode)`: stage E1 and (`easedRounds > 0` or age 6 in an autumn month) |
| `src/data/pictureSkills.ts` (new) | `hasPicture(skill)`: static table by type (plus CHOOSE_OP all-`picture` kinds, LENGTH `ruler`, MASS not `text`) |
| `src/core/round/pictureFilter.ts` (new) | `withPictures(buckets, hasPicture, minCurrent)`: `earlier`/`previous` keep picture skills, `current` only if >= threshold, a bucket that would empty stays whole |
| `src/core/curriculum.ts` | `buildAdaptiveRound(..., art?, options?: { picture?: boolean })`, applied after the art filter, threshold `unlockThreshold(n, balance.curriculum.unlockShare)` |
| `src/scenes/TaskScene.ts` | `freshRound` passes `picture: month !== undefined && pictureMode(learner, month)` (month from `REGISTRY_KEYS.month`); warm-up unchanged |
| `src/data/balance.ts` | `pictureMode: { age: 6, months: placementData.monthBands.autumn }` |
| `docs/design-gaps.md` | row 21 updated, new row 103 |
| `tests/pictureMode.test.ts` (new) | 7 tests: mode table (5 ages x 12 months x eased x E1/E2), `hasPicture` vs 100 generated tasks per E1/E2 skill, >= 90% pictures in `earlier`, off = no option, E1.2 current filtered, E1.3 current whole |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2763 passed (branch baseline 2756, +7); deploy and ops test scripts OK |
| `npm run sample -- E1` ... `E6` | exit 0 x6 (no content change this phase) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e | `e2e: not runnable in this session — orchestrator gate` (Chromium MachPortRendezvous Permission denied on `first-launch.spec.ts`, plain `--workers=4`); expected 86 + 0. 4.5 ticked from the orchestrator note (86 passed on `c6c6600`, 5.8 min) |
| RED | stubs first (all return false / ignore the option); `AssertionError: E1 age=6 month=0 eased=0: expected false to be true`, `E1.1.shapes_pick: expected false to be true`, `expected 0 to be greater than or equal to 0.9` |
| Breaks | `pictureMode` without the month condition -> `E1 age=6 month=1 eased=0: expected true to be false`; filter ignoring the threshold -> `E1.3.add_sub_5: expected false to be true`; COUNT dropped from the table -> `E1.2.count_5: expected false to be true`. All restored. Meta-check: the table test's oracle is the drawn tasks, not the table |
| Unpinned E1 e2e specs that may draw a different mix (plan Known risk F7) | only `tests/e2e/first-launch.spec.ts` "age 6 starts on E1" (age 6, month pinned October, so picture mode is on; `answerRight` already handles tile faces and drawings). `minigames.spec.ts` starts E1 at age 10+ (mode off); `passWelcome` starts on E3; `parent-settings.spec.ts:175/188` use the E3 default |

## 4. Next command

`/10x-tdd e1-shapes-picture-mode phase 6` (Phase 6, `Driver: tdd`)

## 5. Open

- 5.4 e2e (orchestrator, `--workers=4`, expect 86); 5.5 `[reviewer]` (no field in `Settings`/`SavedLearner`, `variants.ts` and easing weights untouched, row 21/103 honest); the earlier manual rows 4.6, 4.7, 3.5, 1.5, 2.7, 2.8 stay open.
- Watch `first-launch.spec.ts` age-6 test first when the orchestrator runs e2e.

## 6. Autonomous decisions

1. `pictureMode` takes the rules as a third argument defaulting to `balance.pictureMode`; the autumn months come from the placement table so the two cannot drift. Would change: a different band for picture mode than for placement.
2. `buildAdaptiveRound` imports `balance` and `hasPicture` directly (core may import data), threshold uses `balance.curriculum.unlockShare`; the plan's `{ picture: boolean }` option kept.
3. Month missing in the registry means mode off (scenes never call Date).
4. No teacher read: no `src/data/` content or generator changed (only the new table and balance number).
5. Commit message and next-phase prompts decided in place, stopped after phase 5.
