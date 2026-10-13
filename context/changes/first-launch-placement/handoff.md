# Handoff — `first-launch-placement` (slice S-06)

Written by `/10x-implement` phase 6: the warm-up runs in `TaskScene`, the stage is corrected silently after it, `autoRead` is recomputed, and the e2e helper `passWelcome` now takes the parent path (`96674ca`). The next agent must not miss: e2e could not run in this session (MachPort), so the orchestrator must run the commands in §3 on `96674ca` (expected 8 passed) and the deliberate break of row 6.2 before phase 7.

## 1. State

| | |
|---|---|
| Branch | `feat/first-launch-placement`, cut from `main` at `37a9a62` |
| Commits | plan-review commits + p1 `d79ba20` + p2 `403644c` + p3 `e4920f3` + p4 `a51338d` + p5 `012867b` + p6 `96674ca` + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 6 of nine) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/scenes/TaskScene.ts` | `create`: `warmup = learner.warmupPending && previousStage(stage) !== null`; `freshRound` builds `buildWarmup(...)` with `RoundRules {...balance.round, length: balance.warmup.length}` while `warmup` is set; `advance`: when the state becomes `finished` in the warm-up, `finishWarmup()` calls `warmupResult`, writes `{...learner, stage, warmupPending: false}` to the registry, recomputes `this.stage`, `this.autoRead`, clears `warmup` (so the summary is ordinary and "Do pokoju"/return cannot skip the correction); `autoReadFirst()` after the first `render` in `create` (the age tap was the gesture); `TaskSnapshot.warmup` (read-only, in the hook through the spread) |
| `src/ui/widgets/SummaryPanel.ts`, `src/data/layout.ts` | star row shifted by `(SUMMARY_LAYOUT.stars.kitCount - count) * (size + gap) / 2`: 5 stars stay on the kit's left edge, 6 are centred; `kitCount: 5` is new in layout |
| `tests/e2e/support/welcome.ts` | `passWelcome(page)` = parent path: `targets.parent` tap -> `getByRole('dialog')` -> problem read from the dialog text with `/(\d+)\s*·\s*(\d+)/`, product computed in the helper, digits via `getByRole('button', {name, exact}).tap()`, „OK” -> `getByRole('dialog', {name: 'Ustawienia startowe'})` -> „10+” -> „Klasa 2, I półrocze” -> „Zatwierdź” -> waits for `screen === 'task'`, asserts `learner.stage === 'E3'` and `warmupPending === false`. No clock pinned, no `waitForTimeout`, answer never from the hook. New export `passWelcomeAsChild(page, age, month)` (child path with `?e2eMonth`) for phase 8 and the row 6.2 break |
| `context/changes/first-launch-placement/plan.md` | rows 5.3, 6.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | clean |
| `npm test` | 765 passed in 53 files (baseline 671; delta +94 = p1..p5, p6 +0 as the plan says: logic is in phase 2) |
| deploy + ops shell tests; `sample -- E1..E6` | OK; `Naruszenia: 0` x6 |
| `npm run build` | ok, `e2e hook: absent (2 chunks checked)`; `grep -rl "e2eMonth\|__martynkaE2E" dist/` empty |
| `npx playwright test` | e2e: not runnable in this session (MachPort) — orchestrator gate (3 failed / 5 did not run, all browser launch failures; the helper is unproven in a browser) |
| Row 6.2 break | not observed here (no browser) |

Orchestrator commands on `96674ca`:
1. `npx playwright test` — expected 8 passed, no new spec.
2. Break (row 6.2), then restore with `git checkout tests/e2e/support/welcome.ts`: append `export const passWelcome = (page: Page): Promise<void> => passWelcomeAsChild(page, 8, 9);` is a redeclaration, so instead rename the original export in the file to `passWelcomeAsParent` and add `export const passWelcome = (page: Page): Promise<void> => passWelcomeAsChild(page, 8, 9);` (age 8, October -> E3 with warm-up). Then `npx playwright test tests/e2e/task-round.spec.ts` — expected red: the round has 6 tasks (the 5-task clean round never reaches the summary at index 4, `ROUND_LENGTH` is 5). Meta-check: red proves the child path starts the warm-up in the scene (`snapshot.warmup`).

No new Polish string was added (teacher read: nothing to read).

## 4. Next command

`/10x-implement first-launch-placement phase 7`

## 5. Open

- Rows 6.1 and 6.2 open for the orchestrator (e2e green and the break); `[visual]` 6.4 (warm-up 6 dots, summary with 6 centred stars, normal round after the warm-up, 1440x900 and 1024x768) and `[human]` 6.5 not done here. Also open: `[reviewer]` 1.4, 2.5, 4.6, 5.5, `[visual]` 4.7, 5.6, `[human]` 5.7.
- DESIGN-GAP rows for the sixth dot and sixth star (and the parent entry/gate/panel) belong to phase 7 `docs/design-gaps.md`; a code comment in `SummaryPanel` names them.
- Warm-up stars are paid like a normal round (6 stars + the clean-round bonus of 2); the bonus is not scaled for 6 tasks (balance unchanged). Worth a look in the S-17 playtest.
- The unlocked-speech assumption (first task read after the age tap) holds only for the child path; on the parent path the „Zatwierdź” tap is DOM, so an E1/E2 stage may stay silent until the first canvas tap (plan Known risks, row 6.5).

## 6. Autonomous decisions

1. `autoReadFirst()` is called once in `create` for every start (not only after the welcome), because the scene is only reachable through the welcome now; on E3+ `autoRead` is false so nothing is spoken (narrator spec unchanged).
2. The sixth-star centring is a layout rule in the widget driven by `SUMMARY_LAYOUT.stars.kitCount` (new layout constant) instead of a balance import in the widget.
3. Helper kept both paths: `passWelcome` (parent, used by the specs) and `passWelcomeAsChild` (child path, used by phase 8 and the row 6.2 break) instead of deleting the child path.
4. Row 5.3 ticked on the run-log line "S-06 p5 impl" (e2e 8 passed on `012867b`); 6.1/6.2 left open because no browser ran here.
