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

## From the implementation review (2026-10-15)

- **Spoken comparison reads without a verb**: `pl.speech.less` / `greater` give "okienko plus jeden mniejsze niż pięć" (E1.9, also COMPARE_EXPR). "… jest mniejsze niż …" reads better, but the words are shared by every type that speaks `<` / `>`, so the change needs its own teacher read of all of them.
  Trigger: the [human] tablet-voice check (plan row 4.8) or the next change to `src/core/narration/spoken.ts`
- **Unit symbols in `speak`**: MASS text and LENGTH `twoUnit` speak "560 g", "1 m okienko cm"; a Polish voice may spell the letters. Same as the existing MASS/LENGTH tasks.
  Trigger: the [human] tablet-voice check (plan row 4.8) finding a spelled unit
- **"Oblicz." before a place-value decomposition with a box** (E6.9 `9440 = 9000 + □ + 40` is spoken "Oblicz. …"): the shared spoken-equation prefix fits a calculation better than a missing part.
  Trigger: the next change to `src/core/narration/spoken.ts`
- **`TaskScene` `reported` is keyed by task index, never cleared at a new round**: guarded by `index` and `task.check`, and any stale value is one `check` accepts, so nothing wrong can show.
  Trigger: the next change to `TaskScene.submit` or the tile marking
- **CLOCK_ELAPSED `end` never crosses midnight** (`endEvents` end by 20.30); only `nightHours` does. Small drift from the plan, harmless for E5.3.
  Trigger: an `end` event in the evening or night
- **Duplicates**: `placeValue.ts` `withSpeech` repeats the digit-space stripping of `spoken.ts`; the ±5/10/15/60 time shifts in `clockElapsed.ts` repeat `clock.ts`.
  Trigger: the next change to either generator

## From the visual gate (2026-10-15)

- **E5.8 night-hours hint spoken with a dotted time**: the hint line "Najpierw policz godziny do północy, czyli do 24.00." is read as written; other times go through `spokenTime` ("8 15").
  Trigger: the [human] tablet-voice check (plan row 4.8) or the next change to `clockElapsed.ts` hints
- **Three-line hint bar beside the keypad sits at the 12-CSS-px floor** (`FeedbackBar.update` fits the text to the bar height): a first hint line over ~70 characters would wrap to a fourth line below it. Longest today: 67 (E5.12).
  Trigger: a new hint line over 70 characters on a keypad skill
- **`fitPieces` has no minimum scale**: an expression longer than the E6.9 four-term decomposition would shrink below the prompt size without a floor.
  Trigger: a place-value decomposition beyond four terms or five-digit numbers in an expression beside the keypad

