---
date: 2026-10-24T23:23:17+02:00
researcher: Claude (autonomous run 2026-10-24-salon-style, research step)
git_commit: 2078abd
branch: feat/salon-style
repository: Martynka-urzadza
topic: "salon-style: before state in the house clay style, palette board, contact shadows (how, with which numbers and tools)"
tags: [research, salon, RoomView, RoomScene, SalonBackdrop, drawRoomMiniature, phaser-filters, art-pipeline]
status: complete
last_updated: 2026-10-24
last_updated_by: Claude (research step)
---

# Research: salon-style

**Date**: 2026-10-24T23:23:17+02:00 · **Git Commit**: 2078abd · **Branch**: feat/salon-style · **Repository**: Martynka-urzadza

## Research Question

From `change.md` (corrections column, D2-D7) and the run's `scope.md` items 1-8:

1. Which numbers for the worn grade of the AFTER furniture, and does a separate dust/wear overlay help? Does
   `architecture-before` still clash next to the graded furniture?
2. How to apply the grade in Phaser 4.2.1 (ColorMatrix on an Image / Container / inside the `SalonBackdrop` DynamicTexture),
   what the Canvas renderer shows, what it costs.
3. Which slot and variant stands in for each piece of the worn picture.
4. Board recolour: which palette colour, which tool in the deterministic `npm run art` pipeline.
5. Turquoise nudge: clear gain or not.
6. Contact shadows in the empty renovated room: crops of `shadows` or code ellipses.
7. Boot budget after dropping `furnishings-before`; which tests and the e2e #15 must follow.
8. Phases with drivers for the plan; DESIGN-GAP rows.

## Summary

- **Worn look, chosen by eye** (montages below): the after furniture, variant 0 of every slot the worn picture covered plus the
  right-plant decor, through ONE colour matrix: sepia blend 0.20, then `saturate(-0.30)` (Phaser's own formula), then
  brightness 0.90, then contrast 0.90 toward mid-grey with a lift of +4 (a matte "dust film"). As a Phaser `ColorMatrix.set()`
  array (rows R, G, B, A; offsets in 0-255), computed by the prototype's `grade_matrix(-0.30, 0.20, 0.90, 0.90, 4)`:
  `[0.5794,0.1842,0.0941,0,16.8, 0.1208,0.6284,0.0918,0,16.8, 0.1121,0.1576,0.5412,0,16.8, 0,0,0,1,0]`; the plan's pure
  helper computes these from the data numbers and a test pins them. The whole `shadows` layer is shown in the before state too
  (every piece it shades is present then). No separate dust overlay: speckles read as polka dots and soft stains as spots
  (montage m2, m4); the haze in the matrix carries the "dusty" read. `architecture-before` stays (it matches the graded
  pieces; montage m9).
- **Measured** (opaque pixels, mean RGB / mean HSV saturation ×255): old worn picture 132 / 119; after variant 0 pieces
  152 / 161; graded E 146 / 95. The grade lands between, less saturated than the old picture, which reads "faded" next to
  the vivid after pieces.
- **Phaser**: `container.enableFilters().filters?.internal.addColorMatrix()` and `.colorMatrix.set(arr20)`; one filtered
  Container for all worn pieces (1 framebuffer + 1 pass) instead of ~10 filtered images. A DynamicTexture `draw` of a
  filtered container bakes the filter in (the backdrop already relies on that for its blur). Under Canvas `filters` is
  `null` (no throw with `?.`), and tint is WebGL-only too, so the Canvas fallback is a plain translucent wash rectangle.
- **Board**: muted "listki" `#BCD799` (leafGreen `#90C36A` 60 % over ivory `#FFF5DF`), lighting gradient kept (shade
  exponent 0.5), spill-corrected rim; done in a new pinned Python + Pillow + numpy step called by `npm run art`
  (precedent `scripts/make-font.py`), outputs committed. Ivory with a diorama shadow was rejected (the cream wall pillars melt
  into it, montage m6).
- **Turquoise nudge: not done.** Desaturating `sofa-morska` toward `#54BEB4` dulls the very piece whose vividness carries the
  "renewed" read; `icons/cup` is already near (`#41BDB3`); no clear gain (montage m8).
- **Contact shadows**: code ellipses, not crops (the `shadows` blobs of lamp, left plant and pouf touch the cabinet, sofa and
  armchair blobs: the pouf/armchair seam never drops below alpha 39/255, so a rectangle crop shows a hard edge). Colour and
  strength copied from the layer itself: rgb (95,70,43), peak alpha 0.25.
- **Boot budget**: 2 378 800 B → about 2 079 700 B (−288 634 furnishings-before, −3 626 and −6 820 for the re-encoded
  recoloured backgrounds) = 41.6 s at 50 KB/s against 48 s: headroom grows from 0.42 s to about 6.4 s. No new files.

### Prototype evidence (scratchpad, not committed)

- `/private/tmp/claude-501/-Users-kamilp-Dev-Martynka-urzadza/99d35901-8f35-42fa-8afe-0717b608b676/scratchpad/salon-style/m9-proposed-flow.png`:
  the whole proposed flow (now before / proposed before / now after-stage / proposed after-stage with contact shadows / first
  purchase / done room), the key picture.
- `/private/tmp/claude-501/-Users-kamilp-Dev-Martynka-urzadza/99d35901-8f35-42fa-8afe-0717b608b676/scratchpad/salon-style/m1-grade-candidates.png`:
  grade strengths A (scope numbers), B, C, D beside the old before and the after room.
- `/private/tmp/claude-501/-Users-kamilp-Dev-Martynka-urzadza/99d35901-8f35-42fa-8afe-0717b608b676/scratchpad/salon-style/m6-board-done-room.png`:
  board candidates on the done room (green / listki / ivory + shadow) and the before background.
- `/private/tmp/claude-501/-Users-kamilp-Dev-Martynka-urzadza/99d35901-8f35-42fa-8afe-0717b608b676/scratchpad/salon-style/m8-turquoise.png`
  and `.../m11-backdrop.png`: the turquoise side-by-side and the blurred task-screen backdrop before/after.
- Others in the same folder: `m2-worn-cues.png`, `m2-worn-zoom.png` (speckle dust rejected), `m4-stain-*.png`, `m5-board-*`,
  `m7-board-edges-v2.png` (rim at 5×), `m9-contact-zoom.png`, `m10-shadows-layer.png` (blob map); scripts `proto.py`,
  `board.py`, `board2.py`, `m1.py`…`m9.py`, `turq.py`.

## Detailed Findings

### 1. Worn look (scope item 2)

Grade function used by every prototype (`proto.py` `grade_matrix`): `M = contrast · brightness · Sat(sat) · lerp(I, SEPIA, k)`,
offset `(1 − contrast)·128 + lift`. `Sat` is Phaser's own (`node_modules/phaser/src/display/ColorMatrix.js`
`ColorMatrix#saturate`: `x = 1 + 2v/3`, `y = −v/3`, plain average, not luminance); `SEPIA` is `ColorMatrix.SEPIA`.

| candidate | sat | sepia | bright | contrast/lift | verdict (montage) |
|---|---|---|---|---|---|
| D | −0.15 | 0.10 | 0.95 | – | too close to after, no before/after contrast (m1) |
| A (scope) | −0.25 | 0.15 | 0.92 | – | readable but still "new", sofa still cyan (m1) |
| **E (chosen)** | −0.30 | 0.20 | 0.90 | 0.90 / +4 | faded and matte, same clay forms, sofa grey-teal like the old worn sofa (m9) |
| B / Bh | −0.35 | 0.25 | 0.88 / 0.90 | – / 0.88, +4 | also good; pouf turns khaki (m2, m3) |
| C | −0.45 | 0.30 | 0.85 | 0.90 | dead grey, too sad for a child's first room (m1) |

Why not the scope's exact A: at A the sofa stays cyan and the step to `sofa-morska` is small; E keeps the scope's direction
with a bit more strength and adds the matte haze. Full sepia must not be applied with `alpha` alone: its rows sum to 1.35,
1.20, 0.94 and brighten (`ColorMatrix.SEPIA`), so the plan composes the 20 numbers in a pure helper and calls `set()`.

Dust/wear overlay: speckle dots inside the piece alpha (m2, `Bh + speckle`) read as a polka-dot pattern; soft radial stains
(m4, centre alpha 0.16) are hardly seen and at higher strength read as spots on new furniture. Rejected; the grade's lift
(+4) and contrast (0.90) give the dusty film. Grounding: the `shadows` layer in the before state (m2 "B + shadows") ties the
graded pieces to the floor the way the baked shadows of the old picture did.

`architecture-before` beside the graded pieces: scuffed walls and a worn floor, flat colour fields, no gouache grain at the
scale of the furniture; it reads as the same room, older (m9 top right). Kept.

### 2. Phaser 4.2.1 (sources in `node_modules/phaser/src`)

- API: `Filters#enableFilters` / `Filters#filters` (`gameobjects/components/Filters.js`) are mixed into every `GameObject`;
  `FilterList#addColorMatrix` (`gameobjects/components/FilterList.js`) returns `Filters.ColorMatrix` (`filters/ColorMatrix.js`)
  whose `.colorMatrix` is a `Display.ColorMatrix`. `internal` runs before the object's transform and is the cheap one.
- Composition: every preset takes `(…, multiply = false)`; `false` calls `reset()` (which also sets `alpha` back to 1);
  `true` gives `m = current · new`, so the newly added matrix acts first. `set(arr20)` takes the matrix directly; offsets
  (indices 4, 9, 14, 19) are 0-255 units, `getData()` divides them by 255. `colorMatrix.alpha` blends original → graded in
  the shader (`renderer/webgl/shaders/FilterColorMatrix-frag.js`).
- DynamicTexture: `DynamicTexture#render` → `DynamicTextureHandler` render node → `renderWebGLStep` from step 0; `enableFilters`
  inserts `renderWebGLFilters` into `_renderSteps`, so `dt.draw(container)` bakes the filter. `SalonBackdrop.render` already
  does this with `addBlur` on its off-list `holder`.
- Canvas: `src/main.ts` `createGame` uses `type: AUTO`; with no `renderer.gl` `enableFilters` returns early and `filters` is
  `null`. `setTint`/`setTintMode` are `@webglOnly` (`gameobjects/components/Tint.js`, `renderer/TintModes.js`), Container and
  Layer have no tint. Canvas fallback = one rectangle wash (repo precedent: `SalonBackdrop` ivory wash, renderer check
  `scene.sys.game.renderer.type === WEBGL`).
- Cost: each filtered object = own framebuffer + a pass per filter + a composite, and breaks batching (Filters class doc). One
  filtered Container with no size focuses on the whole camera framebuffer: 1 framebuffer, 1 pass, fine for a 1920×1080
  scene shown only in the before state. ColorMatrix adds no padding (no cropped soft edges). Alpha tweens on a filtered
  container work (the shader un/premultiplies), so `fadeStage` can fade the graded container.

### 3. What the before state shows (slot → variant)

Before: `architecture-before` (depth `scene`), `shadows` whole, then in one graded container sorted by z: `wall-frames`
(z5) `wall-frames`, `rug` (10) `rug`, `cabinet` (20) `cabinet` (its two pot plants are in the variant), `lamp-table` (25)
`lamp-table` (with its small plant), `plant-left` (26) `plant-left`, `sofa` (30) `sofa-morska`, decor `plant-right` (35),
`armchair` (40) `armchair`, `coffee-table` (50) `coffee-table`, `pouf` (60) `pouf`. Not shown: `curtains`, `wall-shelf`
(absent from the worn picture). Dropped: litter (papers, leaves), no slot counterpart. Variant 0 everywhere: for the pouf the
old picture's ribbed yellow pouf matches `pouf` (v0) at least as well as `pouf-knit`, and v0 is the piece that appears after
the stage (`SlotDef.shownBeforePurchase` for lamp, left plant and pouf), so those three keep their exact shape across the
stage (graded → vivid). Geometry: `src/data/rooms.ts` `SALON.slots` / `decor` = `designs/martynka-salon-v2/manifest.json`
`slots` / `layers` (x,y top-left of the full PNG in scene space).

Where the code changes: `RoomView.render` (`src/ui/widgets/RoomView.ts`) today draws the layer `furnishings` from
`room.scene.furnishingsBefore` at `ROOM_LAYOUT.depth.furnishingsBefore` while `stagesDone === 0`; `shadows` only when
`roomDone`. The worn pieces must stay outside `shownVariants` / `shownNow` (D3): `slotAt`/`holdPoint`
(`src/core/roomHit.ts`) only consider `chosen`, and `RoomView.shown()` feeds the e2e `shown` snapshot. A missing worn
texture shows nothing (the old layer had `standIn: null` in `RoomLayer.show`); a stand-in box per worn piece would put six
captioned boxes on the child's first screen.

`miniaturePieces` / `drawRoomMiniature` (`src/ui/widgets/RoomView.ts`): today push `furnishingsBefore` with `alpha: 0`
("skip if missing"). New: the worn pieces with `alpha: 0` too (so `neededMiniatureKeys` in `src/core/artPick.ts` keeps
ignoring them and the "Pokój gotowy!" miniature mode is unchanged) plus a `worn` flag; `SalonBackdrop.render` puts the worn
images into a graded sub-container inside its `holder` (WebGL only; under Canvas the backdrop is ungraded, blurred by the
upscale and washed ivory 60 %, `BACKDROP.washAlpha`). `RoomDoneCard` shows done rooms only, so worn pieces never reach it.
`backdropMode` (`src/core/backdrop.ts`) keys on the scene picture only: unchanged.

`RoomScene.fadeStage` (`src/scenes/RoomScene.ts`): ghosts of `room.scene.before` and `room.scene.furnishingsBefore` tween to
alpha 0 over `ANIMATION.stageFadeMs`; returns at once under `prefersReducedMotion()`. New: ghost the before picture, the
whole `shadows` layer and a freshly built graded worn container (same builder as `RoomView`). Folded follow-up F1: `onSleep`
does not stop the ghost tweens; complete/destroy them there.

### 4. Board recolour (scope item 3)

Mask (`board.py` `board_mask`): HSV hue 95°-165° and saturation > 0.30, flood-filled from the frame edges (so the window trees
stay untouched: 0 changed pixels in the window box), 13.4 % of each background. Recolour (`board2.py` `recolour2`): local
board colour by a normalised Gaussian blur (r 6), target = palette colour × (L/mean L)^0.5 (keeps the lit gradient), rim
pixels shifted by `w · (target − local board)` with `w` from the colour distance to the local board inside a 3 px dilation
(spill correction; plain alpha feathering left a dark-green fringe, m6 edges). Determinism: two runs gave byte-identical PNGs
(sha 9d523995e9e7); cwebp 1.1.0 re-encoding the source PNG reproduces the committed `architecture-after.webp` byte for byte.

Colour: `#BCD799` (leafGreen 60 % over ivory). Candidates: paleLeaf `#E3F0D9` (cold mint, low edge contrast), ivory + oak
diorama shadow (cream pillars melt into the page), butter-cream, sage `#A9C79A` (good, a little grey). Not a token yet:
the plan adds it as a named mix of two manifest palette colours (DESIGN-GAP).

Tool: a pinned Python step (`scripts/recolour-board.py`, runtime version check Pillow 12.1.0 + numpy 2.4.3 like
`PINNED_FONTTOOLS` in `scripts/make-font.py`), called by `scripts/make-task-art.mjs` for the two background jobs (Python
writes a temporary PNG, cwebp encodes it as today). Rejected: `sharp` (no flood fill or normalised blur; a native dependency
for two files), `pngjs` + hand-written JS (≈100 lines of blur/flood code to maintain), runtime code (the board is not a
rectangle: a code frame needs a diorama polygon and loses the anti-aliased rim). CI does not run `npm run art`; outputs are
committed.

### 5. Turquoise (scope item 4)

Mean turquoise (opaque, hue 160°-195°, s > 0.35): `sofa-morska` `#21B8B5`, `ui/wallet-open` `#1AB1B2`, `icons/cup` `#41BDB3`;
palette `#54BEB4`, notebook frame `#54B5A9`. Nudged ×0.80 sat / ×0.95 value: `#3CB0A9`, `#35A9A4`, `#52B2A9` (m8). The
nudged sofa loses the glossy pop that carries the renewed read against the graded before sofa; the cup gains nothing
visible. Verdict: no clear gain, D6 not met, nothing changed.

### 6. Contact shadows (scope item 5)

`shadows.webp` (m10): soft blobs, peak alpha 64/255, colour rgb (95,70,43) where alpha > 30. Blob bounding boxes run into
neighbours (lamp → cabinet/sofa, plant-left → cabinet, pouf ↔ armchair with alpha ≥ 39 across the seam), so crops are
rejected (D4 stays). Code: an ellipse per fixed piece at its foot (`anchor`), centre offset (+8, −6) (+8, −8 for the right
plant), width = `visibleRect` width × 0.75 lamp / 0.55 left plant / 0.95 pouf / 0.60 right plant, height 0.32 × width, eight
concentric fills with alpha rising to 0.25 at the centre (a Graphics, works on Canvas). Shown while `stagesDone > 0` and not
`roomDone` for the pieces currently shown among lamp, left plant, pouf and right plant (at `roomDone` the whole layer takes
over; keeps "a done salon loses its shadows" follow-up untouched). Depth: `ROOM_LAYOUT.depth.shadows` (2), below every slot.
Paper/noise texture: not prototyped further; the background already has the room's texture and the scope marks it optional.

### 7. Budget, art health, tests

`tests/bootBudget.test.ts` `bootPayloadBytes`: about 2 079 700 B after the change (41.6 s at 50 000 B/s, limit 48 s).
`ROOM_ART` (`src/data/roomArt.ts`) is derived from `SALON.scene`; removing `furnishingsBefore` from `RoomDef.scene`
(`src/core/types.ts`) and `SCENE_FILES` drops it from the boot queue, "Obrazki", `precacheCovers('room pictures', …)` in
`scripts/check-deploy.ts` and `roomArtCheck` automatically. Must follow: `tests/roomArt.test.ts` (`toHaveLength(38)` → 37,
the file-set equality needs `public/assets/rooms/salon/furnishings-before.webp` deleted and `sceneFiles` in
`scripts/make-task-art.mjs` without it), `tests/layout.test.ts` (`depth.furnishingsBefore` → the new worn depth),
`tests/roomMiniature.test.ts` (before keys), `tests/roomShown.test.ts` + `tests/roomFixtures.ts` (`TEST_ROOM_PARTS.scene`
literal), the `balance.loader` comment in `src/data/balance.ts`. e2e `tests/e2e/salon-load-health.spec.ts` "#15 H-2" routes
`**/assets/rooms/salon/furnishings-before.webp` to a request that never answers and asserts `missing >= 1`, `total > missing`,
screen `task`: retarget to `shadows.webp` (a whole-scene file with no stand-in, still loaded at boot).

## Code References

- `src/ui/widgets/RoomView.ts` — `RoomView.render`, `RoomView.shown`, `miniaturePieces`, `drawRoomMiniature`
- `src/ui/widgets/RoomLayer.ts` — `RoomLayer.show` (stand-in or nothing)
- `src/ui/widgets/SalonBackdrop.ts` — `SalonBackdrop.render` (holder, `addBlur`, DynamicTexture, Canvas branch)
- `src/scenes/RoomScene.ts` — `fadeStage`, `onSleep`
- `src/core/rooms.ts` — `stagesDone`, `roomDone`, `shownVariant`, `shownVariants`
- `src/core/roomHit.ts` — `slotBox`, `slotAt`, `holdPoint`
- `src/core/artPick.ts` — `miniatureMode`, `neededMiniatureKeys`
- `src/data/rooms.ts` — `SALON` (`scene`, `slots`, `decor`, `tasks`); `src/data/roomArt.ts` — `SCENE_FILES`, `ROOM_ART`
- `src/data/layout.ts` — `ROOM_LAYOUT.depth`, `ROOM_LAYOUT.standIn`, `PLACEHOLDER_COLORS`, `BACKDROP`, `ANIMATION.stageFadeMs`
- `scripts/make-task-art.mjs` — `sceneFiles`, `ROOM_JOBS`, `convert`; `scripts/make-font.py` — `PINNED_FONTTOOLS`
- `node_modules/phaser/src/display/ColorMatrix.js` — `saturate`, `sepia`, `brightness`, `multiply`, `set`, `SEPIA`
- `node_modules/phaser/src/gameobjects/components/{Filters,FilterList}.js`, `renderer/webgl/renderNodes/DynamicTextureHandler.js`

## Architecture Insights / proposed design for the plan

- Data (`src/data/`): `RoomDef.scene` loses `furnishingsBefore`; a new `RoomDef.worn` list (slot ids + decor ids shown graded
  before the stage, variant 0) and `contactShadows` (per fixed piece: offset, width factor) in `src/data/rooms.ts`; grade
  numbers `ROOM_LAYOUT.worn` {sepia 0.20, saturate −0.30, brightness 0.90, contrast 0.90, lift 4}, shadow colour/alpha, Canvas
  wash colour/alpha, board colour in `src/data/layout.ts` (scenes hold no numbers).
- Core (pure, tested): `wornMatrix(params): number[20]` (e.g. `src/core/colorGrade.ts`); `wornPieces(room, state)` and
  `contactShadowPieces(room, state)` beside `shownVariants` in `src/core/rooms.ts` (never inside `chosen`).
- UI: one builder `buildWornLayer(scene, room, …)` used by `RoomView`, `fadeStage` and the backdrop (graded container on
  WebGL, wash on Canvas); e2e room snapshot gains a minimal `worn: { keys, graded }` field (L-7 follow-up fires through the
  new layer, not `RoomLayer`).
- Nothing new animates: the worn ghost is part of the existing `fadeStage`, which already returns under
  `prefersReducedMotion()`.

### Proposed phases (one fresh agent each)

1. **tdd** — data + core: `wornMatrix`, `wornPieces`, `contactShadowPieces`, `RoomDef` change, `miniaturePieces` worn flag and
   before-state shadows, `furnishings-before.webp` deleted with `sceneFiles`; tests `roomArt` (37), `layout`, `roomMiniature`,
   `roomShown`, `roomFixtures`, new unit tests for the three helpers; `balance.loader` comment.
2. **impl** — scene/widgets: `RoomView` worn container + `shadows` before + contact-shadow Graphics; `fadeStage` ghosts the worn
   container and shadows, `onSleep` stops the ghosts (F1); `SalonBackdrop` graded sub-container; Canvas wash; hook snapshot field.
3. **impl** — art: `scripts/recolour-board.py` (pinned), `make-task-art.mjs` calls it for both backgrounds, regenerated webps,
   determinism (run twice + `cmp`), boot budget re-measured.
4. **e2e** — #15 retargeted to `shadows.webp`; one spec: fresh room shows graded worn pieces (snapshot), no request for
   `furnishings-before.webp`, after the stage the worn layer is gone and contact shadows are present; deliberate break.
5. **impl** — docs: `docs/design-gaps.md` (107, 109 amended; new 169-172), `docs/art-inventory.md` "Styl salonu" row,
   `follow-ups/review-fixes.md`; then the visual gate (scope item 8).

### DESIGN-GAP rows to add (`docs/design-gaps.md`, next free number 169)

- 169 worn look of a not-yet-renewed piece (grade numbers, no dust overlay, Canvas wash).
- 170 colour around the diorama (`#BCD799`, leafGreen 60 % over ivory; not a kit token).
- 171 contact shadows for fixed decoration in the otherwise empty room (ellipses, colour taken from the pack's shadows layer).
- 172 a missing worn-piece texture shows nothing.
- 107 amended (the before room is now drawn from the after pieces), 109 amended (the cross-fade fades the graded layer).

## Historical Context (from prior changes)

- `docs/art-inventory.md` row "Styl salonu": "a) zostaje" for v1; superseded in part by the maintainer's 2026-10-24 decision
  (change.md). Updated, not deleted.
- Follow-ups fired by this change are listed in `change.md` "Open follow-ups triggered by this slice"; research adds: L-7 fires
  via the new worn layer (hook field), final-art-salon F2 not needed (worn pieces never get stand-ins in the miniature).

## Related Research

Not applicable (no earlier research on the before-state style); the art review is `context/runs/2026-10-24-salon-style/art-review/raport.md`.

## Open Questions

- Whether a child reads the graded room as "old" without litter or stains: only the visual gate and the maintainer can judge;
  follow-up "a proper before from the author" stays (scope item 7).
- Exact WebGL output vs the Pillow prototype: the shader clamps per channel like the prototype, but the visual gate must
  confirm the numbers on screen (desktop 1440, tablet 1024).
