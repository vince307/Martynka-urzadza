# Follow-ups — narrator-round-summary (S-05)

Each item has a `Trigger:` line; later slices and reviews grep for it.

## Content and scope

- `summaryView` gets the cost of the current renovation task (`nextRoomTaskCost` is `null` today), so "Do pokoju" is highlighted when the child can afford it (FR-010, docs/design-gaps.md row 10).
  Trigger: S-09
- `numberToWords` covers numbers above 1000 in spoken calculations; today digits are read by the synthesiser.
  Trigger: listening test on a tablet finds large numbers misread
- "Oblicz." before comparison tasks (`isExpression`): the prefix is not added to comparisons yet.
  Trigger: S-17 or the next change to `drawPrompt`
- Parent switch for auto-read (`autoRead`), with the saved value; until then it is the per-stage default for the session.
  Trigger: S-08 (parent settings), S-11 (save)

## Test plan and tooling (owner: `/10x-test-plan refresh`)

- Add the narrator risk (voice quality, gesture unlock, speaker hidden without a Polish voice) to the test plan and give risk ids to the narrator spec titles.
  Trigger: /10x-test-plan refresh

## Carried over from S-04

- `pl.title` and bare animation/stroke numbers in widgets (`lineStyle(3/4)`, `shakeMs / 6`).
  Trigger: S-06 (Welcome screen uses the title)
- Solution step indicator dots (one per step, kit `.step-indicator`) need the step count in `roundView` and a small change in `SolutionSteps`.
  Trigger: the next change to `SolutionSteps`
