# Follow-ups — kitchen-room (S-22)

Each item carries a `Trigger:` line; a later slice greps for them.

1. S-23 replaces the interim visit button.
   Trigger: S-23 (house cross-section). Done rooms are then drawn in the cross-section through `roomArtLoader`, and `ROOM_LAYOUT.visitButton`, `visitTarget` and the `visitButton` hook target go away (design gap 180).
2. A visited room is not judged by "Obrazki".
   Trigger: a change to `artHealth` / the "Obrazki" section, or a report that a visited room shows stand-ins. Its missing pictures are stand-ins with no health line (plan review F2); only the current room is judged.
3. The runtime loader does not run the boot's `wrongSizes` check (plan review F5).
   Trigger: the next change to `src/ui/roomArtLoader.ts`. A wrongly sized file loaded at runtime draws stretched without a log line; `tests/roomArt.test.ts` pins sizes per room.
4. `salon-before` thumbnail is not converted; the kitchen tile on the card uses the live or drawn miniature (F-04 follow-up 4).
   Trigger: a not-done room shown with a pack thumbnail, or the designer's thumbnails (brief P3).
5. Texture atlas (F-04 follow-up 5).
   Trigger: `tests/bootBudget.test.ts` fails again, or a third room. This slice kept the budget by loading only the room in renovation at boot.
6. Service-worker install warning (F-04 follow-up 6, salon-load-health M-6).
   Trigger: the next change to `src/pwa/registerServiceWorker.ts` or to the precache set.
7. Throw when the room panel is open and a placeholder is missing (F-04 follow-up 7).
   Trigger: the next change to `RoomView.redraw` or the variant panel.
8. One `Box` helper, one stand-in drawer, overlapping stand-in labels (follow-up 12, final-art-salon F5/F7/VO2).
   Trigger: the next change to `RoomView.render`.
9. `stepPanel` refusals (follow-up 13, L-R8).
   Trigger: the next change to the purchase flow in `RoomScene`.
10. `drawRoomMiniature` follow-ups: stand-in depth, curtains clip, worn stand-ins, grade boolean (final-art-salon F2, salon-extra-slots F2, salon-style 27/28).
    Trigger: the next change to `drawRoomMiniature`.
11. Purchase end-to-end under `writefail` (salon-load-health M-5).
    Trigger: a change to the purchase flow in `RoomScene` (re-recorded, still not fired).
12. House and street celebration copy and the keepsake.
    Trigger: S-23 / S-24 (FR-040 house and street intensities).
13. Kitchen task imperatives, captions and the bench join need a teacher read and the designer's wording (gaps 175, 181).
    Trigger: the designer's kitchen copy, or the next change to `src/data/rooms.ts` kitchen rows.
    (Teacher read done in the implementation review 2026-10-31: pass; the designer's wording is still owed.)

## From the implementation review (2026-10-31)

14. `createRoomArtLoader` `ensure`, catch path: `detach()` is the chained closure, so a throw while queueing room B also removes
    room A's `loaderror`/`complete` listeners and A stays pending (impl-review F3). Detach only this call's `addfile`/`load`/`loaderror`
    and keep `complete` while an earlier room is pending.
    Trigger: the next change to `src/ui/roomArtLoader.ts`, or a report of a room stuck on stand-ins after "Room art could not be queued".
15. `createRoomArtLoader` `ensure`: every call adds one more `once('complete', onComplete)` (impl-review F4); harmless (bounded,
    `detach` removes all), but `publish` runs more than once per `complete`. Keep one registration.
    Trigger: the next change to `src/ui/roomArtLoader.ts`.
16. `RoomScene` `onSleep` / wake `refresh` drop a drawn celebration card without `moveAfterDone` (impl-review F5): the child stays in
    the done room until a reload (load-time `nextRoom` then moves her). Unreachable today (the way out is hidden while the card is up).
    Also the card's burst emitter is destroyed at the next `redraw`/`hide`, not in `onSleep` (plan L-R11).
    Trigger: a way out of the room view that stays visible while the card is up (S-23 cross-section), or a settings dialog over the card.
17. `TaskScene` re-captures the backdrop only on wake when `REGISTRY_KEYS.roomLoad` changed (impl-review F6): art that arrives while
    the task screen is up shows on the next room/task switch.
    Trigger: the visual gate or a playtest showing a plain backdrop after "Dalej".
18. `ANIMATION.celebration.room.burstCount` is the literal 22, not `ANIMATION.summaryBurstParticles` (impl-review F7).
    Trigger: the next change to either burst count.
