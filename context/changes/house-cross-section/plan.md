# House cross-section with floors; "Do pokoju" always to the room in renovation — Implementation Plan

## Overview

Roadmap slice S-23 `house-cross-section` (milestone M-03 `ulica-i-domy`, PRD FR-038, FR-039, FR-033), autonomous run
`2026-10-31-house-cross-section`, branch `feat/house-cross-section` cut from `main` at `112f158`. Outcome: from the room
view the child taps one "Dom" button and sees house 1 from the side like a doll's house (the designer's shell from
`designs/martynka-house-street-v1`): the salon and the kitchen on the ground floor drawn from their live layers as she
left them, the two upper cells closed behind the pack's roller blind with "Wkrótce", the room in renovation marked by the
pack's frame. A tap on a done room opens it in full view for free changes (the S-22 "poprawki" path); a tap on the room
in renovation opens it; a closed cell does nothing. "Wróć do pokoju" returns in one tap. "Do pokoju" from the notebook
always opens the room in renovation, never the house (FR-039). The interim S-22 visit button goes (kitchen follow-up 1,
design gap 180).

Fixed decisions: `context/runs/2026-10-31-house-cross-section/scope.md` and `change.md` D1-D11. Research:
`context/changes/house-cross-section/research.md` (its Code References are the grounding). No lessons file exists in
`context/foundation/` (checked at this step), so no lesson is named in a phase.

**A phase that finds it must change star income, costs, mastery, curriculum, variants, a room slot/picture byte, the save
format (`SAVE_VERSION` stays 5), the boot queue or `balance.loader.totalMs` stops with `STATUS: BLOCKED`.**

## Current State Analysis

Grounded in `research.md`, spot-checked on this branch at `11d0274`:

- **Scenes.** `src/main.ts` scene list `[BootScene, WelcomeScene, TaskScene, RoomScene, UIScene]`; `UIScene` is on top
  only by being last. `SCENE_KEYS` (`src/data/layout.ts`) = boot, welcome, task, room, ui. No `scene.switch(key, data)`
  exists in the repo; Phaser 4.2.1 `ScenePlugin.switch(key, data)` → `SceneManager.switch` → `wake(to, data)` or
  `start(to, data)`, so the target's `'wake'` handler receives `(sys, data)` (source read in research, not run).
- **Room navigation.** `TaskScene` handles `GAME_EVENTS.toRoom` with `scene.switch(SCENE_KEYS.room)`; `RoomScene.create`
  `refresh` (wake) and `onSleep` both set `visiting = null` and close panel, change mode and card; `resolve()` reads
  `visiting ?? currentRoom ?? FIRST_ROOM`. `RoomScene.visit()` + `visitButton` (`ROOM_LAYOUT.visitButton` 1622,172,
  256×104) + `visitTarget` (`src/core/roomVisit.ts`) open the other done room; the button is hidden when `blocked`
  (panel open or card). Hook target `visitButton` = `room().visitTarget()`.
- **Miniatures.** `drawRoomMiniature(scene, g, room, state, left, top, scale, depth)` (`src/ui/widgets/RoomView.ts`) draws
  from whatever textures are cached, stand-ins on the passed Graphics, no clip (salon curtains at `y: -70`).
  `SalonBackdrop.render` captures into a `DynamicTexture` at (0,0) ("only (0,0) is the same on both renderers"), and
  `TaskScene`/`WelcomeScene` redraw it on `Renderer.Events.RESTORE_WEBGL`. No masks in `src/`; Phaser 4 masks are
  WebGL-only filters.
- **Runtime room art.** `createRoomArtLoader` (`src/ui/roomArtLoader.ts`) on the HUD loader: `ensure(rooms)`, `pending()`,
  publishes `REGISTRY_KEYS.roomLoad` `{ pending, settled }`. The boot loads only the room in renovation (`bootRoomArt`).
- **House data.** `HOUSES` (`src/data/houses.ts`) = `house-1`: salon (floor 0, place 0), kitchen (0, 1).
  `houseLayout`, `houseRoomList`, `roomInRenovation`, `nextRoom` in `src/core/house.ts`. No cell geometry anywhere.
- **Pack.** `designs/martynka-house-street-v1/manifest.json` `houses.house-1`: shell, cellClosed, cellFrame, cellFill
  `#FFF5DF`, four 608×342 cells (ground-left 252/636, ground-right 1060/636, upper-left 252/236, upper-right 1060/236;
  `col` = `place`), stairwell (860,236,200×742), safe zones stars (1560,0,360×120) and buttons (0,1010,1920×70). Shell
  alpha bounding box measured at this step: x 183-1734, y 47-1006; roof line: at y 100 the shell starts at x 605, at
  y 200 at x 267 (the top-left corner above the roof is free). WebP total 59 118 B (change.md).
- **e2e hook.** `src/testing/e2eHook.ts` `inRoom()`; `screen = inRoom() ? 'room' : unlock | summary | task`; targets per
  scene; `backdropPixel` reads one texture pixel; `E2EArtSeam` = missing|corrupt|room|stall|stallall|ui inside the
  `e2eArt` marker of `vite/e2eHookGuard.mjs`.
- **Fallback records.** `FallbackWhere` (`src/core/artPick.ts`) = wallet|notebook|miniature|loading|guide|worn,
  `FALLBACK_ORDER`; `recordFallback(scene, where, mode)` (`src/ui/artFallbacks.ts`). `ArtTable` (task|room|ui|sound)
  drives "Obrazki" and `loadErrorLine`.
- **Deploy smoke.** `scripts/check-deploy.ts` records `precacheCovers('<name>', …)` per table; seen in Deploy run
  41161789323: `ok   precache covers room pictures — 58 of 58 room pictures precached`.

## Desired End State

- `SCENE_KEYS.house` / `HouseScene` exists, placed before `UIScene`. Room → house: the "Dom" button
  (`ROOM_LAYOUT.houseButton`, the old visit-button place) calls `scene.switch(SCENE_KEYS.house)`. House → room: a done
  cell → `scene.switch(SCENE_KEYS.room, { visit: id })`; the current cell or "Wróć do pokoju" → `scene.switch(SCENE_KEYS.room)`.
  `RoomScene`'s wake sets `visiting` only from that data through the pure `houseWakeVisit`; every other wake and every
  sleep leaves `visiting = null`, so "Do pokoju" from the notebook (no data) always opens `currentRoom`.
- The house view: flat sky background (token), the shell picture (or a code-drawn stand-in shell), one captured
  608×342 miniature per open cell (done or current room), the pack's closed cell + "Wkrótce" for every other cell, the
  pack's frame around the room in renovation. Miniatures re-capture on wake, on `roomLoad` changes, after the house art
  arrives and on `RESTORE_WEBGL`. No tween anywhere in the house (reduced motion holds by construction).
- Cell geometry is data (`HOUSE_GEOMETRY` keyed by house id in `src/data/houses.ts`), cells from the manifest; closed
  cell = a geometry cell with no known room at its (floor, place), or a known room that is neither current nor done.
  Save format stays v5, no migration, no new save field.
- House art: `public/assets/house/{house-1-shell,cell-closed,cell-frame}.webp` from `npm run art`, table `HOUSE_ART`
  (`src/data/houseArt.ts`), loaded by `HouseScene` on its own loader at its first open (never in the boot queue),
  precached by the existing `webp` glob, checked by the deploy smoke (`house pictures`). A missing house picture draws
  the stand-in and records `house: 'drawn'` in `REGISTRY_KEYS.artFallbacks`; `?e2eArt=house` forces it (hook build only).
- Gone: `src/core/roomVisit.ts`, `tests/roomVisit.test.ts`, `RoomScene.visit`/`visitButton`/`visitTarget()`,
  `ROOM_LAYOUT.visitButton`, `ROOM_TOUCH_TARGETS.visitButton`, hook target `visitButton`. Design gap 180 closed.
- e2e hook: `screen: 'house'`, `house` snapshot (cells with state, mode, pending), `housePixel(cellId)`, targets
  `houseButton`, `houseBack`, `houseCells`.
- Verify: unit + layout + wiring tests, the full local gate, the visual pass of every house state, and the phase-6 e2e
  spec (FR-039 notebook path, FR-038 cells and taps, stand-in seam, Canvas capture).

### Key Discoveries:

- Wake/sleep resets in `RoomScene.create` (`refresh`, `onSleep`) are what keep FR-039 today; the new path may set
  `visiting` only from explicit wake data (handoff warning).
- `SalonBackdrop.render` is the repo's renderer-neutral clip: draw into a `DynamicTexture` at (0,0), then `render()`.
- `createRoomArtLoader` hardcodes `REGISTRY_KEYS.roomLoad`/`roomArtHealth` and the `'room'` log table: a second instance
  would clobber room records — the house art does not go through it (decision P3).
- The manifest's 70 px button band is below `MIN_TOUCH_TARGET` 96: the house back button goes in the free top-left
  corner (HUD "Do pokoju" place, hidden in the house), clear of the shell's roof.

## What We're NOT Doing

- No street, no house 2, no zoom level above the house (S-26); no third room / `kids` row in `HOUSES` (S-25).
- No child choice of which closed room opens next (FR-033, D3: order is data).
- No house-intensity celebration, no keepsake or album (S-24; FR-040/041).
- No save field, no migration (`SAVE_VERSION` 5), no balance, star, cost, mastery or curriculum change.
- No change to the boot queue or `balance.loader.totalMs`; house art never in `BootScene`.
- No change to `createRoomArtLoader` (kitchen follow-ups 3, 14, 15 stay unfired), `drawRoomMiniature` (follow-up 10),
  `SalonBackdrop` or the task-screen backdrop (follow-up 19).
- No "Obrazki" line for house art (kitchen follow-up 2 stays unfired).
- No zoom/transition animation between levels; no narrator line in the house (speaker hidden).
- No recolour of the salon's green board in its cell (gap 178 extended only).

## Implementation Approach

Pure rules first (cell states, tap and wake rules) test-first; then the art and its table; then the house scene and its
view on their own (not yet reachable); then the navigation switch in `RoomScene`, the hook and the moved tests in one
phase so the e2e suite stays green; then docs, gaps, follow-ups, the seam sweep and the visual pass; finally the e2e
spec. Each phase is green on the full local gate.

## Critical Implementation Details

- **State sequencing.** `scene.switch(SCENE_KEYS.room, data)` sleeps the house and wakes the room with `data`; the
  room's wake handler must set `visiting = houseWakeVisit(data, currentRoom, cells)` in place of `refresh`'s
  `visiting = null` (after the other resets, BEFORE its redraw; plan review F4), and its
  `onSleep` keeps `visiting = null`. A wake with `undefined` data (notebook "Do pokoju", house back) must give `null`.
- **Timing & lifecycle.** The first `scene.switch(SCENE_KEYS.house)` STARTS the house scene (create runs, no wake);
  later ones wake it. `HouseScene` must draw from the same `render()` in both `create` and the wake handler, and set the
  HUD registry keys (`narration` null, `roomSwitch` false, `hudTitle` null) in both.
- **Renderer.** One `DynamicTexture` per cell, created once (`textures.exists`), cleared and redrawn on every capture,
  drawn at (0,0) like `SalonBackdrop`; the stand-in Graphics goes into the capture holder at the lowest depth so
  wall/floor and stand-in boxes survive. Redraw synchronously on `Renderer.Events.RESTORE_WEBGL` (as `TaskScene`).

## Phase 1: House cells and the wake rule (pure)

Driver: tdd
Driver why: absent pure logic in `src/core/` whose behaviour is fixed by literal synthetic houses (open/closed/current cells, tap result, wake data), so a failing test leads each function.

### Overview

One pure answer for "what each cell of the house shows and what a tap or a wake does", plus the cell geometry as data.

### Changes Required:

#### 1. Types

**File**: `src/core/types.ts`

**Intent**: geometry of a house view as data.

**Contract**: `HouseCellDef { id: string; floor: number; place: number; x: number; y: number; width: number; height: number }`,
`HouseGeometry { shell: string; cellClosed: string; cellFrame: string; cellFill: number; frameInset: number; cells: readonly HouseCellDef[]; stairwell: Rect }`
(art keys, not URLs; reuse an existing rect type if one exists in `types.ts`).

#### 2. Cell rules

**File**: `src/core/houseCells.ts` (new)

**Intent**: cell states, tap result and wake rule in one place, no Phaser, no data import.

**Contract**:
- `type HouseCellState = 'current' | 'done' | 'closed'`; `HouseCellView { id, floor, place, x, y, width, height, room: string | null, state }`.
- `houseCells(geometry, house: HouseState, current: string, doneOf: (room: string) => boolean | null): HouseCellView[]` —
  one view per geometry cell in geometry order; `room` = the `HouseRoomPlace` at (floor, place) when `doneOf` knows it
  (non-null), else `null`; state `current` when `room === current` (even if done), `done` when `doneOf(room)` is true,
  else `closed` (an unknown room, an empty cell or a known room not yet reached all look the same: FR-033 one room at a time).
- `cellTap(cell): { kind: 'none' } | { kind: 'room'; visit: string | null }` — closed → none; current → room with
  `visit: null`; done → room with `visit: cell.room`.
- `houseWakeVisit(data: unknown, current: string, cells): string | null` — `data` must be an object with a string
  `visit` naming a `done` cell's room other than `current`; anything else (undefined, null, current, closed, unknown,
  wrong type) → `null`.

#### 3. Geometry data

**File**: `src/data/houses.ts`

**Intent**: the pack's cell rectangles keyed by house id (scope: layout data, not code constants).

**Contract**: `HOUSE_GEOMETRY: Readonly<Record<string, HouseGeometry>>` with `house-1` from
`designs/martynka-house-street-v1/manifest.json` (four cells, `place` = manifest `col`, `cellFill` 0xFFF5DF,
`frameInset` 16, stairwell); keys `house/house-1-shell`, `house/cell-closed`, `house/cell-frame` (the `HOUSE_ART` keys
of phase 2). Comment names the manifest as the source.

#### 4. Tests

**Files**: `tests/houseCells.test.ts` (new), `tests/houses.test.ts` or the existing `tests/house.test.ts`

**Contract**: literal cases — salon current not done, kitchen known not reached → `[current, closed, closed, closed]`
in geometry order; salon done, kitchen current → `[done, current, closed, closed]`; both done, kitchen current →
`[done, current, …]`; a place naming an unknown room → `closed` with `room: null`; `cellTap` for each state;
`houseWakeVisit` for `undefined`, `{}`, `{ visit: 42 }`, `{ visit: current }`, `{ visit: closedRoom }`, `{ visit: 'nope' }`
(all `null`) and `{ visit: doneRoom }` (the id). Data test: every `HOUSES` place has a geometry cell; cells lie inside
1920×1080, do not overlap each other or the stairwell; cell size 608×342 = 1920×1080 × 19/60.

### Success Criteria:

#### Automated Verification:

- `npx vitest run tests/houseCells.test.ts tests/house.test.ts` green; unit `<branch unit baseline> + N` (N = new cases)
- Deliberate break: make `houseWakeVisit` accept the current room → its case red; make `houseCells` mark a known
  not-reached room `done` → the first literal case red; each restored; meta-check: oracles are literal arrays written from
  FR-033/FR-039, not computed by the code under test
- `git diff --stat 112f158 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures/save-*.json src/data/rooms.ts` empty
- Full local gate green (lint, typecheck, unit + deploy/ops tests + sample E1-E6, build `e2e hook: absent (`); e2e not affected (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 2: House art: script, WebP, table, deploy smoke

Driver: impl
Driver why: an art-script row, generated WebP and a data table whose proof is a data test and the deploy smoke — content and glue, no logic a failing test could lead.

### Overview

The three pack pictures become game assets, precached and checked like every other table; nothing loads them yet.

### Changes Required:

#### 1. Art script

**File**: `scripts/make-task-art.mjs`

**Intent**: convert the house pack with the same `convert()` settings; no board recolour (the shell is not a room).

**Contract**: a `HOUSE` root constant (`designs/martynka-house-street-v1`), a 3-file job list at native size into
`public/assets/house/` (`house-1-shell.webp`, `cell-closed.webp`, `cell-frame.webp`), included in the kit-existence check
and the printed total. Salon, kitchen, task, UI and fox outputs byte-identical.

#### 2. Generated files

**Files**: `public/assets/house/*.webp` (3, ≈59 KB)

**Intent**: produced by `npm run art`, never by hand.

#### 3. Table

**File**: `src/data/houseArt.ts` (new)

**Intent**: one table of house pictures with keys, URLs (relative `assets/house/…`) and sizes (1920×1080, 608×342,
640×374).

**Contract**: `HOUSE_ART: readonly HouseArtEntry[]` (shape of `UI_ART` entries); not imported by `BootScene`.

#### 4. Tests

**File**: `tests/houseArt.test.ts` (new)

**Contract**: every entry has a file on disk with the stated pixel size (WebP header read as `tests/roomArt.test.ts`
does); no orphan file in `public/assets/house/`; keys disjoint from `TASK_ART`, `UI_ART`, `ROOM_ART`; every
`HOUSE_GEOMETRY` art key is in `HOUSE_ART`; `src/scenes/BootScene.ts` does not reference `HOUSE_ART` (boot budget
untouched); total weight ≤ 80 000 B.

#### 5. Deploy smoke

**File**: `scripts/check-deploy.ts`

**Contract**: `record(precacheCovers('house pictures', precache, HOUSE_ART.map((a) => a.url)))` beside `room pictures`.
`scripts/deploy-check` unit tests stay green; nothing under `deploy/` changes.

#### 6. Service-worker warning (kitchen follow-up 6, fires: the precache set grows)

**File**: `src/pwa/registerServiceWorker.ts`

**Intent**: an install that ends `redundant` leaves one `console.warn` line.

**Contract**: `trackStates` warns once with the worker state when `worker.state === 'redundant'`; `stepSw` unchanged.

### Success Criteria:

#### Automated Verification:

- `npm run art` (needs cwebp + python3 Pillow/numpy) regenerates the 3 files; `git status --short public/assets` shows only `public/assets/house/`
- `npx vitest run tests/houseArt.test.ts tests/roomArt.test.ts tests/uiArt.test.ts tests/bootBudget.test.ts` green; unit `<phase-1 count> + N`
- Deliberate break: rename `cell-frame.webp` → the orphan/missing-file case red; add `HOUSE_ART` to an import in `BootScene` → the boot guard red; each restored; meta-check: the size oracle is the pack's manifest/README sizes, not the table
- `npm run build` then `grep -c "assets/house/" dist/sw.js` ≥ 3 (precached by the existing glob)
- `git diff --stat 112f158 -- deploy/ public/assets/rooms public/assets/ui public/assets/tasks src/data/balance.ts src/core/save.ts` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints a line matching `ok +precache covers house pictures — 3 of 3 house pictures precached` (format seen in Deploy run 41161789323: `ok   precache covers room pictures — 58 of 58 room pictures precached`)

---

## Phase 3: The house scene and its view

Driver: impl
Driver why: a Phaser scene and a drawn widget over the phase-1 rules and phase-2 art — rendering glue proven by source guards, the layout test and build, with the browser path proven by phase 6.

### Overview

`HouseScene` (new) and `HouseView` (new widget) draw the house and route taps; nothing in the room opens it yet. Two new
UI components only.

### Changes Required:

#### 1. Keys, tokens, copy

**Files**: `src/data/layout.ts`, `src/data/pl.ts`, `src/core/artPick.ts`, `src/core/artHealth.ts`

**Intent**: everything the scene shows comes from data.

**Contract**:
- `SCENE_KEYS.house = 'House'`.
- `HOUSE_LAYOUT`: `background` (flat `0xE7F4F4`, the preview's sky top colour; DESIGN-GAP comment: the preview's
  gradient is CSS, a flat fill keeps Canvas and WebGL alike), `back` `{ left: 24, top: 24, width: 420, height: 112, radius, border }`
  (top-left corner above the roof: right edge ≤ 456 and bottom ≤ 148, where the shell begins at x≥456; DESIGN-GAP
  comment: the manifest's 70 px button band is below `MIN_TOUCH_TARGET`), `teaser` text style (32 px at the house
  scale, weight 650, `0xFFF5DF`, shadow `0x245C59`, from `preview.html`), stand-in shell colours (outline/roof from
  `PLACEHOLDER_COLORS`), depths. `HOUSE_TOUCH_TARGETS` `{ back, cell }`.
- `ROOM_LAYOUT.houseButton` takes the place and size of `visitButton` (phase 4 removes `visitButton`).
- `pl.house = { open: 'Dom', back: 'Wróć do pokoju' }` with a DESIGN-GAP comment (rows from phase 5); the teaser reuses
  `pl.room.done.teaser`.
- `FallbackWhere` gains `'house'` (and `FALLBACK_ORDER`, `DrawnFallbackWhere` as the type requires).
- `loadErrorLine` accepts `ArtTable | 'house'` through a separate name record (`ArtTable` and "Obrazki" unchanged).

#### 2. Capture helper and view

**Files**: `src/ui/widgets/roomCapture.ts` (new helper), `src/ui/widgets/HouseView.ts` (new)

**Intent**: draw the whole house from data and live room state.

**Contract**:
- `captureRoomMiniature(scene, key, room, state, width, height): void` — off-list holder container with a Graphics at
  the lowest depth, `drawRoomMiniature(scene, g, room, state, 0, 0, width / 1920, 0)`, a `DynamicTexture` `key` created
  once (`textures.exists`), cleared, `draw(holder)`, `render()`, holder destroyed. No blur, no tint.
- `HouseView.render(cells: readonly HouseCellView[], geometry, rooms, opts: { shellReady: boolean; pending: ReadonlySet<string> })`:
  background fill; one image per open cell from its captured texture at the cell rect; the pack's `cellClosed` (or a
  `cellFill`-free teal stand-in rect) + teaser text for each closed cell; the pack shell over the cells (or the stand-in:
  `cellFill` rects with an outline and a simple roof line); the frame image at (cell.x − inset, cell.y − inset) on the
  `current` cell (stand-in: a thick outline). Returns per-cell `mode: 'live' | 'drawn' | 'closed'` (drawn when a room is
  pending or its scene picture is missing, as `miniatureMode`). Draw order: background, miniatures/closed cells, shell,
  frame (README § Integracja).

#### 3. Scene

**File**: `src/scenes/HouseScene.ts` (new); `src/main.ts` (scene list: `HouseScene` before `UIScene`)

**Intent**: host the view, the taps and the way back.

**Contract**:
- `create` and the `'wake'` handler call one `show()`: registry `narration` null, `roomSwitch` false, `hudTitle` null;
  `roomArtLoader.ensure(open cells' rooms)`; `cells = houseCells(HOUSE_GEOMETRY[house.id], house, currentRoom, doneOf)`
  (`doneOf` from `ROOMS` + `roomDone`); capture each open cell (`house-cell-<id>` textures); `HouseView.render`.
- House art: on the first `show()`, if any `HOUSE_ART` key is missing and the `?e2eArt=house` seam (hook build only,
  `E2EArtSeam` gains `'house'`, inside the existing `e2eArt` marker) is off, queue the three files on `this.load` with a
  keyed `loaderror` (`loadErrorLine('house', …)`) and one `once('complete')` that re-renders; while missing or after a
  failure the stand-in shell is drawn and `recordFallback(this, 'house', 'drawn')` is written once the load settled.
- Taps: one interactive zone per cell; `cellTap(cell)` → none: nothing (no sound, no text); room with `visit` →
  `scene.switch(SCENE_KEYS.room, { visit })`; room without → `scene.switch(SCENE_KEYS.room)`. `PageButton` "Wróć do
  pokoju" at `HOUSE_LAYOUT.back` → `scene.switch(SCENE_KEYS.room)`. Every tap plays the existing tap cue as room buttons do.
- Re-render on `changedata-${REGISTRY_KEYS.roomLoad}` while active and synchronously on `Renderer.Events.RESTORE_WEBGL`;
  listeners removed on `shutdown`.
- Hook surface (used by phase 4): `snapshot(): { cells: { id, floor, place, room, state, mode }[]; shellReady; pending: string[] }`,
  `targets(): { back, cells: Record<cellId, {x, y}> }` (interior points), `pixel(cellId)` (one pixel from the middle of the
  cell texture: under WebGL `snapshotPixel` like `SalonBackdrop.pixel`; under Canvas read the DynamicTexture's own 2D
  `context.getImageData(x, y, 1, 1)` synchronously — NOT `null` as `SalonBackdrop.pixel` returns there, or the phase-6
  Canvas assert is vacuous; plan review F3).
- The `?e2eArt=house` seam is read from `REGISTRY_KEYS.forcedArt` (set by `main.ts`, the name is not an e2e marker), never
  by importing `src/testing/` (plan review F7).

#### 4. Tests

**Files**: `tests/layout.test.ts`, `tests/houseSceneWiring.test.ts` (new), `tests/reducedMotionWiring.test.ts` (if it lists widgets)

**Contract**: layout — `HOUSE_TOUCH_TARGETS.back` and cell sizes ≥ `MIN_TOUCH_TARGET`; `back` right edge ≤ 456 and
bottom ≤ 148, outside every cell, the stars safe zone and the HUD settings/speaker rects; `houseButton` overlaps none of
`resume`, `taskButton`, `modeButton`, the tray and the HUD pills (the old `visitButton` checks, renamed). Wiring guards
(source text): `HouseScene` listens to `wake` and `RESTORE_WEBGL`, sets `narration` null, never writes
`REGISTRY_KEYS.currentRoom`, `rooms` or `stars`, never calls `tweens`; `BootScene` does not mention `HOUSE_ART`;
`main.ts` lists `HouseScene` before `UIScene`.

### Success Criteria:

#### Automated Verification:

- `npx vitest run tests/layout.test.ts tests/houseSceneWiring.test.ts` green; unit `<phase-2 count> + N`
- Deliberate break: move `HOUSE_LAYOUT.back` to `left: 240` → the roof-clear case red; drop the `RESTORE_WEBGL` listener → the wiring guard red; each restored; meta-check: the guards prove wiring, the browser proof is phase 6
- `npm run build` prints `e2e hook: absent (`; `grep -c "e2eArt" dist/_app/*.js` unchanged from the branch baseline (0)
- `git diff --stat 112f158 -- src/ui/roomArtLoader.ts src/ui/widgets/SalonBackdrop.ts src/ui/widgets/RoomView.ts src/core/save.ts src/data/balance.ts` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 4: Room ↔ house navigation, the hook and the moved tests

Driver: impl
Driver why: scene wiring (button, wake data) over the phase-1 rule, plus the hook and the tests that must move in the same commit to keep the e2e suite green — glue proven by wiring guards and the rewired kitchen spec.

### Overview

The "Dom" button replaces the visit button; the room's wake reads the house's data; the hook can see and tap the house.

### Changes Required:

#### 1. Room scene

**File**: `src/scenes/RoomScene.ts`

**Intent**: one way to the house, one rule for `visiting`.

**Contract**:
- Remove `visit()`, `visitButton`, `visitTarget()` and the `visitTarget` import; add `houseButton` (`PageButton`,
  depth `controls`, label `pl.house.open`, at `ROOM_LAYOUT.houseButton`) shown when not `blocked` (panel open or card —
  kitchen follow-up 16 stays unfired; change mode closes on sleep as today); tap → `this.tap()`,
  `scene.switch(SCENE_KEYS.house)`.
- The wake handler becomes `(sys, data)`: the existing resets run first, and `refresh`'s own `this.visiting = null` is
  REPLACED by `this.visiting = houseWakeVisit(data, currentRoom, houseCells(…))` (so no later line in `refresh` clears it),
  all before the redraw; `create` calls `refresh()` without data (→ `null`); keep the source anchors `const refresh = (`
  and `const onSleep = (): void => {` that `tests/roomVisitWiring.test.ts` and `tests/salonStyleWiring.test.ts` cut on
  (plan review F4/F8); `onSleep` keeps `visiting = null`; `create` keeps `visiting = null`; when `visiting`
  is set call `roomArtLoader.ensure([visiting])`. `RoomScene` still never writes `REGISTRY_KEYS.currentRoom` outside the
  "Dalej" branch.
- `snapshot()` keeps `visiting`; add `houseButtonTarget()`.

#### 2. Layout and core cleanup

**Files**: `src/data/layout.ts`, `src/core/roomVisit.ts` (delete), `tests/roomVisit.test.ts` (delete)

**Contract**: `ROOM_LAYOUT.visitButton` and `ROOM_TOUCH_TARGETS.visitButton` removed (`houseButton` and its touch target
in place); its DESIGN-GAP comment now points at the house rows.

#### 3. e2e hook

**Files**: `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Contract**: `inHouse = () => game.scene.isActive(SCENE_KEYS.house)`; `screen` checks `inHouse()` first → `'house'`;
snapshot `houseView: inHouse() ? house().snapshot() : null` beside the room — NOT `house`: the snapshot's `house` field
already carries the saved `HouseState` and `tests/e2e/rooms-as-data.spec.ts` asserts it (plan review F2); `housePixel(cellId)`;
targets `houseButton` (room), `houseBack`, `houseCells` (house), every room target `null` while in the house, and the
sleeping task scene's summary targets (`nextRound`, `toRoom`, `unlockNext`, `ageBack`) `null` while `inRoom() || inHouse()`
(today they are nulled for `inRoom()` only; plan review F5); `visitButton` removed.
`E2EArtSeam` includes `'house'`. Support types follow; a helper `openHouse(page)` taps `houseButton` and waits for
`screen === 'house'`.

#### 4. Tests that move

**Files**: `tests/roomVisitWiring.test.ts`, `tests/e2e/kitchen-room.spec.ts`

**Contract**: wiring — "a wake without data ends a visit", "only `houseWakeVisit` sets `visiting` on wake", "`onSleep`
sets `visiting = null`", "the house button is hidden while blocked", "`RoomScene` imports nothing from `roomVisit`".
Kitchen spec test "#16 S-22 FR-019 from the kitchen the finished salon opens …": `visitButton` → `openHouse` + tap
`houseCells['ground-left']`; its "Do pokoju" and reload asserts unchanged (room `kitchen`).

### Success Criteria:

#### Automated Verification:

- `npx vitest run tests/roomVisitWiring.test.ts tests/layout.test.ts tests/houseCells.test.ts` green; unit `<phase-3 count> − (deleted roomVisit cases) + N`
- `grep -rn "visitTarget\|visitButton\|roomVisit'" src tests` empty (except `RoomSnapshot.visiting`)
- Deliberate break: set `visiting` from any truthy `data.visit` without `houseWakeVisit` → the wiring guard red; drop `visiting = null` from `onSleep` → the guard red; each restored; meta-check: the guards are source-level, the kitchen spec and phase 6 prove the browser
- `npx playwright test tests/e2e/kitchen-room.spec.ts` green (orchestrator; sandbox disabled)
- `git diff --stat 112f158 -- src/core/save.ts src/data/balance.ts src/data/rooms.ts src/ui/roomArtLoader.ts` empty
- Full local gate green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; total equals `npx playwright test --list | tail -1`

---

## Phase 5: Docs, gap rows, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, gap rows, follow-ups and leftovers over phases 1-4 plus the screenshot matrix — docs and glue.

### Overview

Close the slice in the repo's own records, sweep leftovers, and look at every house state the child can see.

### Changes Required:

#### 1. Docs

**Files**: `CLAUDE.md`, `docs/design-gaps.md`, `context/changes/house-cross-section/follow-ups/review-fixes.md` (new)

**Contract**: CLAUDE.md "Current state": ONE compact S-23 sentence (`HouseScene`/`HouseView`, `houseCells`/`cellTap`/
`houseWakeVisit` in `src/core/houseCells.ts`, `HOUSE_GEOMETRY`, `HOUSE_ART` loaded by the house scene at its first
open, the "Dom" button, wake data as the only way to set `visiting`, `?e2eArt=house`); the S-22 sentence's interim visit
button wording replaced; scene list text includes House. Gap rows from 183: house button label/place, "Wróć do pokoju"
in the top-left corner (button band 70 px), flat sky instead of the preview gradient, frame marks the room in
renovation (touch has no hover), closed cell inert, a known not-reached room shown closed, stand-in shell, salon green
board in a cream cell (extends 178); row 180 marked closed by S-23. Follow-ups with `Trigger:` lines: kitchen 3, 14, 15
(loader untouched, re-recorded), 2 (no house "Obrazki" line), 10 (`drawRoomMiniature` untouched; capture clips), 12
(re-record `Trigger: S-24`), 16 (guarded, re-record), 19 (re-record), rooms-as-data 11 (kids id → S-25), audit-art-renderer
2 closed as stale, plus every open follow-up whose `Trigger:` names a file or path this slice changes (plan review F6):
notebook-polish §6 and salon-style/salon-extra-slots L-R11 (`RoomScene` wake/sleep), stale-tab-and-health "worker build
id" (`registerServiceWorker`), salon-load-health M-6 (closed by phase 2's warning and the house smoke line),
audit-boot-hidden-tab G-3 (room miniature), the `artHealth.ts` triggers (save-reason-and-recovery 20, load-and-tab-guard
A-11, audit-art-renderer 23, stale-tab-and-health 28), narrator-round-summary 39 and load-and-tab-guard P-6 (already fixed
in code: close as stale) — each included, closed as stale with the evidence, or re-recorded with its trigger;
`SalonBackdrop` could share `captureRoomMiniature` (Trigger: next change to `SalonBackdrop`),
house sky gradient (Trigger: a designer answer), back-to-the-previous-room (Trigger: playtest note).

#### 2. Seam sweep

**Files**: as found

**Contract**: `grep` for leftovers of phases 1-4 — `visit` wording in comments of `RoomScene`/`e2eHook`/`layout.ts`,
unused exports (`houseRoomList` callers, `roomVisit`), duplicated cell-rect constants outside `HOUSE_GEOMETRY`,
duplicated capture code (`captureRoomMiniature` vs `SalonBackdrop.render`: keep both, record the follow-up), stale
"five scenes" wording, the hook seam doc for `?e2eArt=house`, `pl.house` keys all used, the design-gap numbers cited in
comments match the new rows.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "HouseScene|houseWakeVisit|HOUSE_ART" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/house-cross-section/follow-ups/review-fixes.md` ≥ 10; `grep -cE "^\| 1(8[3-9]|9[0-9]) " docs/design-gaps.md` ≥ 7
- Seam sweep: `grep -rn "visitTarget\|visitButton" src tests CLAUDE.md` empty; `grep -rnE "252, *636|1060, *236" src --include=*.ts | grep -v src/data/houses.ts` empty
- `git diff --stat 112f158 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures/save-*.json public/assets/rooms` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [visual] Hook build on 4399 (`?e2eStars=N`), desktop 1440 and tablet 1024 (landscape 1024×768): (1) the salon at the start with the "Dom" button; (2) the house at the start (salon current with frame, three closed cells with "Wkrótce"); (3) the house with the salon partly furnished before its stage (worn grade in the miniature); (4) the house after the salon is done and the kitchen current (salon done miniature, kitchen before-state with frame); (5) the salon opened from the house in change mode; (6) the house under `?e2eArt=house` (stand-in shell); (7) the house under Canvas (`tests/e2e/canvas-renderer.spec.ts` flags) — miniatures visible; (8) the room view with the variant panel open (no "Dom" button) and with the celebration card (no "Dom" button); each frame named in `reviews/visual-review.md`; curtains and rug must not spill out of their cells
- [human] Accept the pack's roller blind with "Wkrótce" as FR-038's "sylwetki" of closed rooms, and a known room not yet reached (the kitchen while the salon is in renovation) shown closed rather than as a before-state miniature (decision P5)
- [human] Accept the copy "Dom" (room → house) and "Wróć do pokoju" (house → room in renovation) and the back button in the top-left corner (DESIGN-GAP rows; decisions P6, P7)
- [human] Accept the salon's green board inside a cream house cell until the designer's salon re-export on cream (brief P3.2, gap 178)
- [human] On a real tablet, installed and offline after one online launch: open the house, the shell and both room miniatures draw (runtime load from the precache)
- [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in the Deploy run 41161789323 `build` log: `Tests  4054 passed | 3 skipped (4057)`, `e2e hook: absent (2 chunks checked)`)

---

## Phase 6: House navigation in the browser — e2e (FR-039, FR-038, #2, #16)

Driver: e2e
Driver why: the risk exists only in the rendered scenes and their switch data — notebook "Do pokoju" after a house visit, cell taps, closed-cell inertness, stand-in shell, Canvas capture (test-plan #2 currentRoom kept across a reload, #16 a free change deducts nothing; FR-039 navigation has no test-plan id); built by phases 1-4, after the phase-5 seam sweep, contract `E2E=on`.

### Overview

One spec modelled on `tests/e2e/kitchen-room.spec.ts` against the hook build, plus one Canvas case.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/house-cross-section.spec.ts` (new)

**Contract**: tests (risk ids in titles):
- `S-23 FR-038 the house at the start shows the salon in renovation and three closed cells` — fresh context; room →
  `openHouse`; `house.cells` states `[current, closed, closed, closed]` (ground-left salon); `mode` of the salon cell
  `live`; `housePixel('ground-left')` non-null with alpha 255 (an uncaptured texture is transparent, the sky is not in
  the texture; plan review F3); tap `houseCells['upper-right']` → still `screen: 'house'`;
  tap `houseBack` → `screen: 'room'`, room `salon`, `visiting` null.
- `#2 #16 S-23 FR-039 a done room opened from the house; "Do pokoju" from the notebook returns to the room in renovation`
  — reach salon done + kitchen current (the kitchen spec's helper or `?e2eStars`); `openHouse`; states
  `[done, current, closed, closed]`; tap the salon cell → room `salon`, `visiting` `salon`; a change in change mode keeps
  the stars; "Wróć do notesu" → task; "Do pokoju" → room `kitchen`, `visiting` null; reload → room `kitchen`, the salon
  change kept.
- `S-23 FR-039 the room in renovation's cell and the back button open the room in renovation` — from the house tap the
  kitchen cell → room `kitchen`, `visiting` null; the "Dom" button is absent while the variant panel is open.
- `S-23 ?e2eArt=house the house draws the stand-in shell and records the fallback` — `house.shellReady` false,
  `artFallbacks.house === 'drawn'`, cells still tappable.

**File**: `tests/e2e/canvas-renderer.spec.ts`

**Contract**: add `S-23 house miniatures are captured under Canvas` — open the house, `housePixel('ground-left')` polled
until non-null, alpha 255.

**File**: `playwright.config.ts`

**Contract**: add `house-cross-section` to the `ROUND_SPEC` alternation (the spec needs the hook build, project
`chromium-hook`, like `kitchen-room`); no other field changes (plan review F1).

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`): make the room's wake set `visiting` from the previous value instead of `houseWakeVisit` → the FR-039 test red on the room after "Do pokoju"; make `cellTap` return a room for a closed cell → the closed-cell assert red; skip the capture in `HouseView` → both pixel asserts red; ignore the `?e2eArt=house` seam → the stand-in test red; each restored; green after
- `npx playwright test tests/e2e/house-cross-section.spec.ts tests/e2e/canvas-renderer.spec.ts --list` lists the new tests under `chromium-hook` only; both specs green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 5`; total equals `npx playwright test --list | tail -1`
- Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)

---

## Testing Strategy

### Unit Tests:

- `tests/houseCells.test.ts`: cell states, `cellTap`, `houseWakeVisit` over literal houses (phase 1).
- `tests/houseArt.test.ts`: files, sizes, orphans, disjoint keys, no boot import (phase 2).
- `tests/layout.test.ts`: house back and house button touch targets and overlaps (phase 3-4).
- `tests/houseSceneWiring.test.ts`, `tests/roomVisitWiring.test.ts`: source guards for wake/sleep, listeners, no writes.

### Integration Tests:

- Deploy smoke `precacheCovers('house pictures')` (proven at ship).
- e2e: phase 6 spec + Canvas case; the rewired kitchen spec visit test (phase 4).

### Manual Testing Steps:

1. Fresh start, enter the room, tap "Dom": the house with the salon framed, three "Wkrótce" cells.
2. Finish the salon, "Dalej", open the house: salon done, kitchen framed; tap the salon, change a piece, notebook, "Do pokoju" → kitchen.
3. Tablet offline after one online launch: the house draws.

## Known risks

- `dt.draw` of a Graphics and of filtered (worn) images under Canvas was not run (source read only, see below); the phase-6
  Canvas case and visual frame (7) prove it. If Canvas drops the worn filter the miniature is ungraded (same as the room under Canvas).
- Phaser wake data (`switch(key, data)`) has no precedent in the repo. Plan review read the 4.2.1 source:
  `ScenePlugin.switch` → `queueOp('switch', from, to, data)` → `processQueue` `this[op](keyA, keyB, data)` →
  `SceneManager.switch` sleeps `from`, then `wake(to, data)` (→ `Systems.wake` emits `Events.WAKE` with `(sys, data)`) or
  `start(to, data)` (→ `create(data)`). Phase 6 proves it in the browser; the registry-key fallback stays recorded but is
  not expected.
- Canvas capture: plan review read `DynamicTexture._renderCanvas` (4.2.1): the `DRAW` command calls
  `object.renderCanvas(renderer, object, camera)` on the off-list holder (Container → children, Graphics included) into
  the DT's own 2D canvas, so the capture works there; the risk left is the pixel read (F3) and the ungraded worn look.
- Runtime house art could show the stand-in shell for a frame on the first open; from the precache it is near-instant.

## Performance Considerations

Four cell textures of 608×342 (≈0.8 MB GPU each) created once and reused; capture ≈25 images per house open. House art
59 KB loaded once per session from the precache. Boot payload unchanged (`tests/bootBudget.test.ts`).

## Migration Notes

None. `SAVE_VERSION` stays 5; `house`, `rooms`, `currentRoom` are read as saved; `visiting` and the cell geometry are
runtime/data. A save written by this build loads in the previous build unchanged.

## Autonomous decisions

Starting decisions D1-D11 (scope.md, change.md) are kept; none is overturned. Decided at this step:

- **P1 — hosting: a new `HouseScene` with switch data.** Chosen over a layer of `RoomScene` (research's recommendation):
  the room's hold zone, panel and buttons sleep for free, `RoomScene` does not grow, and the existing sleep/wake resets
  keep FR-039 by construction. Rejected: the layer (more `blocked` branches, a full-screen cover over a live room). Would
  change: wake data proving unreliable in phase 4/6 (then a consumed registry key, same scene).
- **P2 — miniature by per-cell `DynamicTexture` capture** (`captureRoomMiniature`), the `SalonBackdrop` way. Rejected:
  live objects + `setCrop` (touches `drawRoomMiniature`, fires kitchen follow-up 10; masks are WebGL-only). Would change:
  the Canvas case failing on the capture.
- **P3 — house art loaded by `HouseScene` on its own loader at the first open**, not through `createRoomArtLoader`.
  Rejected: parameterising the room loader (a refactor of shared-loader code with three open follow-ups for three static
  files) and the boot queue (every boot pays for a screen the child may not open; D7). Would change: a playtest or the
  visual gate showing the stand-in shell flash on the first open (then boot it within the measured headroom).
- **P4 — house art health is a fallback record** (`artFallbacks.house`), no "Obrazki" line (research rec. 4; kitchen
  follow-up 2 kept). Would change: the maintainer wanting runtime art judged in "Obrazki".
- **P5 — cell states: current / done / closed only.** A known room not yet reached (the kitchen while the salon is in
  renovation) is shown closed with "Wkrótce", like an unknown room; FR-038 "zamknięte pokoje jako sylwetki" is read as
  the pack's roller blind (the pack has no silhouettes). This reads the PRD's "sylwetki" non-literally → `[human]` row 5.7. Rejected: a before-state miniature of the next room (shows a room the child cannot open, against FR-033's one
  room at a time). Would change: the maintainer or the designer asking for silhouettes or a preview of the next room.
- **P6 — the house back button returns to the room in renovation**, not to a visited room; the current room's cell does
  the same. Rejected: remembering the previous room (needs a runtime field that could survive into the notebook path).
  Would change: a playtest note that the child expects to land in the visited room.
- **P7 — copy and placement** (D10): "Dom" on the old visit-button place under the star counter (shown even with one room
  — the house exists from the start), "Wróć do pokoju" at the top-left corner (the HUD "Do pokoju" place is free in the
  house; the manifest's 70 px button band is below `MIN_TOUCH_TARGET`). DESIGN-GAP rows → `[human]` row 5.8.
- **P8 — no zoom animation and no narrator line in the house** (research Q6 default). Reduced motion holds by
  construction; the speaker is hidden. Would change: a designer transition spec or the maintainer asking for a spoken line.
- **P9 — flat sky background** (`0xE7F4F4`) instead of the preview's CSS gradient (gradients live only in `kitDraw`,
  and Canvas has no gradient fill parity). DESIGN-GAP row. Would change: a designer answer with a background picture.
- **P10 — the "Dom" button is hidden only while `blocked`** (panel or card), as the visit button was: kitchen follow-up
  16 stays unfired; change mode closes on sleep. Would change: a way out that stays visible over the card.
- **P11 — kitchen follow-up 6 (SW `redundant` warning) is fixed here** (fires: the precache set grows; one line).
- **R1 (plan review, 2026-10-31)** — findings F1-F6 fixed in place (ROUND_SPEC row, `houseView` hook name, Canvas pixel
  read, wake ordering, task targets nulled in the house, fired generic follow-ups); report
  `context/changes/house-cross-section/reviews/plan-review.md`. Phases, drivers and Progress rows unchanged (36).
- **P12 — phases**: six (1 tdd, 4 impl, 1 e2e), at most two new UI components per phase (phase 3: `HouseScene`,
  `HouseView`); the hook moves with the navigation (phase 4) so every phase keeps the e2e suite green.

## References

- Research: `context/changes/house-cross-section/research.md`; identity and decisions: `context/changes/house-cross-section/change.md`; run scope: `context/runs/2026-10-31-house-cross-section/scope.md`
- Format example and the S-22 visit path: `context/archive/2026-10-31-kitchen-room/plan.md`, follow-ups `context/archive/2026-10-31-kitchen-room/follow-ups/review-fixes.md`
- Pack: `designs/martynka-house-street-v1/manifest.json`, `README.md` § Integracja, `preview.html`, `screenshots/house-with-dioramas.png`
- Code: `src/scenes/RoomScene.ts` (`create` `refresh`/`onSleep`, `resolve`, `visit`, `redraw`), `src/ui/widgets/SalonBackdrop.ts` `render`, `src/ui/widgets/RoomView.ts` `drawRoomMiniature`, `src/core/house.ts`, `src/data/houses.ts`, `src/testing/e2eHook.ts`, `scripts/make-task-art.mjs`, `scripts/check-deploy.ts`, `src/pwa/registerServiceWorker.ts` `trackStates`
- PRD: `context/foundation/prd.md` FR-033, FR-038, FR-039; test plan `context/foundation/test-plan.md` risks #2, #16

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: House cells and the wake rule (pure)

#### Automated

- [x] 1.1 `npx vitest run tests/houseCells.test.ts tests/house.test.ts` green; unit `<branch unit baseline> + N` (N = new cases) — 158004b
- [x] 1.2 Deliberate break: make `houseWakeVisit` accept the current room → its case red; make `houseCells` mark a known not-reached room `done` → the first literal case red; each restored; meta-check: oracles are literal arrays written from FR-033/FR-039, not computed by the code under test — 158004b
- [x] 1.3 `git diff --stat 112f158 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures/save-*.json src/data/rooms.ts` empty — 158004b
- [x] 1.4 Full local gate green (lint, typecheck, unit + deploy/ops tests + sample E1-E6, build `e2e hook: absent (`); e2e not affected (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` — 158004b

### Phase 2: House art: script, WebP, table, deploy smoke

#### Automated

- [x] 2.1 `npm run art` (needs cwebp + python3 Pillow/numpy) regenerates the 3 files; `git status --short public/assets` shows only `public/assets/house/` — c470f94
- [x] 2.2 `npx vitest run tests/houseArt.test.ts tests/roomArt.test.ts tests/uiArt.test.ts tests/bootBudget.test.ts` green; unit `<phase-1 count> + N` — c470f94
- [x] 2.3 Deliberate break: rename `cell-frame.webp` → the orphan/missing-file case red; add `HOUSE_ART` to an import in `BootScene` → the boot guard red; each restored; meta-check: the size oracle is the pack's manifest/README sizes, not the table — c470f94
- [x] 2.4 `npm run build` then `grep -c "assets/house/" dist/sw.js` ≥ 3 (precached by the existing glob) — c470f94
- [x] 2.5 `git diff --stat 112f158 -- deploy/ public/assets/rooms public/assets/ui public/assets/tasks src/data/balance.ts src/core/save.ts` empty — c470f94
- [x] 2.6 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` — c470f94

#### Manual

- [ ] 2.7 [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints a line matching `ok +precache covers house pictures — 3 of 3 house pictures precached` (format seen in Deploy run 41161789323: `ok   precache covers room pictures — 58 of 58 room pictures precached`)

### Phase 3: The house scene and its view

#### Automated

- [ ] 3.1 `npx vitest run tests/layout.test.ts tests/houseSceneWiring.test.ts` green; unit `<phase-2 count> + N`
- [ ] 3.2 Deliberate break: move `HOUSE_LAYOUT.back` to `left: 240` → the roof-clear case red; drop the `RESTORE_WEBGL` listener → the wiring guard red; each restored; meta-check: the guards prove wiring, the browser proof is phase 6
- [ ] 3.3 `npm run build` prints `e2e hook: absent (`; `grep -c "e2eArt" dist/_app/*.js` unchanged from the branch baseline (0)
- [ ] 3.4 `git diff --stat 112f158 -- src/ui/roomArtLoader.ts src/ui/widgets/SalonBackdrop.ts src/ui/widgets/RoomView.ts src/core/save.ts src/data/balance.ts` empty
- [ ] 3.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

### Phase 4: Room ↔ house navigation, the hook and the moved tests

#### Automated

- [ ] 4.1 `npx vitest run tests/roomVisitWiring.test.ts tests/layout.test.ts tests/houseCells.test.ts` green; unit `<phase-3 count> − (deleted roomVisit cases) + N`
- [ ] 4.2 `grep -rn "visitTarget\|visitButton\|roomVisit'" src tests` empty (except `RoomSnapshot.visiting`)
- [ ] 4.3 Deliberate break: set `visiting` from any truthy `data.visit` without `houseWakeVisit` → the wiring guard red; drop `visiting = null` from `onSleep` → the guard red; each restored; meta-check: the guards are source-level, the kitchen spec and phase 6 prove the browser
- [ ] 4.4 `npx playwright test tests/e2e/kitchen-room.spec.ts` green (orchestrator; sandbox disabled)
- [ ] 4.5 `git diff --stat 112f158 -- src/core/save.ts src/data/balance.ts src/data/rooms.ts src/ui/roomArtLoader.ts` empty
- [ ] 4.6 Full local gate green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`; total equals `npx playwright test --list | tail -1`

### Phase 5: Docs, gap rows, follow-ups, seam sweep and the visual pass

#### Automated

- [ ] 5.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "HouseScene|houseWakeVisit|HOUSE_ART" CLAUDE.md` present
- [ ] 5.2 `grep -c "Trigger:" context/changes/house-cross-section/follow-ups/review-fixes.md` ≥ 10; `grep -cE "^\| 1(8[3-9]|9[0-9]) " docs/design-gaps.md` ≥ 7
- [ ] 5.3 Seam sweep: `grep -rn "visitTarget\|visitButton" src tests CLAUDE.md` empty; `grep -rnE "252, *636|1060, *236" src --include=*.ts | grep -v src/data/houses.ts` empty
- [ ] 5.4 `git diff --stat 112f158 -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures/save-*.json public/assets/rooms` empty
- [ ] 5.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 5.6 [visual] Hook build on 4399 (`?e2eStars=N`), desktop 1440 and tablet 1024 (landscape 1024×768): (1) the salon at the start with the "Dom" button; (2) the house at the start (salon current with frame, three closed cells with "Wkrótce"); (3) the house with the salon partly furnished before its stage (worn grade in the miniature); (4) the house after the salon is done and the kitchen current (salon done miniature, kitchen before-state with frame); (5) the salon opened from the house in change mode; (6) the house under `?e2eArt=house` (stand-in shell); (7) the house under Canvas (`tests/e2e/canvas-renderer.spec.ts` flags) — miniatures visible; (8) the room view with the variant panel open (no "Dom" button) and with the celebration card (no "Dom" button); each frame named in `reviews/visual-review.md`; curtains and rug must not spill out of their cells
- [ ] 5.7 [human] Accept the pack's roller blind with "Wkrótce" as FR-038's "sylwetki" of closed rooms, and a known room not yet reached (the kitchen while the salon is in renovation) shown closed rather than as a before-state miniature (decision P5)
- [ ] 5.8 [human] Accept the copy "Dom" (room → house) and "Wróć do pokoju" (house → room in renovation) and the back button in the top-left corner (DESIGN-GAP rows; decisions P6, P7)
- [ ] 5.9 [human] Accept the salon's green board inside a cream house cell until the designer's salon re-export on cream (brief P3.2, gap 178)
- [ ] 5.10 [human] On a real tablet, installed and offline after one online launch: open the house, the shell and both room miniatures draw (runtime load from the precache)
- [ ] 5.11 [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in the Deploy run 41161789323 `build` log: `Tests  4054 passed | 3 skipped (4057)`, `e2e hook: absent (2 chunks checked)`)

### Phase 6: House navigation in the browser — e2e (FR-039, FR-038, #2, #16)

#### Automated

- [ ] 6.1 Spec red before (deliberate breaks, each run alone with `-g`): make the room's wake set `visiting` from the previous value instead of `houseWakeVisit` → the FR-039 test red on the room after "Do pokoju"; make `cellTap` return a room for a closed cell → the closed-cell assert red; skip the capture in `HouseView` → both pixel asserts red; ignore the `?e2eArt=house` seam → the stand-in test red; each restored; green after
- [ ] 6.2 `npx playwright test tests/e2e/house-cross-section.spec.ts tests/e2e/canvas-renderer.spec.ts --list` lists the new tests under `chromium-hook` only; both specs green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 5`; total equals `npx playwright test --list | tail -1`
- [ ] 6.3 Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)
