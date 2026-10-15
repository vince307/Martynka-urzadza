# Follow-ups — text-measure-time-types (S-14c)

Each item has a `Trigger:` line; later slices grep for it. Items moved on from earlier changes keep their source.

- **Set-the-clock hands in E5-E6 and a clock face answered by the minute**: no E5-E6 step has CLOCK in `types:` (ZADANIA section 3); CLOCK_ELAPSED covers minutes as text. (Moved from S-14 / S-13b.)
  Trigger: a CLOCK step in E5-E6 or a tablet test
- **Banknotes 200 and 500 zl without a skill**: PRICE is text and stays within 100 zl. (From art-tasks-all-stages.)
  Trigger: a money skill above 100 zł
- **WRITTEN "missing digits in the column" (E6)**: new box layout and checking. (From number-line-written-arrows.)
  Trigger: the next change to WRITTEN
- **F9: attempt limit in `draw` of `src/core/tasks/generators/written.ts`** (the new generators with a rejection loop already have `MAX_ATTEMPTS`).
  Trigger: the next change to WRITTEN
- **ARROW_TABLE "·n", a chain, several empty fields at once**: needs one answer per field. (From number-line-written-arrows.)
  Trigger: a multi-number reducer
- **LOGIC in E6.11**: E6.11 is MIX only; the puzzle pool of S-15 serves E3-E4 (`balance.variants.puzzleStages`). (S-15 F1.)
  Trigger: S-15 F1 (puzzle pool for E5-E6)
- **Timetable as a table**: the E5-E6 timetable prompt is text; the kit has no table widget.
  Trigger: a teacher read or tablet test finding the text timetable unreadable
- **Title of the review round in the HUD**: E6.11 rounds look like any round; the kit has no view for them.
  Trigger: a kit view for the review round
- **Text mass comparisons ("cięższe / lżejsze")**: they stay with the drawn scale (part of the S-14 "text variants of MASS" follow-up).
  Trigger: a teacher read asking for text mass comparisons
- **INEQUALITY mistake example in the parent preview** shows one canonical right answer, not the set of right tiles.
  Trigger: a v3 save or a parent asking about it
