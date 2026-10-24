# Salon before state in the house clay style, palette board, contact shadows in the empty room — Implementation Plan

## Overview

The only slice of autonomous run `2026-10-24-salon-style` (non-roadmap fix change, no roadmap edit). Source: the
maintainer's "zrób salon w kodzie" (2026-10-24) after the read-only art review; pre-agreed decisions are
`context/runs/2026-10-24-salon-style/scope.md` items 1-8 (D0 in `change.md`); `research.md` answered every unknown with
prototype montages (R1-R8 in its handoff). This plan implements them and adds one decision of its own (the orchestrator's
concern, decision P-2 below):

- **Before state in the house style**: `furnishings-before` is no longer drawn (and the file is deleted). The before room is
  `architecture-before` + the whole `shadows` layer + the AFTER pieces (variant 0 of the nine slots the old picture covered,
  plus the right-plant decor) under a worn colour grade (research grade E), with an extra grade on the four soft
  furnishings (sofa, rug, armchair, pouf). No dust overlay. Nothing new animates.
- **Board**: the green around the diorama in both backgrounds becomes `#BCD799` (leafGreen 60 % over ivory) through a new
  pinned Python step of `npm run art`; the blurred task-screen backdrop follows.
- **Contact shadows**: code ellipses under lamp, left plant, pouf and right plant from the stage until the room is done.
- **Turquoise nudge**: not done (research R5).

**Save format stays v4** (`SAVE_VERSION` 4; `MIGRATIONS`, `validateSave`, `SAVE_KEYS`, every frozen fixture untouched).
No game logic, balance, cost, slot, variant, curriculum or player-facing text change (scope item 6). **A phase that finds
it must change what is saved, a balance value or child-facing text stops with `STATUS: BLOCKED`.**

## Current State Analysis

Grounded in `research.md` and `change.md` (their Code References are the source, not re-searched), spot-checked on this
branch at `acc2b12`:

- `src/ui/widgets/RoomView.ts` `RoomView.render`: `renovated = stagesDone > 0`; layer `scene` (before/after picture);
  while `!renovated` a `furnishings` layer from `room.scene.furnishingsBefore` at `ROOM_LAYOUT.depth.furnishingsBefore` (1);
  `shadows` only when `roomDone` at `depth.shadows` (2); decor and slots only after the stage, each at its own `z`
  (3..60). `RoomLayer.show(key, placement, depth, standIn | null)`: `null` = nothing when the texture is missing.
- `miniaturePieces` / `drawRoomMiniature` (same file) mirror the layers; `furnishingsBefore` and `shadows` enter with
  `alpha: 0` so `neededMiniatureKeys` (`src/core/artPick.ts`) ignores them. `SalonBackdrop.render` puts the images into an
  off-list `holder`, blurs it (WebGL only) and draws it into a DynamicTexture; `BackdropSnapshot` = `mode, captures,
  drawn, blurred, renderer, redraws`. `WelcomeScene` and `TaskScene` own a backdrop; a first launch shows the before salon.
- `src/scenes/RoomScene.ts` `fadeStage`: ghosts of `room.scene.before` and `room.scene.furnishingsBefore` tween to alpha 0
  over `ANIMATION.stageFadeMs`, returns at once under `prefersReducedMotion()`; ghosts are not tracked, `onSleep` does not
  stop them (final-art-salon F1). `RoomSnapshot` (e2e hook) has `shown` from `RoomView.shown()`.
- `src/core/types.ts` `RoomDef.scene: { before; after; furnishingsBefore; shadows }`; `src/data/roomArt.ts` `SCENE_FILES`
  derives `ROOM_ART` (boot queue, "Obrazki", `precacheCovers`, `roomArtCheck`); `scripts/make-task-art.mjs` `sceneFiles`
  and `ROOM_JOBS` shell out to `cwebp -q 85 -alpha_q 100 -m 6` only (no pixel access).
- Tests naming the old file: `tests/roomArt.test.ts` (38 files), `tests/layout.test.ts` (depth order), `tests/roomMiniature.test.ts`,
  `tests/roomShown.test.ts`, `tests/roomFixtures.ts`; e2e `tests/e2e/salon-load-health.spec.ts` `#15 H-2` stalls exactly
  `furnishings-before.webp`. `src/data/balance.ts` `loader` comment says "the largest file is 289 KB".
- Boot payload 2 378 800 B = 47.6 s at 50 KB/s against 48 s (`tests/bootBudget.test.ts`, 0.42 s headroom); after the
  change about 2 079 700 B (research § 7).
- Phaser 4.2.1: `image.enableFilters().filters?.internal.addColorMatrix()` returns a filter whose `.colorMatrix.set(arr20)`
  takes offsets in 0-255; internal filters run in list order (`renderer/webgl/renderNodes/Camera.js`, `internalFilters`
  loop from index 0); under Canvas `filters` is `null`; tint is WebGL-only. A DynamicTexture `draw` bakes filters (the
  backdrop blur already relies on it).
- `context/foundation/lessons.md` does not exist (nothing to apply).
- **Baseline** (contract): `main` `309e672`, unit `Tests  3915 passed`, e2e 160. Every phase measures its own branch
  baseline before its first edit and writes `baseline + delta`.

## Desired End State

- A fresh salon (welcome backdrop, task backdrop, room) shows the after furniture in a faded, matte grade on the worn
  background with its floor shadows; the soft furnishings are greyer than the wood. The room hook reports
  `worn.keys` = the ten keys below, `worn.graded: true`, `contactShadows: []`, `shown: {}`; no request for
  `furnishings-before.webp` is made (the file does not exist).
- Buying the stage cross-fades the before picture, the shadows and the graded pieces into the renovated room (not under
  reduced motion); then `worn.keys` = `[]` and `contactShadows` = `['lamp-table', 'plant-left', 'pouf', 'plant-right']`
  until the room is done, when the whole `shadows` layer takes over and `contactShadows` = `[]`.
- The board around the diorama is `#BCD799` with its lit gradient in both backgrounds; `npm run art` run twice leaves
  the tree unchanged.
- Hit areas, `shown`, `chosen`, costs and the save are unchanged; a missing worn texture shows nothing; `?e2eArt=room`
  still gives a playable stand-in room.

### Key Discoveries:

- The worn pieces never sit beside a bought piece: the whole worn set leaves at the stage (D2), so a per-piece grade
  needs no interplay with the variant panel or `chosen`.
- The worn pieces must stay outside `chosen` / `shownVariants` / `shownNow` (D3): hit tests, `RoomView.shown()` and the
  hook's `shown` keep their meaning.
- In the before state nothing else is drawn between the shadows and the worn set, so the worn images can keep their own
  `z` order on one depth band; the shadows layer must sit BELOW them (today `shadows` 2 is above `furnishingsBefore` 1).
- Per-image filters (one or two ColorMatrix filters on each worn image) give one code path for the room, the stage ghost
  and the backdrop capture; ten small framebuffers on a static screen shown only before the stage.
- No coffee-table variant lacks the vase and books (all three carry them, montage m12), so "a plainer table top" is not
  reachable through data.

## What We're NOT Doing

- No dust, stain or litter overlay (research R2, montages m2/m4); no paper/noise texture (scope item 5 optional).
- No turquoise nudge of `sofa-morska`, `ui/wallet-open`, `icons/cup` (research R5, montage m8).
- No new art, no edit of the salon thumbnail or the loading background (they still show curtains: follow-up).
- No change to slot geometry, hit areas, `holdPoint`, `slotAt`, costs, tasks, variants, `RoomState` or the save.
- No stand-in for a missing worn piece (the old worn layer had none; gap 172).
- No per-slot renewal (worn piece kept until its slot is bought) — D2 stays.
- No refactor of the stand-in drawers (final-art-salon F5/F7, VO2): re-recorded open.
- No roadmap status edit (non-roadmap change).

## Implementation Approach

Pure rules and data first, test-led (phase 1); the room scene draws them (phase 2); the miniature and the backdrop follow
and the old file goes away with everything that named it (phase 3); the art pipeline recolours the board (phase 4); docs,
follow-ups and the seam sweep (phase 5, the last impl phase); one e2e phase over the built feature (phase 6). Every phase
leaves the gate green: phase 2 keeps the old file in the boot queue (only no longer drawn) so `#15 H-2` stays green until
phase 3 retargets it.

## Critical Implementation Details

- **Filter order.** On a soft piece the soft matrix is added first and the worn matrix second (internal filters run from
  index 0), which equals the prototype's `apply_grade(apply_grade(img, soft), E)`.
- **Depth.** `ROOM_LAYOUT.depth.furnishingsBefore` is replaced by `worn` = 3 (above `shadows` 2, below outline 100); each
  worn image sits at `depth.worn + z / 1000` so the ten keep their `z` order. The stage ghost of the worn set sits at
  `depth.wornGhost` = 99 (above the new decor and slots, which it fades over), the shadows ghost at `depth.shadows + 0.1`.
- **Canvas renderer.** No filter is available: worn images are drawn ungraded and the room adds one translucent wash
  rectangle (`ROOM_LAYOUT.worn.canvasWash`) over the scene at `depth.worn + 0.5` in the before state only; the backdrop adds
  nothing (it is already washed ivory). `worn.graded` is then `false`.
- **Reduced motion.** No new tween anywhere; the worn ghost is part of the existing `fadeStage`, which returns first under
  `prefersReducedMotion()`.

## Phase 1: Worn grade and piece rules

Driver: tdd
Driver why: `gradeMatrix`, `wornPieces` and `contactShadowPieces` are absent pure rules with literal oracles from the prototype — failing tests lead.

### Overview

The colour-matrix rule, the worn set and the contact shadows as pure functions over room data, plus the data itself.
Nothing is drawn yet.

### Changes Required:

#### 1. Types

**File**: `src/core/types.ts`

**Intent**: room data can name the worn set and the contact shadows; a grade is data.

**Contract**: `export interface GradeParams { sepia: number; saturate: number; brightness: number; contrast: number; lift: number }`;
`export interface WornDef { piece: string; variant?: 0 | 1 | 2; soft?: boolean }` (`piece` = a slot id or a decor id;
`variant` only for slots, default 0); `export interface ContactShadowDef { piece: string; widthFactor: number; offset: readonly [number, number] }`;
`RoomDef` gains `worn: readonly WornDef[]` and `contactShadows: readonly ContactShadowDef[]`. `RoomDef.scene` keeps
`furnishingsBefore` in this phase (removed in phase 3).

#### 2. Pure rules

**File**: `src/core/colorGrade.ts` (new)

**Intent**: the 20 numbers Phaser's `ColorMatrix.set` takes, computed from data, so the scene holds no numbers.

**Contract**: `gradeMatrix(p: GradeParams): number[]` (length 20, rows R, G, B, A; offsets at 4, 9, 14, 19 in 0-255 units):
`M = contrast · brightness · Sat(saturate) · ((1 − sepia)·I + sepia·SEPIA)`, offset `(1 − contrast)·128 + lift` on R, G, B,
alpha row `[0, 0, 0, 1, 0]`; `Sat(v)` is Phaser's own (`x = 1 + 2v/3`, `y = −v/3`), `SEPIA` = Phaser's
`ColorMatrix.SEPIA` 3×3 (`0.393 0.769 0.189 / 0.349 0.686 0.168 / 0.272 0.534 0.131`). No Phaser import.

**File**: `src/core/rooms.ts`

**Intent**: what the before room shows and where the contact shadows go, outside `chosen` (D3).

**Contract**: `wornPieces(room, state): { id: string; key: string; x; y; width; height; z: number; soft: boolean }[]` —
empty when `stagesDone(room, state) > 0`; otherwise one entry per `room.worn` item, resolved against `room.slots`
(`variants[variant ?? 0]`) or `room.decor` (`key`), sorted by `z`; an unknown piece id throws (data error). 
`contactShadowPieces(room, state): { id: string; cx: number; cy: number; width: number; height: number }[]` — empty when
`stagesDone === 0` or `roomDone`; otherwise one per `room.contactShadows` item whose piece is shown now (a decor piece
always; a slot when `shownVariant(room, state, id) !== null`), in data order: `cx = x + anchor[0] + offset[0]`,
`cy = y + anchor[1] + offset[1]`, `width = visibleRect[2] · widthFactor`, `height = width · heightRatio` (the ratio is a
parameter: `contactShadowPieces(room, state, heightRatio)`, the caller passes `ROOM_LAYOUT.contactShadow.heightRatio`).

#### 3. Data

**File**: `src/data/rooms.ts` — `SALON.worn` (z order): `wall-frames`, `rug` (soft), `cabinet`, `lamp-table`, `plant-left`,
`sofa` (soft), `plant-right`, `armchair` (soft), `coffee-table`, `pouf` (soft), all variant 0 (comment: the variant is the
maintainer's lever, DESIGN-GAP 169). `SALON.contactShadows`: `lamp-table` 0.75 (8, −6), `plant-left` 0.55 (8, −6),
`pouf` 0.95 (8, −6), `plant-right` 0.60 (8, −8) (DESIGN-GAP 171).

**File**: `src/data/layout.ts` — `ROOM_LAYOUT.worn = { grade: { sepia: 0.20, saturate: -0.30, brightness: 0.90, contrast:
0.90, lift: 4 }, soft: { sepia: 0.10, saturate: -0.35, brightness: 0.95, contrast: 1, lift: 0 }, canvasWash: { colour:
<PAGE_BACKGROUND as number>, alpha: 0.30 } }`; `ROOM_LAYOUT.contactShadow = { colour: 0x5f462b, alpha: 0.25, rings: 8,
heightRatio: 0.32 }` (colour and peak alpha measured from the pack's `shadows` layer, DESIGN-GAP 171). Depth unchanged in
this phase.

**File**: `tests/roomFixtures.ts`, `tests/roomShown.test.ts` — the `RoomDef` literals gain `worn: []`, `contactShadows: []`.

#### 4. Tests

**Files**: `tests/colorGrade.test.ts`, `tests/roomWorn.test.ts` (new)

**Contract**: `gradeMatrix(ROOM_LAYOUT.worn.grade)` equals, to 1e-4,
`[0.5794,0.1842,0.0941,0,16.8, 0.1208,0.6284,0.0918,0,16.8, 0.1121,0.1576,0.5412,0,16.8, 0,0,0,1,0]` and
`gradeMatrix(ROOM_LAYOUT.worn.soft)` equals `[0.691,0.1693,0.1168,0,0, 0.1325,0.7199,0.1155,0,0, 0.1278,0.1548,0.669,0,0,
0,0,0,1,0]` (both from the research prototype's `grade_matrix`, not from the code); identity params → identity matrix.
`wornPieces(SALON, fresh)` keys = `['salon/wall-frames','salon/rug','salon/cabinet','salon/lamp-table','salon/plant-left',
'salon/sofa-morska','salon/plant-right','salon/armchair','salon/coffee-table','salon/pouf']`, soft ids exactly sofa, rug,
armchair, pouf; `[]` after the stage; a worn entry with `variant: 1` on `sofa` gives `salon/sofa-sloneczna`; an unknown
piece throws. `contactShadowPieces(SALON, state, 0.32)`: fresh → `[]`; after the stage → ids `['lamp-table','plant-left',
'pouf','plant-right']`, lamp `{ cx: 897, cy: 487, width: 155.25, height: 49.68 }`, plant-left `{ cx: 223, cy: 653,
width: 141.9 }`, pouf `{ cx: 605, cy: 932, width: 233.7 }`, plant-right `{ cx: 1778, cy: 737, width: 127.2 }` (hand-computed
from `SALON` geometry); bought lamp variant 1 → lamp still listed; done room → `[]`. `wornPieces` never returns a piece
listed in `shownVariants` for any state (property over every `tasksDone`).

### Success Criteria:

#### Automated Verification:

- New cases red against stubs (`gradeMatrix` returns identity, both piece rules return `[]`), green after; unit `<branch baseline> + N`
- Deliberate break: swap the sepia and saturate order in `gradeMatrix` → the literal-matrix case red; drop the `stagesDone > 0` guard in `wornPieces` → the after-stage case red; use `x` without `anchor` in `contactShadowPieces` → the literal-coordinate case red; each restored; meta-check: the matrices come from the prototype script and the coordinates are hand-computed from `src/data/rooms.ts` numbers, not from the code under test
- `git diff --stat main -- src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum src/data/pl.ts` empty
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 2: The room draws the worn set, the shadows and the contact shadows

Driver: impl
Driver why: widget and scene glue over phase 1's rules — the risk is in the rendered canvas, proven by source guards and the Phaser pin here and by the phase-6 e2e.

### Overview

`RoomView` stops drawing `furnishings-before` and draws the graded worn images, the whole `shadows` layer before the stage
and the contact-shadow ellipses after it; `fadeStage` ghosts the new before state; the ghosts stop on sleep (F1); the
room hook reports what was drawn.

### Changes Required:

#### 1. Grade helper

**File**: `src/ui/wornGrade.ts` (new)

**Intent**: one place that grades a worn image, used by the room, the stage ghost and (phase 3) the miniature.

**Contract**: `applyWornGrade(scene: Scene, image: GameObjects.Image, soft: boolean): boolean` — under WebGL adds to
`image.enableFilters().filters?.internal` first (soft only) a ColorMatrix set to `gradeMatrix(ROOM_LAYOUT.worn.soft)`,
then one set to `gradeMatrix(ROOM_LAYOUT.worn.grade)`; returns true when the worn filter was added; under Canvas returns
false and touches nothing.

#### 2. Room view

**File**: `src/ui/widgets/RoomView.ts` `RoomView.render`

**Intent**: the before room in the house style; grounded pieces after the stage.

**Contract**: no `furnishings` layer any more. Before the stage: `shadows` layer at `depth.shadows` (also when the room
is done, as today), then one image per `wornPieces(room, state)` entry whose texture exists, at `depth.worn + z / 1000`,
graded through `applyWornGrade`; a missing worn texture is skipped (no stand-in, gap 172); under Canvas one wash rectangle
(`ROOM_LAYOUT.worn.canvasWash`) at `depth.worn + 0.5`. After the stage and before `roomDone`: one Graphics at
`depth.shadows` with `contactShadowPieces(room, state, ROOM_LAYOUT.contactShadow.heightRatio)` drawn as `rings` concentric
ellipses whose alpha rises to `alpha` at the centre (works on both renderers). Worn images and the ellipse Graphics are
recreated or cleared on every `render`; `shownNow` / `shown()` unchanged. New `wornState(): { keys: string[]; graded: boolean }`
(keys drawn at the last render; `graded` = every drawn image graded and at least one drawn) and `contactShadowIds(): string[]`.
A `buildWorn(scene, room, state, depth)` export returns the graded images for `fadeStage` (same code as `render`).
Class comment updated (before state = graded after pieces, DESIGN-GAP 169/171).

**File**: `src/data/layout.ts` — `ROOM_LAYOUT.depth`: `furnishingsBefore` replaced by `worn: 3`, plus `wornGhost: 99`.
`tests/layout.test.ts` depth-order case follows (worn above shadows, below outline; `wornGhost` below `outline`).

#### 3. Stage cross-fade and sleep

**File**: `src/scenes/RoomScene.ts`

**Intent**: the stage purchase fades the whole before state into the renewed room; ghosts never outlive a visit (F1).

**Contract**: `fadeStage` (still returns first under `prefersReducedMotion()`) ghosts `room.scene.before` at
`depth.scene + 0.1`, `room.scene.shadows` at `depth.shadows + 0.1`, and the images of `buildWorn(...)` for the fresh state
at `depth.wornGhost + z / 1000`; all tween to alpha 0 over `ANIMATION.stageFadeMs` (`Sine.easeInOut`) and are destroyed on
complete. Ghosts and their tweens are kept in a private list; `onSleep` and the `shutdown` block complete/destroy them and
empty the list. `RoomSnapshot` gains `worn: { keys: string[]; graded: boolean }` and `contactShadows: string[]` from the
view. `tests/e2e/support/hook.ts` `Snapshot.room` gains the same two fields.

#### 4. Pins and guards

**File**: `tests/phaserLoaderPin.test.ts` — pin from Phaser 4.2.1 source: `Camera.js` runs `internalFilters` from index 0
upward; `ColorMatrix#set` stores the array and `getData` divides indices 4, 9, 14, 19 by 255.

**File**: `tests/salonStyleWiring.test.ts` (new) — `RoomView.ts` contains no `furnishingsBefore`; calls `applyWornGrade(` and
`contactShadowPieces(`; `RoomScene.ts` `fadeStage` body starts with the `prefersReducedMotion()` return and calls
`buildWorn(`; the `onSleep` body clears the ghost list; `wornGrade.ts` adds the soft matrix before the worn one.

### Success Criteria:

#### Automated Verification:

- `tests/salonStyleWiring.test.ts`, `tests/phaserLoaderPin.test.ts`, `tests/layout.test.ts` green; unit `<phase-1 count> + N`
- Deliberate break: put the `furnishings` layer back into `render` → the wiring case red; add the worn matrix before the soft one → the order case red; drop the ghost clean-up from `onSleep` → its case red; each restored; meta-check: these are source guards and a pin of Phaser's own source; the drawn result is proven by phase 6 and the visual gate
- `grep -rn "furnishingsBefore" src/ui src/scenes` empty
- `tests/reducedMotionWiring.test.ts` and `tests/motionWiring.test.ts` green unchanged (no new tween outside `fadeStage`)
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`salon-load-health.spec.ts` `#15 H-2` still green: the old file is still in the boot queue; `salon-art.spec.ts` and `room-purchase.spec.ts` unchanged)

---

## Phase 3: Miniature and backdrop follow; the old worn picture is gone

Driver: impl
Driver why: shared drawing helpers, a data/type removal and the tests and e2e target that named the file — glue over phases 1-2, proven by unit tests on `miniaturePieces` and by phase 6.

### Overview

`miniaturePieces` carries the worn set (so the welcome and task backdrops show the graded before salon);
`furnishingsBefore` leaves the type, the data, `ROOM_ART`, the art script and the disk; every test that named it follows;
`#15 H-2` stalls `shadows.webp` instead.

### Changes Required:

#### 1. Miniature and backdrop

**File**: `src/ui/widgets/RoomView.ts` `miniaturePieces`, `drawRoomMiniature`

**Intent**: the blurred backdrop shows what the room shows.

**Contract**: `MiniaturePiece` gains `worn?: { soft: boolean }`. Before the stage: scene picture, `shadows` (`alpha: 0`),
then the `wornPieces` entries with `alpha: 0` (so `neededMiniatureKeys` and the "Pokój gotowy!" miniature mode stay
unchanged) and `worn` set; no `furnishingsBefore`. `drawRoomMiniature` grades each worn image it adds through
`applyWornGrade` (WebGL only; nested inside the backdrop holder, the DynamicTexture draw bakes both the per-image grade and
the holder blur). After the stage nothing changes (no contact shadows in the miniature: decision P-7).

**File**: `src/ui/widgets/SalonBackdrop.ts` — `BackdropSnapshot` gains `graded: number` (worn images graded in the last
capture; `plainBackdropSnapshot` 0), counted in `render` over the images `drawRoomMiniature` returned that carry an
internal filter (the blur sits on the holder, not on the images). No other change to `render` (the grading happens inside
`drawRoomMiniature`).
`tests/e2e/support/hook.ts` `Snapshot.backdrop` copy gains `graded`.

#### 2. Removal

**Files**: `src/core/types.ts` (`RoomDef.scene` = `{ before; after; shadows }`), `src/data/rooms.ts` (`SALON.scene`),
`src/data/roomArt.ts` (`SCENE_FILES` without `furnishingsBefore`), `scripts/make-task-art.mjs` (`sceneFiles` without
`furnishings-before`), `git rm public/assets/rooms/salon/furnishings-before.webp`, `src/scenes/RoomScene.ts` (no reference
left), `src/data/balance.ts` (`loader` comment: largest file and payload numbers re-measured from `tests/bootBudget.test.ts`'s
sum; numbers unchanged).

**Tests**: `tests/roomArt.test.ts` (`toHaveLength(37)`; file-set equality holds), `tests/roomMiniature.test.ts` (before keys =
`[before, shadows, ...the ten worn keys]`, `worn` flags, `alpha: 0`; after-stage case unchanged), `tests/roomShown.test.ts`
and `tests/roomFixtures.ts` (`scene` literal without `furnishingsBefore`), `tests/bootBudget.test.ts` unchanged and green.

**E2E**: `tests/e2e/salon-load-health.spec.ts` `#15 H-2` routes `**/assets/rooms/salon/shadows.webp` (a whole-scene file with
no stand-in, still queued at boot) instead of the removed file; assertions unchanged (research R8).

### Success Criteria:

#### Automated Verification:

- `tests/roomMiniature.test.ts`, `tests/roomArt.test.ts`, `tests/roomShown.test.ts`, `tests/bootBudget.test.ts` green; unit `<phase-2 count> + N`
- Deliberate break: give the worn miniature pieces `alpha: 1` → `roomMiniature` (and the `neededMiniatureKeys` case) red; restore `furnishings-before` in `sceneFiles` without the file → `roomArt` red; each restored; meta-check: the expected key lists are literals from `SALON` data, not built by `miniaturePieces`
- `grep -rn "furnishingsBefore\|furnishings-before" src scripts tests` empty; `test -e public/assets/rooms/salon/furnishings-before.webp` fails
- `git diff --stat main -- src/core/save.ts tests/fixtures src/core/migrations` empty
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`#15 H-2` green on `shadows.webp`; `notebook-polish.spec.ts` and `backdrop-restore.spec.ts` backdrop cases green with the grown record)

---

## Phase 4: Board recolour in the art pipeline

Driver: impl
Driver why: a build-time image tool with committed outputs; the proof is determinism and byte checks, not a failing unit test.

### Overview

A pinned Python step recolours the green board of both backgrounds to `#BCD799`; `npm run art` calls it and cwebp encodes
the result as before.

### Changes Required:

#### 1. Recolour script

**File**: `scripts/recolour-board.py` (new; mirror `scripts/make-font.py`)

**Intent**: deterministic board recolour with a colour mask and a spill-corrected rim (research § 4).

**Contract**: `python3 scripts/recolour-board.py <in.png> <out.png> <#RRGGBB>`. At start it checks
`PIL.__version__ == '12.1.0'` and `numpy.__version__ == '2.4.3'` (`PINNED_PILLOW`, `PINNED_NUMPY`) and otherwise exits
non-zero with `pip install pillow==12.1.0 numpy==2.4.3` in the message (like `PINNED_FONTTOOLS`). Mask: HSV hue 95°-165°
and saturation > 0.30, flood-filled from the frame edges only (window trees untouched). Recolour: local board colour by a
normalised Gaussian blur (radius 6), target = colour × (L / mean L)^0.5, rim pixels within a 3 px dilation shifted by
`w · (target − local board)` with `w` from the colour distance to the local board. Writes a PNG (no metadata, fixed
compression) so two runs are byte-identical. Ported from the research prototype `board2.py` `recolour2` (scratchpad);
the header comment names DESIGN-GAP 170 and the colour's derivation (leafGreen `#90C36A` 60 % over ivory `#FFF5DF`).
How deps are installed and run: like `npm run font` — the maintainer's local `python3` with
`pip install pillow==12.1.0 numpy==2.4.3`; CI never runs `npm run art`; outputs are committed.

#### 2. Pipeline

**File**: `scripts/make-task-art.mjs`

**Intent**: the two background jobs go through the recolour before cwebp; every other job is unchanged.

**Contract**: a `BOARD_COLOUR = '#BCD799'` constant; for `architecture-before` and `architecture-after` the job runs
`execFileSync('python3', ['scripts/recolour-board.py', source, tmpPng, BOARD_COLOUR])` into a temp file under
`os.tmpdir()` and encodes that file with the same cwebp arguments; a Python failure stops the script with its message.
Header comment adds the Python requirement. `package.json` unchanged (`npm run art`).

#### 3. Outputs

**Files**: `public/assets/rooms/salon/architecture-before.webp`, `public/assets/rooms/salon/architecture-after.webp`
regenerated by `npm run art`; nothing else under `public/` changes.

### Success Criteria:

#### Automated Verification:

- `npm run art` run once: `git status --porcelain public/` lists exactly the two background files; run again: `git status --porcelain public/` unchanged and `cmp` of each file against a copy from the first run identical
- Deliberate break: run `scripts/recolour-board.py` under a fake version (`PINNED_PILLOW = '0.0.0'` edited locally) → exits non-zero with the pip line; restored; meta-check: proves the pin, not the image (the image is judged by the visual gate)
- `tests/roomArt.test.ts` (headers and sizes) and `tests/bootBudget.test.ts` green; the boot payload sum printed by a one-off `node -e` over `ROOM_ART`/`TASK_ART`/`UI_ART` sizes is below 48 s at 50 KB/s and recorded in the handoff
- `grep -n "PINNED_PILLOW\|PINNED_NUMPY" scripts/recolour-board.py` present; `grep -n "recolour-board.py" scripts/make-task-art.mjs` present
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

---

## Phase 5: Docs, follow-ups, seam sweep

Driver: impl
Driver why: rule-file text, inventory and gap rows, follow-ups and leftovers over phases 1-4 — docs and glue.

### Overview

Gap rows, inventory, CLAUDE.md, follow-ups with triggers, the sweep, and the manual acceptance rows.

### Changes Required:

#### 1. Inventory and gaps

**File**: `docs/design-gaps.md` — new rows 169 (worn look: grade numbers, the soft extra, no dust overlay, Canvas wash;
`SALON.worn` variant is the lever), 170 (board `#BCD799`, leafGreen 60 % over ivory, not a kit token, made by
`scripts/recolour-board.py`), 171 (contact shadows for fixed decoration: code ellipses, colour and peak alpha from the
pack's `shadows` layer, shown from the stage until the room is done), 172 (a missing worn-piece texture shows nothing);
row 107 amended (the before room is drawn from the after pieces graded, plus the whole `shadows` layer), row 109 amended
(the cross-fade fades the before picture, the shadows and the graded pieces).

**File**: `docs/art-inventory.md` — the "Styl salonu" row updated (2026-10-24: before state drawn in code from the after
furniture; `furnishings-before` no longer used; board recoloured), the salon file count 37, the `npm run art` Python
requirement. Polish like the rest of the file.

#### 2. Rule files

**File**: `CLAUDE.md` "Current state" (and `AGENTS.md` only if it repeats the facts — grep first)

**Intent**: one or two sentences in the existing style, e.g.: Salon style (change salon-style; save format stays v4): the
before salon is `architecture-before` + `shadows` + the after pieces listed in `SALON.worn` (variant 0, `wornPieces` in
`src/core/rooms.ts`) under a worn ColorMatrix (`gradeMatrix` in `src/core/colorGrade.ts`, numbers in
`ROOM_LAYOUT.worn`, an extra grade on soft furnishings, applied by `applyWornGrade` in `src/ui/wornGrade.ts` in the room,
the stage ghost and the backdrop miniature, WebGL only), `furnishings-before` is gone (37 salon files), contact shadows
under lamp, plants and pouf from the stage until the room is done (`contactShadowPieces`), the board around the diorama is
`#BCD799` from `scripts/recolour-board.py` (pinned Pillow 12.1.0 + numpy 2.4.3, called by `npm run art`), and the room hook
reports `worn` and `contactShadows`. Fix sentences made untrue (S-16a's "the first renovation task is a background stage
... `furnishings-before`" wording, the "26 WebP files"/"38 files" counts if stated as current, the `npm run art` command
line: add the Python requirement).

#### 3. Seam sweep

**Intent**: no second grade path (`addColorMatrix` only in `src/ui/wornGrade.ts`); no `furnishingsBefore` anywhere in
`src`, `tests`, `scripts`; no `depth.furnishingsBefore`; no grade or shadow number in a scene or widget (all from
`ROOM_LAYOUT`); stale comments (`RoomView` class and `miniaturePieces` docs, `RoomLayer` comment if it names the worn
layer, `SalonBackdrop` class comment, `balance.loader` comment, `roomArt.ts` header "26/38 files"); the hook type copy in
`tests/e2e/support/hook.ts` matches `RoomSnapshot` and `BackdropSnapshot`.

#### 4. Follow-ups

**File**: `context/changes/salon-style/follow-ups/review-fixes.md` (new)

**Intent**: one entry per deferred item, each with a `Trigger:` line: salon thumbnail and loading background still show
curtains (Trigger: the author delivers new UI art or a room list with not-done rooms); a proper "before" picture from the
author (Trigger: the maintainer rejects the worn before state at `[human]` 5.6); Canvas renderer before state is ungraded
with a wash (Trigger: a Canvas-renderer report); turquoise nudge (Trigger: a maintainer request); per-image filter cost
(Trigger: a tablet frame-rate report on the first room screen); the change.md table carried items re-recorded with their
status: final-art-salon F1 closed (folded in phase 2), F2 open (worn pieces get no stand-in, not needed), salon-extra-slots
F2 (curtain clip) open, VO2 / F5 / F7 open, L-7 closed (worn state in the room snapshot), L-R8 / L-R11 open except `onSleep`
(folded), salon-load-health M-6 second half open, per-file timeout test open, fox-guide F4 closed by headroom (record the new
number), texture atlas open, gap 109 follow-up open, GPU memory note (one full-scene texture fewer), "a done salon loses
its shadows" open (whole layer logic at `roomDone` unchanged), audit-backdrop-fox F6 `isSalonPixel` open (render not edited),
notebook-polish 16 open, first-furniture-purchase V1 closed-by-history, L-4 open.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -n "wornPieces\|recolour-board" CLAUDE.md` present
- `grep -n "^| 169 \|^| 170 \|^| 171 \|^| 172 " docs/design-gaps.md` four rows; `grep -n "^| 107 " docs/design-gaps.md` no longer says the room is `furnishings-before`
- `grep -c "Trigger:" context/changes/salon-style/follow-ups/review-fixes.md` ≥ 5
- `grep -rn "addColorMatrix" src` lists only `src/ui/wornGrade.ts`; `grep -rn "furnishingsBefore\|furnishings-before" src tests scripts CLAUDE.md` empty
- Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual Verification:

- [human] Accept the worn before state, or ask the author for a proper before picture: the code version shows the after furniture faded (same rug, the coffee table keeps its vase of flowers and books: no variant without them exists, montage m12); judge on the [visual] frames "room before" and "stage purchase (cross-fade)" (1440 and 1024) beside the old before (research montage m9 "NOW: before") (orchestrator concern; decision P-2)
- [human] Accept the grade stronger than scope item 2's "about −25 % saturation, light sepia, about −8 % brightness": research grade E (−30 %, sepia 0.20, brightness 0.90, contrast 0.90, lift +4) plus an extra grade on sofa, rug, armchair, pouf (−35 %, sepia 0.10, brightness 0.95), and NO dust/wear overlay (scope item 2 names one) (decisions P-1, P-2)
- [human] Accept the turquoises not nudged (scope item 4 optional; side-by-side m8 showed no clear gain) (decision P-5)
- [human] Accept the board colour `#BCD799` (not a kit token) and a pinned Python step (Pillow 12.1.0 + numpy 2.4.3) inside `npm run art` (decision P-4)
- [visual] Hook build on 4399, desktop 1440 and tablet 1024: room before state (fresh device); the stage purchase mid cross-fade and after it; after-stage empty room with contact shadows under lamp, left plant, pouf and right plant; first furniture purchase (sofa); a finished room (whole shadows layer, no ellipses); the task-screen backdrop for a before salon and for an after salon; the welcome backdrop (fresh device); the room with `?e2eArt=room` (stand-ins, no worn pieces, no crash) — beside the art review's comparison of the after furniture and research montage m9
- [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in an earlier `check` log: `Tests  3915 passed (3915)`, `e2e hook: absent (2 chunks checked)`)

---

## Phase 6: The before salon is graded and the after room is grounded — e2e (#16, #12)

Driver: e2e
Driver why: the drawn before state, the stage swap and the backdrop capture exist only in the rendered canvas (risk #16 room purchase by touch, #12 first launch behind the welcome backdrop); built by phases 2-3, contract `E2E=on`.

### Overview

One new spec `tests/e2e/salon-style.spec.ts` (hook build, port 4397).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/salon-style.spec.ts` (titles `#16 …` / `#12 …`); model on `salon-art.spec.ts`,
`room-purchase.spec.ts` and `support/{hook,welcome}.ts`; fresh device = new browser context; reach the room as profile § 9
says (answer the open task first, then `roomSwitch`); stars through `?e2eStars=N` on a fresh start.
- `#12 salon-style the welcome backdrop of a fresh device is the graded worn salon` — on the welcome:
  `backdrop.mode === 'salon'`, `graded === 10`, `blurred`; a `page.on('request')` list has no URL containing
  `furnishings-before`.
- `#16 salon-style a fresh salon shows the worn set graded and nothing interactive` — in the room: `worn.keys` equals the
  ten-key literal of phase 1, `worn.graded === true`, `contactShadows` `[]`, `shown` `{}`, `chosen` `{}`.
- `#16 salon-style after the stage the worn set is gone and the fixed pieces stand on contact shadows` — buy the stage:
  `worn.keys` `[]`, `contactShadows` `['lamp-table','plant-left','pouf','plant-right']`; buy the sofa ("Wybieram"):
  `contactShadows` unchanged, `shown.sofa === 0`; back on the task screen `backdrop.graded === 0`.
- `#16 salon-style with no salon pictures the before room draws no worn piece and the stage still sells` — `?e2eArt=room`:
  `worn.keys` `[]`, `graded === false`; the stage is bought for its cost once.
No `sleep`/`until`/`while` loops or `tail -f` waiters (profile § 8); waits through `expect.poll`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`: return `[]` from `wornPieces` → the fresh-salon test red; keep the worn set after the stage (drop the `stagesDone` guard) → the stage test red; skip `applyWornGrade` in `drawRoomMiniature` → the welcome test red on `graded`; each restored), green after
- `npx playwright test tests/e2e/salon-style.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 4`; total equals `npx playwright test --list | tail -1`
- Full local gate green

---

## Testing Strategy

### Unit Tests:

- `gradeMatrix` literal matrices from the prototype; `wornPieces` keys, soft ids, variant lever, unknown id; 
  `contactShadowPieces` literal coordinates and state gates; worn never in `shownVariants` (phase 1).
- Source guards for the room wiring, filter order, `onSleep` ghost clean-up; Phaser pin of filter order and `set` offsets
  (phase 2); `miniaturePieces` before keys and flags, `roomArt` 37 files, boot budget (phase 3).

### Integration Tests:

- `tests/e2e/salon-style.spec.ts` (four tests, risks #16/#12); `salon-load-health.spec.ts` `#15 H-2` retargeted.

### Manual Testing Steps:

1. Fresh device: welcome backdrop and room show the faded after furniture on the worn background, no litter.
2. Buy the stage: one cross-fade into the empty room; lamp, plants and pouf stand on soft shadows.
3. Finish the room: ellipses gone, whole shadows layer; board pale green everywhere.

## Performance Considerations

Before the stage: ten filtered images (four with two filters), each its own framebuffer the size of its picture, on a
static screen; after the stage no filter. Boot payload drops by about 299 KB (≈ 6 s at 50 KB/s); one full-scene RGBA
texture (≈ 8 MB GPU) fewer.

## Migration Notes

None: save format stays v4; `RoomDef.scene` loses a texture key, no saved field names a texture.

## Known risks

- WebGL output vs the Pillow prototype (per-channel clamp alike; premultiplied alpha at piece edges may darken rims
  slightly): the visual gate decides; numbers live in `ROOM_LAYOUT.worn`.
- Per-image filters inside the backdrop's blurred holder (nested filters baked by one DynamicTexture draw): proven by the
  `graded` count and the welcome frame; if a frame shows the worn pieces ungraded, phase 3 moves the grade to a graded
  sub-container of the holder (same matrices).
- `#15 H-2` on `shadows.webp`: a stalled whole-scene file has no stand-in, so the count assertion is the only signal (as
  before with the removed file).
- The before state may still read as "faded new" rather than "old" for a child (orchestrator concern): `[human]` 5.6.

## Autonomous decisions

- **P-1 Grade E, not scope A** (research R1): A left the sofa cyan; E is faded and matte. **Departs from scope item 2's
  numbers** → `[human]` 5.7. Would change: the visual gate showing E too grey or too weak on WebGL.
- **P-2 Extra grade on soft furnishings (orchestrator concern)**: sofa, rug, armchair, pouf get a second matrix
  (sat −0.35, sepia 0.10, brightness 0.95) before grade E; montage m13 (scratchpad `m13-worn-levers.png`, B) shows the
  sofa grey-teal and the rug khaki against the vivid bought pieces, a clearly larger purchase step than E alone. Considered
  and rejected: a plainer coffee-table top (no variant without the vase exists, m12); dropping the coffee table (its slot
  loses its before → after); dropping the wall frames (m13 C: emptier but the old picture had frames and the hang-frames task
  would show nothing to replace); a non-v0 variant per worn slot (lamp, left plant, pouf must keep their shape across the
  stage; the others gain nothing predictable since the child picks any variant) — kept as the `SALON.worn[].variant` data
  lever. A dust overlay stays rejected (R2). → `[human]` 5.6, 5.7. Would change: the maintainer rejecting the worn look
  (then the author's before picture, follow-up).
- **P-3 Per-image filters, not one filtered container** (research proposed a container): one helper serves the room, the
  ghost and the backdrop, the soft extra needs per-image filters anyway, and z order stays per image. Rejected: a container
  per strength (breaks z order between rug, table and sofa). Would change: a frame-rate report on the first room screen.
- **P-4 Board `#BCD799` through a pinned Python step** (research R4; `make-font.py` precedent). → `[human]` 5.9. Would
  change: the maintainer refusing Python in `npm run art` (then pngjs).
- **P-5 Turquoise not nudged** (research R5). Scope item 4 is optional → `[human]` 5.8. Would change: a maintainer request.
- **P-6 Contact shadows as code ellipses from the stage until `roomDone`** (research R6, D4). Would change: per-piece
  shadows from the author.
- **P-7 No contact shadows in the backdrop miniature**: blurred at quarter scale they are invisible; the miniature keeps
  its existing layers after the stage. Would change: the visual gate showing floating pieces in the after-salon backdrop.
- **P-8 A missing worn texture shows nothing** (research R7; the old worn layer had no stand-in). Would change: the
  maintainer wanting stand-ins.
- **P-9 Six phases**: research's five plus a split of its scene phase into room (2) and miniature + removal (3), so the old
  file stays queued while the room stops drawing it and `#15 H-2` is retargeted in the same phase that removes it. Would
  change: per-phase overhead dominating.
- **P-10 Hook fields** `room.worn`, `room.contactShadows`, `backdrop.graded` (runtime only, e2e build reads them; L-7
  closed). Would change: a spec needing per-piece filter state.
- **P-11 e2e risks** #16 (room purchase) and #12 (first launch with the welcome backdrop). Would change: the test plan adding
  a rendering risk.
- **P-12 Content teacher read not applicable**: `src/data/` changes are room geometry and colour numbers, no task,
  curriculum or word content. Would change: any edit of `pl.ts`, curriculum or templates (none planned).

## References

- Research: `context/changes/salon-style/research.md`; identity `context/changes/salon-style/change.md`
- Scope: `context/runs/2026-10-24-salon-style/scope.md`; art review `context/runs/2026-10-24-salon-style/art-review/raport.md`
- Prototype montages (scratchpad, not committed): `m9-proposed-flow.png`, `m12-variants.png`, `m13-worn-levers.png`,
  `board2.py`, `proto.py` in `/private/tmp/claude-501/-Users-kamilp-Dev-Martynka-urzadza/99d35901-8f35-42fa-8afe-0717b608b676/scratchpad/salon-style/`
- Format example: `context/archive/2026-10-24-audit-backdrop-fox/plan.md`
- Code: `src/ui/widgets/RoomView.ts` (`RoomView.render`, `miniaturePieces`, `drawRoomMiniature`), `src/ui/widgets/RoomLayer.ts`,
  `src/ui/widgets/SalonBackdrop.ts` (`render`, `BackdropSnapshot`), `src/scenes/RoomScene.ts` (`fadeStage`, `onSleep`,
  `snapshot`, `RoomSnapshot`), `src/core/rooms.ts` (`stagesDone`, `roomDone`, `shownVariant`, `shownVariants`),
  `src/core/artPick.ts` (`neededMiniatureKeys`), `src/core/types.ts` (`RoomDef`), `src/data/rooms.ts` (`SALON`),
  `src/data/roomArt.ts` (`SCENE_FILES`), `src/data/layout.ts` (`ROOM_LAYOUT`), `scripts/make-task-art.mjs`,
  `scripts/make-font.py`, `node_modules/phaser/src/display/ColorMatrix.js`, `node_modules/phaser/src/renderer/webgl/renderNodes/Camera.js`
- Docs: `docs/design-gaps.md` rows 107, 109; `docs/art-inventory.md` "Styl salonu"
- Test plan: `context/foundation/test-plan.md` risks #12, #16

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Worn grade and piece rules

#### Automated

- [ ] 1.1 New cases red against stubs (`gradeMatrix` returns identity, both piece rules return `[]`), green after; unit `<branch baseline> + N`
- [ ] 1.2 Deliberate break: swap the sepia and saturate order in `gradeMatrix` → the literal-matrix case red; drop the `stagesDone > 0` guard in `wornPieces` → the after-stage case red; use `x` without `anchor` in `contactShadowPieces` → the literal-coordinate case red; each restored; meta-check: the matrices come from the prototype script and the coordinates are hand-computed from `src/data/rooms.ts` numbers, not from the code under test
- [ ] 1.3 `git diff --stat main -- src/core/save.ts tests/fixtures src/data/balance.ts src/data/curriculum src/data/pl.ts` empty
- [ ] 1.4 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

### Phase 2: The room draws the worn set, the shadows and the contact shadows

#### Automated

- [ ] 2.1 `tests/salonStyleWiring.test.ts`, `tests/phaserLoaderPin.test.ts`, `tests/layout.test.ts` green; unit `<phase-1 count> + N`
- [ ] 2.2 Deliberate break: put the `furnishings` layer back into `render` → the wiring case red; add the worn matrix before the soft one → the order case red; drop the ghost clean-up from `onSleep` → its case red; each restored; meta-check: these are source guards and a pin of Phaser's own source; the drawn result is proven by phase 6 and the visual gate
- [ ] 2.3 `grep -rn "furnishingsBefore" src/ui src/scenes` empty
- [ ] 2.4 `tests/reducedMotionWiring.test.ts` and `tests/motionWiring.test.ts` green unchanged (no new tween outside `fadeStage`)
- [ ] 2.5 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`salon-load-health.spec.ts` `#15 H-2` still green: the old file is still in the boot queue; `salon-art.spec.ts` and `room-purchase.spec.ts` unchanged)

### Phase 3: Miniature and backdrop follow; the old worn picture is gone

#### Automated

- [ ] 3.1 `tests/roomMiniature.test.ts`, `tests/roomArt.test.ts`, `tests/roomShown.test.ts`, `tests/bootBudget.test.ts` green; unit `<phase-2 count> + N`
- [ ] 3.2 Deliberate break: give the worn miniature pieces `alpha: 1` → `roomMiniature` (and the `neededMiniatureKeys` case) red; restore `furnishings-before` in `sceneFiles` without the file → `roomArt` red; each restored; meta-check: the expected key lists are literals from `SALON` data, not built by `miniaturePieces`
- [ ] 3.3 `grep -rn "furnishingsBefore\|furnishings-before" src scripts tests` empty; `test -e public/assets/rooms/salon/furnishings-before.webp` fails
- [ ] 3.4 `git diff --stat main -- src/core/save.ts tests/fixtures src/core/migrations` empty
- [ ] 3.5 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0` (`#15 H-2` green on `shadows.webp`; `notebook-polish.spec.ts` and `backdrop-restore.spec.ts` backdrop cases green with the grown record)

### Phase 4: Board recolour in the art pipeline

#### Automated

- [ ] 4.1 `npm run art` run once: `git status --porcelain public/` lists exactly the two background files; run again: `git status --porcelain public/` unchanged and `cmp` of each file against a copy from the first run identical
- [ ] 4.2 Deliberate break: run `scripts/recolour-board.py` under a fake version (`PINNED_PILLOW = '0.0.0'` edited locally) → exits non-zero with the pip line; restored; meta-check: proves the pin, not the image (the image is judged by the visual gate)
- [ ] 4.3 `tests/roomArt.test.ts` (headers and sizes) and `tests/bootBudget.test.ts` green; the boot payload sum printed by a one-off `node -e` over `ROOM_ART`/`TASK_ART`/`UI_ART` sizes is below 48 s at 50 KB/s and recorded in the handoff
- [ ] 4.4 `grep -n "PINNED_PILLOW\|PINNED_NUMPY" scripts/recolour-board.py` present; `grep -n "recolour-board.py" scripts/make-task-art.mjs` present
- [ ] 4.5 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

### Phase 5: Docs, follow-ups, seam sweep

#### Automated

- [ ] 5.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -n "wornPieces\|recolour-board" CLAUDE.md` present
- [ ] 5.2 `grep -n "^| 169 \|^| 170 \|^| 171 \|^| 172 " docs/design-gaps.md` four rows; `grep -n "^| 107 " docs/design-gaps.md` no longer says the room is `furnishings-before`
- [ ] 5.3 `grep -c "Trigger:" context/changes/salon-style/follow-ups/review-fixes.md` ≥ 5
- [ ] 5.4 `grep -rn "addColorMatrix" src` lists only `src/ui/wornGrade.ts`; `grep -rn "furnishingsBefore\|furnishings-before" src tests scripts CLAUDE.md` empty
- [ ] 5.5 Full local gate green; e2e (orchestrator) `<branch e2e baseline> + 0`

#### Manual

- [ ] 5.6 [human] Accept the worn before state, or ask the author for a proper before picture: the code version shows the after furniture faded (same rug, the coffee table keeps its vase of flowers and books: no variant without them exists, montage m12); judge on the [visual] frames "room before" and "stage purchase (cross-fade)" (1440 and 1024) beside the old before (research montage m9 "NOW: before") (orchestrator concern; decision P-2)
- [ ] 5.7 [human] Accept the grade stronger than scope item 2's "about −25 % saturation, light sepia, about −8 % brightness": research grade E (−30 %, sepia 0.20, brightness 0.90, contrast 0.90, lift +4) plus an extra grade on sofa, rug, armchair, pouf (−35 %, sepia 0.10, brightness 0.95), and NO dust/wear overlay (scope item 2 names one) (decisions P-1, P-2)
- [ ] 5.8 [human] Accept the turquoises not nudged (scope item 4 optional; side-by-side m8 showed no clear gain) (decision P-5)
- [ ] 5.9 [human] Accept the board colour `#BCD799` (not a kit token) and a pinned Python step (Pillow 12.1.0 + numpy 2.4.3) inside `npm run art` (decision P-4)
- [ ] 5.10 [visual] Hook build on 4399, desktop 1440 and tablet 1024: room before state (fresh device); the stage purchase mid cross-fade and after it; after-stage empty room with contact shadows under lamp, left plant, pouf and right plant; first furniture purchase (sofa); a finished room (whole shadows layer, no ellipses); the task-screen backdrop for a before salon and for an after salon; the welcome backdrop (fresh device); the room with `?e2eArt=room` (stand-ins, no worn pieces, no crash) — beside the art review's comparison of the after furniture and research montage m9
- [ ] 5.11 [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in an earlier `check` log: `Tests  3915 passed (3915)`, `e2e hook: absent (2 chunks checked)`)

### Phase 6: The before salon is graded and the after room is grounded — e2e (#16, #12)

#### Automated

- [ ] 6.1 Spec red before (deliberate breaks, each run alone with `-g`: return `[]` from `wornPieces` → the fresh-salon test red; keep the worn set after the stage (drop the `stagesDone` guard) → the stage test red; skip `applyWornGrade` in `drawRoomMiniature` → the welcome test red on `graded`; each restored), green after
- [ ] 6.2 `npx playwright test tests/e2e/salon-style.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 4`; total equals `npx playwright test --list | tail -1`
- [ ] 6.3 Full local gate green
