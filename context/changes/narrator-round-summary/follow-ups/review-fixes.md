# Follow-ups — narrator-round-summary (S-05)

Each item has a `Trigger:` line; later slices and reviews grep for it.

## Content and scope

- `summaryView` gets the cost of the current renovation task (`nextRoomTaskCost` is `null` today), so "Do pokoju" is highlighted when the child can afford it (FR-010, docs/design-gaps.md row 10).
  Trigger: S-09
- `numberToWords` covers numbers above 1000 in spoken calculations; today digits are read by the synthesiser.
  Trigger: listening test on a tablet finds large numbers misread
- "Oblicz." before comparison tasks (`isExpression`): the prefix is not added to comparisons yet; and the commutativity equation `11 + 3 = 3 + □` is read with "Oblicz." in front (teacher read: odd but harmless).
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

## From impl-review (2026-10-13)

- `Narrator.unlock` speaks an empty utterance; WebKit may ignore it, so it might not count as the gesture unlock on iPad. Use a short text at `volume = 0` (add `volume` to `UtteranceLike`) if the listening test shows auto-read silent.
  Trigger: iPad listening test (plan row 10.9)
- `SpeakerButton` and `RoomSwitchButton` repeat the HUD frame, visibility, target and press handling (PageButton repeats the press guard); `SpeakerButton` has no "press began on me" guard; `RoomSwitchButton.draw` has inline house-icon numbers. Extract a shared HUD button (frame, press guard, visibility, target, icon callback).
  Trigger: S-09 or the next change to a HUD button
- `pl.tasks.romanContexts[i]` and `romanSpeakContexts[i]` are parallel arrays tied by index (`roman.ts` assumes the first two are clock and floor). Make them one array of `{ show, speak }` pairs.
  Trigger: the next change to `romanContexts`
- ROMAN and CALENDAR first hint step already contains the result (`romanHint` "…; razem 10 + 1 = 11", "X to 10, czyli 10. miesiąc"), against the CLAUDE.md teacher rule (pre-existing from S-02/S-03; the narrator only reads what is on screen).
  Trigger: S-17 or the next change to `romanHint`
- e2e hook: while the room is open, `targets.nextRound` and `targets.toRoom` still report the sleeping summary's buttons; report `null` when `screen === 'room'`.
  Trigger: the next change to `src/testing/e2eHook.ts`
