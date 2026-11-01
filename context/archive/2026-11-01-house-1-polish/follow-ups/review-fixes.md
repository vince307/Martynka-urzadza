# Follow-ups — house-1-polish (S-32)

Each item carries a `Trigger:` line; a later slice greps for them. Items from earlier changes are included because this slice
changed the file their trigger names or fired their trigger; each is closed with evidence, or re-recorded with the trigger kept.

## New

1. An exported v6 file imported after v7 is migrated by `decodeSave` (proven by `tests/saveV7.test.ts` and `tests/saveFile.test.ts`);
   a v7 file imported on a v6 build is `future` (the "nowszy zapis" card).
   Trigger: a rollback below the S-32 build (`deploy/README.md`).
2. `scripts/recolour-board.py`, `BOARD_COLOUR`, `BOARD_FILES`, the `recolourBoard` flag and `tests/recolourBoard.test.ts` are used by
   no room since the salon came on cream; retire them together.
   Trigger: the next change to `scripts/make-task-art.mjs` or `scripts/recolour-board.py`, or an audit.
3. The salon thumbnail in `UI_ART` (`salonAfter`) still shows the green board; a cream thumbnail is the designer's to deliver.
   Trigger: the designer delivers thumbnails (brief P3).
4. The salon before state uses the code worn grade, not the pack's salon-worn-v2 furniture layers (gap 206, decision D5).
   Trigger: the designer's salon art with the worn furniture as separate layers, or a playtest note on the neglected salon.
5. The salon fills its house cell more than the other rooms (gap 207, decision D4).
   Trigger: a designer re-crop of the salon, or the house cross-section is next changed (`HOUSE_GEOMETRY`).

## Fired by this change and re-recorded (still open, with the reason)

6. Kids-room 2 / bathroom 11 (`wornPieces` and `contactShadowPieces` mean "until the first stage"): the kitchen now has three stages
   but no `worn` and no `contactShadows`, so the rule is unchanged for it (phase 2 pinned this).
   Trigger: a room with more than one stage task that also has `worn` or `contactShadows`.
7. Kitchen-room 19 / house-cross-section 12 (gap 182, the task-screen backdrop): the kitchen is unchanged; the cream salon backdrop
   keeps about two thirds of the picture visible (visual pass of this slice).
   Trigger: the designer's framing for the notebook backdrop, or a playtest note.
8. Final-art-salon "future slots are appended at the end": still the rule, now with one exception, a save-format step that moves
   `tasksDone` (S-32 inserted the kitchen stages at the front with `MIGRATIONS[6]`, comment in `src/data/rooms.ts`).
   Trigger: the next change that adds or reorders tasks of an existing room.
9. Salon-load-health M-6 / bathroom 10 (service-worker install warning): the precache set grew by two room pictures (kitchen
   stages); the warning is unchanged.
   Trigger: the next change to `src/pwa/registerServiceWorker.ts` or to the precache set.
10. Audit-art-renderer script items (mask band, interpreter isolation): re-checked against the changed `scripts/make-task-art.mjs`;
    the recolour path is still called for no room, so they are moot until follow-up 2 retires it.
    Trigger: a change to `scripts/recolour-board.py`.
11. Kitchen-room 4 / kids-room 12 / hangar 4 (pack thumbnails not converted; a room finished on an older build meets the next room
    without the card): carried; `UI_ART` `salonAfter` still shows the green board (follow-up 3).
    Trigger: a not-done room shown with a pack thumbnail, or a change to `nextRoom` or the load path in `src/main.ts`.
12. Kitchen-room 13 / hangar 8 (kitchen wording owes the designer's copy): FIRED by this change (new labels "Posprzątaj kuchnię",
    "Odnów ściany", "Odnów podłogę"); the reviewer read is plan row 2.8, the designer's wording is still owed (plan review F3).
    Trigger: the designer's kitchen copy, or the next change to the kitchen rows of `src/data/rooms.ts`.
13. Kids-room 7 (texture atlas): the salon is now 1 182 246 B and stays the heaviest boot room (41.4 s at 50 KB/s, headroom kept by
    `tests/bootBudget.test.ts`).
    Trigger: `tests/bootBudget.test.ts` headroom under `balance.loader.totalMs` drops below 2 s, or a room heavier than the salon.

## From the impl review

14. Save-truth follow-up 20 (`isRecord` watch, "Trigger: a fourth copy in `src/core`") FIRED: `src/core/migrations/kitchenStages.ts`
    carries a fourth local `isRecord` (beside `save.ts`, `saveFile.ts`, `migrations/legacySalon.ts`). Kept on purpose for now: the
    migration steps are frozen and carry their own constants so a later edit of a shared module cannot change their meaning; an
    extraction would edit two frozen steps. Impl-review F1 (WARNING).
    Trigger: the next change that adds a `src/core` module needing `isRecord` outside `src/core/migrations/`, or an audit: extract
    `src/core/isRecord.ts` for the non-frozen copies (`save.ts`, `saveFile.ts`) and leave the frozen steps local.
