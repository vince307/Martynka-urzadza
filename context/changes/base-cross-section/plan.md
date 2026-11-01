# Base cross-section, the child stays in the base after Mostek, the "Baza" button — Implementation Plan

## Overview

Roadmap slice S-29 `base-cross-section` (milestone M-03, Stream D "Baza kosmiczna"; PRD FR-045, FR-046, FR-048),
autonomous run `2026-10-31-space-base`, branch `feat/base-cross-section` cut from `main` at `9a44799` (S-28 merge).
Outcome: a child with the space base sees the base in cross-section (the same four cells as the house cross-section,
Mostek framed, the other modules as the pack's airlock with "Wkrótce") and returns to Mostek with one tap; the zoom-out
button in the room is named after the building ("Baza" in the base, "Dom" in the house); after the last Mostek purchase
she gets the room celebration and stays in the base (change mode, the "Baza" button, stars keep accumulating); "Do pokoju"
reaches the module in renovation (already true, kept).

Binding inputs: `context/runs/2026-10-31-space-base/scope.md` (maintainer decisions, orchestrator starting decisions),
`change.md` D1-D8, `research.md` R1-R7 (its Code References are the grounding). No lessons file exists in
`context/foundation/` (checked at this step), so no lesson is named in a phase.

**Save format stays v6 (`SAVE_VERSION` 6).** A phase that finds it must change the save format, star income, mastery,
curriculum, variants, task generators, the salon, kitchen or Mostek room data or pictures, `MINIGAME_WORDS` or
`balance.loader` stops with `STATUS: BLOCKED` and records why.

## Current State Analysis

Grounded in `research.md`, spot-checked on this branch at `68d1488`:

- **One scene, geometry by house id.** `HouseScene.geometry()` (`src/scenes/HouseScene.ts`) reads
  `HOUSE_GEOMETRY[house.id] ?? HOUSE_GEOMETRY[FIRST_HOUSE.id]`; `houseCells`/`cellTap`/`houseWakeVisit`
  (`src/core/houseCells.ts`) are building-neutral; a done room that is still `currentRoom` stays `state: 'current'`
  (`houseCells`: `room === current ? 'current' : …`), so a finished Mostek keeps its frame. `HOUSE_GEOMETRY`
  (`src/data/houses.ts`) has only `house-1`; `HOUSES` has `base-1` = `[{ room: 'bridge', floor: 0, place: 0 }]`.
- **Four un-keyed constants** make the view house-only: `HOUSE_LAYOUT.background` (`0xe7f4f4`) and
  `HOUSE_LAYOUT.teaser` (`#FFF5DF`, shadow `#245C59`, weight 650) in `src/data/layout.ts`, read only by
  `HouseView.render` (`src/ui/widgets/HouseView.ts`); `HOUSE_ART` (`src/data/houseArt.ts`, three rows) read wholesale
  by `HouseScene.shellReady`/`loadArt`; `pl.house.open` = `'Dom'` (`src/data/pl.ts`) read by `RoomScene.redraw`.
- **Zoom-out button.** `RoomScene.redraw` hides `houseButton` when `blocked` (card, panel) or when the saved house has no
  geometry (`hasOwnProperty.call(HOUSE_GEOMETRY, savedHouse.id)`, pinned by `tests/roomVisitWiring.test.ts`); so today a
  base child has no zoom-out (gap 195).
- **Stale scene.** `TaskScene.backToChoice` stops `SCENE_KEYS.ui` and `SCENE_KEYS.room`, not the house scene;
  `HouseScene` keeps `artQueued`/`artSettled` as instance fields never reset in `create`, and Phaser 4.2.1 `start` reuses
  the instance (`SceneManager.start` → `getScene(key)`), so a second building's pictures would never be queued.
- **Art.** `scripts/make-task-art.mjs` converts `HOUSE_FILES` from the house pack into `HOUSE_OUT`
  (`public/assets/house/`) and already declares `SPACE` (`designs/bystrow-space-base-v1`). The base pack has
  `assets/base/base-1-shell.png` (1920×1080) and `assets/base/cell-closed.png` (608×342, same name as the house file) and
  no cell frame. Measured WebP: shell 81 970 B, airlock 12 308 B (research § 2); `tests/houseArt.test.ts` caps the whole
  table at 80 000 B (today 59 118 B).
- **Pack style for the base** (`designs/bystrow-space-base-v1/preview.html`, `view=base`): stage `#e8efeb`; "Wkrótce"
  600 32 px `#245c59`, no shadow, centred at cell x+304, y+182 (the house centres at y+171). Manifest `bases.base-1`:
  the four cells and `liftShaft` (860, 236, 200×742) equal the house's byte for byte, `cellFill` `#FFF5DF`.
- **Stand-in shell.** `HouseView.standInShell` draws a roof triangle with inline numbers (`margin = 24`, apex
  `shellTop + 40`), house-shaped for any geometry (house-cross-section follow-up 20).
- **Celebration (FR-046).** `houseRoomList(base-1)` = one tile, no teaser; "Dalej" → `moveAfterDone` → `nextRoom` finds
  nothing → stays in Mostek with change mode (pinned in `tests/roomsData.test.ts` by S-28). Only the zoom-out is missing.
- **Hook.** `snapshot().room` (`RoomScene.snapshot`) carries no button label; `houseView`, `housePixel` (a cell
  TEXTURE, not the rendered frame) and `targets().houseButton` exist (`src/testing/e2eHook.ts`).
- **Counts.** Contract baseline on `main` 9a44799: unit 4171, e2e 184. Deploy smoke line seen in the S-28 Deploy run
  41261590741, job `deploy` 124716473458 (checked at plan review): `ok   precache covers house pictures — 3 of 3 house pictures precached`.

## Desired End State

- `HouseGeometry` (`src/core/types.ts`) carries the per-building look: `background`, `teaser` (colour, shadow or null,
  weight) and `standInRoof`. `HOUSE_GEOMETRY['base-1']` holds the manifest cells and lift shaft, the base shell
  and airlock keys, the shared house frame, `#e8efeb`, a dark teaser without shadow, no stand-in roof. `HouseView` has no
  `if base` and reads no building colour from `HOUSE_LAYOUT`.
- `HOUSE_ART` lists five pictures (house shell, house airlock-blind, shared frame, base shell, base airlock); the house
  scene loads and judges only the three its geometry names (`houseArtKeys`); per-building size caps (house ≤ 80 000 B,
  base ≤ 110 000 B). Deploy smoke: `5 of 5 house pictures precached` with no script change.
- `pl.house.open` is a record by house id (`'house-1': 'Dom'`, `'base-1': 'Baza'`); the room's zoom-out shows the saved
  building's label; the room snapshot reports it (`houseLabel`).
- `TaskScene.backToChoice` stops the house scene; `HouseScene.create` resets its art flags, so the other building's
  pictures load after "Wróć".
- The stand-in roof (house only) has real height, its numbers in `HOUSE_LAYOUT.standIn`.
- Gap 195 closed, 196 narrowed, new gap rows for the base frame and base stand-in; CLAUDE.md "Current state" has one S-29
  sentence; follow-ups recorded with `Trigger:` lines.
- `tests/e2e/base-cross-section.spec.ts` proves the base view in the rendered frame, the one-tap return, the
  celebration without the button and the stay in the base, and the house after "Wróć" from the base.

### Key Discoveries:

- `houseCells` already keeps a finished `currentRoom` as `current`, so FR-046's "stays in the base" needs no rule change.
- `HOUSE_ART.every(...)` in `HouseScene.shellReady` would make the house wait for base files: the art rows and the
  per-geometry filter must land in the same phase.
- The base airlock shares the file name `cell-closed.png` with the house: the game file must be `base-1-cell-closed`.
- Hit zones are added in `HouseScene.create`, so a stop + start per building rebuilds them; only the instance flags leak.

## What We're NOT Doing

- No Hangar or any second module, no teaser tile on the Mostek card, no "Moduł gotowy!" title (D4; S-30 adds Hangar as
  data and `main.ts` `mergeHouse` + `nextRoom` moves a finished-Mostek child on at the next start).
- No new scene (`BaseScene`), no `if base` in `HouseScene`/`HouseView`/`RoomScene` (D1).
- No new back-button copy: "Wróć do pokoju" stays in the base (D8); the HUD "Do pokoju" is unchanged.
- No per-building Hasło words (gap 198, D7), no change to `UIScene.create` (first-building-choice follow-up 16).
- No "Obrazki" line for the house/base pictures (house-cross-section follow-up 5 stays carried) and no new
  decode-failure console line (follow-up 19 re-recorded, P5).
- No change to the save format, `validateSave`, the load path, `FIRST_ROOM`/`FIRST_HOUSE` fallbacks (follow-up 18:
  unreachable for the base, research § 5), the deploy scripts, `scripts/check-deploy.ts`, boot loading.
- No code-drawn frame for the base (the shared house frame is used, R4).

## Implementation Approach

Data contracts first (style on the geometry, label record, art-key helper, hook field) with the house's look unchanged;
then the base pictures and the per-geometry art filter (base still unreachable); then the base geometry and the
stale-scene fix, which together switch the base on; then docs, gaps, follow-ups, the seam sweep and the visual pass;
finally the browser spec. Two tdd, two impl, one e2e phase; no phase adds a new UI component (only `HouseView` and
`RoomScene` are edited).

## Critical Implementation Details

- **Timing & lifecycle.** Reset `artQueued`, `artSettled`, `cells` and `modes` at the TOP of `HouseScene.create`, before
  `show()` calls `loadArt()`; `RoomScene.create` resetting `visiting` is the pattern. In `TaskScene.backToChoice` stop the
  house scene beside `ui` and `room`, before `scene.start(SCENE_KEYS.welcome, …)`.
- **Ordering.** `houseArtKeys` and the `HouseScene` filter must land with (or before) the base `HOUSE_ART` rows (phase 2),
  otherwise `shellReady` for the house waits for base files.

## Phase 1: Per-building look, label and art keys as data

Driver: tdd
Driver why: the style fields, the label record, `houseArtKeys` and the snapshot field are absent; literal data oracles and source guards lead them red-first.

### Overview

Move every building-specific constant of the cross-section onto the building's data with the house's values unchanged,
and take house-cross-section follow-up 20 (stand-in numbers into `HOUSE_LAYOUT`) while `HouseView` is open.

### Changes Required:

#### 1. Geometry contract and the house values

**Files**: `src/core/types.ts`, `src/data/houses.ts`, `src/data/layout.ts`

**Intent**: the cross-section's look belongs to the building, so the base can differ by data only (D1, R2).

**Contract**: `HouseGeometry` gains `background: number`, `teaser: { color: string; shadow: string | null; weight: number }`,
`standInRoof: boolean`. `HOUSE_GEOMETRY['house-1']` gets `background: 0xe7f4f4`,
`teaser: { color: '#FFF5DF', shadow: '#245C59', weight: 650 }`, `standInRoof: true`. `HOUSE_LAYOUT`
drops `background` and the teaser's colour/shadow/weight (keeps `teaser.size`, `teaser.shadowOffset`); `standIn` gains
`margin: 24` and `apexY` (the roof apex in scene px, `shellTop` = 148, so the roof rises 64 px above its base instead of
24 — follow-up 20).

#### 2. Art keys of a geometry

**File**: `src/core/houseCells.ts`

**Contract**: `houseArtKeys(g: HouseGeometry): string[]` = `[g.shell, g.cellClosed, g.cellFrame]`, de-duplicated, fresh
array. Phase 2 filters `HOUSE_ART` with it.

#### 3. View reads the geometry

**File**: `src/ui/widgets/HouseView.ts`

**Contract**: `render` fills `geometry.background`; the teaser text uses `geometry.teaser` (no `shadow` option when
`shadow === null`) centred in the cell as today (`rect.y + rect.height / 2`, origin 0.5; plan review F1: no offset); `standInShell` draws the roof only when
`geometry.standInRoof`, with `HOUSE_LAYOUT.standIn.margin`/`apexY`. No house id appears in the file.

#### 4. Label by building

**Files**: `src/data/pl.ts`, `src/scenes/RoomScene.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`

**Intent**: FR-048 — the zoom-out names the building ("Dom" / "Baza" are the PRD's words, not invented copy).

**Contract**: `pl.house.open: Readonly<Record<string, string>>` = `{ 'house-1': 'Dom', 'base-1': 'Baza' }` (comment cites
FR-048; gap 195 stays open until phase 3 gives the base a geometry). `RoomScene.redraw` shows
`pl.house.open[savedHouse.id]`; the hide rule is unchanged. `RoomScene.snapshot` gains `houseLabel: string | null` (the
shown label, `null` while hidden); the hook Snapshot type in `tests/e2e/support/hook.ts` follows.

#### 5. Tests

**Files**: `tests/houseCells.test.ts`, `tests/houseSceneWiring.test.ts` (wiring guards, incl. the `HouseView` source),
`tests/roomVisitWiring.test.ts`, `tests/layout.test.ts` (if it pins `HOUSE_LAYOUT`)

**Contract**: literal `house-1` style values; `houseArtKeys(HOUSE_GEOMETRY['house-1'])` =
`['house/house-1-shell', 'house/cell-closed', 'house/cell-frame']`, de-dup case on a synthetic geometry; every
`HOUSE_GEOMETRY` key and every `HOUSES` id has a non-empty `pl.house.open` entry, `'base-1'` → `'Baza'`; source guards:
`HouseView.ts` contains no `HOUSE_LAYOUT.background`, no `teaser.color` from `HOUSE_LAYOUT`, no `'house-1'`/`'base-1'`;
`RoomScene.redraw` reads `pl.house.open[` with the saved house id; `standIn.apexY` < roof base (`min cell y − margin`)
by at least 48.

### Success Criteria:

#### Automated Verification:

- The new cases red before the code exists, green after; `npx vitest run tests/houseCells.test.ts tests/houseSceneWiring.test.ts tests/roomVisitWiring.test.ts tests/layout.test.ts` green; unit `4171 + N`
- Deliberate break: make `houseArtKeys` drop `cellFrame` → its literal case red; delete the `'base-1'` label → the label case red; read `HOUSE_LAYOUT.background` again in `HouseView` → the guard red; each restored; meta-check: the guards prove wiring only, the house still drawing as before is the visual pass (phase 4) and the base look is the rendered-pixel e2e (phase 5)
- `git diff --stat 68d1488 -- src/core/save.ts src/data/rooms.ts src/data/balance.ts src/data/houseArt.ts public scripts` empty
- Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `184 + 0`

---

## Phase 2: Base pictures and the per-building art filter

Driver: impl
Driver why: an art-script row, two generated WebP files, two table rows and a filter in the scene, proven by the art-table tests — art pipeline and glue.

### Overview

The base shell and airlock become game files, precached; the house scene loads and judges only its own building's
pictures. The base is still unreachable (no geometry until phase 3).

### Changes Required:

#### 1. Art script and files

**Files**: `scripts/make-task-art.mjs`, `public/assets/house/base-1-shell.webp`, `public/assets/house/base-1-cell-closed.webp` (generated)

**Intent**: convert the base pack's two pictures like the house pack's (D2), with a distinct game name for the airlock.

**Contract**: a second list (e.g. `BASE_FILES`) from `SPACE` into `HOUSE_OUT`: `assets/base/base-1-shell.png` →
`base-1-shell.webp`, `assets/base/cell-closed.png` → `base-1-cell-closed.webp`; `convert()` settings unchanged, no board
recolour (not a room); counted in the summary line. Every other output byte-identical. Needs `cwebp` and the pinned
Pillow 12.1.0 + numpy 2.4.3 (the salon recolour runs in the same script).

#### 2. Table

**File**: `src/data/houseArt.ts`

**Contract**: `entry('base-1-shell', 1920, 1080)`, `entry('base-1-cell-closed', 608, 342)`; header comment names both
buildings. `scripts/check-deploy.ts` unchanged (its `precacheCovers('house pictures', …)` reads `HOUSE_ART`).

#### 3. Filter in the scene

**File**: `src/scenes/HouseScene.ts`

**Intent**: load and judge only the pictures the current building names (NFR: one building's art).

**Contract**: a private `art()` = `HOUSE_ART` entries whose key is in `houseArtKeys(this.geometry())`; `shellReady`,
`loadArt`'s `missing` list, `onFail` and `onAdd` use it. Comment "three pictures" becomes building-neutral.

#### 4. Tests

**File**: `tests/houseArt.test.ts`, `tests/houseSceneWiring.test.ts`

**Contract**: expected sizes add the two base keys; orphan and key-separation cases unchanged; "weighs at most 80 000 B in
all" becomes per building: for each `HOUSE_GEOMETRY` entry the sum of the files its `houseArtKeys` name, with caps
`{ 'house-1': 80_000, 'base-1': 110_000 }` (test constant; comment: runtime load, not boot; base measured about
102 900 B) and a case that every geometry has a cap; until phase 3 the base cap is checked over the two base rows plus
the shared frame directly. Wiring guard: `HouseScene` filters through `houseArtKeys(` and no longer calls
`HOUSE_ART.every(` / `HOUSE_ART.filter((e) => !this.textures`.

### Success Criteria:

#### Automated Verification:

- `npm run art` regenerates the files; `git status --short public/assets` shows only the two new files in `public/assets/house/`
- `npx vitest run tests/houseArt.test.ts tests/houseSceneWiring.test.ts tests/choiceArt.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `<phase-1 count> + N`
- Deliberate break: delete `base-1-cell-closed.webp` → the size and orphan cases red; put back `HOUSE_ART.every(` in `shellReady` → the wiring guard red; set the base cap to 90 000 → the cap case red (the base sum is above it); each restored; meta-check: the size oracle is the pack manifest, the filter guard proves wiring, the browser load of only one building is phase 5
- `npm run build` then `grep -o "assets/house/" dist/sw.js | wc -l` = 5 (sw.js is one line)
- `git diff --stat <phase-1 sha> -- public/assets/rooms public/assets/ui public/assets/tasks public/assets/choice src/scenes/BootScene.ts src/core/save.ts` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `184 + 0`

#### Manual Verification:

- [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers house pictures — 5 of 5 house pictures precached` (line seen verbatim in the S-28 Deploy run 41261590741, job `deploy` 124716473458: `ok   precache covers house pictures — 3 of 3 house pictures precached`; expected after this slice: 5 of 5)

---

## Phase 3: The base geometry and the stale house scene

Driver: tdd
Driver why: `HOUSE_GEOMETRY['base-1']`, the art-flag reset and the house-scene stop are absent; the manifest literal, the flipped "every house has a geometry" case and source guards lead them red-first.

### Overview

Switch the base on: its cross-section as data, the "Baza" button appears (phase-1 label, existing hide rule), and the
house scene is fresh for whichever building the child picks after "Wróć".

### Changes Required:

#### 1. Base geometry

**File**: `src/data/houses.ts`

**Contract**: `HOUSE_GEOMETRY['base-1']` = `shell: 'house/base-1-shell'`, `cellClosed: 'house/base-1-cell-closed'`,
`cellFrame: 'house/cell-frame'` (shared, DESIGN-GAP comment, R4), `cellFill: 0xfff5df`, `frameInset: 16`, the four cells of
`bases.base-1` (same ids, floors, places, rects as `house-1`), `stairwell` = the manifest `liftShaft` (860, 236, 200×742),
`background: 0xe8efeb`, `teaser: { color: '#245C59', shadow: null, weight: 600 }` (preview: `fillText` at y+182 is the alphabetic baseline of
32 px text, so the glyphs centre at about y+171, the cell centre, as in the house; plan review F1), `standInRoof: false`. The S-28 comment on `HOUSES` "No HOUSE_GEOMETRY entry yet" goes.

#### 2. Stale scene (first-building-choice follow-up 17, extended per R5)

**Files**: `src/scenes/HouseScene.ts`, `src/scenes/TaskScene.ts`

**Contract**: `HouseScene.create` sets `artQueued = false`, `artSettled = false`, `cells = []`, `modes = {}` before any
other line; `TaskScene.backToChoice` calls `this.scene.stop(SCENE_KEYS.house)` beside the `ui`/`room` stops, before
`scene.start(SCENE_KEYS.welcome`.

#### 3. Tests

**Files**: `tests/houseCells.test.ts`, `tests/houseArt.test.ts`, `tests/houseSceneWiring.test.ts`, `tests/themeBackWiring.test.ts`, `tests/roomVisitWiring.test.ts`, `tests/roomsData.test.ts`

**Contract**: "has a geometry for every house but the base" flips to "every house of `HOUSES` has a geometry" (pin
dropped, comment cites S-29); "a cell for every place" runs over every house; a base literal case
(`[id, floor, place, x, y]` of the four cells, stairwell rect, `background`, `teaser`, `standInRoof: false`) written from
the manifest/preview, and the base cells equal the house cells; `houseCells(base geometry, HOUSES base-1, 'bridge', …)` →
states `['current', 'closed', 'closed', 'closed']`, also with Mostek done; the per-building cap case now iterates the base
geometry; guards: `HouseScene.create` resets both flags before `this.show()`, `backToChoice` stops `SCENE_KEYS.house`
before starting the welcome; `roomVisitWiring` comment on the hide rule updated (both buildings have geometry).

### Success Criteria:

#### Automated Verification:

- The new and flipped cases red before the code exists, green after; unit `<phase-2 count> + N`
- Deliberate break: change a base cell's `x` → the manifest literal red; drop the `artQueued` reset → the guard red; drop `scene.stop(SCENE_KEYS.house)` → the guard red; each restored; meta-check: the literals come from the pack manifest and preview, not from the house entry; the guards prove wiring, the browser proof of the fresh scene is phase 5 test 3
- `git diff --stat <phase-2 sha> -- src/core/save.ts src/data/rooms.ts src/data/balance.ts src/main.ts public scripts` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `184 + 0` (no existing spec asserts the base has no zoom-out)

---

## Phase 4: Docs, gap rows, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, gap rows, follow-ups and leftovers over phases 1-3 plus the screenshot matrix — docs and glue.

### Overview

Close the slice in the repo's records, sweep leftovers, and look at every state a child can see.

### Changes Required:

#### 1. Docs

**Files**: `CLAUDE.md`, `docs/design-gaps.md`, `context/changes/base-cross-section/follow-ups/review-fixes.md` (new)

**Contract**: CLAUDE.md "Current state": ONE compact S-29 sentence (`HOUSE_GEOMETRY['base-1']` with per-building
`background`/`teaser`/`standInRoof`, `houseArtKeys` filtering `HOUSE_ART`, `base-1-shell`/`base-1-cell-closed` in
`public/assets/house/`, `pl.house.open` by house id, `houseLabel` in the room snapshot, `backToChoice` stops the house
scene and `HouseScene.create` resets its art flags, save v6 unchanged), and the S-28 wording that the base has no zoom-out
updated. Gap rows from 199: the base frame reuses the house `cell-frame` (R4); the base stand-in shell is an outline
without a roof; row 195 marked closed by S-29 ("Baza", FR-048); row 196 narrowed to "no teaser tile while no next module
exists" (D4). The base background and teaser style are copied from the pack preview: cited in the `houses.ts` comment,
not a gap. Follow-ups with `Trigger:` lines: first-building-choice 9 (closed, D5), 17 (closed by phase 3), 18 (carried,
research § 5), 11/16/19 and gap 198 (carried); house-cross-section 19 (re-recorded, P5), 20 (closed by phase 1), 21
(closed by phase 5), 2/4/5/9/11 (carried unchanged); every other open follow-up whose `Trigger:` names a file this slice
changed (`HouseScene`, `HouseView`, `HOUSE_LAYOUT`, `RoomScene.redraw`, `TaskScene.backToChoice`,
`scripts/make-task-art.mjs`, `src/data/houseArt.ts`) — included, closed with evidence, or re-recorded.

#### 2. Seam sweep

**Files**: as found

**Contract**: `grep` for leftovers of phases 1-3 — "three pictures"/"house 1" wording in `HouseScene`/`houseArt.ts`
comments, "No HOUSE_GEOMETRY entry yet"/"until S-29" wording in `src/` and `tests/`, a duplicated art-key list outside
`houseArtKeys`, unused `HOUSE_LAYOUT` fields, `pl.house.open` used anywhere as a string, the `pl.ts` gap comment naming
"Dom" only, gap numbers cited in comments matching the rows.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "houseArtKeys|base-1-cell-closed|houseLabel" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/base-cross-section/follow-ups/review-fixes.md` ≥ 10; `grep -cE "^\| (199|20[0-9]) " docs/design-gaps.md` ≥ 2
- Seam sweep: `grep -rn "until S-29\|No HOUSE_GEOMETRY entry yet\|S-29 adds" src tests` empty; `grep -rn "'base-1'" src` only in `src/data/houses.ts`, `src/data/pl.ts` and `src/core/types.ts`/the hook if they name it
- `git diff --stat <phase-3 sha> -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `184 + 0`

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the base cross-section at the start (Mostek framed in ground-left, three airlocks with a dark "Wkrótce", `#e8efeb` stage, "Wróć do pokoju"); (2) the base cross-section with Mostek done (still framed); (3) the base under `?e2eArt=house` (stand-in outline, no roof); (4) Mostek with the "Baza" button; (5) the Mostek room-done card (one tile, no teaser, no "Baza" button); (6) Mostek after "Dalej" (change mode and "Baza"); (7) the house cross-section unchanged with "Dom" (regression); (8) the house under `?e2eArt=house` (stand-in with the taller roof); compare (1) against `designs/bystrow-space-base-v1/screenshots/base-with-bridge.png` and (7) against the S-23 visual frames
- [human] Accept the Mostek celebration while no next module exists: the room card with one tile and no teaser, "Dalej" stays in Mostek with change mode and the "Baza" button (roadmap unknown owned by the author, decision D4; FR-046 met, no new card or copy)
- [human] Accept the house `cell-frame` reused around the module in renovation in the base (the base pack has no frame; DESIGN-GAP row, R4) and "Wróć do pokoju" as the base's back label (D8)
- [human] On a real tablet, installed and then offline: a base child opens "Baza" and the base pictures draw (precache)
- [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes (`gh run view --log` keeps them between `Tests` and the number), `Tests  <4168 + N> passed | 3 skipped` and `e2e hook: absent (` (as seen in the S-28 Deploy run 41261590741, job `build` 124715797789: `Tests  4168 passed | 3 skipped (4171)` and `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds)

---

## Phase 5: The base cross-section in the browser — e2e (FR-045, FR-046, FR-048; #16, #2, #12)

Driver: e2e
Driver why: the risk exists only in the rendered cross-section and the room's button (which building's pictures show, the label, the card hiding the button, the fresh scene after "Wróć"); built by phases 1-3, after the phase-4 seam sweep, contract `E2E=on`; test-plan #16 (purchase flow to the card), #2 (the base survives a reload), #12 (first-launch choice path).

### Overview

One spec against the hook build modelled on `tests/e2e/house-cross-section.spec.ts` and
`tests/e2e/first-building-choice.spec.ts`, with a rendered-frame pixel helper (profile § 8: a "visible" risk reads the
rendered frame, not a texture).

### Changes Required:

#### 1. Rendered pixel helper

**File**: `tests/e2e/support/hook.ts`

**Contract**: `renderedPixel(page, sceneX, sceneY): Promise<[r, g, b]>` — maps the scene point to the page like
`tapScene`, takes `page.screenshot({ clip: 1×1 })` and decodes the PNG with `node:zlib` `inflateSync` (no new
dependency). Test code only.

#### 2. Spec

**File**: `tests/e2e/base-cross-section.spec.ts` (new); `playwright.config.ts` (add `base-cross-section` to the
`ROUND_SPEC` alternation, project `chromium-hook`; no other field)

**Contract**: tests (risk ids in titles), each in a fresh context:
- `#12 S-29 FR-045 FR-048 a base child's zoom-out is "Baza" and shows the base; Mostek returns with one tap` —
  `passWelcome(page, QUIET, 'space')`, answer, room switch → room `bridge`, `room.houseLabel === 'Baza'`; tap
  `houseButton` → `screen 'house'`, `house.id 'base-1'`, cells `['current','closed','closed','closed']` with ground-left
  room `bridge`, `shellReady` true; `renderedPixel` at a stage point left of the shell (e.g. scene 120, 600) within ±4 of
  `#e8efeb`; at a point inside a closed cell chosen from the pack PNGs where the base airlock and the house blind differ
  by more than 40 in a channel (point and expected colour recorded in a spec comment) the base colour; closed cells do
  nothing; tap ground-left → room `bridge`, `visiting` null.
- `#16 #2 S-29 FR-046 after the last Mostek purchase the card hides "Baza"; "Dalej" stays in Mostek with change mode; a
  reload keeps it` — `e2eStars: '100'`, buy the seven tasks (existing room helpers) → card up, `houseButton` null
  (house-cross-section follow-up 21); "Dalej" → room `bridge`, mode button present, `houseLabel 'Baza'`; the house view
  keeps ground-left `current`; back in the notebook a right answer raises the stars; reload → task screen, room switch
  → `bridge` done, `houseLabel 'Baza'`.
- `#12 S-29 FR-048 after "Wróć" from the base the house child sees "Dom" and the house pictures` — child path, choose
  Baza, room → "Baza" → house scene (base art queued) → back → notebook → `themeBack` → choice → choose Dom → room →
  `houseLabel 'Dom'` → house view `house-1`, `shellReady` true, `renderedPixel` at the same stage point within ±4 of
  `#e7f4f4`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`): show `pl.house.open['house-1']` for every building → test 1 red; drop the `artQueued` reset in `HouseScene.create` → test 3 red (`shellReady` false); show the house button while the card is up (drop `blocked` from the hide rule) → test 2 red; set the base `background` to the house colour → test 1's pixel assert red; each restored; green after
- `npx playwright test tests/e2e/base-cross-section.spec.ts --list` lists 3 tests under `chromium-hook` only; spec green; full e2e (orchestrator, `--workers=4`) `184 + 3`; total equals `npx playwright test --list | tail -1`
- Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)

---

## Testing Strategy

### Unit Tests:

- `tests/houseCells.test.ts`: `houseArtKeys`, house and base geometry literals, every house has a geometry and a label, base cell states (phases 1, 3).
- `tests/houseArt.test.ts`: five files, per-building caps, orphan, key separation, not at boot (phases 2, 3).
- Wiring guards: `houseSceneWiring` (filter, flag reset), `themeBackWiring` (house stop), `roomVisitWiring` (label, hide rule), `HouseView` reads no building constant (phases 1-3).

### Integration Tests:

- Deploy smoke: `house pictures` 5 of 5 (proven at ship, no script change).
- e2e: phase-5 spec; `house-cross-section.spec.ts` and `first-building-choice.spec.ts` stay green on every phase.

### Manual Testing Steps:

1. Base child: notebook → "Do pokoju" → "Baza" → base cross-section → tap Mostek → room.
2. Finish Mostek (`?e2eStars=100`): card without "Baza", "Dalej", change mode, "Baza" again.
3. Child path: Baza → "Baza" → back → "Wróć" → Dom → "Dom" shows the house.
4. Tablet, installed, offline: the base pictures draw.

## Performance Considerations

Boot unchanged (house/base pictures load on the cross-section's first open, `tests/houseArt.test.ts` "not loaded by
BootScene"). A base child fetches about 102 900 B at the first "Baza" (shell 81 970 + airlock 12 308 + shared frame
8 600), from the precache.

## Migration Notes

None. The saved `house.id` selects the geometry, art, style and label; `visiting` stays runtime only. Save format v6.

## Known risks

- The shared house frame may clash with the base shell in the game (composite in research looked right); the visual pass
  row (1) and the `[human]` frame row decide; would change: a clash, then a code-drawn frame in a token colour.
- A base picture that downloads but does not decode leaves no console line (house-cross-section follow-up 19, P5).
- The code-drawn stand-in colours (`HOUSE_LAYOUT.standIn.closed`, `.frame`, `.outline`) stay shared by both buildings: only
  reached when a picture is missing, judged in visual frames (3) and (8) (plan review F4); would change: the base stand-in
  reading as a house in those frames, then move them onto the geometry like `background`.

## Autonomous decisions

Maintainer decisions (scope.md), D1-D8 (change.md) and R1-R7 (research) are kept; none is overturned. Decided at this
step (no `AskUserQuestion`; the skill's complexity and structure confirmations were decided from the artifacts: MEDIUM
complexity, 0 open product questions after research, 5 phases):

- **P1 — style on `HouseGeometry`** (`background`, `teaser`, `standInRoof`; no `offsetY`, plan review F1), per R2. Rejected: a sibling
  `HOUSE_STYLE` in `layout.ts`. Would change: S-26 (street) needing `HouseGeometry` as pure geometry.
- **P2 — `houseArtKeys` filters the one flat `HOUSE_ART`** (R3), game file `base-1-cell-closed`. Rejected: a per-building
  table (two smoke lines). Would change: a building whose art lives elsewhere.
- **P3 — per-building size caps in the test** (house 80 000 B, base 110 000 B), a test constant, runtime load only.
  Rejected: one raised total (would hide a heavier house). Would change: a base re-export or a boot-time load.
- **P4 — take house-cross-section follow-up 20 in phase 1** (stand-in numbers into `HOUSE_LAYOUT.standIn`, apex 64 px)
  and give the geometry `standInRoof` so the base stand-in has no gable. Rejected: a gap row for a house-shaped base
  stand-in. Would change: nothing foreseen.
- **P5 — re-record house-cross-section follow-up 19** (no decode-failure console line). Why: the stand-in and
  `artFallbacks.house = 'drawn'` still follow; keeping phase 2 to the filter. Would change: a parent report of a blank
  base, or the house getting an "Obrazki" line.
- **P6 — FR-046 celebration: D4 default** (existing card, one tile, no teaser, "Dalej" stays in Mostek with change mode
  and the "Baza" button). The roadmap names the author as owner of this unknown → `[human]` row 4.7. Not a PRD deviation
  (FR-046 asks for the FR-040 celebration and staying in the base). Would change: the author asking for a teaser or a
  module-specific card.
- **P7 — `houseLabel` in the room snapshot** (hook-readable label) added in phase 1 so the e2e phase writes no product
  code. Would change: nothing.
- **P8 — the e2e reads the rendered frame** through a test-only screenshot helper (profile § 8 lesson from S-23).
  Rejected: `housePixel` (a texture, stayed green while the shell covered every cell). Would change: a hook frame reader
  added for another reason.
- **P9 — phases**: five (2 tdd, 2 impl, 1 e2e), no new UI component; follow-up 17 and the base geometry share phase 3
  because the stale scene only becomes reachable when the base has a cross-section.
- No PRD deviation; no `[human]` row is needed for one. The `[human]` rows record the author-owned unknown (P6) and the
  design gaps (frame, back label).

## References

- Research: `context/changes/base-cross-section/research.md`; identity and decisions: `context/changes/base-cross-section/change.md`; run scope: `context/runs/2026-10-31-space-base/scope.md`
- Format examples: `context/archive/2026-10-31-first-building-choice/plan.md`, `context/archive/2026-10-31-house-cross-section/plan.md`; follow-ups `context/archive/2026-10-31-house-cross-section/follow-ups/review-fixes.md` (19-21), `context/archive/2026-10-31-first-building-choice/follow-ups/review-fixes.md` (9, 17, 18)
- Pack: `designs/bystrow-space-base-v1/manifest.json` (`bases.base-1`), `README.md`, `preview.html?view=base`, `screenshots/base-with-bridge.png`; house frame `designs/martynka-house-street-v1/assets/house/cell-frame.png`
- Code: `src/scenes/HouseScene.ts` (`create`, `shellReady`, `loadArt`, `geometry`), `src/ui/widgets/HouseView.ts` (`render`, `standInShell`), `src/scenes/RoomScene.ts` (`redraw`, `snapshot`), `src/scenes/TaskScene.ts` (`backToChoice`), `src/core/houseCells.ts`, `src/core/types.ts` (`HouseGeometry`), `src/data/houses.ts`, `src/data/houseArt.ts`, `src/data/layout.ts` (`HOUSE_LAYOUT`), `src/data/pl.ts` (`house`), `src/testing/e2eHook.ts`, `scripts/make-task-art.mjs`, `scripts/check-deploy.ts`
- PRD: `context/foundation/prd.md` FR-045, FR-046, FR-048; test plan `context/foundation/test-plan.md` risks #2, #12, #16

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: Per-building look, label and art keys as data

#### Automated

- [x] 1.1 The new cases red before the code exists, green after; `npx vitest run tests/houseCells.test.ts tests/houseSceneWiring.test.ts tests/roomVisitWiring.test.ts tests/layout.test.ts` green; unit `4171 + N` — 55c8c16
- [x] 1.2 Deliberate break: make `houseArtKeys` drop `cellFrame` → its literal case red; delete the `'base-1'` label → the label case red; read `HOUSE_LAYOUT.background` again in `HouseView` → the guard red; each restored; meta-check: the guards prove wiring only, the house still drawing as before is the visual pass (phase 4) and the base look is the rendered-pixel e2e (phase 5) — 55c8c16
- [x] 1.3 `git diff --stat 68d1488 -- src/core/save.ts src/data/rooms.ts src/data/balance.ts src/data/houseArt.ts public scripts` empty — 55c8c16
- [x] 1.4 Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `184 + 0` — 55c8c16

### Phase 2: Base pictures and the per-building art filter

#### Automated

- [x] 2.1 `npm run art` regenerates the files; `git status --short public/assets` shows only the two new files in `public/assets/house/` — 7db029e
- [x] 2.2 `npx vitest run tests/houseArt.test.ts tests/houseSceneWiring.test.ts tests/choiceArt.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `<phase-1 count> + N` — 7db029e
- [x] 2.3 Deliberate break: delete `base-1-cell-closed.webp` → the size and orphan cases red; put back `HOUSE_ART.every(` in `shellReady` → the wiring guard red; set the base cap to 90 000 → the cap case red (the base sum is above it); each restored; meta-check: the size oracle is the pack manifest, the filter guard proves wiring, the browser load of only one building is phase 5 — 7db029e
- [x] 2.4 `npm run build` then `grep -o "assets/house/" dist/sw.js | wc -l` = 5 (sw.js is one line) — 7db029e
- [x] 2.5 `git diff --stat <phase-1 sha> -- public/assets/rooms public/assets/ui public/assets/tasks public/assets/choice src/scenes/BootScene.ts src/core/save.ts` empty — 7db029e
- [x] 2.6 Full local gate green; e2e (orchestrator, `--workers=4`) `184 + 0` — 7db029e

#### Manual

- [ ] 2.7 [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers house pictures — 5 of 5 house pictures precached` (line seen verbatim in the S-28 Deploy run 41261590741, job `deploy` 124716473458: `ok   precache covers house pictures — 3 of 3 house pictures precached`; expected after this slice: 5 of 5)

### Phase 3: The base geometry and the stale house scene

#### Automated

- [x] 3.1 The new and flipped cases red before the code exists, green after; unit `<phase-2 count> + N` — fc493af — 0dbfcf9
- [x] 3.2 Deliberate break: change a base cell's `x` → the manifest literal red; drop the `artQueued` reset → the guard red; drop `scene.stop(SCENE_KEYS.house)` → the guard red; each restored; meta-check: the literals come from the pack manifest and preview, not from the house entry; the guards prove wiring, the browser proof of the fresh scene is phase 5 test 3 — fc493af — 0dbfcf9
- [x] 3.3 `git diff --stat <phase-2 sha> -- src/core/save.ts src/data/rooms.ts src/data/balance.ts src/main.ts public scripts` empty — fc493af — 0dbfcf9
- [x] 3.4 Full local gate green; e2e (orchestrator, `--workers=4`) `184 + 0` (no existing spec asserts the base has no zoom-out) — orchestrator, f51eedc (159 passed + 16 load failures re-judged `--last-failed --workers=1`: 25 passed, 184/184)

### Phase 4: Docs, gap rows, follow-ups, seam sweep and the visual pass

#### Automated

- [x] 4.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "houseArtKeys|base-1-cell-closed|houseLabel" CLAUDE.md` present — 2bcc350
- [x] 4.2 `grep -c "Trigger:" context/changes/base-cross-section/follow-ups/review-fixes.md` ≥ 10; `grep -cE "^\| (199|20[0-9]) " docs/design-gaps.md` ≥ 2 — 2bcc350
- [x] 4.3 Seam sweep: `grep -rn "until S-29\|No HOUSE_GEOMETRY entry yet\|S-29 adds" src tests` empty; `grep -rn "'base-1'" src` only in `src/data/houses.ts`, `src/data/pl.ts` and `src/core/types.ts`/the hook if they name it — 2bcc350
- [x] 4.4 `git diff --stat <phase-3 sha> -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty — 2bcc350
- [ ] 4.5 Full local gate green; e2e (orchestrator, `--workers=4`) `184 + 0` (local gate green at p4: lint, typecheck, 4185 unit, deploy/ops, sample E1-E6, build; the e2e count is the orchestrator's)

#### Manual

- [ ] 4.6 [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the base cross-section at the start (Mostek framed in ground-left, three airlocks with a dark "Wkrótce", `#e8efeb` stage, "Wróć do pokoju"); (2) the base cross-section with Mostek done (still framed); (3) the base under `?e2eArt=house` (stand-in outline, no roof); (4) Mostek with the "Baza" button; (5) the Mostek room-done card (one tile, no teaser, no "Baza" button); (6) Mostek after "Dalej" (change mode and "Baza"); (7) the house cross-section unchanged with "Dom" (regression); (8) the house under `?e2eArt=house` (stand-in with the taller roof); compare (1) against `designs/bystrow-space-base-v1/screenshots/base-with-bridge.png` and (7) against the S-23 visual frames
- [ ] 4.7 [human] Accept the Mostek celebration while no next module exists: the room card with one tile and no teaser, "Dalej" stays in Mostek with change mode and the "Baza" button (roadmap unknown owned by the author, decision D4; FR-046 met, no new card or copy)
- [ ] 4.8 [human] Accept the house `cell-frame` reused around the module in renovation in the base (the base pack has no frame; DESIGN-GAP row, R4) and "Wróć do pokoju" as the base's back label (D8)
- [ ] 4.9 [human] On a real tablet, installed and then offline: a base child opens "Baza" and the base pictures draw (precache)
- [ ] 4.10 [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes (`gh run view --log` keeps them between `Tests` and the number), `Tests  <4168 + N> passed | 3 skipped` and `e2e hook: absent (` (as seen in the S-28 Deploy run 41261590741, job `build` 124715797789: `Tests  4168 passed | 3 skipped (4171)` and `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds)

### Phase 5: The base cross-section in the browser — e2e (FR-045, FR-046, FR-048; #16, #2, #12)

#### Automated

- [ ] 5.1 Spec red before (deliberate breaks, each run alone with `-g`): show `pl.house.open['house-1']` for every building → test 1 red; drop the `artQueued` reset in `HouseScene.create` → test 3 red (`shellReady` false); show the house button while the card is up (drop `blocked` from the hide rule) → test 2 red; set the base `background` to the house colour → test 1's pixel assert red; each restored; green after
- [ ] 5.2 `npx playwright test tests/e2e/base-cross-section.spec.ts --list` lists 3 tests under `chromium-hook` only; spec green; full e2e (orchestrator, `--workers=4`) `184 + 3`; total equals `npx playwright test --list | tail -1`
- [ ] 5.3 Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)
