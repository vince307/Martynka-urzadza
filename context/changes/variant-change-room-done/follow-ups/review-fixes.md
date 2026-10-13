# Follow-ups — variant-change-room-done (S-10)

Each item has a `Trigger:` line; later slices grep for them.

- Save after a variant change (the `changed` branch of `RoomScene.dispatch`) and after a purchase; the "Pokój gotowy!" card does not return after a cold start (no "seen" flag): decide at save time whether a flag is needed.
  Trigger: S-11
- Art: slot hit-testing and the hold outline for real furniture frames (the code-drawn placeholders go away), the salon miniature in the room list from art, a sound for the change.
  Trigger: S-16
- A second room: add it to `ROOM_ORDER` in `src/data/rooms.ts`; the list shows it and the card's teaser moves on.
  Trigger: v1.1
- Tune `balance.roomHold` (600 ms / 40 px) on tablets with children.
  Trigger: M8 / S-17

## Closing of the S-09 follow-ups with `Trigger: S-10`

- Long press on a decorated slot and "Pokój gotowy!": done in phase 4 (8baf606, hold, free change) and phase 5 (f5e153a, card, mode).
- F4 (`pl.room.name` unused): used by `RoomDoneCard` for the tile name, phase 5 (f5e153a).
- F5 (repeated casts): `roomText` in `src/data/pl.ts`, phase 4 (8baf606).
- V1 (colliding captions): `captionAnchor` for wide slots, phase 2 (9c79ea2), used by `RoomView` since phase 4.
- V2 (rug pop over the sofa): the change re-runs the purchase animation; to be captured at the S-10 visual gate (row 5.6).
