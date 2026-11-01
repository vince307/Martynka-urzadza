# Follow-ups — hangar-module (S-30)

Each item carries a `Trigger:` line; a later slice greps for them. Items from earlier changes are included because this slice
changed the file their trigger names (`src/data/rooms.ts`, `src/data/houses.ts`, `src/data/roomArt.ts`, `src/data/pl.ts`,
`scripts/make-task-art.mjs`) or fired their trigger; each is closed with evidence, narrowed, or re-recorded with the trigger kept.

## Fired by this change and narrowed

1. Base-cross-section 5 (design gap 196, no celebration for a building's last module; trigger "a second module of the base (S-30
   hangar-module)"): fired and narrowed, not closed. Mostek now has a next module: its card shows two tiles (Mostek done, Hangar) and
   "Dalej" opens the Hangar (`tests/roomsData.test.ts` "moves the child to the Hangar after the last Mostek task",
   `tests/e2e/base-cross-section.spec.ts` #16). The Hangar is the base's last module: its card shows the two done tiles and no
   "Wkrótce" teaser, "Dalej" stays in the Hangar in change mode with "Baza" (decision D3; gap row 196 edited).
   Trigger: a third base module, or a designer answer for the last-module celebration.

## New in this change

2. The Hangar wording is ours (gap 201): task labels, "stół warsztatowy" (pack label) instead of the roadmap's "stół z narzędziami",
   variant forms agreeing with the noun; costs 6/10/13/14/17/19/21 = 100 (D1).
   Trigger: the designer's Hangar copy, the author's answer on the costs (roadmap unknown "Ceny Hangara"), or S-17 (balance tuning).
3. `roomArtCheck` (`scripts/deploy-check/parse.ts`) is exported and unit-tested (`tests/deployCheck.test.ts`) but never called by
   `scripts/check-deploy.ts`; the smoke covers room pictures through `precacheCovers('room pictures', …)` (research (e)). Either wire
   it or delete it with its tests.
   Trigger: the next change to `scripts/check-deploy.ts`.
4. A child who finished Mostek on the S-29 build meets the Hangar at the next start without the card that announces it (the card is
   shown only at a purchase; kitchen precedent of S-22). The load path itself is proven by `tests/fixtureLoadPath.test.ts` with the
   frozen `tests/fixtures/save-v6-bridge-done.json`.
   Trigger: a playtest note, or the next change to the celebration rules in `src/core/celebration.ts`.

## Carried unchanged (re-recorded)

5. Texture atlas for room art (kitchen-room 5, first-building-choice 5): not fired. The Hangar adds 21 files (606 452 B); boot still
   loads only the room in renovation, a Hangar boot is about 29.9 s against 48 s (`balance.loader.totalMs` minus 2 s headroom), the
   salon stays the worst case; `tests/bootBudget.test.ts` covers `hangar` through `Object.keys(ROOMS)`.
   Trigger: `tests/bootBudget.test.ts` fails or headroom under `balance.loader.totalMs` drops below 2 s.
6. Pack thumbnails for rooms (kitchen-room 4): not fired. The Hangar has no `thumbnail` (as Mostek); its card tile uses the live or
   drawn miniature.
   Trigger: a not-done room shown with a pack thumbnail, or the designer's thumbnails (brief P3).
7. `FIRST_ROOM` fallbacks (first-building-choice 18, base-cross-section 8): not fired; the base never reaches them (a base child always
   has a `currentRoom`, now `bridge` or `hangar`).
   Trigger: the next change to `ChoiceCard` or `WelcomeScene.createChoice`, or a second building without a salon reaching a
   `FIRST_ROOM` fallback.
8. Kitchen-room 13 (kitchen task wording needs the designer's copy; trigger "the next change to `src/data/rooms.ts` kitchen rows"):
   not fired, this slice added Hangar rows only and left the kitchen rows untouched.
   Trigger: the designer's kitchen copy, or the next change to `src/data/rooms.ts` kitchen rows.

## Cited, already closed (not reopened)

9. Kitchen-room 6 (service-worker install warning; trigger "the next change to the precache set", which this slice makes): closed
   by house-cross-section (`src/pwa/registerServiceWorker.ts` warns "ended redundant (the install did not finish)"), recorded as
   closed in first-building-choice 6.
   Trigger: none (closed).
10. Audit-art-renderer 2 (`scripts/make-task-art.mjs` ran Python without `-I`): closed by house-cross-section (the script calls
    `python3 -I`). This slice's only edit to the script merges the duplicate v1 constant `SPACE` into `SPACE_BASE`; `npm run art`
    output is byte-identical (`git status --short public/assets` empty).
    Trigger: none (closed).
