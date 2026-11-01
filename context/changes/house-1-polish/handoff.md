# Handoff — `house-1-polish` (slice S-32)

Written by the `/10x-e2e` step, phase 6, of run 2026-11-01-bathroom-polish-lab: the e2e spec is committed as `89e442b` `test(house-1-polish): kitchen stages, v6 kitchen and cream salon e2e (p6)`, all three breaks went red; all implementation phases are done and the slice is ready for review. The full e2e suite is the orchestrator's, not run here.

## 1. State

| | |
|---|---|
| branch | `feat/house-1-polish`, from `main` at `964285b` |
| commits | p1 `13cb528`, p2 `d2b8c24`, p3 `b1d6f31`, p4 `7a76b76`, p5 `e46d7f2`, p6 `89e442b` (+ the closing commit holding this handoff) |
| pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| Progress rows remaining | 9 (`grep -c '^- \[ \]' plan.md`): 2.8, 2.9, 5.12 `[reviewer]`; 5.6 `[visual]`; 5.7-5.11 `[human]`; rows 6.1-6.3 ticked |
| working tree | clean after the closing commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/house-1-polish.spec.ts` | 3 tests, project `chromium-hook`: `#16 S-32 FR-033` kitchen three stages in the rendered frame with the exact balance, then furnished to 0 stars and the card; `#2 S-32 FR-021` the v6 kitchen (`?e2eSave=v6-kitchen`) on v7: `tasksDone 5`, `chosen`/`shown` = fixture, current task `place-kitchen-table`, wall reads the renovated look, `migratedFrom 6`, store ops start `write`,`backup` with one backup, `backup: 'done'`; `#2 S-32 FR-038` the salon board corner reads cream (255,245,223) in the room before and after the stage purchase and in the ground-left cell of the house, with the cell interior not cream |
| `playwright.config.ts` | `house-1-polish` added to the `ROUND_SPEC` alternation, nothing else |
| `context/changes/house-1-polish/plan.md`, `change.md` | rows 6.1-6.3 ticked with `89e442b`; status implemented |

Pixel values (rendered 1920x1080 frame, measured by a probe in this phase): kitchen `(1200,300)` before/stage 1/stage 2/renovated = (127,67,23)/(153,107,63)/(218,173,135)/(237,194,153); `(480,580)` = (75,83,70)/(98,112,98)/(42,123,116)/(67,126,115) (separates stage 2 from renovated, 25 apart; the plan's "30 apart for every pair" holds for before-stage 1-stage 2, the last pair is 21-25 apart because the renovated look is close to stage 2 in the pack). Salon `(100,100)` cream now, (197,226,159) green before S-32.

## 3. Verification

| command | result |
|---|---|
| `npx playwright test tests/e2e/house-1-polish.spec.ts --list` | 3 tests, `chromium-hook` only |
| single-spec run, `--workers=1`, sandbox off | 3 passed (before and after the breaks) |
| break 1: swap the kitchen stage-1/stage-2 `scene` keys in `src/data/rooms.ts` | `#16` red: "Expected: true, Received: false" on the stage poll (`showsKitchenStage`); restored |
| break 2: `done + 2` -> `done + 1` in `LIFT_V6_KITCHEN_STAGES` | `#2 FR-021` red: current task "Expected: place-kitchen-table, Received: place-fridge"; restored |
| break 3: salon row back to `SALON_V2` scene files with `recolourBoard: true`, `npm run art` | `#2 FR-038` red: "Expected: true, Received: false" on the cream-corner check; script restored, `npm run art` re-run, `git status --short public/assets` empty |
| meta-check | all colours come from `renderedPixel` (screenshot of the canvas), so a layer covering the background would also fail; break 3 is a different picture, not a label |
| gate | lint clean, typecheck clean, unit 4254 passed (+0), build prints `e2e hook: absent (2 chunks checked)` |
| servers | none left (ports 4397/4398 free) |

## 4. Next command

`/10x-impl-review house-1-polish`

## 5. Open

- Full e2e suite: the orchestrator, once, from a pinned worktree; expected `193 + 3`, total equal to `npx playwright test --list | tail -1`.
- `[visual]` 5.6; `[human]` 5.7-5.11; `[reviewer]` 2.8, 2.9, 5.12 (CI/ship).
- Code outside data for the product owner (PR body): `src/core/save.ts`, `src/core/types.ts`, `src/core/migrations/kitchenStages.ts`, `scripts/make-task-art.mjs`, `src/testing/e2eHook.ts` + `vite/e2eHookGuard.mjs`, `deploy/README.md`.

## 6. Autonomous decisions

- No `AskUserQuestion`; the manual gate and the next-phase question were decided in place (stop after phase 6).
- Test 1 asserts the 30-apart step only for the first two stages; stage 3 -> renovated is judged by nearest-colour at a second point (25 apart), because the pack's stage 2 and renovated looks are that close. What would change this: a pack with a stronger stage 3.
- Test 2 does not claim byte equality of `backup-v6` or persistence across a reload (plan review F1); the unit `fixtureLoadPath` cases own that.
- Test 3 does not finish the salon: the "Dom" button is hidden under the room-done card, so it checks the cell after one stage purchase.
