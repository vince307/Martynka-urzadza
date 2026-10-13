# Follow-ups — first-furniture-purchase (S-09)

Each item has a `Trigger:` line; later slices grep for them.

- Save `stars`, `rooms` and `currentRoom` from the registry (shape of `SaveState`, no migration needed) and save immediately after a purchase in `RoomScene` (the `bought` branch).
  Trigger: S-11
- Long press on a decorated slot (`RoomView.slotCenter`, `core/longPress`) to change its variant; "Pokój gotowy!" instead of the task button simply disappearing after the 10th task.
  Trigger: S-10
- Art and sound: real furniture frames for `variants`, the purchase sound in `playPurchaseSound`; thumbnails of very wide slots: a minimum aspect `ROOM_LAYOUT.thumbs.minAspect` 0.5 was added at the visual gate (9096a52), so floor and walls read as swatches; real art should replace the swatch.
  Trigger: S-16
- Cost curve (5, 6, 7, 8, 9, 10, 11, 12, 13, 15 = 96 stars, about 14 clean rounds) is authored content; tune with play data.
  Trigger: M8
- "An earlier save before daily play" now covers the room too (stars, rooms, currentRoom).
  Trigger: S-11
- A shared HUD button component (task, room switch, speaker) is still open.
  Trigger: unchanged (see earlier follow-ups)

## From the implementation review (reviews/impl-review.md)

- F1: "Wybieram" (`ROOM_LAYOUT.choose`, y 800-908) and the task button (`ROOM_LAYOUT.taskButton`, y 880-1008) overlap in x 1100-1580 × y 880-908. After a purchase `RoomScene.redraw` shows the next task's button there, so a quick double tap on the lower edge of "Wybieram" re-opens the panel for the next task (no stars are taken: `stepPanel` needs a pick and a confirm, but the child sees an unexpected panel). Fix: move the task button or the panel buttons so no panel target overlaps `taskButton`, and add a `tests/layout.test.ts` case "no tray target overlaps the task button".
  Trigger: S-09 visual gate (layout tuning) or S-10 (the variant change reuses the panel), whichever comes first
  Status: RESOLVED at the S-09 visual gate (9096a52): "Wybieram" is y 792-892 and the task button starts at y 892 (aligned with "Wróć do notesu"); `tests/layout.test.ts` "keeps \"Wybieram\" clear of the task button…" keeps them apart. "Zamknij" still shares the task button's place on purpose: a double tap there re-opens the same panel, never the next task.
- F4: `pl.room.name` ("Salon") is not drawn anywhere yet (only `tests/roomsData.test.ts` reads it); use it in the rooms list or remove it.
  Trigger: S-10
- F5: the lookups `(pl.room.tasks as Record<string, string>)[label]` (`RoomScene.redraw`, `RoomTaskButton.show`) and `(pl.room.slots as Record<string, string>)[id]` (`RoomView.render`) repeat a cast; `RoomScene.snapshot` repeats `ROOMS[...] ?? ROOMS[FIRST_ROOM]` instead of `this.room()`. One typed helper (e.g. `taskLabel(key)`) in `src/data/pl.ts` or the widget.
  Trigger: the next change to RoomScene or the room widgets (S-10)

## From the visual gate (reviews/visual-review.md)

- V1: slot captions collide: "podłoga" (floor, centre 960/690) and "dywan" (rug, 960/700) are drawn on top of each other, and "ściany" (walls, 960/362) sits on the "obraz" outline. Captions are placeholders drawn at the slot centre (`RoomView.render`); the floor and walls span the whole room, so their centre is shared with furniture. Fix with art (no captions) or a caption anchor for the wide slots in `src/data/rooms.ts`.
  Trigger: S-16 (art) or the next change to `RoomView` (S-10), whichever comes first
- V2: the rug pop drawing over the sofa (F7) could not be captured: the rug is the 5th task (5 + 6 + 7 + 8 + 9 = 35 stars, 5 clean rounds); code-reviewed only.
  Trigger: S-10 visual gate (the variant change re-runs the purchase animation)
