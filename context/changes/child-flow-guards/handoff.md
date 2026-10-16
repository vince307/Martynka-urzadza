# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-tdd` step for phase 2 of run 2026-10-16-audit-sweep. Phases 1 (`d3ba8bb`) and 2 (`ae03a52`) are
committed; phases 3-14 are open. Keep the save format v4 and the rng use of a successful draw unchanged; in phase 4 the
`variantCounted` reset belongs in `TaskScene.applyRound` (review F1).

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | 4 docs + `d3ba8bb` (p1) + `ae03a52` `feat(child-flow-guards): Review step shares, guards and the progress preview (p2)` + handoffs |
| Pushed / PR / merged | no / no / no |
| `change.md` status | left `plan_reviewed` (orchestrator's) |
| `## Progress` rows remaining | phase 2: `[reviewer]` 2.5, `[visual]` 2.6, `[human]` 2.7; phases 3-14 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/curriculum.ts` | `reviewWeights`; `stepPlayable(step, stage?)`; `unlockReady` null on a review step; named `RangeError` in `buildAdaptiveRound` |
| `src/core/progress.ts` | `progressView(..., previous?)` ranks previous-stage misses dated since the current stage began |
| `src/scenes/UIScene.ts` | passes the previous stage (gap 122 comment) |
| `docs/design-gaps.md` | row 122 |
| `tests/reviewGuards.test.ts` | 11 new tests; `tests/review.test.ts` share test rewritten to 10 % on purpose |

## 3. Verification

| command | result |
|---|---|
| RED (stub `reviewWeights` identity) | `AssertionError: expected { current: 60, earlier: 30, …(1) } to deeply equal { current: 90, earlier: +0, …(1) }`; also `expected 3 to be null` (unlockReady), `expected 'E6.1.time_units' to be 'E5.1.add_sub_100_units'` (progress), `No playable skills in any bucket` vs the named message |
| GREEN | reviewGuards + review + progress tests pass |
| Break 1: `reviewWeights` returns `w` | red: `expected 0.14075 to be less than 0.12`, `expected 0.1505 to be less than 0.13`; restored |
| Break 2: review branch removed from `unlockReady` | red: `expected 3 to be null`; restored |
| Meta-check | break 1 is caught by the seeded share tests (pick level and whole round), not the UI; break 2 by the synthetic stage only |
| lint / typecheck | OK / OK |
| unit | Tests 3155 passed = p1 branch 3144 + 11; deploy scripts OK; `sample` E1-E6 OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 125 passed = baseline 125 + 0 |

## 4. Next command

`/10x-tdd child-flow-guards phase 3`

## 5. Open

- Manual rows (human checklist): 2.7 `[human]` accept the E6.11 review share 90/10; 5.7 `[human]` accept the wallet line
  wording (gap 124); 6.7 `[human]` accept the COMPARE_QTY tile order (gap 125); 9.5 `[human]` tablet check that "OK" is
  inert while a coin or a clock hand is held; 14.4 `[human]` puzzle closed before "Dalej" is not paid again;
  `[visual]` 2.6, 3.6, 5.6, 6.6, 10.5 at 1440 (1920×1080 fit) and 1024×768; `[reviewer]` 1.5, 2.5.
- DESIGN-GAP rows still to add: 123 (list answers as text), 124 (wallet line), 125 (COMPARE_QTY order); 122 is done.
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
