---
date: 2026-10-16T18:18:39+02:00
researcher: Claude (autonomous run 2026-10-16-audit-sweep, /10x-research step)
git_commit: de8b3ba5926f01e729b848cd3f24c4e22a845a1d
branch: feat/child-flow-guards
repository: Martynka-urzadza
topic: "child-flow-guards: root cause, smallest fix, first failing test and risk for every in-scope finding of audit sweep slice 1"
tags: [research, curriculum, round, generators, widgets, gestures, e2e, child-flow-guards]
status: complete
last_updated: 2026-10-16
last_updated_by: Claude (autonomous run)
---

# Research: child-flow-guards (audit sweep slice 1)

**Date**: 2026-10-16T18:18:39+02:00 · **Git Commit**: de8b3ba · **Branch**: feat/child-flow-guards · **Repository**: Martynka-urzadza

Anchors are **file + symbol** (run contract: never line numbers). Four read-only workers covered (A) curriculum and
round, (B) generators and content, (C) widgets and layout, (D) gestures and two-finger e2e; decisive claims were
re-checked in the main context (Phaser pointer default, HALF hint, `canonicalInput`, review share test, ZADANIA weights).

## Research Question

For every in-scope finding of `change.md` (21 MEDIUM, 16 LOW): root cause, smallest fix, the test that fails first
(unit vs e2e) and the risk to existing behaviour; resolve the open unknowns (a)-(f) of the previous handoff, in
particular whether Playwright can drive a second finger for PIC-02/GRD-02.

## Summary

- **Save format stays v4** for every fix below (no new field; PIC-04 writes a string into the existing `given`;
  SV2-10 changes only the timing of an existing write).
- **Same-seed rounds change** only for: TXT-01 (rounds on the review step E6.11), G-4 (only when some task art is
  missing), PIC-06 (the removed `rng.shuffle` is the generator's last rng call, so the COMPARE_QTY task is the same but
  later tasks of a fixed-seed round shift). Loop caps (GRD-05, S13-12, F9) consume the rng identically when the draw
  succeeds within the cap.
- **Two-finger answer: not feasible as e2e, and not reachable on a touch-only tablet today.** Phaser 4.2.1 creates one
  touch pointer by default (`node_modules/phaser/src/core/Config.js` `inputActivePointers = GetValue(config,
  'input.activePointers', 1)`; `InputManager` constructor builds `pointers[0]` mouse + `pointers[1]` touch), and
  `src/main.ts` `createGame` passes no `input` block (grep of `src/` for `activePointers|addPointer`: no hit).
  `InputManager.onTouchStart` gives a new touch to the first inactive touch pointer, so a second simultaneous finger is
  dropped before any scene listener. CDP `Input.dispatchTouchEvent` itself supports several `touchPoints` with distinct
  `id`s (playwright-core `types/protocol.d.ts`), and `tests/e2e/support/hook.ts` already opens a CDP session
  (`holdTouch`, `holdDrag`, `dragTouch`, `cancelTouch`, `payCoins`), but a two-touch spec cannot go red before the fix.
  PIC-02/GRD-02/GRD-03 remain real defects reachable with **mouse + touch** (pointer 0 + pointer 1: iPad with a
  trackpad, desktop) or after a future `activePointers >= 2`. **Proof seam: unit tests** on `stepClockSet`,
  `stepTrayDrag` and a pure submit predicate over `TrayDragState.carrying`.
- **New content bug found by TXT-02**: `E3.10.half_30` (`src/core/tasks/generators/half.ts`, hint
  `[`${n} : 2 = ${half}`, …]`) states the result in the first hint line, so the first hint is suppressed for 50 of 50
  sampled tasks — a child on that skill never gets a first hint. The new TXT-02 test goes red on it; the fix (method line
  first) needs a teacher read.
- **Design**: one new copy line (PIC-05, DESIGN-GAP **122**, next free number: last row of `docs/design-gaps.md` is 121);
  PIC-06 fixed tile order optional gap **123**. No new view.

## Detailed Findings

### Area A — curriculum, round, art filter, variants

**PIC-01** · cause: `src/core/round/artFilter.ts` `artBlocked` has no `ORDINAL` case (`default: false`). ORDINAL
(`src/core/tasks/generators/ordinal.ts` `generateOrdinal`) builds its row from `rng.shuffle(ICONS).slice(0, length)`
(`src/data/measures.ts` `ICONS`, 15 ids, the same strings as `TASK_ART` icon entries); the answer exists only in the
`row` drawing; the start flag is drawn in code (`IconRow`). · fix: `case 'ORDINAL'`: blocked when fewer loaded `ICONS`
than `parseOrdinalParams(skill.params).max`; partial loss is handled by G-4's redraw. · first test (unit):
`tests/artFilter.test.ts` `artBlocked` — E1.2 ordinal with < max icons loaded is blocked; with one missing it is not. ·
risk: low; empty `missingIds` returns early, no rng change.

**PIC-03** · cause: `src/core/curriculum.ts` `buildAdaptiveRound` passes `unlockThreshold(afterArt.current.length, …)`
to `withPictures` (`src/core/round/pictureFilter.ts`) while the art filter uses `buckets.current.length`. On E1.11
(6 skills, threshold 3) with coin and weight art missing the art filter keeps 3 skills, the picture threshold becomes 2
and `hasPicture` keeps 2, so the step can never unlock. · fix: use `buckets.current.length` (keep the
`currentGroups ? 1` branch). · first test (unit): `tests/pictureMode.test.ts` or `tests/artFilter.test.ts`, E1 learner
on step 11, coin/note/weight ids missing, picture on, ~200 seeds: at least 3 distinct masterable E1.11 skills drawn. ·
risk: none when nothing is missing (`afterArt === buckets`).

**G-4** (open unknown (b), redraw point) · cause: `buildAdaptiveRound` uses `art.missingIds` only for the skill
filter; generators pick icons freely (`count.ts`, `compareQty.ts`, `chooseOp.ts` `rng.pick(ICONS)`, `multGroups.ts`
`PLATE_ICONS`, `ordinal.ts` row). Visual kinds naming task art (`src/core/tasks/visual.ts`): `icons.icon`, `row.icons`,
`scale.item`/`scale.weights`, `money.items`, `pay.tray`, `jugs`; PATTERN uses shape codes drawn in code (not affected).
· redraw point: wrap the `generate` closure that `buildAdaptiveRound` hands to `distinctTasks` — the one place holding
both `missing` and the rng; not `src/core/round/pick.ts` (chooses skills, not tasks) and not
`src/core/round/unique.ts` (keep it duplicate-only). Add pure `visualArtIds(v)` beside `visualKey` in `visual.ts`. ·
bound: `balance.round.artRetries` (proposed 8); worst realistic case ORDINAL with 1 of 15 icons missing has a clean
draw with p ≥ 2/3 per attempt (fail 9 in a row ≈ 5e-5). Exhausted → keep the last task, stand-in box as today, never
throw, never shorten the round (same policy as `distinctTasks`). Only when `missing.size > 0`, so the rng use is
unchanged otherwise. Warm-up (`buildWarmup`, takes a `blocked` predicate only) and variant rounds stay out. · first
test (unit): `tests/artFilter.test.ts` "rounds with missing art": E1 step 2, `key` missing, 100 seeds, no task's
`visualArtIds` contains `key`. · risk: same-seed rounds change only with missing art.

**PIC-04 / S13-06** · cause: `src/core/round.ts` `captureFirstWrong` keeps only number/string input; select answers
(SHAPES `all`) and MONEY_PAY wallets (grosze `number[]`) leave no example. · save check: `MistakeExample.given` is
`number | string` (`src/core/types.ts`); `src/core/save.ts` `validExample` checks `typeof` only, no length limit; the
DOM renders via `textContent` (`src/ui/dom/progressView.ts`, `pl.settings.example`), no injection risk. · fix: pure
`exampleValue(task, value)` in `round.ts`: money pay → `formatMoney` (`src/core/text/measure.ts`) joined by ", ",
sorted descending; select → face text in `task.choices` order; reuse it in `exampleAnswer` (today a MONEY_PAY answer
prints as "500, 200" grosze in `progress.ts` `formatValue`). · first test (unit): `tests/round.test.ts` (wrong wallet
`[200,200,100]` → `'2 zł, 2 zł, 1 zł'`; wrong select → face words) + `tests/save.test.ts` round trip. · risk: none to
format (v4) or rng; old numeric examples still render. Closes the follow-up "wallet in the parent progress preview".

**TXT-01** (open unknown (c)) · cause: `skillBuckets` review branch returns `earlier: []`; `pickRoundSkills` spreads the
empty bucket's weight proportionally. Shares on E6.11 (`balance.curriculum.weights` 60/30/10, `balance.easing.weights`
20/50/30): normal E6 60/70 ≈ 85.7 %, E5 ≈ 14.3 % (pinned by `tests/review.test.ts` "… about 14 % E5 …"); easing E6
20/50 = 40 %, E5 60 %. · source: `docs/ZADANIA.md` (step section: "~60% bieżący krok, ~30% wcześniejsze kroki tego
etapu, ~10% powtórka z poprzedniego etapu"); `Martynka-urzadza.md` (balance paragraph, "Wagi losowania (60/30/10)") —
silent on review steps. The S-14c test pinned 14 %; that contradicts the catalogue's ~10 % and, under easing, makes E5
the majority. · recommendation: pure `reviewWeights(w)` folding `earlier` into `current` when `pools.currentGroups` is
set → normal 90/10, easing 70/30; update the 14 % test deliberately. · progress view: `src/core/progress.ts`
`progressView(stage, …)` sees only the current stage and `tests/progress.test.ts` pins "ignores history of another
stage". Recommend an optional `previous?: StageDef` (passed by `UIScene.openSettings`), including previous-stage skills
with first-try misses dated at or after the earliest current-stage history entry, same ranking, labelled with their
own step title; no new saved field. · risk: same-seed E6.11 rounds change; other steps unchanged.

**TXT-04** · cause: `unlockReady` on a review step: no skills → `unlockThreshold(0, …) = 0` → ready at once. Latent
because E6.11 is E6's last step. · fix: return null when the current step is `review`. · tests (unit): content
invariant in `tests/curriculum.test.ts` "every review step is its stage's last step" + a synthetic stage with a
review at step 2 of 3 (returns 3 today). · risk: none for current data.

**TXT-05** · cause: `stepPlayable` treats any review step as playable; a stage whose only playable step is review
reaches `src/core/round/pick.ts` `RangeError('No playable skills in any bucket')` without stage/step. · fix:
`stepPlayable` counts a review step only when a non-review step is playable; `buildAdaptiveRound` throws
`No playable skills for stage <id> step <n> (review)` before picking. · test (unit): synthetic review-only stage. ·
risk: none.

**TXT-03 / GRD-01** · cause: `src/core/round/canonicalInput.ts` `canonicalInput` returns `task.answer` for
`tiles`/`keypad`/`undefined`, so `tests/solvableInMode.test.ts` proves nothing for those modes. `round.ts` `answer` in
`retype` returns the same state until correct, so a tile answer not in `choices`, a `check` no choice passes, or a
keypad answer that is negative, fractional, a string or longer than `balance.keypad.maxDigits` loops forever. · fix:
tiles → first choice passing `check` or equal to the answer, else throw with the skill id; keypad → throw unless a
non-negative integer within `maxDigits` and `check?.(answer) !== false`; `undefined` → by `choices`. · test (unit):
`tests/answerModes.test.ts` cases above; run `solvableInMode` to find any real offender (not run in this step). · risk:
test-oracle code only, no runtime path.

**SV2-10** (open unknown (f)) · cause: stars are written at answer time (`TaskScene.submit` → `syncStars` → `earn`,
debounced autosave) while the variant state is written only at "Dalej" (`advance` → `finishRound` → `finishVariant` →
`countRound` → `src/core/variants.ts` `afterRound`: `puzzleDay`, `puzzlesDone`, `roundsSince = 0`). A puzzle round
is one task, so closing between the answer and "Dalej" repays ×2 the same day. Rule source: ×2 for first and second
try, nothing for a retype (`context/archive/2026-10-14-minigame-daily-puzzle/change.md` decision 5;
`Martynka-urzadza.md` "zagadka dnia ×2"). · fix: in `submit`, when the last task of a variant round has just settled
(pure `lastTaskSettled(prior, next)` in `src/core/round.ts`), call `countRound(this.kind)` once and set a
`variantCounted` flag; `finishVariant` skips `countRound` when counted; reset at a new round. The guard is required:
`afterRound` is not idempotent (would append the puzzle id twice). · format: `REGISTRY_KEYS.variants` is already in
`SAVE_KEYS` (`src/data/layout.ts`), so stars and `puzzleDay` share the debounced write; v4 unchanged. · tests: unit
`lastTaskSettled`; a source-wiring test like `tests/freshRoundWiring.test.ts` (submit calls `countRound`); **e2e
candidate**: `?e2eVariant=puzzle`, answer, reload, expect an ordinary round. · risk: minigames also count at the last
settle, so closing on `MinigameDoneCard` no longer replays the minigame (intended). Unverified: whether the dice/word
answer paths share the same settle path in `submit`.

### Area B — generators and content (teacher read required for each changed generator)

**PIC-05** (open unknown (a)) · cause: `src/core/tasks/generators/moneyPay.ts` `walletCheck` returns a bare `false`
for every miss; `Task.check` is `(input) => boolean` (`src/core/tasks/types.ts`) and is read by truthiness in five
places (`round.ts` `isCorrect`, `canonicalInput`, `round/hints.ts` `isAnswerNumber`, `TaskScene.submit` `reported`,
`TaskScene` `correctChoices`) — an object return would be truthy, so `check` must stay boolean. · fix: add
`feedback?: (input) => string | null` to `Task` (never decides right/wrong); `generateMoneyPay` sets it for the
`fewest` variant only (right sum, tray coins only, more coins than the fewest); `RoundState` gets `note` per task set
in `answer` case `'first'`; `src/core/round/view.ts` `barOf` case `'second'` shows `note ?? firstHint` in the existing
hint bar (`FeedbackBar`); `src/core/narration/spoken.ts` reads the same line. Stars, mastery and phases unchanged.
Draft copy (needs teacher read, gap 122): "Kwota się zgadza. Spróbuj zapłacić mniejszą liczbą monet." (no "źle",
`Martynka-urzadza.md` § 6 task screen). · tests (unit): `tests/moneyPay.test.ts` feedback returns the line for a
same-sum longer wallet, null for a wrong sum; a view test of `bar`. · risk: no rng calls added. The "one `grosze(id)`
lookup" follow-up fires (next change to MONEY_PAY) but PIC-05 does not need it; folding it touches ~5 files
(`coins.ts`, `moneyPay.ts`, `money.ts`, `validate.ts`, `visual.ts`) — optional, carry is defensible.

**PIC-06** · cause: `src/core/tasks/generators/compareQty.ts` `generateCompareQty`
`choices: rng.shuffle([tiles.left, tiles.right, tiles.same])` (`pl.tasks.compareQtyTiles`). · fix: fixed
`[left, same, right]` — each tile under its group, "Tyle samo" in the middle; no kit guidance (style guide silent; gap
102 covers only the group pair) → gap 123 if recorded. · test (unit): `tests/compareQty.test.ts` expects the exact order
(replacing the sorted comparison). · risk: removes the generator's last rng call → later tasks in fixed-seed rounds
shift; runtime seeds from `Date.now()`; run the whole suite for pinned rounds.

**GRD-05 / S13-12 / F9 / SHAPES `all`** · loops: `perimeter.ts` three `do…while` (triangle, rectangle side, composite),
`puzzleGrid.ts` one (pyramid), `placeValue.ts` decompose `while`, `rounding.ts` `while (n % to === 0 …)`,
`compareDiff.ts` `while (b === a)`, `evenOdd.ts` two set-fill loops, `written.ts` generator `draw` `for (;;)`;
`shapes.ts` `all` stops at `MAX_ATTEMPTS` and silently returns fewer wrong faces (`chooseOp.ts` throws instead). No
shared helper exists (~15 generators declare their own `MAX_ATTEMPTS = 1000`). · fix: `src/core/tasks/retry.ts`
`drawUntil(label, draw, ok, max = 1000)` throwing `RangeError`; each loop maps one-to-one (same rng consumption on
success); `evenOdd` keeps its loop with a counter; SHAPES `all` throws when too few wrong faces. Labels carry type and
params (`generateTask` already prefixes `Skill <id>:`). · first test (unit): a direct `drawUntil` test (an infinite
loop can only fail by timeout) + `tests/shapes.test.ts` case with too few distinct faces expecting a throw. · risk:
1000-draw replay tests stay green; unverified whether the perimeter/pyramid parsers already reject infeasible params.

**WNA-06** · cause: `src/core/tasks/written.ts` `columnSteps` borrow `while (m[j] === 0)` walks past the top column to
`undefined` and yields `NaN` (not an infinite loop). · fix: throw `RangeError` when `j >= columns`. · test:
`tests/written.test.ts` `columnSteps` with a < b throws. · risk: none (generator orders a ≥ b).

**TXT-07** · cause: `clockElapsed.ts` `swap` `values[key] ?? ''`. · fix: throw naming the placeholder and template. ·
test: data test over `src/data/elapsed.ts` (end templates ⊆ {a,d}; span/toHour/night ⊆ {a,b}). · risk: none.

**TXT-08** · cause: `placeValue.ts` `parsePlaceValueParams` accepts `thousands` max 1000, but `drawFourDigit` needs two
non-zero digits, so every draw throws. · fix: low bound 1001. · test: parser throws `TypeError` for max 1000. · risk:
none (check E5/E6 values).

**TXT-02** · current: `tests/hints.test.ts` already asserts `skipped === 0`, so the try/catch hides no always-throwing
generator, but it loses the message; the real hole is `if (first === null) continue`. Measured by worker B (50 seeds
per skill, `createRng(900+seed)`): 6922 tasks with ≥ 2 hint lines, 62 with the first hint suppressed —
`E3.10.half_30` 50/50 (real bug, verified: `half.ts` hint line one is `${n} : 2 = ${half}`), `E2.7.sequence_tens_100`
5/50, `E2.6.arrow_graph_20` 4/50, `E2.6.arrow_table_20` 3/50 (false positives: "o 10" step phrasing equals the
answer). · fix: drop the try/catch; per-skill tallies; assert `suppressed === 0` outside an explicit
`SUPPRESSED_OK: Record<skillId, reason>`; no skill with `suppressed === multi > 0`. Fix HALF by a method line first
(teacher read). · risk: content change in HALF (E3).

### Area C — widgets, layout, validator

**GRD-04 + WNA-04** (open unknown (e)) · cause: `src/core/round/figureLayout.ts` declares `FigureLook.minCell`
(`TASK_LAYOUT.figure`) and never reads it; `NumberCells.render` and `CoordGrid.render` scale with `Math.min(…, maxScale)`
and no floor (`TASK_LAYOUT.cells`/`coord` have no `minScale`); `SolutionSteps.show` clamps to `minScale` even when
`fits` is false, and `TaskScene.render` calls `fits`/`fitPromptToSteps` only on the no-drawing branch. · existing pure
geometry: `figureLayout` (core), `cellPositions` (lives in `src/ui/widgets/NumberCells.ts`), `pictureLayout`/
`belowPrompt` (rects; worst case `TASK_LAYOUT.picture.minHeight`). Only `tests/perimeter.test.ts` "composite: at most 5
rows" checks a min cell, one variant in one rect. · fix: `src/core/round/drawingFit.ts` — move `cellPositions`, add
`cellsScale`/`coordScale` (widgets call them), `drawingFit(visual, rect)` as a `switch` over `TaskVisual['kind']` with a
`never` default (figure/cells/grid checked, others `true`), `minScale` in `TASK_LAYOUT.cells`/`coord`; `linesFit(lines,
rect, look)` estimating wrapped lines × line height at `minScale` (needs a char-width factor like `figure.textWidth`
0.62 — no precedent for solution text). · first test (unit): new `tests/drawingFit.test.ts` looping every skill like
`solvableInMode` (draw N tasks, both `solution` states, worst-case rect) asserting cell ≥ minCell and lines fit. · risk:
the text-width estimate is heuristic (calibrate on visual-gate screenshots or fall back to a Phaser-measured
`overflow` flag in the e2e hook); the worst-case rect may fail existing PERIMETER/PUZZLE_GRID skills (would need a
generator cap or a larger rect — decide in the plan).

**WNA-01** (= follow-up F5) · cause: `src/core/round/pictureLayout.ts` `tallOf` throws for drag/select/digits;
`validateTask` catches drag (via `dragMode`) and digits but not select. · fix: `TALL_MODES = ['tiles','keypad']` beside
`visualShape` in `visual.ts`; validator rule `mode`. F6 (mode rules as `switch` with `never`) is feasible. · test:
`tests/solvableInMode.test.ts` "validateTask is aware of the answer mode": select + thermometer → rule `mode`. · risk:
low (no current tall drawing in those modes).

**WNA-02** · cause: `tallOf`/`hintPictureLayout` have no skill context (`dragMode` already names the skill). · fix:
optional `skillId` on `pictureLayout`, `answerSpans`, `hintPictureLayout`, `tallOf`; `TaskScene.render` passes
`task.skillId`. · test: `tests/pictureLayout.test.ts` `toThrow(/E9\.1\.x/)`. · risk: signature churn only.

**WNA-03** · cause: `TaskScene.render` `hintLayout = view.hintPicture && !view.visual ? … : null`; no validator rule.
· fix: validator rule "a hint drawing needs a task without its own drawing"; optional pure `hintLayoutFor` that
throws. · test: `tests/hintVisual.test.ts`. · risk: latent only.

**S13-11 / S14-10** · pools equal `ART_LIMITS` (`src/data/measures.ts`: icons 30, rowIcons 10, moneyItems 10, jugs 10)
which equal `validateVisual` limits, so `images[i]?.show` in `IconGroups`, `IconRow`, `MoneyTable`, `Jugs` only hides
unvalidated data. · fix: pure `assertPool(count, limit, what)` in core, called by each widget instead of `?.`. · test:
unit of the helper. · risk: a throw reaches the error card instead of a short picture (intended).

**S14-09** · `src/ui/widgets/artLayout.ts` `coinMm: Readonly<Record<string, number>>` + `?? 20` → type on `CoinId`,
`satisfies` in `TASK_LAYOUT.money`, `isNote` as a type guard; test `tests/artLayout.test.ts` keys equal `COIN_IDS`.

**GRD-06** · `TaskPicture.render` `Partial<Record<TaskVisual['kind'], …>>` + `?? null` already lists every kind → total
`Record`; typecheck is the test.

**GRD-07** · `ClockFace.render` computes centre/scale inline; `clockSetLayout` (`pictureLayout.ts`) recomputes the same
formula for `ClockSet` rings and `TaskScene.makeClockGeo`. · fix: pure `dialGeometry(rect, dial)` used by both. · test:
`tests/pictureLayout.test.ts`, for every `reachableTimes(5)` time the tips agree (`toBeCloseTo`). · risk: low refactor.

**GRD-08** · `snap ?? 60` is not provably dead: `dragMode` returns `'clock'` for any clock drawing, set or not. · fix:
clock visual as a discriminated union (`set: true; snap: 60|5` vs neither), `dragMode` throws for a non-set clock in
drag. · test: `tests/solvableInMode.test.ts` `dragMode` block — the existing "picks the clock branch from the drawing"
uses a non-set clock and must be updated. · risk: touches CLOCK generator fixtures.

**WNA-05** · `WrittenColumn.render` `if (col >= v.columns) continue`; `columnMarks` pushes `col + 1` for a carry off
the last column (unreachable for validated data). · fix: throw in `columnSteps`/`columnMarks`, drop the widget guard. ·
test: `tests/answerModes.test.ts` `columnMarks` 95 + 7 in 2 columns throws.

**WNA-07** · `NumberLine.render` `Math.floor((to - from) / tick) + 1` loops forever on `tick <= 0` (validator guards it,
widget trusts input). · fix: pure `lineTicks(line)` throwing on `tick < 1` or `> balance.numberLine.maxTicks`. · test:
unit.

**WNA-10** · ~15 `view.input === '…'` checks in `TaskScene.render`; `widgetsOf` already switches with `never`. · fix:
pure `modeWidgets(input)` over `ANSWER_MODES`. · test: `tests/answerModes.test.ts` exactly one input widget per mode. ·
risk: scene wiring not unit-covered → full e2e.

**S13-14** · `src/testing/e2eHook.ts` `forcedSkills` returns null on unknown/unplayable ids → throw naming the ids
(keep null for an empty list); `tests/e2eSkills.test.ts` existing "gives an ordinary round (null) for … an unknown
id …" must change. e2e build only.

### Area D — gestures (PIC-02, GRD-02, GRD-03) and the two-finger question (open unknown (d))

**PIC-02** · cause: `src/ui/widgets/CoinWallet.ts` constructor, `ok` `ActionButton` callback checks only
`this.active && this.state`; the clock path guards in `TaskScene.create` (`clockState.carrying === null`). Carry state:
`TrayDragState.carrying` (`src/core/trayDrag.ts`). · fix: pure `canSubmit(state)` (carrying null) in core, used by
`CoinWallet` and the clock path. · test (unit): false while a coin is carried, true after `up`.

**GRD-02** · cause: `src/core/clockSet.ts` `stepClockSet`: `down` → `grab(idle(state), …)` for any pointer; `idle`
restores `before`. `ActionButton` fires on `pointerdown`. Events `down`/`move`/`up` already carry `pointerId`. · fix:
ignore `down` from another pointer while one carries; keep the same-pointer `down` (S13-09 lost-up case). Note
`stepTrayDrag` deliberately does the opposite (a different finger's `down` returns `idle`, pinned by
`tests/trayDrag.test.ts` "a second finger cancels the carry and changes nothing") — harmless for the tray because the
mat is unchanged; the plan should record whether they stay different. · test (unit): `tests/clockSet.test.ts`, next to
"ignores another finger while one carries a hand": `down` of pointer 2 keeps the pose.

**GRD-03** (fires follow-up F5 `pointerupoutside → cancel`) · cause: `TaskScene.create` `lift`
(`p.wasCanceled ? { type: 'cancel' } : …`) and the `pointerupoutside` listener drop the id; `ClockSetEvent` and
`TrayDragEvent` (aliased by `BlockDragEvent` in `src/core/blockDrag.ts`) declare `cancel` without id. · fix:
`{ type: 'cancel'; pointerId?: number }` (optional keeps the scene-internal cancels: dragLive off, input suspend);
pass `p.id`; both reducers ignore a mismatched id. Change both cancel shapes together (`feedDrag(event:
BlockDragEvent & ClockSetEvent)`). · tests (unit): `tests/clockSet.test.ts`, `tests/trayDrag.test.ts`; F5's anonymous
listener is reachable by unit only through a pure `rawToDragEvent(kind, p)` mapper used by all four listeners
(`freshRoundWiring` style). · risk: low; e2e `cancelTouch` still matches pointer 1.

**Two fingers in Playwright** · `playwright.config.ts`: Desktop Chrome, `hasTouch: true`. Helpers send one touch point
with no `id`. CDP supports multi-point (`touchStart` with `[p1, p2]`, lifting one = `touchMove` with the remaining
point; `touchEnd`/`touchCancel` carry no points) — source: playwright-core bundled `types/protocol.d.ts` (the live CDP
page could not be fetched). With Phaser's single touch pointer the second finger is dropped, so such a spec cannot
fail first. Mouse + touch (`holdDrag` + `page.mouse.click` on OK, pointer 0) could reproduce PIC-02/GRD-02, but whether
Chromium with `hasTouch` delivers mouse events to the canvas is unverified, and it is not the child's tablet case. ·
verdict: prove PIC-02/GRD-02/GRD-03 with unit tests; record in F4 that a second finger is dropped by
`input.activePointers` default 1; re-open a multi-point e2e only if `activePointers` is raised.

**Side risk (new, inferred from code only)**: `TouchManager.onTouchStartWindow` forwards touches outside the canvas
(letterbox) to `onTouchStart`; a thumb resting on the letterbox would take the only touch pointer and the real finger
is ignored until it lifts. Unverified on device → follow-up with a [human] tablet trigger, not this slice.

## Code References

- `src/core/round/artFilter.ts` `artBlocked` — PIC-01
- `src/core/curriculum.ts` `buildAdaptiveRound`, `skillBuckets`, `unlockReady`, `stepPlayable` — PIC-03, G-4, TXT-01/04/05
- `src/core/round/pick.ts` `pickRoundSkills` — TXT-01 weights, TXT-05 message
- `src/core/round.ts` `captureFirstWrong`, `exampleAnswer`, `answer` — PIC-04, PIC-05 note, SV2-10 predicate
- `src/core/round/canonicalInput.ts` `canonicalInput` — TXT-03/GRD-01
- `src/core/variants.ts` `afterRound`; `src/scenes/TaskScene.ts` `submit`, `finishVariant`, `create`, `render` — SV2-10, GRD-03, WNA-03, WNA-10
- `src/core/tasks/generators/{moneyPay,compareQty,perimeter,puzzleGrid,placeValue,rounding,compareDiff,evenOdd,written,shapes,clockElapsed,half}.ts`
- `src/core/tasks/written.ts` `columnSteps`, `columnMarks` — WNA-06, WNA-05
- `src/core/round/{figureLayout,pictureLayout}.ts`, `src/ui/widgets/{NumberCells,CoordGrid,SolutionSteps}.ts` — GRD-04/WNA-04, WNA-01/02, GRD-07
- `src/core/clockSet.ts` `stepClockSet`, `src/core/trayDrag.ts` `stepTrayDrag`, `src/ui/widgets/CoinWallet.ts` — gestures
- `node_modules/phaser/src/core/Config.js` `inputActivePointers`; `node_modules/phaser/src/input/InputManager.js` constructor, `onTouchStart` — single touch pointer
- `tests/e2e/support/hook.ts` `holdTouch`, `holdDrag`, `dragTouch`, `cancelTouch`, `payCoins` — CDP single-point helpers

## Architecture Insights

- Every proposed guard fits the existing split: pure rule in `src/core` with a unit test, the widget/scene only calls
  it. Recurrent pattern: a widget or scene re-derives what core knows (scale, dial geometry, mode flags, carrying) —
  the fixes extract one pure source (`drawingFit`, `dialGeometry`, `modeWidgets`, `canSubmit`).
- `Task.check` must stay boolean (five truthiness readers); a reason belongs in a separate `feedback` that never decides.
- Bounded retry is reinvented per generator; `drawUntil` gives one helper without changing rng consumption.

## Recommended phase grouping (for `/10x-plan`)

1. **tdd** Curriculum and art (PIC-03, PIC-01, G-4, TXT-01 incl. progress view, TXT-04, TXT-05).
2. **tdd** Mistake examples and variant timing (PIC-04/S13-06, SV2-10 core predicate + scene wiring).
3. **tdd** MONEY_PAY reason line and COMPARE_QTY order (PIC-05, PIC-06; gaps 122/123; teacher read E1, E2).
4. **tdd** Bounded generator loops and parser bounds (GRD-05, S13-12, F9, SHAPES `all`, WNA-06, TXT-07, TXT-08;
   teacher read E3–E6).
5. **tdd** Hint test and HALF hint (TXT-02 + `E3.10.half_30`; teacher read E3).
6. **tdd** Answer-mode oracle and validator rules (TXT-03/GRD-01, WNA-01/F6, WNA-02, WNA-03).
7. **tdd** Gestures (PIC-02, GRD-02, GRD-03, F5 mapper).
8. **tdd** Drawing fit (GRD-04, WNA-04).
9. **impl** Widget guards and types (S13-11, S14-10, S14-09, GRD-06, GRD-07, GRD-08, WNA-05, WNA-07, WNA-10, S13-14).
10. **e2e** SV2-10 puzzle-reload spec (the only browser-level risk found feasible); no two-finger spec.

## Historical Context (from prior changes)

- `context/archive/2026-10-14-minigame-daily-puzzle/change.md` decision 5 — ×2 for first and second try (supported; SV2-10 relies on it).
- `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md` F4 ("no automated two-finger case") — supported, now with the reason: Phaser drops the second touch.
- S-14c review step (`tests/review.test.ts` "about 14 % E5") — the test pins current behaviour; contradicted by `docs/ZADANIA.md` "~10% powtórka" (partial: the catalogue does not address review steps).

## Related Research

Not applicable (no earlier research on this slice).

## Open Questions

- TXT-01: 90/10 (ZADANIA) vs the pinned 14 % — research recommends 90/10; the plan decides and records it.
- GRD-04/WNA-04: heuristic `linesFit` vs a Phaser-measured overflow flag; and whether existing PERIMETER/PUZZLE_GRID
  skills fail the worst-case rect (not measured here).
- TXT-03: whether the stricter oracle exposes a current skill (run `solvableInMode`; not run in this research step).
- PIC-05 copy and the HALF hint fix need a teacher read; the PIC-05 line needs DESIGN-GAP 122.
- GRD-02: whether clock and tray should agree on a second finger's `down`.
- Letterbox-thumb side risk (code inference only) → follow-up with a [human] trigger.
