# Handoff — `number-line-written-arrows` (slice S-14b)

Phase 4 (tdd) is committed (`88f71d7`): `Task.hintVisual`, `addSubJumps` and the `line` option of ADD_SUB, the leak rule for `hintVisual`, `RoundView.hintPicture`, `hintPictureLayout`, the minigame strips `hintVisual`. No curriculum skill uses `line` yet (data in phase 6); no widget draws the hint line yet (phase 6).

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, from `main` at `882cd93` |
| Commits | plan commits + p1 `cfea708` + p2 `f852b48` + p3 `a7e3025` + p4 `88f71d7` + this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` | 1.1-1.4, 2.1-2.4, 3.1-3.4, 4.1-4.4 ticked; open: 1.5, 2.5, 3.5, 4.5 [reviewer] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/types.ts` | `Task.hintVisual?: TaskVisual` |
| `src/core/tasks/generators/addSub.ts` | `addSubJumps(a, op, b)`, `Jump`, `hintOfJumps`, `hintLine`; `AddSubParams.line?: true` (parser: `true` only, `max <= 30`); `addSubHint` now derived from the jumps (the DT − U special case kept); with `line` the hint lines come from the jumps only |
| `src/core/tasks/validate.ts` | leak rule runs over `visual` and `hintVisual` (labels, box); `hintVisual` validated with `validateVisual`; rule `mode` when `input` is not `keypad` |
| `src/core/round/view.ts` | `RoundView.hintPicture` (phases second, solution, retype) |
| `src/core/round/pictureLayout.ts`, `src/data/layout.ts` | `hintPictureLayout(spec, input)` (keypad only, others throw), `picture.hint.keypad` provisional numbers (DESIGN-GAP, phase 9) |
| `src/core/minigames/word.ts` | `drawTask` deletes `hintVisual` |
| `scripts/sample.ts` | prints `hint visual: ...` |
| `tests/hintVisual.test.ts` (new) | 17 tests |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs first) | `expected [] to deeply equal [ { from: 7, to: 10 }, ...]`, `expected null to deeply equal { kind: 'numberLine' ...}` (hintPicture), `expected 0 to be greater than 0` (layout), `expected [] to include 'visual'` (leak rule), `expected [Function] to throw` (line max 31); 13 of 17 red |
| lint, typecheck | OK |
| unit `npm test` | baseline 2386 + 17 = 2403 passed; deploy tests OK |
| sample E1-E6 | exit 0; output byte-identical to before (compared with a stash) |
| build | OK (e2e hook absent) |
| deliberate breaks | `hintPicture` also in `first` -> 1 red; result added to `labels` -> 2 red; `drawTask` keeps `hintVisual` -> 1 red (minigame test uses the real `buildWordRound`); restored. Meta-check: the minigame test went red only after the generator emitted `hintVisual`, so it proves the strip |
| e2e | `npx playwright test --workers=4`: 71 passed (5.5 min) = baseline 71 + 0. Row 3.4 ticked from the orchestrator note |

## 4. Next command

`/10x-implement number-line-written-arrows phase 5` (Driver: impl)

## 5. Open

- Rows 1.5, 2.5, 3.5, 4.5 [reviewer].
- Teacher read, ADD_SUB `line` (max 30, bridge ten, seed 7): "12 − 9": "12 − 2 = 10" then "10 − 7 = 3"; "6 + 17": "6 + 10 = 16", "16 + 4 = 20", "20 + 3 = 23"; "9 + 4": "9 + 1 = 10", "10 + 3 = 13"; "16 − 7": "16 − 6 = 10", "10 − 1 = 9". Lines split the units as the axis does (the axis forces "20 − 7" into the general split, not the "10 − 7" special case).
- The hint line window is the full tens around start and result (0-20 or 0-30 for the samples); labels: start, landings, multiples of 5, never the result (box).
- S-15 word minigame strips `hintVisual` in `drawTask` (done). The word round's own layout stays DESIGN-GAP 85.
- `picture.hint.keypad` rectangles are provisional (x 236, y 530, 768x190; lines y 730); phase 6 screenshots decide; DESIGN-GAP row due in phase 9.
- `RoundView.hintPicture` is not read by `TaskScene` yet (phase 6).

## 6. Autonomous decisions

1. Mixed phase: TDD of the logic; the layout numbers in `src/data/layout.ts` and the `sample.ts` line were inline scaffolding. Driver stays `tdd`.
2. `addSubHint` and the axis share `addSubJumps`; with `line: true` the hint is built from the jumps alone so lines and drawing agree, the DT − U special case stays only for tasks without a line.
3. `validateTask` rejects a `hintVisual` only when `input` is set and is not `keypad` (hand-built tasks without `input` pass).
4. `line` must be literally `true`; `false` is rejected like any bad value.
5. Commit message `test(number-line-written-arrows): Rysunek podpowiedzi hintVisual i oś w ADD_SUB (p4)`.
