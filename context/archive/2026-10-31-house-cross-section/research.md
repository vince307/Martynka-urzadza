---
date: 2026-10-31T09:09:04+0100
researcher: Claude (autonomous run 2026-10-31-house-cross-section, /10x-research step)
git_commit: edfa43cc72be90750f150cd4caa8a124a83391a4
branch: feat/house-cross-section
repository: Martynka-urzadza
topic: "S-23 house-cross-section: scene hosting, live miniatures, cell geometry, runtime house art, e2e hook, boot budget"
tags: [research, house, RoomScene, scenes, drawRoomMiniature, SalonBackdrop, roomArtLoader, e2eHook, art-pipeline]
status: complete
last_updated: 2026-10-31
last_updated_by: Claude (autonomous run)
---

# Research: S-23 `house-cross-section`

**Date**: 2026-10-31T09:09:04+0100
**Researcher**: Claude (autonomous run, /10x-research step)
**Git Commit**: edfa43c (branch head = `main` 112f158 + the change-identity commit)
**Branch**: feat/house-cross-section
**Repository**: Martynka-urzadza

No lessons file exists in `context/foundation/` (checked), so no lesson is applied. Three read-only workers covered
(1) miniatures, (2) scene graph and navigation, (3) art pipeline, loader, budget and e2e hook; the main agent re-checked
the load-bearing claims in source (anchors below) and ran `npx vitest run tests/bootBudget.test.ts` (2 passed).

## Research Question

From `change.md` (decisions D1-D11, the open questions in `handoff.md` § 5) and the step prompt:

1. How is a room miniature drawn from live layers today (`RoomDoneCard`, `drawRoomMiniature`, `SalonBackdrop` capture),
   and how does it behave under Canvas and under reduced motion?
2. How should the scene graph host the house: a new scene or a layer of `RoomScene`; `scene.switch` rules, `UIScene` HUD,
   the input suspender; how `visiting` is set from a house tap and cleared on the way back (FR-039)?
3. How do the pack's cell rectangles map to `src/data/houses.ts` floor × place; how are closed cells represented?
4. How is the house art loaded lazily through the existing runtime loader?
5. What changes in the e2e hook?
6. What is the boot budget situation?

## Summary

- **Miniatures.** `drawRoomMiniature` (`src/ui/widgets/RoomView.ts`) draws any `RoomDef` + `RoomState` from whatever
  textures are in the cache, as images placed at `left + x·scale, top + y·scale` plus stand-ins on a passed Graphics. It
  clips nothing: the salon curtains slot sits at `y: -70` (`src/data/rooms.ts`), so at 19/60 a live miniature would poke
  about 22 px above its cell. Of its two consumers, `RoomDoneCard.drawRoomTile` uses live objects and `SalonBackdrop.render`
  captures into a `DynamicTexture` drawn at (0,0) — the texture bounds clip on both renderers. **Recommendation: capture
  each open cell into a 608×342 DynamicTexture the `SalonBackdrop` way, with the stand-in Graphics included in the
  holder.** No miniature has a tween today; Canvas gives ungraded worn pieces (`applyWornGrade` records `worn: 'ungraded'`).
- **Hosting.** Both options work; **recommendation: a new `HouseScene`** placed before `UIScene` in `src/main.ts`, entered
  by `scene.switch(SCENE_KEYS.house)` from the room and left by `scene.switch(SCENE_KEYS.room, { visit: id })` (cell tap)
  or `scene.switch(SCENE_KEYS.room)` (back). The room's existing `onSleep`/wake `refresh` already null `visiting`, which
  keeps FR-039 ("Do pokoju" always opens `currentRoom`); only the wake handler learns to read the optional data. This is
  the repo's first scene-data hand-off (none exists today) — the plan decides; the RoomScene-layer alternative is costed
  below.
- **Cells.** `HouseState`/`HouseRoomPlace` carry `floor`/`place`; `HOUSES` lists only salon (0,0) and kitchen (0,1). The
  manifest's four cells map `col` → `place`. Geometry belongs in a new data table keyed by house id; a closed cell is a
  geometry cell with no `HouseRoomPlace` at its (floor, place). No save field, no migration (save stays v5).
- **Art + loader.** Three pack files → `public/assets/house/*.webp` through a new loop in `scripts/make-task-art.mjs`
  (59 118 B measured at the `/10x-new` step); a new `HOUSE_ART` table (not `UI_ART`, which is boot-loaded and judged by
  "Obrazki"); precached automatically by the `webp` glob. `createRoomArtLoader` hardcodes `REGISTRY_KEYS.roomLoad`,
  `REGISTRY_KEYS.roomArtHealth` and the `'room'` log table, so a second instance would clobber room records: the house
  needs a generic sibling or a parameterised loader, which fires kitchen follow-ups 3, 14, 15.
- **e2e.** Hook `screen` is decided by `inRoom()`; a house scene needs `inHouse()`, `screen: 'house'`, a house snapshot and
  targets; `visitButton` target, `RoomScene.visitTarget()`, `tests/roomVisit.test.ts` and the visit test in
  `tests/e2e/kitchen-room.spec.ts` move to the house path.
- **Boot budget.** Untouched by runtime loading. `tests/bootBudget.test.ts` passes (2 tests, this step); a worker's
  directory-sum estimate puts the worst boot (salon) at ≈41.7 s against the 48 s limit (`balance.loader.totalMs` 50 000 −
  `HEADROOM_MS` 2000), so even a boot load of the 59 KB house art (≈1.2 s) would fit.

## Detailed Findings

### 1. Miniatures from live layers

- `drawRoomMiniature(scene, g, room, state, left, top, scale, depth): GameObjects.Image[]` (`src/ui/widgets/RoomView.ts`)
  draws the list from `miniaturePieces(room, state)`: scene `after` once the stage is done, else `before` + `shadows` +
  the `wornPieces` set (`src/core/rooms.ts`); `shadows` when `roomDone`; decor after the stage; visible slots by
  `shownVariant` sorted by `z`. Images use `setOrigin(0,0)` + `setDisplaySize`, depth `depth + index/1000`.
- Missing textures (this path): a missing scene picture becomes a wall/floor fill on `g` (split at
  `ROOM_LAYOUT.standIn.wallBottom`); alpha-0 pieces (shadows, worn) are skipped; other pieces become `drawStandIn` boxes on
  `g` at `g`'s depth (kitchen follow-up 10 "stand-in depth").
- It differs from `RoomView.render`: no contact shadows (`contactShadowPieces` only in `RoomView.drawContactShadows`), no
  Canvas wash on the worn set, no captions.
- No clip or mask: curtains slot `y: -70`, height 695; rug slot bottom at 1081 (`src/data/rooms.ts`). `holdPoint`
  (`src/core/roomHit.ts`) clamps hit-testing only. Open follow-ups: salon-extra-slots F2, salon-style 28, kitchen 10.
- Consumers:
  - `RoomDoneCard.drawRoomTile` (`src/ui/widgets/RoomDoneCard.ts`): live objects, `thumbScale` 0.13, mode from
    `miniatureMode` (`src/core/artPick.ts`: `live | thumbnail | drawn`), `recordFallback(scene, 'miniature', mode)` only when
    not live and not `tileLoading`. No miniature tween; the only motion is `starBurst`, 0 under reduced motion
    (`celebrationView`).
  - `SalonBackdrop.render` (`src/ui/widgets/SalonBackdrop.ts`): `drawRoomMiniature(..., 0, 0, scale, 0)` into an off-list
    container, blur only on WebGL (`enableFilters().filters?.internal.addBlur`), `textures.addDynamicTexture`, `dt.draw(holder)`,
    `dt.render()`, comment: "only (0, 0) is the same on both renderers". The Graphics `g` is not drawn into the texture, so
    stand-ins are dropped; `backdropMode` (`src/core/backdrop.ts`) falls back to `plain` when the scene picture is missing.
    `TaskScene` and `WelcomeScene` redraw it on `Renderer.Events.RESTORE_WEBGL` (verified: both scenes register the listener).
- Masks: no `setMask`/`GeometryMask`/mask filter anywhere in `src/` (worker grep); Phaser 4 masks are filters, WebGL-only,
  so they would not clip under Canvas, which the repo supports (`tests/e2e/canvas-renderer.spec.ts`). `setCrop` is used in
  `VariantPanel.ts` and works on both renderers.
- Cost per miniature (current `src/data/rooms.ts` rows): salon before the stage 12 images, done 14; kitchen done 8. Two
  live miniatures + shell ≈ 25 images — cheap either way; a before-stage salon carries 10 filtered (worn) images on WebGL.
- Recommendation for the plan: **capture per cell** (608×342 `DynamicTexture` = 1920×1080 at 19/60 exactly), off-list
  holder with the Graphics at the lowest depth so wall/floor and stand-in boxes survive, one image per cell, re-capture on
  house open/wake, on `REGISTRY_KEYS.roomLoad` change and on `RESTORE_WEBGL`. Clips curtains and rug on both renderers and
  leaves `drawRoomMiniature` untouched (kitchen follow-up 10 stays unfired). Alternative: live objects + `setCrop` on the
  curtains only — touches `drawRoomMiniature`, fires follow-up 10. Uncertainty: `dt.draw` of a Graphics plus filtered
  images under Canvas was not run; the existing comment advises drawing at (0,0) only, which the per-cell texture does.
- Reduced motion: nothing to stop unless the plan adds a zoom/transition; any such tween goes behind `prefersReducedMotion()`
  (`src/ui/motion.ts`) like every other (`tests/reducedMotionWiring.test.ts`).

### 2. Scene graph and navigation

- `SCENE_KEYS` = boot, welcome, task, room, ui and `GAME_EVENTS` = toRoom, starLanded, parentStage
  (`src/data/layout.ts`). Scene list `[BootScene, WelcomeScene, TaskScene, RoomScene, UIScene]` (`src/main.ts`, verified);
  nothing calls `bringToTop`, so `UIScene` is on top only by being last — a new scene must sit before it.
- Notebook → room: `TaskScene` listens to `GAME_EVENTS.toRoom` on `game.events`, cancels narration/flying stars, sets
  registry `narration`, `roomSwitch`, `hudTitle` to null/false and calls `scene.switch(SCENE_KEYS.room)`. Room → notebook:
  the `PageButton` (`pl.room.resume`) in `RoomScene.create` calls `scene.switch(SCENE_KEYS.task)` (verified).
- `UIScene` decides nothing; it reads registry keys (`roomSwitch`, `narration`, `hudTitle`, `stars`). In the room: counter,
  gear, speaker when `narration` is non-null; the room switch is hidden. A house scene must set `narration` itself (null or
  a house line) on wake.
- `RoomScene` (verified in source): `visiting` is a private field; `resolve()` reads `visiting ?? currentRoom ?? FIRST_ROOM`;
  the wake `refresh` and `onSleep` both set `visiting = null` and close panel, mode and card; `visit()` uses `visitTarget`
  (`src/core/roomVisit.ts`) and `roomArtLoader.ensure([target])`. The visit button is computed as
  `blocked ? null : visitTarget(...)` where `blocked` = panel open or card; change mode does not hide it.
- Kitchen follow-up 16 (`context/archive/2026-10-31-kitchen-room/follow-ups/review-fixes.md`): `onSleep`/`refresh` drop a
  drawn card without `moveAfterDone`; trigger "a way out that stays visible while the card is up". The house button must
  stay under the same `blocked` rule (then the trigger does not fire).
- Input suspender (`src/core/inputSuspend.ts`): only DOM overlays hold it (settings/gate in `UIScene`, Welcome dialogs,
  `saveRefusedCard`, install hint, error boundary). A Phaser-only house screen needs none.
- Scene data: no `scene.switch(key, data)` precedent in the repo (worker grep). Phaser 4.2.1 `ScenePlugin.switch(key, data)`
  → `SceneManager.switch` → `wake(to, data)`/`start(to, data)`, so the `'wake'` handler receives `(sys, data)` (source read,
  not run).
- Option (a) — new `HouseScene` (recommended): `SCENE_KEYS.house`, scene list entry before `UIScene`; room → house sleeps
  the room (its `onSleep` already nulls `visiting` and closes everything); house → room with `{ visit: id }` for a cell tap
  or no data for back; `RoomScene`'s wake `refresh` sets `visiting` from data (null when absent or equal to `currentRoom`).
  The notebook's `toRoom` wakes the room without data → `currentRoom` (FR-039 holds by construction). Impacts:
  `tests/roomVisitWiring.test.ts` "wake refresh ends a visit" is rewritten to "a wake without data ends a visit"; hook
  `inRoom()` is false in the house; no new autosave flush (the house writes nothing). Pros: the room's hold zone, panel and
  buttons are asleep for free; `RoomScene` (581 lines) does not grow.
- Option (b) — layer inside `RoomScene`: no new key or data hand-off; `visiting` stays private; needs a `house` flag joining
  `blocked`, hold zone off, room buttons hidden, a full-screen background over the room (the shell's exterior is
  transparent), `snapshot().house`, and the hook's `screen` derived from the snapshot. Pros: no scene-data precedent.
- Archived kitchen research/plan state no hosting intention for S-23 (they only say S-23 replaces the visit button and draws
  done rooms through `roomArtLoader`).

### 3. Cell geometry and closed cells

- Types: `HouseRoomPlace { room, floor, place }`, `HouseState { id, rooms }` (`src/core/types.ts`). `HOUSES`
  (`src/data/houses.ts`, verified): `house-1` with salon (0,0) and kitchen (0,1); no closed cells.
- `src/core/house.ts`: `houseLayout` returns the data house with the saved id (else `first`); `houseRoomList` lists known
  rooms and turns the first unknown into a teaser; `roomInRenovation`, `nextRoom`, `mergeHouse`, `houseEqual`.
- Manifest `houses.house-1.cells`: ground-left (floor 0, col 0, 252/636), ground-right (0, 1, 1060/636), upper-left
  (1, 0, 252/236), upper-right (1, 1, 1060/236), each 608×342; `col` = `place` (salon ground-left, kitchen ground-right,
  as in `screenshots/house-with-dioramas.png` and `docs/designer-brief-m03.md` "Układ domów").
- Recommendation: a data table keyed by house id (in `src/data/houses.ts` or a sibling, plus shell keys, `cellFill`,
  frame offset 16, stairwell, safe zones), cells by (floor, place); open cell = a `HouseRoomPlace` at that (floor, place) whose
  room is known; closed cell = a geometry cell with none. A placeholder room id would be wrong (`mergeHouse`/`houseRoomList`
  treat it as unknown and the save would carry it). A pure core function (e.g. `houseCells(house, geometry, known, states)`)
  gives open/closed/in-renovation per cell for unit tests. Save stays v5 (nothing new persisted; geometry is data).
- Copy: `pl.room.done.teaser` 'Wkrótce' exists; the preview draws it at 32 px, weight 650, `#FFF5DF`, shadow `#245C59`
  over `cell-closed.png` (`designs/martynka-house-street-v1/preview.html`). Background behind the shell: CSS
  `linear-gradient(#e7f4f4, #eef4e1)` in the preview, not in the export — the game needs tokens for it (gradient code lives
  only in `kitDraw.ts` per notebook-polish, so a flat fill or a `kitDraw` helper is a plan choice).
- Controls: the manifest's `safeZones.buttons` band is y 1010-1080 = 70 px, below `MIN_TOUCH_TARGET` 96 (`src/data/layout.ts`),
  so a back button cannot fit inside it; the clear areas are the side margins outside the shell (left of x≈200, the
  bottom-left corner below the foundation) — a DESIGN-GAP row. The room view's house button can take
  `ROOM_LAYOUT.visitButton` (1622,172, 256×104), under the star safe zone (1560,0,360×120).

### 4. House art and runtime loading

- Art script `scripts/make-task-art.mjs`: kit constants (`KIT`, `SALON_V2`, `LOCATIONS_V2`, `FOX`), `ROOM_PACKS` →
  `ROOM_JOBS`, `UI_JOBS`, `FOX_POSES`; `convert()` = `cwebp -quiet [-resize] -q 85 -alpha_q 100 -m 6`. A house root
  (`designs/martynka-house-street-v1`) with a 3-file loop at native size, output `public/assets/house/`, kit-existence check
  and total count. Python is already called with `-I` (`execFileSync('python3', ['-I', ...])`) — audit-art-renderer
  follow-up 2 is stale.
- Tables: `src/data/roomArt.ts` (`ROOM_SCENE_FILES`, `roomArt`, `ROOM_ART`, `bootRoomArt`), `src/data/uiArt.ts` (`UI_ART`,
  boot-loaded, judged by "Obrazki" through `uiArtHealth`), `tests/roomArt.test.ts` pins room counts. Recommendation: a new
  `HOUSE_ART` table (e.g. `src/data/houseArt.ts`) with a sibling `tests/houseArt.test.ts` (orphan files, sizes, keys
  disjoint from task/room/ui keys); keys `house/<file>`, files `assets/house/house-1-shell.webp`, `cell-closed.webp`,
  `cell-frame.webp` (`Martynka-urzadza.md` § 10 has no house rule; the code already uses pack file names).
- Deploy smoke: add `precacheCovers('house pictures', …)` in `scripts/check-deploy.ts` beside the other tables
  (`scripts/deploy-check/parse.ts` `precacheCovers`). Precache: `vite/config.shared.mjs` `globPatterns` includes `webp`, so
  the files are precached without config change.
- Loader `src/ui/roomArtLoader.ts` (verified): `createRoomArtLoader(game, { disabled, entriesOf? })` → `attachLoader`,
  `ensure`, `pending`, `refreshHealth`; it writes `REGISTRY_KEYS.roomLoad` and `REGISTRY_KEYS.roomArtHealth` and logs with
  `loadErrorLine('room', …)` — all hardcoded, so a second instance for the house would overwrite the room records. Options:
  a parameterised loader (registry keys + table name as options) or a small sibling; either way editing the file fires
  kitchen follow-ups 3 (`wrongSizes` skipped at runtime), 14 (catch-path `detach` strips other rooms' listeners) and 15
  (repeated `once('complete')`, verified two `once('complete'` sites) — small, fix in the same change.
- Room miniatures in the house: the current room is boot-loaded (`bootRoomArt`); other known rooms go through
  `roomArtLoader.ensure(rooms)` on house open; until `roomLoad.settled` lists a room, its cell shows the drawn stand-in and
  is re-captured on `changedata-roomLoad`.
- Art health: `src/core/artHealth.ts` `ArtTable` = task|room|ui|sound. Kitchen follow-up 2 kept runtime-loaded art out of
  "Obrazki"; for the house the cheapest consistent path is a fallback record in `REGISTRY_KEYS.artFallbacks`
  (`recordFallback`, e.g. `house: 'drawn'`) and a seam `?e2eArt=house` inside the existing `e2eArt` marker; a `'house'`
  `ArtTable` + "Obrazki" line is the alternative (fires kitchen follow-up 2).
- SW follow-up (kitchen 6 / rooms-as-data 6): fires because the precache set grows. `registerServiceWorker`
  (`src/pwa/registerServiceWorker.ts`) already warns on registration and update failures; `trackStates` maps `redundant`
  to `install-failed` (`src/core/swStatus.ts` `stepSw`) without a `console.warn` — a one-line warn there closes it.

### 5. e2e hook

- `src/testing/e2eHook.ts`: `inRoom = () => game.scene.isActive(SCENE_KEYS.room)`; `screen = inRoom() ? 'room' : unlock |
  summary | task` (verified). Under option (a) the house needs `inHouse()`, `screen: 'house'` checked before the round
  screens, `house` view snapshot (per cell: id, floor, place, room or null, state open/closed/current, miniature mode,
  loaded) and targets (`houseButton` in the room, `houseCells`, `houseBack`); the `inRoom() ? … : null` targets stay.
- Remove `targets.visitButton` (`room().visitTarget()`), `RoomSnapshot.visiting` may stay (runtime field) and is useful.
  `tests/e2e/support/hook.ts`: `Targets.visitButton?` goes; add the house targets; `tapTarget` serves them.
- Tests that move: `tests/roomVisit.test.ts` (whole file, with `visitTarget`), `tests/roomVisitWiring.test.ts` (wake/sleep
  reset, "visit tap ensures"), `tests/layout.test.ts` (`ROOM_TOUCH_TARGETS.visitButton` overlap/size → house button and
  house back), `tests/e2e/kitchen-room.spec.ts` test "#16 S-22 FR-019 from the kitchen the finished salon opens for free
  changes and \"Do pokoju\" returns to the kitchen" (tap house → salon cell instead of `visitButton`; its "Do pokoju" and
  reload asserts stay).
- Art seams: `E2EArtSeam` = missing|corrupt|room|stall|stallall|ui; `vite/e2eHookGuard.mjs` markers include `e2eArt`;
  a `house` value inside `e2eArt` needs no new marker.

### 6. Boot budget

- `tests/bootBudget.test.ts`: sums on-disk sizes of `TASK_ART + bootRoomArt(room) + UI_ART` + font + boot sounds, divides
  by `COLD_START_BYTES_PER_S` 50 000 and compares with `(balance.loader.totalMs − HEADROOM_MS)/1000` = 48 s, once per room.
  This step: 2 passed. Worker estimate (directory sums, not the test's own output): salon boot ≈2 085 907 B ≈41.7 s,
  kitchen ≈33.6 s. Runtime loading of the house leaves it unchanged; a boot load (+59 118 B ≈1.2 s) would also fit.

## Code References

- `src/ui/widgets/RoomView.ts` `drawRoomMiniature`, `miniaturePieces`, `RoomView.drawContactShadows`
- `src/ui/widgets/SalonBackdrop.ts` `render` (DynamicTexture capture at (0,0)); `src/core/backdrop.ts` `backdropMode`
- `src/ui/widgets/RoomDoneCard.ts` `drawRoomTile`; `src/core/artPick.ts` `miniatureMode`, `noteFallback`; `src/ui/artFallbacks.ts` `recordFallback`
- `src/ui/wornGrade.ts` `applyWornGrade`; `src/ui/motion.ts` `prefersReducedMotion`
- `src/scenes/RoomScene.ts` `create` (`refresh`, `onSleep`, `PageButton` resume), `resolve`, `visit`, `visitTarget`, `moveAfterDone`, `snapshot`
- `src/scenes/TaskScene.ts` `GAME_EVENTS.toRoom` listener, `RESTORE_WEBGL` listener; `src/scenes/WelcomeScene.ts` same
- `src/main.ts` scene list, `createRoomArtLoader`; `src/data/layout.ts` `SCENE_KEYS`, `GAME_EVENTS`, `REGISTRY_KEYS`, `ROOM_LAYOUT.visitButton`, `ROOM_TOUCH_TARGETS`, `MIN_TOUCH_TARGET`
- `src/core/roomVisit.ts` `visitTarget`; `src/core/house.ts` `houseLayout`, `houseRoomList`, `roomInRenovation`, `nextRoom`, `mergeHouse`
- `src/data/houses.ts` `HOUSES`, `FIRST_HOUSE`; `src/core/types.ts` `HouseState`, `HouseRoomPlace`
- `src/ui/roomArtLoader.ts` `createRoomArtLoader` (`ensure`, `publish`, `writeHealth`); `src/core/artHealth.ts` `ArtTable`, `loadErrorLine`, `wrongSizes`
- `scripts/make-task-art.mjs` `ROOM_PACKS`, `UI_JOBS`, `FOX_POSES`, `convert`; `scripts/check-deploy.ts` / `scripts/deploy-check/parse.ts` `precacheCovers`
- `src/pwa/registerServiceWorker.ts` `trackStates`; `src/core/swStatus.ts` `stepSw`
- `src/testing/e2eHook.ts` `inRoom`, `screen`, `targets.visitButton`, `e2eArt`; `tests/e2e/support/hook.ts` `Targets`, `tapTarget`; `vite/e2eHookGuard.mjs` `E2E_HOOK_MARKERS`
- `tests/bootBudget.test.ts`, `tests/roomVisit.test.ts`, `tests/roomVisitWiring.test.ts`, `tests/layout.test.ts`, `tests/e2e/kitchen-room.spec.ts`, `tests/roomArt.test.ts`, `tests/uiArt.test.ts`
- `designs/martynka-house-street-v1/manifest.json`, `README.md` § Integracja, `preview.html`, `screenshots/house-with-dioramas.png`

## Architecture Insights

- Navigation safety comes from `RoomScene` resetting `visiting` on every sleep and wake; a house scene preserves that
  invariant and only adds "wake with data may set it". FR-039 holds by construction because the notebook path never passes data.
- Capturing into a texture is the repo's one renderer-neutral clip; masks are WebGL-only filters in Phaser 4.
- The runtime loader is room-specific in its registry writes, not in its loading logic; parameterising it is the smallest
  generalisation.

## Historical Context (from prior changes)

- `context/archive/2026-10-31-kitchen-room/research.md` and `plan.md`: boot loads only the room in renovation; other rooms
  through `roomArtLoader`; "S-23 (cross-section) will need done rooms drawn again" — supported.
- Kitchen follow-ups 1 (replace visit button, Trigger S-23), 2, 3, 6, 10, 14, 15, 16 — read in
  `context/archive/2026-10-31-kitchen-room/follow-ups/review-fixes.md`; statuses as in the findings above.
- `change.md` claim "boot loads one room + pack art + fox + sounds; 2 s headroom" — supported (test passes, constants read).
- `change.md` claim "audit-art-renderer 2 already fixed (`-I`)" — supported.
- PRD Open Question 13 "Miniatury pokoi w przekroju rysuje gra z żywych warstw" (`context/foundation/prd.md`) — supported
  as the direction; the capture is drawn from live layers at open time.

## Related Research

- `context/archive/2026-10-31-kitchen-room/research.md`; `context/archive/2026-10-30-rooms-as-data/research.md`.

## Open Questions (for `/10x-plan`)

1. Hosting: new `HouseScene` with scene-data hand-off (recommended) vs a layer of `RoomScene`.
2. Miniature: per-cell DynamicTexture capture (recommended) vs live objects + `setCrop` (fires kitchen follow-up 10).
3. Loader: parameterise `createRoomArtLoader` vs a sibling; fix kitchen follow-ups 3/14/15 in either case.
4. House art health: `artFallbacks` record (recommended, no "Obrazki" line) vs a `'house'` `ArtTable`.
5. Back button placement outside the 70 px button band (DESIGN-GAP), house-view background token (flat vs `kitDraw`
   gradient), frame use on touch (marks the room in renovation, per change.md).
6. Whether the house view speaks a line (`narration`) — PRD silent; default null (speaker hidden).
7. PRD FR-033 leaves "which closed room opens next" to the plan; scope.md fixed it to data only (D3) — no PRD conflict.
