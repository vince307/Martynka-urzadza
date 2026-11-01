---
date: 2026-11-01T21:23:45+01:00
researcher: Claude (autonomous run 2026-11-01-bathroom-polish-lab, research step)
git_commit: b255848
branch: feat/lab-module
repository: Martynka-urzadza
topic: "S-33 lab-module: Laboratorium as the base's third module, base cell frame from bystrow-space-base-v5"
tags: [research, rooms, house, base-1, art-pipeline, save, e2e]
status: complete
last_updated: 2026-11-01
last_updated_by: Claude (autonomous run, research step)
---

# Research: S-33 lab-module

**Date**: 2026-11-01T21:23:45+01:00
**Researcher**: Claude (autonomous run, research step)
**Git Commit**: b255848
**Branch**: feat/lab-module
**Repository**: Martynka-urzadza

## Research Question

From `context/changes/lab-module/change.md` and the step prompt: (1) does the v3 pack manifest map onto the
`ROOM_PACKS` / `ROOM_SCENE_FILES` / `RoomDef` conventions as the Hangar did; (2) the v5 base frame: size, alpha, how
`HOUSE_GEOMETRY.cellFrame` and `HouseView` draw it, and whether a base-specific frame touches house 1; (3) boot budget
with the Laboratorium as the room in renovation; (4) the deploy smoke `roomArtCheck` count; (5) every unit test and e2e
spec that pins the Hangar as the base's last module or the base's room count/cells; (6) which path produces a real v7
save for the frozen fixture of a finished Hangar. No lessons file exists (`context/foundation/lessons.md` absent).

## Summary

- **The v3 manifest is a drop-in for the Hangar pattern.** `rooms.lab` in `designs/bystrow-space-base-v3/manifest.json`
  has `backgroundBefore/After`, `shadows`, `shadowEllipses: []` and 6 slots, each with `x, y, width, height, z, anchor,
  visibleRect` and 3 variants (`-natural/-sunny/-mint`). The Hangar's `hangarSlots` (`src/data/rooms.ts`) copy those
  fields 1:1 from the v2 manifest (e.g. `hangar-rocket` x 754 y 254 in both), so `labSlots` is a literal copy. The
  pack's file names are `assets/room/lab-{before,after,shadows}.png` and `assets/furniture/lab-<slot>-<variant>.png`,
  exactly the `ROOM_PACKS` row shape (`scene: ['lab-before','lab-after','lab-shadows']`, `furniture` 6×3,
  `recolourBoard: false`, `decor: []`). It needs a new pack constant (`SPACE_BASE_V3`) in `scripts/make-task-art.mjs`.
- **Base frame = data + art, house 1 untouched.** v5 `base-1-cell-frame.png` is 640×374 RGBA, interior
  `[16,16,608,342]` fully transparent (alpha max 0, measured), manifest `bases.base-1.cellFrame.offset [-16,-16]` —
  identical geometry to the house `cell-frame.png` (640×374) and to `frameInset: 16`. `HouseView.render` draws
  `geometry.cellFrame` per geometry, and `houseArtKeys` / `HouseScene.art` load per building, so changing only
  `HOUSE_GEOMETRY['base-1'].cellFrame` leaves house 1 on `house/cell-frame`. Colour differs (base mint ~(85,204,181),
  house butter ~(248,210,106)) — a usable e2e pixel oracle.
- **Boot budget is safe.** Converting the 21 lab PNGs with the script's cwebp flags gives **656 332 B** vs the Hangar's
  606 452 B (+49 880 B ≈ +1.0 s at 50 KB/s) → about **30.9 s** vs the 48 s limit (`balance.loader.totalMs` 50 s − 2 s
  headroom in `tests/bootBudget.test.ts`). `bootBudget` iterates `Object.keys(ROOMS)`, so it covers `lab` without edits.
- **Smoke**: `roomArtCheck` is unused by `scripts/check-deploy.ts` (it uses `precacheCovers('room pictures', …,
  ROOM_ART)`); the check count stays the same, the room-picture detail grows **146 → 167** (+21); house pictures +1.
- **Pins to change** (all listed below with reason): unit — `roomsData` (base list, "hangar flow"), `houseCells`
  (base frame key), `houseArt` (expected table), `roomArt` (snapshot + counts), `fixtureLoadPath` (bridge-done merged
  rooms, FIXTURES). e2e — only `hangar-module.spec.ts` #16. `base-cross-section.spec.ts` and `hangar-module.spec.ts` #2
  stay green (the lab cell is `closed` until reached).
- **v7 fixture path**: a real v7 record is `encodeSave(session)` (`src/core/save.ts`, writes `version: SAVE_VERSION`,
  `generation: 0`, `writer: ''`) stamped by `guardedPut` in `src/storage/idb.ts` (generation, writer). The only v7
  fixture today, `save-v7.json`, is hand-written (S-32 plan). Recommend: hand-write `save-v7-hangar-done.json` in the
  shape of `save-v7.json` + the base content of `save-v6-bridge-done.json` (with `house` two cells, `rooms.hangar`
  complete), and prove it is what the code writes by a round-trip through `loadSave`→`encodeSave` in the test
  (`fixtureLoadPath` "loads … writes v7" already does that for every FIXTURES entry).

## Detailed Findings

### 1. v3 pack vs room conventions

- `designs/bystrow-space-base-v3/manifest.json` top keys: `schemaVersion, title, package, canvas, camera, families,
  rooms, bases, composition`; `rooms.lab` = `{ id: 'lab', label: 'Laboratorium', backgroundAfter, backgroundBefore,
  shadows, shadowEllipses: [], slots[6] }` (python read, observed).
- Slot literals (manifest order → `[id, x, y, width, height, z, anchor, visibleRect]`), the oracle for a `lab data` test
  like the "hangar data (FR-047)" describe in `tests/roomsData.test.ts`:
  - `lab-microscope` 684, 444, 488, 472, z 30, anchor [244,456], visible [16,16,456,440]
  - `lab-rocks` 634, 194, 203, 412, z 15, anchor [102,396], visible [16,16,171,380]
  - `lab-flasks` 1094, 464, 340, 322, z 25, anchor [170,306], visible [16,16,308,290]
  - `lab-globe` 1414, 434, 242, 329, z 28, anchor [121,313], visible [16,16,210,297]
  - `lab-stool` 724, 704, 204, 242, z 40, anchor [102,226], visible [16,16,172,210]
  - `lab-board` 344, 264, 292, 247, z 10, anchor [146,231], visible [16,16,260,215]
  - z values are 6 distinct numbers → the "z values are distinct" check in `tests/roomsData.test.ts` holds.
  - Manifest variant labels are masculine for all six ("Naturalny/Słoneczny/Miętowy"); `pl.room.variants` must agree
    with each noun (change.md D7; Hangar precedent `pl.room.variants['hangar-rocket']` feminine).
- Reachability: `unreachableSlots` (`src/core/roomHit.ts`) on a lab `RoomDef` built from the manifest with all six slots
  bought returns `[]` (scratch script via `node --import tsx`, observed). The stool (z 40) overlaps the microscope's box
  (z 30) but leaves it reachable. A unit row like "is empty for the Hangar with all six slots bought" in
  `tests/roomHit.test.ts` can pin it.
- `HANGAR` (`src/data/rooms.ts`): one `stage` task `renovate` + 6 `slot` tasks; `scene: { before: 'hangar/before',
  after: 'hangar/after', shadows: 'hangar/shadows' }`, `worn: []`, `contactShadows: []`. README v3 § Zasoby: shadows is
  an empty technical layer, "Nie dodawaj dużych elips cienia", cream `#FFF5DF` margins → `contactShadows: []`,
  `recolourBoard: false`, no stage backgrounds (a single before→after stage, so `sceneKey`/`stageFade` need nothing).
- `ROOM_SCENE_FILES` (`src/data/roomArt.ts`) needs `lab: { before: 'lab-before', after: 'lab-after', shadows:
  'lab-shadows' }`; `roomArt` derives 3 + 18 = **21** entries. `ROOMS` (same file's import, `src/data/rooms.ts`) gets
  `[LAB.id]: LAB`.
- `scripts/make-task-art.mjs`: `ROOM_PACKS` row `{ room: 'lab', pack: SPACE_BASE_V3, scene: [...], decor: [], furniture:
  ['microscope','rocks','flasks','globe','stool','board'].flatMap(... 'lab-<slot>-<v>'), recolourBoard: false }`; the
  existence loop over `ROOM_PACKS.map((row) => row.pack)` picks up the new constant automatically.

### 2. The base cell frame (v5)

- `designs/bystrow-space-base-v5/manifest.json` `bases.base-1.cellFrame` = `{ id: 'base-1-cell-frame', file:
  'assets/base/base-1-cell-frame.png', width 640, height 374, offset [-16,-16], innerRect [16,16,608,342] }`; v5 cells
  equal the v1/v3 cells (same four rects). QA `passed: true` (`designs/bystrow-space-base-v5/qa-report.json`).
- PNG: 640×374 RGBA; alpha extrema inside `[16,16,624,358]` = (0,0), border row 0..16 = (0,255) (Pillow, observed).
- Drawing: `HouseView.render` (`src/ui/widgets/HouseView.ts`) for the `current` cell draws
  `image(current.x - inset, current.y - inset, geometry.cellFrame)` with display size `(w + 2·inset, h + 2·inset)` when
  `opts.shellReady && exists(geometry.cellFrame)`, else a stroked rounded rect from `HOUSE_LAYOUT.standIn`. Offset and
  size match v5's spec exactly with `frameInset: 16` unchanged.
- Loading: `HouseScene.art` filters `HOUSE_ART` by `houseArtKeys(this.geometry())` (`src/core/houseCells.ts`:
  `[shell, cellClosed, cellFrame]`, deduplicated). So the base loads `base-1-shell`, `base-1-cell-closed`,
  `base-1-cell-frame` and no longer the house frame; house 1's keys are unchanged.
- Data touches: `HOUSE_ART` (`src/data/houseArt.ts`) row `entry('base-1-cell-frame', 640, 374)`;
  `HOUSE_GEOMETRY['base-1'].cellFrame: 'house/base-1-cell-frame'` and drop its "DESIGN-GAP: … house cell-frame is
  shared" comment (`src/data/houses.ts`). Comment-only touch: `HouseScene.art` doc "the base: its own two plus the shared
  frame".
- Art script: `BASE_FILES` loop converts `join(SPACE_BASE, file.from)` (v1 only); the frame needs a per-row `pack`
  (e.g. `{ pack: SPACE_BASE_V5, from: 'assets/base/base-1-cell-frame.png', to: 'base-1-cell-frame.webp' }` with
  `file.pack ?? SPACE_BASE`), and `SPACE_BASE_V5` added to the existence loop's directory list (today it lists KIT,
  SALON_V2, FOX, HOUSE and the ROOM_PACKS packs only — `SPACE_BASE` itself is covered through the `bridge` row).
- Size: cwebp of the frame = **3 498 B** (house frame webp 8 600 B). Base weight in `houseArtKeys` terms becomes
  81 970 + 12 308 + 3 498 = **97 776 B** (was 102 878 with the shared frame), under `CAPS['base-1']` 110 000 in
  `tests/houseArt.test.ts` (update its "about 102 900 B" comment).
- E2E oracle (if the plan wants a rendered-frame check): frame-local (8,187) is base mint (85,204,181) vs house butter
  (248,210,106). For the Laboratorium in `upper-left` (252,236) that is scene **(244, 407)**; for the Hangar in
  `ground-right` (1060,636) scene **(1052, 807)**. Frame depth is above the shell (`HOUSE_LAYOUT` depth `frame`).

### 3. Boot budget

- `tests/bootBudget.test.ts` `bootPayloadBytes(room)` = TASK_ART + `bootRoomArt(room)` + UI_ART + font + boot sounds;
  `it.each(Object.keys(ROOMS))`; limit `(balance.loader.totalMs − 2000)/1000` = 48 s.
- `balance.loader` comment (`src/data/balance.ts`) records hangar at 29.9 s. Measured lab WebP total 656 332 B
  (22 files converted into the scratchpad with `-q 85 -alpha_q 100 -m 6`, the flags of `convert` in the art script;
  21 lab + the frame) vs `public/assets/rooms/hangar/*.webp` 606 452 B → lab ≈ 30.9 s. Largest lab file
  `lab-before` 182 374 B. Salon stays the worst case (41.4 s). The texture-atlas follow-up trigger (headroom < 2 s or a
  room heavier than the salon) does not fire.
- House art is not boot-loaded (`tests/houseArt.test.ts` "is not loaded by BootScene"), so the frame does not count.

### 4. Deploy smoke

- `roomArtCheck` (`scripts/deploy-check/parse.ts`) is exported but `scripts/check-deploy.ts` calls
  `precacheCovers('room pictures', precache, ROOM_ART.map(...))` and `precacheCovers('house pictures', …, HOUSE_ART)`
  (SHA-only block). Number of smoke checks: unchanged (one line each). Detail counts: room pictures 146 → **167**
  (37+23+23+21+21+21 = 146 today per `tests/roomArt.test.ts` counts, +21), house pictures 5 → 6. Hangar follow-up 3
  (`roomArtCheck` unused) does not fire (no change to `check-deploy.ts`).
- Precache grows by 22 webp files (glob `webp` in `vite/config.shared.mjs`) — the bathroom-10 / house-1-polish-9
  SW-install-warning follow-up fires as "re-record".

### 5. Pins of "Hangar is last" / base room count

Unit tests (grep `hangar|base-1` over `tests/`, then read):

| file · symbol | today | change needed and why |
|---|---|---|
| `tests/roomsData.test.ts` "every room placed once" (`placed.filter(...)toHaveLength(1)` over `Object.keys(ROOMS)`) | passes | goes red until the `HOUSES['base-1']` lab row exists (red-first guard) |
| `tests/roomsData.test.ts` base list (`houseRoomList(base-1)` → `[{bridge},{hangar, unlockAfter: bridge}]`) | 2 entries | + `{ room: 'lab', unlockAfter: 'hangar' }` |
| `tests/roomsData.test.ts` describe "hangar flow (FR-047)" "keeps the child in the Hangar … Dalej stays" | `currentRoom 'hangar'`, `movedFrom null` | becomes "moves a finished Hangar into the Laboratorium" (`movedFrom 'hangar'`, empty lab state) + new "keeps the child in the Laboratorium after its last task" |
| `tests/roomsData.test.ts` new describe "lab data" | — | manifest literals (§1) + costs (change.md D1) |
| `tests/houseCells.test.ts` "names its own pictures, shares the frame" | expects `'house/cell-frame'` for base-1 | `'house/base-1-cell-frame'`; title "has its own frame". The two base `houseCells` cases stay green: their `doneOf` returns `null` for `lab` and the lab cell is `closed` either way |
| `tests/houseArt.test.ts` "has a file of the stated pixel size" (`expected` map) and orphan check | 5 keys | + `'house/base-1-cell-frame': [640, 374]`; CAPS stays |
| `tests/roomArt.test.ts` snapshots + "has 37 salon … 21 hangar entries" | 6 rooms | + `tests/fixtures/room-art-lab.json`, `ROOM_ART` concat order follows `ROOMS` order, + `roomArt(ROOMS.lab)` length 21 |
| `tests/fixtureLoadPath.test.ts` "save-v6-bridge-done meets the Hangar" | merged rooms `['bridge','hangar']` | `['bridge','hangar','lab']` (current room stays `hangar`) — the same widening S-31 did to the kitchen-done case |
| `tests/fixtureLoadPath.test.ts` `FIXTURES` | 17 names | + `save-v7-hangar-done` and a landing case (repair → mergeHouse → nextRoom) |
| `tests/rooms.test.ts` "salon, Mostek and Hangar keep the old before/after ternary" | 3 rooms | optional: add `lab` |
| `tests/roomHit.test.ts` unreachableSlots | Hangar row | optional new lab row (observed `[]`) |
| `tests/layout.test.ts` card tiles (`Math.max(...houseRoomList(h).length) ≤ 5`) | house 1 = 4 | base = 3, passes unchanged |

E2E (`tests/e2e/`, grep `hangar|base-1|bridge`):

- `hangar-module.spec.ts` #16 "the Hangar is bought to the end … no teaser; Dalej stays in the Hangar": card items
  `[['room','bridge',true],['room','hangar',true]]`, then `roomId 'hangar'`, `done true`, `modeButton` present. **Must
  change**: card gains `['room','lab',false]`; "Dalej" moves to `lab`. The stars seed `MOSTEK_TOTAL + HANGAR_TOTAL`
  still ends at 0.
- `hangar-module.spec.ts` #2: cell states `['done','current','closed','closed']` — stays (lab not reached, closed).
- `base-cross-section.spec.ts` #12: states `['current','closed','closed','closed']` and a tap on `upper-left` does
  nothing — stays (lab closed while Mostek is current). #16 #2 (Mostek → Hangar) stays.
- `first-building-choice.spec.ts`, `kids-room.spec.ts`: only `bridge` / a comment; unaffected.
- A new `lab-module.spec.ts` (Hangar finished → Laboratorium; base card three tiles; Laboratorium last: three done
  tiles, "Dalej" stays, "Baza"; frame pixel) follows the hangar-module spec; per scope.md the phase runs only its spec.
- `grep cell-frame|cellFrame tests/e2e` → no hits: no e2e spec pins the frame key today.

### 6. Save: no migration; how a real v7 save is made

- `SAVE_VERSION` 7, `MIGRATIONS[6]` = `LIFT_V6_KITCHEN_STAGES` (`src/core/save.ts`) touches the kitchen only.
- Load path for a base save: `repairCurrentRoom` → `mergeHouse(saved, houseLayout(...))` → `nextRoom`
  (`src/core/house.ts`; mirrored by the bridge-done case in `tests/fixtureLoadPath.test.ts`). `mergeHouse` lists data
  rooms in data order then saved extras, so a saved two-cell base gains the `lab` cell; `roomInRenovation` returns `lab`
  for a finished Hangar → `nextRoom` gives `currentRoom 'lab'`, `movedFrom 'hangar'`. No per-room field is missing in v7
  (`RoomState` = `tasksDone`, `chosen`) → change.md D6 (no migration) holds.
- Real-writer path: `encodeSave(session)` returns `version: SAVE_VERSION, …, generation: 0, writer: '', house`;
  `guardedPut` (`src/storage/idb.ts`) stamps `generation` and `writer` in one transaction. `save-v7.json` (house-1,
  `generation 6`, `writer 'tab3:n5'`) is hand-written (S-32 plan "hand-written v7 oracle"); v6 done fixtures were
  hand-written in the shape of their predecessor (bathroom plan § "Frozen fixture"). Recommended fixture content:
  `version 7`, `house: { id: 'base-1', rooms: [bridge (0,0), hangar (0,1)] }`, `currentRoom 'hangar'`, `rooms.bridge`
  and `rooms.hangar` at `tasksDone 7` with each slot chosen (so `roomStateProblems` = []), stars, learner,
  variants, generation/writer like `save-v7.json`. The FIXTURES round-trip ("loads … writes v7 and keeps the old
  copy") proves the code reads and rewrites it.
- Rollback below this build: the old build's `repairCurrentRoom` meets `currentRoom 'lab'` (unknown) and sends it to the
  house's first known room; `mergeHouse` keeps the saved extra `lab` cell (same as the Hangar precedent). Not re-tested
  here (inherits S-30 evidence).

## Code References

- `src/data/rooms.ts` — `HANGAR`, `hangarSlots`, `ROOMS`, `FIRST_ROOM`
- `src/data/houses.ts` — `HOUSES` (`base-1` rows), `HOUSE_GEOMETRY['base-1'].cellFrame`, `frameInset`
- `src/data/houseArt.ts` — `HOUSE_ART`, `entry`
- `src/data/roomArt.ts` — `ROOM_SCENE_FILES`, `roomArt`, `ROOM_ART`, `bootRoomArt`
- `src/data/pl.ts` — `pl.room.names`, `slots`, `variants`, `tasks`
- `src/ui/widgets/HouseView.ts` — `render` (frame branch)
- `src/scenes/HouseScene.ts` — `art`, `shellReady`, `loadArt`
- `src/core/houseCells.ts` — `houseCells`, `houseArtKeys`
- `src/core/house.ts` — `houseRoomList`, `roomInRenovation`, `nextRoom`, `mergeHouse`
- `src/core/save.ts` — `SAVE_VERSION`, `MIGRATIONS`, `encodeSave`; `src/storage/idb.ts` — `guardedPut`
- `scripts/make-task-art.mjs` — `ROOM_PACKS`, `ROOM_JOBS`, `BASE_FILES`, `convert`, pack constants
- `scripts/check-deploy.ts` — `precacheCovers` calls; `scripts/deploy-check/parse.ts` — `roomArtCheck`
- `tests/bootBudget.test.ts` — `bootPayloadBytes`; `src/data/balance.ts` — `balance.loader`

## Architecture Insights

- A module is data: `RoomDef` + `ROOMS` entry, `ROOM_SCENE_FILES` row, `HOUSES` cell row, `pl.room.*` copy, a
  `ROOM_PACKS` row. The frame is per-geometry data read by an unchanged `HouseView`. Non-data touches in this slice:
  the art script (`SPACE_BASE_V3`, `SPACE_BASE_V5`, per-row `pack` in `BASE_FILES`), tests, one comment in
  `HouseScene.art`, docs (`docs/design-gaps.md`, CLAUDE.md).
- No "Wkrótce" teaser returns: `houseRoomList` emits a teaser only on a house cell whose room the data does not know;
  `base-1` lists three known rooms (change.md D3 confirmed by `houseRoomList` source).

## Historical Context (from prior changes)

- `context/archive/2026-11-01-hangar-module/follow-ups/review-fixes.md` item 1 — "Trigger: a third base module, or a
  designer answer for the last-module celebration": **fires** (supported).
- `context/archive/2026-11-01-bathroom-room/plan.md` § Frozen fixture — done-room fixtures are hand-written in the shape
  of the previous one and frozen (supported; pattern reused).
- `context/archive/2026-11-01-house-1-polish/plan.md` — `save-v7.json` is a hand-written oracle (supported).
- change.md claim "3 tiles fit the 1144 card" — not re-measured here; `tests/layout.test.ts` already covers 2–5 tiles.
- change.md claim "~0.65 MB WebP" — **supported** (656 332 B measured).

## Related Research

- `context/archive/2026-11-01-hangar-module/research.md`, `context/archive/2026-11-01-base-cross-section/research.md`
  — prior base module and frame research.

## Open Questions

- None blocking. Choices left to the plan: whether to add the optional `rooms.test.ts` / `roomHit.test.ts` lab rows,
  and whether the new e2e spec checks the rendered frame pixel (oracle given in §2).
- PRD: FR-045 names closed modules "śluza z „Wkrótce”" and is silent on the frame of the module in renovation; the frame
  comes from the roadmap S-33 outcome and the v5 pack. No contradiction.
