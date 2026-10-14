# Follow-ups — number-line-written-arrows (S-14b)

Each item has a `Trigger:` line; later slices grep for it.

- **WRITTEN "missing digits" variant (E6)**: some digits of the operands are blanks the child fills, other box positions and other checking. Decision 5 of the change.
  Trigger: S-14c or the next change to WRITTEN
- **ARROW_TABLE**: the "·n" rule, a chain of two arrows and several empty fields at once (ZADANIA wording); needs one answer per field.
  Trigger: S-14c or a multi-number reducer
- **Hint number line for E1 (tiles tasks) and for ADD_SUB above 30**: there is no room above the tiles and ticks are unreadable beyond 30.
  Trigger: S-14d (E1 picture mode) or a layout band above the tiles
- **E1.10 `place_read_12`**: 11 and 12 are two numbers, the task space is too small for the content invariants.
  Trigger: S-14d
- **E5.5 `capacity_half_l_e5`**: the task space ("how many half litres") is too small.
  Trigger: S-14c
- **Shared `ArtPool`/`fitRect`; S14-09 / S14-10** (a key outside `TASK_ART` has 1:1 proportions, `images[i]?.show` drops items beyond the pool). The number line, graph and column are drawn in code and do not use `ArtImage`.
  Trigger: the next widget built on ArtImage
- **O6 / O2 (a drawing in the 190 px solution strip beside the keypad)**: closed for the number line (190 px is enough) and the written column (own `digits` layout); stays open for other drawings.
  Trigger: next change to the solution layout beside the keypad
- **Visual gate for the written column** (never seen on screen before the gate): 2- and 3-column layouts, carry and borrow marks at scale 1.3, provisional `TASK_LAYOUT.picture.digits` / `hint` / `written` (gaps 92, 93).
  Trigger: the visual gate of this change
- **Mistake example of a `digits` task in the parent preview** is stored as a number only; a drawing (gap 58) is not kept.
  Trigger: a v3 save that records the example differently

## From the implementation review (2026-10-15, `reviews/impl-review.md`)

- **F4: hint-line ADD_SUB skills lose the S-03 "20 − 7" decomposition** (`src/core/tasks/generators/addSub.ts` `generateAddSub`, `line` branch): DT − U now has one line plus one jump back on the number line instead of "10 − 7 = 3 | 10 + 10 = …". Keep, or show the `addSubHint` text beside a one-jump line.
  Trigger: the author's read ([human] 9.6) or the next change to `addSubJumps`
- **F5: a validator rule "a tall drawing needs tiles or keypad"** (`src/core/tasks/validate.ts` `validateTask`), so `tallOf` in `src/core/round/pictureLayout.ts` can never throw at runtime; at the same time turn the mode rules into a `switch` with `never` (F6).
  Trigger: the next tall drawing or the next change to the mode rules of `validateTask`
- **F8: widget tokens**: text colour `'#245c59'` in `ArrowGraph`, `NumberLine`, `NumberCells` → a token in `src/data/layout.ts`; `WrittenColumn.render` offsets (`12 * s`, `22 * s`) → `TASK_LAYOUT.written`; `BlockMat`'s private `dashedRect` → `src/ui/widgets/dashed.ts` with a gap parameter.
  Trigger: the next change to any of these widgets
- **F9: cap `draw` in `src/core/tasks/generators/written.ts`** (no `MAX_ATTEMPTS` today; all current params are satisfiable).
  Trigger: S-14c or the next change to WRITTEN
- **F10: written column at the visual gate**: the hint phase draws the first carry/borrow column, which may differ from the ones line of the first hint (330 + 571); "OK" with empty boxes does nothing (`TaskScene.pressBoxKey`) — a nudge may help.
  Trigger: the visual gate of this change
