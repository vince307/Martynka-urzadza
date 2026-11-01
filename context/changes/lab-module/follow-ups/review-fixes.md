# Follow-ups — lab-module (S-33)

Each item carries a `Trigger:` line; a later slice greps for them. Items from earlier changes are included because this slice
changed the file their trigger names (`src/data/rooms.ts`, `src/data/houses.ts`, `src/data/houseArt.ts`, `src/data/roomArt.ts`,
`src/data/pl.ts`, `scripts/make-task-art.mjs`) or fired their trigger; each is closed with evidence, narrowed, or re-recorded.

## Fired by this change

1. Hangar-module 1 / base-cross-section 5 (gap 196, last-module celebration; trigger "a third base module"): fired and narrowed,
   closed as to the tile: the Hangar's card now gains the Laboratorium tile, the Laboratorium is the last module (three done tiles,
   no teaser, "Dalej" stays with "Baza"; gap row 196 edited).
   Trigger: a fourth base module (S-34) or a designer answer for the last-module celebration.
2. Base-cross-section 6 (gap 199/200, frame and stand-in for the base): frame half closed (`house/base-1-cell-frame` from
   `bystrow-space-base-v5`, gap 199 closed); the stand-in outline without a roof (gap 200) is carried.
   Trigger: a designer answer for a base stand-in, or a playtest note.

## New in this change

3. The Laboratorium wording is ours (gap 208): task labels, variant forms, costs 6/10/13/14/17/19/21 = 100 (D1).
   Trigger: the designer's Laboratorium copy, the author's answer on the costs (roadmap unknown "Ceny Laboratorium"), or S-17.
4. A base child who finished the Hangar on an older build meets the Laboratorium at the next start without the card that announces it
   (the card is shown at a purchase only; hangar-module 4, bathroom 9, house-1-polish 11). The load path is proven by
   `tests/fixtureLoadPath.test.ts` with the frozen `tests/fixtures/save-v7-hangar-done.json`.
   Trigger: a playtest note, or the next change to the celebration rules in `src/core/celebration.ts`.

## Carried unchanged (re-recorded)

5. Hangar-module 2 / gap 201 (Hangar wording owes the designer's copy): not fired, Hangar rows untouched.
   Trigger: the designer's Hangar copy, or S-17.
6. Texture atlas for room art (bathroom 7, house-1-polish 13): not fired. A Laboratorium boot is about 30.9 s against 48 s; the salon
   stays the worst case (`tests/bootBudget.test.ts` covers `lab` through `Object.keys(ROOMS)`).
   Trigger: `tests/bootBudget.test.ts` headroom under `balance.loader.totalMs` drops below 2 s, or a room heavier than the salon.
7. Service-worker install warning (bathroom 10, house-1-polish 9): FIRED by 22 new precache entries (21 room files and the base
   frame); the warning in `src/pwa/registerServiceWorker.ts` is unchanged and still the only guard.
   Trigger: the next change to `src/pwa/registerServiceWorker.ts` or to the precache set.
8. House-1-polish 2 (retire the recolour path, `scripts/recolour-board.py`): its trigger fired on the art-script change; out of scope
   here, carried.
   Trigger: the next change to `scripts/make-task-art.mjs` that is not a pack row, or an audit.
9. Hangar-module 3 (`roomArtCheck` exported and tested but never called by `scripts/check-deploy.ts`): not fired.
   Trigger: the next change to `scripts/check-deploy.ts`.
10. Base-cross-section 13 (`HouseScene`/`HouseView` items): trigger "the next change to `HouseScene`" fired by the phase 3 doc-comment
    edit of `HouseScene.art`; no behaviour touched, re-recorded unchanged.
    Trigger: the next change to `HouseScene`, `HouseView` or `RoomScene.redraw`.

## Cited, already closed

11. Audit-art-renderer 2 (Python without `-I`): closed, `scripts/make-task-art.mjs` calls `execFileSync('python3', ['-I', ...])`.
    Trigger: none (closed).
