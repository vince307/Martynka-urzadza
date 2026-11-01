# Laboratorium, the third module of the base, with the base's own cell frame — Implementation Plan

## Overview

Roadmap slice S-33 `lab-module` (milestone M-03, Stream D "Baza kosmiczna"; PRD FR-046, FR-045, FR-035), autonomous run
`2026-11-01-bathroom-polish-lab`, branch `feat/lab-module` cut from `main` at `60472aa` (S-32 merge, save format v7).
Outcome: a child with the space base, after the Hangar, renovates the Laboratorium (walls and floor, then microscope,
rock case, flask table, Moon model, stool and magnetic board in 3 variants each) in the base's `upper-left` cell; the
module in renovation wears the base's own frame (`base-1-cell-frame` from `bystrow-space-base-v5`) instead of the house
`cell-frame`; adding the module is data and art.

Binding inputs: `context/runs/2026-11-01-bathroom-polish-lab/scope.md` (S-33: the Laboratory from
`designs/bystrow-space-base-v3`, the base card gets a third tile, hangar-module follow-up 1 applies; full e2e suite only by
the orchestrator once after the last phase), `change.md` D1-D8, `research.md` §1-§6 (its Code References are the
grounding). No lessons file exists in `context/foundation/` (checked at this step), so no lesson is named in a phase.

**Data and art, with a short named list of non-data touches.** No file under `src/scenes` (except one doc comment in
`HouseScene.art`), `src/core`, `src/ui`, `src/main.ts`, `src/testing` or `vite/` changes. Non-data code: the art script
`scripts/make-task-art.mjs` (`SPACE_BASE_V3`, `SPACE_BASE_V5`, a per-row `pack` in `BASE_FILES`), tests, the playwright
`ROUND_SPEC` alternation. **Save format stays v7 (`SAVE_VERSION` 7), no migration;** one frozen fixture is ADDED
(`tests/fixtures/save-v7-hangar-done.json`). A phase that finds it must change a scene, a core module, the save format,
`HouseView`, the room-done card layout, star income, curriculum, task generators, `balance.loader` or another room's data
or pictures stops with `STATUS: BLOCKED` and records why.

## Current State Analysis

Grounded in `research.md`, spot-checked on this branch at `63fb504`:

- **The base is data.** `HOUSES['base-1']` (`src/data/houses.ts`) = `[bridge (0,0), hangar (0,1)]`;
  `HOUSE_GEOMETRY['base-1']` has four cells, `upper-left` (floor 1, place 0, 252,236, 608×342) drawn as the closed airlock
  today; its `cellFrame` is `'house/cell-frame'` with a `DESIGN-GAP` comment (gap 199).
- **A module is data.** `HANGAR` (`src/data/rooms.ts`, `hangarSlots` copied 1:1 from the v2 manifest, stage `renovate` 6
  then six slots 10/13/14/17/19/21 = 100), `ROOMS`, `ROOM_SCENE_FILES.hangar` (`src/data/roomArt.ts`),
  `pl.room.{names,tasks,slots,variants}` (`src/data/pl.ts`, Hangar block citing gap 201); `ROOM_ART`, the precache, the
  smoke's `precacheCovers('room pictures', …)` and `tests/bootBudget.test.ts` (`it.each(Object.keys(ROOMS))`) derive from
  `ROOMS`.
- **Flow is generic.** `nextRoom` → `roomInRenovation` (`src/core/house.ts`) picks the first known not-done room;
  `houseRoomList` builds the card tiles and emits a "Wkrótce" teaser ONLY for a house cell whose room the data does not
  know — the base will list three known rooms, so no teaser appears on any base card (change.md D3, research §5). Three
  tiles fit the unchanged 1144 card (`roomDoneCardRect`, `src/core/roomDoneLayout.ts`).
- **The frame is per geometry.** `HouseView.render` draws `geometry.cellFrame` at `(cell − frameInset)` with size
  `cell + 2·frameInset`; `houseArtKeys` (`src/core/houseCells.ts`) loads `[shell, cellClosed, cellFrame]` per building. The
  v5 frame is 640×374 RGBA with a fully transparent `[16,16,608,342]` interior — identical geometry to the house frame and
  `frameInset: 16`. Its border is mint (85,204,181) where the house frame is butter (248,210,106): frame-local (8,187) →
  scene **(244, 407)** for `upper-left`, **(1052, 807)** for `ground-right` (research §2).
- **Art script.** `scripts/make-task-art.mjs` has `SPACE_BASE` (v1) and `SPACE_BASE_V2`; `BASE_FILES` converts
  `join(SPACE_BASE, file.from)` (v1 only); the kit-existence loop covers `ROOM_PACKS` packs but not a `BASE_FILES`-only pack.
- **Budget.** Measured (research §3): 21 lab WebP 656 332 B (Hangar 606 452 B) → a lab boot ≈ 30.9 s vs 48 s; salon stays
  the worst (41.4 s); the atlas trigger does not fire. Frame WebP 3 498 B; base house-art weight 97 776 B ≤ cap 110 000.
- **Pins to change** (research §5): `tests/roomsData.test.ts` (placement invariant, base `houseRoomList`, describe "hangar
  flow (FR-047)"), `tests/houseCells.test.ts` ("names its own pictures, shares the frame"), `tests/houseArt.test.ts`
  (`expected` map), `tests/roomArt.test.ts` (snapshots, counts), `tests/fixtureLoadPath.test.ts` (bridge-done merged rooms,
  `FIXTURES`), `tests/e2e/hangar-module.spec.ts` #16 (card items `[bridge ✓, hangar ✓]`, "Dalej" stays). `hangar-module`
  #2 and `base-cross-section.spec.ts` stay green (the lab cell is `closed` until reached); no e2e pins `cell-frame`.
- **Counts.** Contract baseline on `main` 60472aa: unit 4254 (4251 + 3 skipped), e2e 196. CI lines SEEN at this step
  (`gh run view --log --job`, sandbox disabled) in Deploy run 41345696658: job `build` 124964905937, step `Run npm test`:
  `Tests  4251 passed | 3 skipped (4254)`; step `Run npm run build`: `e2e hook: absent (2 chunks checked)`; job `deploy`
  124965472637, step `Smoke check (deploy)`: `ok   precache served: 239/239 — every entry answered with its media type`,
  `ok   precache covers room pictures — 146 of 146 room pictures precached`,
  `ok   precache covers house pictures — 5 of 5 house pictures precached`.

## Desired End State

- `LAB: RoomDef` in `src/data/rooms.ts` (stage + six slots from `designs/bystrow-space-base-v3/manifest.json` `rooms.lab`,
  costs 6/10/13/14/17/19/21 = 100), in `ROOMS`; `ROOM_SCENE_FILES.lab`; Polish copy in `pl.room.*`; 21 WebP under
  `public/assets/rooms/lab/` made by `npm run art`.
- `HOUSES['base-1']` = Mostek, Hangar, then `{ room: 'lab', floor: 1, place: 0 }`. Every base card (after Mostek, after the
  Hangar, after the Laboratorium) shows three tiles; "Dalej" after the Hangar opens the Laboratorium; after the last
  Laboratorium purchase three done tiles, no teaser, "Dalej" keeps the child there in change mode with "Baza".
- The base cross-section frames the module in renovation with `house/base-1-cell-frame` (mint); house 1 keeps
  `house/cell-frame` (butter).
- A v7 save with the Hangar finished (frozen fixture) loads into the Laboratorium with nothing lost.
- Deploy smoke: `167 of 167 room pictures`, `6 of 6 house pictures`, `precache served: 261/261`, no script change.
- Gap 199 closed, gap 196 narrowed (the last module is now the Laboratorium), new gap 208 (Laboratorium wording ours);
  CLAUDE.md "Current state" has one S-33 sentence; follow-ups recorded with `Trigger:` lines.
- `tests/e2e/lab-module.spec.ts` proves the third module in the rendered cross-section (base frame pixel) and the
  Laboratorium bought to the end.

### Key Discoveries:

- `tests/roomArt.test.ts` "leaves no file … without a table entry" means the 21 WebP files, `LAB`, its scene-file row and
  copy land in ONE phase; `tests/houseArt.test.ts` orphan check means the frame WebP and its `HOUSE_ART` row land together.
- The placement invariant in `tests/roomsData.test.ts` ("keyed by its own id and placed in exactly one house") turns red
  when `LAB` joins `ROOMS` without a `HOUSES` row: phase 1 carries a temporary exemption that phase 2 removes (S-31
  bathroom precedent).
- The `HOUSES` row flips `hangar-module.spec.ts` #16 (card gains the lab tile, "Dalej" moves): phase 2 edits it and runs
  that spec alone.

## What We're NOT Doing

- No change in `src/core`, `src/ui`, `src/main.ts`, `src/testing`, `vite/`; `src/scenes` only the `HouseScene.art` doc comment.
- No `cabins` row / "Wkrótce" teaser on the base card (D3; S-34 owns the fourth module); no module-specific celebration.
- No v5 crew, sticker or life layers (S-35); only `assets/base/base-1-cell-frame.png` from v5.
- No base stand-in shell change (gap 200 stays; base-cross-section follow-up 6 stand-in half carried).
- No save-format change, no migration, no e2e save seam (a frozen fixture + the in-session e2e path prove the load).
- No `balance.loader` comment edit (salon stays worst); no `roomArtCheck` wiring (hangar follow-up 3 not fired).
- No retirement of `recolour-board.py` (house-1-polish follow-up 2 fires on the art script but is out of scope; carried).
- No thumbnail for the Laboratorium (`thumbnail` optional; Mostek and Hangar have none).

## Implementation Approach

Room first (data, copy, art and their table tests, still unreachable), then the one `HOUSES` row that switches it on with
the flipped flow tests, the frozen fixture and the edited Hangar spec, then the base frame (art + one data key), then
docs, gaps, follow-ups, seam sweep and the visual pass, finally one browser spec. Drivers: impl, tdd, impl, impl, e2e.

**E2E under load (scope.md):** no phase runs the full e2e suite. A phase runs only the spec it adds or edits, alone,
with the single-spec command from `context/foundation/test-stack.md` (sandbox disabled); the orchestrator runs the full
suite (`npx playwright test --workers=4`) ONCE after phase 5 from a pinned worktree, expected `196 + 2`, total equal to
`npx playwright test --list | tail -1`.

## Phase 1: The Laboratorium room as data, copy and art (unreachable)

Driver: impl
Driver why: art conversion through the script plus data rows copied from the pack manifest, proven by the existing room-art and room-data invariants — art pipeline and data glue.

### Overview

The Laboratorium exists as a room with its pictures and Polish text, precached and budget-checked, but no house lists it.

### Changes Required:

#### 1. Art script and files

**Files**: `scripts/make-task-art.mjs`, `public/assets/rooms/lab/*.webp` (21, generated)

**Intent**: convert the v3 pack like the Hangar pack (FR-046 "dodanie modułu to dane i grafika").

**Contract**: a pack-root constant `SPACE_BASE_V3` = `designs/bystrow-space-base-v3`; a `ROOM_PACKS` row `{ room: 'lab',
pack: SPACE_BASE_V3, scene: ['lab-before', 'lab-after', 'lab-shadows'], decor: [], furniture:
lab-<microscope|rocks|flasks|globe|stool|board>-<natural|sunny|mint>, recolourBoard: false }`, same shape as the hangar
row. `convert()` settings unchanged; every other output byte-identical. Needs `cwebp` and Python with Pillow 12.1.0 +
numpy 2.4.3 (the salon recolour runs in the same script).

#### 2. Room data

**Files**: `src/data/rooms.ts`, `src/data/roomArt.ts`

**Intent**: the Laboratorium as a `RoomDef`, a sibling of `HANGAR` (D1, D5).

**Contract**: `labSlots: SlotDef[]` copied slot by slot from the manifest (id, x, y, width, height, z, anchor,
visibleRect; variants `lab/lab-<slot>-<natural|sunny|mint>`), manifest order and values: microscope 684,444 488×472 z30
anchor [244,456]; rocks 634,194 203×412 z15 [102,396]; flasks 1094,464 340×322 z25 [170,306]; globe 1414,434 242×329 z28
[121,313]; stool 724,704 204×242 z40 [102,226]; board 344,264 292×247 z10 [146,231]; visibleRect per research §1. `LAB` =
`id: 'lab'`, `scene: { before: 'lab/before', after: 'lab/after', shadows: 'lab/shadows' }`, `decor: []`, `worn: []`,
`contactShadows: []`, tasks: stage `renovate` 6, then `place-microscope` 10, `place-rock-case` 13, `place-flask-table` 14,
`place-moon-model` 17, `place-stool` 19, `hang-board` 21 (labels `placeMicroscope`, `placeRockCase`, `placeFlaskTable`,
`placeMoonModel`, `placeStool`, `hangBoard`); a header comment naming the pack and FR-046 like the Hangar one. `ROOMS`
gains `[LAB.id]: LAB` after the last existing entry. `ROOM_SCENE_FILES.lab` = `{ before: 'lab-before', after: 'lab-after',
shadows: 'lab-shadows' }`.

#### 3. Polish copy (teacher read)

**File**: `src/data/pl.ts`

**Intent**: child-facing text with correct gender/number agreement (CLAUDE.md working rules, D7).

**Contract**:

| key | text |
|---|---|
| `room.names.lab` | Laboratorium |
| `room.slots['lab-microscope' / 'lab-rocks' / 'lab-flasks' / 'lab-globe' / 'lab-stool' / 'lab-board']` | mikroskop / gablota z kamieniami / stół z kolbami / model Księżyca / stołek / tablica magnetyczna |
| `room.variants` | microscope, flasks, globe, stool: `['Naturalny', 'Słoneczny', 'Miętowy']`; rocks, board: `['Naturalna', 'Słoneczna', 'Miętowa']` |
| `room.tasks` | `placeMicroscope` Postaw mikroskop · `placeRockCase` Postaw gablotę z kamieniami · `placeFlaskTable` Postaw stół z kolbami · `placeMoonModel` Postaw model Księżyca · `placeStool` Postaw stołek · `hangBoard` Powieś tablicę magnetyczną |

A comment cites design gap 208 (the pack gives slot labels and masculine family names only; task labels and agreed
variant forms are ours). `renovate` ("Odnów ściany i podłogę") is reused.

#### 4. Tests

**Files**: `tests/roomArt.test.ts`, `tests/fixtures/room-art-lab.json` (new snapshot), `tests/roomsData.test.ts`,
`tests/roomHit.test.ts`, `tests/rooms.test.ts`

**Contract**: snapshot equality adds `roomArt(ROOMS.lab)` = the new fixture (written from the pack, not dumped from
`roomArt()`: keys and urls from the manifest file names, width/height from the source PNG sizes, labels from the caption
table) and `ROOM_ART` concatenation in `ROOMS` order; the count case names "21 lab entries"; a `describe('lab data
(FR-046)')` with a manifest literal (`[id, x, y, width, height, z]` per slot, written from the manifest, not from
`labSlots`), stage first then six slot tasks, costs `[6, 10, 13, 14, 17, 19, 21]` summing to 100, every slot bought once;
`unreachableSlots` over the Laboratorium with all six bought = `[]`; `lab` joins the "keep the old before/after ternary"
case in `tests/rooms.test.ts`. **Placement exemption:** the invariant "keyed by its own id and placed in exactly one house"
changes ONLY its expected count to `id === 'lab' ? 0 : 1` with a comment "S-33 phase 1: no house lists the Laboratorium
yet; phase 2 adds its HOUSES row and removes this exemption".

### Success Criteria:

#### Automated Verification:

- `npm run art` regenerates the files; `git status --short public/assets` shows only the 21 new files under `public/assets/rooms/lab/`
- `npx vitest run tests/roomArt.test.ts tests/roomsData.test.ts tests/roomHit.test.ts tests/rooms.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `4254 + N`
- Deliberate break: change the stool's `x` in `labSlots` → the manifest literal red; delete `lab-board-mint.webp` → the size/orphan cases red; drop `'lab-rocks'` from `pl.room.variants` → the copy case red; each restored; meta-check: the literal comes from the pack manifest, not from `labSlots`; the art cases prove files and tables agree, the picture looking right is the visual pass (phase 4)
- `npm run build` then `grep -o "assets/rooms/lab/" dist/sw.js | wc -l` = 21 (sw.js is one line)
- `git diff --stat 60472aa -- src/scenes src/core src/ui src/main.ts src/testing src/data/houses.ts src/data/houseArt.ts src/data/balance.ts public/assets/rooms/salon public/assets/rooms/kitchen public/assets/rooms/children public/assets/rooms/bathroom public/assets/rooms/bridge public/assets/rooms/hangar public/assets/house` empty
- Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); no e2e in this phase (no spec touched; the room is unreachable; the orchestrator runs the full suite after phase 5)

#### Manual Verification:

- [reviewer] Teacher read of the Laboratorium copy in `src/data/pl.ts` against the table above: caption nominatives, variant forms agreeing with the noun's gender (gablota, tablica → -a), task labels in imperative + accusative (gablotę, tablicę magnetyczną), "Księżyca" capitalised as the celestial body, each task label fits its button (`RoomTaskButton` `labelScale`); `npm run sample` unaffected (no task content changed), stated in the handoff
- [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 167 of 167 room pictures precached` (SEEN at plan time in Deploy run 41345696658, job `deploy` 124965472637: `ok   precache covers room pictures — 146 of 146 room pictures precached`; expected 146 + 21 = 167)

---

## Phase 2: The Laboratorium joins the base

Driver: tdd
Driver why: the `HOUSES` row is absent; the removed placement exemption, the flipped flow tests and the finished-Hangar fixture lead it red-first — pure data contracts.

### Overview

One data row puts the Laboratorium in `upper-left`; "Dalej" after the Hangar leads into it; a saved finished Hangar
opens there.

### Changes Required:

#### 1. House row

**File**: `src/data/houses.ts`

**Intent**: D2 — the v3 README and `screenshots/base-with-three-modules.png` place the Laboratorium at (252,236), the
existing `upper-left` cell.

**Contract**: `HOUSES['base-1'].rooms` gains `{ room: 'lab', floor: 1, place: 0 }` after the Hangar; the row comment says
the Laboratorium is the third module (S-33).

#### 2. Frozen fixture

**File**: `tests/fixtures/save-v7-hangar-done.json` (new, frozen)

**Contract**: a v7 save as the S-32 build writes it (shape of `tests/fixtures/save-v7.json`: `version 7`, `generation`,
`writer`), base content after `tests/fixtures/save-v6-bridge-done.json`: `house` `{ id: 'base-1', rooms: [bridge (0,0),
hangar (0,1)] }`, `currentRoom: 'hangar'`, `rooms.bridge` and `rooms.hangar` at `tasksDone: 7` with a chosen variant for
each slot, a stars value, a learner, variants. Hand-written (R2), never edited after this phase.

#### 3. Tests

**Files**: `tests/roomsData.test.ts`, `tests/houseCells.test.ts`, `tests/fixtureLoadPath.test.ts`,
`tests/e2e/hangar-module.spec.ts`

**Contract**:
- `roomsData`: the phase-1 placement exemption removed (red while the row is missing); `houseRoomList(base-1)` gains
  `{ room: 'lab', unlockAfter: 'hangar' }`; describe "hangar flow (FR-047)": "keeps the child in the Hangar … Dalej stays"
  becomes "moves a finished Hangar into the Laboratorium" (`currentRoom 'lab'`, `movedFrom 'hangar'`); new describe "lab
  flow (FR-046)": "keeps the child in the Laboratorium after its last task: Dalej stays" (gap 196 moved, D3).
- `houseCells`: with `currentRoom 'lab'` and Mostek, Hangar done → `ground-left` and `ground-right` `done`, `upper-left`
  `current` with room `lab`, `upper-right` `closed`; the existing base cases stay green (lab `closed` until reached).
- `fixtureLoadPath`: `save-v7-hangar-done` joins `FIXTURES` (round-trip, nothing dropped, writes v7); a case mirroring
  `main.ts`'s load order (`repairCurrentRoom` → `mergeHouse` → `nextRoom`) expects house `base-1` with three cells,
  `currentRoom 'lab'`, `rooms.bridge` and `rooms.hangar` equal to the fixture's, stars kept; the "save-v6-bridge-done
  meets the Hangar" merged-rooms expectation widens to `['bridge', 'hangar', 'lab']` (current room stays `hangar`).
- e2e `hangar-module.spec.ts` #16: title becomes `#16 S-30 S-33 FR-047 FR-046 the Hangar is bought to the end: the card
  shows Mostek, Hangar and the Laboratorium; "Dalej" opens the Laboratorium; the balance is exact`; card items =
  `[['room','bridge',true],['room','hangar',true],['room','lab',false]]`, no teaser; balance 0 after the last purchase
  (the save's stars); "Dalej" → room `lab`, `tasksDone 0`, `houseLabel 'Baza'`.

### Success Criteria:

#### Automated Verification:

- The flipped and new unit cases red before the `HOUSES` row exists, green after; unit `<phase-1 count> + N`
- Deliberate break: give the lab row `place: 1` (floor 1, place 1 = the `upper-right` cell instead of `upper-left`) → the `houseCells` case red; drop the row → the roomsData, placement and fixture cases red; each restored; meta-check: the fixture case mirrors `main.ts`'s calls rather than running `main.ts`, so a reorder in `main.ts` would not be caught here — the phase-5 e2e reload is the browser proof of the same path
- `npx playwright test tests/e2e/hangar-module.spec.ts` (sandbox disabled, single spec) green, 2 tests; the full e2e suite is NOT run here
- `git diff --stat <phase-1 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/core/save.ts src/data/rooms.ts src/data/balance.ts public scripts` empty; `git log --format=%h <phase-1 sha>.. -- tests/fixtures/save-v7.json tests/fixtures/save-v6-bridge-done.json` empty
- Full local gate green; full e2e left to the orchestrator after phase 5

---

## Phase 3: The base wears its own cell frame

Driver: impl
Driver why: art conversion through the script plus one data key and one `HOUSE_ART` row, proven by the existing house-art size/orphan/weight and house-cell key cases flipped alongside — art pipeline and data glue.

### Overview

The module in renovation is framed in the base's mint frame from v5; house 1 keeps its butter frame.

### Changes Required:

#### 1. Art script and file

**Files**: `scripts/make-task-art.mjs`, `public/assets/house/base-1-cell-frame.webp` (generated)

**Intent**: D4 — the v5 pack delivers the base frame; no code-drawn frame.

**Contract**: `SPACE_BASE_V5` = `designs/bystrow-space-base-v5`; `BASE_FILES` rows carry an optional `pack` (default
`SPACE_BASE`) and the loop converts `join(file.pack ?? SPACE_BASE, file.from)`; new row `{ pack: SPACE_BASE_V5, from:
'assets/base/base-1-cell-frame.png', to: 'base-1-cell-frame.webp' }`; the kit-existence loop also checks `SPACE_BASE_V5`
(and every `BASE_FILES` pack). Every other output byte-identical; native size 640×374, no resize, no recolour.

#### 2. Data

**Files**: `src/data/houseArt.ts`, `src/data/houses.ts`, `src/scenes/HouseScene.ts` (doc comment only)

**Contract**: `HOUSE_ART` row `entry('base-1-cell-frame', 640, 374)`; `HOUSE_GEOMETRY['base-1'].cellFrame =
'house/base-1-cell-frame'` (`frameInset` 16 unchanged) and its "DESIGN-GAP: … house cell-frame is shared" comment replaced
by one naming the v5 pack; `HouseScene.art` doc "the base: its own two plus the shared frame" → "the base: its own three".
`HOUSE_GEOMETRY['house-1']` untouched.

#### 3. Tests

**Files**: `tests/houseCells.test.ts`, `tests/houseArt.test.ts`

**Contract**: "names its own pictures, shares the frame" → "names its own pictures and its own frame", expecting
`['house/base-1-shell', 'house/base-1-cell-closed', 'house/base-1-cell-frame']`; `houseArtKeys(HOUSE_GEOMETRY['house-1'])`
still `[…, 'house/cell-frame']` (house 1 unchanged, existing case); `houseArt` `expected` map gains
`'house/base-1-cell-frame': [640, 374]`, CAPS unchanged, the "about 102 900 B" comment updated to the measured base weight.

### Success Criteria:

#### Automated Verification:

- `npm run art` then `git status --short public/assets` shows only `public/assets/house/base-1-cell-frame.webp`
- `npx vitest run tests/houseCells.test.ts tests/houseArt.test.ts tests/deployCheck.test.ts` green; unit `<phase-2 count> + N`
- Deliberate break: set `HOUSE_GEOMETRY['house-1'].cellFrame` to the base frame → the house-1 `houseArtKeys` case red; delete `base-1-cell-frame.webp` → the size/orphan case red; each restored; meta-check: the unit cases prove keys and files; that the mint frame is what the child SEES around the module is the phase-5 rendered pixel and the phase-4 visual frame
- `npm run build` then `grep -o "assets/house/base-1-cell-frame.webp" dist/sw.js | wc -l` = 1
- `git diff --stat <phase-2 sha> -- src/core src/ui src/main.ts src/testing src/data/rooms.ts src/data/pl.ts src/data/balance.ts public/assets/rooms` empty; `git diff <phase-2 sha> -- src/scenes` touches comment lines only
- Full local gate green; no e2e in this phase (no spec touched; the orchestrator runs the full suite after phase 5)

#### Manual Verification:

- [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers house pictures — 6 of 6 house pictures precached` and `ok   precache served: 261/261 — every entry answered with its media type` (SEEN at plan time in Deploy run 41345696658, job `deploy` 124965472637: `ok   precache covers house pictures — 5 of 5 house pictures precached` and `ok   precache served: 239/239 — every entry answered with its media type`; expected 5 + 1 and 239 + 22)

---

## Phase 4: Docs, gap rows, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, gap rows, follow-ups and leftovers over phases 1-3 plus the screenshot matrix — docs and glue.

### Overview

Close the slice in the repo's records, sweep leftovers, and look at every state a child can see.

### Changes Required:

#### 1. Docs

**Files**: `CLAUDE.md`, `docs/design-gaps.md`, `context/changes/lab-module/follow-ups/review-fixes.md` (new)

**Contract**: CLAUDE.md "Current state": ONE compact S-33 sentence in the style of the S-30 Hangar one (the Laboratorium
`lab` as the base's third module, roadmap S-33, change lab-module, PRD FR-046; save format stays v7: `LAB` in
`src/data/rooms.ts`, 7 tasks costing 6-21 = 100, art from `bystrow-space-base-v3` in `public/assets/rooms/lab/`, the row
`{ room: 'lab', floor: 1, place: 0 }` in `HOUSES['base-1']` (`upper-left`), every base card shows three tiles, the
Laboratorium is the base's last module (three done tiles, no teaser, "Dalej" stays with change mode and "Baza"), the base
frame `house/base-1-cell-frame` from `bystrow-space-base-v5` (`BASE_FILES` with a per-row pack) while house 1 keeps
`cell-frame`, the frozen fixture `tests/fixtures/save-v7-hangar-done.json`, gaps 196/199/208, follow-ups path), and the
S-30 sentence's "the Hangar is the base's last module" clause updated. `docs/design-gaps.md`: row 199 closed (the base
frame comes from v5); row 196 narrowed again (the last module is now the Laboratorium; trigger "a fourth base module
(S-34) or a designer answer"); new row 208 (lab-module: the pack gives slot labels and masculine family names only; task
labels and agreed variant forms are ours). Follow-ups with `Trigger:` lines: hangar-module 1 (closed, fired: Hangar card
gains the lab tile), base-cross-section 6 (frame half closed, stand-in half carried), hangar-module 2 / gap 201 (not
fired, carried), hangar-module 4 / bathroom 9 / house-1-polish 11 (a room finished on an older build meets the next
without the card; applies to Hangar → Laboratorium; carried), atlas (bathroom 7 / house-1-polish 13: lab ≈ 30.9 s, not
fired, re-recorded with the measured lab number), SW-install warning (bathroom 10 / house-1-polish 9: fired by 22 new
precache entries, re-recorded), house-1-polish 2 recolour retirement (fired, out of scope, carried), hangar-module 3
`roomArtCheck` (not fired, carried), base-cross-section 13 (`HouseScene`/`HouseView` items; its trigger "the next change to
`HouseScene`" fires on the phase-3 doc-comment edit of `HouseScene.art` — re-recorded unchanged, no behaviour touched; plan
review F2), audit-art-renderer 2 (Python without `-I`; fires on the art-script change, already done: `execFileSync('python3',
['-I', …])` in `scripts/make-task-art.mjs` — closed with that evidence); every other open follow-up whose `Trigger:` names a file this slice changed
(`src/data/rooms.ts`, `src/data/houses.ts`, `src/data/houseArt.ts`, `src/data/roomArt.ts`, `src/data/pl.ts`,
`scripts/make-task-art.mjs`) — closed with evidence or re-recorded.

#### 2. Seam sweep

**Files**: as found

**Contract**: `grep` for leftovers — "the Hangar is the base's last module", "shares the frame", "shared frame", "house
cell-frame is shared", "until S-33", "S-33 adds", "phase 1: no house lists the Laboratorium" in `src/`, `tests/`,
`scripts/`, `CLAUDE.md`; gap numbers cited in comments match the rows (199 no longer cited as open, 208 in `pl.ts`); no
duplicated `[6, 10, 13, 14, 17, 19, 21]` literal outside data/tests; `balance.loader` comment untouched (salon still worst).

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "save-v7-hangar-done|assets/rooms/lab|base-1-cell-frame" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/lab-module/follow-ups/review-fixes.md` ≥ 6; `grep -cE "^\| 208 " docs/design-gaps.md` = 1
- Seam sweep: `grep -rnE "shares the frame|shared frame|cell-frame is shared|until S-33|S-33 adds|id === 'lab' \? 0" src tests scripts` empty; `npm run art` then `git status --short public/assets` empty (byte-identical)
- `git diff --stat <phase-3 sha> -- src/scenes src/core src/ui src/main.ts src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty
- Full local gate green; full e2e left to the orchestrator after phase 5

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the Mostek room-done card with three tiles (Mostek done, Hangar, Laboratorium); (2) the Hangar room-done card with three tiles (Mostek done, Hangar done, Laboratorium); (3) the Laboratorium before look after "Dalej" (first task "Odnów ściany i podłogę"); (4) the Laboratorium variant panel open on the microscope (three thumbnails, Polish captions); (5) the Laboratorium after look fully furnished in the natural family; (6) the Laboratorium room-done card (three done tiles, no teaser, no "Baza" button); (7) the Laboratorium after "Dalej" (change mode and "Baza"); (8) the base cross-section with Mostek and Hangar done and the Laboratorium in `upper-left` in the mint base frame; (9) the base cross-section with the Hangar in renovation in `ground-right` wearing the mint frame; (10) the house 1 cross-section with its butter `cell-frame` unchanged around the room in renovation; (11) the Laboratorium under `?e2eArt=room` (stand-in boxes with Polish labels); compare (5) against `designs/bystrow-space-base-v3/screenshots/lab-after-natural.png`, (3) against `designs/bystrow-space-base-v3/screenshots/lab-before.png`, (8) against `designs/bystrow-space-base-v3/screenshots/base-with-three-modules.png` and (8)-(9) against `designs/bystrow-space-base-v5/screenshots/base-cell-frame.png`
- [reviewer] Polish read of every caption visible in frames (1)-(11) (tile names "Laboratorium", captions, task labels, variant names, "Baza", "Dalej")
- [human] Accept the Laboratorium costs 6/10/13/14/17/19/21 = 100 stars in the manifest's slot order (roadmap unknown "Ceny Laboratorium", owner: author; D1, S-17 tunes)
- [human] Accept the Laboratorium wording (gap 208): "Postaw gablotę z kamieniami", "Postaw model Księżyca", "Powieś tablicę magnetyczną", the agreed variant forms
- [human] Accept the Laboratorium as the base's last module with NO "Wkrótce" teaser tile — decided against the roadmap S-33 Risk text ("wraca kafelek zapowiedzi"), not against the PRD: `houseRoomList` makes a teaser only for an unknown room, and adding a `cabins` row before S-34 would put an unknown room into saves (D3, gap 196)
- [human] On a real tablet, installed and then offline: a base child who finished the Hangar opens the Laboratorium, its pictures and the mint frame draw (precache)
- [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes, `Tests  <4251 + N> passed | 3 skipped` and `e2e hook: absent (` (SEEN at plan time in Deploy run 41345696658, job `build` 124964905937, step `Run npm test`: `Tests  4251 passed | 3 skipped (4254)`, step `Run npm run build`: `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds)

---

## Phase 5: The Laboratorium in the browser — e2e (FR-046, FR-045; #16, #2)

Driver: e2e
Driver why: the risk exists only in the rendered cross-section (the mint frame and the third module in `upper-left`) and the purchase flow across three modules; built by phases 1-3, after the phase-4 seam sweep, contract `E2E=on`; test-plan #16 (purchase flow, balance exact) and #2 (the module survives a reload).

### Overview

One spec against the hook build modelled on `tests/e2e/hangar-module.spec.ts`, reading the RENDERED frame for the
"visible" risk (profile § 8), not a texture.

### Changes Required:

#### 1. Spec

**Files**: `tests/e2e/lab-module.spec.ts` (new); `playwright.config.ts` (add `lab-module` to the `ROUND_SPEC`
alternation, project `chromium-hook`; no other field)

**Contract**: file-level `test.setTimeout(300_000)` (plan review F1: the Hangar spec's 240 s covers 14 purchases, test 2 here
makes 21; `bathroom-room.spec.ts` precedent 300 s). Tests (risk ids in titles), each in a fresh context, reusing
`tests/e2e/support/*` (the purchase loop helper the Hangar spec uses):
- `#2 S-33 FR-046 FR-045 the base shows Mostek and Hangar done and the Laboratorium in its upper-left cell in the base
  frame; a reload keeps it` — `passWelcome(…, 'space')` with `e2eStars` = Mostek + Hangar totals (200), buy both, "Dalej"
  → room `lab`, `tasksDone 0`; "Baza" → `houseView` cells by id: `ground-left` and `ground-right` `done`, `upper-left`
  `current` with room `lab`, `upper-right` `closed`; `renderedPixel` at scene (244, 407) (frame-local (8,187), research §2)
  within 30 per channel of mint (85,204,181) and NOT butter (248,210,106); tap `upper-left` → room `lab`, `visiting` null;
  reload → room `lab`.
- `#16 S-33 FR-046 the Laboratorium is bought to the end: three done tiles, no teaser; "Dalej" stays in the Laboratorium
  with change mode and "Baza"; the balance is exact` — `e2eStars` = 300, buy all three modules; Laboratorium card `items` =
  `[['room','bridge',true],['room','hangar',true],['room','lab',true]]`, no `teaser`; balance 0 after the last purchase
  (the save's stars, not the counter label); "Dalej" → room `lab`, mode button present, `houseLabel 'Baza'`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`): set `HOUSE_GEOMETRY['base-1'].cellFrame` back to `'house/cell-frame'` → test 1's pixel red; move the lab row to `place: 1` (the `upper-right` cell) → test 1 red; set a lab cost to 22 → test 2's balance red; add an unknown room to `HOUSES['base-1']` → test 2 red (teaser appears); each restored; green after; meta-check: the pixel is read from the rendered canvas, so a frame drawn under the shell or a stand-in rect would also turn it red
- `npx playwright test tests/e2e/lab-module.spec.ts --list` lists 2 tests under `chromium-hook` only; spec green with the single-spec command (sandbox disabled); the full e2e suite is NOT run by this phase — the orchestrator runs it once afterwards from a pinned worktree, expected `196 + 2`, total equal to `npx playwright test --list | tail -1`
- Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)

---

## Testing Strategy

### Unit Tests:

- `tests/roomsData.test.ts`: lab manifest literal, costs 100, placement, base room list, "Dalej" into and inside the Laboratorium (phases 1, 2).
- `tests/roomArt.test.ts`: snapshot, 21 entries, sizes, orphans, labels, weight (phase 1).
- `tests/houseCells.test.ts`: base cell states with the Laboratorium (phase 2), base frame key and house-1 key (phase 3).
- `tests/houseArt.test.ts`: frame size, orphan, base weight cap (phase 3).
- `tests/fixtureLoadPath.test.ts`: `save-v7-hangar-done` round-trip and load into the Laboratorium (phase 2).
- `tests/bootBudget.test.ts`, `tests/roomHit.test.ts`, `tests/rooms.test.ts`: lab covered by `ROOMS` iteration / explicit cases.

### Integration Tests:

- Deploy smoke: room pictures 167 of 167, house pictures 6 of 6, precache served 261/261 (proven at ship, no script change).
- e2e: phase-5 spec; `hangar-module.spec.ts` #16 edited in phase 2; full suite once by the orchestrator after phase 5.

### Manual Testing Steps:

1. Base child with `?e2eStars=200`: buy Mostek → three-tile card → "Dalej" → Hangar → buy → three-tile card → "Dalej" → Laboratorium before look.
2. "Baza" → Mostek and Hangar done, Laboratorium in the mint frame upper-left; open house 1 in another context → butter frame.
3. `?e2eStars=300`: finish all three → Laboratorium card, "Dalej" stays with change mode.
4. Tablet, installed, offline: the Laboratorium pictures and the frame draw.

## Performance Considerations

Boot loads only the room in renovation: a Laboratorium boot ≈ 30.9 s at 50 KB/s against 48 s; the salon stays the worst
case. Precache grows by about 660 KB (21 room files + the 3.5 KB frame). House art is not boot-loaded; the base's
house-art weight drops to about 97.8 KB (own frame lighter than the shared one).

## Migration Notes

None. Save v7 already carries `house`, `rooms`, `currentRoom`; the load path rebuilds the house from data and `nextRoom`
moves a finished Hangar to the Laboratorium. Rollback below this build: `repairCurrentRoom` sends an unknown `lab` to
Mostek, `mergeHouse` keeps the saved extra cell, `rooms.lab` stays (Hangar precedent); no `deploy/README.md` line. The
frame is runtime art, never saved.

## Known risks

- The Laboratorium miniature in `upper-left` may sit close to the base shell's roof line; visual frame (8) decides; would change: a designer re-export.
- The phase-5 purchase runs (14 and 21 buys) are load-sensitive; a timeout is judged with `--last-failed --workers=1` (scope process limits).
- A child who finished the Hangar before S-33 meets the Laboratorium at the next start without the celebration that announces it (card only at purchase; carried follow-up).
- The mint frame may read weaker than the butter one on the dark base shell; visual frames (8), (9) and the tablet `[human]` row decide.

## Autonomous decisions

Maintainer decisions (scope.md), D1-D8 (change.md) and R1-R3 (research) are kept; none is overturned. Decided at this
step (no `AskUserQuestion`; the skill's complexity and structure confirmations were decided from the artifacts:
LOW-MEDIUM complexity, 0 open product questions after research, 5 phases):

- **P1 — task labels** "Postaw mikroskop", "Postaw gablotę z kamieniami", "Postaw stół z kolbami", "Postaw model
  Księżyca", "Postaw stołek", "Powieś tablicę magnetyczną" (keys `placeMicroscope` … `hangBoard`, none collides in
  `pl.ts`). Rejected: "Postaw tablicę" (the board is wall-mounted, z 10, y 264 — "Powieś" like `hangFrames`); "Ustaw
  kolby" (the slot is the table). Would change: the phase-1 teacher read or a designer's wording; `[human]` row 4.6.
- **P2 — the frame is its own phase (3), after the module joins.** Rejected: folding it into phase 1 (two packs, two
  orphan/size test families in one commit) or phase 2 (mixes art conversion with a tdd data flip). Would change: nothing.
- **P3 — phase-1 placement exemption, removed red-first in phase 2** (S-31 bathroom precedent `id === 'bathroom' ? 0`).
  Rejected: landing data and the `HOUSES` row together (one huge phase, the hangar spec flip mixed with art). Would
  change: nothing.
- **P4 — `hangar-module.spec.ts` #16 edited in phase 2** (not deleted): it keeps the Hangar's balance proof and becomes
  the "Dalej opens the Laboratorium" proof; the new spec covers the Laboratorium's own end. Would change: nothing.
- **P5 — the e2e frame oracle is a rendered pixel at (244,407)** (mint vs butter, research §2), not a texture read
  (profile § 8 lesson from house-cross-section). Rejected: a pixel on the Hangar's frame at (1052,807) in addition (the
  same data key; one point suffices, visual frame (9) covers the Hangar). Would change: the point landing on shell art
  (then pick another border point and record it).
- **P6 — no e2e for house 1's unchanged frame**; the unit case `houseArtKeys(house-1)` pins the key and visual frame (10)
  shows it. Would change: a reviewer asking for a rendered butter pixel on house 1.
- **P7 — no `balance.loader` comment, no `roomArtCheck` wiring, no recolour retirement** (salon still worst; follow-ups
  not or out-of-scope fired). Would change: the lab becoming heaviest, or the maintainer widening scope.
- **P8 — `[human]` rows** carry the author-owned costs (roadmap unknown), the wording, and the no-teaser last module — the
  latter decided against the roadmap S-33 Risk text (not the PRD: FR-045/FR-046 do not require a teaser on the card;
  FR-045's "śluza z Wkrótce" is the closed `upper-right` cell, which stays).

## References

- Research: `context/changes/lab-module/research.md`; identity and decisions: `context/changes/lab-module/change.md`; run scope: `context/runs/2026-11-01-bathroom-polish-lab/scope.md`
- Format examples: `context/archive/2026-11-01-hangar-module/plan.md`, `context/archive/2026-11-01-bathroom-room/plan.md` (placement exemption, single-spec e2e)
- Follow-ups: `context/archive/2026-11-01-hangar-module/follow-ups/review-fixes.md` (1-5), `context/archive/2026-11-01-base-cross-section/follow-ups/review-fixes.md` (6, 13), `context/archive/2026-11-01-bathroom-room/follow-ups/review-fixes.md` (7, 9, 10), `context/archive/2026-11-01-house-1-polish/follow-ups/review-fixes.md` (2, 9, 11, 13)
- Packs: `designs/bystrow-space-base-v3/manifest.json` (`rooms.lab`), `README.md`, `screenshots/{base-with-three-modules,lab-before,lab-after-*}.png`; `designs/bystrow-space-base-v5/manifest.json` (`bases.base-1.cellFrame`), `assets/base/base-1-cell-frame.png`
- Code: `src/data/rooms.ts` (`HANGAR`, `ROOMS`), `src/data/houses.ts` (`HOUSES`, `HOUSE_GEOMETRY`), `src/data/houseArt.ts` (`HOUSE_ART`), `src/data/roomArt.ts` (`ROOM_SCENE_FILES`), `src/data/pl.ts` (`room`), `scripts/make-task-art.mjs` (`ROOM_PACKS`, `BASE_FILES`), `src/core/house.ts` (`nextRoom`, `mergeHouse`, `houseRoomList`), `src/core/houseCells.ts` (`houseArtKeys`), `src/ui/widgets/HouseView.ts` (`render`), `src/scenes/HouseScene.ts` (`art`), `tests/e2e/hangar-module.spec.ts` (#16)
- PRD: `context/foundation/prd.md` FR-046, FR-045, FR-035; test plan `context/foundation/test-plan.md` risks #2, #16
- CI evidence: Deploy run 41345696658, jobs `build` 124964905937 and `deploy` 124965472637

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: The Laboratorium room as data, copy and art (unreachable)

#### Automated

- [x] 1.1 `npm run art` regenerates the files; `git status --short public/assets` shows only the 21 new files under `public/assets/rooms/lab/` — 947e665
- [x] 1.2 `npx vitest run tests/roomArt.test.ts tests/roomsData.test.ts tests/roomHit.test.ts tests/rooms.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `4254 + N` — 947e665
- [x] 1.3 Deliberate break: change the stool's `x` in `labSlots` → the manifest literal red; delete `lab-board-mint.webp` → the size/orphan cases red; drop `'lab-rocks'` from `pl.room.variants` → the copy case red; each restored; meta-check: the literal comes from the pack manifest, not from `labSlots`; the art cases prove files and tables agree, the picture looking right is the visual pass (phase 4) — 947e665
- [x] 1.4 `npm run build` then `grep -o "assets/rooms/lab/" dist/sw.js | wc -l` = 21 (sw.js is one line) — 947e665
- [x] 1.5 `git diff --stat 60472aa -- src/scenes src/core src/ui src/main.ts src/testing src/data/houses.ts src/data/houseArt.ts src/data/balance.ts public/assets/rooms/salon public/assets/rooms/kitchen public/assets/rooms/children public/assets/rooms/bathroom public/assets/rooms/bridge public/assets/rooms/hangar public/assets/house` empty — 947e665
- [x] 1.6 Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); no e2e in this phase (no spec touched; the room is unreachable; the orchestrator runs the full suite after phase 5) — 947e665

#### Manual

- [ ] 1.7 [reviewer] Teacher read of the Laboratorium copy in `src/data/pl.ts` against the table above: caption nominatives, variant forms agreeing with the noun's gender (gablota, tablica → -a), task labels in imperative + accusative (gablotę, tablicę magnetyczną), "Księżyca" capitalised as the celestial body, each task label fits its button (`RoomTaskButton` `labelScale`); `npm run sample` unaffected (no task content changed), stated in the handoff
- [ ] 1.8 [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 167 of 167 room pictures precached` (SEEN at plan time in Deploy run 41345696658, job `deploy` 124965472637: `ok   precache covers room pictures — 146 of 146 room pictures precached`; expected 146 + 21 = 167)

### Phase 2: The Laboratorium joins the base

#### Automated

- [x] 2.1 The flipped and new unit cases red before the `HOUSES` row exists, green after; unit `<phase-1 count> + N` — e9e6ae2
- [x] 2.2 Deliberate break: give the lab row `place: 1` (floor 1, place 1 = the `upper-right` cell instead of `upper-left`) → the `houseCells` case red; drop the row → the roomsData, placement and fixture cases red; each restored; meta-check: the fixture case mirrors `main.ts`'s calls rather than running `main.ts`, so a reorder in `main.ts` would not be caught here — the phase-5 e2e reload is the browser proof of the same path — e9e6ae2
- [x] 2.3 `npx playwright test tests/e2e/hangar-module.spec.ts` (sandbox disabled, single spec) green, 2 tests; the full e2e suite is NOT run here — e9e6ae2
- [x] 2.4 `git diff --stat <phase-1 sha> -- src/scenes src/core src/ui src/main.ts src/testing src/core/save.ts src/data/rooms.ts src/data/balance.ts public scripts` empty; `git log --format=%h <phase-1 sha>.. -- tests/fixtures/save-v7.json tests/fixtures/save-v6-bridge-done.json` empty — e9e6ae2
- [x] 2.5 Full local gate green; full e2e left to the orchestrator after phase 5 — e9e6ae2

### Phase 3: The base wears its own cell frame

#### Automated

- [x] 3.1 `npm run art` then `git status --short public/assets` shows only `public/assets/house/base-1-cell-frame.webp`
- [x] 3.2 `npx vitest run tests/houseCells.test.ts tests/houseArt.test.ts tests/deployCheck.test.ts` green; unit `<phase-2 count> + N`
- [x] 3.3 Deliberate break: set `HOUSE_GEOMETRY['house-1'].cellFrame` to the base frame → the house-1 `houseArtKeys` case red; delete `base-1-cell-frame.webp` → the size/orphan case red; each restored; meta-check: the unit cases prove keys and files; that the mint frame is what the child SEES around the module is the phase-5 rendered pixel and the phase-4 visual frame
- [x] 3.4 `npm run build` then `grep -o "assets/house/base-1-cell-frame.webp" dist/sw.js | wc -l` = 1
- [x] 3.5 `git diff --stat <phase-2 sha> -- src/core src/ui src/main.ts src/testing src/data/rooms.ts src/data/pl.ts src/data/balance.ts public/assets/rooms` empty; `git diff <phase-2 sha> -- src/scenes` touches comment lines only
- [x] 3.6 Full local gate green; no e2e in this phase (no spec touched; the orchestrator runs the full suite after phase 5)

#### Manual

- [ ] 3.7 [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers house pictures — 6 of 6 house pictures precached` and `ok   precache served: 261/261 — every entry answered with its media type` (SEEN at plan time in Deploy run 41345696658, job `deploy` 124965472637: `ok   precache covers house pictures — 5 of 5 house pictures precached` and `ok   precache served: 239/239 — every entry answered with its media type`; expected 5 + 1 and 239 + 22)

### Phase 4: Docs, gap rows, follow-ups, seam sweep and the visual pass

#### Automated

- [ ] 4.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "save-v7-hangar-done|assets/rooms/lab|base-1-cell-frame" CLAUDE.md` present
- [ ] 4.2 `grep -c "Trigger:" context/changes/lab-module/follow-ups/review-fixes.md` ≥ 6; `grep -cE "^\| 208 " docs/design-gaps.md` = 1
- [ ] 4.3 Seam sweep: `grep -rnE "shares the frame|shared frame|cell-frame is shared|until S-33|S-33 adds|id === 'lab' \? 0" src tests scripts` empty; `npm run art` then `git status --short public/assets` empty (byte-identical)
- [ ] 4.4 `git diff --stat <phase-3 sha> -- src/scenes src/core src/ui src/main.ts src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty
- [ ] 4.5 Full local gate green; full e2e left to the orchestrator after phase 5

#### Manual

- [ ] 4.6 [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the Mostek room-done card with three tiles (Mostek done, Hangar, Laboratorium); (2) the Hangar room-done card with three tiles (Mostek done, Hangar done, Laboratorium); (3) the Laboratorium before look after "Dalej" (first task "Odnów ściany i podłogę"); (4) the Laboratorium variant panel open on the microscope (three thumbnails, Polish captions); (5) the Laboratorium after look fully furnished in the natural family; (6) the Laboratorium room-done card (three done tiles, no teaser, no "Baza" button); (7) the Laboratorium after "Dalej" (change mode and "Baza"); (8) the base cross-section with Mostek and Hangar done and the Laboratorium in `upper-left` in the mint base frame; (9) the base cross-section with the Hangar in renovation in `ground-right` wearing the mint frame; (10) the house 1 cross-section with its butter `cell-frame` unchanged around the room in renovation; (11) the Laboratorium under `?e2eArt=room` (stand-in boxes with Polish labels); compare (5) against `designs/bystrow-space-base-v3/screenshots/lab-after-natural.png`, (3) against `designs/bystrow-space-base-v3/screenshots/lab-before.png`, (8) against `designs/bystrow-space-base-v3/screenshots/base-with-three-modules.png` and (8)-(9) against `designs/bystrow-space-base-v5/screenshots/base-cell-frame.png`
- [ ] 4.7 [reviewer] Polish read of every caption visible in frames (1)-(11) (tile names "Laboratorium", captions, task labels, variant names, "Baza", "Dalej")
- [ ] 4.8 [human] Accept the Laboratorium costs 6/10/13/14/17/19/21 = 100 stars in the manifest's slot order (roadmap unknown "Ceny Laboratorium", owner: author; D1, S-17 tunes)
- [ ] 4.9 [human] Accept the Laboratorium wording (gap 208): "Postaw gablotę z kamieniami", "Postaw model Księżyca", "Powieś tablicę magnetyczną", the agreed variant forms
- [ ] 4.10 [human] Accept the Laboratorium as the base's last module with NO "Wkrótce" teaser tile — decided against the roadmap S-33 Risk text ("wraca kafelek zapowiedzi"), not against the PRD: `houseRoomList` makes a teaser only for an unknown room, and adding a `cabins` row before S-34 would put an unknown room into saves (D3, gap 196)
- [ ] 4.11 [human] On a real tablet, installed and then offline: a base child who finished the Hangar opens the Laboratorium, its pictures and the mint frame draw (precache)
- [ ] 4.12 [reviewer] (CI at ship) Deploy job `build` of the merge sha prints, after stripping ANSI colour codes, `Tests  <4251 + N> passed | 3 skipped` and `e2e hook: absent (` (SEEN at plan time in Deploy run 41345696658, job `build` 124964905937, step `Run npm test`: `Tests  4251 passed | 3 skipped (4254)`, step `Run npm run build`: `e2e hook: absent (2 chunks checked)`; N = the unit tests this slice adds)

### Phase 5: The Laboratorium in the browser — e2e (FR-046, FR-045; #16, #2)

#### Automated

- [ ] 5.1 Spec red before (deliberate breaks, each run alone with `-g`): set `HOUSE_GEOMETRY['base-1'].cellFrame` back to `'house/cell-frame'` → test 1's pixel red; move the lab row to `place: 1` (the `upper-right` cell) → test 1 red; set a lab cost to 22 → test 2's balance red; add an unknown room to `HOUSES['base-1']` → test 2 red (teaser appears); each restored; green after; meta-check: the pixel is read from the rendered canvas, so a frame drawn under the shell or a stand-in rect would also turn it red
- [ ] 5.2 `npx playwright test tests/e2e/lab-module.spec.ts --list` lists 2 tests under `chromium-hook` only; spec green with the single-spec command (sandbox disabled); the full e2e suite is NOT run by this phase — the orchestrator runs it once afterwards from a pinned worktree, expected `196 + 2`, total equal to `npx playwright test --list | tail -1`
- [ ] 5.3 Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)
