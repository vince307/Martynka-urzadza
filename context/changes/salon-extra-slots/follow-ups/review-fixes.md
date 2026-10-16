# Follow-ups — salon-extra-slots (S-16d)

Each entry has a `Trigger:` line; later slices grep for them.

- Texture atlas: the boot queue is about 2.33 MB (cold start about 46.6 s at 50 KB/s, close to the 50 s `totalMs`).
  Trigger: a field report of a slow first start, or a second room.
- "Wymień ..." can offer variant 0 = the current look. Trigger: S-17.
- VO1: the pouf sits under the variant tray. Trigger: the next change to `VariantPanel`.
- VO2: stand-in labels of overlapping pieces overlap (fired by the `RoomView.render` change; the five new stand-ins are checked in
  visual 3.7 with `?e2eArt=room`; a fix needs the one stand-in drawer). Trigger: the next change to `RoomView.render`.
- Per-file timeout test of `2026-10-16-final-art-p2` (fired by the `balance.loader` change; only `totalMs` changed, the per-file
  limit and its path are untouched). Trigger: the next change to `balance.loader` or the boot queue.
- VO3: the curtains hold outline overlaps the shelf and the cabinet. Trigger: a designer hold view, or S-17.
- L-7: per-layer state. Trigger: the next change to `RoomLayer`.
- L-4: the hit test asks `getPixelAlpha` in range (kept by the `holdPoint` clip). Trigger: a change to the room hit test.
- L-R8, L-R11 (RoomScene `stepPanel` refusals, `celebrate`/`onSleep`). Trigger: the next change to `RoomScene`.
- F1, F2 (earlier unchanged triggers). Trigger: unchanged, see their source changes.
- M-6 second half / P-6. Trigger: the next change to the deploy smoke.
- A done salon loses its shadows, mode button and teaser until task 12. Trigger: S-17, if the author dislikes it.
- `MINIGAME_WORDS` lacks the new furniture words. Trigger: the author asks.
- Costs 8-15 of the new tasks. Trigger: S-17.
- Plan review F3: a hold on an unbought default-look piece (old pouf, lamp) passes through to the bought slot under it.
  Trigger: a report of the wrong panel opening, or S-17.
- Plan review F2: the done-card miniature (`drawRoomMiniature`) does not clip the curtains above its top.
  Trigger: the visual gate finding it visible, or the next change to `drawRoomMiniature`.
