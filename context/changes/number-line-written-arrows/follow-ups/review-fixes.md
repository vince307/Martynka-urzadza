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
