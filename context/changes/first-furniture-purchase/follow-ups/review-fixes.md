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
