# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-tdd` step for phase 10 of run 2026-10-16-audit-sweep. Phases 1 (`d3ba8bb`), 2 (`ae03a52`), 3 (`b4b6076`), 4 (`7fad790`), 5 (`fbee812`), 6 (`f6abb19`) 7 (`1be8a78`) 8 (`9bbde57`) 9 (`843a462`) and 10 (`7ac58d2`) are
committed; phases 11-14 are open. Keep the save format v4.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | docs + p1 `d3ba8bb` + p2 `ae03a52` + p3 `b4b6076` + p4 `7fad790` + p5 `fbee812` + p6 `f6abb19` + p7 `1be8a78` + p8 `9bbde57` + p9 `843a462` + p10 `7ac58d2` `feat(child-flow-guards): Drawing fit and a solution-overflow signal (p10)` + handoffs |
| Pushed / PR / merged | no / no / no |
| `change.md` status | left `plan_reviewed` (orchestrator's) |
| `## Progress` rows remaining | phase 10: 10.4 `[reviewer]`, 10.5 `[visual]`; phase 9: 9.4 `[reviewer]`, 9.5 `[human]`; phase 8: 8.4 `[reviewer]`; phase 7: 7.5 `[reviewer]`; phase 6: 6.5-6.7; phase 5: 5.5-5.7; phase 4: `[reviewer]` 4.4; phase 3: 3.5, 3.6; phase 2: 2.5-2.7; phases 11-14 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/round/drawingFit.ts` | `cellPositions` (moved from `NumberCells`), `cellsScale`, `coordScale`, `drawingFit(visual, rect, layout)` (switch over `TaskVisual['kind']`, `never` default; cells/grid/figure checked against `TASK_LAYOUT.figure.minCell`, read only here) |
| `src/ui/widgets/{NumberCells,CoordGrid}.ts` | call the shared scale helpers |
| `src/ui/widgets/SolutionSteps.ts`, `src/scenes/TaskScene.ts` | `overflowed()` (room < `minScale` x measured height); `console.warn` once per skill; snapshot `solutionOverflow` |
| tests | `tests/drawingFit.test.ts` (helpers, per-kind fit, all-skills loop 5 seeds x 30 draws x both solution states on the real `pictureLayout` rect, `KNOWN_SMALL` empty), `tests/overflowWiring.test.ts` (source reads) |

## 3. Verification

| command | result |
|---|---|
| RED | stub (`drawingFit` true, helpers wrong): `AssertionError: expected [] to have a length of 9 but got +0`, `expected 1 to be 1.5`, `expected true to be false` (cells/grid/figure thin rect) |
| First real run | `E4.7.perimeter_rect: a drawn cell under 36px` (and `perimeter_triangle`, `E5.12.perimeter_side_rect`): free figures judged by unit scale; fixed by the free-figure rule (thinnest side x unit >= minCell), `minCell` untouched |
| GREEN | full suite Tests 3406 passed (p9 3208, +198) |
| Break | `cells` case returns true: `cells fits a roomy rectangle and not a thin one` red; restored. Second break `minCell` 36 -> 90 (restored): 8 red incl. magic_square, pyramid, grid_where/what, perimeter skills |
| Meta-check | proves geometry on the real layout rects (worst-case rect is the pictureLayout one, not the `belowPrompt` shrink), not text metrics; overflow flag is wired by source test only (phase 14 measures) |
| lint / typecheck | OK / OK; deploy scripts OK; `sample` E1-E6 OK; build OK, `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 125 passed (10.4m) = baseline + 0, after the last code edit |

## 4. Next command

`/10x-implement child-flow-guards phase 11`

## 5. Open


- Manual rows (human checklist): 2.7 `[human]` accept the E6.11 review share 90/10; 5.7 `[human]` accept the wallet line
  wording (gap 124); 6.7 `[human]` accept the COMPARE_QTY tile order (gap 125); 9.5 `[human]` tablet check that "OK" is
  inert while a coin or a clock hand is held; 14.4 `[human]` puzzle closed before "Dalej" is not paid again;
  `[visual]` 2.6, 3.6, 5.6, 6.6, 10.5 at 1440 (1920×1080 fit) and 1024×768; `[reviewer]` 1.5, 2.5, 3.5; `[visual]` 3.6.
- DESIGN-GAP rows: 122-125 are done.
- Manual row 7.5 `[reviewer]`: remaining `while` in generators are `addSub` (digit loop, `x > 0`) and `compareNum` (now bounded); E6 `thousands` is 10000.
- Follow-ups to write in phase 13 (`follow-ups/review-fixes.md`): GRD-09, WNA-08, WNA-09, TXT-06, F4 two-finger note,
  letterbox thumb, placeValue/clockElapsed dedup, `ArtPool`/`fitRect`, `grosze(id)` lookup, VO3 wallet look, any
  `KNOWN_SMALL` entry from phase 10.
- Risk carried: TXT-01 rewrote the S-14c "about 14 % E5" test on purpose (now 10 %).
- Phase 4 `[reviewer]` 4.4: `afterRound` reachable once per variant round (submit counts, `finishVariant` skips); the 3.x flaky `final-art-loading #15` did not fail this time.

## 6. Autonomous decisions


- Earlier decisions of the plan review stand (see plan `## Autonomous decisions`).
- **Test-first scope**: all of phase 2 is pure `core`; the only inline edits are the `UIScene` argument and the gap row. Would change: nothing.
- **`stepPlayable(step, stage?)`**: the stage is optional so the old one-argument call (review step playable) keeps working; `playableSteps`/`startableSteps` pass it. Rejected: a required stage (touches every caller). Would change: a caller needing the strict rule without a stage.
- **Named throw placement**: a guard at the top of `buildAdaptiveRound` (`playableSteps(stage).length === 0`, step = the unlocked step) plus a pools-empty check, because `currentStep` throws first for a review-only stage.
- **Progress "began" rule**: a previous-stage miss counts when `at >=` the earliest history entry whose skill id starts with the current stage id; with no current-stage entry yet, none count. Would change: a parent wanting warm-up misses shown at once.
- `change.md` status left to the orchestrator. Unsandboxed e2e log lands in a different `$TMPDIR`; `ps` is not permitted in the sandbox, no background process was started by this step.

- **Phase 3 test-first scope**: all pure `core`; inline: gap row 123 and its comment. Discriminator for a wallet is the drawing (`visual.kind === 'money'` with `pay`), for select `task.input === 'select'`. Old saved examples (numeric `given`, `number[]` answer) untouched. Flaky e2e spec above: not investigated further (out of slice); candidate follow-up.

- **Phase 4 test-first scope**: predicate in `core`, scene wiring covered by a source test; the scene edit is inline production code, no mixed-phase question. `reported` reset moved into `applyRound` per F1. Would change: none.

- **Phase 5 test-first scope**: all pure `core` + data; no inline scaffolding beyond the gap row. `feedback` takes `unknown` (like `check`). Narration reads "Spróbuj jeszcze raz." then the note. Would change: the human rejecting the wording (5.7).

- **Phase 6 test-first scope**: all pure `core` + data; no inline scaffolding beyond the gap row. HALF method line has no digit on purpose (a digit equal to the answer, e.g. n=4, would make `firstHint` withhold it). The old test 'HALF first hint is null' encoded the bug and was replaced. `SUPPRESSED_OK` holds the three phrasing cases. Would change: the human rejecting the tile order (6.7).

- **Phase 7 test-first scope**: all pure `core`; inline: `fill` exported for its test, `compareNum` guard (no test, unreachable). `drawUntil` also replaced `factFamily` swap (extra unbounded loop). Error class for the unknown placeholder is `RangeError`. Would change: a reviewer wanting a `TypeError` for template data.

- **Phase 8 test-first scope**: all pure `core`; inline: the `TaskScene` argument passing. New rule name `hintVisual` (plan). The `moneyPay` tests were edited because they depended on the unchecked oracle. Would change: none. Manual 8.4 `[reviewer]` left open: every mode `switch` ends in `never` (canonicalInput, validateTask, pictureLayout, answerSpans, hintPictureLayout, tallOf); `canonicalInput` is called only from tests.

- **Phase 9 test-first scope**: all pure `core`; inline: the `TaskScene`/`CoinWallet` wiring (covered by `gestureWiring.test.ts`). The old clock test with pointer 2 restarting the grab encoded the bug and was changed to pointer 1. Gestures proven by unit tests only (one Phaser touch pointer). Would change: a device report of a lost carry.

- **Phase 10 test-first scope**: all pure `core`; inline: widget calls and the overflow flag (source-read test). `minScale` in `TASK_LAYOUT.cells/coord` NOT added: the widgets keep their raw fit scale and `drawingFit` judges it against `figure.minCell` (one place). Free (non-lattice) figures have no cells, so the floor applies to the thinnest side (units x cell px); a lattice figure to its cell. No `KNOWN_SMALL` entry needed. Would change: the visual gate (10.5) finding a free figure too small.
