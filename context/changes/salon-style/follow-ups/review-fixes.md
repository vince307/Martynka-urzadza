# Follow-ups — salon-style

Source: plan phases 1-5 and the handoffs of the run 2026-10-24-salon-style. New items first, then the items carried from earlier changes with their status after this change.

## 1. Salon thumbnail and loading background still show curtains
The pack thumbnail `salon-after` and the loading background were drawn with the old curtains; the live room, the miniature and the backdrop do not.
Trigger: the author delivers new UI art, or a room list with not-done rooms shows the thumbnail.

## 2. A proper "before" picture from the author
The before state is the after furniture under a worn grade (the coffee table keeps its vase of flowers and books, the rug is the same rug).
Trigger: the maintainer rejects the worn before state at the human acceptance row 5.6.

## 3. Canvas renderer before state
Under Canvas there are no filters: the worn pieces get a flat wash instead of the grade (design gap 169).
Trigger: a report of a Canvas-renderer device.

## 4. Turquoise nudge
`sofa-morska`, `ui/wallet-open` and `icons/cup` were not nudged to the palette turquoise (side by side showed no clear gain, decision P-5).
Trigger: a maintainer request.

## 5. Per-image filter cost
Each worn image carries its own ColorMatrix filter (two for upholstery); nothing is measured on a tablet.
Trigger: a tablet frame-rate report on the first room screen.

## 6. Carried items, status after this change
- final-art-salon F1 (`fadeStage` ghosts and the pop pause while `RoomScene` sleeps): closed, folded in phase 2.
- final-art-salon F2 (worn pieces get no stand-in in the miniature): open, not needed. Trigger: the next change to `drawRoomMiniature`.
- salon-extra-slots F2 (the miniature does not clip the curtains above its top): open. Trigger: the next change to `drawRoomMiniature`.
- final-art-salon VO2 / salon-extra-slots VO2 (overlapping stand-in labels) and F5 / F7 (one Box helper, one stand-in drawer): open. Trigger: the next change to `RoomView.render`, or a second room.
- salon-extra-slots L-7 (per-layer state in the hook): closed, the worn state is in the room snapshot (`worn`, `contactShadows`).
- salon-extra-slots L-R8 / L-R11: open except `onSleep` (folded with F1). Trigger: the next change to `RoomScene`.
- salon-load-health M-6 second half (service-worker install warn): open. Trigger: the next change to the room art set.
- per-file timeout test of final-art-p2: open. Trigger: the next change to `balance.loader` or the boot queue.
- fox-guide F4 (boot budget headroom): closed by headroom; the payload is 2 092 396 B, about 41.8 s at 50 KB/s against the 48 s the test allows. Trigger: `tests/bootBudget.test.ts` red.
- texture atlas: open. Trigger: precache over budget, a second room, or a slow-start report.
- gap 109 follow-up (in-between backgrounds): open. Trigger: the author delivers in-between backgrounds.
- GPU memory note: one full-scene texture fewer than before; open. Trigger: a tablet check finding memory trouble.
- "a done salon loses its shadows" until task 12: open, the whole shadows layer logic at `roomDone` is unchanged. Trigger: S-17 if the author dislikes it.
- audit-backdrop-fox F6 (`isSalonPixel` in `backdrop-restore.spec.ts`) and notebook-polish 16: fired (phase 3 edited `SalonBackdrop.render` and `BackdropSnapshot` for the `graded` count) and re-recorded open; the restore path, the blur and `holder.destroy(true)` are untouched and the `graded` count is no pixel proof. Trigger: the next change to `SalonBackdrop`.
- save-observability L-R9 (`stars.ts` `earn`, fired by the `RoomScene` edit) and salon-load-health M-5 (purchase flow under `writefail`, fired by the `fadeStage` edit): re-recorded open, no purchase, star or save code changed. Trigger: the next change to `stars.ts` or the purchase flow.
- first-furniture-purchase V1: closed by history (captions went with the art in S-16a).
- salon-load-health L-4 / salon-extra-slots L-4 (hit test): open. Trigger: a change to the room hit test.
