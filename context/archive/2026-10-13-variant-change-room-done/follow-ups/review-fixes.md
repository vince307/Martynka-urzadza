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

## From the implementation review (reviews/impl-review.md)

- F4: two `Box` types — `src/core/roomHit.ts` `Box` (edges) and `src/ui/widgets/RoomView.ts` `Box` (width/height); rename one or add a converter when slot frames change for art.
  Trigger: S-16
- F6: `RoomDoneCard` `drawRoomTile`/`drawTeaserTile` draw the check mark and padlock with inline numbers; move them into `ROOM_DONE_LAYOUT.tiles` if the placeholders outlive the art.
  Trigger: S-16
- F5: the change-mode hint „Stuknij mebel, który chcesz zmienić.” names furniture while floor, walls and curtains also change; alternative „Stuknij to, co chcesz zmienić.” — maintainer's copy decision.
  Trigger: human checklist row 6.8 (S-10)

## From the visual gate (reviews/visual-review.md)

- V2: the change/purchase pop (`RoomScene.celebrate`) draws the rug over the sofa for 2 × 260 ms (frame 05); with per-slot objects for art, pop the slot's own object at its depth.
  Trigger: S-16
- V3: placeholder captions vanish on a matching fill ("stolik" on the deep-teal table, "obraz" faint on turquoise over turquoise walls); art replaces the backgrounds, or give captions a light backing.
  Trigger: S-16
- V4: the change mode has no visible cue beyond the button reading "Gotowe"; the hint is narration only and not auto-read. Options: auto-read `pl.room.change.hint` on entering the mode, or draw it above the room (needs a DESIGN-GAP row).
  Trigger: human checklist row 6.7 (S-10)
- V5: the change panel does not mark the thumbnail of the current look (the room shows it).
  Trigger: human checklist row 6.7 (S-10)
- Closed here: V2 from S-09 captured (frame 05); V1 captions confirmed apart, plus the rug caption moved off the sofa (a3dade4).
