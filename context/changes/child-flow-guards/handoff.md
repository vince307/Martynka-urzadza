# Handoff — `child-flow-guards` (slice fix:child-flow-guards)

Written by the `/10x-tdd` step for phase 5 of run 2026-10-16-audit-sweep. Phases 1 (`d3ba8bb`), 2 (`ae03a52`), 3 (`b4b6076`), 4 (`7fad790`) and 5 (`fbee812`) are
committed; phases 6-14 are open. Keep the save format v4.

## 1. State

| | |
|---|---|
| Branch | `feat/child-flow-guards`, cut from `main` at `9b7fe37` |
| Commits | docs + p1 `d3ba8bb` + p2 `ae03a52` + p3 `b4b6076` + p4 `7fad790` + p5 `fbee812` `feat(child-flow-guards): A calm reason line for a wallet with too many coins (p5)` + handoffs |
| Pushed / PR / merged | no / no / no |
| `change.md` status | left `plan_reviewed` (orchestrator's) |
| `## Progress` rows remaining | phase 5: 5.5 `[reviewer]`, 5.6 `[visual]`, 5.7 `[human]`; phase 4: `[reviewer]` 4.4; phase 3: 3.5, 3.6; phase 2: 2.5-2.7; phases 6-14 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/types.ts` | `Task.feedback?: (input) => string \| null` (never decides right/wrong; `check` stays boolean) |
| `src/core/round.ts` | `RoundState.notes` per task, `captureNote` sets it on the first miss |
| `src/core/round/view.ts`, `src/core/narration/spoken.ts` | `second` bar and narration use `notes[index] ?? firstHint` |
| `src/core/tasks/generators/moneyPay.ts` | `tooManyCoins` feedback, `fewest` variant only; no rng call added |
| `src/data/pl.ts`, `docs/design-gaps.md` | `tasks.moneyPayTooManyCoins`, DESIGN-GAP 124 (comment + row) |
| tests | `tests/moneyPay.test.ts` (3 PIC-05 tests), `tests/roundView.test.ts`, `tests/spoken.test.ts` (1 each) |

## 3. Verification

| command | result |
|---|---|
| RED | `AssertionError: expected undefined to be 'Kwota się zgadza. Spróbuj zapłacić mn…'` (moneyPay); view: `expected { kind: 'hint', line: '2 + 3' } to deeply equal …`; spoken: `expected 'Spróbuj jeszcze raz. Oblicz. dziewięć…' to be 'Spróbuj jeszcze raz. Kwota…'` |
| GREEN | 3 files, 72 passed |
| Break 1: `barOf` without `notes` | roundView PIC-05 test red; restored |
| Break 2: feedback ignores length/sum | moneyPay PIC-05 test red; restored |
| Meta-check | proves the rule and bar selection, not how `FeedbackBar` renders (5.6 visual) |
| lint / typecheck | OK / OK |
| unit | Tests 3174 passed = p4 3169 + 5; deploy scripts OK; `sample` E1-E6 OK |
| teacher read | E1.11 / E2.2 money_pay read, tasks unchanged, line calm and correct Polish |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e `--workers=4` | 125 passed (9.9m) |

## 4. Next command

`/10x-tdd child-flow-guards phase 6`

## 5. Open


- Manual rows (human checklist): 2.7 `[human]` accept the E6.11 review share 90/10; 5.7 `[human]` accept the wallet line
  wording (gap 124); 6.7 `[human]` accept the COMPARE_QTY tile order (gap 125); 9.5 `[human]` tablet check that "OK" is
  inert while a coin or a clock hand is held; 14.4 `[human]` puzzle closed before "Dalej" is not paid again;
  `[visual]` 2.6, 3.6, 5.6, 6.6, 10.5 at 1440 (1920×1080 fit) and 1024×768; `[reviewer]` 1.5, 2.5, 3.5; `[visual]` 3.6.
- DESIGN-GAP rows still to add: 125 (COMPARE_QTY order); 122-124 are done.
- Teacher read rows: 5.3 (E1.11, E2.2), 6.3 (COMPARE_QTY, E3.10 HALF), 7.3 (every stage with a changed generator type).
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
