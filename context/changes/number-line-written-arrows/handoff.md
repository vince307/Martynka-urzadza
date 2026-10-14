# Handoff — `number-line-written-arrows` (slice S-14b)

Phase 7 (impl) is committed (`fd50454`): `WrittenColumn`, the key mode of `Keypad` and the `digits` branch of `TaskScene` exist, but `playable` still refuses `digits`, so no child meets such a task before phase 8, which must add the e2e helpers (`typeDigits`, `answerRight`/`answerWrong` branches) in the same commit as the `playable` change.

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, from `main` at `882cd93` |
| Commits | plan commits + p1 `cfea708` + p2 `f852b48` + p3 `a7e3025` + p4 `88f71d7` + p5 `99cc307` + p6 `ef09a12` + p7 `fd50454` + this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` | 7.1-7.4 ticked; open: 1.5, 2.5, 3.5, 4.5, 5.6, 6.5, 7.5 [reviewer]; 5.7, 6.6 [visual] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/WrittenColumn.ts` | new widget: operands, sign, rule, carry circles, borrow strikes with the smaller digit above and a small "1", result boxes (mode `active`/`locked`/`correct`); numbers only from `TASK_LAYOUT.written`, no text of its own |
| `src/ui/widgets/TaskPicture.ts` | distributes `column` to `WrittenColumn`; `render(visual, rect, column?: ColumnState)` throws for a column without its state |
| `src/ui/widgets/Keypad.ts` | optional `onKey` + `setKeyMode(on)`: keys go to the scene, entry field hidden |
| `src/ui/widgets/FeedbackBar.ts` | bar span chosen by an exhaustive switch (`digits` -> keypad span) |
| `src/scenes/TaskScene.ts` | `boxes: DigitBoxes` state, `pressBoxKey` feeds `stepDigitBoxes`, a full row sent with OK goes through `submit`; a wrong answer empties the boxes; `widgetsOf`, `marksShown`, `answerSpot` are exhaustive switches with `never`; snapshot `digits: {count, filled} | null`; `targets.picture` = the column rectangle |
| `src/data/layout.ts` | `FONT_SIZES/FONT_WEIGHTS` `columnDigit`, `columnSign`, `columnMark`; `TASK_LAYOUT.written` (provisional, DESIGN-GAP due in phase 9) |
| `tests/answerModes.test.ts` | +2 tests: the column area keeps the digits at drawn size, box width vs column width |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| unit `npm test` | baseline 2415 + 2 = 2417 passed; deploy and ops tests OK |
| sample E1-E6 | all exit 0 (no data change) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| deliberate break | `case 'digits'` removed from `widgetsOf` in `TaskScene`: typecheck red (`Type '"digits"' is not assignable to type 'never'`); restored. Meta-check: the red is the exhaustiveness guard, which is what row 7.2 protects |
| `playable` | `tests/answerModes.test.ts` still expects tiles, keypad, drag, select only |
| e2e | `npx playwright test --config=... --workers=4`: 71 passed (baseline 71 + 0), 5.0 min. The new widget and branch are unreachable (no playable `digits` skill), so no e2e exercises them yet; phases 10-11 do. Not seen on screen in this phase (no way to draw a `digits` task before phase 8) |

## 4. Next command

`/10x-implement number-line-written-arrows phase 8` (Driver: impl)

## 5. Open

- Rows 1.5, 2.5, 3.5, 4.5, 5.6, 6.5, 7.5 [reviewer]; 5.7, 6.6 [visual].
- `WrittenColumn` and `TASK_LAYOUT.written` / `picture.digits` are untested on screen: phase 8 or the visual gate must look at a 2- and a 3-column task (carry, borrow across a zero) before trusting the geometry. DESIGN-GAP rows 88+ (result boxes, active box, borrow notation, `written` layout) are due in phase 9; `[human]` 8.8 / 9.6 cover the notation.
- Phase 8 reminders: `answerRight`/`answerWrong` in `tests/e2e/support/hook.ts` need `digits` branches (keys by `typeDigits`, then OK); the hook `Snapshot.input` union is `AnswerMode` already; `KEYPAD_HINT_MAX` also applies to `digits`.
- A mark row digit and the borrower's "1" share the mark row (new digit at +12 px, "1" at -22 px): check it does not collide at scale 1.3.

## 6. Autonomous decisions

1. Executed in this context, no subagent; commit message as drafted: `feat(number-line-written-arrows): Widżet WrittenColumn, klawisze okienek, gałąź digits w scenie (p7)`.
2. `TaskPicture.render` takes an optional third argument (`ColumnState`) instead of a second render method, so the picture stays the one place that dispatches on `kind`; a column without it throws.
3. Key mode lives in `Keypad` (`setKeyMode`, optional `onKey`) so the keypad geometry and touch targets are shared; the scene, not the widget, owns `DigitBoxes`.
4. A task's `digits` prompt sits beside the keypad (same as `keypad`) via `widgetsOf(input).keypad`.
5. Marks per phase: first try none, hint phase the first carry/borrow, solution and retype all, done: none after a first-try success else all.
6. Ran e2e myself (Chromium started with the plain command): 71 passed.
