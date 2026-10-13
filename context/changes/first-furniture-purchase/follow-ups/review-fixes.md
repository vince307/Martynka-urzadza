# Follow-ups — first-furniture-purchase (S-09)

Each item has a `Trigger:` line; later slices grep for them.

- Save `stars`, `rooms` and `currentRoom` from the registry (shape of `SaveState`, no migration needed) and save immediately after a purchase in `RoomScene` (the `bought` branch).
  Trigger: S-11
- Long press on a decorated slot (`RoomView.slotCenter`, `core/longPress`) to change its variant; "Pokój gotowy!" instead of the task button simply disappearing after the 10th task.
  Trigger: S-10
- Art and sound: real furniture frames for `variants`, the purchase sound in `playPurchaseSound`; thumbnails of very wide slots (floor, walls 1560x340) shrink to thin strips in the 200 px box, check at the visual gate and give them a minimum readable aspect.
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
- F4: `pl.room.name` ("Salon") is not drawn anywhere yet (only `tests/roomsData.test.ts` reads it); use it in the rooms list or remove it.
  Trigger: S-10
- F5: the lookups `(pl.room.tasks as Record<string, string>)[label]` (`RoomScene.redraw`, `RoomTaskButton.show`) and `(pl.room.slots as Record<string, string>)[id]` (`RoomView.render`) repeat a cast; `RoomScene.snapshot` repeats `ROOMS[...] ?? ROOMS[FIRST_ROOM]` instead of `this.room()`. One typed helper (e.g. `taskLabel(key)`) in `src/data/pl.ts` or the widget.
  Trigger: the next change to RoomScene or the room widgets (S-10)
