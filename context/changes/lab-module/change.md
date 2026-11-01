---
change_id: lab-module
title: Laboratorium, trzeci moduł bazy, z ramką bazy w przekroju
status: planned
created: 2026-11-01
updated: 2026-11-01
archived_at: null
---

## Notes

Roadmap S-33 (M-03, Stream D „Baza kosmiczna”), PRD FR-046, FR-045, FR-035. Autonomous run
`2026-11-01-bathroom-polish-lab`, branch `feat/lab-module` cut from `main` at `60472aa` (S-32 merge, save format v7).
Outcome: a child with the space base, after the Hangar, renovates the Laboratorium (walls and floor, then 6 pieces in
3 variants) in the upper-left cell of the base cross-section; the module in renovation wears the base's own frame
(`base-1-cell-frame` from `bystrow-space-base-v5`) instead of the house `cell-frame`; adding the module is data and art.

Scope (maintainer, `context/runs/2026-11-01-bathroom-polish-lab/scope.md`): the Laboratory from
`designs/bystrow-space-base-v3` as the base's third module; the base's room-done card gets a third tile; hangar-module
follow-up 1 applies.

No lessons file exists in `context/foundation/` (checked at this step), so no lesson is applied.

## Roadmap claims re-verified against the repo (branch `feat/lab-module` at `60472aa`)

| roadmap claim (S-33, plan time) | repo now | correction |
|---|---|---|
| Prerequisite S-30 (Hangar) | Shipped, archived `context/archive/2026-11-01-hangar-module/`. `HOUSES['base-1']` = `[bridge (0,0), hangar (0,1)]` in `src/data/houses.ts`; `HANGAR` in `src/data/rooms.ts` (costs 6/10/13/14/17/19/21 = 100) | confirmed |
| „w lewej górnej komórce przekroju bazy” | `HOUSE_GEOMETRY['base-1'].cells` has `upper-left` (floor 1, place 0, 252,236, 608×342); v3 README: „Pełną scenę skaluj … do 608×342 w (252,236), czyli upper-left”; `screenshots/base-with-three-modules.png` | confirmed: one data row `{ room: 'lab', floor: 1, place: 0 }` appended to `HOUSES['base-1']` (D2) |
| „ściany i podłoga, potem 6 elementów w 3 wariantach” | v3 `manifest.json` `rooms.lab`: `lab-before/after/shadows` 1920×1080; 6 slots × natural/sunny/mint: `lab-microscope` „Mikroskop”, `lab-rocks` „Gablota z kamieniami”, `lab-flasks` „Stół z kolbami”, `lab-globe` „Model Księżyca”, `lab-stool` „Stołek”, `lab-board` „Tablica magnetyczna”, each with x, y, width, height, z, anchor, visibleRect; QA `passed: true`, 21 game PNGs, 6.1 MB source | confirmed; one stage task (before → after, like Mostek/Hangar, no stage backgrounds); room id `lab` from the pack (D5) |
| „dodanie modułu to dane i grafika” | Hangar precedent: `RoomDef` + `ROOMS` entry (`src/data/rooms.ts`), `ROOM_SCENE_FILES` row (`src/data/roomArt.ts`), `ROOM_PACKS` row (`scripts/make-task-art.mjs`, a new pack root constant for v3), copy in `pl.room.{names,tasks,slots,variants}` | confirmed for the module. **Non-data touches expected** (tests that pin the Hangar as the base's last module): `tests/roomsData.test.ts` („hangar flow”, `houseRoomList` of base-1), `tests/houseCells.test.ts` (base frame key), `tests/e2e/hangar-module.spec.ts` #16 („no teaser; Dalej stays in the Hangar” becomes „the card shows Mostek, Hangar, Laboratorium; Dalej opens the Laboratorium”); research sweeps for more |
| „moduł w remoncie ma ramkę bazy zamiast ramki domu” (blocker note: `base-1-cell-frame.png` w v5) | `HouseView` (`src/ui/widgets/HouseView.ts`) draws `geometry.cellFrame` at `(cell.x − frameInset, cell.y − frameInset)` around the current cell; `HOUSE_GEOMETRY['base-1'].cellFrame` = `'house/cell-frame'` (the house frame, DESIGN-GAP 199); `houseArtKeys` (`src/core/houseCells.ts`) loads `[shell, cellClosed, cellFrame]` per building. v5 gives `assets/base/base-1-cell-frame.png`, 640×374 RGBA, „rysuj w (cell.x−16, cell.y−16)”, interior `[16,16,608,342]` transparent, QA `passed: true` | confirmed and **data + art only**: a `HOUSE_ART` row `entry('base-1-cell-frame', 640, 374)` (`src/data/houseArt.ts`), `cellFrame: 'house/base-1-cell-frame'` in `HOUSE_GEOMETRY['base-1']` (`frameInset` 16 unchanged), a `BASE_FILES` row in the art script that needs a per-row pack (today `BASE_FILES` reads only `SPACE_BASE` = v1). The house keeps `cell-frame`. Closes gap 199 and base-cross-section follow-up 6 (frame half) |
| Risk „Hangar przestaje być ostatnim modułem … więc wraca kafelek zapowiedzi na karcie celebracji” | `houseRoomList` (`src/core/house.ts`) emits a `teaser` entry only for a house cell whose room the data does not know; the base lists three known rooms and the `upper-right` cell has no room row, so no „Wkrótce” teaser tile exists on any base card. The Hangar card gains a real **Laboratorium tile** (next room, not a teaser) and „Dalej” moves to it via `nextRoom`/`roomInRenovation` with no code change | **corrected**: no teaser tile comes back. Hangar card = 3 tiles (Mostek ✓, Hangar ✓, Laboratorium); Laboratorium card = 3 done tiles, no teaser, „Dalej” stays in change mode with „Baza” (D3). Gap 196 narrows again (Laboratorium is now the last module) |
| „karta bazy dostaje trzeci kafelek” (scope.md), card width by tile count (S-31) | `roomDoneCardRect` (`src/core/roomDoneLayout.ts`): 1144 wide up to three tiles, 1516 for four, 1888 for five; `ROOM_DONE_LAYOUT.tiles` 340 + gap 32 | confirmed: three tiles fit the unchanged 1144 card; no layout code change |
| Unknown „Ceny Laboratorium (jak Mostek i Hangar, 100)?” | `BRIDGE` and `HANGAR` both 6/10/13/14/17/19/21 = 100 | decided: D1 |
| (implicit) save format | `SAVE_VERSION` 7 (`src/core/save.ts`, S-32 `MIGRATIONS[6]` moved kitchen `tasksDone`, untouched by base saves). A save carries `house`, `rooms`, `currentRoom`; `mergeHouse` rebuilds the cells from data and keeps saved extras | **no migration expected** (see Migration) |
| (implicit) boot budget | `bootRoomArt` loads only the room in renovation; `tests/bootBudget.test.ts` iterates `Object.keys(ROOMS)`; v3 source 6.1 MB vs Hangar 5.7 MB (→ 606 KB WebP) | expect ~0.65 MB WebP, well under the salon; research measures after `npm run art` |

## Design kit views and copy keys this change binds (profile § 6 + the space-base packs)

| source | what it binds |
|---|---|
| `designs/bystrow-space-base-v3/manifest.json` (`rooms.lab`, `bases.base-1.cells`) | scene files `backgroundBefore`/`backgroundAfter`/`shadows`; six slots with id, x, y, width, height, z, anchor, visibleRect and three variant files each; labels (captions); the upper-left cell |
| `designs/bystrow-space-base-v3/README.md` § Zasoby i manifest | draw order (background, shadows, sprites by z ascending), x/y top-left of the PNG; whole scene scaled into upper-left 608×342 at (252,236); cream `#FFF5DF` margins (`recolourBoard: false`); „Nie dodawaj dużych elips cienia” (`contactShadows: []`) |
| `designs/bystrow-space-base-v3/screenshots/{base-with-three-modules,lab-before,lab-after-natural,lab-after-sunny,lab-after-mint}.png`, `preview.html` (`?view=base|before|after&family=…`) | visual-gate references for the base with three modules and the Laboratorium room |
| `designs/bystrow-space-base-v5/README.md` § Podgląd i integracja + `assets/base/base-1-cell-frame.png` + `screenshots/` (ramka) | the base frame: 640×374 drawn at (cell.x−16, cell.y−16), transparent interior. The rest of v5 (crew, sticker, life layers) belongs to S-35 and is NOT used here |
| `Martynka-urzadza.md` § 10 | asset naming: `public/assets/rooms/lab/<file>.webp`, `public/assets/house/base-1-cell-frame.webp` |
| Copy keys (`src/data/pl.ts`) | NEW: `pl.room.names.lab` „Laboratorium” (manifest label); `pl.room.slots['lab-*']` captions from the manifest labels („mikroskop”, „gablota z kamieniami”, „stół z kolbami”, „model Księżyca”, „stołek”, „tablica magnetyczna”); `pl.room.variants['lab-*']` from the families agreed with the noun (Naturalny/Słoneczny/Miętowy for mikroskop, stół, model, stołek; Naturalna/Słoneczna/Miętowa for gablota, tablica); `pl.room.tasks.*` six imperative + accusative labels (the kit has none — DESIGN-GAP, as 201 for the Hangar). EXISTING reused: `renovate` „Odnów ściany i podłogę”, `pl.room.done.*`, `pl.room.change.*`, `pl.house.open['base-1']` „Baza” |

### DESIGN-GAPs expected (rows in `docs/design-gaps.md`, numbering continues after 207)

- NEW: the kit has no Laboratorium renovation wording (task labels and agreed variant names are ours), like gap 201.
- EDIT gap 196: narrowed again — the Laboratorium is the base's last module; its card shows three done tiles and no teaser.
- CLOSE gap 199: the base frame comes from `bystrow-space-base-v5`. Gap 200 (stand-in shell without roof) stays.

## Migration

**None expected; save format stays v7.** The Laboratorium is a new `RoomDef` and a new row appended to
`HOUSES['base-1']`; the v7 save already carries `house.rooms`, `rooms` and `currentRoom`, and the load path rebuilds the
layout from data (`mergeHouse`), so a child who finished the Hangar on the S-30..S-32 build opens in the Laboratorium at
load through `nextRoom` (Hangar precedent with `save-v6-bridge-done.json`). Proof to add: a frozen fixture of a finished
Hangar, **`tests/fixtures/save-v7-hangar-done.json`** (v7, since fixtures written now are v7; `save-v7.json` is the shape
model), listed in `FIXTURES` of `tests/fixtureLoadPath.test.ts` with a case „save-v7-hangar-done meets the Laboratorium:
house with three cells, current room lab, Mostek, Hangar and stars kept”. The frame is runtime art, never saved.
Rollback below this build: the old build's `repairCurrentRoom` sends an unknown `currentRoom: 'lab'` to the house's
first room (Mostek) and keeps `rooms.lab` untouched; `mergeHouse` keeps the saved extra cell (Hangar precedent, research
re-confirms). What would change the answer: research finding a per-room saved field v7 lacks, or the base frame stored
in the save (it is not).

## Open follow-ups triggered by this slice

| source | item | take |
|---|---|---|
| hangar-module 1 (gap 196) | Trigger „a third base module, or a designer answer for the last-module celebration” | **in scope, fires**: the Hangar card gains the Laboratorium tile, „Dalej” leads to it; the last-module case moves to the Laboratorium (D3). Edit gap 196, record narrowed, keep the trigger „a fourth base module (S-34 cabins-module) or a designer answer” |
| base-cross-section 6 (gaps 199, 200) | Trigger „a designer answer (a base frame or a base stand-in)” | **in scope, fires for the frame**: v5 `base-1-cell-frame` replaces the shared house frame (data + `HOUSE_ART` row + art-script row); close gap 199. The stand-in half (gap 200) is not answered by v5: carry |
| hangar-module 2 (gap 201, Hangar wording and costs) | Trigger: the designer's Hangar copy, the author's cost answer, or S-17 | not fired (no Hangar row changes); the Laboratorium gets its own wording gap. Carry |
| hangar-module 4 / bathroom 9 / house-1-polish 11 (a room finished on an older build meets the next without the card) | Trigger: a change to `nextRoom` or the load path in `src/main.ts` | not fired (no code change there); applies to Hangar → Laboratorium too: carry with that note |
| hangar-module 5 (e2e cannot tell after from before) | Trigger: a background drawn from something other than `ROOM_SCENE_FILES` | not fired; the Laboratorium gets its `tests/roomArt.test.ts` snapshot like the Hangar (`tests/fixtures/room-art-lab.json`) |
| hangar-module 5-carried / bathroom 7 / house-1-polish 13 (texture atlas) | Trigger: `tests/bootBudget.test.ts` headroom < 2 s or a room heavier than the salon | **conditional**: measured after `npm run art`; expected well under the salon. Re-record |
| bathroom 10 / house-1-polish 9 (service-worker install warning) | Trigger: the next change to the precache set | **fires** (22 new pictures); expected unchanged warning — re-record, no work |
| house-1-polish 2 (retire `recolour-board.py` and friends) | Trigger: the next change to `scripts/make-task-art.mjs` | **fires** (new `ROOM_PACKS` row, new pack constants). Take: **out of scope** — retiring the recolour path is an art-pipeline cleanup unrelated to the module and touches a tested script; carry with the trigger kept (the plan may revisit if trivial) |
| hangar-module 3 (`roomArtCheck` unused) | Trigger: the next change to `scripts/check-deploy.ts` | not fired (no change planned there). Carry |
| base-cross-section 13 (`HouseScene`/`HouseView` items) | Trigger: the next change to `HouseScene`, `HouseView` or `RoomScene.redraw` | not fired: the frame is data read by unchanged `HouseView`. Carry |
| base-cross-section 7 (back label) | designer / playtest | not fired. Carry |

## Autonomous decisions

- **D1. Laboratorium costs 6/10/13/14/17/19/21 = 100 stars, in the manifest's slot order (microscope, rocks, flasks,
  globe, stool, board).** Chosen: the Mostek/Hangar ladder (scope.md: costs follow the kids-room/hangar precedent; FR-044
  „about 100” per base module). Rejected: a steeper third module (no playtest measure, S-17 tunes); rejected: reordering
  (the microscope is the central hero piece, z 30, first like the console and the rocket). What would change it: S-17
  measurements or the maintainer naming a price.
- **D2. The Laboratorium sits in `upper-left` (floor 1, place 0) of `base-1`**, appended after the Hangar. Evidence: v3
  README, `screenshots/base-with-three-modules.png`, roadmap outcome. Rejected: upper-right (the pack leaves it closed for
  S-34). What would change it: a designer reorder of the base cells.
- **D3. No teaser tile on the Laboratorium card; the Hangar card shows the Laboratorium as a next-room tile.** The roadmap
  Risk's „wraca kafelek zapowiedzi” is a plan-time misreading: `houseRoomList` makes a teaser only for an unknown room in
  the house data. Rejected: adding a `cabins` row to `HOUSES['base-1']` to get a „Wkrótce” teaser — it would put an
  unknown room into saves via `house.rooms` before S-34 has data or art, against FR-046 „opens when added”. What would
  change it: S-34 data, or a designer answer for the last-module celebration.
- **D4. Base frame = data + art only.** `HOUSE_GEOMETRY['base-1'].cellFrame` → `'house/base-1-cell-frame'`, `HOUSE_ART`
  row, art script `BASE_FILES` row with its own pack root (v5). Rejected: drawing a frame in code, or tinting the house
  frame (the pack delivers the art). The art script gets a per-row `pack` in `BASE_FILES` (small, named non-data touch).
  What would change it: research finding `HouseView` assumes the house frame's look anywhere else (none seen).
- **D5. Room id `lab`** (the pack's id; texture keys `lab/lab-*`, folder `public/assets/rooms/lab/`). Rejected:
  `laboratory` (would rename every pack file id). What would change it: nothing in this run.
- **D6. No save-format change (v7 stays)**; proof by the frozen fixture `save-v7-hangar-done.json`. What would change it:
  see Migration.
- **D7. Captions use the pack labels** („model Księżyca” keeps the capital K for the celestial body); variant names agree
  with the noun gender. The teacher read in the plan checks them. What would change it: that read finding a caption
  unclear for a 6-year-old.
- **D8. Next step is `/10x-research`** (run chain): the slice's risk is hidden pins of „Hangar is last” in unit and e2e
  tests and in the art script's single-pack `BASE_FILES`. What would change it: none for this run.
