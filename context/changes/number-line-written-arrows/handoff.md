# Handoff — `number-line-written-arrows` (slice S-14b)

Written by the impl-review step: full-plan review of phases 1–11 done, verdict APPROVED after three WARNING fixes (`fix(...)` commit), `MERGE: CLEAR`. Next is the visual gate; the [visual] rows 5.7, 6.6, 8.7 and the [human] rows 8.8, 9.6 are still open — do not tick them from this review.

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, from `main` at `882cd93` |
| Commits | plan commits + p1 `cfea708` .. p11 `4dc12e7` + p11 handoff `252e2db` + review fix `fix(number-line-written-arrows): poprawki z przeglądu implementacji` + this docs commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` | 5 rows open: 5.7, 6.6, 8.7 [visual]; 8.8, 9.6 [human]; all [reviewer] rows ticked by this review |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/round/canonicalInput.ts` | F1: final `switch` with `never` (no silent tiles/keypad fallback) |
| `src/ui/widgets/Keypad.ts` | F2: `setKeyMode` returns early when the mode does not change (a redraw no longer clears a keypad task's buffer) |
| `src/data/pl.ts`, `src/core/tasks/generators/arrowTable.ts` | F3: `pl.tasks.arrowRuleBack(plus, n, from)` "Idź pod prąd strzałki: od 3 odejmij 1." |
| `tests/answerModes.test.ts` | F7: two stale test titles renamed |
| `context/changes/number-line-written-arrows/reviews/impl-review.md` | review report, ends with `MERGE: CLEAR — …` |
| `context/changes/number-line-written-arrows/follow-ups/review-fixes.md` | F4, F5, F8, F9, F10 with `Trigger:` lines |
| `context/changes/number-line-written-arrows/plan.md` | [reviewer] rows 1.5–9.5 ticked with notes |
| `context/changes/number-line-written-arrows/change.md` | status `impl_reviewed` |

## 3. Verification

Observed in this step. Baseline main `882cd93`: unit 2326, e2e 71.

| Command | Result |
|---|---|
| lint, typecheck (before and after fixes) | OK |
| `npm test` (before and after fixes) | 2429 passed = 2326 + 103 |
| deploy + ops shell tests, `sample` E1–E6 | OK, no violations |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4` (after fixes) | 77 passed (5.2 min) = baseline 71 + 6 (written-column 3, number-line 3) |
| Break: `stepDigitBoxes` fills from the left | `tests/digitBoxes.test.ts` 5 red + WRITTEN rows of `tests/solvableInMode.test.ts` red; restored (`git diff` empty) |
| Break: sixth mode `'probe'` in `ANSWER_MODES` | `tsc` red at every `never` guard: `canonicalInput` (new), `pictureLayout` x4, `TaskScene` x2, `FeedbackBar`, e2e `hook.ts` x2; restored |
| Meta-check | reducer break caught by an independent oracle (typed ones-first, read back); mode break proves the guard spans core, scene, bar and e2e helpers |
| Teacher read `sample -- E2/E3/E5/E6 --count 6` | E2.1/3/5/6/7, E3.2/6/8/9, E5.2, E5.5, E6.7 read; F3 fixed and re-read; details in `reviews/impl-review.md` |

## 4. Next command

`visual gate`

## 5. Open

- [visual] 5.7 (graph, table, E2.7 line, E3.9 jumps), 6.6 (ADD_SUB hint line phases), 8.7 (written column states, borrow marks at scale 1.3, F10) — `src/ui/widgets/{ArrowGraph,NumberLine,WrittenColumn}.ts`, `TASK_LAYOUT.picture.digits`/`hint` (gaps 92, 93).
- [human] 8.8 carry/borrow notation (`WrittenColumn.render`, gap 91); 9.6 decisions against the literal ZADANIA text and higher unlock thresholds on live saves (E2.6, E3.9, E5.2, E6.7 — nothing moves back: `unlockedStep` only rises, save stays v2). Add F4 (DT − U decomposition dropped on hint-line skills) to the author's read.
- Follow-ups: `follow-ups/review-fixes.md` (F4, F5, F8, F9, F10 plus the earlier ones).

## 6. Autonomous decisions

1. **F2 fixed in `Keypad.setKeyMode` (early return), not by moving the call into the new-task block of `TaskScene.render`.** Why: one-line, keeps the widget safe for any caller. Would change: the visual gate showing the entry field not hiding/showing on a digits↔keypad switch.
2. **F3 wording "Idź pod prąd strzałki: od X odejmij n."** (orchestrator's suggestion) over "Cofnij się po strzałce". Why: names the direction and the number; never states the result. Would change: the author's read.
3. **F4 accepted as OBSERVATION, not reverted.** Counting back on the number line is a taught method and the drawing must match the lines; the S-03 decomposition goes to the author. Would change: the author preferring the decomposition text.
4. **Verdict APPROVED / `MERGE: CLEAR`** with zero CRITICAL; F5 (`tallOf` throw) judged unreachable: only `thermometer` is tall and every TEMPERATURE skill is tiles or keypad. Would change: a select/drag/digits skill with a thermometer.
5. **First e2e run stopped mid-way and re-run once after the fixes** (F2 touches the keypad), so the recorded e2e result covers the reviewed code.
