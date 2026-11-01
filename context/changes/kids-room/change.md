---
change_id: kids-room
title: Pokój dziecięcy, trzeci pokój domu 1 z danych i grafiki
status: preparing
created: 2026-11-01
updated: 2026-11-01
archived_at: null
---

## Notes

Roadmap S-25 (M-03, path of house 1), PRD FR-033, FR-035. Autonomous run `2026-11-01-kids-room`, branch
`feat/kids-room` cut from `main` at `bfdf193` (S-30 merge + docs #130, #131, #132). Outcome: a child who finished the
kitchen renovates the children's room (the walls and floor, then bed, desk, bookshelf, toy chest, reading nook and
wardrobe, 3 variants each; the bed in 3 forms); the room sits in the upper-left cell of the house-1 cross-section, so
house 1 has three of its four rooms (bathroom = S-31, upper-right).

No lessons file exists in `context/foundation/` (checked at this step), so no lesson is applied.

The roadmap Risk is the point of this slice: if adding the room needs code outside data and art, F-04 and S-22 broke
the "a room is data" contract. Every non-data file the plan touches is named here and in the PR body "for the product
owner". The one expected candidate is the staged renovation (decision D1).

## Roadmap claims re-verified against the repo (branch `feat/kids-room` at `bfdf193`)

| roadmap claim (S-25, plan time) | repo now | correction |
|---|---|---|
| Prerequisite S-22 (kitchen) | Shipped (#118, `context/archive/2026-10-31-kitchen-room/`); S-23 house cross-section (#121), S-28/29/30 (#127-#129) shipped since | confirmed; the cross-section exists, so the room must also appear in its cell |
| „dodanie dotyka wyłącznie danych pokoju i plików grafiki” | A room is a `RoomDef` in `src/data/rooms.ts` + `ROOMS` entry, a row in `ROOM_SCENE_FILES` (`src/data/roomArt.ts`), a row in `ROOM_PACKS` (`scripts/make-task-art.mjs`), a row in `HOUSES['house-1']` (`src/data/houses.ts`), copy in `pl.room.{names,tasks,slots,variants}` (`src/data/pl.ts`); the Hangar (S-30) shipped with no code outside data and the art script | confirmed for a one-stage room. **Not** confirmed for a staged room: `RoomDef.scene` (`src/core/types.ts`) has one `before`/`after` pair and the room view switches on `stagesDone(...) > 0` (`src/core/rooms.ts`), so the pack's intermediate backgrounds `children-stage-1/2` need a small generic code change (D1) |
| „celebracja i przekrój działają dla niego bez zmian w kodzie” | `houseRoomList`/`nextRoom`/`roomInRenovation` (`src/core/house.ts`) list known rooms of the house in data order; `celebrationView` reads the house; `HOUSE_GEOMETRY['house-1']` already has the cell `upper-left` (floor 1, place 0, 252,236, 608×342), drawn today as the closed „Wkrótce” cell | confirmed mechanism (as with the Hangar): after the kitchen the card shows three tiles and „Dalej” opens the children's room; research pins it with a frozen v6 fixture (kitchen done) |
| Blockers: „pokój dziecięcy jest w `designs/martynka-evolution-v1`, z trzema etapami tła i łóżkiem w 3 formach” | Present: `manifest.json` `rooms.children` (label „Pokój dziecięcy”, `backgroundBefore`/`backgroundAfter`/`shadows`, `shadowEllipses: []`, 6 slots with x, y, width, height, z, anchor, visibleRect) and `renovation` (room `children`: stages `neglected` → `clean` „Sprzątanie” → `walls` „Malujemy ściany” → `floor` „Odnawiamy podłogę”, furnishings order bed, desk, books, toys, reading, wardrobe); `assets/room/children-{before,stage-0,stage-1,stage-2,after,shadows}.png` 1920×1080; `assets/furniture/children-*.png` 20 files: 5 desk/books/toys/reading/wardrobe × natural, sunny, mint, and the bed slot with `selectionKind: "form"` and variants `children-bed-natural` „Baldachim”, `children-bed-house` „Domek”, `children-bed-drawers` „Z szufladami” (`children-bed-sunny`/`-mint` exist but are not variants of the slot); about 14 MB of PNG | confirmed. Note: `children-before` and `children-stage-0` look the same (research verifies RGB, the alpha-only check here said identical); background corners cream `#FFF5DF` like the kitchen → `recolourBoard: false` expected |
| Unknown „Jakie elementy i koszty ma pokój dziecięcy (jak w S-22)?” (Block: no) | The pack's `renovation` costs (2 each) are a preview, not game balance; kitchen costs 5/7/9/10/12/13/15 = 71 | decided: D2 (pieces and order from the pack), D3 (costs) |
| (implicit) the room id | Pack ids are `children` / `children-*`; the rooms-as-data follow-up 11 and house-cross-section 13 wait for „the kids' room id” | decided: D4 (`children`) |
| (implicit) boot budget | Boot loads only the room in renovation (`bootRoomArt`); `tests/bootBudget.test.ts` iterates `Object.keys(ROOMS)`; the children's room adds two extra full-scene backgrounds (stage-1, stage-2) to its boot set | risk: this room may become the heaviest boot; research measures after `npm run art` (kitchen-room follow-up 5 fires, see below) |
| (implicit) save format | v6 carries `house`, `rooms`, `currentRoom`; S-22 and S-30 added rooms with no version bump; a saved `tasksDone` of a new room starts at 0 | **no migration expected** (see Migration) |

## Design kit views and spec sections this change binds (profile § 6 + the house packs)

| source | what it binds |
|---|---|
| `designs/martynka-evolution-v1/manifest.json` `rooms.children` | scene files (`backgroundBefore`, `backgroundAfter`, `shadows`); six slots with id, x, y, width, height, z, anchor, visibleRect, variant files and labels; `shadowEllipses: []` (no contact shadows) |
| `designs/martynka-evolution-v1/manifest.json` `renovation` | the stage sequence and backgrounds (`children-stage-0` → `-1` → `-2` → `children-after`) with their labels, and the furnishing order |
| `designs/martynka-evolution-v1/README.md`, `style-addendum.md`, `development-plan.md` | draw order and integration notes (research reads them in full) |
| `designs/martynka-evolution-v1/screenshots/children-form-{0,1,2}.png`, `children-form-*-chooser.png`, `previews/` | visual-gate references for the room, the three bed forms and the variant chooser |
| `designs/martynka-house-street-v2/manifest.json` `houses.house-1.cells` | the `upper-left` cell (floor 1, col 0, 252,236, 608×342) = the children's room, the same rectangle as `HOUSE_GEOMETRY['house-1']`; shell art is already the S-23 one |
| `docs/designer-brief-m03.md` (house 1 table and the cell table) | „pokój dziecięcy (lewa)” on the upper floor; P3.1 names `children-stage-1/2` as the model for staged renovation |
| `designs/martynka-house-1-polish-v1/README.md` (preview `house-four-rooms.png`) | reference only: it composes the four-room house from the original children layers; its kitchen stages belong to S-32 |
| `Martynka-urzadza.md` § 10 | asset naming: `public/assets/rooms/children/<file>.webp` |
| Copy keys (`src/data/pl.ts`) | NEW: `pl.room.names.children` „Pokój dziecięcy” (pack label; research checks its fit on the HUD, card tile and house cell); `pl.room.slots['children-*']` nominative lower-case captions from the pack labels („łóżko”, „biurko i krzesło”, „regał na książki”, „skrzynia na zabawki”, „kącik czytelniczy”, „szafa”); `pl.room.variants['children-*']`: bed forms „Baldachim”, „Domek”, „Z szufladami” from the pack, the others from the families with gender agreement (Naturalne/Słoneczne/Miętowe for biurko i krzesło; Naturalny… for regał, kącik; Naturalna… for skrzynia, szafa); `pl.room.tasks.*` imperative + accusative labels for the slots and, with D1, the stages (the pack gives „Sprzątanie”, „Malujemy ściany”, „Odnawiamy podłogę”, nouns and 1st-person plural, not task labels). EXISTING reused: `renovate` „Odnów ściany i podłogę” (if D1 falls back), `pl.room.done.*`, `pl.room.change.*`, `pl.house.open['house-1']` „Dom” |

### DESIGN-GAPs expected (rows in `docs/design-gaps.md`, numbering continues after 201)

- The kit has no children's-room task wording (task labels, the agreed variant names, the stage labels as imperatives); like gaps 194 and 201.
- With D1: the kit has no rule for how a staged renovation shows in the room-done miniature and in the cross-section cell before the last stage (expected: the latest stage background reached).
- The bed is the first slot whose variants are forms, not colour families; the panel has no other wording for it (the labels come from the pack, so possibly no gap: research decides).
- Nothing else: a missing picture falls back to the existing `RoomLayer` stand-in box.

## Migration

**None expected.** The children's room is a new `RoomDef` and a new row in `HOUSES['house-1']`; the v6 save already
carries `house.rooms`, `rooms` and `currentRoom`, and the load path rebuilds the house layout from data (`houseLayout`,
`mergeHouse`). The same move as S-22 (kitchen, v5 stayed) and S-30 (Hangar, v6 stayed). Save format stays v6
(`SAVE_VERSION` 6). The plan proves it with a frozen fixture written by the current build with a finished kitchen
(as `tests/fixtures/save-v6-bridge-done.json` for S-30): it loads into the children's room. D1 adds stage tasks only to
the new room's task list, so no saved `tasksDone` changes meaning. Rollback below this build: the old build's
`repairCurrentRoom` (`src/main.ts`, fallback `savedLayout.rooms[0].room`) meets `currentRoom: 'children'` as unknown;
research confirms where it sends the child and that `rooms.children` and the saved house cell survive; a line in
`deploy/README.md` only if it does not hold. What would change the answer: research finding a per-room saved field
the v6 shape lacks for stages (none foreseen: stages are tasks counted by `tasksDone`).

## Open follow-ups triggered by this slice

| source | item | take |
|---|---|---|
| rooms-as-data 11 → house-cross-section 13 | „Kids' room id and closed cells in the house”; Trigger: S-25 (the children's room) | **in scope, fires**: the id is `children` (D4) and the `upper-left` cell gets the row `{ room: 'children', floor: 1, place: 0 }`; `upper-right` stays the closed „Wkrótce” cell for S-31. Close the item in this change's follow-ups |
| kitchen-room 5 → hangar-module (carried) 5 | Texture atlas; Trigger: „`tests/bootBudget.test.ts` fails again, or a third room” | **fires** (third room of house 1). Take: measure first; boot loads only the room in renovation, so the atlas is needed only if the children's boot set (with two extra stage backgrounds) fails the budget or leaves under 2 s headroom; first answer is WebP quality for the stage backgrounds, the atlas stays deferred unless that fails; re-record either way |
| hangar-module 5 (impl review) | Trigger: „a change that draws the room background from something other than `ROOM_SCENE_FILES`” | **conditional on D1**: the stage backgrounds must be listed in `ROOM_SCENE_FILES` (or its successor) so `tests/roomArt.test.ts` and its snapshot keep guarding what is drawn; if the plan draws stages from anywhere else, this fires and the plan adds the guard |
| kitchen-room 4 / hangar 6 (pack thumbnails) | Trigger: a not-done room shown with a pack thumbnail | **not fired**: the new room has no `thumbnail`; its tile uses the live or drawn miniature; carry |
| kitchen-room 2 / house-cross-section 5 (visited room art health) | Trigger: a change to `artHealth` / „Obrazki” | not fired unless the plan touches `artHealth`; carry |
| kitchen-room 3 / house-cross-section (roomArtLoader `wrongSizes`) | Trigger: the next change to `src/ui/roomArtLoader.ts` | not fired unless D1 touches the runtime loader; research checks |
| house-cross-section 21, 4/13 (RoomScene.redraw, closed known room) | Trigger: the next change to `RoomScene.redraw` or the celebration card | **conditional on D1**: fires only if the staged background needs `RoomScene.redraw`/`RoomView`; then the plan adds the browser check item 21 asks for |
| hangar 8 / kitchen-room 13 (kitchen wording) | Trigger: the next change to the kitchen rows of `src/data/rooms.ts` | not fired: this slice adds children rows only |

## Autonomous decisions

- **D1. Staged renovation: three stage tasks (clean, walls, floor) before the furniture, each showing the next pack
  background (`children-stage-0` → `-1` → `-2` → `children-after`), with the minimal generic code change it needs.**
  Chosen over the orchestrator's starting decision (one stage task, kitchen precedent) on this evidence: the roadmap
  S-32 outcome, written by the maintainer the same day, defines the kitchen's stages „jak pokój dziecięcy (posprzątaj,
  odnów ściany, potem podłoga i meble)”, so the children's room is the staged precedent; the S-25 blocker line names
  „trzema etapami tła”; the pack ships the stage backgrounds and a `renovation.stages` list; the brief P3.1 and the
  house-1-polish pack use the same schema for the kitchen; FR-033 allows walls and floor as separate steps. The change
  must stay data-shaped (a list of stage backgrounds in the room data, the background chosen by `stagesDone`) so S-32
  becomes data plus migration. Rejected: one stage task (data-only, but the room would ignore two pack backgrounds and
  S-32 would have no precedent to be „like”); rejected: variant choices for walls/floor (no art). This is a code change
  outside data: named here and in the PR body „for the product owner”, `[human]` row in the handoff.
  What would change it: research finding that the staged background reaches beyond `RoomDef`/`src/core/rooms.ts`/the
  room view and the miniature (e.g. the save, the celebration rules, `HouseView`), or the boot budget failing with the
  two extra backgrounds; then fall back to one stage task (`renovate`, `children-before` → `children-after`) and leave
  stages to S-32.
- **D2. Pieces and order from the pack's `renovation.furnishings`: bed, desk, books, toys, reading, wardrobe; the bed's
  three variants are the forms Baldachim / Domek / Z szufladami** (the slot's own variants; `children-bed-sunny`/`-mint`
  are not converted). Why: the pack is the design source (profile § 6) and the roadmap names the bed „w 3 formach”.
  Rejected: colour families for the bed (the manifest's slot does not list them). What would change it: the maintainer
  or a designer note preferring colours for the bed.
- **D3. Costs follow the kitchen curve: the six slots 7/9/10/12/13/15 (= 66) and, with D1, the stages 3/4/5 (= 12),
  total 78** (kitchen 71 with one stage of 5). Why: scope.md says costs follow the kitchen precedent and S-17 tunes them;
  three cheaper stages keep the first purchase fast after the kitchen. Rejected: the pack's 2 per task (a preview
  value); rejected: the base's ~100 (FR-044 applies to the base). The plan may adjust the split, not the principle.
  What would change it: S-17 measurements or the maintainer naming a price.
- **D4. Room id `children`, slot ids `children-bed` … `children-wardrobe`, art folder `public/assets/rooms/children/`.**
  Why: the pack ids, as the kitchen (`kitchen-*`) and Hangar (`hangar-*`) kept theirs; one name across manifest, data
  and files. Rejected: `kids` (matches the change id, but every pack file would be renamed). What would change it: none
  foreseen.
- **D5. Cell `upper-left` (floor 1, place 0) of `house-1`.** Evidence: maintainer decision 2026-10-30 (scope.md),
  `docs/designer-brief-m03.md` cell table, `martynka-house-street-v2` `houses.house-1.cells`. What would change it: a
  designer reorder of the house cells.
- **D6. No save-format change (v6 stays).** See Migration.
- **D7. Next step is `/10x-research`, not `/10x-plan`**: D1 needs a sweep of where the stage background is read (room
  view, miniature capture, worn pieces, contact shadows, celebration, `HouseView`) and the boot budget needs a
  measurement before planning. What would change it: none for this run (the orchestrator's chain fixes research next).
