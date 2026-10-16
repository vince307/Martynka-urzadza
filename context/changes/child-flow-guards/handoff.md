# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-implement` step for phase 13 (after phase 12 `8e19a7e`; the last impl phase of run 2026-10-16-audit-sweep). Phases 1-13 are committed (p13 `9635c99`); phase 14 (e2e) is open. Keep the save format v4.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | docs + p1-p12 (see git log) + p13 `9635c99` `feat(child-flow-guards): Mode widgets, e2e skills seam, docs and seam sweep (p13)` + handoffs |
| Pushed / PR / merged | no / no / no |
| `change.md` status | left `plan_reviewed` (orchestrator's) |
| `## Progress` rows remaining | phase 13: 13.6, 13.7 `[reviewer]`; phase 12: 12.4 `[reviewer]`; phase 11: 11.4; phase 10: 10.4, 10.5 `[visual]`; phase 9: 9.4, 9.5 `[human]`; 8.4; 7.5; 6.5-6.7; 5.5-5.7; 4.4; 3.5, 3.6; 2.5-2.7; phase 14 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/round/view.ts` | new pure `modeWidgets(input)` (exhaustive `switch`, `never` default); `TaskScene` calls it (the private `widgetsOf` is gone) |
| `src/testing/e2eHook.ts` | `forcedSkills` throws naming an id no stage has or an unplayable one; an id of ANOTHER stage still gives null (parent-settings #14 pins an E3 skill and changes the stage) |
| `CLAUDE.md` | one "Child-flow guards" paragraph in "Current state" |
| `context/changes/child-flow-guards/follow-ups/review-fixes.md` | 12 entries, 12 `Trigger:` lines |
| tests | `tests/answerModes.test.ts` (one widget per mode), `tests/e2eSkills.test.ts` (throws / null cases) |

## 3. Verification

| command | result |
|---|---|
| RED | `modeWidgets` / throwing `forcedSkills` tests written with the code in one step (all pure); break below proves the map test |
| Break | `modeWidgets('select')` returning tiles: `answerModes > shows exactly one input widget per mode` red (1 failed), restored |
| Meta-check | proves the map only; the scene wiring is proven by the e2e gate. First e2e run caught that a strict throw on another-stage ids broke parent-settings #14, so cross-stage ids stay null |
| `validate-rule-files.sh` | PASS; a broken path in `CLAUDE.md` gave `missing: 1` FAIL; restored, PASS |
| unit | Tests 3416 passed (p12 3413, +3) |
| lint / typecheck / deploy scripts / sample E1-E6 / build | OK; `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 125 passed (10.2m) = baseline + 0, after the last code edit |
| Seam sweep | one `canSubmit`, `drawUntil`, `dialGeometry`, `cellPositions`; no `snap ?? `, no `?.show` on a missing pool, no "14 %" outside the test that explains the change; every `MAX_ATTEMPTS` still used; gap rows 122-125 match the DESIGN-GAP comments and are in order; every name in the `CLAUDE.md` paragraph exists in `src/` |

## 4. Next command

`/10x-e2e child-flow-guards phase 14`

## 5. Open


- Manual rows (human checklist): 2.7 `[human]` accept the E6.11 review share 90/10; 5.7 `[human]` accept the wallet line
  wording (gap 124); 6.7 `[human]` accept the COMPARE_QTY tile order (gap 125); 9.5 `[human]` tablet check that "OK" is
  inert while a coin or a clock hand is held; 14.4 `[human]` puzzle closed before "Dalej" is not paid again;
  `[visual]` 2.6, 3.6, 5.6, 6.6, 10.5 at 1440 (1920×1080 fit) and 1024×768; `[reviewer]` 1.5, 2.5, 3.5; `[visual]` 3.6.
- DESIGN-GAP rows: 122-125 are done.
- Manual row 7.5 `[reviewer]`: remaining `while` in generators are `addSub` (digit loop, `x > 0`) and `compareNum` (now bounded); E6 `thousands` is 10000.
- Follow-ups written in phase 13 (`follow-ups/review-fixes.md`): GRD-09, WNA-08, WNA-09, TXT-06, F4 two-finger note,
  letterbox thumb, placeValue/clockElapsed dedup, `ArtPool`/`fitRect`, `grosze(id)` lookup, VO3 wallet look, any
  `KNOWN_SMALL` entry from phase 10.
- Risk carried: TXT-01 rewrote the S-14c "about 14 % E5" test on purpose (now 10 %).
- Phase 4 `[reviewer]` 4.4: `afterRound` reachable once per variant round (submit counts, `finishVariant` skips); the 3.x flaky `final-art-loading #15` did not fail this time.

## 6. Autonomous decisions

- **Phase 13 impl scope**: `widgetsOf` moved verbatim to core as `modeWidgets`. `forcedSkills` throws only for ids no stage has or unplayable ones; an id of another stage stays an ordinary round (deviation from the plan's "unknown id throws", forced by parent-settings #14). `KNOWN_SMALL` needed no follow-up (no entry). Seam sweep found nothing to fix; leftovers are recorded as the last follow-up. Would change: a spec that wants a cross-stage id to fail loudly.

- **Phase 12 test-first scope**: all pure `core`; inline: `ClockFace`/`TaskScene` wiring and the type change. The hand-tip test uses `dialGeometry.polar` against the layout rings (the widget draws through the same `polar`), so the break scales `polar`, not the widget. Union uses `set?: undefined; snap?: undefined` for the plain clock. Manual 12.4 `[reviewer]` left open (`grep "snap ?? " src/` is empty). Would change: a reviewer wanting a test that renders ClockFace in Phaser.

- **Phase 11 impl scope**: `assertPool` and `lineTicks` live in `src/core/tasks/visual.ts` (not a new file); `lineTicks` tests sit in `tests/visual.test.ts` and `columnMarks` in `tests/written.test.ts` (existing homes) instead of the plan's `answerModes`/new `numberLine` test files. `IconGroups` pool is the sum of the groups. Would change: a reviewer wanting separate test files. Manual 11.4 `[reviewer]` left open (grep for `?.show`, `?? 20`, `?? null` is empty in the touched files).


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
