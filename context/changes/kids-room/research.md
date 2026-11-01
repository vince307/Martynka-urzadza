---
date: 2026-11-01T12:33:02+01:00
researcher: Claude (autonomous run 2026-11-01-kids-room, research step)
git_commit: 697ece5
branch: feat/kids-room
repository: vince307/Martynka-urzadza
topic: "S-25 kids-room: footprint of the staged renovation (D1), boot budget, stage-0 picture, save landing, house cell, copy"
tags: [research, rooms, roomArt, RoomView, RoomScene, backdrop, house, save, bootBudget, RoomDoneCard, pl]
status: complete
last_updated: 2026-11-01
last_updated_by: Claude (autonomous run 2026-11-01-kids-room, research step)
---

# Research: S-25 kids-room

**Date**: 2026-11-01T12:33:02+01:00
**Researcher**: Claude (autonomous run, research step; two read-only Explore sub-agents for the D1 sweep and the save/house/copy sweep, their claims spot-checked below)
**Git Commit**: 697ece5 (branch `feat/kids-room`, cut from `main` at `bfdf193`)
**Branch**: feat/kids-room
**Repository**: vince307/Martynka-urzadza

## Research Question

From `context/changes/kids-room/change.md` (decisions D1–D7, open unknowns, triggered follow-ups) and the step prompt:
(a) the exact code footprint of D1 (three stage tasks with stage-0/1/2 backgrounds) against one stage task, and a
recommendation; (b) the boot/runtime load budget for a third room of house 1; (c) whether `children-before` and
`children-stage-0` are the same picture; (d) how a finished-kitchen v6 save lands in the kids room, and the frozen
fixture pattern; (e) the house-1 cross-section with the upper-left cell open; (f) Polish names and captions from the
pack's manifest labels.

## Summary

- **D1 holds — recommend it.** Its footprint is 6 non-test source files outside the pure room data: `src/core/types.ts`,
  `src/core/rooms.ts`, `src/core/backdrop.ts`, `src/ui/widgets/RoomView.ts`, `src/scenes/RoomScene.ts`
  (`fadeStage`), and `src/data/roomArt.ts`. `roomArt.ts` sits in `data/` but holds logic. The heart of it is one
  pure helper (a proposed `sceneKey(room, state)` in `src/core/rooms.ts`) that replaces the 4 copies of
  `stagesDone(...) > 0 ? scene.after : scene.before`. D1's own reversal condition named the save, the celebration
  rules and `HouseView`. None of the three changes: the save counts stages as tasks in `tasksDone`, and `HouseView`,
  `RoomDoneCard` and `SalonBackdrop` follow through `miniaturePieces`/`backdropMode`. `stagesDone` already counts
  several stage tasks, and back-to-back stage purchases already work in `stepPanel`.
- **Boot budget passes; no atlas is needed.** The kids room's D1 boot set measures **862 160 B** with the run's own
  `cwebp` flags: 5 scene pictures and 18 furniture variants, `children-before` not included. The salon set is
  1 203 384 B on disk and passes `tests/bootBudget.test.ts` today, so the salon stays the worst case. The kids room is
  about 341 KB lighter.
- **`children-before` ≠ `children-stage-0`.** They have the same alpha but different RGB: 20.5 % of opaque pixels
  differ by more than 32. The earlier "identical" claim came from Pillow's alpha-only `getbbox`. `children-before` is
  the worn room with its old furniture baked in. `children-stage-0` is the empty neglected room that the pack's
  `renovation.stages[0]` names. With D1, `before` is `children-stage-0` and `children-before` is not converted.
- **Save landing works with no format change.** A v6 save with salon and kitchen done loads with `currentRoom`
  `children`. `nextRoom` → `roomInRenovation` over the house merged from data does this, and the saved house does not
  need the cell. The frozen fixture `save-v6-kitchen-done.json` should model `save-v6-bridge-done.json`. Rollback
  keeps every saved room. Only `currentRoom` falls back to `salon`.
- **NEW finding, not in change.md: the "Pokój gotowy!" card cannot fit three tiles.** `ROOM_DONE_LAYOUT.tiles` is
  440 wide with a 60 gap: 3·440 + 2·60 = 1440 > `card.width` 1144. `tests/layout.test.ts` checks only 2 tiles. The
  fix is in layout data (`src/data/layout.ts`) plus the test. It is not product code, but it changes how the existing
  two-tile cards look.
- **The house cell needs no code or art.** Placing `children` at floor 1, place 0 opens the `upper-left` cell with a
  live miniature. The house-1 shell already draws both floors. `upper-right` stays the closed "Wkrótce" cell.
- **Copy:** the name "Pokój dziecięcy" and the slot captions come from the pack labels. The pack gives masculine
  variant labels for every slot, so the gender agreement and the stage task imperatives are ours (DESIGN-GAP rows, as
  with 194 and 201).

## Detailed Findings

### (a) D1 footprint: every module that assumes one before/after pair

**Already generic (no change):**

- `src/core/rooms.ts` `stagesDone` counts `kind === 'stage'` tasks in the done prefix of `room.tasks`
  (`slice(0, tasksDone)`). With 3 stage tasks it returns 0..3. `tests/rooms.test.ts` covers only one stage.
- `src/core/types.ts` `RoomTaskDef` already allows any number of `{ kind: 'stage' }` entries.
- `src/core/variantPanel.ts` `stepPanel`: when the current task is a stage, one tap buys it with the panel closed.
  The next current task is then the next stage, so consecutive stages work. `tests/variantPanel.test.ts` already has
  a `walls` stage case.
- `src/ui/widgets/RoomTaskButton.ts`, `src/ui/roomArtLoader.ts`, `src/core/artHealth.ts` (`roomHealthOf`),
  `src/ui/widgets/RoomLayer.ts`, `src/ui/wornGrade.ts` `applyWornGrade` and `src/core/colorGrade.ts` have no stage
  logic.
- `src/ui/widgets/roomCapture.ts` `captureRoomMiniature`, `src/ui/widgets/HouseView.ts` (cell miniatures),
  `src/ui/widgets/RoomDoneCard.ts` (via `miniaturePieces`) and `src/ui/widgets/SalonBackdrop.ts` (via
  `backdropMode`) follow the background choice once that choice changes in one place.
- `scripts/make-task-art.mjs` `ROOM_PACKS`: `scene` is a free list of file ids. `ROOM_JOBS` maps each id to
  `assets/room/<id>.png` → `<room>/<id>.webp`, so a row with 5 scene files needs no script change.
- `src/testing/e2eHook.ts` only forwards `RoomScene.snapshot()`.
- `tests/e2e/support/salon.ts`: the buy loops tap once per stage task and open the panel only for slot tasks.

**Must change (D1):**

1. `src/core/types.ts` `RoomDef.scene` is `{ before; after; shadows }`. Option A adds an optional `scene` key to the
   stage task, naming the background that task reveals. Option B adds a `stages` list to `RoomDef.scene`. A is
   recommended: the background is the `scene` of the last done stage task, else `scene.before`. The last stage task
   names `children-after`, so single-stage rooms (salon, kitchen, bridge, hangar) stay unchanged when the field is
   absent (fallback `scene.after`).
2. `src/core/rooms.ts`: a new pure `sceneKey(room, state)`. Three functions gate on `stagesDone > 0`:
   `wornPieces`, `contactShadowPieces` and `shownVariant` (`shownBeforePurchase`). They can stay as they are, because
   the kids room has `worn: []`, `contactShadows: []` (the manifest's `shadowEllipses: []`) and no
   `shownBeforePurchase` slot. "Gone after the first stage" is today's meaning, so no salon behaviour changes.
3. `src/ui/widgets/RoomView.ts`: `RoomView.render` (`renovated = stagesDone > 0` picks the background) and
   `miniaturePieces` (piece 0 background) both switch to `sceneKey`. The same `renovated` flag also gates the shadow
   layer and the decor. For the kids room the shadows file is fully transparent and there is no decor, so that gate
   can stay `> 0`.
4. `src/core/backdrop.ts` `backdropMode` repeats the same choice → `sceneKey`.
5. `src/scenes/RoomScene.ts` `fadeStage` always ghosts `room.scene.before` + `scene.shadows` + `buildWorn(emptyRoomState())`.
   At stage 2 or 3 it would cross-fade from the wrong picture. Change: ghost the previous `sceneKey` (the state with
   `tasksDone - 1`), and add the shadow and worn ghosts only when the previous `stagesDone` was 0. Its comment
   "DESIGN-GAP … the pack has no in-between backgrounds (brief P3.6)" narrows for this room. The trigger
   (`step.bought?.kind === 'stage'`) already fires once per stage. `RoomScene.redraw` only calls `view.render`, so
   house-cross-section follow-up 21 does not fire. Optional: `RoomScene.snapshot` adds `stagesDone: number` next to
   the boolean `stageDone`, so e2e can tell stage 1 from stage 2.
6. `src/data/roomArt.ts`: `SceneRole` is `'before' | 'after' | 'shadows'` and `ROOM_SCENE_FILES` is a fixed-role
   record. `roomArt` maps those roles only, so stage-1/2 textures would never load. Change: also emit the stage
   tasks' `scene` keys (one `SCENE_SIZE` entry each, `label: ''` so `UIScene` keeps them out of the missing-piece
   labels). This keeps hangar-module follow-up 5 satisfied: everything drawn is in the room art table, which
   `tests/roomArt.test.ts` guards.

**Tests to adapt:** `tests/roomArt.test.ts` ("labels every stand-in…" uses `Object.values(room.scene)`; "exactly the
texture keys…") must collect scene keys through the same helper, and a frozen snapshot `room-art-children.json` joins
`room-art-kitchen.json`. `tests/rooms.test.ts` gets a multi-stage `stagesDone`/`sceneKey` case.

**Verdict:** the code stays within D1's bound (room data type, rooms core, room view and miniature, plus the
backdrop helper and the stage fade that belong to the same view). D1's fall-back trigger was the save, the
celebration rules or `HouseView`, and none of them change. Recommend D1 with option A. Fallback if the plan finds
option A heavier than measured here: one stage task `renovate`, `children-before` → `children-after`, data only.

### (b) Load budget

- `tests/bootBudget.test.ts` runs per room over `Object.keys(ROOMS)`. It sums `TASK_ART + bootRoomArt(room) + UI_ART`,
  the font and the boot sounds, at 50 000 B/s, and requires at most `(balance.loader.totalMs − 2000)/1000` = 48 s
  (`src/data/balance.ts` `loader.totalMs` 50000). `bootRoomArt` (`src/data/roomArt.ts`) loads only the current room,
  falling back to `FIRST_ROOM`.
- Measured in this step: the kids room's PNGs converted with the art script's own flags (`cwebp -q 85 -alpha_q 100
  -m 6`, from `scripts/make-task-art.mjs`) into the scratchpad, `designs/` untouched:
  - stage-0 115 814 B, stage-1 112 200 B, stage-2 99 824 B, after 86 014 B, shadows 4 056 B;
  - 18 furniture files (bed natural/house/drawers + 5 slots × natural/sunny/mint), between 18 638 B and 44 494 B
    each;
  - **D1 set 862 160 B**. The fallback set (before instead of 3 stages) is 661 640 B.
- On disk today: salon 1 203 384 B (the test passes), kitchen 797 758 B, bridge 699 124 B, hangar 606 452 B.
- Verdict: the kids room is below the salon, which stays the worst case. The kitchen-room follow-up 5 (atlas,
  Trigger "a third room") fires and is answered "measured, not needed". The runtime path (`roomArtLoader.ensure`
  after "Dalej" in `RoomScene.moveAfterDone`) loads ~0.86 MB from the precache.

### (c) Stage-0 picture

- Read-only numpy compare of `designs/martynka-evolution-v1/assets/room/children-before.png` against
  `children-stage-0.png` (RGBA, both 1920×1080):
  - alpha difference max 0;
  - RGB difference: max 244, mean 22.4 over opaque pixels, 35.6 % of opaque pixels > 8, 20.5 % > 32, bbox
    (296,216)–(1634,955).
- A contact sheet shows `before` = the worn room with bed, bookcase, wardrobe, desk, chest and armchair baked in.
  `stage-0` = the same room empty and neglected.
- The manifest's `renovation.stages[0]` ("Przed remontem") uses `children-stage-0`, then stage-1 "Sprzątanie",
  stage-2 "Malujemy ściany", `children-after` "Odnawiamy podłogę".
- So with D1 the room's `before` is `children-stage-0` and `children-before` is not converted. With the fallback,
  `before` is `children-before`.
- `children-shadows.png` is byte-identical to `kitchen-shadows.png` and fully transparent (alpha max 0).

### (d) Save landing and the frozen fixture

- `src/core/save.ts` `decodeSave` runs no migration for v6. `validRoom`/`validHouse` check shapes only, never room
  ids. The one cross-check is that `currentRoom` is a key of `rooms`.
- `src/main.ts` load block:
  1. `houseLayout` keeps the data house;
  2. `repairCurrentRoom` (`src/core/rooms.ts`) keeps `kitchen`, since it is known;
  3. `mergeHouse` (`src/core/house.ts`) builds the cells from the data order and appends saved cells the data lacks;
  4. `nextRoom` → `roomInRenovation` finds `children` not done, sets `rooms.children = emptyRoomState()`,
     `currentRoom = 'children'`, `movedFrom = 'kitchen'`.
  The saved `house` does not need the new cell. In play, "Dalej" on the card is `RoomScene.moveAfterDone` (same
  `nextRoom`, `flush('now')`, `roomArtLoader.ensure`). `celebrationView` (`src/core/celebration.ts`) only computes
  timing, burst and keepsake.
- Fixture: `tests/fixtures/save-v6-bridge-done.json` is the shape to copy. It is a full v6 record (learner,
  variants, `generation`, `writer`), with the house as the previous build wrote it. It is used in
  `tests/fixtureLoadPath.test.ts` in two places: the `FIXTURES` array (real IndexedDB → `loadSave` → write →
  reload) and the test "save-v6-bridge-done meets the Hangar", which mirrors `main.ts` (repair → `mergeHouse` →
  `nextRoom`).
  Today no save fixture has a finished kitchen (`save-v5-salon.json` only lists the cell). The plan adds
  `save-v6-kitchen-done.json`:
  - `house: { id: 'house-1', rooms: [salon (0,0), kitchen (0,1)] }`;
  - salon and kitchen at full `tasksDone` with their own slot ids only, so `roomStateProblems` = [];
  - `currentRoom: 'kitchen'`.
  The test expects room ids `['salon','kitchen','children']`, `currentRoom` `children`, `movedFrom` `kitchen` and
  both rooms unchanged.
- Rollback (a build without `children` meets the save): the v6 decode passes.
  - `repairCurrentRoom` sends `currentRoom` to `salon` (the first room of the layout); `repairedFrom` is
    `children`.
  - `mergeHouse` keeps the `children` cell as an extra, with a warning.
  - `rooms.children` is kept. `roomStateProblems` logs `unknown-room` only.
  - The old house view draws the cell closed.
  Nothing is lost, so no `deploy/README.md` line is needed. A roll-forward lands back in the kids room through
  `nextRoom`.

### (e) House cross-section

- `src/core/houseCells.ts` `houseCells` matches a data cell by floor and place. A cell is open when its room is known:
  'current' or 'done', otherwise 'closed'. `HouseView.render` captures a miniature per open cell and draws
  `cellClosed` + `pl.room.done.teaser` for the rest.
- `HOUSE_GEOMETRY['house-1']` (`src/data/houses.ts`) already lists `upper-left` (252,236, 608×342, the same box as
  `docs/designer-brief-m03.md` and `designs/martynka-house-street-v2/manifest.json` `houses.house-1`).
- `public/assets/house/house-1-shell.webp` in `HOUSE_ART` (`src/data/houseArt.ts`) is the full two-storey shell with
  four cream cells, so no house art is needed. The manifest's "life" overlays are not in `HOUSE_ART` (out of scope).
- Data change only: `{ room: 'children', floor: 1, place: 0 }` in `HOUSES['house-1']`. This answers rooms-as-data
  follow-up 11 / house-cross-section follow-up 13.
- `houseRoomList` (`src/core/house.ts`) emits a teaser only for an unknown room in the house rows. house-1 then lists
  salon, kitchen, children: three tiles and no teaser, because the bathroom has no row until S-31.

### NEW: the room-done card with three tiles

- `RoomDoneCard.show` centres `items.length` tiles of `ROOM_DONE_LAYOUT.tiles.width` (440) with `gap` (60) inside
  `card` (left 388, width 1144). Three tiles need 1440 px, so they overflow the card by 148 px on each side (first
  tile at x 240).
- `tests/layout.test.ts` ("lays the room list tiles … inside it") checks `2 * tiles.width + tiles.gap`. Every room
  list so far had 2 entries (salon + kitchen, bridge + hangar, or room + teaser).
- Constraints for the fix:
  - the thumbnail is `1920 × thumbScale 0.13` ≈ 250 px wide;
  - the caption "Pokój dziecięcy" measures 258 px at `FONT_SIZES.bar` 36 and weight 650 (Pillow on
    `public/fonts/MartynkaNext.ttf`). The caption is not fitted (`RoomDoneCard.caption`, plain `textStyle('bar')`).
- The data-only option is a tile width of about 320 with a gap of about 40 (1040 ≤ 1144). The test then checks the
  longest room list in `HOUSES`, not 2.
- Four tiles (S-31 bathroom) will not fit 1144 at width ≥ 280. S-31 needs a narrower tile with a fitted caption or a
  wider card: record a follow-up with Trigger S-31.
- This is layout data, outside the room data promise of FR-033. Name it for the product owner like D1.
- Name length elsewhere: house cells draw no room name. `HudTitle` is not a room name. The DOM save dialogs use
  `roomName` in wrapping HTML.

### (f) Copy (pack labels are the source)

- Name: `pl.room.names.children` = "Pokój dziecięcy" (manifest `rooms.children.label`).
- Captions (`pl.room.slots`, nominative lower-case like `'kitchen-fridge': 'lodówka'`), from the slot labels:
  - `children-bed` "łóżko";
  - `children-desk` "biurko i krzesło";
  - `children-books` "regał na książki";
  - `children-toys` "skrzynia na zabawki";
  - `children-reading` "kącik czytelniczy";
  - `children-wardrobe` "szafa".
- Variants (`pl.room.variants`, 3 per slot):
  - The bed takes the pack's forms "Baldachim", "Domek", "Z szufladami" (`selectionKind: "form"`).
  - The other five slots get "Naturalny/Słoneczny/Miętowy" from the pack. The kitchen precedent changed these to
    agree with the caption: locations-v2 gives masculine labels for every kitchen slot, and `pl.ts` has
    `'kitchen-fridge': ['Naturalna', …]`. Same here:
    - desk (biurko i krzesło) → Naturalne/Słoneczne/Miętowe;
    - books, reading → Naturalny/Słoneczny/Miętowy;
    - toys, wardrobe → Naturalna/Słoneczna/Miętowa.
- Tasks (`pl.room.tasks`, imperative + accusative, keyed by `RoomTaskDef.label`):
  - The pack's stage labels are nouns or first-person plurals ("Sprzątanie", "Malujemy ściany", "Odnawiamy
    podłogę"). The imperatives are ours (e.g. "Posprzątaj pokój", "Pomaluj ściany", "Odnów podłogę").
  - Slot tasks follow the kitchen style ("Postaw szafki").
  - DESIGN-GAP row (next number after 201), as with 194 and 201.
  - `tests/roomsData.test.ts` "every room in ROOMS" checks a caption, 3 variant names, task text and a name per room.

## Code References

- `src/core/rooms.ts` `stagesDone`, `wornPieces`, `contactShadowPieces`, `shownVariant`, `repairCurrentRoom`,
  `roomsListView`: stage count and its `> 0` consumers; rollback repair.
- `src/ui/widgets/RoomView.ts` `RoomView.render`, `miniaturePieces`: the two background choices.
- `src/core/backdrop.ts` `backdropMode`: the third background choice.
- `src/scenes/RoomScene.ts` `fadeStage`, `moveAfterDone`, `snapshot`: the stage cross-fade from `scene.before`;
  "Dalej"; the e2e `stageDone` boolean.
- `src/data/roomArt.ts` `SceneRole`, `ROOM_SCENE_FILES`, `roomArt`, `bootRoomArt`: the fixed scene roles; the boot
  set.
- `src/core/types.ts` `RoomDef.scene`, `RoomTaskDef`.
- `src/core/house.ts` `houseRoomList`, `roomInRenovation`, `nextRoom`, `mergeHouse`, `houseLayout`.
- `src/core/houseCells.ts` `houseCells`, `cellTap`; `src/ui/widgets/HouseView.ts` `HouseView.render`.
- `src/data/houses.ts` `HOUSES`, `HOUSE_GEOMETRY['house-1']`; `src/data/houseArt.ts` `HOUSE_ART`.
- `src/data/layout.ts` `ROOM_DONE_LAYOUT`; `src/ui/widgets/RoomDoneCard.ts` `show`, `caption`; `tests/layout.test.ts`.
- `tests/bootBudget.test.ts`; `src/data/balance.ts` `loader.totalMs`.
- `tests/fixtures/save-v6-bridge-done.json`; `tests/fixtureLoadPath.test.ts` `FIXTURES`.
- `scripts/make-task-art.mjs` `ROOM_PACKS`, `ROOM_JOBS`.
- `designs/martynka-evolution-v1/manifest.json` `rooms.children`, `renovation`.

## Architecture Insights

- The background choice is copied 4 times (`RoomView.render`, `miniaturePieces`, `backdropMode`, `fadeStage`).
  D1's real change is to make that choice one pure function. The rest of the room pipeline already keys off
  `tasksDone` and is stage-count agnostic.
- Option A (a stage task names the scene it reveals) keeps "a room is data": S-32 (kitchen stages) then adds
  `kitchen-stage-1/2` keys to the stage tasks with no code, plus its own `tasksDone` migration.
- The card overflow shows that the room list grows with the house. Layout tests should check the longest house list
  in data, not a literal count.

## Historical Context (from prior changes)

- `context/archive/2026-11-01-hangar-module/` (S-30): a room appended to a house with no code outside data and the
  art script. `save-v6-bridge-done.json` proves the landing. Its follow-up 5 is about drawing from something other
  than `ROOM_SCENE_FILES`: satisfied if stage keys come through `roomArt`.
- `context/archive/2026-10-31-kitchen-room/` (S-22): `bootRoomArt`/`roomArtLoader`. Follow-up 5 (atlas, Trigger "a
  third room") fires and is answered here as measured, not needed. Follow-up 13 (kitchen wording) does not fire.
- `context/archive/2026-10-31-house-cross-section/` (S-23): follow-up 13 (kids' room id and the closed cell) fires and
  closes with D4/D5. Follow-up 21 (`RoomScene.redraw`) does not fire (D1 touches `fadeStage`, not `redraw`).
- `context/archive/2026-10-30-rooms-as-data/` follow-up 11: same id question, closes.

## Related Research

- `context/archive/2026-11-01-hangar-module/research.md`, `context/archive/2026-10-31-kitchen-room/research.md`
  (room-as-data precedents).

## Open Questions

- Tile and gap numbers for `ROOM_DONE_LAYOUT.tiles` with 3 tiles (plan decides; constraints above). S-31's 4 tiles
  need a fitted caption or a wider card (follow-up with Trigger S-31).
- The exact Polish imperatives for the three stage tasks and the five slot tasks (plan proposes; teacher read; gap
  row).
- Option A field name on the stage task (`scene`/`reveals`) is a plan choice.
