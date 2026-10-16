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
