---
date: 2026-11-01T07:05:17+01:00
researcher: Claude (autonomous run 2026-10-31-space-base, /10x-research step)
git_commit: 4015225
branch: feat/hangar-module
repository: Martynka-urzadza
topic: "S-30 hangar-module: is the Hangar data + art only; boot budget; cross-section cell and miniature; Dalej from Mostek and v6 back-compat; deploy smoke and Obrazki; Polish copy"
tags: [research, rooms, houses, roomArt, make-task-art, bootBudget, houseCells, RoomScene, deploy-smoke, design-gaps]
status: complete
last_updated: 2026-11-01
last_updated_by: Claude (autonomous run 2026-10-31-space-base)
---

# Research: S-30 `hangar-module`

**Date**: 2026-11-01T07:05:17+01:00
**Researcher**: Claude (autonomous run, research step; local reads, one cwebp conversion into the session scratchpad, two throwaway vitest probes created and deleted in the same command; no workers: the scope is one data path already mapped by `change.md` and the S-22/S-29 precedents)
**Git Commit**: 4015225
**Branch**: feat/hangar-module
**Repository**: Martynka-urzadza

No lessons file exists in `context/foundation/` (checked at this step), so no lesson is applied.

## Research Question

Derived from `change.md` (roadmap corrections, D1-D6, triggered follow-ups) and `handoff.md` § 5:

- (a) Is adding the Hangar data + art only (FR-047 "moduł jak pokój")? Name any code that hard-codes Mostek, `base-1` room lists or last-module behaviour.
- (b) Boot budget: the converted Hangar WebP size vs `tests/bootBudget.test.ts` and `balance.loader.totalMs`; confirm the boot loads only the room in renovation.
- (c) The cross-section cell for the Hangar and the miniature capture.
- (d) The celebration / "Dalej" from Mostek into the Hangar; a v6 save that finished Mostek (does "Pokój gotowy!" re-show?).
- (e) Deploy smoke `roomArtCheck` / `precacheCovers` and the "Obrazki" count.
- (f) Polish captions, task labels and variant names (gender/number agreement).
- Schema: does the save stay v6?

## Summary

- **(a) Product code: data + art only. No file under `src/scenes`, `src/core`, `src/ui`, `src/main.ts` needs a change.** A grep for `bridge`, `base-1`, `BRIDGE`, `'salon'`, `'kitchen'`, `FIRST_ROOM`, `FIRST_HOUSE` over `src/scenes src/core src/ui src/main.ts src/testing` finds only the generic fallbacks (`?? FIRST_ROOM` / `?? FIRST_HOUSE` in `HouseScene.render`/`geometry`, `RoomScene.resolve`/`currentRoomId`/`houseCellList`/`listItems`/`moveAfterDone`/`redraw`, `TaskScene` backdrop, `SalonBackdrop`, `UIScene` reset, `main.ts` load path) and the frozen migration constants (`HOUSE_V5` in `src/core/migrations/house.ts`, `SALON_ID` in `legacySalon.ts`), none of which names Mostek or a base room list. The `bridge` hits in `src/data` are the data itself: `HOUSES['base-1']` (`src/data/houses.ts`), `BRIDGE`/`ROOMS` (`src/data/rooms.ts`), `ROOM_SCENE_FILES.bridge` (`src/data/roomArt.ts`), `pl.room.{names,tasks,slots,variants}` (`src/data/pl.ts`). **One non-`src` code file must change: `scripts/make-task-art.mjs`** (a pack-root constant for `designs/bystrow-space-base-v2` and a `ROOM_PACKS` row `hangar`, `recolourBoard: false`) — the art pipeline, which FR-047's "pliki grafiki" implies. **Tests that pin `base-1` as one room and must be edited** (expected, not regressions): `tests/roomsData.test.ts` "is the stage first, then six furniture tasks, and the only room of the base" and "keeps the child in Mostek after the last task: Dalej stays"; `tests/roomArt.test.ts` (snapshot `ROOM_ART` equality and the "37 salon, 21 kitchen and 21 bridge entries" count); `tests/e2e/base-cross-section.spec.ts` "#16 #2 S-29 FR-046 … 'Dalej' stays in Mostek" (after S-30 "Dalej" moves to the Hangar). `tests/houseCells.test.ts` "shows the bridge as current and the rest closed, also with the Mostek done" stays green (a known room not reached is `closed`).
- **(b) Budget holds with wide headroom; boot loads only the room in renovation (confirmed).** cwebp with the art script's flags (`-q 85 -alpha_q 100 -m 6`, `convert` in `scripts/make-task-art.mjs`) gives the 21 Hangar files **606 452 B** in all (bridge on disk 699 124 B, kitchen 797 758 B, salon 1 203 384 B). The boot payload outside the room is 889 112 B (measured through `bootRoomArt`, `TASK_ART`, `UI_ART`, font, boot sounds as in `tests/bootBudget.test.ts` `bootPayloadBytes`), so a Hangar boot is about 1 495 564 B = 29.9 s at 50 KB/s against the 48 s limit (`balance.loader.totalMs` 50 000 − `HEADROOM_MS` 2 000). The worst case stays the salon at 2 092 496 B = 41.8 s. `tests/roomArt.test.ts` "weighs at most 1 550 000 bytes per room" holds (606 452 B). The atlas follow-up does **not** fire.
- **(c) Cell = one data row; miniature is generic.** Adding `{ room: 'hangar', floor: 0, place: 1 }` to `HOUSES['base-1']` puts the Hangar in `ground-right` (1060,636, 608×342), which already exists in `HOUSE_GEOMETRY['base-1']` (D2; pack README "Pełną scenę skaluj … do 608×342 w (1060,636)"). `houseCells` shows it `closed` (airlock + "Wkrótce") while Mostek is in renovation, then `current` with the frame; Mostek becomes `done` and is drawn by `captureRoomMiniature` (`HouseView.render`) after `HouseScene.render` calls `roomArtLoader.ensure` for every open cell. Nothing building-specific.
- **(d) "Dalej" moves to the Hangar with no code change; a finished-Mostek v6 save opens in the Hangar at load and the card does not re-show.** `RoomScene.moveAfterDone` → `nextRoom` → `roomInRenovation` returns the first known not-done room of the data house; with the Hangar row it is `hangar`. The card lists `houseRoomList(base-1)` = Mostek, then Hangar with `unlockAfter: 'bridge'`, and no teaser (a teaser appears only for an unknown room, `houseRoomList`). At load (`main.ts`, `outcome.kind === 'loaded'` branch) `nextRoom` moves a done Mostek to `hangar`, logs `Renovation moved from bridge to hangar`, sets `roomRepaired` (saved at once); the card is set only inside the purchase branch of `RoomScene` (`this.card = true` when `roomDone` after `step.bought`), so it is **not** shown again — the same behaviour as the S-22 finished salon opening in the kitchen. Rollback below S-30 lands the child in Mostek (verified path below). **Save stays v6.**
- **(e) Smoke and "Obrazki" derive from `ROOMS`; no script change.** `scripts/check-deploy.ts` records `precacheCovers('room pictures', precache, ROOM_ART.map(…))` (with a SHA only); `ROOM_ART` = `Object.values(ROOMS).flatMap(roomArt)`. `roomArtCheck` (`scripts/deploy-check/parse.ts`) is exported and unit-tested in `tests/deployCheck.test.ts` but **not called** from `scripts/check-deploy.ts` (checked: the only callers are the test file). "Obrazki" judges the current room through `roomHealthOf` over the boot or runtime room entries; missing-piece labels come from `ROOM_ART[].label`, built from `pl.room.slots`/`variants` — so the Hangar copy is required for the labels (`tests/roomsData.test.ts` "has child-facing text for every slot, variant, decoration and task" enforces it).
- **(f) Copy (teacher read, recommendation):** name "Hangar"; captions (nominative, lower case, pack labels): rakieta, łazik księżycowy, stół warsztatowy, skrzynie z częściami, lampa warsztatowa, mata startowa; variants agreed: rakieta/lampa/mata → Naturalna/Słoneczna/Miętowa, łazik/stół → Naturalny/Słoneczny/Miętowy, skrzynie (plural, non-masculine-personal) → Naturalne/Słoneczne/Miętowe (precedent `kitchen-counter`, `kitchen-rack`); task labels (imperative + accusative): "Postaw rakietę", "Postaw łazik", "Postaw stół warsztatowy", "Ustaw skrzynie z częściami", "Postaw lampę" (the sprite is a standing desk lamp, so not "Powieś"), "Połóż matę startową". The pack gives only masculine variant labels (manifest `families`), so the agreed forms are ours: a DESIGN-GAP row, like row 194 for Mostek.

## Detailed Findings

### (a) What adding the Hangar touches

Data (`src/data/`), following the kitchen (S-22) and Mostek (S-28) rows:

| file | symbol | change |
|---|---|---|
| `src/data/rooms.ts` | new `hangarSlots`, `HANGAR: RoomDef`, `ROOMS` | six slots copied from `designs/bystrow-space-base-v2/manifest.json` `rooms.hangar.slots` (x, y, width, height, z, anchor, visibleRect, variants `hangar/hangar-<slot>-<family>`); `scene: { before: 'hangar/before', after: 'hangar/after', shadows: 'hangar/shadows' }`; `decor: []`; tasks stage + 6 slots, costs 6/10/13/14/17/19/21 (D1) |
| `src/data/houses.ts` | `HOUSES['base-1'].rooms` | append `{ room: 'hangar', floor: 0, place: 1 }` |
| `src/data/roomArt.ts` | `ROOM_SCENE_FILES` | row `hangar: { before: 'hangar-before', after: 'hangar-after', shadows: 'hangar-shadows' }` |
| `src/data/pl.ts` | `pl.room.names`, `tasks`, `slots`, `variants` | see (f) |

Manifest geometry checked against the invariants of `tests/roomsData.test.ts` "draws every piece inside the scene, …": every piece's visible rect ends at most at x 1532, y 900 (inside 1920×1080), z values 25/40/20/35/18/5 are distinct, all below `ROOM_LAYOUT.depth.outline` as Mostek's (max 40). A throwaway vitest probe of `unreachableSlots` (`src/core/roomHit.ts`) on the manifest slots with all six bought returned `[]` (box-level, no alpha), so each piece keeps a hold point. Costs 6..21 sit in the test's 5..`MAX_TASK_COST` (21) range, the first (6) within one clean round as for Mostek.

Non-`src` code: `scripts/make-task-art.mjs` names only v1 of the base pack (`SPACE_BASE`, `SPACE`); the plan adds e.g. `SPACE_BASE_V2 = join(ROOT, 'designs/bystrow-space-base-v2')` and a `ROOM_PACKS` row `{ room: 'hangar', pack: SPACE_BASE_V2, scene: ['hangar-before', 'hangar-after', 'hangar-shadows'], decor: [], furniture: ['rocket','rover','workbench','crates','lamp','mat'] × ['natural','sunny','mint'] → 'hangar-<slot>-<v>', recolourBoard: false }`. The kit-existence loop (`for (const dir of [..., ...ROOM_PACKS.map((row) => row.pack)])`) then covers the new root. `recolourBoard: false` per `change.md` (cream `#FFF5DF` corners).

Scenes and core checked for hidden coupling (inspected set: `src/scenes/{HouseScene,RoomScene,TaskScene,UIScene}.ts`, `src/core/{house,houseCells,rooms,celebration}.ts`, `src/ui/widgets/{HouseView,SalonBackdrop}.ts`, `src/main.ts`): every room list comes from `HOUSES` + `ROOMS` through `houseLayout`, `houseRoomList`, `houseRoomIds`, `roomInRenovation`, `nextRoom`; the "Baza" button reads `pl.house.open[savedHouse.id]` and hides only when no `HOUSE_GEOMETRY` exists (`RoomScene.redraw`). `room.thumbnail` is optional (`RoomDef` in `src/core/types.ts`); Mostek has none, so the Hangar needs none (kitchen-room follow-up 4 not fired).

Tests to edit (expected): see Summary (a). Tests that cover the Hangar automatically by iterating `ROOMS`: `tests/bootBudget.test.ts` (`it.each(Object.keys(ROOMS))`), `tests/roomsData.test.ts` invariants, `tests/roomArt.test.ts` "has a scene-file row for every room", "leaves no file … without a table entry", "labels every stand-in in Polish" (the label must not contain `-` or `/`: "łazik księżycowy Naturalny" etc. comply), "weighs at most 1 550 000 bytes per room".

### (b) Boot budget

- `bootRoomArt` (`src/data/roomArt.ts`) returns the current room's entries; `BootScene` queues it (`bootGroups` in `src/core/artHealth.ts`: a returning player boots `room`, a fresh install boots `choice` and no room). Other rooms load at runtime through `roomArtLoader`. Confirmed: only the room in renovation boots.
- Measured (this step; WebP into `/private/tmp/claude-501/-Users-kamilp-Dev-Martynka-urzadza/07d5f77c-b4b1-4d5b-9f64-7590397431a9/scratchpad/hangar`, nothing written to `public/`): `hangar-before` 136 412 B, `hangar-after` 96 556 B, `hangar-shadows` 4 056 B, rocket 29 752–31 550 B, rover 26 112–26 792 B, mat 23 198–24 026 B, workbench 18 616–18 982 B, crates 12 174–12 540 B, lamp 10 670–10 916 B; total 606 452 B for 21 files.
- Per-room boot payloads measured with a throwaway vitest that reused `bootPayloadBytes`'s sum (deleted after): salon 2 092 496 B (41.8 s), kitchen 1 686 870 B (33.7 s), bridge 1 588 236 B (31.8 s), non-room part 889 112 B, limit 48 s. Hangar = 889 112 + 606 452 = 1 495 564 B (29.9 s). The `balance.loader` comment names totals per art addition; the plan may add one clause (data comment, optional).
- Precache grows by about 606 KB (all assets are precached; `vite/config.shared.mjs` globs include webp).

### (c) Cross-section

- `houseCells(g, h, current, doneOf)` (`src/core/houseCells.ts`): a cell with a place whose room is known gets `state` `current` / `done` / `closed` (not reached). With the Hangar row and Mostek in renovation: `['current', 'closed', 'closed', 'closed']` (the existing assertion stays true); after "Dalej": `['done', 'current', 'closed', 'closed']`.
- `HouseScene.render` passes every non-closed cell's room to `roomArtLoader.ensure`; `HouseView.render` captures a miniature per open cell (`captureRoomMiniature`, mode `live` or `drawn` while art is pending). The frame (`house/cell-frame`, gap 199) goes around the `current` cell, so it moves to `ground-right`.
- Base-cross-section follow-up 13 / house-cross-section 4 ("a known room not reached is shown closed") are not fired: no change to `HouseScene`/`HouseView`.

### (d) "Dalej", back-compat and rollback

- In session: last Hangar-less Mostek purchase → `RoomScene` sets `card`, `ensure(cardRooms(listItems()))` loads the Hangar art behind the reveal; the card shows two tiles (Mostek done, Hangar `unlockAfter: 'bridge'`); "Dalej" → `moveAfterDone` sets `currentRoom` `hangar` with `emptyRoomState()`, flushes the save, `ensure`/`refreshHealth('hangar')`.
- After the Hangar is done: `roomInRenovation` returns null → `nextRoom` keeps `hangar`, `movedFrom === null` → `moveAfterDone` returns; the child stays in change mode with "Baza" (D3; gap 196 moves to the Hangar).
- v6 save with Mostek done before S-30: `main.ts` load → `repairCurrentRoom` (current `bridge` is known) → `mergeHouse` (data order: bridge, hangar) → `nextRoom` moves to `hangar`, `roomRepaired = true`. The celebration is not shown again (card only at purchase). No frozen fixture holds a done Mostek today (`tests/fixtures/save-v6.json` has `bridge.tasksDone` 2); the plan adds e.g. `tests/fixtures/save-v6-bridge-done.json` and a test through `tests/fixtureLoadPath.test.ts`'s path plus `mergeHouse`/`nextRoom` (FR-049-style proof). An e2e seam for it would add code in `src/testing/e2eHook.ts` and a marker in `vite/e2eHookGuard.mjs`; not needed, the e2e #16 path (buy Mostek in session, "Dalej", reload) already reaches the Hangar.
- Rollback to the S-29 build with a save whose `currentRoom` is `hangar`: `houseRoomIds(base-1 [bridge])` lacks `hangar` → `repairCurrentRoom` sends it to `savedLayout.rooms[0].room` = `bridge`; `mergeHouse` keeps the saved `hangar` cell as an extra (console warn); `roomInRenovation` skips the unknown `hangar` and finds Mostek done → stays `bridge`; `roomStateProblems` reports `rooms.hangar` as `unknown-room`, which `parentVisible` hides; `HouseScene` shows the Hangar cell closed (`doneOf` null). Nothing is lost; no `deploy/README.md` line is needed.
- Save format: `SAVE_VERSION` 6 (`src/core/save.ts`); `house`, `rooms`, `currentRoom` already carry everything. No migration (D4 confirmed).

### (e) Deploy smoke and "Obrazki"

- `scripts/check-deploy.ts`: `precacheCovers('room pictures', precache, ROOM_ART.map((a) => a.url))` and the HEAD of every precache entry (`precacheServed`) cover the Hangar files once they are in `ROOMS` and `public/`. `roomArtCheck` is dead in the smoke (defined in `scripts/deploy-check/parse.ts`, called only by `tests/deployCheck.test.ts`); not this slice's concern.
- "Obrazki": room line via `REGISTRY_KEYS.roomArtHealth` for the current room (`roomHealthOf`), labels of missing pieces from `ROOM_ART` (`UIScene` filter on `entry.label`), capped by `balance.artHealth.labelCap`. A visited room is not judged. No change.

### (f) Polish copy (teacher read)

| key | text | note |
|---|---|---|
| `pl.room.names.hangar` | Hangar | manifest `rooms.hangar.label` |
| `pl.room.slots['hangar-rocket']` | rakieta | f. sg. |
| `…['hangar-rover']` | łazik księżycowy | m. inanimate sg. |
| `…['hangar-workbench']` | stół warsztatowy | m. sg.; roadmap's "stół z narzędziami" replaced by the pack label (D5) |
| `…['hangar-crates']` | skrzynie z częściami | pl. non-masc-personal |
| `…['hangar-lamp']` | lampa warsztatowa | f. sg. |
| `…['hangar-mat']` | mata startowa | f. sg. |
| variants | Naturalna/Słoneczna/Miętowa (rocket, lamp, mat); Naturalny/… (rover, workbench); Naturalne/… (crates) | |
| tasks | Postaw rakietę · Postaw łazik · Postaw stół warsztatowy · Ustaw skrzynie z częściami · Postaw lampę · Połóż matę startową | imperative + accusative; longest 26 characters vs Mostek's 24 ("Postaw regał z planetami"), fitted by `labelScale` in `RoomTaskButton` |

Task label keys (camelCase, as Mostek): e.g. `placeRocket`, `placeRover`, `placeWorkbench`, `stackCrates`, `placeWorkLamp`, `layLaunchMat`. Avoid the `minigames` word list (`src/data/minigames.ts` uses salon captions only; unaffected).

## Code References

- `src/data/houses.ts` `HOUSES`, `HOUSE_GEOMETRY['base-1']` — base room list and cells
- `src/data/rooms.ts` `bridgeSlots`, `BRIDGE`, `ROOMS` — model for `HANGAR`
- `src/data/roomArt.ts` `ROOM_SCENE_FILES`, `roomArt`, `ROOM_ART`, `bootRoomArt`
- `src/data/pl.ts` `pl.room.names/tasks/slots/variants`
- `src/core/house.ts` `houseRoomList`, `roomInRenovation`, `nextRoom`, `mergeHouse`, `houseLayout`, `houseRoomIds`
- `src/core/houseCells.ts` `houseCells`, `houseArtKeys`
- `src/core/rooms.ts` `repairCurrentRoom`, `roomStateProblems`, `parentVisible`
- `src/scenes/RoomScene.ts` `moveAfterDone`, `listItems`, `redraw`, purchase branch setting `card`
- `src/scenes/HouseScene.ts` `render` (ensure open rooms), `src/ui/widgets/HouseView.ts` `render`
- `src/main.ts` load branch (`repairCurrentRoom`, `mergeHouse`, `nextRoom`)
- `scripts/make-task-art.mjs` `SPACE_BASE`, `ROOM_PACKS`, `convert`
- `scripts/check-deploy.ts` `precacheCovers('room pictures', …)`; `scripts/deploy-check/parse.ts` `roomArtCheck`
- `tests/bootBudget.test.ts` `bootPayloadBytes`, `HEADROOM_MS`; `src/data/balance.ts` `loader.totalMs`
- `tests/roomsData.test.ts`, `tests/roomArt.test.ts`, `tests/houseCells.test.ts`, `tests/fixtureLoadPath.test.ts`, `tests/e2e/base-cross-section.spec.ts` #16

## Architecture Insights

The "room as data" contract (F-04, S-22) holds for the base: S-28 and S-29 added no Mostek-specific branch in scenes or core; every behaviour (card tiles, "Dalej", cell state, art loading, budget, smoke) is derived from `HOUSES` + `ROOMS` + `ROOM_SCENE_FILES`. The only places a third base module would also touch are the same four data files, the art script row and the tests that enumerate rooms by name.

## Historical Context (from prior changes)

- `context/archive/2026-10-31-kitchen-room/` — S-22 added the kitchen with no version bump; finished salon opens in the kitchen at load (same mechanism as (d)).
- `context/archive/2026-11-01-base-cross-section/research.md` — S-29 left `ground-right` closed for the Hangar; D4 last-module behaviour; follow-up 5 (gap 196) fires here.
- `context/archive/2026-10-31-first-building-choice/` — Mostek costs and gap 194 (Mostek wording ours).

## Related Research

- `context/archive/2026-11-01-base-cross-section/research.md`

## Open Questions

- None blocking. Product choices left to the plan, with recommendations: task label wording (above), whether the `balance.loader` comment gets a Hangar clause, whether to add a Hangar case to `tests/roomHit.test.ts` `unreachableSlots` (recommended, cheap). DESIGN-GAPs: new row 201 (Hangar wording ours, agreed variant forms), row 196 edited (last module is now the Hangar).
