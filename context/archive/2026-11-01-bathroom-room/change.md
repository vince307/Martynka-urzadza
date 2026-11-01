---
change_id: bathroom-room
title: Łazienka, czwarty pokój domu 1, i karta „Pokój gotowy!” z czterema kafelkami
status: archived
created: 2026-11-01
updated: 2026-11-01
archived_at: 2026-11-01T17:11:33Z
---

## Notes

Roadmap S-31 (M-03, path of house 1, Stream B), PRD FR-033, FR-035, FR-038. Autonomous run
`2026-11-01-bathroom-polish-lab`, branch `feat/bathroom-room` cut from `main` at `e451fa8` (S-25 kids-room merge #133).
Outcome: a child who finished the children's room renovates the bathroom (walls and floor, then tub, sink, towel shelf,
bath rug, plant and toy shelf, 3 variants each); the bathroom fills the upper-right cell of the house-1 cross-section,
which today is the closed „Wkrótce” cell. With it house 1 has all four rooms and, for the first time, no next room.

No lessons file exists in `context/foundation/` (checked at this step), so no lesson is applied.

The roadmap Risk is the point of this slice: the room itself must be data and art only (`src/data/rooms.ts`,
`src/data/houses.ts`, `src/data/roomArt.ts`, `src/data/pl.ts`, `scripts/make-task-art.mjs` `ROOM_PACKS`, assets). The
maintainer's scope (`context/runs/2026-11-01-bathroom-polish-lab/scope.md`) puts the four-tile room-done card IN scope
(kids-room follow-up 1, design gap 204), and that is the one expected change outside data.

**For the product owner (finalised by the plan, P1/P2):** code outside room data and art that this slice changes: the
room-done card width follows the tile count — new pure helper `roomDoneCardRect` in `src/core/roomDoneLayout.ts`, read by
`src/ui/widgets/RoomDoneCard.ts` `show`; `ROOM_DONE_LAYOUT.card` in `src/data/layout.ts` holds `centerX`/`minWidth`/
`padding` instead of `left`/`width`, `tiles.left` removed. Two- and three-tile cards are unchanged; four tiles give a card
1516 px wide. Nothing else outside data; named in the PR body „dla właściciela produktu”, `[human]` row 5.7 of the plan.

## Roadmap claims re-verified against the repo (branch `feat/bathroom-room` at `e451fa8`)

| roadmap claim (S-31, plan time) | repo now | correction |
|---|---|---|
| Prerequisite S-25 (children's room) | Shipped (#133, `context/archive/2026-11-01-kids-room/`); `HOUSES['house-1']` rows salon (0,0), kitchen (0,1), children (1,0) in `src/data/houses.ts` | confirmed |
| „łazienka zajmuje prawą górną komórkę przekroju domu 1 zamiast zamkniętej «Wkrótce»” | `HOUSE_GEOMETRY['house-1'].cells` has `upper-right` (floor 1, place 1, 1060,236, 608×342); no room row points at it, so `HouseView` draws the closed cell; the pack README draws the bathroom in exactly that rectangle at scale 19/60 | confirmed: one row `{ room: 'bathroom', floor: 1, place: 1 }` |
| „ściany i podłoga, potem wanna, umywalka, szafka, dywanik, roślina i półka z kaczuszkami w 3 wariantach” | The pack `designs/martynka-bathroom-v1/manifest.json` `rooms.bathroom` has ONE before/after pair (`bathroom-before`, `bathroom-after`, `bathroom-shadows`, `shadowEllipses: []`) and six slots: `bathroom-tub` „Wanna z zasłonką”, `bathroom-sink` „Umywalka i lustro”, `bathroom-cabinet` „Regał z ręcznikami”, `bathroom-rug` „Dywanik”, `bathroom-plant` „Roślina”, `bathroom-ducks` „Półka z zabawkami”, each natural/sunny/mint (18 PNG) | **corrected**: „szafka” is a towel shelf („regał z ręcznikami”), the duck shelf is labelled „Półka z zabawkami” (style guide: ducks and a boat); one stage task (kitchen/Hangar shape), not stages like the children's room — the pack has no intermediate backgrounds |
| „jej dodanie to dane pokoju i pliki grafiki” | A room is a `RoomDef` + `ROOMS` entry (`src/data/rooms.ts`), a `ROOM_SCENE_FILES` row (`src/data/roomArt.ts`), a `ROOM_PACKS` row (`scripts/make-task-art.mjs`), a `HOUSES` row, copy in `pl.room.{names,tasks,slots,variants}`; the Hangar (S-30) shipped data-only; the stage mechanism (`sceneKey`, `stageFade`) exists since S-25 and a one-stage room uses `before`/`after` | confirmed for the room; **not** for the card (next row) |
| (implicit) the celebration card works unchanged | `RoomDoneCard.show` centres `items.length` tiles of `ROOM_DONE_LAYOUT.tiles.width` 340 with gap 32 in a card 1144 wide: 4 tiles = 1456 px, wider than the card (DESIGN-GAP 204 comment in `ROOM_DONE_LAYOUT`) | **corrected**: after the children's room the card lists 4 items (3 done + bathroom), after the bathroom 4 done; a layout change is needed (scope.md: in scope) |
| Unknown „Czy po łazience przekrój domu 1 nie ma już komórki «Wkrótce» i co pokazuje karta (kafelek zapowiedzi)?” | `houseRoomList` (`src/core/house.ts`) adds a teaser only when a later cell names an unknown room; with four known rooms it adds none, as for the Hangar (S-30 D3: last module, no teaser, „Dalej” stays in change mode with „Baza”); `HouseView` draws no closed cell when every cell has a room | decided: D5 (same as the Hangar) |
| Unknown „Ceny łazienki (jak kuchnia ok. 71 czy jak salon ok. 100)?” (Block: no) | Kitchen 5/7/9/10/12/13/15 = 71 (one stage), children 5/6/7 + 7/9/10/12/13/15 = 84; `tests/roomsData.test.ts` holds every task in 5-21 (PRD FR-016) | decided: D3 |
| Blockers: „paczka `martynka-bathroom-v1` gotowa 2026-10-31, QA 76/76” | Present, `qa-report.json` `passed: true`; `assets/` 5.5 MB PNG (3 room + 18 furniture); background surround exactly `#FFF5DF` (README) | confirmed; `recolourBoard: false` expected (like kitchen and children) |
| Risk „łazienka zamyka dom 1, po raz pierwszy dom nie ma następnego pokoju (jak ostatni moduł bazy w S-30)” | `nextRoom`/`roomInRenovation` return the current room when every known room is done; the Hangar ships that path (`tests/e2e/hangar-module.spec.ts`) | confirmed mechanism; research checks the house-1 path (salon backdrop, „Dom” button) for any house-1-only assumption |
| (implicit) boot budget | Boot loads only the room in renovation (`bootRoomArt`); `tests/bootBudget.test.ts` iterates `Object.keys(ROOMS)`; one stage room of 21 files is lighter than the children's 23 | research measures after `npm run art` |
| (implicit) save format | v6 carries `house`, `rooms`, `currentRoom`; S-22, S-25, S-30 added rooms without a version bump | **no migration expected** (see Migration) |

## Design kit views and spec sections this change binds (profile § 6 + the house packs)

| source | what it binds |
|---|---|
| `designs/martynka-bathroom-v1/manifest.json` `rooms.bathroom` | scene files (`backgroundBefore`, `backgroundAfter`, `shadows`, `shadowEllipses: []`); six slots with id, x, y, width, height, z, anchor, visibleRect and the variant files natural/sunny/mint; slot and family labels |
| `designs/martynka-bathroom-v1/README.md` (Integracja), `style-guide.md`, `plan.md` | draw order (after background, shadows, slots by ascending `z`), what each slot contains (tub with curtain and rail; sink with mirror; the shelf plant belongs to the cabinet; `plant` is a floor plant), the house cell `upper-right` at scale 19/60 on `#FFF5DF` |
| `designs/martynka-bathroom-v1/screenshots/{bathroom-before,bathroom-after-*,house-four-rooms,preview-tablet}.png`, `previews/` | visual-gate references: before, the three families, the four-room house |
| `designs/martynka-house-street-v2/manifest.json` `houses.house-1.cells` and `docs/designer-brief-m03.md` (house-1 table) | the `upper-right` cell = „łazienka (prawa)” (author change 2026-10-31), the same rectangle as `HOUSE_GEOMETRY['house-1']` |
| `Martynka-urzadza.md` § 10 | asset naming: `public/assets/rooms/bathroom/<file>.webp` |
| Room-done card | no kit view (design gaps 39, 40, 204); the four-tile layout is ours and edits row 204 |
| Copy keys (`src/data/pl.ts`) | NEW: `pl.room.names.bathroom` „Łazienka” (pack label); `pl.room.slots['bathroom-*']` captions from the pack labels in nominative lower case („wanna z zasłonką”, „umywalka i lustro”, „regał z ręcznikami”, „dywanik”, „roślina”, „półka z zabawkami”); `pl.room.variants['bathroom-*']` from the families with gender agreement (Naturalna/Słoneczna/Miętowa for wanna, umywalka, roślina, półka; Naturalny… for regał, dywanik); `pl.room.tasks.*` imperative + accusative for the six slots. EXISTING reused: `renovate` „Odnów ściany i podłogę” for the stage, `pl.room.done.*`, `pl.room.change.*`, `pl.house.open['house-1']` „Dom” |

### DESIGN-GAPs expected (rows in `docs/design-gaps.md`, numbering continues after 204)

- The kit has no bathroom wording (task imperatives, captions, variant names agreeing with the noun), like gaps 201 and 202.
- Gap 204 is edited (not a new row) when the card fits four tiles.
- Possibly: the pack label „Półka z zabawkami” vs the roadmap's „półka z kaczuszkami” (the plan picks the caption; the pack label is the default).

## Migration

**None expected.** The bathroom is a new `RoomDef` and a new row in `HOUSES['house-1']`; the v6 save already carries
`house.rooms`, `rooms` and `currentRoom`, and the load path rebuilds the house from data (`houseLayout`, `mergeHouse`).
Same move as S-22, S-25 and S-30. Save format stays v6 (`SAVE_VERSION` 6). The plan proves it with a frozen fixture
written by the current build with a finished children's room (precedent `tests/fixtures/save-v6-kitchen-done.json`):
it loads into the bathroom. Rollback below this build: the old build's `repairCurrentRoom` meets
`currentRoom: 'bathroom'` as unknown; research confirms where it sends the child and that `rooms.bathroom` and the
saved house survive (a `deploy/README.md` line only if it does not hold). What would change the answer: research
finding a saved field a house with no next room needs (none foreseen).

## Open follow-ups triggered by this slice

| source | item | take |
|---|---|---|
| kids-room 1 (design gap 204) | Four-tile room-done card; Trigger: S-31 | **in scope (scope.md)**: the card must fit four tiles (after the children's room: 3 done + bathroom; after the bathroom: 4 done) and still look right with two (base) and three; close the item and edit gap 204 |
| kids-room 3 | `ROOM_DONE_LAYOUT.tiles.left` no longer read; Trigger: the next change to `ROOM_DONE_LAYOUT` or `RoomDoneCard` | **fires**: delete the unused key in the same change (or make the layout read it); close |
| final-art-salon F2 | `drawRoomMiniature` draws all stand-ins on one `Graphics` under the pictures; Trigger: the next change to `RoomDoneCard` or `drawRoomMiniature` | **fires** (the card changes): fix only if the four-tile change touches the miniature drawing; otherwise re-record with the reason (the stand-in order is unchanged by a tile resize) |
| house-cross-section 21 / kids-room 11 | A browser test asserting `houseButton` null while the card is up; Trigger: a change to the celebration card | **fires**: cheap to add to this slice's e2e spec (the card is shown there anyway); in scope |
| kids-room 7 (texture atlas, kitchen-room 5) | Trigger: bootBudget headroom under 2 s, or a room heavier than the salon | measure in research; the bathroom (21 files, one stage) is expected lighter than the salon; re-record |
| kids-room 6 / hangar 5 | Trigger: room background drawn from something other than `ROOM_SCENE_FILES` | not fired if the bathroom row goes into `ROOM_SCENE_FILES` (expected); carry |
| hangar 4 | A child who finished the previous room on an older build meets the new room without the card; Trigger: a playtest note or a change to `src/core/celebration.ts` | not fired (no celebration-rule change expected); applies to a finished children's room too; carry |
| kids-room 2 | `wornPieces`/`contactShadowPieces` and stages; Trigger: S-32 | not fired (S-32) |
| kids-room 8, 9, 12; kitchen-room 4, 13 | stand-in drawer, purchase flow, children/kitchen copy, pack thumbnails | not fired unless the plan touches those symbols; carry |

## Autonomous decisions

- **D1. One stage task („Odnów ściany i podłogę”, `bathroom-before` → `bathroom-after`) then six slots, kitchen/Hangar
  shape.** Why: the pack ships only one before/after pair; the stage mechanism of S-25 accepts a one-stage room through
  `before`/`after`. Rejected: three stages like the children's room (no intermediate backgrounds; inventing them breaks
  profile § 6). What would change it: a designer stage set for the bathroom.
- **D2. Slots and order from the pack: tub, sink, cabinet (towel shelf), rug, plant, ducks (toy shelf)**, matching the
  roadmap outcome's order; captions from the pack labels. Why: the pack is the design source. Rejected: the roadmap's
  „szafka” and „półka z kaczuszkami” as captions (plan-time wording; the pack drew a towel shelf and a toy shelf).
  What would change it: the maintainer preferring the roadmap words (copy only).
- **D3. Costs: one stage of 5 and slots 7/9/10/12/13/15 (= 71, the kitchen curve), every task 5-21.** Why: scope.md
  leaves costs to the plan on the kids-room/Hangar precedent, S-17 tunes; the same one-stage shape as the kitchen.
  Rejected: the salon/base ~100 (FR-044 is the base); the children's 84 (three stages). The plan may adjust the split,
  not the 5-21 rule. What would change it: the author naming a price or S-17 measurements.
- **D4. Room id `bathroom`, slot ids `bathroom-tub` … `bathroom-ducks`, folder `public/assets/rooms/bathroom/`, texture
  keys `bathroom/<file id>`, `recolourBoard: false`.** Why: pack ids, as kitchen, children and Hangar kept theirs.
  What would change it: none foreseen.
- **D5. Cell `upper-right` (floor 1, place 1); after the bathroom house 1 has no next room: the card shows four done
  tiles and no teaser, „Dalej” keeps the child in the bathroom in change mode with „Dom” (Hangar D3 precedent), the
  cross-section has no closed cell.** Evidence: designer brief M-03 house-1 table (author change 2026-10-31), pack
  README, S-30 D3. What would change it: S-24 (residents) defining what follows a finished house.
- **D6. The four-tile card is fixed in this slice by a layout change of `RoomDoneCard`/`ROOM_DONE_LAYOUT`; the exact
  geometry (fixed smaller tiles for every card, or tile size by count, or a wider card) is the plan's call after
  research measures the card and its miniature.** Why: scope.md makes it in scope; 4×340 + 3×32 = 1456 > 1144.
  Constraints the plan keeps: the card stays inside 1920×1080 with the „Dalej” button and title untouched, two- and
  three-tile cards (base, earlier house cards) stay legible, captions such as „Pokój dziecięcy” fit the tile. Named for
  the product owner (`[human]` row). What would change it: a designer card for four rooms.
- **D7. No save-format change (v6 stays).** See Migration.
- **D8. Next step is `/10x-research`, not `/10x-plan`**: the card geometry, the boot measurement after `npm run art`,
  the rollback path of an unknown `bathroom` and the house-1 last-room path need a sweep before planning (the
  orchestrator's chain also fixes research next). What would change it: none for this run.
