# Handoff — `first-launch-placement` (slice S-06)

Written by `/10x-implement` phase 4: the welcome screen, the Boot -> Welcome -> Task seam and the shared e2e helper are committed (`a51338d`). The next agent must not miss: e2e could not run in this session (MachPort), and phase 4 changes the existing e2e specs, so the orchestrator must run `npx playwright test` on `a51338d` (expected: 8 passed) before phase 5 builds on it.

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | plan-review commits + p1 `d79ba20` + p2 `403644c` + p3 `e4920f3` + p4 `a51338d` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 4 of nine) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/scenes/WelcomeScene.ts`, `src/ui/widgets/AgeButton.ts`, `src/ui/widgets/notebook.ts` | welcome screen (brand, `pl.welcome.question`, 5 age buttons from `placementData.ages`, `targets()`), age button (pointerup after press on it), `drawNotebook` extracted from `TaskScene` |
| `src/scenes/BootScene.ts`, `TaskScene.ts`, `src/main.ts` | Boot -> `needsPlacement` ? welcome : task; Task reads its stage from `registry.learner` (throws without one), `TaskSnapshot.stage`; `preBoot` sets `REGISTRY_KEYS.month` = `e2eMonth(search)` (only `if __E2E_HOOK__`) ?? `new Date().getMonth()` |
| `src/data/layout.ts`, `pl.ts`, `balance.ts` | `SCENE_KEYS.welcome`, `REGISTRY_KEYS.learner/month`, `WELCOME_LAYOUT`, `WELCOME_TOUCH_TARGETS`, age-button colours, font roles `brand` (62/800) and `ageDigit` (112/750); `pl.welcome.question`; `balance.defaultStage` removed |
| `src/testing/e2eHook.ts` | `e2eMonth(search)`; hook `screen: 'welcome'` (no `task()`/`ui()` calls then), `learner`, `targets.ages`; `nextRound`/`toRoom` null while the room is open |
| `tests/e2e/support/welcome.ts` | `passWelcome(page)`: `goto('/?e2eMonth=9')`, wait for `screen === 'welcome'`, tap age 8 with `page.touchscreen.tap`, wait for `screen === 'task'` with `learner.stage === 'E3'`; used by `task-round.spec.ts` `beforeEach` and `narrator.spec.ts` `openGame`; no `waitForTimeout` |
| `tests/layout.test.ts`, `tests/e2eMonth.test.ts`, `tests/round.test.ts` | welcome targets layout test (+1), `e2eMonth` parsing (+2), defaultStage assertion removed; brand weight 800 exempted from the 650-750 rule (kit `.welcome-brand`) |
| `context/changes/first-launch-placement/plan.md` | rows 4.1, 4.4, 4.5 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | clean |
| `npm test` | 764 passed in 53 files (baseline 671; delta +93 over p1 +71, p2 +11, p3 +8, p4 +3) |
| deploy + ops shell tests; `sample -- E1..E6` | ok; `Naruszenia: 0` x6 |
| `npm run build` | ok, `e2e hook: absent (2 chunks checked)`; `grep -rl e2eMonth dist/` empty; `grep -rn defaultStage src` empty |
| Break 1: age button height 190 -> 90 | `tests/layout.test.ts`: `expected 90 to be greater than or equal to 96`; restored. Meta-check: `WELCOME_TOUCH_TARGETS` is derived from `WELCOME_LAYOUT`, the test reads the constant, so the break proves the check |
| Break 2: `BootScene` always to `task` | NOT run (needs a browser); row 4.2 left open for the orchestrator |
| `npx playwright test` | e2e: not runnable in this session (MachPort) — orchestrator gate (3 failed / 5 did not run, all browser launch failures) |

Orchestrator must run, as plain commands:
1. `npx playwright test` on `a51338d` — expected 8 passed (seed, 6 round/narrator tests per the earlier baseline, same count as main). Red -> re-dispatch phase 4 with the output.
2. Break 2: in `src/scenes/BootScene.ts` make `create` call `this.scene.start(SCENE_KEYS.task)` unconditionally, run `npx playwright test tests/e2e/task-round.spec.ts` -> expect red (the helper never sees `screen === 'welcome'`, and TaskScene throws without a learner); `git checkout` the file. Then tick row 4.2 and 4.3.

## 4. Next command

`/10x-implement first-launch-placement phase 5`

## 5. Open

- Rows 4.2 (break 2 needs a browser) and 4.3 (`npx playwright test` green; build guard and `e2eMonth` grep are verified) open for the orchestrator; 4.5 ticked with `(e2e: orchestrator gate)`.
- `[reviewer]` 4.6 (teacher read of `pl.welcome.question` "Ile masz lat?" and the brand `pl.title` "Martynka urządza": both copied from the kit; no inflection, no numerals) and `[visual]` 4.7 (welcome at 1440x900 and 1024x768 vs `welcome.png`) not done here; earlier `[reviewer]` 1.4, 2.5 and `[human]` rows unchanged.
- DESIGN-GAP: sunflower and cushion (`welcome-flower`, `welcome-cushion`) are not drawn; the gap row in `docs/design-gaps.md` belongs to phase 7 (the code comment in `WELCOME_LAYOUT` already names it). The notebook sits on the plain ivory page (the kit's blurred room background is also not drawn, same as the task screen).
- The 6-star summary row and the warm-up come in phase 6; `autoRead` for E1/E2 after the welcome tap too.

## 6. Autonomous decisions

1. `e2eMonth` lives in `src/testing/e2eHook.ts` as the plan says; main.ts imports it next to `installE2EHook`, both guarded by `__E2E_HOOK__`, so production tree-shakes it (verified by the grep on `dist/`).
2. `drawNotebook` extracted into `src/ui/widgets/notebook.ts` instead of copying it into `WelcomeScene` (the plan names only two new components; this is a move of existing code, not a new widget).
3. The brand uses a new font role `brand` at the kit's weight 800; the layout test's 650-750 rule exempts `brand` (kit `.welcome-brand` is 800) rather than lowering the weight.
4. The hook's welcome `snapshot` carries only `screen` and `learner`; `targets` on the welcome carries only `ages`. `learner` is also in the task snapshot (frozen copy).
5. Age button colours are flattened mid-points of the kit gradient, pressed state reuses `PLACEHOLDER_COLORS.pressed`.
