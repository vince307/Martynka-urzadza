# Follow-ups — house-cross-section (S-23)

Each item carries a `Trigger:` line; a later slice greps for them. Items from earlier changes are included because this slice
changed the file their trigger names, closed as stale with the evidence, or re-recorded with the trigger kept.

## New in this change

1. House sky is a flat fill; the pack's gradient is CSS only (gap 185).
   Trigger: a designer answer (a sky picture), or a playtest note.
2. No way back to the previous room from the house (only "Wróć do pokoju" to the room in renovation).
   Trigger: a playtest note.
3. `SalonBackdrop` could share `captureRoomMiniature` (`src/ui/widgets/roomCapture.ts`); the two capture paths are kept apart on purpose.
   Trigger: the next change to `SalonBackdrop`.
4. A known room not yet reached (the kitchen while the salon is in renovation) is shown closed (gap 188, decision P5).
   Trigger: the maintainer's answer at human row 5.7, or the first playtest note about the kitchen cell.
5. The house has no "Obrazki" line: a missing house picture is a drawn shell and a warning in the log only (`artFallbacks.house`).
   Trigger: a change to the "Obrazki" section or `artHealth.ts` (see items 11 and 12).

## From the kitchen-room change (re-recorded)

6. Kitchen 3: the runtime loader does not run the boot's `wrongSizes` check. `roomArtLoader` is untouched by this slice.
   Trigger: the next change to `src/ui/roomArtLoader.ts`.
7. Kitchen 14 and 15: `createRoomArtLoader` `ensure` detaches the listeners of an earlier pending room on a throw, and registers one more `complete` per call. Untouched.
   Trigger: the next change to `src/ui/roomArtLoader.ts`.
8. Kitchen 2: a visited room is not judged by "Obrazki"; the house adds no line either (item 5).
   Trigger: a change to `artHealth` / the "Obrazki" section, or a report that a visited room shows stand-ins.
9. Kitchen 10: `drawRoomMiniature` follow-ups (stand-in depth, curtains clip, worn stand-ins, grade boolean). `drawRoomMiniature` is untouched; the house capture clips curtains and rug to the cell, which phase 6 and the visual pass look at.
   Trigger: the next change to `drawRoomMiniature`.
10. Kitchen 12: house and street celebration copy and the keepsake (FR-040).
    Trigger: S-24.
11. Kitchen 16: `RoomScene` `onSleep` / wake drops a drawn celebration card without `moveAfterDone`. Guarded now: the "Dom" button is hidden while the card is up (hook test in phase 6), so the way out stays hidden.
    Trigger: a way out of the room view that stays visible while the card is up, or a settings dialog over the card.
12. Kitchen 19 (gap 182): the task-screen backdrop is invisible while the kitchen is current.
    Trigger: the designer's salon re-export on cream (brief P3.2), or a playtest note.

## From the rooms-as-data change

13. Rooms-as-data 11: kids' room id and closed cells in the house. The house shows the closed cells; the kids' room id still waits.
    Trigger: S-25 (the children's room).

## Earlier follow-ups whose trigger names a file this slice changed

14. Notebook-polish 16 (`SalonBackdrop`, `starBurst`, `Keypad`, `WelcomeScene`, bar layout): none of them changed here (`SalonBackdrop` untouched).
    Trigger: unchanged, the next change to one of those files.
15. Salon-extra-slots L-R8 / L-R11 and salon-style (`RoomScene` `stepPanel` refusals, `celebrate`/`onSleep`): `RoomScene` changed (wake `refresh`, `onSleep`, the "Dom" button) but the purchase flow and `celebrate` did not.
    Trigger: the next change to the purchase flow or `celebrate` in `RoomScene`.
16. Stale-tab-and-health "worker build id" in the offline section: `registerServiceWorker` is untouched by this slice.
    Trigger: the next change to `src/pwa/registerServiceWorker.ts`.
17. Audit-boot-hidden-tab G-3 (a fallback record per room miniature): the house capture uses the same miniature without a record.
    Trigger: the next change to `src/ui/artFallbacks.ts` or the room miniature.
18. `artHealth.ts` items (save-reason-and-recovery 20, load-and-tab-guard A-11, audit-art-renderer 23, stale-tab-and-health 28): `artHealth.ts` gained the `'house'` load table only; the items stay open.
    Trigger: the next change to `artHealth.ts`.

## Closed as stale

- Salon-load-health M-6 (service-worker install warning): closed. Evidence: `src/pwa/registerServiceWorker.ts` warns on a redundant worker ("ended redundant (the install did not finish)") and the deploy smoke checks that the house pictures are precached.
  Trigger: none (closed); reopen if a silent install failure is reported.
- Load-and-tab-guard P-6 (a failed service worker registration is silent): closed. Evidence: `registerServiceWorker.ts` logs `Service worker registration failed (<name>)`.
  Trigger: none (closed).
- Audit-art-renderer 2 (`make-task-art.mjs` runs Python without `-I`): closed. Evidence: `scripts/make-task-art.mjs` calls `execFileSync('python3', ['-I', ...])`.
  Trigger: none (closed).
- Narrator-round-summary 39: not found as an open item in the archive; nothing in the files this slice changed. Closed as stale.
  Trigger: none (closed).
