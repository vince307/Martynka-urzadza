# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-tdd` step for phase 7 of run 2026-10-16-audit-sweep. Phases 1 (`d3ba8bb`), 2 (`ae03a52`), 3 (`b4b6076`), 4 (`7fad790`), 5 (`fbee812`), 6 (`f6abb19`) and 7 (`1be8a78`) are
committed; phases 8-14 are open. Keep the save format v4.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | docs + p1 `d3ba8bb` + p2 `ae03a52` + p3 `b4b6076` + p4 `7fad790` + p5 `fbee812` + p6 `f6abb19` + p7 `1be8a78` `feat(child-flow-guards): Bounded generator loops and parser bounds (p7)` + handoffs |
| Pushed / PR / merged | no / no / no |
| `change.md` status | left `plan_reviewed` (orchestrator's) |
| `## Progress` rows remaining | phase 7: 7.5 `[reviewer]`; phase 6: 6.5-6.7; phase 5: 5.5-5.7; phase 4: `[reviewer]` 4.4; phase 3: 3.5, 3.6; phase 2: 2.5-2.7; phases 8-14 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/retry.ts` | new `drawUntil(label, draw, ok, max = 1000)`, `RangeError` `${label}: no draw in ${max} tries` |
| `src/core/tasks/generators/{perimeter,puzzleGrid,placeValue,rounding,compareDiff,factFamily,written}.ts` | rejection loops now `drawUntil` (same rng consumption); factFamily swap was an extra unbounded loop found by the 7.5 grep |
| `src/core/tasks/generators/evenOdd.ts` | two fill loops keep their shape with a `MAX_ATTEMPTS` counter and a `RangeError` |
| `src/core/tasks/generators/shapes.ts` | `all` throws `RangeError` when fewer distinct wrong faces than needed |
| `src/core/tasks/written.ts` | `columnSteps` throws `RangeError` when a borrow passes the top column |
| `src/core/tasks/generators/clockElapsed.ts` | `fill` exported; `swap` throws on an unknown placeholder, naming it and the template |
| `src/core/tasks/generators/placeValue.ts` | `thousands` low bound of `max` is 1001 |
| `src/core/tasks/generators/compareNum.ts` | first-difference hint loop bounded (a == b would have looped forever) |
| tests | `tests/retry.test.ts` (new), `tests/shapesTiles.test.ts` (too few faces), `tests/written.test.ts` (`columnSteps` a < b), `tests/clockElapsed.test.ts` (template placeholders + `fill` throw), `tests/placeValue.test.ts` (`thousands` max 1000) |

## 3. Verification

| command | result |
|---|---|
| RED (stub `drawUntil` returning the first draw) | `AssertionError: expected 1 to be 3`; `expected function to throw an error, but it didn't` (shapes all, placeValue thousands 1000, written a < b); `fill` unknown placeholder `expected [Function] to throw an error`; 8 failed, 65 passed |
| GREEN | full suite Tests 3186 passed (p6 3175, +11) |
| Break 1: `drawUntil` loop bound `max * 100` | retry tests red by assertion (`drawUntil kept drawing: 7 calls`, `expected error to be instance of RangeError`); restored |
| Break 2: SHAPES `all` throw disabled | shapesTiles test red (`expected function to throw an error, but it didn't`); restored |
| Meta-check | the retry test's draw throws after `max + 1` calls so a missing cap fails by assertion, not by hang; the unchanged-draws claim is proven by `npm run sample -- E1..E6 --seed 7 --count 6` being byte-identical before and after (and the 1000-draw replay tests green), the new tests prove only the bound |
| lint / typecheck | OK / OK; deploy scripts OK; `sample` E1-E6 OK; build OK, `e2e hook: absent (2 chunks checked)` |
| teacher read | no task text changed: sample output E1-E6 (seed 7, 6 per step) identical to the pre-change run, so every changed generator's tasks read as before |
| e2e `--workers=4` | 125 passed (10.3m) = baseline + 0 (ran before the one-line `compareNum` guard; that guard only adds a throw on an unreachable a == b and is covered by the full unit suite, lint, typecheck) |

## 4. Next command

`/10x-tdd child-flow-guards phase 8`

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
