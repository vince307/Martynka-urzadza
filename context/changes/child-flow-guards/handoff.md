# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-tdd` step for phase 8 of run 2026-10-16-audit-sweep. Phases 1 (`d3ba8bb`), 2 (`ae03a52`), 3 (`b4b6076`), 4 (`7fad790`), 5 (`fbee812`), 6 (`f6abb19`) 7 (`1be8a78`) and 8 (`9bbde57`) are
committed; phases 9-14 are open. Keep the save format v4.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | docs + p1 `d3ba8bb` + p2 `ae03a52` + p3 `b4b6076` + p4 `7fad790` + p5 `fbee812` + p6 `f6abb19` + p7 `1be8a78` + p8 `9bbde57` `feat(child-flow-guards): Answer-mode oracle and validator rules (p8)` + handoffs |
| Pushed / PR / merged | no / no / no |
| `change.md` status | left `plan_reviewed` (orchestrator's) |
| `## Progress` rows remaining | phase 8: 8.4 `[reviewer]`; phase 7: 7.5 `[reviewer]`; phase 6: 6.5-6.7; phase 5: 5.5-5.7; phase 4: `[reviewer]` 4.4; phase 3: 3.5, 3.6; phase 2: 2.5-2.7; phases 9-14 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/round/canonicalInput.ts` | tiles: first choice passing `check` or equal to the answer, else throw naming the skill; keypad: non-negative integer, at most `balance.keypad.maxDigits` digits, `check` not refusing; `undefined` by `choices`; `never` default kept |
| `src/core/tasks/visual.ts` | `TALL_MODES = ['tiles','keypad']` beside `visualShape` |
| `src/core/tasks/validate.ts` | one `switch` over the mode with a `never` default (digits column rule and drag rule moved into it); rule `mode` for a tall drawing outside `TALL_MODES`; new rule `hintVisual` (`ViolationRule`) for a hint drawing on a task with its own drawing |
| `src/core/round/pictureLayout.ts`, `src/scenes/TaskScene.ts` | optional `skillId` on `pictureLayout`, `answerSpans`, `hintPictureLayout`, `tallOf` (message suffix ` (skill X)`); `render` passes `task.skillId` |
| tests | `tests/answerModes.test.ts` (8 canonicalInput cases), `tests/solvableInMode.test.ts` (tall drawing modes, 2), `tests/hintVisual.test.ts` (hint drawing + own drawing), `tests/pictureLayout.test.ts` (skill id, 2); `tests/moneyPay.test.ts` two draws now set `input: 'drag'` as `generateTask` does |

## 3. Verification

| command | result |
|---|---|
| RED (before any production edit) | `AssertionError: expected [Function] to throw an error` (tiles not among choices, tiles check, keypad check, no-mode cases); `AssertionError: -1: expected [Function] to throw an error`; `AssertionError: expected [] to include 'hintVisual'`; `AssertionError: select: expected [] to include 'mode'`; `expected [Function] to throw error matching /E9\.1\.x/ but got 'no tall drawing for the select mode'`; 8 failed, 265 passed |
| GREEN | full suite Tests 3199 passed (p7 3186, +13); `solvableInMode` green for every skill (the stricter oracle exposes no current skill, as the plan-time probe said); two `moneyPay` tests called `canonicalInput` on generator output without `input` and were fixed to set `input: 'drag'` |
| Break | keypad branch back to `return task.answer` + `TALL_MODES` with `select`: 3 red by assertion (`-1: expected [Function] to throw an error`, keypad check, `select: expected [] to include 'mode'`); both restored |
| Meta-check | the break proves the oracle and the validator rule on hand-built tasks, not the widgets; the layout message change is covered by its own test |
| lint / typecheck | OK / OK; deploy scripts OK; `sample` E1-E6 OK; build OK, `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 125 passed (9.9m) = baseline + 0, run after the last code edit |

## 4. Next command

`/10x-tdd child-flow-guards phase 9`

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
