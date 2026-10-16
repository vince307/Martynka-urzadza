# Five new salon slots (S-16d `salon-extra-slots`) — Implementation Plan

## Overview

Roadmap slice **S-16d** (FR-016, FR-019). The child furnishes five more places in the salon, three variants each, from the
pack `designs/martynka-salon-v2`: curtains, wall shelf, lamp, left plant, pouf. The five tasks are **appended** at the end
of `SALON.tasks` in that order (author decision 2026-10-15), so a saved `tasksDone` keeps its meaning and the save format
stays **v3**. Lamp, left plant and pouf are today's decoration: they keep showing their old look (variant 0) after the
renovation stage until bought, and their task reads "Wymień …" with the usual variant panel. Curtains and shelf do not
exist until bought; the architecture before/after pictures become the pack's curtain-less versions. The right plant stays
fixed decoration. A salon finished under S-16c (7 tasks) gets the five new tasks and shows "Pokój gotowy!" again at the 12th.

## Current State Analysis

(From `research.md`; anchors re-checked in this step on `2af9702`.)

- **Data.** `src/data/rooms.ts`: `decor` = 4 `LayerDef` (`lamp-table` z 25, `plant-left` z 26, `plant-right` z 35, `pouf` z 60);
  `slots` = 6 `SlotDef` (sofa 30, rug 10, coffee-table 50, cabinet 20, armchair 40, wall-frames 5); `SALON.tasks` = 7 (costs
  5, 7, 9, 10, 12, 13, 15 = 71) with the comment "new tasks go at the END". `SlotDef` (`src/core/types.ts`) = `PlacedArt` +
  `variants`; no notion of a look shown before purchase.
- **Drawing.** `RoomView.render` (`src/ui/widgets/RoomView.ts`) draws `room.decor` once `stagesDone > 0` and a slot only when
  `chosen[slot.id]` (or the panel preview) is set; `miniaturePieces` mirrors it (pure, tested by `tests/roomMiniature.test.ts`).
  Shadows (`ROOM_LAYOUT.depth.shadows` 4) are drawn only for a done room.
- **Hit test.** `slotAt` / `holdPoint` (`src/core/roomHit.ts`) skip slots without `chosen`. `holdPoint` scans from
  `slotBox(slot).top`; for the curtains (y −70, `visibleRect` top 16 → box top −54) it can return a point above the canvas,
  which `RoomScene.slotTargets` hands to the e2e hook.
- **Hook.** `RoomScene.snapshot` (`RoomSnapshot`) reports `chosen`, `done`, `stageDone`, `card`, `modeText` … but not what is
  drawn for an unbought slot; `tests/e2e/support/hook.ts` types it.
- **Art.** `scripts/make-task-art.mjs` `ROOM_JOBS` reads the room from `EXPANSION` (expansion-v1); `SALON_ART`
  (`src/data/roomArt.ts`) derives from `SALON.scene`, `SALON.decor` and `SALON.slots`. All 22 existing furniture PNGs and
  `furnishings-before`/`shadows` are byte-identical in salon-v2; `cwebp` is deterministic. Measured: +261 428 B for the 12 new
  WebP files, −4 982 B for the curtain-less architecture pair → room folder 1 233 242 → 1 489 688 B (26 → 38 files).
- **Boot budget.** `balance.loader.totalMs` 45 000; its comment counts 2 073 293 B ≈ 41.5 s at 50 KB/s. With this slice
  ≈ 2 329 739 B ≈ 46.6 s. `tests/loaderBalance.test.ts` bounds `totalMs` to 30–60 s and above the 24 s single-file worst case.
- **Tests that pin today's salon.** `tests/roomsData.test.ts`: "has one furniture task per slot, whole costs of 5-15 stars that
  never fall …" (non-decreasing costs), "draws every piece inside the scene …" (`p.y + t >= 0`), "salon data … six furniture
  tasks", "costs 71 stars in all", "keeps the order of the first tasks stable" (7-id prefix), "uses no slot id that means
  something else in the frozen legacy salon" (expects dropped old keys `curtains, floor, lamp, plant, walls`);
  `tests/roomArt.test.ts` "has 26 entries", "weighs at most 1 400 000 bytes"; `tests/roomMiniature.test.ts` (decor key);
  `tests/legacySalonMigration.test.ts` "L-1: the v3 target is the first 7 tasks of the live salon".
- **Legacy key.** `curtains` is an old-only key of the frozen `LEGACY_SALON_V2` (`OLD_ONLY_KEYS`, the v2 marker of
  `LIFT_V2_SALON`). The step is `MIGRATIONS[2]` and runs only for `version < 3`; a lifted v2 salon drops it.
- **E2E.** `tests/e2e/room-change.spec.ts` "FR-019 the last purchase …" and `tests/e2e/final-art-room-done.spec.ts`
  `finishSalon` loop over `SALON.tasks` (grow to 12 purchases by data; `test.setTimeout(120_000)`);
  `tests/e2e/salon-art.spec.ts` "#16 with the salon pictures missing …" pins `health.total` 26.
- `scripts/check-deploy.ts` checks bundles vs precache, nothing about rooms (follow-up M-6). `context/foundation/lessons.md`
  does not exist.

## Desired End State

- `SALON.slots` 11, `SALON.decor` 1 (`plant-right`), `SALON.tasks` 12: the 7 of today unchanged, then `hang-curtains`
  (curtains, 8), `hang-shelf` (wall-shelf, 10), `swap-lamp` (lamp-table, 12), `swap-plant` (plant-left, 13), `swap-pouf`
  (pouf, 15); total 129 stars.
- `SlotDef.shownBeforePurchase?: 0 | 1 | 2` on `lamp-table`, `plant-left`, `pouf` (= 0); pure `shownVariant` /
  `shownVariants` in `src/core/rooms.ts` used by `RoomView.render` and `miniaturePieces`.
- `holdPoint` never returns a point outside the scene; the curtains get an on-canvas hold target.
- `ROOM_LAYOUT.depth.shadows` 2 (pack order: shadows under every slot, curtains z 3 included).
- `public/assets/rooms/salon/` 38 WebP files (12 new, curtain-less architecture); `npm run art` reads the room from salon-v2.
- Copy in `pl.room`: tasks "Powieś zasłony", "Powieś półkę", "Wymień lampę", "Wymień roślinę", "Wymień pufę"; captions
  zasłony, półka, lampa, roślina, pufa; variant names from the pack manifest; `pl.room.decor` = `plant-right` only.
- `balance.loader.totalMs` 50 000 with the comment recomputed from measured bytes.
- `RoomSnapshot.shown` (e2e build only, read-only): the variant drawn per slot.
- `scripts/check-deploy.ts` checks that the precache lists every `ROOM_ART` file and fetches one salon picture (M-6 first half).
- Three new e2e specs (risks #16, #2 / FR-019); existing specs grown by data; full suite green with `--workers=4`.
- `SAVE_VERSION` 3; `SALON_V3_TARGET` and `LEGACY_SALON_V2` byte-identical; `git diff --stat main -- tests/fixtures` empty;
  nothing under `deploy/`, `designs/`, `.gitignore`, `.claude/`, `docs/human-checklist.md`.

### Key Discoveries:

- Appending is free for saves (`tasksDone` is a prefix index, `chosen` is keyed by slot id, `validateSave` checks values
  only); reordering would move every saved room — hence the full ordered id pin (follow-up M-R4).
- The three moved slots keep their texture keys (`salon/lamp-table`, `salon/plant-left`, `salon/pouf` become `variants[0]`),
  so the default look needs no new texture and `SALON_ART` stays derived.
- `slotAt`, `holdPoint`, `stepPanel` (change branch) and `RoomScene.alphaAt` read `chosen` only, so an unbought lamp is not
  holdable and cannot be changed for free without any code change (change.md decision 4).
- `RoomView.render` merges the panel preview into `chosen` before drawing, so a preview replaces the default look and
  "Zamknij" brings it back once the helper reads the merged state.
- A finished S-16c salon (`tasksDone` 7) is byte-identical to a 7-of-12 salon bought in this build: reaching it by buying 7
  tasks and reloading the page is a faithful e2e model, no new save seam is needed.

## What We're NOT Doing

- No save migration, no v4, no edit of `SALON_V3_TARGET` / `LEGACY_SALON_V2`, no new frozen fixture is required.
- No new e2e URL seam (`?e2eSave=done-salon` rejected, see decision 6); no per-layer `picture|standIn|hidden` state (L-7 stays a follow-up).
- No change to `MINIGAME_WORDS` (new captions do not join "Hasło z wyników"; the stale `pl.room.slots` comment is fixed).
- No texture atlas, no change to `VariantPanel` (VO1: the pouf sits under the tray), no hold outline redesign (VO3),
  no "Wymień" panel that hides the current look (variant 0 = today's look is offered, S-17).
- No `console.warn` on a service-worker install error (M-6 second half, P-6), no `alphaAt` change (L-4), no
  `RoomScene.fadeStage` change (F1), no L-R8 / L-R11 unless the phase edits those symbols.
- Nothing in `deploy/`, `designs/`, `.gitignore`, `.claude/`, `docs/human-checklist.md`; no new npm dependency.

## Implementation Approach

Pure rules first (phase 1: the shown look and a hold point inside the scene, on synthetic rooms), then the drawing and the
hook follow them with today's data unchanged (phase 2). Phase 3 is the content: data, copy, art and tables together (the art
table is derived from the data and its test checks files on disk, so they cannot land apart); it changes the pinned tests
on purpose. Phase 4 adds the deploy-smoke room count, phase 5 the docs. Then three browser phases, each after what it
proves is built: the five purchases (6), a finished salon reopening (7), the curtains above the scene (8). Every phase
leaves the full local gate green and reports `<branch baseline> + delta`; the orchestrator runs e2e at every gate.

## Critical Implementation Details

- **Order matters for green phases**: phase 1 (`holdPoint` clip) must land before phase 3 adds the curtains, or
  `tests/roomHit.test.ts` "keeps a margin from the edge for every slot" can go red on the curtains; phase 2 (render via the
  helper) must land before phase 3 moves the decor, or the renovated room loses its lamp, plant and pouf.
- **The hook must report what is drawn, not what the rule says**: `RoomView` records the variant it actually shows per slot
  layer during `render` (including the preview) and `RoomScene.snapshot().shown` copies that record. A break in the render
  path then changes the hook value the e2e reads (lesson of this run: a break must change what the e2e observes).
- **E2E waits** (lessons of this run): never rely on the 5 s default `expect.poll` right after a page load, a reload or a held
  route — pass `{ timeout: 30_000 }` there; read the hook with `readHook(page, 'snapshot')` inside polls (it returns null
  instead of throwing while the scene changes).
- **Existing specs that change in phase 3** (the orchestrator runs e2e at that gate): `salon-art.spec.ts` `health.total`
  26 → 38; `room-change.spec.ts` and `final-art-room-done.spec.ts` buy 12 tasks — raise their `test.setTimeout` to 180_000.

## Phase 1: Shown look before purchase and a hold point inside the scene (pure logic)

Driver: tdd
Driver why: which variant a slot shows (bought, default before purchase, or nothing) and where a hold lands are pure `core` functions with exact oracles on synthetic rooms — failing tests drive them before any widget or data uses them.

### Overview

The rule exists and is tested; no data and no widget use it yet (no visible change).

### Changes Required:

#### 1. Slot field

**File**: `src/core/types.ts` (`SlotDef`)

**Intent**: Let room data mark a slot whose variant is shown as decoration from the renovation stage until it is bought.

**Contract**: `SlotDef.shownBeforePurchase?: 0 | 1 | 2` with a one-line comment (author decision 2026-10-15: lamp, left
plant, pouf show their old look until bought). No other type changes.

#### 2. Shown-look helper

**File**: `src/core/rooms.ts` (new `shownVariant`, `shownVariants`); `tests/roomShown.test.ts` (new)

**Intent**: One rule for the room and its miniature: a bought slot shows its chosen variant; an unbought slot with
`shownBeforePurchase` shows that variant once a stage task is done; any other slot shows nothing.

**Contract**: `shownVariant(room: RoomDef, state: RoomState, slotId: string): 0 | 1 | 2 | null` — `chosen[slotId]` when it is
0, 1 or 2; else `slot.shownBeforePurchase` when `stagesDone(room, state) > 0`; else null (also null for an unknown slot).
`shownVariants(room, state): Record<string, 0 | 1 | 2>` — every slot whose `shownVariant` is not null, keyed by slot id.
Tests on a synthetic `RoomDef` (stage + 3 slots, one with `shownBeforePurchase: 0`): before the stage nothing unbought is
shown; after the stage the default slot shows 0 and the plain slot nothing; a bought default slot shows its chosen 2;
`roomDone` is irrelevant; an unknown slot id gives null; the helper never mutates its input.

#### 3. Hold point inside the scene

**File**: `src/core/roomHit.ts` (`holdPoint`); `tests/roomHit.test.ts`

**Intent**: A slot whose picture extends above the scene (the pack's curtains at y −70) must get a hold target the finger
and the e2e hook can reach.

**Contract**: the scan box is `slotBox(slot)` intersected with the scene rectangle `ROOM_LAYOUT.scene` (imported from
`src/data/layout.ts`; if an ESLint boundary forbids it, pass the box from `RoomScene.slotTargets` instead and record it)
shrunk by the margin `step / 2` (`src/core/roomHit.ts` already imports `src/data/balance.ts`, and the core ESLint block
forbids only Phaser and `idb-keyval`, so the import is allowed; plan review F5), so the result `p` satisfies `scene.left + m ≤ p.x ≤ right − m`, `scene.top + m ≤ p.y ≤
bottom − m`; still `slotAt(p ± m) === slotId`. Signature unchanged. New tests on a synthetic room with a slot at `y: −70`
(box top −54): `holdPoint` (no alpha, and with an alpha that is opaque everywhere) returns `y ≥ step / 2`; a slot fully
above the scene returns null. `slotAt` unchanged.

### Success Criteria:

#### Automated Verification:

- New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- Deliberate break: `shownVariant` ignoring `stagesDone` → "before the stage nothing unbought is shown" red; `holdPoint` scanning from `box.top` again → "returns y ≥ step / 2" red; each restored; meta-check: proves the rules on synthetic data, not the drawing (phase 2) or the salon data (phase 3)
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`)
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] `src/core/rooms.ts` and `src/core/roomHit.ts` have no Phaser or browser globals; no number in `core` that belongs in `balance`/`layout`

---

## Phase 2: Room drawing and the hook follow the rule; shadows under every piece

Driver: impl
Driver why: `RoomView.render`, `miniaturePieces` and `RoomScene.snapshot` call the phase-1 helper — rendering and hook wiring with no new rule; with today's data nothing changes on screen, the browser proof comes in phases 6–8.

### Overview

The room, the miniature and the hook use `shownVariants`; the hook gains `shown`; shadows move below the lowest slot depth.

### Changes Required:

#### 1. Room and miniature

**File**: `src/ui/widgets/RoomView.ts` (`RoomView.render`, `miniaturePieces`, new `RoomView.shown`)

**Intent**: Draw every slot from `shownVariants` (the room with the preview merged into `chosen`, the miniature with the
saved state), so a default-look slot appears after the stage, a preview replaces it and the two drawings cannot drift.

**Contract**: `render` computes `shownVariants(room, { ...state, chosen })` after merging the preview and draws each slot
layer from it (caption = slot caption + variant name, fill `variantFills[variant]`, as for a bought slot); the
`room.decor` loop stays (for `plant-right`). `RoomView.shown(): Readonly<Record<string, 0 | 1 | 2>>` returns a copy of the
variants the last `render` actually passed to a slot layer. `miniaturePieces` uses `shownVariants(room, state)` for the
slots; the comment "The same layers as `RoomView.render`" stays true. `drawRoomMiniature` itself is not edited (F2 stays out).

#### 2. Hook

**File**: `src/scenes/RoomScene.ts` (`RoomSnapshot`, `snapshot`); `tests/e2e/support/hook.ts` (`Snapshot.room` type)

**Intent**: Let the e2e read what the room draws for each slot, bought or not.

**Contract**: `RoomSnapshot.shown: Readonly<Record<string, number>>` = `this.roomView.shown()` (read-only copy; the hook
exists only in the e2e build). The spec-side type adds `shown: Record<string, number>`.

#### 3. Shadows depth

**File**: `src/data/layout.ts` (`ROOM_LAYOUT.depth.shadows` and its comment); `tests/layout.test.ts`

**Intent**: Follow the pack's draw order (architecture, shadows, then slots by `z`) so the curtains (z 3) are not drawn under
the shadows picture.

**Contract**: `depth.shadows` 4 → 2; new assertion in "draws the room controls above every room layer depth …":
`depth.furnishingsBefore < depth.shadows < min(z of every slot and decor layer)` for every room.

#### 4. Miniature test follows the helper

**File**: `tests/roomMiniature.test.ts`

**Intent**: Pin that the miniature draws exactly the `shownVariants` slots in `z` order, plus today's cases.

**Contract**: one new case: for a renovated state, the slot pieces equal `shownVariants` (keys `slot.variants[v]`) sorted by `z`.

### Success Criteria:

#### Automated Verification:

- Full local gate green; unit `<branch baseline> + N` (layout and miniature assertions); build prints `e2e hook: absent (`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (no visible change with today's data)
- Deliberate break: `depth.shadows` 6 → the new layout assertion red; restored. Patch `e2e-break-p6a.patch` written (render draws only `chosen`, `shown` follows it); meta-check in the handoff (proof in phase 6)

#### Manual Verification:

- [reviewer] No number or Polish text added to the widget or the scene; the decor loop still draws `plant-right`

---

## Phase 3: Five slots in the salon — data, copy, art and tables

Driver: tdd
Driver why: the salon data is pinned by table tests (ordered task ids, costs, counts, files on disk, scene bounds, legacy-key safety) — the changed and new assertions go red first, then the data, copy and converted art make them green.

### Overview

The salon has 11 slots and 12 tasks; the five new pictures and the curtain-less architecture are in `public/`. Three
existing invariants change on purpose (decision rows 1, 4).

### Changes Required:

#### 1. Art conversion

**File**: `scripts/make-task-art.mjs` (`ROOM_JOBS`, `decor`, `furniture`, `EXPANSION`); `public/assets/rooms/salon/*.webp`

**Intent**: Read the salon from the salon-v2 pack (curtain-less architecture, 12 new furniture files); existing files must
come out byte-identical.

**Contract**: `ROOM_JOBS` sources from `SALON_V2`; ids add `curtains-leaf, curtains-cream, curtains-botanical, shelf-oak,
shelf-mint, shelf-arch, lamp-wicker, lamp-flower, plant-fern, plant-ficus, pouf-knit, pouf-oak`; `EXPANSION` removed if no
longer read. `npm run art` twice → no diff the second time; `git diff --stat public/assets/rooms` shows only the two
architecture files modified and 12 added. Never stage `designs/`.

#### 2. Salon data

**File**: `src/data/rooms.ts` (`decor`, `slots`, `SALON.tasks`)

**Intent**: Move lamp, left plant and pouf from decor to slots (same geometry, `shownBeforePurchase: 0`), add curtains and
wall shelf from the pack manifest, append the five tasks.

**Contract**: geometry from `designs/martynka-salon-v2/manifest.json` `slots`:
`curtains` x 232 y −70 590×695 z 3 anchor [295,679] visibleRect [16,16,558,663] variants `salon/curtains-leaf|cream|botanical`;
`wall-shelf` x 355 y 177 440×242 z 18 anchor [220,226] visibleRect [16,16,408,210] variants `salon/shelf-oak|mint|arch`;
`lamp-table` (today's decor geometry) variants `salon/lamp-table|lamp-wicker|lamp-flower`;
`plant-left` variants `salon/plant-left|plant-fern|plant-ficus`; `pouf` variants `salon/pouf|pouf-knit|pouf-oak`.
`decor` = `[plant-right]`, its comment updated. Tasks appended after `hang-frames`:
`{ kind: 'slot', id: 'hang-curtains', slot: 'curtains', label: 'hangCurtains', cost: 8 }`, `hang-shelf`/`wall-shelf`/`hangShelf`/10,
`swap-lamp`/`lamp-table`/`swapLamp`/12, `swap-plant`/`plant-left`/`swapPlant`/13, `swap-pouf`/`pouf`/`swapPouf`/15.

#### 3. Copy

**File**: `src/data/pl.ts` (`pl.room.tasks`, `slots`, `variants`, `decor`)

**Intent**: Child-facing Polish for the new tasks and slots (imperative + accusative; nominative captions).

**Contract**: tasks `hangCurtains: 'Powieś zasłony'`, `hangShelf: 'Powieś półkę'`, `swapLamp: 'Wymień lampę'`,
`swapPlant: 'Wymień roślinę'`, `swapPouf: 'Wymień pufę'`; slots `curtains: 'zasłony'`, `'wall-shelf': 'półka'`,
`'lamp-table': 'lampa'`, `'plant-left': 'roślina'`, `pouf: 'pufa'`; variants `curtains: ['Listkowe','Lniane','Botaniczne']`,
`'wall-shelf': ['Dębowa','Miętowa','Z łukiem']`, `'lamp-table': ['Klasyczna','Wiklinowa','Kwiatowa']`,
`'plant-left': ['Monstera','Paproć','Fikus']`, `pouf: ['Pikowana','Pleciona','Na nóżkach']`; `decor` keeps `'plant-right'`
only. The `slots` comment no longer claims these are the minigame words (`MINIGAME_WORDS` in `src/data/minigames.ts` is a
fixed list). DESIGN-GAP comment as for the existing room copy (rows 31-36).

#### 4. Boot limit

**File**: `src/data/balance.ts` (`loader.totalMs` and its comment)

**Intent**: Keep the total boot limit above the cold-start time of the grown queue (decision row 3).

**Contract**: `totalMs` 45 000 → 50 000; the comment recomputed from bytes measured after the conversion (`du`/`stat` of
`public/assets/tasks`, `public/assets/ui` loading pictures, `public/assets/rooms`, the font and the 12 boot sounds as
M4A): expected ≈ 2 329 739 B ≈ 46.6 s at 50 KB/s. `tests/loaderBalance.test.ts` unchanged (30–60 s, above 24 s).

#### 5. Tests changed on purpose and new pins

**File**: `tests/roomsData.test.ts`, `tests/roomArt.test.ts`, `tests/legacySalonMigration.test.ts`, `tests/roomHit.test.ts`, `tests/roomMiniature.test.ts`

**Intent**: Make the author's data expressible and turn the append-only comment into a test.

**Contract**:
- roomsData "has one furniture task per slot, whole costs of 5-15 stars that never fall, …" → retitled "… whole costs of
  5-15 stars, …": the non-decreasing check is removed (S-09 agent choice, the author's 8–15 block follows 15); bounds 5–15,
  integers and "first within one clean round" stay.
- roomsData "draws every piece inside the scene …" → a piece's visible rectangle stays inside the scene on the left, right
  and bottom; its top may lie above the scene only for `curtains` (named exception, pack `curtainEdit.note`) and then at
  least half of its visible height is inside the scene.
- roomsData "salon data": 11 slots, 1 decor, 12 tasks (stage first, then one task per slot); "costs 71 stars" → "costs 129
  stars": `[5, 7, 9, 10, 12, 13, 15, 8, 10, 12, 13, 15]`, sum 129.
- roomsData new "M-R4: the task id order is append-only": the full ordered literal of the 12 ids (comment: a later slice
  appends to this literal and never edits an earlier entry). The existing 7-id prefix test stays.
- roomsData new: exactly `lamp-table`, `plant-left`, `pouf` have `shownBeforePurchase` (= 0); `curtains` and `wall-shelf` none.
- roomsData "uses no slot id that means something else in the frozen legacy salon": dropped old keys → `floor, lamp, plant,
  walls`; `curtains` asserted as the one old-only key that is also a live slot id (named exception, safe because
  `LIFT_V2_SALON` runs only for `version < 3`).
- legacySalonMigration: "L-1 … first 7 tasks" also asserts `SALON.tasks.length > SALON_V3_TARGET.length` (prefix of the
  12-task list); new "a v3 save with `chosen.curtains` is decoded unchanged" (`decodeSave` of an encoded v3 session with
  `tasksDone` 8 and `chosen.curtains` 1); new "a lifted v2 salon never carries `curtains`".
- roomArt "has 26 entries" → 38; "weighs at most 1 400 000 bytes" → 1 550 000 (measured 1 489 688 + ≈ 4 %).
- roomHit "gives a point that hits the slot for every furnished slot" and "keeps a margin …" cover the curtains (data-driven).
- roomMiniature "renovated room with the decoration …": decoration = `plant-right`, default-look slots = variant 0 of the three.

#### 6. Existing e2e specs follow the data

**File**: `tests/e2e/salon-art.spec.ts`, `tests/e2e/room-change.spec.ts`, `tests/e2e/final-art-room-done.spec.ts`

**Intent**: Keep them valid with 12 tasks and 38 pictures (see Critical Implementation Details).

**Contract**: `health.total` 26 → 38; `test.setTimeout(180_000)` in the two buy-everything specs; no other change.

#### 7. Teacher read

**Intent**: `src/data/` changed (copy only, no generator).

**Contract**: `npm run sample -- E1 --count 6` (content unchanged, gate rule) and a read of the five labels and captions as a
teacher: accusative after the verb (zasłony, półkę, lampę, roślinę, pufę), nominative captions, "Salon: 7 z 12" in the save
summary reads correctly; recorded in the handoff.

### Success Criteria:

#### Automated Verification:

- Changed/new tests red before the data and art (assertion, not import error), green after; unit `<branch baseline> + N`
- `npm run art` twice → `git status --porcelain public/` unchanged after the second run; only the two architecture files modified
- Deliberate break: swap `hang-curtains` and `hang-shelf` → M-R4 red; drop `shownBeforePurchase` from `pouf` → default-look pin red; `curtains` y −700 → "inside the scene" red; each restored; meta-check: proves data and files, not drawing
- Full local gate green; build prints `e2e hook: absent (`; `dist/sw.js` lists `assets/rooms/salon/curtains-leaf.webp`
- e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`, `salon-art`, `room-change`, `final-art-room-done` green

#### Manual Verification:

- [reviewer] Teacher read recorded; `SALON_V3_TARGET`, `LEGACY_SALON_V2` and `tests/fixtures/` unchanged; nothing from `designs/` staged
- [visual] Salon at 1440 and 1024: renovated room shows the old lamp, plant and pouf; bare window before the curtains; curtains above the shadows; shelf partly behind the cabinet; panels of the five new tasks (curtain thumbnails fit); pouf under the tray (VO1); the "Pokój gotowy!" miniature at task 12 (curtains start 70 × 0.13 ≈ 9 px above the miniature, plan review F2)

---

## Phase 4: Deploy smoke counts the room art (M-6 first half)

Driver: tdd
Driver why: the precache-vs-room-art comparison is a pure parser function in `scripts/deploy-check/parse.ts` with a string oracle — a failing unit test drives it; the live fetch runs only after a deploy.

### Overview

`npm run check:deploy` reports a missing room picture in the precache and a salon picture that does not answer.

### Changes Required:

#### 1. Check

**File**: `scripts/deploy-check/parse.ts` (new `roomArtCheck`); `scripts/check-deploy.ts` (`main`); `tests/deployCheck.test.ts`

**Intent**: A release whose service worker does not precache every room picture fails the post-deploy smoke.

**Contract**: `roomArtCheck(precache: readonly string[], expectedUrls: readonly string[]): CheckResult` — ok when every
expected URL is in the precache (leading `/` ignored), detail `N of M room pictures precached` plus the first missing one.
`check-deploy.ts` passes `ROOM_ART.map((a) => a.url)` (import from `src/data/roomArt.ts`) and GETs
`/assets/rooms/salon/architecture-after.webp` (status 200, `contentTypeCheck` `image/webp`). Tests: all present → ok;
one missing → not ok and named; leading slash tolerated. Nothing under `deploy/`.

### Success Criteria:

#### Automated Verification:

- New tests red before the function exists (assertion via a stub returning ok, not an import error), green after; unit `<branch baseline> + N`
- Deliberate break: `roomArtCheck` always ok → "one missing" red; restored; meta-check: proves the comparison, not production (the Deploy job proves that)
- Full local gate green; `bash deploy/test-martynka-deploy.sh` unchanged and green

#### Manual Verification:

- [reviewer] `scripts/check-deploy.ts` still runs as `node --import tsx` (no extension-less import problem); no production command run

---

## Phase 5: Documentation and follow-ups

Driver: impl
Driver why: text-only changes in `CLAUDE.md` and the follow-ups file — nothing to test beyond the rule-file validator.

### Overview

`CLAUDE.md` current state names S-16d; follow-ups carried with triggers.

### Changes Required:

#### 1. Current state

**File**: `CLAUDE.md` ("Current state" paragraph)

**Intent**: One sentence group for S-16d: 11 slots / 12 tasks appended, `shownBeforePurchase` + `shownVariant`, `holdPoint`
inside the scene, `RoomSnapshot.shown`, `depth.shadows` 2, `totalMs` 50 s, `roomArtCheck`; only names that exist.

**Contract**: every path and symbol named exists (seam sweep); `validate-rule-files.sh` PASS.

#### 2. Follow-ups

**File**: `context/changes/salon-extra-slots/follow-ups/review-fixes.md` (new)

**Intent**: Carry what this slice fired but did not fix.

**Contract**: entries with `Trigger:` lines: texture atlas (boot queue ≈ 2.33 MB; trigger: a field report of a slow first
start or a second room), "Wymień …" offering variant 0 = the current look (S-17), VO1 pouf under the tray (next change to
`VariantPanel`), VO3 curtains hold outline overlaps shelf and cabinet (designer hold view / S-17), L-7 per-layer state
(next change to `RoomLayer`), F2, L-4, L-R8, L-R11, F1 (unchanged triggers), M-6 second half / P-6, a done salon loses its
shadows, mode button and teaser until task 12 (S-17 if the author dislikes it), `MINIGAME_WORDS` without the new words
(author asks), costs 8–15 (S-17); plan review F1: VO2 (overlapping stand-in labels, fired by the `RoomView.render` change,
re-triggered) and the per-file timeout test of `2026-10-16-final-art-p2` (fired by the `balance.loader` change, re-triggered);
plan review F3: a hold on an unbought default-look piece (old pouf, lamp) passes through to the bought slot under it
(trigger: a report of the wrong panel opening, or S-17); plan review F2: the done-card miniature does not clip the curtains
above its top (trigger: the visual gate finding it visible, or the next change to `drawRoomMiniature`).

### Success Criteria:

#### Automated Verification:

- `validate-rule-files.sh` PASS; deliberate break in `CLAUDE.md` (a non-existent path) → FAIL; restored
- Every follow-up entry has a `Trigger:` line; full local gate green

#### Manual Verification:

- [reviewer] Seam sweep: every name `CLAUDE.md` adds exists; `docs/human-checklist.md` untouched

---

## Phase 6: Five new purchases by touch with the variant panel — e2e (#16)

Driver: e2e
Driver why: risk #16 (a confirmed choice deducts its cost exactly once; the panel decides the look) for the five appended tasks, and the default look before purchase, exist only in the running room — built in phases 2 and 3.

### Overview

New spec `tests/e2e/salon-extra-slots.spec.ts` in the `chromium-hook` project (`salon-extra-slots` added to `ROUND_SPEC`
in `playwright.config.ts`).

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/salon-extra-slots.spec.ts` (new); `playwright.config.ts` (`ROUND_SPEC`)

**Intent**:
(a) "#16 S-16d the lamp, plant and pouf show their old look until »Wymień« buys a new one": `?e2eStars=` = sum of all costs,
`e2eVariant=off`; buy the stage and the six old tasks with variant 0 (model on `finishSalon` of
`final-art-room-done.spec.ts`); then `room.shown` has `lamp-table`, `plant-left`, `pouf` = 0 while `chosen` has none of
them, and has no `curtains` / `wall-shelf`; `currentTask.id === 'hang-curtains'`, `buttonText` contains
`pl.room.tasks.hangCurtains`.
(b) "#16 S-16d each of the five new tasks costs its price once, after »Wybieram«": for each appended task: open the panel
(stars unchanged), preview variant 1 (`shown[slot] === 1`, stars unchanged), "Wybieram" → `chosen[slot] === 1`,
`shown[slot] === 1`, stars = before − cost; after the fifth, `done === true` and the card shows.

**Contract**: `.claude/skills/10x-e2e/references/e2e-quality-rules.md`; hook read-only, read with `readHook(page,
'snapshot')` in polls; `{ timeout: 30_000 }` after the load and after entering the room; Chromium not available in agent
sessions: request-file protocol — `e2e-request-p6.md` + `e2e-break-p6a.patch` (phase 2: render draws only `chosen` →
(a) red on `shown['lamp-table']`), `e2e-break-p6b.patch` (`purchase` deducts the cost of the next task → (b) red);
`STATUS: BLOCKED — e2e needs orchestrator run (request file written)`; each expected-red test run alone (`-g`).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/salon-extra-slots.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- Deliberate break p6a → (a) red; p6b → (b) red; each restored; meta-check: (a) proves the drawn layer record, not the pixels (visual phase 3)
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual Verification:

- [human] iPad: "Wymień lampę" reads naturally to a 6–8-year-old; the old lamp and the new one are easy to tell apart in the panel

---

## Phase 7: A finished salon reopens and shows "Pokój gotowy!" again at task 12 — e2e (#2 / FR-019)

Driver: e2e
Driver why: risk #2 (a save written before the update loads identically after it) and FR-019 (the done card) for a salon finished under the 7-task list need the real save, a reload and the room scene — built in phase 3.

### Overview

New test in `tests/e2e/salon-extra-slots.spec.ts`.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/salon-extra-slots.spec.ts`

**Intent**: "#2 FR-019 S-16d a salon finished with seven tasks gets the five new ones and the done card again at the
twelfth": buy the stage and the six old tasks (state equal to a salon finished under S-16c, `tasksDone` 7), wait for the
save (the hook's `save` status `{ lastReason: 'now', dirty: false }`, as `save-restart.spec.ts` "#2 #10 a reload comes back …" does; a purchase is saved at once), reload the page in the same context, enter the room
(`{ timeout: 30_000 }`): `tasksDone === 7`, `done === false`, `card === null`, `modeText === null`,
`currentTask.id === 'hang-curtains'`, the old `chosen` unchanged; buy the five new tasks → `card` not null with the salon
item `done: true` and the teaser `unlocked: true`; "Dalej" → `modeText === pl.room.change.enter`.

**Contract**: as phase 6; no new URL seam (decision 6); patch `e2e-break-p7.patch` (`roomDone` = `tasksDone >= 7`) →
red on `done === false` after the reload.

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/salon-extra-slots.spec.ts -g "#2 FR-019"` green; full `--workers=4`: `<branch e2e baseline> + 1`
- Deliberate break p7 → red; restored; meta-check: proves the saved prefix keeps its meaning and the card follows the 12-task list, not a save written by the S-16c build itself (bytes are identical, decision 6)
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

---

## Phase 8: Curtains above the scene are held for a free change — e2e (#16)

Driver: e2e
Driver why: risk #16 (a touch lands on the right piece and a change costs nothing) for the one slot whose picture starts above the canvas depends on the canvas scale and the real touch path — built in phases 1 and 3.

### Overview

New test in `tests/e2e/salon-extra-slots.spec.ts`.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/salon-extra-slots.spec.ts`

**Intent**: "#16 S-16d the curtains reaching above the scene are held for a free change": reach a salon with the curtains
bought (variant 0, enough stars for the first eight tasks), `targets().slots.curtains` exists with `0 < y < 200` (the
curtains-only band); `holdTouch` there for `balance.roomHold` ms + 400 → panel `{ kind: 'open', mode: 'change', slot:
'curtains' }`; pick variant 2, "Wybieram" → `chosen.curtains === 2`, `shown.curtains === 2`, stars unchanged.

**Contract**: as phase 6; patch `e2e-break-p8.patch` (`holdPoint` scans from `box.top` again) → red (target y ≤ 0, the
hold never opens the panel).

### Success Criteria:

#### Automated Verification:

- `npx playwright test tests/e2e/salon-extra-slots.spec.ts` green (4 tests); full `--workers=4`: `<branch e2e baseline> + 1`
- Deliberate break p8 → red; restored; meta-check: proves the target the hook hands out lies on the canvas and the hold reaches the curtains through the real touch path
- Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual Verification:

- [human] iPad: holding the curtains near the top edge opens the panel; the hold outline over the shelf and cabinet is acceptable (VO3)

---

## Testing Strategy

### Unit Tests:

- `shownVariant` / `shownVariants` on synthetic rooms; `holdPoint` inside the scene; shadows depth below every piece.
- Salon tables: 11 slots, 12 tasks, ordered ids (M-R4), costs 129, default-look slots, curtains as the one above-the-scene
  piece and the one old-only legacy key; v3 save with `chosen.curtains` unchanged; lifted v2 salon without it; 38 room
  files under 1 550 000 B; `roomArtCheck`.

### Integration Tests:

- `npm run build` (precache lists the new files, hook guard); `sample` E1–E6; e2e phases 6–8 (4 tests, 4 break patches);
  existing `room-purchase`, `room-change`, `final-art-room-done`, `salon-art`, `salon-load-health`, `save-restart`, seed green at every gate.

### Manual Testing Steps:

1. [visual] Phase 3: renovated room with default look, bare window, the five panels, curtains layering, an old done salon
   without shadows/mode button until task 12, at 1440 and 1024.
2. [human] iPad: "Wymień …" flow (phase 6), hold on the curtains (phase 8).

## Performance Considerations

Boot queue +256 446 B → ≈ 2.33 MB, ≈ 46.6 s at 50 KB/s on a cold first start; `totalMs` 50 s keeps ≈ 3.4 s slack; past it
the game starts with stand-ins (`bootLoadPhase`) and the service worker serves later starts. Up to 11 slot layers + 1 decor
in the room (was 6 + 4): two more images.

## Migration Notes

None: save format v3 unchanged. A saved `tasksDone` 0..7 keeps its prefix meaning; a finished salon continues at task 8.
Rollback to the S-16c build reads `tasksDone` 8..12 as done and ignores unknown `chosen` keys (`RoomView.render` loops over
`room.slots`, `validateSave` checks values only).

## Known risks

- **A finished salon looks "unfinished" again** (no shadows, no "Zmień wygląd", teaser locked until task 12) — follows the
  author's "dostają nowe czynności"; visual gate shows it; follow-up for S-17.
- **"Wymień" can buy the current look** (variant 0 offered) — allowed by the author's rule; S-17 follow-up.
- **The buy-everything specs run longer** (12 purchases): limits raised to 180 s in phase 3; a flake there is load, not logic.
- **Cold start ≈ 46.6 s** at 50 KB/s, close to the 50 s cut; the atlas follow-up carries the trigger.
- **Follow-ups fired by this slice and deferred (plan review F1)**, each carried in phase 5 with its reason:
  VO2 (trigger: next change to `RoomView.render`) — the stand-in path changes only by the slot loop; the labels of the five
  new stand-ins are checked in visual 3.7 with `?e2eArt=room`, a fix needs the one stand-in drawer (F5);
  per-file timeout test (`2026-10-16-final-art-p2`, trigger: next change to `balance.loader` or the boot queue) — only
  `totalMs` changes, the per-file limit and its path are untouched; L-4 (trigger: a change to the room hit test) — the
  `holdPoint` clip keeps every asked point inside the scene and inside the picture (curtains local y ≥ 70), so
  `getPixelAlpha` is never asked out of range by this change; L-7 (trigger: next change to `salon-art.spec.ts`) — the only
  edit is the count 26 → 38, and `RoomSnapshot.shown` covers what the new specs read; L-R8 / L-R11 (trigger: next change to
  RoomScene) — phase 2 adds one snapshot field and touches neither `stepPanel` refusals nor `celebrate`/`onSleep`.
- **A hold on an unbought default-look piece goes through it (plan review F3)**: `slotAt` reads `chosen`, so holding the old
  pouf can open the change panel of the rug or armchair under it, as holding the decoration pouf does today. Not a
  regression; the "Wymień" panel opens from the task button. Follow-up in phase 5.
- **A still-open S-16c tab or PWA instance can overwrite a purchase of the new tasks (plan review F4)**: both write v3, so
  the version guard of `load-and-tab-guard` (P-5) does not apply; the same holds for any same-version change and is not
  specific to this slice. No action.
- **The done-card miniature draws the curtains ≈ 9 px above its top edge (plan review F2)**: `drawRoomMiniature` has no
  clip and stays unedited (F2 of `final-art-salon`); inside the 16 px tile padding, checked in visual 3.7.

## References

- Research `context/changes/salon-extra-slots/research.md`; change `context/changes/salon-extra-slots/change.md`
- Roadmap `context/foundation/roadmap.md` `### S-16d`; PRD FR-016, FR-019; `Martynka-urzadza.md`
- Contract `context/runs/2026-10-15-fix-s16bcd/agent-contract.md` § S-16d; profile `context/foundation/autonomous-run.md` § 2, § 6, § 8, § 9
- Test plan `context/foundation/test-plan.md` risks #2, #16; `context/foundation/test-stack.md` § E2E
- Format example `context/archive/2026-10-16-final-art-p2/plan.md`
- Follow-ups: `context/archive/2026-10-15-final-art-salon/follow-ups/review-fixes.md` (append rule, F2, VO1–VO3, atlas),
  `context/archive/2026-10-15-salon-load-health/follow-ups/review-fixes.md` (M-6, L-4, L-7),
  `context/archive/2026-10-13-save-observability-c1-c2/follow-ups/review-fixes.md` (M-R4, L-R8, L-R11)
- Pack (read-only, never committed): `designs/martynka-salon-v2/manifest.json` (`slots`, `layers`, `curtainEdit`), `README.md`

## Autonomous decisions

1. **[human] Costs of the five new tasks 8, 10, 12, 13, 15** (salon total 71 → 129, ≈ 8–12 more rounds). Rejected: all 15
   (total 146, keeps the "never fall" invariant but flattens the pacing). Why: reads the author's "8–15" as a ramp in the
   stated order. Would change: the author or S-17 preferring another pace.
2. **[human] Completed salons reopen** (author-accepted, named here): a salon finished under S-16c has `tasks[7]` as its
   next task; until the 12th purchase it shows no shadows, no "Zmień wygląd" and a locked teaser; hold-to-change of bought
   pieces still works; the card shows again at the 12th. Rejected: a persisted "card seen" flag (needs v4). Would change:
   the author disliking the lost shadows/mode button (then a v4 slice).
3. **[human] Boot total limit raised 45 s → 50 s** (`balance.loader.totalMs`), comment recomputed from measured bytes
   (≈ 2 329 739 B ≈ 46.6 s at 50 KB/s). Rejected: keeping 45 s (a cold start at 50 KB/s would cut the last ≈ 1.6 s of files
   to stand-ins every first start). Would change: a field report of long frozen bars, or the atlas shrinking the queue.
4. **[human] Existing tests changed on purpose**: `tests/roomsData.test.ts` "… costs … that never fall" (non-decreasing check
   removed; an S-09 agent choice, not an author rule) and "draws every piece inside the scene" (curtains may reach above the
   top, pack `curtainEdit.note`); also "uses no slot id that means something else in the frozen legacy salon" (`curtains`
   becomes a named exception) and the count pins (6/4/7 → 11/1/12, 71 → 129, 26 → 38 files, 1 400 000 → 1 550 000 B).
   `SALON_V3_TARGET` and its L-1 pin are not edited, only made explicit. Would change: plan review finding a weaker rule
   that keeps the invariants (e.g. non-decreasing within each appended block).
5. **Slot ids follow the pack** (`curtains`, `wall-shelf`, `lamp-table`, `plant-left`, `pouf`); `curtains` reuses an old v2
   key — harmless (the v2 step runs only for `version < 3`), pinned by two tests. Would change: a code path reading
   `OLD_ONLY_KEYS` on a v3 save.
6. **No new e2e save seam**: a salon finished under S-16c (`tasksDone` 7, six `chosen` keys) is byte-identical to one bought
   to 7 of 12 here, so phase 7 buys 7 and reloads. Rejected: `?e2eSave=done-salon` + fixture + guard marker (more seam
   surface for no extra proof). Would change: the save gaining a build-specific field.
7. **Shelf label "Powieś półkę"** (wall shelf), not "Postaw półkę". Would change: the author's wording.
8. **Default look as `SlotDef.shownBeforePurchase` + one core helper** used by the room and the miniature. Rejected: a
   `LayerDef` with an "until bought" link (duplicates geometry). Would change: a second room needing a default look that is
   not one of the slot's variants.
9. **Unbought default-look slots are not holdable** (hit test reads `chosen`); the "Wymień" panel opens from the task button.
   Would change: the author expecting a tap on the piece itself.
10. **`depth.shadows` 4 → 2** (pack draw order) so curtains sit above the shadows. Would change: the visual gate showing the
    shadows must cover the curtains.
11. **Hook reports the drawn layer record** (`RoomView.shown`), not the helper result, so render breaks change what the e2e
    observes. Would change: nothing likely.
12. **M-6 first half taken** (cheap, `scripts/`), second half (SW install warn, P-6) carried. Would change: a phase touching
    `registerServiceWorker`.
13. **Phases 1, 3, 4 `tdd`; 2, 5 `impl`; 6–8 `e2e`** (contract: pure logic test-first; e2e after what it proves; risks #16, #2).
14. **Plan in English** like `change.md` and `research.md`; commit messages in Polish (profile § 1).

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Shown look before purchase and a hold point inside the scene (pure logic)

#### Automated

- [x] 1.1 New tests red before the change (assertion, not import error), green after; unit `<branch baseline> + N`
- [x] 1.2 Deliberate break: `shownVariant` ignoring `stagesDone` / `holdPoint` scanning from `box.top` → red; restored; meta-check (rules on synthetic data)
- [x] 1.3 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`)
- [ ] 1.4 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 1.5 [reviewer] `src/core/rooms.ts` and `src/core/roomHit.ts` have no Phaser or browser globals; no number in `core` that belongs in `balance`/`layout`

### Phase 2: Room drawing and the hook follow the rule; shadows under every piece

#### Automated

- [ ] 2.1 Full local gate green; unit `<branch baseline> + N` (layout and miniature assertions); build prints `e2e hook: absent (`
- [ ] 2.2 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (no visible change with today's data)
- [ ] 2.3 Deliberate break: `depth.shadows` 6 → layout assertion red; restored; patch `e2e-break-p6a.patch` written; meta-check in the handoff

#### Manual

- [ ] 2.4 [reviewer] No number or Polish text added to the widget or the scene; the decor loop still draws `plant-right`

### Phase 3: Five slots in the salon — data, copy, art and tables

#### Automated

- [ ] 3.1 Changed/new tests red before the data and art (assertion, not import error), green after; unit `<branch baseline> + N`
- [ ] 3.2 `npm run art` twice → `git status --porcelain public/` unchanged after the second run; only the two architecture files modified
- [ ] 3.3 Deliberate break: swapped task order / `pouf` without `shownBeforePurchase` / curtains y −700 → red; restored; meta-check (data and files, not drawing)
- [ ] 3.4 Full local gate green; build prints `e2e hook: absent (`; `dist/sw.js` lists `assets/rooms/salon/curtains-leaf.webp`
- [ ] 3.5 e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`, `salon-art`, `room-change`, `final-art-room-done` green

#### Manual

- [ ] 3.6 [reviewer] Teacher read recorded; `SALON_V3_TARGET`, `LEGACY_SALON_V2` and `tests/fixtures/` unchanged; nothing from `designs/` staged
- [ ] 3.7 [visual] Salon at 1440 and 1024: default look, bare window, curtains above the shadows, shelf behind the cabinet, five panels, pouf under the tray, done-card miniature at task 12

### Phase 4: Deploy smoke counts the room art (M-6 first half)

#### Automated

- [ ] 4.1 New tests red before the function exists (assertion via a stub, not an import error), green after; unit `<branch baseline> + N`
- [ ] 4.2 Deliberate break: `roomArtCheck` always ok → "one missing" red; restored; meta-check (comparison, not production)
- [ ] 4.3 Full local gate green; `bash deploy/test-martynka-deploy.sh` unchanged and green

#### Manual

- [ ] 4.4 [reviewer] `scripts/check-deploy.ts` still runs as `node --import tsx`; no production command run

### Phase 5: Documentation and follow-ups

#### Automated

- [ ] 5.1 `validate-rule-files.sh` PASS; deliberate break in `CLAUDE.md` → FAIL; restored
- [ ] 5.2 Every follow-up entry has a `Trigger:` line; full local gate green

#### Manual

- [ ] 5.3 [reviewer] Seam sweep: every name `CLAUDE.md` adds exists; `docs/human-checklist.md` untouched

### Phase 6: Five new purchases by touch with the variant panel — e2e (#16)

#### Automated

- [ ] 6.1 `npx playwright test tests/e2e/salon-extra-slots.spec.ts` green; full `--workers=4`: `<branch e2e baseline> + 2`
- [ ] 6.2 Deliberate break p6a → (a) red; p6b → (b) red; each restored; meta-check (drawn layer record, not pixels)
- [ ] 6.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual

- [ ] 6.4 [human] iPad: "Wymień lampę" reads naturally; old and new lamp easy to tell apart in the panel

### Phase 7: A finished salon reopens and shows "Pokój gotowy!" again at task 12 — e2e (#2 / FR-019)

#### Automated

- [ ] 7.1 `npx playwright test tests/e2e/salon-extra-slots.spec.ts -g "#2 FR-019"` green; full `--workers=4`: `<branch e2e baseline> + 1`
- [ ] 7.2 Deliberate break p7 → red; restored; meta-check (saved prefix keeps its meaning, card follows the 12-task list)
- [ ] 7.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

### Phase 8: Curtains above the scene are held for a free change — e2e (#16)

#### Automated

- [ ] 8.1 `npx playwright test tests/e2e/salon-extra-slots.spec.ts` green (4 tests); full `--workers=4`: `<branch e2e baseline> + 1`
- [ ] 8.2 Deliberate break p8 → red; restored; meta-check (on-canvas target, real touch path)
- [ ] 8.3 Build prints `e2e hook: absent (`; full local gate green; servers 4397/4398 killed

#### Manual

- [ ] 8.4 [human] iPad: holding the curtains near the top edge opens the panel; the hold outline over shelf and cabinet is acceptable (VO3)
