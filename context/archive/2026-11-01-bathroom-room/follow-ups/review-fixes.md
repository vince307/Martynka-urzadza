# Follow-ups — bathroom-room (S-31)

Each item carries a `Trigger:` line; a later slice greps for them. Items from earlier changes are included because this slice
changed the file their trigger names or fired their trigger; each is closed with evidence, or re-recorded with the trigger kept.

## New

1. A sixth room in one house does not fit the room-done card (five tiles = 1888 wide is the limit, design gap 204).
   Trigger: a house with six rooms.
2. Finishing the bathroom (house 1 complete) shows the ROOM celebration, not the PRD FR-040 'house' intensity.
   Trigger: S-24 (residents, the finished-house moment).
3. The bathroom wording and the pack's "regał z ręcznikami" / "półka z zabawkami" are ours (gap 205); a teacher read is a plan row.
   Trigger: the designer's bathroom copy, or the next change to the bathroom rows of `src/data/rooms.ts`.

## Fired by this change and closed

4. Kids-room 1 (four-tile card): closed by `roomDoneCardRect` and the four-tile card (gap 204, `tests/layout.test.ts`).
   Trigger: none (closed).
5. Kids-room 3 (`ROOM_DONE_LAYOUT.tiles.left` unused): closed, the field is gone from `ROOM_DONE_LAYOUT`.
   Trigger: none (closed).
6. House-cross-section 21 / kids-room 11 (a browser test for `houseButton` while the card is up): closed by the phase 6 spec
   `tests/e2e/bathroom-room.spec.ts` (verified at phase 6, committed 883a68b; impl review re-ran the fixed-1144-card break red).
   Trigger: none (closed).

## Fired and re-recorded (still open, with the reason)

7. Kids-room 7 (texture atlas): fired by the fourth room; measured, the bathroom adds 21 files, about 592 KB, boot loads only the
   room in renovation, `tests/bootBudget.test.ts` green.
   Trigger: `tests/bootBudget.test.ts` headroom under `balance.loader.totalMs` drops below 2 s, or a room heavier than the salon.
8. Final-art-salon F2 (`drawRoomMiniature` stand-ins on one `Graphics`): the card changed, the miniature drawing did not.
   Trigger: the next change to `drawRoomMiniature` or the stand-in drawer in `RoomView.render`.
9. Hangar 4 (a room finished on an older build meets the next without the card): carried for the children's room -> bathroom.
   Trigger: a change to `nextRoom` or to the load path in `src/main.ts`.
10. Kids-room 10 / kitchen-room 6 (service-worker install warning): the precache set grew by 21 room pictures, the warning is unchanged.
    Trigger: the next change to `src/pwa/registerServiceWorker.ts` or to the precache set.
11. Kids-room 2 (`wornPieces` and `contactShadowPieces` mean "until the first stage").
    Trigger: S-32 (the kitchen renovated in stages like the children's room).
12. Kids-room 7 second half (three-digit balance nearly touches the star in the HUD pill).
    Trigger: the next change to `StarCounter` or `hudPill.ts`, or S-17.
