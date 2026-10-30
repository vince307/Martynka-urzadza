# Follow-ups — rooms-as-data (F-04)

Each entry carries a `Trigger:` line; later slices grep for it.

## Open

1. "Stan salonu" mismatch lines in the settings "Zapis gry" section name only the salon's task list; a second room needs its own line.
   Trigger: S-22 (kitchen room).
2. Wire `nextRoom` after "Dalej" on the "Pokój gotowy!" card (today the card ends and the child returns to the room she left).
   Trigger: S-22 (kitchen opens after the salon is done).
3. A room without a pack thumbnail (the kitchen) is shown through the `drawn` miniature; check it looks right on the done card.
   Trigger: S-22 (kitchen tile).
4. `salon-before` thumbnail is not converted, and the salon thumbnail and loading background show curtains.
   Trigger: S-22 kitchen tile shown not done.
5. Texture atlas and boot budget: the kitchen pack adds load weight.
   Trigger: S-22 `tests/bootBudget.test.ts` fails or headroom under `balance.loader.totalMs` drops below 2 s.
6. M-6 second half, service-worker install warning for a larger room art set.
   Trigger: the next change to the room art set (S-22).
7. Plan review F3 / audit M-R5: throw when the room panel is open and the placeholder is missing; the room celebration with an intensity parameter (FR-040) also lands here.
   Trigger: S-22 (celebration).
8. GRD-09 (drawing beside a mistake example) and S13-06 (drawn-grid), re-recorded: v5 holds only the house and the floor grid.
   Trigger: the next save-format change (v6) or a parent asking.
9. SV2-13: one bad `variants` field rejects the whole save; v5 did not touch `variants`.
   Trigger: the next save-format change (v6).
10. E2E on two real builds (v4 build writes, v5 build reads); proven today by unit tests on the real IndexedDB load path and an e2e on the in-memory seam `?e2eSave=v4-salon` (decision P-6, `[human]` row 6.8).
    Trigger: v6, or a cross-build report from a device.
11. Kids' room id and closed cells in the house (the grid shape in data has a closed cell and a first-floor left cell).
    Trigger: S-25 (residents) or S-23 (house shell art).
12. `RoomView.render` stand-in drawer and one `Box` helper (F5/F7, VO2) were not touched.
    Trigger: the next change to `RoomView.render`.
13. L-R8 `stepPanel` refusals.
    Trigger: the next change to `RoomScene` purchase handling.

14. Implementation review F4: `RoomDoneCard.show` sets `mode` (what `miniature()` and the hook's `doneMiniature` report) only from the tile whose room is `current`; when the current room is not among the listed rooms (a save whose house id is unknown, or a current room outside the house list) `mode` keeps its previous value. With one room it cannot happen.
    Trigger: S-22 (a second real room on the card), or a change to `houseRoomList` that can drop the current room.
15. Implementation review F3: the frozen `copyOfHouseV5` in `src/core/migrations/house.ts` repeats `copyHouse` of `src/core/house.ts` on purpose (a frozen step never depends on code that may change). Keep it; never point the migration at `copyHouse`.
    Trigger: the next change to `src/core/migrations/` or the v6 save format.

## Closed by history

- P-8 keep the first `backup-v3`: `backup-v<N>` copies are write-once since save-truth; `backup-v4` inherits that with no new mechanism.
- Earlier stale signal: save-truth added `BroadcastChannel` and `channelVerdict`.
