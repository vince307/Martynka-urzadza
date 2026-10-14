# Handoff — `number-line-written-arrows` (slice S-14b)

Phase 2 (tdd) is committed (`f852b48`): `column` and `numberLine` drawings, `digitBoxCount`, the `canonicalInput` digits branch and the WRITTEN generator (no curriculum skill uses it yet). Do not make `playable` accept `digits` before phase 8; `TaskPicture` throws for both new kinds until phases 5/7.

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, from `main` at `882cd93` |
| Commits | plan commits + `cfea708` (p1) + `f852b48` (p2) + this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` | 1.1-1.4, 2.1-2.3 ticked; open: 1.5 and 2.5 [reviewer], 2.4 (e2e part, orchestrator) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/visual.ts` | `column` and `numberLine` kinds: key, `validateVisual`, `describeVisual`, shape wide |
| `src/core/tasks/validate.ts` | `digits` needs a `column` drawing; number-line leak rule (no label = numeric answer, box = answer only) |
| `src/core/tasks/written.ts` | `columnSteps` (the method, one place), `columnMarks(visual, none/first/all)` |
| `src/core/tasks/generators/written.ts`, `registry.ts` | `generateWritten`, `parseWrittenParams` (`op`, `digits` 2/3, `carry` any/required), registered |
| `src/core/round/digitBoxes.ts`, `canonicalInput.ts` | `digitBoxCount`; digits branch types the answer through the reducer |
| `src/data/pl.ts`, `src/data/balance.ts` | `tasks.written*` strings, `balance.numberLine.maxTicks` 31 |
| `src/ui/widgets/TaskPicture.ts` | explicit throwing cases for the two new kinds |
| `tests/written.test.ts` (new), `visual`, `digitBoxes`, `answerModes` tests | 26 new tests |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs first) | `expected '' not to be ''` (visualKey), `expected +0 to be 2` (digitBoxCount), `expected function to throw an error, but it didn't` (params), `expected [ {...} ] to deeply equal []` (generator/validator) |
| lint, typecheck | OK |
| unit `npm test` | baseline 2336 + 26 = 2362 passed |
| sample E1-E6 | exit 0 (no skill uses WRITTEN, output unchanged) |
| build | OK (e2e hook absent) |
| deliberate breaks | result cap 100 allowed -> 5 written tests red; `required` without carry -> 3 red; axis labels may equal the answer -> answerModes leak test red; all restored. Meta-check: column arithmetic is recomputed in the test from the operands, not read from the generator lines |
| e2e | not runnable in this session - orchestrator gate (Chromium launch fails in the sandbox). Expected 71 + 0 (phase 1 row 1.4 ticked from the orchestrator note: 71 passed at `cfea708`, --workers=4) |

## 4. Next command

`/10x-tdd number-line-written-arrows phase 3` (Driver: tdd)

## 5. Open

- Row 2.4 e2e part (orchestrator, `--workers=4`); 1.5 and 2.5 [reviewer]; teacher read of WRITTEN lines below.
- Teacher read (6 samples per variant seen): add lines "Jedności: 9 + 1 = 10. Piszę 0, 1 dalej."; with carry-in "Dziesiątki: 6 + 5 + 1 = 12. Piszę 2, 1 dalej."; sub "Jedności: 3 − 7 nie da się. Pożyczam dziesiątkę: 13 − 7 = 6." then "Dziesiątki: było 6, po pożyczce 5. 5 − 4 = 1."; a borrow from a zero is shown as "było 0, po pożyczce 9". Wording reads naturally; the first sub hint does show the ones digit of the result (never the full answer).
- `TASK_LAYOUT.picture.digits` numbers and the DESIGN-GAP rows from 88 are still due (phase 9); `WRITTEN` stays in `LATER` until phase 8.
- The number-line leak rule only covers `visual`; phase 4 extends it to `hintVisual`.

## 6. Autonomous decisions

1. Mixed phase: TDD of drawings, validation, reducer count, generator and marks; `TaskPicture` throw cases, `pl.ts` strings and the balance number were inline scaffolding. Driver stays `tdd`.
2. `columnSteps` is the single source of the method (carry/borrow, lender chains); the generator hints and `columnMarks` both use it. Chain borrow (500 − 284) is a single `borrows` entry with several lenders.
3. Number-line box rule: a non-null box must equal a numeric answer (plan: "box = answer only in the asking task"); the task type is not known to the validator, so a box that differs from the answer is the violation.
4. `digits: 3` subtraction requires a three-digit subtrahend; results 10-99 / 100-999 by rejection sampling.
5. `change.md` status set to `implementing`; commit message `test(number-line-written-arrows): Rysunki column i numberLine, generator WRITTEN (p2)`.
