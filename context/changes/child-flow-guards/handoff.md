# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-tdd` step for phase 3 of run 2026-10-16-audit-sweep. Phases 1 (`d3ba8bb`), 2 (`ae03a52`) and 3 (`b4b6076`) are
committed; phases 4-14 are open. Keep the save format v4 and the rng use of a successful draw unchanged; in phase 4 the
`variantCounted` reset belongs in `TaskScene.applyRound` (review F1).

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | docs + `d3ba8bb` (p1) + `ae03a52` (p2) + `b4b6076` `feat(child-flow-guards): Mistake examples for list answers (p3)` + handoffs |
| Pushed / PR / merged | no / no / no |
| `change.md` status | left `plan_reviewed` (orchestrator's) |
| `## Progress` rows remaining | phase 3: `[reviewer]` 3.5, `[visual]` 3.6; phase 2: 2.5-2.7; phases 4-14 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/round.ts` | new `exampleValue(task, value)` (wallet -> money largest first, select -> face words in `choices` order); `captureFirstWrong` uses it; `exampleAnswer(task)` prints a model wallet as money |
| `tests/round.test.ts` | 2 new tests (wallet, select) |
| `tests/save.test.ts`, `tests/progress.test.ts` | 1 new test each (string example round trip with `SAVE_VERSION` 4; legacy `number[]` answer still renders) |
| `docs/design-gaps.md` | row 123 (+ comment in `exampleValue`) |

## 3. Verification

| command | result |
|---|---|
| RED (before `exampleValue`) | `AssertionError: expected null to be '2 zł, 2 zł, 1 zł'` (wallet); `expected undefined to deeply equal { prompt: 'Zaznacz trójkąty.', …(2) }` (select) |
| GREEN | round + save + progress tests 116 passed |
| Break: `captureFirstWrong` back to number/string only | red, both new round tests (`2 failed | 26 passed`); restored |
| Meta-check | proves capture and text in `round.ts`; not the panel layout; save and progress tests are regression guards (green with the break, by design: v4 shape unchanged) |
| lint / typecheck | OK / OK (one `--fix` of two unneeded casts) |
| unit | Tests 3159 passed = p2 3155 + 4; deploy scripts OK; `sample` E1-E6 OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 124 passed + 1 flaky: `final-art-loading.spec.ts` "#15 S-16c the loading screen shows the background and the emblem" failed in the full run and in 2 of 4 solo runs, passed in the others; timing of the loading screen, code of this phase is pure core (not touched). Treat as flaky, row 3.4 ticked with this note |
| fixtures | `git diff --stat tests/fixtures` empty; `SAVE_VERSION` 4 |

## 4. Next command

`/10x-tdd child-flow-guards phase 4`

## 5. Open

- Manual rows (human checklist): 2.7 `[human]` accept the E6.11 review share 90/10; 5.7 `[human]` accept the wallet line
  wording (gap 124); 6.7 `[human]` accept the COMPARE_QTY tile order (gap 125); 9.5 `[human]` tablet check that "OK" is
  inert while a coin or a clock hand is held; 14.4 `[human]` puzzle closed before "Dalej" is not paid again;
  `[visual]` 2.6, 3.6, 5.6, 6.6, 10.5 at 1440 (1920×1080 fit) and 1024×768; `[reviewer]` 1.5, 2.5, 3.5; `[visual]` 3.6.
- DESIGN-GAP rows still to add: 124 (wallet line), 125 (COMPARE_QTY order); 122 is done.
- Teacher read rows: 5.3 (E1.11, E2.2), 6.3 (COMPARE_QTY, E3.10 HALF), 7.3 (every stage with a changed generator type).
- Follow-ups to write in phase 13 (`follow-ups/review-fixes.md`): GRD-09, WNA-08, WNA-09, TXT-06, F4 two-finger note,
  letterbox thumb, placeValue/clockElapsed dedup, `ArtPool`/`fitRect`, `grosze(id)` lookup, VO3 wallet look, any
  `KNOWN_SMALL` entry from phase 10.
- Risk carried: TXT-01 rewrote the S-14c "about 14 % E5" test on purpose (now 10 %).

## 6. Autonomous decisions

- Earlier decisions of the plan review stand (see plan `## Autonomous decisions`).
- **Test-first scope**: all of phase 2 is pure `core`; the only inline edits are the `UIScene` argument and the gap row. Would change: nothing.
- **`stepPlayable(step, stage?)`**: the stage is optional so the old one-argument call (review step playable) keeps working; `playableSteps`/`startableSteps` pass it. Rejected: a required stage (touches every caller). Would change: a caller needing the strict rule without a stage.
- **Named throw placement**: a guard at the top of `buildAdaptiveRound` (`playableSteps(stage).length === 0`, step = the unlocked step) plus a pools-empty check, because `currentStep` throws first for a review-only stage.
- **Progress "began" rule**: a previous-stage miss counts when `at >=` the earliest history entry whose skill id starts with the current stage id; with no current-stage entry yet, none count. Would change: a parent wanting warm-up misses shown at once.
- `change.md` status left to the orchestrator. Unsandboxed e2e log lands in a different `$TMPDIR`; `ps` is not permitted in the sandbox, no background process was started by this step.

- **Phase 3 test-first scope**: all pure `core`; inline: gap row 123 and its comment. Discriminator for a wallet is the drawing (`visual.kind === 'money'` with `pay`), for select `task.input === 'select'`. Old saved examples (numeric `given`, `number[]` answer) untouched. Flaky e2e spec above: not investigated further (out of slice); candidate follow-up.
