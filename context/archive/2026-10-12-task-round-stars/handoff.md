# Handoff — `task-round-stars` (slice S-04)

Written by the visual-gate fix step (re-dispatch) of autonomous run 2026-10-12-s04-s08; it follows the visual gate, whose DESIGN-GAP 8 (the "□" glyph) is now resolved by a drawn box (`87049c5`). Every `[visual]` state of the round is captured at 1440 and 1024 (+420×760), six kit discrepancies were fixed in `daa513e` and `f0ec6d5`, and the verdict is `VISUAL: GAPS` (non-blocking). The next agent must not "fix" the slashed zero (V3, a maintainer decision) and must not take the GAPS line for a blocker: it ships.

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | docs + p1..p11 + `0c0baf4` (impl-review fix) + `ec98195` (impl-review docs) + `daa513e`, `f0ec6d5` (visual-gate fixes) + `87049c5` (drawn blank) + this docs commit |
| Pushed / PR / merged | PR/CI/merge/deploy recorded in context/runs/2026-10-12-s04-s08/run-log.md |
| `change.md` status | `archived` (`076f702`, folder `context/archive/2026-10-12-task-round-stars/`; roadmap S-04 `done`, Backlog Handoff S-04/S-05 refreshed) |
| `## Progress` rows remaining | 6: `[human]` 8.5, 10.5–10.8; `[reviewer] (CI at ship)` 9.8 |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/task-round-stars/reviews/visual-review.md` | states table, hand-checked stars (7 and 5), targets at 1024, findings F1–F6 with fixes, kept items, open observations; ends with the `VISUAL:` line |
| `context/changes/task-round-stars/screenshots/*.png`, `screenshots/README.md` | 31 frames (desktop, tablet, portrait) + table state · desktop · tablet · how reached; † marks frames drawn before `f0ec6d5` |
| `src/data/layout.ts` | `FONT_WEIGHTS`, `FONT_WEIGHT_RANGE`, palette `button`, `buttonBorder`, `hintBorder`, `next`, `nextBorder`; `TASK_LAYOUT.expression` {620, 456}; `bar.hintBorder` |
| `src/ui/widgets/textStyle.ts` (new) | `textStyle(role, color)`: family, size and kit weight per text role |
| `src/scenes/BootScene.ts` | `load.font` with FontFace `weight: FONT_WEIGHT_RANGE` |
| `src/scenes/TaskScene.ts` | `textStyle` everywhere; solution centred on the expression and wrapped at the bar width; DESIGN-GAP 8 comment in `drawPrompt` |
| `src/ui/widgets/{ActionButton,FeedbackBar,Keypad,SolutionSteps,StarCounter,AnswerTiles}.ts` | kit button tokens and border, hint-bar outline, OK key colours, line wrap, uniform tile label scale |
| `src/core/round/view.ts` | `roundView`: the current dot is `done` once `phase === 'done'` |
| `tests/layout.test.ts`, `tests/roundView.test.ts` | weights 650–750, solution column inside the notebook and left of the keypad, green dot after a settled task |
| `docs/design-gaps.md` | row 8: missing-number blank (font has no U+25A1) |
| `context/changes/task-round-stars/follow-ups/review-fixes.md` | new section "Visual gate": step-indicator dots, `= ?` copy, bar text at 1024, star over the "9" key |
| `context/changes/task-round-stars/plan.md` | rows 5.6, 6.4, 7.4, 8.4 ticked — `f0ec6d5` |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK (after `daa513e` and again after `f0ec6d5`) |
| unit (contract command) | 593 passed (baseline 441, +152; +3 in this step); deploy and ops tests OK; `sample` E1–E6 `Naruszenia: 0` |
| build | OK, `e2e hook: absent (2 chunks checked)`; `__martynkaE2E` 0 hits in `dist/` |
| `npx playwright test` (sandbox off) | 4 passed (baseline 1, +3) after `daa513e`; after `f0ec6d5` one run had 1 red + 1 not run while my `npm run build` wrote `dist/` in parallel, then 4 passed in 4 sequential runs; ports 4397/4398/4399 empty at the end |
| Break: `FONT_WEIGHTS.prompt` 400 | `tests/layout.test.ts` red `expected 400 to be greater than or equal to 650`; restored. Meta: proves the token, not the loader; the loader is proven by `document.fonts` reporting `200 800` and the bold frames |
| Break: `TASK_LAYOUT.expression.x` 760 | geometry test red `expected 1115 to be less than or equal to 1040`; restored. Meta: proves the column constants; the wrap itself is proven by `tablet-16` |
| Dot test | written first, red (`['current', …]`), then green after the `roundView` change |
| Visual gate | Claude in Chrome, port 4399, own tabs closed; hand check 5 × 1 + 2 = 7 (clean round) and 5 × 1 + 0 = 5 (one second try) matched the counter on screen |

### 3b. Fix after the gate (observed)

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| unit | 596 passed (baseline 441 on main, 593 before this step, +3: `tests/promptBlank.test.ts`) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` (sandbox off) | 4 passed (baseline 1) |
| Break: `splitBlanks` drops the blank piece | `tests/promptBlank.test.ts` red (`expected [ { kind: 'text', text: '2 + 9 =' } ] to deeply equal [ …(2) ]`, total width 80 vs 160); restored, green. Meta: proves split and layout, not the drawing; the drawing is proven by `tablet-14b/c/d` |
| Screenshots | `tablet-14b/c/d`, `desktop-14b/c` (dev server port 4399, own tab closed, server stopped) |

## 4. Next command

none — shipped

## 5. Open

- [human] 8.5 iPad: touch latency < 100 ms, star flight does not block "Dalej"; also judge the bar text size at the tablet (follow-up "Bar text at the tablet size").
- [human] 10.5–10.8 product decisions ("Dalej" instead of auto-advance, "Spróbuj jeszcze raz" alone, `'select'` excluded, no switch drawn).
- [reviewer] (CI at ship) 9.8: job `check`, step `Run npm run build`, regex `e2e hook: absent \([0-9]+ chunks checked\)`.
- DESIGN-GAP 8 resolved: blank drawn as a box (`docs/design-gaps.md` row 8, `TaskScene.drawExpression`, `src/core/round/promptBlank.ts`).
- Follow-ups (`follow-ups/review-fixes.md`): step-indicator dots (`roundView`, `SolutionSteps`), `= ?` copy (`TaskScene.drawPrompt`, `pl.ts`), bar text at 1024 (`FONT_SIZES.bar`), star start over the "9" key (`TaskScene.flyStar`), plus the earlier ones (V3 slashed zero, `wordTemplates.ts` złoty, `roundView` mode, `firstHint` ROUNDING, e2e `counter`, `snapshot` copy, `hints.test.ts` skips).
- The dev server does not hot-reload in this sandbox: after an edit, restart it before a screenshot.

## 6. Autonomous decisions

1. **Fixed six token/layout discrepancies on the branch** (weights, button colours, keypad column, wrap, green dot, tile scale) instead of only recording them: each is a value or geometry the kit states, cheap and tested. Rejected: deferring them to S-16. Would change: a kit revision of the task screen.
2. **Step-indicator dots and `= ?` left as follow-ups**: both need a core/view or copy change across stages (step count in `roundView`; a `pl.ts` string and E5–E6 width checks), larger than a gate fix. Would change: the maintainer wants them before ship.
3. **`□` glyph recorded as DESIGN-GAP 8**, not redrawn in code: the kit has no missing-number frame, so any box would be invented. Would change: the kit adds the frame or the maintainer picks a drawn box.
4. **Verdict GAPS, not PASS**: all states were captured and the round matches the kit after the fixes, but kit elements (step dots, `= ?`) are still not drawn. Would change: those follow-ups land.
5. **Frames drawn before `f0ec6d5` kept and marked †** rather than re-captured: only the bare keypad expression is 104 scene px lower in them; the key frames (round start, hint with a line, both solution steps) were re-captured on the final code. Would change: a reviewer needs every frame on the final code.
6. **Row 7.4 ticked** with the hint-with-line frame captured at both widths (`desktop-04b`, `tablet-04`). V3 slashed zero noted, font unchanged (maintainer decision).
7. **Archived with 6 open Progress rows** (ship step): `[human]` 8.5 and 10.5–10.8 are the maintainer's post-run checklist (iPad check and product decisions), not code work; `[reviewer]` 9.8 is ticked in the ship step from the PR's CI log. Rejected: holding the archive for them. Would change: the maintainer reverses one of the 10.x decisions before the merge.
8. **Follow-up added before archiving**: spacing around the drawn blank box (`Trigger: S-17`, `33cedd5`). Restated for S-05 in the roadmap Backlog Handoff: the `Trigger: S-05` follow-ups (task/room switch, e2e `counter`, `pl.title`, step dots).
