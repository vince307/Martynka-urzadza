# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by the impl-review step: full-plan review done, 2 CRITICAL + 5 WARNING fixed in `1965c28`, verdict `MERGE: CLEAR`.
The next agent must not trust the earlier e2e result for the clock: before `1965c28` the clock face was never drawn
(spec (a) could not see it); the visual gate must look at a real dial.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | docs/plan + p1–p11 (`42a0bee` … `bf87c24`) + handoffs + review fix `1965c28` + this review commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 9 (`grep -c '^- \[ \]' plan.md`): [visual] 4.4, 6.8, 7.6, 9.7; [human] 4.6, 6.9, 9.8, 10.6, 10.7. All [reviewer] rows ticked. |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/drawn-widget-tasks-e3-e4/reviews/impl-review.md` | review report F1–F12, teacher read, ends `MERGE: CLEAR — …` |
| `context/changes/drawn-widget-tasks-e3-e4/follow-ups/review-fixes.md` | + section "From the implementation review" (9 items, each with `Trigger:`) |
| `context/changes/drawn-widget-tasks-e3-e4/plan.md` | [reviewer] rows 1.5, 2.5, 3.4, 4.5, 5.3, 6.7, 7.5, 8.4, 9.6, 10.5 ticked |
| `context/changes/drawn-widget-tasks-e3-e4/change.md` | status `impl_reviewed` |
| `src/ui/widgets/ClockFace.ts` | `render` ends with `setVisible(true)` (F1); `shown()` |
| `src/ui/widgets/TaskPicture.ts` | `bounds()` returns the rectangle only while the drawn widget is `shown()` (F1) |
| `src/ui/widgets/Ruler.ts`, `BaseTenBlocks.ts`, `BarChart.ts` | `shown()`; BarChart label fit to column (F6), `axisLabelGap`; stale `blockSize` doc fixed |
| `src/ui/widgets/BlockMat.ts` | `TASK_LAYOUT.blocks.maxScale`, `TASK_LAYOUT.drag.radius` instead of literals (F7) |
| `src/scenes/TaskScene.ts` | `pointerupoutside` → `cancel` (F4) |
| `src/data/pl.ts` | `clockShortHandHint(hour, minute, next)` "między 3 a 4" (F3); `clockH24`/`clockH24Speak` "Która to godzina w zapisie 24-godzinnym?"; `lengthFromZeroHint` "zaczyna się na 0" (F8) |
| `src/core/tasks/generators/clock.ts`, `length.ts` | short-hand hint call; shifted ruler start on a whole cm for mm too (F5) |
| `src/data/layout.ts`, `src/core/round/pictureLayout.ts`, `docs/design-gaps.md` | new layout keys; header comment; row 55 (mat emptied by a wrong answer) |
| `tests/clock.test.ts`, `tests/length.test.ts`, `tests/dragLayout.test.ts` | between-numbers hint; whole-cm start; layout cap = balance cap |
| `tests/e2e/support/hook.ts` | `buildOnMat` reuses one CDP session (`dragOn`, `BUILD_STEPS` 3) (F2) |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| lint / typecheck | OK / OK (after fixes) |
| `npm test` | 1477 passed (contract baseline 1247 on b57433c, +230; branch before review 1475, +2) |
| deploy tests, `sample` E1–E6 | OK; 0 violations each |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -c e2eSkills dist/_app/*.js` = 0 / 0 |
| `npx playwright test --config=<abs>` on 7b3f925 (before fixes) | 41 passed, 1 failed (adaptive.spec #13 timeout 180 s in `buildOnMat`) — reproduced twice |
| same, after fixes (final tree) | 42 passed (baseline 37, +5), twice; servers 4397/4398 gone |
| Break: `ClockFace.render` without `setVisible(true)` (the shipped bug) + hardened hook | RED `drawn-tasks.spec.ts` (a) `expect(picture).toBeTruthy()` received null (spec:33); screenshot shows no dial; restored → 5/5 green. Meta-check: the hook now reads widget visibility, so the spec proves the dial is on screen, not only that a rectangle was laid out (pixels still for the visual gate) |
| Break (unit): `stepBlockDrag` treats `cancel` like a no-op (only `reset` idles) | RED `tests/blockDrag.test.ts` "a cancelled touch does not put the block down" / "…take a mat block off" (`expected {…} to be null`); restored → 22/22 |
| RED → GREEN new tests | clock hint: received "Krótka wskazówka jest przy 4."; ruler: `expected 9 to be +0` |
| Hooks / save | `.claude/settings.json` mtime 10 Oct, hooks 12 Oct (untouched); no `--no-verify`; `git diff --stat b57433c...HEAD -- src/core/save.ts tests/fixtures` empty |

## 4. Next command

visual gate (S-13: clock, ruler, blocks read, bar chart, select, drag build start/carry/drop, hint/solution beside a picture)

## 5. Open

- Visual rows: 4.4 (clock full hour and 7.45 — the dial is drawn only since `1965c28`; ruler cm not from 0, ruler mm, with hint/solution), 6.8 (blocks E3.6/E4.8, chart `most` with 4 long labels — F6 label fit — and `diff`, chart with solution, unlock card E3.3), 7.6 (select states), 9.7 (drag start, carry, drop on/off mat, hint, solution beside the mat, round summary).
- Human rows: 4.6 ("15.00" vs kit "3:30"), 6.9 (scope vs roadmap letter), 9.8 (real tablet drag/select feel), 10.6 (departures from ZADANIA), 10.7 (texts and `childName`; also F12: half/quarter skills draw full hours too, "po południu" for 18–23).
- Follow-ups with `Trigger:` in `follow-ups/review-fixes.md`: adaptive.spec runtime (1.8–2.0 min of 3 under 6 workers; `tests/e2e/support/hook.ts` `buildOnMat`), `pointerupoutside` not e2e-covered (`TaskScene.create`), `BlockMat.render` lifted block, `SelectTiles` toggle on down, `Ruler`/`BarChart` text churn, `pictureLayout` select/drag overlap, unlock pacing note for the PR body, three `Rect` types; `BlockMat.fitted` still recomputes `blockSize`.
- DESIGN-GAP: none added; row 55 text corrected.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. **F2 fixed in the e2e helper, not by raising the adaptive timeout or tapping blocks.** Rejected: a longer `test.setTimeout` (hides the cost), taps on the tray in `answerRight` (would stop exercising the drag gesture in round play). Why: one CDP session per build and 3 moves per block keep the real drag path and cut the time from >180 s to ~2 min under load. What would change it: adaptive.spec timing out again → split it or seed fewer E4 drag tasks via `?e2eSkills`.
2. **F5: mm segments start on a whole centimetre.** Rejected: dropping `startShift` for mm (loses the subtraction practice). Why: one end read to the mm on ~3.5 CSS px per mm is enough for grade 2. What would change it: the [human] text acceptance (10.7) asking for any-mm starts.
3. **F4 follows the plan (`pointerupoutside` = cancel)** instead of documenting the implemented "drop outside the mat". Why: the plan rule and "an interrupted touch never moves a block" are the safer reading for a 7-year-old on a letterboxed iPad. What would change it: the tablet test (9.8) showing children lift in the letterbox on purpose to remove a block.
4. **Reviewer rows ticked** after the teacher read and the seam checks passed with the fixes; F9–F10 left as follow-ups (feel/perf, need the tablet or the visual gate).
