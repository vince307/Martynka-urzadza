# Handoff — `number-line-written-arrows` (slice S-14b)

Phase 1 (tdd) is committed (`cfea708`). Phase 2 adds the `column` and `numberLine` drawings, `digitBoxCount`, the full
`canonicalInput` `digits` branch and the WRITTEN generator.

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, from `main` at `882cd93` |
| Commits | plan commits + `cfea708` (phase 1) + this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` is NOT yet set (left `plan_reviewed`; orchestrator or phase 2 sets it) |
| `## Progress` | 1.1, 1.2, 1.3 ticked; 1.4 open (e2e), 1.5 [reviewer] |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/types.ts` | `ANSWER_MODES` (5 modes, `digits` last), `SkillDef.answer` derived from it |
| `src/core/round/digitBoxes.ts` | `startDigitBoxes`, `stepDigitBoxes` (ones first; ok only when full) |
| `src/core/round/pictureLayout.ts` | exhaustive `switch` + `never` in `pictureLayout`, `answerSpans`, `tallOf` (tall + drag/select/digits throws); `PictureSpec.digits` |
| `src/data/layout.ts` | `TASK_LAYOUT.picture.digits` (provisional numbers, DESIGN-GAP row due in phase 9) |
| `src/core/round/canonicalInput.ts`, `src/core/tasks/validate.ts` | digits throws / is a `mode` violation until phase 2 |
| `tests/digitBoxes.test.ts`, `tests/answerModes.test.ts` | 10 new tests |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs first) | `expected [ 'drag', 'keypad', 'select', 'tiles' ] to deeply equal [ 'digits', 'drag', 'keypad', … ]`; `expected [] to deeply equal [ 6, 5 ]`; `expected null to be 165`; `expected [] to include 'mode'` |
| lint, typecheck | OK |
| unit `npm test` | baseline 2326 + 10 = 2336 passed; deploy tests OK |
| sample E1–E6 | exit 0; E1, E3, E6 output identical to the stashed baseline |
| build | OK (e2e hook absent) |
| deliberate breaks | `case 'digits'` removed from `pictureLayout` → typecheck TS2 error; reducer fills from the left → 5/5 digitBoxes red; `playable` lets `digits` in → `answerModes` red (`expected [ 'tiles','keypad','drag',…(2) ] to deeply equal [ …'select' ]`). Meta-check: the type break proves the guard, not the layout numbers. Restored. |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied). Expected: 71 + 0 |

## 4. Next command

`/10x-tdd number-line-written-arrows phase 2` (Driver: tdd)

## 5. Open

- Row 1.4 e2e part (orchestrator); 1.5 [reviewer].
- Phase 2 must relax the `digits` violation in `validateTask` to "needs a column drawing" and fill the `canonicalInput` branch with `digitBoxCount`.
- All remaining items from the plan review still apply (see plan `## Known risks`, earlier [human]/[visual] rows).

## 6. Autonomous decisions

1. Mixed phase: TDD of reducer, mode list, layout, validator; the `TASK_LAYOUT.picture.digits` numbers and `tallOf` guard were inline scaffolding. Driver stays `tdd`.
2. `ANSWER_MODES` initially without `digits` as a RED stub so tests failed on assertions, then added.
3. `tallOf` throws for non-tiles/keypad modes instead of silently using the tiles spec (no existing test broke).
4. `validateTask` flags every `digits` task as `mode` (the `column` kind does not exist yet).
5. Commit message: `test(number-line-written-arrows): Strażnik trybów i tryb digits w core (p1)`.
