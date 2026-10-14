# Follow-ups — drawn-grid-tasks-e3-e4

Each item has a `Trigger:` line; later slices grep for it.

## Moved out of S-13b

- BONDS with pairs and CHOOSE_OP with a picture. Trigger: S-14d
- "Set the clock" in E5-E6 and answers to the minute (not only 5 min). Trigger: S-14c or a tablet test
- PERIMETER composite figures taller than 5 lattice rows (design-gaps row 78; needs a taller keypad-solution strip). Trigger: next change to `pictureLayout` / the solution layout beside the keypad
- S13-09 (`blockDrag` `down` with the same `pointerId` while carrying is ignored). Trigger: next change to blockDrag
- S13-05 and S13-11..S13-14 (audit 2026-10-14, not touched here). Trigger: next change to the code each finding names, or the next select/drag skill
- S13-06 (parent mistake preview cannot hold a drawing or a clock answer; design-gaps row 58). Trigger: S-15 save format v2

## Decisions against the literal text of ZADANIA (author read, row 10.6)

- E4.3 "set" covers quarters only (reading every 5 min stays); the hour hand is chosen separately, not by gearing; the grid is 5 x 4 not the kit's 8 x 5; ranges where ZADANIA is silent (square <= 30, sides 2-20 cm, E6 perimeter <= 40). Trigger: author read of the sample (row 10.6)
- Higher unlock thresholds for learners saved on E3.3, E3.5, E3.7, E3.11, E4.7 (slower, nothing lost); E6.1 leads to E6.3 instead of E6.4. Trigger: a child stuck on one of those steps

## From the implementation review (reviews/impl-review.md)

- F5: the `pointerupoutside` -> `cancel` listener in `TaskScene.create` is proven by neither a unit nor an e2e test (break p12c covers `lift` with `wasCanceled`). Trigger: next change to the drag wiring in TaskScene
- F4: "OK" is ignored while a clock hand is held (`TaskScene.create`, `ClockSet` callback); no automated two-finger case. Trigger: next change to the drag wiring in TaskScene
- O2: one dial geometry source (`ClockFace.render` recomputes `clockSetLayout`'s scale; hand-tip trig in `clockSet.grab`, `ClockSet.tipOf`, e2e `onDial`); one pointer event type for `blockDrag`/`clockSet` (`TaskScene.feedDrag` intersection); `TaskScene` `visual.snap ?? 60`; `clockHandAngles` moved out of `core/round/pictureLayout` (imported by `core/tasks/generators/clock.ts`); unused `figureLayout` `look.minCell`; `CoordGrid` heart colour/offsets and `NumberCells` `'#245c59'` into tokens. Trigger: next change to ClockFace, ClockSet or the grid widgets
- O4: PERIMETER `composite` rejection loop has no cap (feasible, but ~1-3 % acceptance at parser minimum `max` 12); raise its minimum or add a draw test at the minimum. Trigger: next change to perimeter.ts
- O4: spoken "Ustaw zegar na godzinę 1 i 45 minut" (`pl.tasks.clockSetSpeak`), `2 · a + 2 · b` step for rectangles (`perimeterHint`), 'kwadrat' as a grid item (`src/data/gridItems.ts`). Trigger: author read of the sample (row 10.6)

## From the visual gate (reviews/visual-review.md)

- O1: the coordinate grid uses a small part of the tiles picture area on the tablet (`CoordGrid.render`, `TASK_LAYOUT.coord`); letters 13.6 CSS px. Trigger: next change to CoordGrid or the tiles picture layout
- O2: a handle ring covers the numeral under the tip and two rings overlap when the hands are close (`ClockSet`, design-gaps row 77). Trigger: tablet check of row 8.7
- O3: in the solution of "ustaw zegar" the dial keeps the start pose; the last step could show the target pose (`ClockSet.render`, `TaskScene.render`). Trigger: author read (row 10.6) or next change to ClockSet
- O4: composite figures are white on the lattice; the kit fills grid figures leaf/butter (`FigureGrid`). Trigger: next change to FigureGrid
- O5: `E5.5.capacity_quarter_l` keypad first hint is 75 characters and shrinks the bar text to ~10 CSS px on the tablet; it is the one entry of `LONG_KEYPAD_HINTS` in `tests/contentInvariants.test.ts`. Trigger: S-14b or the next content change to CAPACITY
- O6: the magic square in the 190 px keypad solution strip has ~9 px digits on the tablet (`TASK_LAYOUT.picture.keypadSolution`). Trigger: next change to pictureLayout / the solution layout beside the keypad
