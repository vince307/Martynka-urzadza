# Follow-ups — notebook-polish

Source: plan phases 1-11 and the handoff notes of the run 2026-10-22-notebook-polish. Open items first, closed ones at the end.

## 1. Bounce and wobble for `digits` and dice answers
Those modes have no single answered object (a written column, dice), so they get no bounce or wobble; the star and the counter pop still run.
Trigger: the next change to `TaskScene.answerFace` or a playtest note that a digits or dice answer feels flat.

## 2. Lip and press for `SelectTiles`, `CoverBoard`, `LetterTiles`, `Dice`
They keep their own lips and do not use `ChunkyFace`.
Trigger: the next change to one of these widgets, or the maintainer at the visual gate.

## 3. Welcome cushion
The kit welcome has a cushion; it overlaps the parent entry and stays out (design gap 20).
Trigger: the "Rodzic" button moves.

## 4. The "star" sound against the landing pop
The sound cue plays when the star starts, the counter pops when it lands.
Trigger: the S-17 balance pass, or a playtest note that sound and pop feel apart.

## 5. `FontFace` load limit
Re-recorded from the health-lines-and-smoke change: the font load path in `BootScene` is unchanged (only the file name moved to `MartynkaNext.ttf`), still no per-file limit.
Trigger: a field report of a stuck start, or the next change to the font loading in `BootScene`.

## 6. Salon sleep follow-ups
Re-recorded: `RoomScene.celebrate` only swapped its code for `starBurst`; the older sleep items stay as they were.
Trigger: the next change to the `RoomScene` wake and sleep handling.

## 7. Solution step indicator dots
Re-recorded: the dots that show the solution step are still the old ones, not beads.
Trigger: the next change to the solution phase of `TaskScene` or `ProgressDots`.

## 8. FeedbackBar text size
Trigger: the visual gate or a tablet check finds the bar text unreadable.

## 9. Bursts for the unlock card and the minigame-done card
Only the summary and the purchase have a burst.
Trigger: maintainer request.

## 10. Spine band and offset shadow
Decision D-1: no spine band (kit stitch marks only) and the shadow straight down, not lower-right as scope.md worded it.
Trigger: the maintainer at the visual gate asks for the band or a lower-right shadow.

## 11. Safari acceptance of the modified font
Chromium accepts the file in the e2e build; iPad Safari is checked by the [human] row 11.8. If it falls back, revert `public/fonts/` and the `layout.ts` constants to the original file, keep `scripts/make-font.py`.
Trigger: the [human] iPad row finds a fallback or `fontHealth` is not `loaded`.

## 12. Bare stroke and animation numbers in widgets this change did not touch
Re-recorded from `narrator-round-summary`.
Trigger: the next change to a widget with literal stroke widths or durations.

## 13. Hint number line labels
The 0..30 hint line labels sit at 12.1 CSS px after the keypad moved right (fix `5d901ff`); fewer labelled ticks would give room.
Trigger: a tablet check finds the hint labels too small.

## 14. Backdrop re-capture cost
`SalonBackdrop` captures on create and on wake only; a purchase made while a task screen sleeps is picked up on wake.
Trigger: a playtest note that the backdrop shows a stale piece.

## 15. Literals and borrowed tokens left by the polish (impl-review F5)
`hudPill.ts` `PRESSED_FILL` (0xfff0cc, repeats `HUD_PILL.bottom`), the ease names `'Sine.easeOut'`/`'Sine.easeInOut'` in `TaskScene.bounce`/`wobble` and `StarCounter.pop`, `SHADOW_STEPS` and the stitch highlight in `notebook.ts`, the default speed range of `starBurst`, the summary burst depth borrowed from `ROOM_LAYOUT.depth.celebrate`, `WELCOME_LAYOUT.flower.key` written by hand instead of from `TASK_ART`, the unused `TASK_LAYOUT.starCounter.border`, and `notebookGeometry().edge` computed but `drawNotebook` drawing the edge from `NOTEBOOK.edge`.
Trigger: the next change to `src/data/layout.ts` animation or HUD tokens, or to `notebook.ts`/`hudPill.ts`.

## 16. Small seams found by the implementation review (impl-review F6-F8)
`TASK_LAYOUT.barSpan.keypad.x` is 310, 4 px left of `CONTENT_LEFT` (314); `starBurst` relies on its callers for the reduced-motion check (no guard of its own); `Keypad` has no `killTweensOf` on hide (its field wobble ends at rest by itself); `WelcomeScene.backdropState` sits under the JSDoc of `targets`; the bounce of a select/drag "OK" at a correct answer is cut when the button hides in the done phase (the star and the counter pop still run); `SalonBackdrop.render` assumes `holder.destroy(true)` frees the filter camera made by `enableFilters()` (not read in the Phaser 4.2.1 source).
Trigger: the next change to `SalonBackdrop`, `starBurst`, `Keypad`, `WelcomeScene` or the bar layout, or the visual gate finds the bar crossing the margin.

## Closed by this change
- Slashed zero: closed in phase 10 (`MartynkaNext.ttf`).
Trigger: none (closed); reopen if a browser shows the old zero.
- Shared HUD button: closed in phase 6 (`hudPill.ts`, `ChunkyFace` for speaker and room switch).
Trigger: none (closed).
- Star over the 9 key: closed in phase 7 (`answerSpot` is the entry field centre).
Trigger: none (closed).
- Star freezing while asleep, pop part: closed in phase 7 (`starLanded` event).
Trigger: none (closed).
- `StarCounter` value never asserted: closed (`tests/motionWiring.test.ts` guards the synchronous `setValue`).
Trigger: none (closed).
