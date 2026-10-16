# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-tdd` step for phase 6 of run 2026-10-16-audit-sweep. Phases 1 (`d3ba8bb`), 2 (`ae03a52`), 3 (`b4b6076`), 4 (`7fad790`), 5 (`fbee812`) and 6 (`f6abb19`) are
committed; phases 7-14 are open. Keep the save format v4.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | docs + p1 `d3ba8bb` + p2 `ae03a52` + p3 `b4b6076` + p4 `7fad790` + p5 `fbee812` + p6 `f6abb19` `test(child-flow-guards): COMPARE_QTY tile order and a first hint for every skill (p6)` + handoffs |
| Pushed / PR / merged | no / no / no |
| `change.md` status | left `plan_reviewed` (orchestrator's) |
| `## Progress` rows remaining | phase 6: 6.5 `[reviewer]`, 6.6 `[visual]`, 6.7 `[human]`; phase 5: 5.5-5.7; phase 4: `[reviewer]` 4.4; phase 3: 3.5, 3.6; phase 2: 2.5-2.7; phases 7-14 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/generators/compareQty.ts` | `choices: [left, same, right]`, no shuffle (PIC-06, gap 125) |
| `src/core/tasks/generators/half.ts`, `src/data/pl.ts` | HALF hint `[halfMethodHint, "n : 2 = h", "h + h = n"]`; `tasks.halfMethodHint` "Połowa to jedna z dwóch równych części." (no digit, so it never ends with the answer) |
| `docs/design-gaps.md` | row 125 |
| tests | `tests/compareQty.test.ts` (exact tile order), `tests/hints.test.ts` (HALF method line, per-skill tally with `SUPPRESSED_OK`; old "HALF first hint is null" test replaced) |

## 3. Verification

| command | result |
|---|---|
| RED | `AssertionError: E1.1.compare_qty_5 seed=1 draw=0 ...: expected [ Array(3) ] to deeply equal [ Array(3) ]`; `AssertionError: E3.10.half_30 never shows 50 of 50 first hints: expected 50 to be +0`; `E3.10.half_30 seed 0: expected null to be '2 : 2 = 1'` |
| GREEN | full suite: Tests 3175 passed (p5 3174 + 1: the HALF test replaced one, the tally test is new) |
| Break 1: shuffle re-added | compareQty order test red (2 draws tests); restored |
| Break 2: HALF method line moved last | hints test red (`E3.10.half_30 never shows 50 of 50`); restored |
| Meta-check | both prove the generated content (choices array, hint order), not how the tile row or the bar draws it (6.6 visual) |
| lint / typecheck | OK / OK; deploy scripts OK; `sample` E1-E6 OK; build OK, `e2e hook: absent (2 chunks checked)` |
| teacher read | E1.1 COMPARE_QTY: tiles "Po lewej / Tyle samo / Po prawej", prompts and hints unchanged, agreement right (1 klucz, 4 naklejki, 7 gruszek). E3.10.half_30: "Ile to jest połowa liczby 18?", hints "Połowa to jedna z dwóch równych części." / "18 : 2 = 9" / "9 + 9 = 18"; first hint teaches the idea without the result, correct Polish |
| e2e `--workers=4` | 125 passed (10.6m) = baseline + 0 |

## 4. Next command

`/10x-tdd child-flow-guards phase 7`

## 5. Open


- Manual rows (human checklist): 2.7 `[human]` accept the E6.11 review share 90/10; 5.7 `[human]` accept the wallet line
  wording (gap 124); 6.7 `[human]` accept the COMPARE_QTY tile order (gap 125); 9.5 `[human]` tablet check that "OK" is
  inert while a coin or a clock hand is held; 14.4 `[human]` puzzle closed before "Dalej" is not paid again;
  `[visual]` 2.6, 3.6, 5.6, 6.6, 10.5 at 1440 (1920×1080 fit) and 1024×768; `[reviewer]` 1.5, 2.5, 3.5; `[visual]` 3.6.
- DESIGN-GAP rows: 122-125 are done.
- Teacher read rows: 7.3 (every stage with a changed generator type).
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
