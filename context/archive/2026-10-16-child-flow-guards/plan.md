# Child-flow guards for tasks, widgets and gestures — Implementation Plan

## Overview

Slice 1 of the audit sweep 2026-10-16 (non-roadmap fix, autonomous run `2026-10-16-audit-sweep`): every place found by
the observability audits where a child can get stuck, loop, be paid twice, see a task the round cannot show, or where a
failure stays silent in tasks, widgets and gestures. Scope = `change.md` § Findings: 21 MEDIUM ids (PIC-01..06,
TXT-01..04, GRD-02..05, WNA-01..04, SV2-10, G-4, S13-06) and 16 LOW ids (S13-11, S13-12, S13-14, S14-09, S14-10,
GRD-01, GRD-06..08, WNA-05..07, WNA-10, TXT-05, TXT-07, TXT-08), plus the HALF first-hint content bug found by research
(`E3.10.half_30`). Deferred with triggers: GRD-09 (drawing part), WNA-08, WNA-09, TXT-06.

**Save format stays v4** (`SAVE_VERSION` 4 in `src/core/save.ts`): PIC-04 writes a string into the existing
`MistakeExample.given`; SV2-10 changes only *when* `variants` is written. A phase that finds it would need a format
change stops and reports it (`STATUS: BLOCKED`).

## Current State Analysis

Grounded in `research.md` (Code References are the source; not re-searched) and re-checked on this branch at `767c45e`:

- `src/core/curriculum.ts` `buildAdaptiveRound`: the art filter (`src/core/round/artFilter.ts` `artBlocked`, no ORDINAL
  case) uses `buckets.current.length`, the picture filter (`src/core/round/pictureFilter.ts` `withPictures`) gets
  `unlockThreshold(afterArt.current.length, …)` (PIC-03); `art.missingIds` filters skills only, never the drawn task
  (G-4). `skillBuckets` review branch returns `earlier: []` (TXT-01: E6.11 draws ≈ 14 % E5, 60 % under easing, pinned
  by `tests/review.test.ts` "about 14 % E5"); `unlockReady` on a review step is ready at once (TXT-04);
  `stepPlayable` admits a review-only stage that later throws `RangeError('No playable skills in any bucket')` in
  `src/core/round/pick.ts` without stage/step (TXT-05). `src/core/progress.ts` `progressView` sees the current stage only.
- `src/core/round.ts` `captureFirstWrong` keeps number/string inputs only (PIC-04/S13-06); `exampleAnswer` prints a
  MONEY_PAY answer as raw grosze.
- `src/scenes/TaskScene.ts`: `submit` → `syncStars` writes stars at answer time; `finishRound` → `finishVariant` →
  `countRound` (→ `src/core/variants.ts` `afterRound`, not idempotent) only at "Dalej" (SV2-10). Every variant round
  (puzzle, word, dice) is built by `startRound` and answered through `submit`. `reported` is never cleared at a new round
  (fired follow-up, same file).
- `src/core/tasks/generators/moneyPay.ts` `walletCheck` returns a bare boolean; `Task.check` is read by truthiness in
  five places and must stay boolean (PIC-05). `compareQty.ts` shuffles the three tiles with the generator's last rng call
  (PIC-06). `half.ts` puts `${n} : 2 = ${half}` first in the hint, so `E3.10.half_30` never shows a first hint
  (TXT-02 test `tests/hints.test.ts` `if (first === null) continue` hides it).
- Unbounded loops: `perimeter.ts` (3), `puzzleGrid.ts` (1), `placeValue.ts`, `rounding.ts`, `compareDiff.ts`,
  `evenOdd.ts` (2), `written.ts` generator `draw`; `shapes.ts` `all` silently returns fewer faces; `written.ts`
  `columnSteps` borrow walks past the top column (NaN); `clockElapsed.ts` `values[key] ?? ''`; `placeValue.ts` parser
  accepts `thousands` max 1000 (every draw throws).
- `src/core/round/canonicalInput.ts` returns `task.answer` unchecked for tiles/keypad. **Probe on this branch** (scratch
  script, 20 seeds × 50 draws, every generator skill): 41 277 tile-string, 23 723 tile-number and 108 000 keypad tasks;
  **zero** skills where no tile passes or a keypad answer is negative, fractional, a string, over
  `balance.keypad.maxDigits` (7) or refused by `check` — the stricter oracle exposes no current skill.
- `src/core/round/pictureLayout.ts` `tallOf` throws for drag/select/digits without the skill id; `validateTask` misses
  select + tall drawing (WNA-01/02); `TaskScene.render` silently drops `hintVisual` when the task has its own drawing
  (WNA-03).
- Gestures: `src/ui/widgets/CoinWallet.ts` "OK" checks no carry (PIC-02); `src/core/clockSet.ts` `stepClockSet` lets a
  second pointer's `down` restore the pose (GRD-02); `TaskScene.create` `lift` and the `pointerupoutside` listener send
  `{ type: 'cancel' }` without `pointerId` (GRD-03). Phaser 4.2.1 has one touch pointer (`input.activePointers` 1;
  `src/main.ts` sets none), so a second finger never reaches a scene on a touch-only tablet: no two-finger e2e can go red
  first; the defects are reachable with mouse + touch.
- Layout: `TASK_LAYOUT.figure.minCell` (36) declared, never read; `NumberCells`/`CoordGrid` scale with no floor;
  `SolutionSteps.show` clamps to `minScale` even when `fits` (already a Phaser-measured rule) is false, and the drawing
  branch of `TaskScene.render` never asks `fits` (GRD-04/WNA-04).
- Widgets trust their input: `images[i]?.show` in `IconGroups`, `IconRow`, `MoneyTable`, `Jugs`; `coinMm` string-keyed
  with `?? 20`; `TaskPicture` `Partial<Record>` + `?? null`; `WrittenColumn` `if (col >= v.columns) continue`;
  `NumberLine` ticks without a guard; `ClockFace` and `clockSetLayout` compute the dial twice; `snap ?? 60`;
  ~15 boolean `view.input === '…'` checks in `TaskScene.render`; `src/testing/e2eHook.ts` `forcedSkills` returns null
  on an unknown id.
- `docs/design-gaps.md` ends at row 121. `context/foundation/lessons.md` does not exist (nothing to apply).
- Baseline (contract, main `9b7fe37`, inherited): unit `Tests 3139 passed`, e2e `125 passed`. Every phase measures its own
  branch baseline and writes `baseline + delta`.

## Desired End State

- A round never shows a task whose answer lives only in a picture that did not load (ORDINAL blocked; partial loss
  redrawn up to `balance.round.artRetries` times, then the stand-in as today); E1.11 in picture mode can unlock with art
  missing.
- The year review step E6.11 draws ≈ 90 % E6 / 10 % E5 (easing 70/30), never unlocks "at once", a review-only stage
  fails with a message naming stage and step; the parent's progress preview also ranks previous-stage skills.
- Every first-try miss leaves a mistake example, wallets and select answers as readable text (`"2 zł, 2 zł, 1 zł"`).
- A daily puzzle or minigame is recorded at its last answer: closing the game before "Dalej" never pays ×2 again.
- A wallet with the right sum but more coins than needed gets one calm reason line; COMPARE_QTY tiles keep the order
  "Po lewej · Tyle samo · Po prawej"; every skill with ≥ 2 hint lines shows its first hint (HALF fixed).
- No generator loop can hang: every retry is bounded and throws a `RangeError` naming type and params; infeasible params
  are refused by the parser.
- The test oracle refuses a tile or keypad answer the widget cannot produce; the validator refuses a tall drawing in
  select/drag/digits and a hint drawing on a task with its own drawing; layout errors name the skill.
- "OK" never fires while a coin or a clock hand is carried; a second pointer cannot undo the clock; a cancel carries its
  pointer id.
- Drawn cells never fall below `minCell`; solution lines that do not fit are signalled (console + e2e hook), not hidden.
- Widgets throw on input over their pool instead of drawing a short picture; dial geometry has one source.
- Verify: unit tests per phase (red first), the full local gate, e2e `+ 0` per code phase and `+ 2` in phase 14.

### Key Discoveries:

- The redraw point for G-4 is the `generate` closure `buildAdaptiveRound` hands to `distinctTasks` — the only place
  holding both `missing` and the rng (research § G-4); `pick.ts` and `unique.ts` stay unchanged.
- `Task.check` must stay boolean (five truthiness readers); a reason is a separate `Task.feedback` that never decides.
- `stepTrayDrag` deliberately cancels on a second finger's `down` (`tests/trayDrag.test.ts` "a second finger cancels the
  carry and changes nothing"): harmless because the mat is unchanged; the clock must not restore its pose instead.
- `SolutionSteps.fits` is already a measured rule (Phaser text metrics), so WNA-04 needs a signal, not a heuristic.
- `REGISTRY_KEYS.variants` is in `SAVE_KEYS` (`src/data/layout.ts`): an earlier `countRound` rides the same debounced
  write as the stars.

## What We're NOT Doing

- No save-format change (v4 stays); GRD-09 drawing description beside a mistake example (needs v5) — deferred.
- WNA-08 (`Task.input` required), WNA-09 (nudge on empty digit boxes), TXT-06 (skill id on the error card) — deferred,
  each with a trigger in `follow-ups/review-fixes.md`.
- No two-finger e2e (Phaser drops the second touch); no change to `input.activePointers`; the letterbox-thumb risk is a
  follow-up with a `[human]` tablet trigger.
- No dedup of `placeValue.ts`/`clockElapsed.ts` helpers, no shared `ArtPool`/`fitRect`, no `grosze(id)` lookup fold, no
  drawn-wallet look change (VO3) — fired follow-ups carried with their triggers.
- No change to `tests/trayDrag.test.ts`'s "second finger cancels" rule (tray and clock stay different on purpose).
- No new view, no new widget beyond the pure helpers named below; no change under `deploy/`.

## Implementation Approach

Pure rule in `src/core` first with a failing unit test, then the one widget/scene call site, phase by phase, grouped by
the code each phase touches so every phase is green alone. Content-changing phases (5, 6, 7) carry the teacher read.
Player-visible changes carry a DESIGN-GAP row (122-125, numbered in phase order) and a `[visual]` row. Phase 13 sweeps
seams and updates `CLAUDE.md`; phase 14 proves the two browser-level risks.

## Critical Implementation Details

- **Same-seed rounds.** Only TXT-01 (E6.11 rounds), G-4 (only when art is missing) and PIC-06 (the removed shuffle was
  the generator's last rng call, so later tasks of a fixed-seed round shift) may change a seeded round. Loop caps must
  consume the rng exactly as today when the draw succeeds within the cap — the 1000-draw replay tests prove it. Any other
  seeded-test diff is a regression.
- **SV2-10 ordering.** `afterRound` is not idempotent (it would append the puzzle id twice): the count at the last answer
  sets a per-round `variantCounted` flag that `finishVariant` honours, and the flag resets in `applyRound` — the one
  place a built round becomes the open one (called from `create`, `beginRound` and `applyParentStage`; a reset in
  `beginRound` alone would leave the flag set when a parent changes the stage after the last answer, and the next
  variant round would never be counted — plan review F1).
- **Cancel shape.** `ClockSetEvent` and `TrayDragEvent` (aliased by `BlockDragEvent`) change their `cancel` together
  (`{ type: 'cancel'; pointerId?: number }`); scene-internal cancels (drag off, input suspend) keep no id and still
  cancel any carry.

## Phase 1: Art-aware round draw (PIC-01, PIC-03, G-4)

Driver: tdd
Driver why: the art filter, the picture threshold and the redraw are pure `core` functions over a `missingIds` set with exact seeded oracles — failing tests lead them.

### Overview

A round on missing art never needs the missing picture to be answered, and the picture-mode threshold of a step is the
step's own, not the art-filtered one.

### Changes Required:

#### 1. ORDINAL in the art filter

**File**: `src/core/round/artFilter.ts` (`artBlocked`)

**Intent**: An ORDINAL skill is blocked when fewer `ICONS` are loaded than its row needs.

**Contract**: `case 'ORDINAL'`: blocked when `ICONS.filter((id) => !missing.has(id)).length < parseOrdinalParams(skill.params).max`;
empty `missingIds` keeps the early return (no rng change).

#### 2. Picture threshold from the step

**File**: `src/core/curriculum.ts` (`buildAdaptiveRound`)

**Intent**: `withPictures` gets `unlockThreshold(buckets.current.length, …)` (keep the `currentGroups ? 1` branch).

**Contract**: no signature change; `afterArt === buckets` when nothing is missing.

#### 3. Redraw a task that names missing art

**File**: `src/core/tasks/visual.ts` (new `visualArtIds(v: TaskVisual): readonly string[]` beside `visualKey`, a `switch`
with a `never` default: `icons.icon`, `row.icons`, `scale.item`/`scale.weights`, `money.items`, `pay.tray`, `jugs`;
drawn-in-code kinds return `[]`; the shared frames `balance-scale` and `thermometer-frame` are NOT listed — every
scale/thermometer task uses them, so a redraw cannot avoid them and would only burn the retries; their loss stays with
the existing stand-in and the "Obrazki" line); `src/core/curriculum.ts` (`buildAdaptiveRound` `generate` closure);
`src/data/balance.ts` (`round.artRetries: 8` with a comment)

**Intent**: When `missing.size > 0`, a drawn task whose `visualArtIds` (and `hintVisual`'s) meet `missing` is redrawn up
to `artRetries` times; exhausted → keep the last task (stand-in box as today), never throw, never shorten the round.
Warm-up and variant rounds unchanged.

**Contract**: rng use unchanged when `missing` is empty.

#### 4. Tests

**File**: `tests/artFilter.test.ts`, `tests/pictureMode.test.ts`, new cases in `tests/visual.test.ts`

**Contract**: ORDINAL with fewer than `max` icons loaded → blocked, with one icon missing → not blocked; E1 learner on
step 11, coin/note/weight ids missing, picture mode on, 200 seeds → at least `unlockThreshold` distinct E1.11 skills
drawn; E1 step 2 with `key` missing, 100 seeds → no task's `visualArtIds` contains `key`; `visualArtIds` per kind; a
round with nothing missing equals today's round for the same seed.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `withPictures` threshold back to `afterArt.current.length` → the E1.11 test red; the redraw guard removed → the `key` test red; each restored; meta-check: proves the draw rule over seeds, not the loader that fills `missingIds`
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`)
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] `visualArtIds` switch ends in a `never` guard; `src/core` has no Phaser import; `pick.ts`/`unique.ts` untouched

---

## Phase 2: Review step shares, guards and the progress preview (TXT-01, TXT-04, TXT-05)

Driver: tdd
Driver why: bucket weights, the unlock rule, playability and the progress ranking are pure `core` functions with exact oracles — failing tests lead them; the scene only passes one more argument.

### Overview

The year review step draws like any step (~10 % previous stage), cannot unlock at once, a review-only stage fails with a
clear message, and the parent sees weak previous-stage skills too.

### Changes Required:

#### 1. Review weights

**File**: `src/core/curriculum.ts` (`skillBuckets` caller / `buildAdaptiveRound`); `src/core/round/pick.ts` only if the weights pass through it

**Intent**: Pure `reviewWeights(w)` folds `earlier` into `current` when `pools.currentGroups` is set: normal 90/10,
easing 70/30 (`docs/ZADANIA.md` "~10% powtórka z poprzedniego etapu").

**Contract**: other steps' weights unchanged; `tests/review.test.ts` "about 14 % E5" rewritten on purpose to ≈ 10 % (and
≈ 30 % under easing), tolerance as today.

#### 2. Review unlock and playability

**File**: `src/core/curriculum.ts` (`unlockReady`, `stepPlayable`, `buildAdaptiveRound`)

**Intent**: `unlockReady` returns null on a review step; `stepPlayable` counts a review step only when a non-review step
of the stage is playable; `buildAdaptiveRound` throws `No playable skills for stage <id> step <n>` before picking.

**Contract**: content invariant "every review step is its stage's last step" in `tests/curriculum.test.ts`; synthetic
stages: review at step 2 of 3 → `unlockReady` null; review-only stage → not playable / the named throw.

#### 3. Previous-stage skills in the progress preview

**File**: `src/core/progress.ts` (`progressView(stage, …, previous?: StageDef)`); `src/scenes/UIScene.ts` (`openSettings` passes the previous stage); `docs/design-gaps.md` row **122**

**Intent**: Rank previous-stage skills with first-try misses dated at or after the earliest current-stage history entry,
same ranking and `weakestCount`, labelled with their own step title.

**Contract**: no new saved field; without `previous` the view is unchanged (`tests/progress.test.ts` "ignores history
of another stage" stays for that call); DESIGN-GAP 122 comment at the call site ("the kit's progress preview lists the
current stage only").

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `reviewWeights` returning `w` → the 10 % test red; `unlockReady` without the review branch → the synthetic test red; each restored; meta-check: proves the weights over seeds, not the round UI
- Full local gate green; build prints `e2e hook: absent (`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `review-round.spec.ts` green

#### Manual Verification:

- [reviewer] DESIGN-GAP 122 row and comment present; no Polish text in `src/core`
- [visual] Parent progress preview with a weak E5 skill while on E6.11 (hook build, `?e2eSkills` rounds), at 1440 (1920×1080 fit) and 1024×768
- [human] Accept the E6.11 review share 90/10 (easing 70/30) instead of S-14c's ≈ 14 % (`docs/ZADANIA.md` gives ~10 % for ordinary steps and is silent on the review step)

---

## Phase 3: Mistake examples for list answers (PIC-04, S13-06)

Driver: tdd
Driver why: the example text is a pure function of the task and the input with exact strings — a failing round test leads it.

### Overview

A first-try miss on a wallet (MONEY_PAY) or a select task (SHAPES `all`) leaves an example in the existing `given`
string field; the model answer of a wallet prints as money.

### Changes Required:

#### 1. Example value

**File**: `src/core/round.ts` (new pure `exampleValue(task, value): number | string | null`; `captureFirstWrong`, `exampleAnswer`); `docs/design-gaps.md` row **123**

**Intent**: Money pay → `formatMoney` (`src/core/text/measure.ts`) of each coin, sorted descending, joined by ", ";
select → the faces' text in `task.choices` order joined by ", "; number/string unchanged.

**Contract**: `MistakeExample.given` stays `number | string` (v4); `src/ui/dom/progressView.ts` renders via `textContent`
as today; DESIGN-GAP 123 ("the kit shows no list answer in the progress preview").

#### 2. Tests

**File**: `tests/round.test.ts`, `tests/save.test.ts`, `tests/progress.test.ts`

**Contract**: wrong wallet `[100, 200, 200]` → `'2 zł, 2 zł, 1 zł'`; wrong select → face words; a v4 save with such an
example round-trips; an old numeric example still renders, and so does an old wallet example whose `answer` is the
legacy `number[]` of grosze (already-saved v4 data keeps that shape; only new examples carry the string).

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `captureFirstWrong` back to number/string only → the wallet test red; restored; meta-check: proves capture and text, not the panel layout
- `git diff --stat tests/fixtures` empty (no fixture change); `SAVE_VERSION` still 4
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] DESIGN-GAP 123 row and comment present; `validExample` in `src/core/save.ts` unchanged
- [visual] Parent progress preview with a wallet example and a shapes example, at 1440 (1920×1080 fit) and 1024×768

---

## Phase 4: A variant round is counted at its last answer (SV2-10)

Driver: tdd
Driver why: "the last task just settled" is a pure predicate over two round states with an exact oracle; the scene wiring is pinned by a source test like `tests/freshRoundWiring.test.ts`.

### Overview

The daily puzzle (and a minigame) records `puzzleDay`/`roundsSince` in the same write as its stars, so closing the game
before "Dalej" cannot replay the ×2 puzzle the same day.

### Changes Required:

#### 1. Predicate

**File**: `src/core/round.ts` (new `lastTaskSettled(prior: RoundState, next: RoundState): boolean`)

**Contract**: true only when `next.phase === 'done'`, `prior.phase !== 'done'` and `next.index` is the last task.

#### 2. Scene wiring

**File**: `src/scenes/TaskScene.ts` (`submit`, `finishVariant`, `applyRound`; new private `variantCounted`)

**Intent**: In `submit`, a variant round (`this.kind !== 'round'`) whose last task just settled calls `countRound(this.kind)`
once, sets `variantCounted` and asks the saver for `flush('now')`; `finishVariant` skips `countRound` when counted (still
flushes); `applyRound` (not `beginRound`: `create` and `applyParentStage` also open a round through it) resets the flag
and clears `reported` (fired follow-up "reported never cleared at a new round").

**Contract**: ordinary rounds and the warm-up unchanged; `afterRound` called exactly once per variant round.

#### 3. Tests

**File**: `tests/round.test.ts` (`lastTaskSettled`: first-try, after hint, retype, not last task, already done); new
`tests/variantCountWiring.test.ts` (source test: `submit` calls `countRound` behind `lastTaskSettled`, `finishVariant`
checks the flag, `applyRound` resets flag and `reported`)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `finishVariant` ignoring the flag → the wiring test red; `lastTaskSettled` true on a retype step that is not done → the predicate test red; each restored; meta-check: proves the call order in source and the rule, not the saved bytes (phase 14)
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `daily-puzzle.spec.ts` and `minigames.spec.ts` green

#### Manual Verification:

- [reviewer] `afterRound` reachable once per variant round (read `submit`/`finishVariant`); `SAVE_VERSION` still 4; no change to the variant schedule rules

---

## Phase 5: A calm reason line for a wallet with too many coins (PIC-05)

Driver: tdd
Driver why: the feedback rule and the bar it selects are pure (`moneyPay` generator, `roundView`) with exact strings — failing tests lead them.

### Overview

On the "fewest coins" variant, a wallet with the right sum but more coins than needed shows one gentle line instead of
the generic first hint; stars, mastery and phases unchanged.

### Changes Required:

#### 1. Feedback contract

**File**: `src/core/tasks/types.ts` (`Task.feedback?: (input: TaskAnswer) => string | null` — never decides right/wrong);
`src/core/round.ts` (`RoundState` per-task `note`, set in `answer` on the first miss from `task.feedback`);
`src/core/round/view.ts` (`barOf` case `'second'`: `note ?? firstHint`); `src/core/narration/spoken.ts` (reads the same line)

#### 2. Generator and copy

**File**: `src/core/tasks/generators/moneyPay.ts` (`generateMoneyPay` sets `feedback` for the `fewest` variant only: right
sum, tray coins only, more coins than the fewest); `src/data/pl.ts` (new key under `pl.tasks`, draft
"Kwota się zgadza. Spróbuj zapłacić mniejszą liczbą monet.", DESIGN-GAP **124** comment); `docs/design-gaps.md` row 124

**Contract**: no rng call added; no "źle"/harsh word (`Martynka-urzadza.md` § 6 task screen).

#### 3. Tests

**File**: `tests/moneyPay.test.ts` (feedback returns the line for a same-sum longer wallet, null for a wrong sum and for the
plain variant); `tests/roundView.test.ts` (the `second` bar shows the note); `tests/spoken.test.ts` (spoken line)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `feedback` returning the line for a wrong sum → the moneyPay test red; `barOf` ignoring `note` → the view test red; each restored; meta-check: proves rule and bar selection, not how the bar renders
- Teacher read: `npm run sample -- E1 --count 6` and `npm run sample -- E2 --count 6`, every task of E1.11 and E2.2 read (numeral agreement, the line is calm and does not give the answer); recorded in the phase commit message body
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `money-pay.spec.ts` green

#### Manual Verification:

- [reviewer] `Task.check` still boolean in all five readers; DESIGN-GAP 124 row and comment present
- [visual] MONEY_PAY "fewest" task after a same-sum longer wallet (hook build, `?e2eSkills=E1.11.money_pay_10`), bar with the new line, at 1440 (1920×1080 fit) and 1024×768
- [human] Accept the wording of the new wallet line (gap 124; the kit has no such copy)

---

## Phase 6: COMPARE_QTY tile order and a first hint for every skill (PIC-06, TXT-02, HALF)

Driver: tdd
Driver why: the tile order and "a first hint is shown" are exact oracles over generated tasks — the new hint test goes red on `E3.10.half_30` before the HALF fix.

### Overview

COMPARE_QTY tiles keep a fixed spatial order; the hint test proves every skill with ≥ 2 hint lines shows its first hint;
HALF gets a method line first.

### Changes Required:

#### 1. Fixed tile order

**File**: `src/core/tasks/generators/compareQty.ts` (`generateCompareQty`: `choices: [left, same, right]`, no shuffle);
`tests/compareQty.test.ts` (exact order); `docs/design-gaps.md` row **125** + DESIGN-GAP comment ("the kit does not order
the three tiles; each side's tile under its group, 'Tyle samo' in the middle")

#### 2. Hint test

**File**: `tests/hints.test.ts`

**Intent**: Drop the try/catch (a throw fails with its message), tally per skill, assert `suppressed === 0` outside an
explicit `SUPPRESSED_OK: Record<skillId, reason>` (`E2.7.sequence_tens_100`, `E2.6.arrow_graph_20`,
`E2.6.arrow_table_20`: the "o 10" step equals the answer by phrasing) and no skill with `suppressed === multi > 0`.

#### 3. HALF hint

**File**: `src/core/tasks/generators/half.ts` (hint order: a method line first, e.g. "Połowa to podział na 2 równe
części." / the existing method line, the computed line `${n} : 2 = ${half}` after it)

**Contract**: no rng change; first hint never contains the result.

### Success Criteria:

#### Automated Verification:

- New hint test red on `E3.10.half_30` before the HALF fix (assertion), green after; unit `<branch baseline> + N`
- Deliberate break: re-add the shuffle → the order test red; move the HALF result line back first → the hint test red; each restored; meta-check: proves generated content, not how the bar shows it
- Teacher read: `npm run sample -- E1 --count 6` (COMPARE_QTY steps) and `npm run sample -- E3 --count 6` (E3.10), every task of the changed steps read; recorded in the phase commit message body
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `picture-tasks.spec.ts` green

#### Manual Verification:

- [reviewer] DESIGN-GAP 125 row and comment present; `SUPPRESSED_OK` holds only the three phrasing cases with a reason
- [visual] COMPARE_QTY task (tiles in the new order) and an E3.10 HALF task after one miss (first hint), at 1440 (1920×1080 fit) and 1024×768
- [human] Accept the fixed COMPARE_QTY tile order "Po lewej · Tyle samo · Po prawej" (gap 125; the kit is silent on the order)

---

## Phase 7: Bounded generator loops and parser bounds (GRD-05, S13-12, F9, SHAPES `all`, WNA-06, TXT-07, TXT-08)

Driver: tdd
Driver why: a bounded retry helper and parser bounds have exact throw oracles; an infinite loop can only fail a test by timeout, so the helper's own test leads.

### Overview

Every rejection loop in a generator is bounded and throws a `RangeError` naming type and params; infeasible params and
placeholders are refused.

### Changes Required:

#### 1. Retry helper

**File**: `src/core/tasks/retry.ts` (new `drawUntil<T>(label: string, draw: () => T, ok: (t: T) => boolean, max = 1000): T`)

**Contract**: calls `draw` until `ok`, at most `max` times, then `throw new RangeError(\`${label}: no draw in ${max} tries\`)`;
same rng consumption as the loops it replaces.

#### 2. Loops

**File**: `src/core/tasks/generators/{perimeter,puzzleGrid,placeValue,rounding,compareDiff,written}.ts` → `drawUntil`;
`evenOdd.ts` keeps its fill loops with a counter; `shapes.ts` `all` throws when too few distinct wrong faces (like
`chooseOp.ts`); `src/core/tasks/written.ts` `columnSteps` throws `RangeError` when the borrow passes the top column

#### 3. Data guards

**File**: `src/core/tasks/generators/clockElapsed.ts` (`swap` throws naming placeholder and template);
`src/core/tasks/generators/placeValue.ts` (`parsePlaceValueParams`: `thousands` max ≥ 1001)

#### 4. Tests

**File**: new `tests/retry.test.ts`; `tests/shapes.test.ts` (too few faces → throw); `tests/written.test.ts` (a < b
borrow → throw); `tests/clockElapsed.test.ts` (data test over `src/data/elapsed.ts`: end templates ⊆ {a, d}, span/toHour/night ⊆ {a, b}; unknown placeholder → throw); `tests/placeValue.test.ts` (`thousands` max 1000 → `TypeError`)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`; every existing 1000-draw replay test unchanged and green (same rng consumption)
- Deliberate break: `drawUntil` without the cap → its test red (the test counts `draw` calls with a never-ok predicate and a draw that throws after `max + 1` calls, so the break fails by assertion, not by a hang); `shapes` `all` without the throw → its test red; each restored; meta-check: the replay tests prove unchanged draws, the new tests prove the bound
- Teacher read: `npm run sample -- <stage> --count 6` for every stage with a skill of a changed type (E1–E6), every task of the changed steps read; drawn tasks unchanged; recorded in the phase commit message body
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] `grep -rn "while (true)\|for (;;)\|do {" src/core/tasks/generators` shows no unbounded loop left (each remaining loop has a counter); E5/E6 `thousands` params ≥ 1001

---

## Phase 8: Answer-mode oracle and validator rules (TXT-03/GRD-01, WNA-01/F6, WNA-02, WNA-03)

Driver: tdd
Driver why: oracle and validator rules are pure with exact rule names — failing tests on hand-built tasks lead them.

### Overview

`canonicalInput` refuses a tile or keypad answer the widget cannot produce; `validateTask` refuses a tall drawing in a
non-tall mode and a hint drawing on a drawn task; layout errors name the skill.

### Changes Required:

#### 1. Oracle

**File**: `src/core/round/canonicalInput.ts`

**Contract**: tiles → the first choice passing `check` or equal to the answer, else throw naming the skill; keypad →
throw unless a non-negative integer of at most `balance.keypad.maxDigits` digits and `check?.(answer) !== false`;
`undefined` → by `choices`. Probe at plan time: no current skill fails (20 × 50 draws).

#### 2. Validator mode rules

**File**: `src/core/tasks/visual.ts` (`TALL_MODES = ['tiles', 'keypad']` beside `visualShape`); `src/core/tasks/validate.ts`
(mode rules as one `switch` over `ANSWER_MODES` with a `never` default — F6; rule `mode` for a tall drawing outside
`TALL_MODES`; rule `hintVisual` for `hintVisual` with `visual`)

#### 3. Layout errors with the skill

**File**: `src/core/round/pictureLayout.ts` (`pictureLayout`, `answerSpans`, `hintPictureLayout`, `tallOf`: optional
`skillId` in the message); `src/scenes/TaskScene.ts` (`render` passes `task.skillId`)

#### 4. Tests

**File**: `tests/answerModes.test.ts` (tile answer not in choices, `check` no choice passes, keypad -1, 1.5, `'3'`,
8 digits → throw); `tests/solvableInMode.test.ts` "validateTask is aware of the answer mode" (select + thermometer →
`mode`); `tests/hintVisual.test.ts` (hint drawing + own drawing → `hintVisual`); `tests/pictureLayout.test.ts`
(`toThrow(/E9\.1\.x/)`)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`; `solvableInMode` green for every skill
- Deliberate break: keypad branch back to `return task.answer` → the keypad tests red; `TALL_MODES` with `select` → the validator test red; each restored; meta-check: proves the oracle and the rule, not the widgets
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] every `switch` over a mode ends in a `never` guard; no runtime path calls `canonicalInput`

---

## Phase 9: Gesture guards (PIC-02, GRD-02, GRD-03, F5)

Driver: tdd
Driver why: carry state, pointer ids and the raw-event mapping are pure reducers with exact oracles; two-finger e2e is infeasible (one Phaser touch pointer), so unit tests lead and prove.

### Overview

"OK" never submits while something is carried; a second pointer cannot undo the clock; every cancel names its pointer.

### Changes Required:

#### 1. Submit guard

**File**: `src/core/trayDrag.ts` (new `canSubmit(state: { carrying: unknown | null }): boolean`); `src/ui/widgets/CoinWallet.ts`
(`ok` callback); `src/scenes/TaskScene.ts` (`create`, the clock path uses the same helper)

#### 2. Clock second pointer

**File**: `src/core/clockSet.ts` (`stepClockSet`: `down` from another pointer while one carries is ignored; the same
pointer's `down` keeps today's S13-09 restart)

#### 3. Cancel with pointer id

**File**: `src/core/clockSet.ts` (`ClockSetEvent`), `src/core/trayDrag.ts` (`TrayDragEvent`; `BlockDragEvent` alias follows):
`{ type: 'cancel'; pointerId?: number }`, a mismatched id is ignored; new pure `rawToDragEvent(kind, p)` (in
`src/core/trayDrag.ts` or a new `src/core/dragEvents.ts`) used by all four `TaskScene.create` listeners, passing `p.id`
on `pointerupoutside` and `wasCanceled`

#### 4. Tests

**File**: `tests/clockSet.test.ts` (`down` of pointer 2 keeps the pose; cancel of pointer 2 keeps the carry; cancel
without id cancels); `tests/trayDrag.test.ts` (cancel with another id ignored; "a second finger cancels" unchanged;
`canSubmit`); new `tests/dragEvents.test.ts` (`rawToDragEvent` for down/move/up/upoutside/canceled); a
`freshRoundWiring`-style source test that the four listeners call `rawToDragEvent` and `CoinWallet`'s "OK" calls `canSubmit`

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `canSubmit` always true → its test red; `stepClockSet` `down` back to `grab(idle(state))` → the pointer-2 test red; each restored; meta-check: proves reducers and wiring in source, not Phaser's pointer delivery (one touch pointer)
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `clock-set.spec.ts` and `money-pay.spec.ts` green (single-finger `cancelTouch` still matches pointer 1)

#### Manual Verification:

- [reviewer] `tests/trayDrag.test.ts` "a second finger cancels the carry and changes nothing" unchanged; no Phaser import in `src/core`
- [human] Tablet (iPad with a trackpad or a mouse, or two fingers): "OK" while a coin or a clock hand is held does nothing; the hand keeps its place when another finger touches

---

## Phase 10: Drawing fit and a solution-overflow signal (GRD-04, WNA-04)

Driver: tdd
Driver why: cell scale and fit are pure geometry over every skill's real layout — a failing all-skills test leads; the text overflow uses the existing measured `fits` rule.

### Overview

Cells of a drawn grid never fall below `minCell`; solution lines that overflow even at `minScale` raise a signal instead
of hiding.

### Changes Required:

#### 1. Pure drawing fit

**File**: new `src/core/round/drawingFit.ts` (move `cellPositions` from `src/ui/widgets/NumberCells.ts`; `cellsScale`,
`coordScale`, `drawingFit(visual, rect)` as a `switch` over `TaskVisual['kind']` with a `never` default — figure, cells,
grid checked against `minCell`, other kinds `true`); `src/data/layout.ts` (`minScale` in `TASK_LAYOUT.cells`/`coord`);
`src/ui/widgets/NumberCells.ts`, `CoordGrid.ts` (call the helpers; `figureLayout` reads `minCell`)

#### 2. Overflow signal

**File**: `src/ui/widgets/SolutionSteps.ts` (`show` records `overflowed = !fits` at `minScale`); `src/scenes/TaskScene.ts`
(`render`: on overflow `console.warn` once per skill with the skill id); `src/testing/e2eHook.ts` (snapshot
`solutionOverflow: boolean`, hook build only)

#### 3. Tests

**File**: new `tests/drawingFit.test.ts` (every skill like `solvableInMode`: N draws, both solution states, the real
`pictureLayout` rect for its mode → `drawingFit` true; helpers per kind)

**Contract**: if a real skill fails, it is listed in `KNOWN_SMALL` in the test with a reason and a follow-up entry
(Trigger: visual gate of this change) — never by lowering `minCell`.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `cellsScale` without the floor check → the all-skills test red on a cells skill; restored; meta-check: proves geometry, not text metrics (phase 14 proves the measured flag)
- Build prints `e2e hook: absent (` (the new hook field stays out of `dist/`); full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `grid-tasks.spec.ts` green

#### Manual Verification:

- [reviewer] `KNOWN_SMALL` empty or each entry has a follow-up; `minCell` read in one place
- [visual] PERIMETER composite and a PUZZLE_GRID pyramid in the solution phase, at 1440 (1920×1080 fit) and 1024×768 (cells readable, lines inside the screen)

---

## Phase 11: Widget pool guards and types (S13-11, S14-10, S14-09, GRD-06, WNA-05, WNA-07)

Driver: impl
Driver why: small guards and type tightenings across six widgets — the type checker and two tiny helper tests carry them; no rule worth leading test-first.

### Overview

Widgets stop hiding unvalidated input: they throw past their pool and their types are total.

### Changes Required:

#### 1. Pools

**File**: new pure `assertPool(count, limit, what)` in `src/core/tasks/visual.ts` (or `src/core/round/pool.ts`);
`src/ui/widgets/{IconGroups,IconRow,MoneyTable,Jugs}.ts` call it and drop `images[i]?.show`

#### 2. Types

**File**: `src/ui/widgets/artLayout.ts` (`coinMm: Readonly<Record<CoinId, number>>`, no `?? 20`, `isNote` a type guard;
`satisfies` in `TASK_LAYOUT.money`); `src/ui/widgets/TaskPicture.ts` (total `Record<TaskVisual['kind'], …>`, no `?? null`)

#### 3. Column and number line

**File**: `src/core/tasks/written.ts` (`columnMarks` throws on a carry off the last column); `src/ui/widgets/WrittenColumn.ts`
(drop `if (col >= v.columns) continue`); new pure `lineTicks(line)` (`src/core/tasks/visual.ts` or
`src/core/round/numberLine.ts`) throwing on `tick < 1` or more than `balance.numberLine.maxTicks`; `NumberLine.render` uses it

#### 4. Tests

**File**: `tests/visual.test.ts` (`assertPool`); `tests/artLayout.test.ts` (keys equal `COIN_IDS`);
`tests/answerModes.test.ts` (`columnMarks` 95 + 7 in 2 columns throws); new `tests/numberLine.test.ts` (`lineTicks`)

### Success Criteria:

#### Automated Verification:

- Full local gate green; unit `<branch baseline> + N`; build prints `e2e hook: absent (`
- Deliberate break: `assertPool` never throwing → its test red; a `coinMm` key removed → typecheck red; each restored; meta-check: proves guards and types, not the drawing
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `art-tasks.spec.ts`, `written-column.spec.ts`, `number-line.spec.ts` green

#### Manual Verification:

- [reviewer] no `?.show` left in the four widgets; no `?? 20` / `?? null` fallback left in `artLayout.ts`/`TaskPicture.ts`

---

## Phase 12: One dial geometry and the set-clock type (GRD-07, GRD-08)

Driver: tdd
Driver why: "drawn hand tips equal the rings" and "a set-clock always has a snap" are exact oracles — a failing geometry test and a failing `dragMode` test lead them.

### Overview

`ClockFace` and `clockSetLayout` share one dial geometry; a clock in drag mode is typed as a set-clock with a snap.

### Changes Required:

#### 1. Dial geometry

**File**: `src/core/round/pictureLayout.ts` (new `dialGeometry(rect, dial)`; `clockSetLayout` uses it);
`src/ui/widgets/ClockFace.ts` (`render` uses it); `src/scenes/TaskScene.ts` (`makeClockGeo` uses it if it recomputes)

#### 2. Set-clock type

**File**: `src/core/tasks/visual.ts` (clock visual as a discriminated union: `set: true; snap: 60 | 5` vs neither);
`src/core/tasks/dragMode.ts` (throws for a non-set clock in drag); `src/scenes/TaskScene.ts` (drop `snap ?? 60`);
`src/core/round/canonicalInput.ts` (no "without a snap" branch left)

#### 3. Tests

**File**: `tests/pictureLayout.test.ts` (for every `reachableTimes(5)` time the hand tips from `dialGeometry` agree with
the rings, `toBeCloseTo`); `tests/solvableInMode.test.ts` `dragMode` block ("picks the clock branch" now with a set
clock; a non-set clock in drag throws)

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `ClockFace` radius scaled by 0.9 against `dialGeometry` → the tips test red; restored; meta-check: proves one source, not the pixels
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `clock-set.spec.ts` and `drawn-tasks.spec.ts` green

#### Manual Verification:

- [reviewer] `grep -n "snap ?? " src/` empty; CLOCK generator fixtures updated only for the union shape

---

## Phase 13: Mode widgets, e2e skills seam, docs and seam sweep (WNA-10, S13-14)

Driver: impl
Driver why: a scene refactor behind a small pure map, a hook-build seam change, rule-file text and a sweep of earlier phases — glue and docs, proven by the existing suite and one map test.

### Overview

`TaskScene.render` asks one map which input widget a mode shows; an unknown forced skill fails loudly in the hook build;
`CLAUDE.md` and follow-ups record the slice; seams left by phases 1-12 are removed.

### Changes Required:

#### 1. Mode widgets

**File**: new pure `modeWidgets(input: AnswerMode)` in `src/core/round/view.ts` (or beside `widgetsOf`), a `switch` over
`ANSWER_MODES` with a `never` default; `src/scenes/TaskScene.ts` (`render` uses it instead of the boolean checks);
`tests/answerModes.test.ts` (exactly one input widget per mode)

#### 2. e2e skills seam

**File**: `src/testing/e2eHook.ts` (`forcedSkills` throws naming unknown or unplayable ids; empty list still null);
`tests/e2eSkills.test.ts` ("gives an ordinary round (null) for … an unknown id" → throws)

#### 3. Docs and follow-ups

**File**: `CLAUDE.md` ("Current state": one paragraph for this change in the existing style — `visualArtIds` +
`balance.round.artRetries`, review weights 90/10, `lastTaskSettled` / variant counted at its last answer,
`Task.feedback`, `drawUntil`, `TALL_MODES`, `canSubmit`/`rawToDragEvent`, `drawingFit` + `solutionOverflow`,
`dialGeometry`, `assertPool`/`lineTicks`, `modeWidgets`, design gaps 122-125); new
`context/changes/child-flow-guards/follow-ups/review-fixes.md` (each with `Trigger:`: GRD-09, WNA-08, WNA-09, TXT-06,
F4 two-finger note (`input.activePointers` 1), letterbox thumb ([human] tablet test), placeValue/clockElapsed dedup,
`ArtPool`/`fitRect`, `grosze(id)` lookup, VO3 wallet look, `KNOWN_SMALL` entries if any)

#### 4. Seam sweep

**Contract**: no duplicated helper (one `canSubmit`, one `drawUntil`, one `dialGeometry`, one `cellPositions`); no stale
comment naming the removed `snap ?? 60`, `?.show`, unbounded loops or "14 %"; `docs/design-gaps.md` rows 122-125 match
the DESIGN-GAP comments; each `MAX_ATTEMPTS` constant still used or removed.

### Success Criteria:

#### Automated Verification:

- New `modeWidgets` and `forcedSkills` tests red before, green after; unit `<branch baseline> + N`
- Deliberate break: `modeWidgets('select')` returning tiles → the map test red; restored; meta-check: proves the map, the scene wiring is proven by the e2e gate
- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; a deliberate broken path in `CLAUDE.md` → FAIL; restored
- Every follow-up entry has a `Trigger:` line (`grep -c '^Trigger:'` equals the entry count)
- Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] Seam sweep: every name `CLAUDE.md` adds exists in `src/`; no duplicated helper; gap rows 122-125 match the code comments
- [reviewer] (CI at ship) workflow `CI` job `check` log matches the regex `e2e hook: absent \([0-9]+ chunks checked\)` and `Tests +[0-9]+ passed` (seen in CI run 38898544137, job 116964813604)

---

## Phase 14: The puzzle is paid once after a close; solution lines stay on screen — e2e (#2, #11)

Driver: e2e
Driver why: risk #2 (progress written at the wrong moment survives a close) and #11 (the round is playable on screen) exist only with real IndexedDB and Phaser text metrics — built in phases 4 and 10, contract `E2E=on`.

### Overview

New spec `tests/e2e/child-flow-guards.spec.ts` in the `chromium-hook` project (`child-flow-guards` added to `ROUND_SPEC`
in `playwright.config.ts`).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/child-flow-guards.spec.ts` (new); `playwright.config.ts` (`ROUND_SPEC`)

**Intent**:
(a) "#2 SV2-10 a puzzle answered and closed before »Dalej« is not paid again the same day": `?e2eVariant=puzzle` with a
fixed `?e2eDay`, answer the puzzle right (stars `s + PUZZLE_STARS`), wait for the hook's `save` status to show the write,
reload the same day without tapping "Dalej" → the round is not the puzzle (`variant?.kind !== 'puzzle'`), stars
unchanged (helpers from `daily-puzzle.spec.ts`: `startE4`, `reopen`).
(b) "#11 WNA-04 the solution lines of a drawn task fit on the screen": `?e2eSkills=<the PERIMETER composite or
PUZZLE_GRID skill with the most solution lines, picked from `npm run sample`>`, two wrong answers → solution phase →
`snapshot.solutionOverflow === false`.

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; hook read-only; never open IndexedDB from the test;
request-file protocol if Chromium will not start in the agent session (profile § 8): `e2e-request-p14.md` +
`e2e-break-p14a.patch` (phase 4: the `countRound` call in `submit` removed → (a) red) + `e2e-break-p14b.patch`
(`SolutionSteps` reports overflow always → (b) red); each expected-red test run alone (`-g`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/child-flow-guards.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- Deliberate break p14a → (a) red; p14b → (b) red; each restored; meta-check: (a) proves the write timing on real IndexedDB, (b) proves the measured flag reaches the hook (not that every skill fits)
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual Verification:

- [human] Tablet: answer the daily puzzle, close the app before "Dalej", reopen — no second ×2 puzzle that day

---

## Testing Strategy

### Unit Tests:

- Art filter (ORDINAL), picture threshold, `visualArtIds` redraw over seeds; review weights, `unlockReady`, `stepPlayable`,
  `progressView` with `previous`.
- `exampleValue`, `lastTaskSettled`, variant wiring source test; `Task.feedback` rule and bar; COMPARE_QTY order; per-skill
  first-hint tally; `drawUntil`, parser bounds, `columnSteps`/`columnMarks` throws.
- `canonicalInput` strict tiles/keypad; validator `mode`/`hintVisual`; layout errors with skill id.
- `canSubmit`, clock second pointer, cancel ids, `rawToDragEvent`; `drawingFit` over every skill; `assertPool`,
  `lineTicks`, `coinMm` keys; `dialGeometry` tips; `modeWidgets`; `forcedSkills`.

### Integration Tests:

- Phase 14 e2e (real IndexedDB reload; real Phaser text metrics). Existing specs as the regression net at every gate.

### Manual Testing Steps:

1. On a tablet, MONEY_PAY "fewest": pay the right sum with too many coins → the calm line; then the fewest coins → star.
2. Daily puzzle: answer, close before "Dalej", reopen → not the puzzle again.
3. With a mouse or trackpad: hold a coin / a clock hand, tap "OK" → nothing happens.

## Performance Considerations

The G-4 redraw runs only when art is missing (≤ 8 extra generator calls per task); `drawUntil` adds a counter. Nothing
on a frame path.

## Migration Notes

None: save format v4 unchanged; no fixture changes. Same-seed round changes only where listed in Critical Implementation
Details.

## Known risks

- **TXT-01 changes S-14c's pinned share** (14 % → 10 % E5 on E6.11; easing 60 % → 30 %). Follows `docs/ZADANIA.md`; a
  maintainer who intended 14 % would revert `reviewWeights` (decision 1).
- **PIC-05 copy** has no kit source (gap 124); the `[human]` row asks to accept it.
- **Two-finger defects** are proven by unit only; a real device report re-opens a multi-point e2e (needs
  `input.activePointers ≥ 2`).
- **`drawingFit` may find a real skill too small**; it is listed, followed up and screenshotted, not hidden.
- **Variant counted at the last answer**: closing on the minigame card no longer replays the minigame (intended).
- **`CLAUDE.md` written before the last spec** (plan review F6): phase 13 writes the paragraph, phase 14 adds
  `tests/e2e/child-flow-guards.spec.ts`; phase 14 appends the spec name to that paragraph in its own commit.
- **e2e load sensitivity** (profile § 8): the full suite runs ~10-12 min at 4 workers; a single flaky spec is re-run alone
  before it counts.

## References

- Research `context/changes/child-flow-guards/research.md`; change `context/changes/child-flow-guards/change.md`
- Scope and triage: `context/runs/2026-10-16-audit-sweep/audit-sweep-scope.md` § Slice 1, `triage-A.md`, `triage-B.md`, `triage-C.md`
- Audits `context/audits/observability/2026-10-14_0445-eksport-import-reset-widzety-obrazki.md`, `2026-10-15_0253-zapis-v2-siatka-minigry-slupek.md`, `2026-10-15_1314-limity-zapisu-zadania-tekstowe-obrazki.md`, `2026-10-16_0915-start-dzwieki-grafika-salon.md`
- Contract `context/runs/2026-10-16-audit-sweep/agent-contract.md`; profile `context/foundation/autonomous-run.md` § 2, § 3, § 6, § 8, § 9
- Test plan `context/foundation/test-plan.md` risks #1, #2, #5, #11, #13; `context/foundation/test-stack.md` § E2E
- Format example `context/archive/2026-10-16-stale-tab-and-health/plan.md`
- Design: `Martynka-urzadza.md` § 6 (task screen), `docs/ZADANIA.md` (weights, E1/E3–E6 types), `docs/design-gaps.md`

## Autonomous decisions

1. **TXT-01: review step 90/10 (easing 70/30)** by folding `earlier` into `current`. Rejected: keeping S-14c's 14 % pin
   (contradicts `docs/ZADANIA.md` "~10% powtórka"; under easing E5 becomes the majority). ZADANIA does not name the
   review step itself, so plan review added `[human]` row 2.7. Would change: the maintainer confirming 14 % was intended.
2. **Progress preview includes previous-stage skills on every step** (misses dated since the current stage began),
   not only on the review step. Rejected: review-only (previous-stage skills are drawn on every step at ~10 %). Would
   change: a parent finding the list confusing at the visual gate.
3. **GRD-04/WNA-04: measured overflow signal, not a heuristic `linesFit`.** `SolutionSteps.fits` already measures with
   Phaser text; cells use exact pure geometry. Rejected: a char-width heuristic (needs calibration, no precedent).
   Would change: a need to prove text fit for every skill in unit tests.
4. **`drawingFit` checks each task's real layout rect**, not a global worst case; a failing real skill goes to
   `KNOWN_SMALL` + follow-up, never a lowered `minCell`. Would change: the visual gate showing a listed skill unreadable
   (then a generator cap in a content change).
5. **TXT-03 stricter oracle in scope as planned**: a plan-time probe (20 × 50 draws, every skill) found no current
   offender. Would change: an offender at implementation (then fixed in phase 8 with a teacher read if it is content).
6. **GRD-02: clock and tray stay different** — the clock ignores a second pointer's `down` (it would undo the child's
   pose); the tray keeps "a second finger cancels" (mat unchanged, pinned by a test). Would change: a device report of a
   lost coin carry.
7. **Two-finger proof by unit + `[human]` tablet row**, no multi-touch e2e (Phaser drops the second touch). Would change:
   raising `input.activePointers`.
8. **PIC-05 via `Task.feedback` + `RoundState.note`**, `check` stays boolean; draft copy "Kwota się zgadza. Spróbuj
   zapłacić mniejszą liczbą monet." with a `[human]` acceptance row (no kit copy). Would change: the author's wording.
9. **PIC-06 order `[left, same, right]`** (each side's tile under its group). Rejected: keeping the shuffle (position
   carries no meaning for a non-reader). Design docs silent → gap 125; plan review added `[human]` row 6.7. Would change: a kit view.
10. **HALF hint fixed in this slice** (method line first), teacher read automated; no `[human]` row (no wording decision
    beyond reordering and the existing method phrasing). Would change: the teacher read finding the method line wrong.
11. **SV2-10 counts every variant at its last answer** (puzzle and minigames) with a once-flag; `reported` cleared at a
    new round in the same edit (fired follow-up). Would change: a schedule rule that must wait for "Dalej".
12. **Design gaps numbered in phase order**: 122 progress previous stage, 123 list answers as text, 124 wallet line, 125
    COMPARE_QTY order (research proposed 122 for the wallet line).
13. **Phases**: 1-10 and 12 `tdd`, 11 and 13 `impl`, 14 `e2e` (risks #2, #11). ≤ 1 widget touched for new UI per phase;
    phase 13 is the last impl/tdd phase and carries the seam sweep and `CLAUDE.md`.
14. **Deferred LOW**: GRD-09 (format v5), WNA-08, WNA-09, TXT-06 — follow-ups with triggers in phase 13. Would change:
    plan review asking to fold any back.
15. **Plan in English** like `change.md` and `research.md`; commit messages in Polish (profile § 1). No lessons file exists.

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Art-aware round draw (PIC-01, PIC-03, G-4)

#### Automated

- [x] 1.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — d3ba8bb
- [x] 1.2 Deliberate break: picture threshold from `afterArt` / redraw guard removed → red; restored; meta-check (draw rule, not the loader) — d3ba8bb
- [x] 1.3 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`) — d3ba8bb
- [x] 1.4 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` — d3ba8bb

#### Manual

- [x] 1.5 [reviewer] `visualArtIds` switch ends in a `never` guard; `src/core` has no Phaser import; `pick.ts`/`unique.ts` untouched — impl review

### Phase 2: Review step shares, guards and the progress preview (TXT-01, TXT-04, TXT-05)

#### Automated

- [x] 2.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — ae03a52
- [x] 2.2 Deliberate break: `reviewWeights` returning `w` / `unlockReady` without the review branch → red; restored; meta-check (weights over seeds) — ae03a52
- [x] 2.3 Full local gate green; build prints `e2e hook: absent (` — ae03a52
- [x] 2.4 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `review-round.spec.ts` green — ae03a52

#### Manual

- [x] 2.5 [reviewer] DESIGN-GAP 122 row and comment present; no Polish text in `src/core` — impl review
- [x] 2.6 [visual] Parent progress preview with a weak E5 skill while on E6.11, at 1440 (1920×1080 fit) and 1024×768 — visual gate (reviews/visual-review.md)
- [ ] 2.7 [human] Accept the E6.11 review share 90/10 (easing 70/30) instead of S-14c's ≈ 14 %

### Phase 3: Mistake examples for list answers (PIC-04, S13-06)

#### Automated

- [x] 3.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — b4b6076
- [x] 3.2 Deliberate break: `captureFirstWrong` back to number/string only → red; restored; meta-check (capture and text) — b4b6076
- [x] 3.3 `git diff --stat tests/fixtures` empty; `SAVE_VERSION` still 4 — b4b6076
- [x] 3.4 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` — b4b6076

#### Manual

- [x] 3.5 [reviewer] DESIGN-GAP 123 row and comment present; `validExample` in `src/core/save.ts` unchanged — impl review
- [x] 3.6 [visual] Parent progress preview with a wallet example and a shapes example, at 1440 (1920×1080 fit) and 1024×768 — visual gate (reviews/visual-review.md)

### Phase 4: A variant round is counted at its last answer (SV2-10)

#### Automated

- [x] 4.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — 7fad790
- [x] 4.2 Deliberate break: `finishVariant` ignoring the flag / `lastTaskSettled` true on a retype step → red; restored; meta-check (source order and rule) — 7fad790
- [x] 4.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `daily-puzzle.spec.ts` and `minigames.spec.ts` green — 7fad790

#### Manual

- [x] 4.4 [reviewer] `afterRound` reachable once per variant round; `SAVE_VERSION` still 4; variant schedule rules unchanged — impl review

### Phase 5: A calm reason line for a wallet with too many coins (PIC-05)

#### Automated

- [x] 5.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — fbee812
- [x] 5.2 Deliberate break: `feedback` on a wrong sum / `barOf` ignoring `note` → red; restored; meta-check (rule and bar selection) — fbee812
- [x] 5.3 Teacher read: `npm run sample -- E1 --count 6` and `-- E2 --count 6`, every task of E1.11 and E2.2 read; recorded in the commit body — fbee812
- [x] 5.4 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `money-pay.spec.ts` green — fbee812

#### Manual

- [x] 5.5 [reviewer] `Task.check` still boolean in all five readers; DESIGN-GAP 124 row and comment present — impl review
- [x] 5.6 [visual] MONEY_PAY "fewest" task after a same-sum longer wallet, bar with the new line, at 1440 (1920×1080 fit) and 1024×768 — visual gate (reviews/visual-review.md)
- [ ] 5.7 [human] Accept the wording of the new wallet line (gap 124; the kit has no such copy)

### Phase 6: COMPARE_QTY tile order and a first hint for every skill (PIC-06, TXT-02, HALF)

#### Automated

- [x] 6.1 New hint test red on `E3.10.half_30` before the HALF fix (assertion), green after; unit `<branch baseline> + N` — f6abb19
- [x] 6.2 Deliberate break: shuffle re-added / HALF result line first → red; restored; meta-check (generated content) — f6abb19
- [x] 6.3 Teacher read: `npm run sample -- E1 --count 6` (COMPARE_QTY) and `-- E3 --count 6` (E3.10), every task of the changed steps read; recorded in the commit body — f6abb19
- [x] 6.4 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `picture-tasks.spec.ts` green — f6abb19

#### Manual

- [x] 6.5 [reviewer] DESIGN-GAP 125 row and comment present; `SUPPRESSED_OK` holds only the three phrasing cases with a reason — impl review
- [x] 6.6 [visual] COMPARE_QTY tiles in the new order and an E3.10 HALF first hint, at 1440 (1920×1080 fit) and 1024×768 — visual gate (reviews/visual-review.md)
- [ ] 6.7 [human] Accept the fixed COMPARE_QTY tile order "Po lewej · Tyle samo · Po prawej" (gap 125)

### Phase 7: Bounded generator loops and parser bounds (GRD-05, S13-12, F9, SHAPES `all`, WNA-06, TXT-07, TXT-08)

#### Automated

- [x] 7.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`; 1000-draw replay tests unchanged and green — 1be8a78
- [x] 7.2 Deliberate break: `drawUntil` without the cap / `shapes` `all` without the throw → red; restored; meta-check (bound vs unchanged draws) — 1be8a78
- [x] 7.3 Teacher read: `npm run sample -- <stage> --count 6` for every stage with a changed type (E1–E6), changed steps read; recorded in the commit body — 1be8a78
- [x] 7.4 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` — 1be8a78

#### Manual

- [x] 7.5 [reviewer] No unbounded loop left in `src/core/tasks/generators`; E5/E6 `thousands` params ≥ 1001 — impl review

### Phase 8: Answer-mode oracle and validator rules (TXT-03/GRD-01, WNA-01/F6, WNA-02, WNA-03)

#### Automated

- [x] 8.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`; `solvableInMode` green for every skill — 9bbde57
- [x] 8.2 Deliberate break: keypad branch unchecked / `TALL_MODES` with `select` → red; restored; meta-check (oracle and rule) — 9bbde57
- [x] 8.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` — 9bbde57

#### Manual

- [x] 8.4 [reviewer] Every `switch` over a mode ends in a `never` guard; no runtime path calls `canonicalInput` — impl review

### Phase 9: Gesture guards (PIC-02, GRD-02, GRD-03, F5)

#### Automated

- [x] 9.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — 843a462
- [x] 9.2 Deliberate break: `canSubmit` always true / clock `down` back to `grab(idle(state))` → red; restored; meta-check (reducers and source wiring, not Phaser delivery) — 843a462
- [x] 9.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `clock-set.spec.ts` and `money-pay.spec.ts` green — 843a462

#### Manual

- [x] 9.4 [reviewer] "a second finger cancels the carry and changes nothing" unchanged; no Phaser import in `src/core` — impl review
- [ ] 9.5 [human] Tablet (trackpad, mouse or two fingers): "OK" while a coin or a clock hand is held does nothing; the hand keeps its place under a second touch

### Phase 10: Drawing fit and a solution-overflow signal (GRD-04, WNA-04)

#### Automated

- [x] 10.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — 7ac58d2
- [x] 10.2 Deliberate break: `cellsScale` without the floor check → red; restored; meta-check (geometry, not text metrics) — 7ac58d2
- [x] 10.3 Build prints `e2e hook: absent (`; full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `grid-tasks.spec.ts` green — 7ac58d2

#### Manual

- [x] 10.4 [reviewer] `KNOWN_SMALL` empty or each entry has a follow-up; `minCell` read in one place — impl review
- [x] 10.5 [visual] PERIMETER composite and PUZZLE_GRID pyramid in the solution phase, at 1440 (1920×1080 fit) and 1024×768 — visual gate (reviews/visual-review.md)

### Phase 11: Widget pool guards and types (S13-11, S14-10, S14-09, GRD-06, WNA-05, WNA-07)

#### Automated

- [x] 11.1 Full local gate green; unit `<branch baseline> + N`; build prints `e2e hook: absent (` — efaa4d5
- [x] 11.2 Deliberate break: `assertPool` never throwing / a `coinMm` key removed → red; restored; meta-check (guards and types) — efaa4d5
- [x] 11.3 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `art-tasks.spec.ts`, `written-column.spec.ts`, `number-line.spec.ts` green — efaa4d5

#### Manual

- [x] 11.4 [reviewer] No `?.show` left in the four widgets; no `?? 20` / `?? null` fallback in `artLayout.ts`/`TaskPicture.ts` — impl review

### Phase 12: One dial geometry and the set-clock type (GRD-07, GRD-08)

#### Automated

- [x] 12.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N` — 8e19a7e
- [x] 12.2 Deliberate break: `ClockFace` radius off `dialGeometry` → red; restored; meta-check (one source) — 8e19a7e
- [x] 12.3 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; `clock-set.spec.ts` and `drawn-tasks.spec.ts` green — 8e19a7e

#### Manual

- [x] 12.4 [reviewer] `grep -n "snap ?? " src/` empty; CLOCK fixtures updated only for the union shape — impl review

### Phase 13: Mode widgets, e2e skills seam, docs and seam sweep (WNA-10, S13-14)

#### Automated

- [x] 13.1 New `modeWidgets` and `forcedSkills` tests red before, green after; unit `<branch baseline> + N` — 9635c99
- [x] 13.2 Deliberate break: `modeWidgets('select')` returning tiles → red; restored; meta-check (the map) — 9635c99
- [x] 13.3 `validate-rule-files.sh` PASS; deliberate broken path in `CLAUDE.md` → FAIL; restored — 9635c99
- [x] 13.4 Every follow-up entry has a `Trigger:` line — 9635c99
- [x] 13.5 Full local gate green; build prints `e2e hook: absent (`; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` — 9635c99

#### Manual

- [x] 13.6 [reviewer] Seam sweep: every name `CLAUDE.md` adds exists in `src/`; no duplicated helper; gap rows 122-125 match the code comments — impl review
- [x] 13.7 [reviewer] (CI at ship) workflow `CI` job `check` log matches `e2e hook: absent \([0-9]+ chunks checked\)` and `Tests +[0-9]+ passed` (job 117192831932: `Tests  3416 passed (3416)`, `e2e hook: absent (2 chunks checked)`) — CI run 38966095199

### Phase 14: The puzzle is paid once after a close; solution lines stay on screen — e2e (#2, #11)

#### Automated

- [x] 14.1 `npx playwright test tests/e2e/child-flow-guards.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2` — 18b490c
- [x] 14.2 Deliberate break p14a → (a) red; p14b → (b) red; each restored; meta-check — 18b490c
- [x] 14.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed — 18b490c

#### Manual

- [ ] 14.4 [human] Tablet: answer the daily puzzle, close before "Dalej", reopen — no second ×2 puzzle that day
