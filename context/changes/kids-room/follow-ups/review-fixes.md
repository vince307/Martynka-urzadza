# Follow-ups — kids-room (S-25)

Each item carries a `Trigger:` line; a later slice greps for them. Items from earlier changes are included because this slice
changed the file their trigger names (`src/core/rooms.ts`, `src/ui/widgets/RoomView.ts`, `src/scenes/RoomScene.ts`,
`src/data/rooms.ts`, `src/data/houses.ts`, `src/data/roomArt.ts`, `src/data/layout.ts`, `scripts/make-task-art.mjs`) or fired
their trigger; each is closed with evidence, narrowed, or re-recorded with the trigger kept.

## New

1. Four-tile room-done card: tiles are 340 wide with a 32 gap (three fit); a fourth room needs a further change (design gap 204).
   Trigger: S-31 (the bathroom, the fourth room of house 1).
2. `wornPieces` and `contactShadowPieces` mean "until the first stage" for a staged room; they say nothing about the in-between looks.
   Trigger: S-32 (the kitchen renovated in stages like the children's room).
3. `ROOM_DONE_LAYOUT.tiles.left` is no longer read by the card layout; kept so the diff stayed in data.
   Trigger: the next change to `ROOM_DONE_LAYOUT` or `RoomDoneCard`.

## Fired by this change and closed

4. House-cross-section 13 / rooms-as-data 11 (the children's room id and its cell): closed, `children` sits at `upper-left` of
   `HOUSES['house-1']` (`tests/houseCells.test.ts`, `tests/roomsData.test.ts`).
   Trigger: none (closed).
5. Salon-style F4 (`ghostTweens`, the stage ghost): closed by phase 2, where the stage fade is the one `stageFade` rule.
   Trigger: none (closed).

## Satisfied, carried

6. Hangar 5 (the e2e spec cannot tell the Hangar after picture from the before one): satisfied for the children's room, whose
   stage keys are in `roomArt` and read by the phase 6 spec; the Hangar spec is unchanged.
   Trigger: a change that draws the room background from something other than `ROOM_SCENE_FILES`.

## Fired and re-recorded (still open, with the reason)

7. Kitchen-room 5 (texture atlas): fired by the third room; measured, not needed (the children's room adds 23 files, boot loads
   only the room in renovation, `tests/bootBudget.test.ts` green).
   Trigger: `tests/bootBudget.test.ts` headroom under `balance.loader.totalMs` drops below 2 s, or a room heavier than the salon.
8. Final-art-salon VO2/F5/F7, salon-extra-slots VO2 and rooms-as-data 12 / kitchen-room 8 (one `Box` helper, one stand-in drawer,
   overlapping stand-in labels in `RoomView.render`): this slice edited `RoomView` but not the stand-in drawer; the visual pass
   frame 12 (`?e2eArt=room`) looks at the children's stand-ins.
   Trigger: the next change to the stand-in drawer in `RoomView.render`, or a stand-in label that overlaps in frame 12.
9. Salon-extra-slots L-R8 / L-R11 (`RoomScene` refusals, `celebrate`): `RoomScene.fadeStage` changed, the purchase flow did not.
   Trigger: the next change to the purchase flow or `celebrate` in `RoomScene`.
10. Salon-load-health M-6 second half (service-worker install warning, room art set): the room art set grew by 23 files, the warning
    is unchanged.
    Trigger: the next change to `src/pwa/registerServiceWorker.ts` or to the precache set.
11. Kitchen-room 4 (thumbnails) and house-cross-section 21 (a browser test for `houseButton` while the card is up): not fired.
    Trigger: a not-done room shown with a pack thumbnail, or the designer's thumbnails (brief P3); a change to the celebration card.
12. Kitchen-room 13 (task wording needs the designer's copy): the children's wording is ours (gap 202), a teacher read is row 3.7.
    Trigger: the designer's children copy, or the next change to the children rows of `src/data/rooms.ts`.
