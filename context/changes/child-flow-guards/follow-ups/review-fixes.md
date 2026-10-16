# Follow-ups — child-flow-guards

Each item has a trigger line; later slices grep for it.

- **GRD-09 drawing description beside a mistake example**: the progress preview shows the example text, not the drawing it was on (needs a new example field, save format v5).
Trigger: the next save-format change (v5), or a parent asking which drawing a mistake was on
- **WNA-08 `Task.input` required on production tasks**: `roundView` still falls back to `task.input ?? (choices ? 'tiles' : 'keypad')`; making it required churns every hand-built test task.
Trigger: the next change to `roundView` in `src/core/round/view.ts`, or a new answer mode
- **WNA-09 nudge on "OK" with empty digit boxes**: it does nothing; a cue needs a kit view.
Trigger: [human] tablet test of the written column, or a kit view for the nudge
- **TXT-06 skill id under `Kod:` on the error card**: the id is in the thrown message and console only.
Trigger: a field report of an "Ups!" card in a round, or the next change to `src/ui/dom/errorCard.ts`
- **F4 two-finger gestures**: no automated two-finger case exists (Phaser drops the second touch); `input.activePointers` stays 1.
Trigger: a device report of a lost carry, or a change of `input.activePointers`
- **Letterbox thumb**: a held coin or clock hand at the screen edge outside the fitted canvas is not proven on a tablet.
Trigger: [human] tablet test of a drag near the letterbox edge
- **placeValue / clockElapsed helper duplicates**: similar local helpers in the two generators.
Trigger: the next change to `src/core/tasks/generators/placeValue.ts` or `clockElapsed.ts`
- **Shared `ArtPool` / `fitRect`**: pool and fit helpers repeat in several widgets.
Trigger: the next widget that draws pooled art, or a third copy of the fit code
- **One `grosze(id)` lookup**: MONEY_PAY and MONEY_COUNT each look the value of a coin up.
Trigger: the next change to MONEY_PAY or MONEY_COUNT
- **VO3 drawn wallet fallback look**: the stand-in wallet look has no kit view (gap 104).
Trigger: the next change to `CoinWallet`, or a kit view of the wallet
- **`KNOWN_SMALL` (phase 10)**: no entry was needed; a skill whose drawing falls under `figure.minCell` would be listed there with an entry here.
Trigger: a new drawn skill failing the `drawingFit` test
- **Seam sweep (phase 13)**: remaining `while` loops in generators are `addSub` (digit loop) and bounded `compareNum`; each generator keeps its own `MAX_ATTEMPTS` constant next to `drawUntil` (all still used).
Trigger: the next change to a generator that loops

## From the impl review (2026-10-16)

- **`modeWidgets` not yet the only mode switch in `TaskScene.render`** (impl review F2): phase 13 moved the private `widgetsOf` to `src/core/round/view.ts` `modeWidgets`, but the boolean `view.input === '…'` checks in `TaskScene.render`/`snapshot` stay (same count as main); the plan wanted `render` to ask the map instead.
Trigger: the next change to `TaskScene.render`, or a new answer mode
- **Cell floor checked only in tests** (impl review F3): `drawingFit` (`src/core/round/drawingFit.ts`) is asserted over `pictureLayout` rects in `tests/drawingFit.test.ts`, but at runtime `belowPrompt(..., TASK_LAYOUT.picture.minHeight)` in `TaskScene.render` can shrink the rect under a long prompt, and `NumberCells`/`CoordGrid` do not clamp (no `minScale` in `TASK_LAYOUT.cells`/`coord`, p10 deviation).
  Visual gate 2026-10-16 (row 10.5): with a three-line prompt the E3.5 pyramid cells measure about 63 game px at 1440 and at 1024 (47 and 34 screen px), the E6.3 composite lattice of 7 x 5 about 36.7 game px at 1024 (137 screen px / 7): the floor of 36 holds in these frames, with no margin on a wide lattice.
Trigger: a GRID/PUZZLE_GRID/PERIMETER skill with a prompt longer than three lines or a lattice wider than 7 cells
- **A lost `up` of one pointer holds the clock hand against another pointer** (impl review F4): `stepClockSet` ignores a `down` of another pointer id while a hand is carried, and `canSubmit` blocks "OK"; on a touch-only tablet every touch is pointer 1 (recovers), only mixed mouse + touch can stay held until "Do pokoju".
Trigger: a device report of a clock hand that cannot be put down, or a change of `input.activePointers`
- **Clean-round bonus of a variant lost on a close before "Dalej"** (impl review F5): the variant is now counted at its last answer (`TaskScene.submit`), but `cleanRoundBonus` is paid in `next()` at "Dalej"; a close in between records the day's puzzle without the bonus.
Trigger: the next change to variant rounds (`src/core/variants.ts`, `TaskScene.finishVariant`), or [human] row 14.4
- **ORDINAL art rule counts loaded icons, the generator shuffles all `ICONS`** (impl review F6): `artBlocked` 'ORDINAL' (`src/core/round/artFilter.ts`) admits the skill with ≥ `max` icons loaded, while `generateOrdinal` draws from all 15, so with many icons missing the G-4 redraw rarely helps and stand-ins show.
Trigger: the next change to `artFilter.ts` or `ordinal.ts`, or an "Obrazki" report with icons missing
- **Progress preview "began" rule** (impl review F7): `progressView` counts previous-stage misses from the earliest current-stage history entry, so warm-up misses show and a stage the parent just raised shows none.
  Visual gate 2026-10-16 (row 2.6): on E6.11 the E5 skill heads the list under its own E5 step title ("Dzielenie do 100, …", "Liczby słowami do 100; …"), with no stage name; the list reads clearly, but nothing tells the parent that the skill is from the previous half-year.
Trigger: a parent finding the list confusing, or the next change to `progressView`

## From the visual gate (2026-10-16)

- **E3.5 pyramid solution overflows at its third step** (VG-1): a pyramid with the base cell missing (`E3.5.pyramid_30`, e.g. values 10/7 3/6 1 ?) has three solution lines (method, reverse rule, `3 − 1 = 2`); at the third step `SolutionSteps` is clamped to `minScale` 0.6 and the hook's `solutionOverflow` is true (observed at 1440 and 1024, frames `*-pyramid-solution-step2.jpg`). Every line is still on screen above "Już wiem", but at 1024 the text is about 10 px tall. The perimeter composite (e2e #11) does not overflow.
Trigger: the next change to the PUZZLE_GRID hint lines (`src/core/tasks/generators/puzzleGrid.ts`) or to `TASK_LAYOUT.keypadSolution`, or a console report `Solution lines overflow at the smallest scale: E3.5.pyramid_30`
- **Money in a wrapped example breaks between the number and "zł"** (VG-2): the progress preview prints a wallet as "5 zł, 2 zł, 2 zł" with plain spaces, so the panel can wrap "2 / zł" (frame `desktop-progress-e1.jpg`).
Trigger: the next change to `src/ui/dom/progressView.ts` or `formatMoney`
