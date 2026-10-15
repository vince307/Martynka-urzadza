---
date: 2026-10-15T16:55:02+0200
researcher: Claude (autonomous run 2026-10-15-s16a-salon-art, research step)
git_commit: 87d331d
branch: feat/final-art-salon
repository: Martynka-urzadza
topic: "S-16a final-art-salon: salon from martynka-expansion-v1 (background stage + 6 furniture slots), live-save remap at v2, art pipeline and precache, loading screen, animations"
tags: [research, rooms, save, art, phaser4, pwa, roomscene, boot]
status: complete
last_updated: 2026-10-15
last_updated_by: Claude (autonomous research step)
---

# Research: S-16a `final-art-salon`

**Date**: 2026-10-15T16:55:02+0200
**Researcher**: Claude (autonomous research step)
**Git Commit**: 87d331d
**Branch**: feat/final-art-salon
**Repository**: Martynka-urzadza

## Research Question

Derived from `change.md` (roadmap corrections, `## Migration expected?`, triggered follow-ups) and `handoff.md` §5:
how does a background **stage** task fit the room model, panel and scene; how are live saves holding the 10-slot salon
remapped at load while the save format stays v2 (and how do import preview, export, `roomDone` and the room-list card
react); what do the salon layers weigh as WebP with the existing `npm run art` settings and what does that do to the
precache and GPU memory; how should Phaser 4 load, layer, hit-test and animate large alpha images; what the loading
screen can draw; which design sources bind the views and which copy is missing.

## Summary

1. **Stage task.** `RoomTaskDef.slot` is required and `purchase` (`src/core/rooms.ts`) writes `chosen[task.slot]` and
   rejects a variant outside 0–2; `stepPanel` (`src/core/variantPanel.ts`) opens the buy panel on every `open`, and
   `RoomScene.dispatch`/`celebrate`/`redraw` assume `bought.slot`, `bought.variant` and `SALON_PLACEHOLDERS[slot]`. A
   stage needs a typed task union (`kind: 'stage' | 'slot'`), a no-variant purchase path that only increments
   `tasksDone`, and a stage branch in `stepPanel` and the scene. Save validation is unaffected: `validRoom`
   (`src/core/save.ts`) checks only `tasksDone` as a count ≥ 0 and `chosen` values in {0,1,2} with any key, and never
   sees `RoomDef`.
2. **Who reads what.** "Done" is read from `tasksDone` against `tasks.length` on every inspected path (`currentTask`,
   `roomDone`, `roomsListView`, `saveSummary`, `TaskScene` next-cost). `chosen` is read as "what is drawn/furnished"
   (`slotAt`, `holdPoint`, `stepPanel` change branch, `RoomView.render`, `RoomScene.slotTargets`/`snapshot`). No
   inspected reader treats `chosen` as the done list, so change.md decision 2 (stage state only from `tasksDone`) holds.
3. **Remap at v2 is possible.** `RoomState` keeps its shape; a pure, idempotent `remapLegacySalon` called in
   `src/main.ts` right after `repairCurrentRoom` (branch `outcome.kind === 'loaded'`) suffices. Marker: a key of
   `chosen` outside the new slot ids (an old salon with `tasksDone ≥ 1` always holds `floor`, the first old task's
   slot); the remap must drop legacy keys so a second run is a no-op. No frozen fixture contains `salon` (all four hold
   `living` only), so the fixtures stay byte-identical and the remap never fires on them.
4. **Done card after a remap.** "Pokój gotowy!" is decided only in `RoomScene.dispatch` on a purchase
   (`card`/`cardDrawn` are scene fields, nothing persisted). A remap that completes the room at load does **not**
   re-show the card; the room opens in the done state with "Zmień wygląd", and the teaser tile unlocks via `roomDone`.
5. **Import/export.** Export (`exportFileText` with `saver.current()`) and the "Teraz" summary read the registry, i.e.
   the **repaired** state. Import preview (`parseImport` → `saveSummary`) sees the **raw** decoded state: an old salon
   with `tasksDone` 10 would show "7 z 7" (clamped by `Math.min`), and an old `tasksDone` 3 would show "3 z 7" although
   the remap gives a different number. The remap therefore also belongs in the import preview path (or in
   `saveSummary`), as change.md says.
6. **Art weight.** With the script's settings (`-q 85 -alpha_q 100 -m 6`) at the pack's full resolution the 26 salon
   files weigh **1 233 242 B (≈ 1,23 MB)**, matching the inventory's 1,2 MB; at half resolution 475 260 B; at q 75 full
   size 973 520 B. `furnishings-before` alone is 288 634 B. Today's `dist/` (stale build) is 2 416 KB, the Workbox per-file
   limit is 10 MB: precache stays ≈ 3,7 MB. Recommendation: full resolution (the scene is drawn 1:1 in the 1920×1080
   game space and a retina iPad shows ≈ 2048 device px), loose WebP in `public/assets/rooms/salon/`, no atlas.
7. **GPU memory** (decoded RGBA, computed from the manifest sizes): 4 full-screen layers ≈ 33,2 MB + 18 variants and
   4 decorations ≈ 25,6 MB = **≈ 59 MB** if all are resident (the Phaser agent's 250 MB figure assumed 30 full-screen
   textures; it does not apply). Acceptable; trimming `shadows` to its alpha box (1737×566) saves ≈ 4,4 MB.
8. **The pack's `furnishings-before` is one layer with the whole worn furniture set** (all 6 slots plus lamp, plants,
   pouf), and `shadows` is one layer with the shadows of most objects. Slot canvases overlap heavily (the rug canvas
   contains 129 493 of the 157 536 shadow pixels with alpha > 8), so neither layer can be split per slot by cropping.
   Consequence: the empty-slot look after the stage cannot be "this slot's worn piece" — see Open choices.
9. **Phaser 4 (installed 4.2.1).** A scene renders during its own `preload` (`SceneManager#render` draws scenes with
   status ≥ LOADING), so the loading screen can be drawn in `BootScene.preload` and fed by `load.on('progress')` — no
   new scene needed (change.md decision 6 holds). `textures.getPixelAlpha(x, y, key)` gives alpha hit-testing without
   Phaser input; `DynamicTexture` needs an explicit `render()` in v4; images missing from the texture manager show
   the 32×32 `__MISSING` texture, so the `ArtImage`-style `textures.exists` check stays the right pattern.
10. **Word minigame breaks with new captions.** `MINIGAME_WORDS` (`src/data/minigames.ts`) is a hand list
    `['KANAPA','DYWAN','STOLIK','LAMPA','PÓŁKA','OBRAZ']` and `tests/wordRound.test.ts` requires each word to be an
    upper-cased value of `pl.room.slots` and at least one with Ó or Ł. With the manifest labels (Sofa, Obrazki, Dywan,
    Komoda, Fotel, Stolik) LAMPA, PÓŁKA, OBRAZ, KANAPA fail; none of the new labels has Ó or Ł ("Słoneczna" is a variant
    label, not a slot caption).

## Detailed Findings

### Room model and the stage task

- Types (`src/core/types.ts`): `SlotDef {id, x, y, depth, emptyFrame?, variants: [string,string,string]}` (centre
  point, no size), `RoomTaskDef {id, slot, label, cost}` (`slot` required, no `kind`), `RoomDef {id, name, background,
  slots, tasks}` ("completed in order"), `RoomState {tasksDone, chosen: Record<string, 0|1|2>}`.
- `src/core/rooms.ts`: `emptyRoomState`, `currentTask` (= `room.tasks[state.tasksDone]`), `nextTaskCost`,
  `taskButtonView`, `purchase` (rejects `no-task`, `bad-variant`, `short`; writes `tasksDone + 1` and
  `chosen[task.slot]`), `roomDone` (`tasksDone >= tasks.length`), `roomsListView`, `repairCurrentRoom` (pure, returns
  the same object when nothing to repair).
- `src/core/variantPanel.ts` `stepPanel`: closed + `open` → `{mode:'buy', taskId}` when affordable; closed +
  `change{slot}` → change mode only when `chosen[slot] !== undefined`; open: `pick` previews, `confirm` with a preview
  calls `purchase`, a stale `taskId` closes, `stepChange` never spends.
- `src/scenes/RoomScene.ts`: `dispatch` writes `rooms` (+ `stars`, `saver.flush('now')` on `bought`), sets `card` when
  `roomDone`, schedules `showCard` after `prefersReducedMotion() ? 0 : ANIMATION.purchasePopMs`, then `celebrate`.
  `redraw` uses `panelSlot = task?.slot` and `SALON_PLACEHOLDERS[panelSlot]`.
- Future slots appended at the end (roadmap decision): `tasksDone` is positional, so appending tasks never changes the
  meaning of an existing prefix; only reordering or removing does (that is exactly what this slice does once).

### Geometry and hit-testing

- `src/core/roomHit.ts`: `Box {left, top, right, bottom}`, `SlotSizes`, `slotBox(slot, size)` (centre ± half size),
  `slotAt` and `holdPoint` (skip slots without `chosen`); every caller passes `SALON_PLACEHOLDERS` (`RoomScene`,
  `RoomView.highlight/render`, `tests/roomHit.test.ts`, `tests/e2e/room-change.spec.ts`). `src/ui/widgets/RoomView.ts`
  has a second `Box {left, top, width, height}` (follow-up F4).
- Manifest geometry (`designs/martynka-expansion-v1/manifest.json`, read-only): each slot/layer has top-left `x, y`,
  `width, height`, `z`, `anchor`, `visibleRect` (16 px inset). Overlaps that matter: rug visibleRect (448..1511 ×
  457..1065) contains the armchair (z 40) and coffee-table (z 50) areas; the sofa (z 30) visibleRect overlaps the lower
  part of wall-frames (z 5) at y ≈ 273..440. A rectangle-only `slotAt` must pick the highest `z` among hits; it will
  still take taps on the rug's transparent diamond corners. Pixel-alpha via an injected predicate is the precise option.
- Phaser 4: `this.textures.getPixelAlpha(x, y, key)` (`node_modules/phaser/src/textures/TextureManager.js`) does one
  1×1 canvas read per call — fine per tap, not per move; coordinates are texture pixels (subtract the slot's top-left).
  `input.makePixelPerfect` exists (`src/input/InputPlugin.js`) but the project hit-tests in pure code; keep that and
  inject `alphaAt(slotId, localX, localY)` from the scene, so `src/core` stays pure.
- Depth: `setDepth` sorts the display list; equal depth keeps creation order. Today only `RoomView.outline` (1) and
  `RoomDoneCard` (5) set depth. With one Image per slot at depth = manifest `z`, the pop tween targets that Image only
  (closes follow-up V2). `setOrigin(ax/width, ay/height)` ≡ `setDisplayOrigin(ax, ay)`; popping around the manifest
  `anchor` keeps the piece on the floor.

### Live-save remap (format stays v2)

- Load order (`src/main.ts`, `start`): `loadSave` (`decodeSave` + migrations + `validateSave`) → slow/unreadable/
  unavailable cards → for `loaded`: `floorToCalendar` → `repairCurrentRoom` → `createGame(..., session)` (`preBoot`
  sets `stars`, `rooms`, `currentRoom`) → `createAutosaver`. The repaired state reaches disk only on the next change
  (listeners attach after `createGame`).
- Pattern and tests: `repairCurrentRoom` tests in `tests/rooms.test.ts` (describe "repairCurrentRoom (H-R3…)") build
  `SessionSave` inline (`session(...)`, `done(n)`) and also decode the frozen fixtures; `floorToCalendar` tests in
  `tests/curriculumStart.test.ts` assert identity (`toBe`) when nothing changes — the same idempotence proof fits
  the remap.
- Marker validity: old task order starts with `fix-floor` (slot `floor`), so every old salon with `tasksDone ≥ 1` has
  `chosen.floor`; `tasksDone 0, chosen {}` means the same in both layouts. New slot ids (sofa, wall-frames, rug,
  cabinet, armchair, coffee-table) must not include any old id with a different meaning; `sofa` and `rug` are shared
  with the same meaning. Orphan keys pass `validRoom` and are ignored by `RoomView`/`slotAt` (they only iterate
  `room.slots`), but they must be removed by the remap for idempotence.
- Value: old costs in order 5, 6, 7, 8, 9, 10, 11, 12, 13, 15 (sum 96 ≈ 14 clean rounds at 7 stars,
  `balance.round` `starPerTask 1`, `cleanRoundBonus 2`). Stars: `src/core/stars.ts` `earn` adds only integers > 0 and
  its header states the balance only grows by what a round earned; `REGISTRY_KEYS.stars` is written in `preBoot`,
  `RoomScene.dispatch` and `TaskScene`. A load-time refund would be a new, documented exception (pure: the remap
  returns `{session, refund}` and the session's `stars` is set before `createGame`).
- Two value-preserving rules (plan picks, records for the maintainer):
  - **A. Round down + refund** (change.md decision 3): new `tasksDone` = longest new prefix with cost ≤ spent, refund the
    rest. Needs the stars exception above.
  - **B. Round up, no refund**: new `tasksDone` = shortest new prefix with cost ≥ spent (capped at `tasks.length`). The
    child never loses value, stars are never touched (stars.ts rule intact), the gift is at most one task. Example with a
    hypothetical curve 5, 7, 9, 10, 12, 13, 15 (sum 71): old `tasksDone` 2 (spent 11) → A: 1 task + 6 stars; B: 2 tasks.
    Old room done (96) → done under both (A refunds 25).
- Variants carried for slots inside the new prefix: `sofa`→`sofa`, `rug`→`rug`, `table`→`coffee-table`,
  `shelf`→`cabinet`, `picture`→`wall-frames`; a new prefix slot without an old counterpart (e.g. `armchair`) gets 0.
- Import: `parseImport` (`src/core/saveFile.ts`) returns the decoded, unrepaired state; `saveSummary(s, ROOMS)` clamps
  `tasksDone` to `tasks.length`. `saver.replace` writes the raw import and reloads; the load path repairs it. Applying
  the remap before `saveSummary` in the import dialog keeps the preview equal to what the child will see.
- Rollback risk: an older build reading a remapped save sees `tasksDone ≤ 7` and unknown `chosen` keys: positional
  tasks are misread (e.g. new 2 → old floor + walls), nothing is deleted. Human rollback only (profile § 5).

### Art pipeline and precache

- `scripts/make-task-art.mjs`: hard-coded `KIT = designs/martynka-maths-A-v1`, `OUT = public/assets/tasks`, an explicit
  `JOBS` table `{from, to, size}`, `cwebp -quiet -resize W H -q 85 -alpha_q 100 -m 6`, exit 1 on a missing source or
  cwebp failure, deterministic. Extending it needs a second kit root (`designs/martynka-expansion-v1`) and an output root
  `public/assets/rooms/salon/` (size = source size, or `-resize` omitted).
- Measured in the scratchpad (never `public/`) with those flags:

  | Layer | Source | WebP q85 full | half | q75 |
  |---|---|---|---|---|
  | architecture-before 1920×1080 | 3 201 972 | 95 606 | 37 624 | 59 082 |
  | architecture-after 1920×1080 | 2 666 648 | 74 802 | 30 710 | 47 452 |
  | furnishings-before 1920×1080 | 2 460 943 | 288 634 | 106 472 | 234 644 |
  | shadows 1920×1080 | 312 592 | 68 810 | 23 620 | 53 720 |
  | sofa ×3 (835×566) | | 132 720 | | |
  | rug ×3 (1111×640) | | 132 640 | | |
  | wall-frames ×3 (634×425) | | 106 560 | | |
  | cabinet ×3 (512×363) | | 95 046 | | |
  | coffee-table ×3 (537×397) | | 94 714 | | |
  | armchair ×3 (399×361) | | 52 544 | | |
  | lamp-table, plant-left, plant-right, pouf | | 91 166 | | |
  | **Total (26 files)** | | **1 233 242** | **475 260** | **973 520** |

- PWA (`vite/config.shared.mjs`): `globPatterns ['**/*.{js,css,html,png,webp,ogg,m4a,woff2,ttf}']`,
  `maximumFileSizeToCacheInBytes` 10 MB, no `includeAssets`. `public/assets` today 496 KB (tasks only). Every file must
  be loaded in `BootScene` (no lazy chunks, CLAUDE.md).
- `TASK_ART` (`src/data/taskArt.ts`, `TaskArtEntry {id, key, url, width, height, label}`) is checked by
  `tests/taskArt.test.ts` against WebP headers and files on disk — a `ROOM_ART` table can reuse the same test pattern.
- `artHealth(entries, exists)` (`src/core/artHealth.ts`) is generic over `{key, id}`; `createArtHealthView`
  (`src/ui/dom/artHealthView.ts`) uses `pl.settings.artOk` "Wszystkie obrazki zadań są wczytane." and `artMissing` "…W
  tych zadaniach zamiast obrazka jest napis…" — counting room art needs new wording (copy in `pl.ts`).
- `ArtImage` (`src/ui/widgets/ArtImage.ts`) fits by `SIZES` from `TASK_ART` and draws a labelled stand-in when
  `textures.exists` is false; room layers need their own table/size map. A missing background can fall back to the
  current code-drawn wall/floor; a missing furniture image to a labelled box.

### Loading screen

- `BootScene` (`src/scenes/BootScene.ts`) draws nothing; `preload` loads the font and `TASK_ART` with a `loaderror`
  warning only; `create` computes `artHealth`, then `scene.start(welcome|task)` via `delayedCall(0)`. No progress
  listener, no progress widget in `src/ui/widgets/` (`ProgressDots` is the round's dots).
- Phaser 4: `progress` (0–1), `loaderror`, `complete` events (`node_modules/phaser/src/loader/events/`); scenes render
  and tween during `LOADING` (`src/scene/SceneManager.js` `render`/`update`). The font loads in the same queue, so the
  loading screen's text renders in a fallback font until it arrives (or the font is queued first and the title drawn on
  its `filecomplete`). Images load via XHR blob → `HTMLImageElement` (`src/loader/filetypes/ImageFile.js`).
- Copy: no loading strings in `src/data/pl.ts`; the brand "Martynka urządza" exists. Brief P2.2 lists the missing
  loading art → DESIGN-GAP.

### Animations

- `RoomScene.celebrate`: empty `playPurchaseSound` (S-16b), early return on `prefersReducedMotion()`, a separate
  `Graphics` pop drawn over everything (V2), particles via generated `purchase-star` texture and `explode`.
  `ANIMATION` (`src/data/layout.ts`): `purchasePopMs 260`, `purchasePopScale 1.08`, `purchaseParticles 14`,
  `purchaseParticleMs 700`, and the task-scene values.
- `prefersReducedMotion` (`src/ui/motion.ts`) callers: `RoomScene.dispatch`, `RoomScene.celebrate`, `TaskScene` star
  flight. `TaskScene.shake` (camera tween) is **not** guarded — outside the salon, but FR-026/NFR "ogranicz ruch"
  covers it; cheap to guard.
- Phaser 4 tweens/particles API unchanged from v3.60 (`this.tweens.add`, `this.add.particles(...).explode(n)`);
  crossfade before→after = two stacked Images with an alpha tween.

### Design sources and copy

- Views bound: room (`RoomScene`, `RoomView`, `RoomTaskButton`, `VariantPanel`), "Pokój gotowy!" (`RoomDoneCard`,
  `drawRoomMiniature` in `RoomView.ts`), loading screen (`BootScene`), parent "Obrazki" (`artHealthView.ts`), unlock
  card (`UnlockCard.drawBook`, DESIGN-GAP 22). Shared component dirs: `src/ui/widgets/`, `src/ui/dom/` (profile § 6).
- Pack screenshots `designs/martynka-expansion-v1/screenshots/room-chooser.png` and `room-preset-*.png`: the room is
  full-bleed 1920×1080 with HUD overlays; the kit's chooser shows per-slot tabs and three variant cards (400×242, image
  340×170, caption "<label> · Wybieram"). The game's panel (`ROOM_LAYOUT.thumbs` size 200, separate "Wybieram") is the
  approved S-09 design (gap 33); the kit adds **variant labels** (Morska, Słoneczna, …) — supports NFR "nic tylko
  kolorem". Today's `ROOM_LAYOUT.area` (180, 204, 1560×656) and the bottom tray/buttons (y ≥ 780) overlap the manifest
  scene (rug to y 1080, armchair to 915, pouf to 954) if drawn 1:1.
- Kit copy available: slot labels Sofa, Obrazki, Dywan, Komoda, Fotel, Stolik; 18 variant labels. Current `pl.room`:
  tasks `fixFloor 'Napraw podłogę'` … `hangPicture 'Powieś obraz'`; slots lower-case captions (`kanapa`, `dywan`, …);
  `done.title 'Pokój gotowy!'`, `done.teaser 'Wkrótce'`. Stage label "Odnów ściany i podłogę" is an author decision
  (roadmap S-16a). Missing in the kit: furniture task verbs for cabinet/armchair/wall-frames (style of existing
  "Postaw stolik"), loading text.
- `docs/design-gaps.md`: highest row 104; rows 22, 32–35 are the ones this slice closes or narrows; no row mentions a
  loading screen.

## Code References

- `src/core/types.ts` `SlotDef`, `RoomTaskDef`, `RoomDef`, `RoomState` — model to extend (task kind, slot rectangle).
- `src/core/save.ts` `validRoom`, `saveProblem` — accept the new salon state unchanged.
- `src/core/rooms.ts` `purchase`, `currentTask`, `roomDone`, `roomsListView`, `repairCurrentRoom` — stage path, remap neighbour.
- `src/core/variantPanel.ts` `stepPanel`, `stepChange` — stage branch.
- `src/core/roomHit.ts` `slotBox`, `slotAt`, `holdPoint`, `Box` — manifest rectangles, z order, alpha predicate.
- `src/core/stars.ts` `earn` — refund exception (rule A only).
- `src/core/saveFile.ts` `parseImport`, `saveSummary`, `exportFileText`, `deviceSaveView` — preview raw vs repaired.
- `src/main.ts` `start` — remap call site after `repairCurrentRoom`.
- `src/data/rooms.ts` `SALON`, `SALON_PLACEHOLDERS`, `captionAnchor`, `ROOM_ORDER`.
- `src/data/minigames.ts` `MINIGAME_WORDS`; `tests/wordRound.test.ts`, `tests/wordScreen.test.ts`.
- `src/scenes/RoomScene.ts` `create`, `dispatch`, `redraw`, `celebrate`, `slotTargets`, `snapshot`.
- `src/scenes/BootScene.ts` `preload`, `create`.
- `src/ui/widgets/RoomView.ts` `render`, `highlight`, `drawLook`, `drawRoomMiniature`; `VariantPanel.ts` `show`;
  `RoomTaskButton.ts` `show`; `RoomDoneCard.ts` `drawRoomTile`, `drawTeaserTile`; `UnlockCard.ts` `drawBook`;
  `ArtImage.ts` `show`.
- `src/data/layout.ts` `ROOM_LAYOUT`, `ROOM_DONE_LAYOUT`, `ANIMATION`; `src/data/pl.ts` `room`, `settings.art*`.
- `src/data/taskArt.ts` `TASK_ART`, `ART_KEYS`; `src/core/artHealth.ts` `artHealth`; `src/ui/dom/artHealthView.ts`.
- `scripts/make-task-art.mjs` `KIT`, `OUT`, `JOBS`; `vite/config.shared.mjs` workbox options.
- `src/testing/e2eHook.ts` room snapshot/targets; `tests/e2e/support/hook.ts`.
- Tests that break with the new salon: `tests/roomsData.test.ts` (ten slots/tasks, one task per slot, `BACKGROUND_SLOTS`,
  placeholders, captions), `tests/roomHit.test.ts` (hand-picked salon points), `tests/wordRound.test.ts`;
  e2e `room-purchase.spec.ts` (first cost 5, second `paint-walls` 6, `chosen.floor`), `room-change.spec.ts`
  (`SALON_PLACEHOLDERS`, `slots.floor`, empty `curtains`, `buy(page,0)` loop), `save-restart.spec.ts` (`chosen.floor`
  after reload). Data-driven and unaffected: `save-transfer.spec.ts`, `save-migration.spec.ts`, `tests/rooms.test.ts`
  inline rooms, `tests/variantPanel.test.ts`, `tests/roomGesture.test.ts`, `tests/save*.test.ts`.

## Architecture Insights

- The room state is positional (`tasksDone`) plus a per-slot variant map; that shape already supports an append-only
  task list and a variant-less stage without a format change.
- Load-time repairs are pure functions in `src/core` called from `src/main.ts`, proven by identity on an already-good
  state; the remap follows the same pattern and must also be applied where raw saves are summarised (import).
- Art enters through a data table (`TASK_ART`) + `BootScene` load + `artHealth` + a stand-in widget; room art should
  mirror it rather than build a parallel mechanism.

## Historical Context (from prior changes)

- `context/archive/2026-10-13-first-furniture-purchase/` — S-09 salon placeholders, panel design (gap 33), follow-ups
  "art for variants" and V1 captions, `Trigger: S-16` (supported: still open in code, `SALON_PLACEHOLDERS` present).
- `context/archive/2026-10-13-variant-change-room-done/` — hold, change mode, done card; follow-ups F4, F6, V2, V3,
  art hit-test/miniature (supported: `Box` duplicated, inline numbers in `RoomDoneCard`, pop drawn on a separate
  Graphics).
- `context/archive/2026-10-13-adaptive-curriculum/` — DESIGN-GAP 22 book; `tasks/icons/book` is already in `TASK_ART`.
- `context/archive/2026-10-14-art-tasks-all-stages/` — `npm run art`, `TASK_ART`, atlas follow-up (re-trigger,
  measured weight does not call for it).
- `context/archive/2026-10-14-art-stand-in-and-load-signal/` — `artHealth`,
  stand-in with label.
- `docs/art-inventory.md` — salon ≈ 1,2 MB WebP (supported: 1,23 MB measured); "decyzje otwarte" line superseded by the
  2026-10-15 author decisions in the roadmap.

## Related Research

- `context/archive/2026-10-13-first-furniture-purchase/research.md`, `context/archive/2026-10-13-variant-change-room-done/research.md`
  (salon model and panel), `context/archive/2026-10-14-art-tasks-all-stages/research.md` (art pipeline).

## Open Questions (choices for `/10x-plan`)

1. **Remap rule** A (refund, needs a stars exception) vs B (round up, no star change). Recommendation: **B** — value
   never lost, `stars.ts` invariant intact, at most one task gifted; record for the maintainer.
2. **Empty-slot look and the before layers.** `furnishings-before` is all-or-nothing. Recommendation: before the stage:
   `architecture-before` + `furnishings-before` (the whole worn room); after the stage: `architecture-after` +
   decorations + only the bought furniture; empty slots show nothing (or a soft outline in change/hold only);
   `shadows` only when the room is done (it contains shadows of absent pieces). DESIGN-GAP rows for per-slot worn
   pieces and per-slot shadows (brief).
3. **Scene placement**: full-bleed 1920×1080 with HUD and bottom controls overlaying (as the kit's screenshots) vs scaled
   into `ROOM_LAYOUT.area`. Recommendation: full-bleed like the kit; check that the task button/panel do not hide the
   piece just bought (panel preview must stay visible — e.g. move the tray when previewing coffee-table/rug, or accept
   partial cover); the visual gate decides.
4. **Hit-test**: rectangles by descending `z` vs injected alpha predicate. Recommendation: rectangle from `visibleRect`
   + injected `alphaAt` (scene uses `textures.getPixelAlpha`), rectangle-only fallback when the texture is missing.
5. **Thumbnails / miniature**: scaled furniture Images (panel ≈ 0,3–0,5 scale is fine with LINEAR) and the room-list
   miniature as scaled Images (0,2) or a `DynamicTexture` (`render()` required in v4, lost on context loss).
   Recommendation: scaled Images in a container; brief P2.3 miniature → DESIGN-GAP.
6. **Word list**: re-pick `MINIGAME_WORDS` from the new captions; no caption carries Ó/Ł — the test's Ó/Ł requirement
   needs a caption with it or a recorded change of that assertion.
7. **Costs**: 7 tasks in 5–15; e.g. 5, 7, 9, 10, 12, 13, 15 = 71 ≈ 10 clean rounds (old 96 ≈ 14). S-17 tunes.
