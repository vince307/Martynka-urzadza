---
change_id: child-flow-guards
title: Child-flow guards for tasks, widgets and gestures (audit sweep slice 1)
status: impl_reviewed
created: 2026-10-16
updated: 2026-10-16
archived_at: null
---

## Notes

Non-roadmap fix. **Source:** audit sweep 2026-10-16, slice 1 of 3 (tasks, widgets, gestures — where a child gets stuck),
autonomous run `2026-10-16-audit-sweep`. Scope list: `context/runs/2026-10-16-audit-sweep/audit-sweep-scope.md` § Slice 1;
per-finding evidence: `triage-A.md`, `triage-B.md`, `triage-C.md` in the same folder; primary sources (audit reports under
`context/audits/observability/`):

- `2026-10-14_0445-eksport-import-reset-widzety-obrazki.md` (S13-*, S14-*)
- `2026-10-15_0253-zapis-v2-siatka-minigry-slupek.md` (GRD-*, WNA-*, SV2-10)
- `2026-10-15_1314-limity-zapisu-zadania-tekstowe-obrazki.md` (TXT-*, PIC-*)
- `2026-10-16_0915-start-dzwieki-grafika-salon.md` (G-4)

No roadmap status edits (no matching row in `context/foundation/roadmap.md`).

**Id note.** The scope file's one-line labels for PIC-01 and PIC-03 are swapped. The audit (primary source) and the triage
agree: **PIC-01** = `artBlocked` has no ORDINAL case; **PIC-03** = picture mode threshold from the art-filtered step. This
change uses the audit's ids.

**Save format.** No save-format change is expected: the save stays **v4** (`SAVE_VERSION` 4 in `src/core/save.ts`).
- PIC-04 / S13-06 store an array answer as a formatted **string** in the existing `given: number | string` field of the
  mistake example (`src/core/types.ts`, validated in `src/core/save.ts`): content only, no new field, no migration.
- SV2-10 changes only *when* the variant state (`puzzleDay`, `roundsSince`) is written, not its shape.
- GRD-09's drawing description beside an example would need a new example field (format change); it is deferred for that
  reason (see Deferred below).

**Lessons file:** `context/foundation/lessons.md` does not exist (checked); nothing to apply.

## Findings re-verified against the repo (branch `feat/child-flow-guards` at `9b7fe37`; no `src/` change since triage base `d8ca132`)

| finding | audit says | repo now | in scope? |
|---|---|---|---|
| PIC-01 (med) | `artBlocked` has no ORDINAL; ORDINAL answer exists only in the icon row, boxes with nouns for non-readers | `src/core/round/artFilter.ts` `artBlocked` switch: MONEY_COUNT, MONEY_PAY, MASS, CAPACITY, `default: false` | yes |
| PIC-02 (med) | wallet "OK" fires under a second finger while a coin is carried | `src/ui/widgets/CoinWallet.ts` constructor, `ok` `ActionButton` callback checks only `active && state`, no `carrying` guard (the clock has one in `TaskScene.create`) | yes |
| PIC-03 (med) | picture mode threshold computed from the art-filtered step; E1.11 can never unlock | `src/core/curriculum.ts` `buildAdaptiveRound`: `withPictures(afterArt, …, unlockThreshold(afterArt.current.length, …))` while the art filter uses `buckets.current.length` | yes |
| PIC-04 (med) | array answers (SHAPES `all`, MONEY_PAY wallets) leave no mistake example | `src/core/round.ts` `captureFirstWrong` keeps only number/string | yes (string form, no format change) |
| PIC-05 (med) | "right sum, too many coins" and "wrong sum" look the same | `src/core/tasks/generators/moneyPay.ts` `walletCheck` returns a bare boolean | yes (gen, pl) |
| PIC-06 (med) | COMPARE_QTY tiles "Po lewej/Po prawej/Tyle samo" shuffled | `src/core/tasks/generators/compareQty.ts` `generateCompareQty`: `rng.shuffle([tiles.left, tiles.right, tiles.same])` | yes (gen) |
| TXT-01 (med) | review step: `earlier` empty, its weight falls to `previous` (≈59 % E5 tasks when easing); progress preview ignores previous-stage skills | `src/core/curriculum.ts` `skillBuckets` review branch returns `earlier: []`; `src/core/progress.ts` `progressView` reads current-stage skills | yes |
| TXT-02 (med) | no test that a skill with ≥ 2 hint lines shows its first hint | `tests/hints.test.ts` `if (first === null) continue` | yes (tests) |
| TXT-03 (med, latent) | `canonicalInput` passes tiles/keypad answers unchecked; retype can loop forever | `src/core/round/canonicalInput.ts` `case 'tiles': case 'keypad': case undefined: return task.answer` | yes |
| TXT-04 (med, latent) | `unlockReady` on a review step: `unlockThreshold(0) = 0` → ready at once | `src/core/curriculum.ts` `unlockReady` unchanged; `tests/curriculum.test.ts` pins no "review is last" | yes |
| GRD-02 (med) | `ActionButton` fires on `pointerdown`; a second `down` on the clock restores the pose | `src/ui/widgets/ActionButton.ts` `pointerdown`; `src/core/clockSet.ts` `stepClockSet`: `down` → `grab(idle(state))` | yes |
| GRD-03 (med) | `pointerupoutside` → `{ type: 'cancel' }` without `pointerId` | `src/scenes/TaskScene.ts` `create`: `lift` (`wasCanceled`) and the `pointerupoutside` listener send `{ type: 'cancel' }`; `ClockSetEvent`/`TrayDragEvent` `cancel` carry no id | yes |
| GRD-04 (med) | `figure.minCell` unused; `NumberCells`/`CoordGrid` scale without a floor | `src/core/round/figureLayout.ts` declares `minCell`, no read; `NumberCells.render`, `CoordGrid.render` `Math.min(…)` | yes (with WNA-04) |
| WNA-04 (med) | `SolutionSteps` draws at `minScale` even when it does not fit | `src/ui/widgets/SolutionSteps.ts` `show` uses `Math.max(minScale, …)`; `fits` is separate | yes (with GRD-04) |
| GRD-05 (med) | unbounded `do…while` in PERIMETER and PUZZLE_GRID | `src/core/tasks/generators/perimeter.ts` (three loops), `puzzleGrid.ts` (one) | yes (gen) |
| S13-12 (low) | unbounded loops in placeValue, rounding, compareDiff, evenOdd | same `while` loops present | yes (same pass as GRD-05) |
| WNA-01 (med) | `tallOf` throws for drag/select/digits; no validator rule | `src/core/round/pictureLayout.ts` `tallOf` throws; `src/core/tasks/validate.ts` has no tall-drawing mode rule | yes (= follow-up F5) |
| WNA-02 (med) | layout errors name the mode, not the skill | `pictureLayout.ts` `tallOf`, `hintPictureLayout` messages without skill id | yes |
| WNA-03 (med, latent) | `hintPicture && !view.visual` silently drops the hint line | `TaskScene.render` `hintLayout` condition unchanged; `validateTask` has no "hintVisual excludes visual" rule | yes |
| SV2-10 (med) | stars saved at answer, `puzzleDay` only at `finishRound` → x2 puzzle again after a close | `TaskScene` stars written in `answer` path (`earn`), `countRound` (→ `afterRound`) only from `finishRound` | yes (timing only, v4) |
| G-4 (med) | missing icon drawn as a box with a word in E1 picture mode; task not redrawn | `artFilter.ts` knows no icon types; `buildAdaptiveRound` `art.missingIds` used only by the skill filter | yes |
| S13-06 / GRD-09 (med/low) | select (array) mistake example lost; no drawing description beside it | `captureFirstWrong` (see PIC-04) | S13-06 yes (with PIC-04); GRD-09 drawing part **deferred** (needs a new example field = format change) |
| S13-11 (low) | `IconGroups`/`IconRow` `images[i]?.show` drops icons beyond the pool | still `?.show` in both | yes |
| S13-14 (low) | `forcedSkills` returns null on an unknown id (silently an ordinary round) | `src/testing/e2eHook.ts` `forcedSkills` `return null` | yes (e2e build only) |
| S14-09 (low) | `coinMm: Record<string, number>`, `?? 20`; 1:1 ratio default | `src/ui/widgets/artLayout.ts` `coinMm` type and `?? 20`; `ArtImage` `ratio … : 1` (closed for `UI_ART` in S-16c, open for `coinMm`) | yes (`coinMm` part) |
| S14-10 (low) | `MoneyTable`, `Jugs` `images[i]?.show` | still `?.show` | yes |
| GRD-01 (low) | oracle does not model tiles/keypad | same as TXT-03 | yes (merged into TXT-03) |
| GRD-06 (low) | `TaskPicture` `Partial<Record<…>>`, `?? null` | unchanged | yes |
| GRD-07 (low) | no test that the ring centre/radius equal the drawn hand tips | `tests/pictureLayout.test.ts` checks the dial inside the mat only | yes (test) |
| GRD-08 (low) | `visual.snap ?? 60` dead code | `TaskScene` `clockSnap = task0.visual.snap ?? 60` | yes |
| WNA-05 (low) | `WrittenColumn` `if (col >= v.columns) continue` | unchanged | yes |
| WNA-06 (low) | borrow search past the top column → `NaN` | `src/core/tasks/written.ts` `while (m[j] === 0)` without bound | yes |
| WNA-07 (low) | `NumberLine` ticks from `line.tick` without a guard | `NumberLine.render` `Math.floor((to - from) / tick) + 1` | yes |
| WNA-08 (low) | `view.ts` `task.input ?? (choices ? 'tiles' : 'keypad')` | unchanged | **deferred** (makes `input` required on every hand-built test task; churn, no child impact) |
| WNA-09 (low) | OK on empty digit boxes does nothing | `src/core/round/digitBoxes.ts` `submit: null` | **deferred** (a new visual cue the kit has no view for; tablet-test trigger) |
| WNA-10 (low) | boolean mode comparisons in `TaskScene.render` | unchanged | yes |
| TXT-05 (low) | review step playable alone; `RangeError` without stage/step | `stepPlayable`; `src/core/round/pick.ts` `'No playable skills in any bucket'` | yes (with TXT-01/04) |
| TXT-06 (low) | no skill id on the error card | `src/ui/dom/errorCard.ts` has no skill field | **deferred** (M: error-boundary plumbing + card copy; WNA-02 already puts the id in the thrown message/console) |
| TXT-07 (low) | `clockElapsed` unknown placeholder → empty text | `values[key] ?? ''` | yes (gen) |
| TXT-08 (low) | `placeValue` parser accepts `thousands` `max` 1000 | parser low bound 1000 for `thousands` | yes (gen parser) |

Totals: 21 MEDIUM ids (PIC-01..06, TXT-01..04, GRD-02..05, WNA-01..04, SV2-10, G-4, S13-06) all in scope; 20 LOW ids:
16 in scope (S13-11, S13-12, S13-14, S14-09, S14-10, GRD-01, GRD-06..08, WNA-05..07, WNA-10, TXT-05, TXT-07, TXT-08),
4 deferred (GRD-09 drawing part, WNA-08, WNA-09, TXT-06). Dropped as fixed/obsolete: none of the slice ids.

### Generators touched → teacher read (`npm run sample -- <stage> --count 6`, CLAUDE.md working rules)

`moneyPay.ts` (PIC-05, E1.11, E2.2), `compareQty.ts` (PIC-06, E1), `perimeter.ts` + `puzzleGrid.ts` (GRD-05, E3–E6),
`placeValue.ts`, `rounding.ts`, `compareDiff.ts`, `evenOdd.ts` (S13-12; TXT-08), `clockElapsed.ts` (TXT-07, E5),
`shapes.ts` `all` (follow-up below), `written.ts` generator `draw` cap (follow-up F9). Loop guards and parser bounds must
not change the drawn tasks (same seed → same task; the 1000-draw tests prove it); PIC-05 and PIC-06 change what the child sees.

### New `src/data/pl.ts` strings

- PIC-05: one gentle line for "right sum, more coins than needed" (audit wording "Dobrze, ale można mniej monet" is a
  draft; the kit has no such line → DESIGN-GAP row in `docs/design-gaps.md`, next free number **122**).
- No other new child-facing text expected. G-4 redraw, guards and throws have no copy. Error messages thrown from `core`
  are English developer text, not player text.

### Design-kit binding (profile § 6)

- `Martynka-urzadza.md` § 6 "Ekran zadań" (task screen: tiles/keypad, hint → solution → retype, gentle feedback, no
  harsh "wrong") binds PIC-02, PIC-05, GRD-02/03, WNA-03/04, G-4.
- `docs/ZADANIA.md` E1 (comparing quantities, ordinals, money), E3–E6 (perimeter, magic square/pyramid, written column)
  bind the generator changes; task types and ranges stay as catalogued.
- `designs/martynka-maths-A-v1/style-guide.md` and `screenshots/`: no new view. The COMPARE_QTY tile order and the
  wallet reason line have **no kit view** → DESIGN-GAP rows (122 for the wallet line; 123 if the tile order/arrow is
  ours), never invented beyond the existing tile and feedback-bar components (`src/ui/widgets/AnswerTiles`,
  `FeedbackBar`).
- Copy source: `src/data/pl.ts` keys `pl.tasks.compareQtyTiles` (existing), `pl.tasks` money-pay hints (existing) plus the
  new PIC-05 key.

### E2E candidates (E2E=on)

PIC-02 and GRD-02 (two fingers: OK while a coin / a clock hand is held) are the only browser-level risks; the rest is
pure `core` and unit-testable. Research decides whether CDP multi-touch in `tests/e2e/support/hook.ts` can express the
second finger (drawn-grid follow-up F4 says no automated two-finger case exists).

## Open follow-ups whose `Trigger:` names this area

| follow-up (archive file) | trigger | take |
|---|---|---|
| F5 tall-drawing validator rule (`2026-10-14-number-line-written-arrows`) | next tall drawing / mode rules of `validateTask` | **in** — same fix as WNA-01; turn the mode rules into a `switch` with `never` only if cheap (F6), else carry |
| F9 cap `draw` in `generators/written.ts` (same file) | next change to WRITTEN | **in** — same bounded-loop pass as GRD-05 |
| F10 "OK with empty boxes does nothing" (same file) | visual gate of that change | out — = WNA-09, deferred |
| Hint number line for E1 tiles (same file; also e1-shapes) | a layout band above the tiles | out — not fired |
| Mistake example of a `digits` task without drawing (same file) | a save that records the example differently | out — needs a format change (with GRD-09) |
| Wallet in the parent progress preview (`2026-10-15-e1-shapes-picture-mode`) | a v3 save or a parent asking | **in** — closed by PIC-04 as a formatted string, no format change |
| SHAPES `all` silent `MAX_ATTEMPTS` fall-through (same file) | next change to SHAPES params | **in** — fired by the GRD-05 / S13-12 pass (same class); throw like `chooseOp` |
| One `grosze(id)` lookup (same file) | next change to MONEY_PAY or MONEY_COUNT | **in if PIC-05 touches the lookup**, else carry — a pure refactor |
| `TaskScene.feedDrag`/`submit` if-chains (same file) | a fourth `DragMode` | out — not fired |
| Coin on a full wallet flies back silently (same file) | [human] 9.6 tablet test | out — human trigger |
| Stand-in coin labels small; select check mark; COMPARE_QTY 10+10 small (same file, visual gate) | [human]/next change to those widgets | out — not fired |
| S13-09 blockDrag same-pointer `down` (`2026-10-14-drawn-grid-tasks-e3-e4`) | next change to blockDrag | obsolete — triage: fixed in S-14d (`trayDrag` restarts) |
| F5 `pointerupoutside → cancel` unproven (drawn-grid; also drawn-widget) | next change to the drag wiring in TaskScene | **in** — fired by GRD-03; add the unit test of the id-carrying cancel |
| F4 OK ignored while a clock hand is held, no two-finger case (drawn-grid) | same | **in** — with PIC-02/GRD-02 (e2e if research finds multi-touch feasible) |
| O2 one dial geometry source, `snap ?? 60` (drawn-grid) | (truncated) | **partly in** — GRD-07 test and GRD-08; the geometry refactor stays out |
| O4 PERIMETER composite rejection loop cap (drawn-grid) | next change to perimeter.ts | **in** — = GRD-05 |
| S13-05, S13-11..S13-14 (drawn-grid) | next change to the code each names | S13-05 fixed (triage); S13-11/12/14 in; S13-13 accepted by design |
| `tests/hints.test.ts` try/catch hides an always-throwing generator (`2026-10-12-task-round-stars`) | next change to `tests/hints.test.ts` | **in** — fired by TXT-02; count the skips |
| e2e hook room targets (`2026-10-12-narrator-round-summary`) | next change to `src/testing/e2eHook.ts` | obsolete — `inRoom() ? null : …` already in `e2eHook.ts` |
| `TaskScene` `reported` never cleared at a new round (`2026-10-15-text-measure-time-types`) | next change to `TaskScene.submit` or tile marking | **in if PIC-05 changes `submit`** (clear at `beginRound`), else carry |
| Duplicates in `placeValue.ts`/`clockElapsed.ts` (same file) | next change to either generator | fired by TXT-07/TXT-08 but **out** — a pure dedup with no child impact; carry with the same trigger |
| Shared `ArtPool`/`fitRect` (art-tasks, number-line, final-art-p2) | next change to `ArtImage` pooling/fitting | out — S13-11/S14-10 change the widgets' loops, not `ArtImage` pooling |
| VO3 drawn wallet fallback look (`2026-10-16-final-art-p2`) | next change to `CoinWallet` | fired by PIC-02 but **out** — a look question with no kit view (gap 104); carry |

## Deferred (LOW only), each with a trigger

- **GRD-09** drawing description beside a mistake example. Trigger: the next save-format change (v5) or a parent asking
  which drawing a mistake was on.
- **WNA-08** `Task.input` required on production tasks. Trigger: the next change to `src/core/round/view.ts` `roundView`
  or a new answer mode.
- **WNA-09** a nudge when "OK" is pressed on empty digit boxes. Trigger: [human] tablet test of the written column, or a
  kit view for the nudge.
- **TXT-06** skill id under `Kod:` on the error card. Trigger: a field report of an "Ups!" card in a round, or the next
  change to `src/ui/dom/errorCard.ts`.

## Autonomous decisions

1. **Next step `/10x-research`, not `/10x-plan`** (the skill's default). Chosen because ~40 findings across curriculum,
   generators, widgets, gestures and a scene need grounding (e.g. how `Task.check` can carry a reason without touching
   `round.ts` semantics; whether CDP multi-touch is feasible). The step prompt fixes it. Would change: a much smaller scope.
2. **Audit ids over the scope file's labels** for PIC-01/PIC-03. Chosen: the audit is the primary source and the triage
   agrees; rejected: following the scope file's swapped labels. Would change: nothing (both items are in scope).
3. **All MEDIUM in; 4 LOW deferred** (GRD-09, WNA-08, WNA-09, TXT-06) to stay near 12 phases. Chosen because each
   deferred item is either a format change (GRD-09), test churn without child impact (WNA-08), a new visual cue without a
   kit view (WNA-09) or M-size DOM plumbing (TXT-06). Rejected: deferring MEDIUMs (forbidden by the step prompt).
   Would change: plan review finding the remaining scope over ~12 phases (then next to defer: GRD-06, GRD-07, WNA-10).
4. **PIC-04/S13-06 as a formatted string** in `given`, no new field. Chosen: keeps the save at v4. Rejected: an array
   `given` (format change). Would change: a parent need to re-render the example as a drawing (then v5 with GRD-09).
5. **No dropped findings.** Every slice id still matches the repo at `9b7fe37` (no `src/` change since `d8ca132`).
   Would change: evidence of a fix found during research.
6. **Two fired follow-ups carried, not done** (placeValue/clockElapsed duplicates; VO3 wallet look): fired by this slice's
   edits but no child-flow impact or no kit view. Would change: the plan touching those exact lines anyway.
