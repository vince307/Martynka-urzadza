# Rooms and the house as game data, save format v5 carrying the house — Implementation Plan

## Overview

Roadmap foundation F-04 `rooms-as-data` (milestone M-03 `ulica-i-domy`), first slice of autonomous run
`2026-10-30-rooms-kitchen`. Outcome: a room can be added with data and art only. The save becomes **v5**: v4 plus a
`house` with its list of rooms and each room's cell in a floor × place grid (FR-038); the child's salon moves into the
first house without loss, proven by a new frozen `tests/fixtures/save-v4-salon.json`; the raw v4 save is copied to
`profile:default:backup-v4` under the existing write-once policy. Everything still written for the salon alone becomes
room data: the art table and the art script per room (with a per-room board-recolour flag), the room order (derived
from the house), the room name and thumbnail per room, and `RoomDoneCard.show`, which today draws every tile from the
current room. A pure "room in renovation" rule is tested on synthetic rooms and applied at load.

**F-04 is a foundation.** No kitchen data or art, no celebration intensity (both S-22). The salon must look and play
exactly as today: same pictures, same tasks, same done card (salon tile + one "Wkrótce" tile), same parent lines. **A phase
that finds it must change a balance value, a salon slot, cost or picture byte in `public/`, curriculum or child-facing
copy stops with `STATUS: BLOCKED`.**

The pre-agreed decisions are `context/runs/2026-10-30-rooms-kitchen/scope.md` (fixed); `research.md` answered the v5
shape, the migration, street/district (no) and the salon-only code list. This plan implements them.

## Current State Analysis

Grounded in `research.md` (its Code References are the source) and spot-checked on this branch at `bc19919`:

- **Save.** `src/core/save.ts`: `SAVE_VERSION = 4`; `MIGRATIONS` 1→2 (variants), 2→3 (`LIFT_V2_SALON`, frozen tables in
  `src/core/migrations/legacySalon.ts`), 3→4 (`generation: 0, writer: ''`); `saveProblem` checks keys in a fixed order
  (`version` … `writer`), its name feeds `Kod: corrupt/<field>`; `encodeSave`/`toSession` copy field by field
  (`copyRooms`, `copyVariants`, `savedLearner`); `freshSession(firstRoom, stars)`; `SessionSave` has `stars`, `rooms`,
  `currentRoom`, `settings`, `learner`, `variants`. `src/core/types.ts` `SaveV4`, `SaveState = SaveV4`. The v4 save is
  already multi-room (`rooms: Record<string, RoomState>`, `currentRoom` must be a key of `rooms`).
- **Fixtures.** `tests/fixtures/save-v1*.json`, `save-v2*.json`, `save-v3.json`, `save-v4.json` (8 files; `save-v4.json`
  holds the unknown room `living`, no salon). `tests/fixtureLoadPath.test.ts` `FIXTURES` runs each through the real
  IndexedDB load path and asserts the write-once `backup-v<from>`. Tests pinned to v4: `tests/saveV4.test.ts`
  (`SAVE_VERSION` 4, "v4 fixture decodes unmigrated"), `tests/save.test.ts` (three `toBe(4)`, two `version: 4` encodes),
  `tests/fixtureLoadPath.test.ts` (title "writes v4").
- **Backup.** `src/storage/idb.ts` `backup(raw, from)` writes `${key}:backup-v${from}` via `putBackupOnce`;
  `readBackups` loops `from < SAVE_VERSION`; `src/main.ts` passes `migrated: { from: outcome.migratedFrom, raw }`. With
  `SAVE_VERSION` 5 a v4 device gets `backup-v4` with no new mechanism.
- **Session in the registry.** `src/main.ts` `createGame` → `preBoot` sets `REGISTRY_KEYS.rooms/currentRoom/...` from
  `start`; the autosaver's `snapshot` reads them back; `SAVE_KEYS` (`src/data/layout.ts`) lists the keys whose change
  marks the save dirty. Load path: `repairCurrentRoom(..., Object.keys(ROOMS), FIRST_ROOM)`, `roomStateProblems`,
  `roomGrowth` (report only), `freshSession(FIRST_ROOM, seeded ?? 0)`. Nothing writes `currentRoom` at runtime.
- **Room data.** `src/data/rooms.ts`: `SALON` (`name: 'salon'`, scene keys `salon/before|after|shadows`, 11 slots,
  12 tasks, `worn`, `contactShadows`), `ROOMS = { salon }`, `FIRST_ROOM = 'salon'`, `ROOM_ORDER = [{ room: 'salon' },
  { teaser: true, unlockAfter: 'salon' }]`. `src/core/rooms.ts` `roomsListView(order, rooms, states)`,
  `repairCurrentRoom`, `roomDone`, `emptyRoomState`.
- **Art.** `src/data/roomArt.ts`: global `SCENE_FILES` (`architecture-before`, `architecture-after`, `shadows`), `SALON_ART`
  built from `SALON` only with `assets/rooms/salon/` hard-coded, `ROOM_ART = SALON_ART` (37 entries); readers:
  `BootScene` (load + health), `UIScene` (labels), `scripts/check-deploy.ts` (`precacheCovers`), `tests/bootBudget.test.ts`,
  `tests/roomArt.test.ts`. `scripts/make-task-art.mjs`: `SALON_V2` pack, `sceneFiles`, `decor`, `furniture` lists,
  `ROOM_JOBS` to `salon/`, `BOARD_JOBS` (recolour by file id via `scripts/recolour-board.py`).
- **Done card.** `src/ui/widgets/RoomDoneCard.ts` `show(items, room, state)` → `drawRoomTile(left, room, state, item.done)`
  for EVERY room item (bug for a second room); caption `pl.room.name` ("Salon") for every room; thumbnail fallback
  `UI_ART_KEYS.salonAfter` for any room (`miniatureMode(needed, exists, thumbnailKey: string)` in `src/core/artPick.ts`).
  `RoomScene.listItems` = `roomsListView(ROOM_ORDER, ROOMS, rooms)`; `RoomScene` calls `doneCard.show(this.listItems(),
  room, state)` in two places. `UIScene` names rooms in the save dialogs with `ROOMS[id]?.name ?? id` (the only reader of
  `RoomDef.name`).
- **e2e seams.** `src/testing/e2eHook.ts` `E2E_SAVE_SEAMS` (`v1`, `legacy-salon`, …) and `e2eSaveStore` (in-memory store
  seeded from a frozen fixture, `E2ESaveStoreLog { ops, writtenVersion }`); markers in `vite/e2eHookGuard.mjs`
  `E2E_HOOK_MARKERS` (includes `legacy-salon`). Model spec: `tests/e2e/save-migration.spec.ts` (#10, #2).
- `context/foundation/lessons.md` does not exist (nothing to apply).
- **CI evidence** for the `(CI at ship)` row: `check` job of workflow `CI`, run 41118206318, job 124277837113:
  `Tests  3959 passed | 3 skipped (3962)`, `e2e hook: absent (2 chunks checked)`.
- **Baseline** (contract): being measured by the orchestrator; every phase measures its own branch baseline before its first
  edit and writes `baseline + delta`.

## Desired End State

- A fresh start, a reset and every loaded save carry `house: { id: 'house-1', rooms: [{ room: 'salon', floor: 0, place: 0 },
  { room: 'kitchen', floor: 0, place: 1 }] }` (data `FIRST_HOUSE`); `SAVE_VERSION` is 5; the v4 salon fixture decodes with
  `migratedFrom: 4`, every room, variant, `tasksDone`, star, learner and variant field identical; the first write leaves
  `profile:default:backup-v4` equal to the raw v4 bytes; every older fixture still loads.
- `houseRoomList(FIRST_HOUSE, ROOMS)` equals today's `ROOM_ORDER` literal (salon + kitchen teaser unlocking after the
  salon); `roomInRenovation` picks the first not-done known room of the house order, proven on synthetic rooms; at load the
  current room follows it (with one real room: always the salon, as today).
- `ROOM_ART` is built from every room in `ROOMS` with a per-room scene-file map and deep-equals today's 37 entries;
  `scripts/make-task-art.mjs` drives rooms from a table with a `recolourBoard` flag, and `npm run art` leaves
  `git status --porcelain public/` empty.
- The done card draws each room tile from its own room and state, captions it with `pl.room.names[id]`, and falls back to
  the room's own optional `thumbnail`; the salon card looks as today.
- Adding the kitchen in S-22 needs: a `RoomDef` in `src/data/rooms.ts`, `pl.room.names/slots/variants/tasks` keys, a
  scene-file row in `src/data/roomArt.ts`, a row in the art script's room table, assets — and the scene work S-22 owns
  ("Dalej" move, celebration).

### Key Discoveries:

- v5 ADDS `house` beside the unchanged top-level `rooms`/`currentRoom` (research R2): every room consumer
  (`RoomScene.resolve`, `TaskScene.nextRoomTaskCost`, `SalonBackdrop.render`, `saveSummary`, `roomStateProblems`) keeps
  working untouched.
- A migration never reads live data (`src/core/save.ts` header rule; `legacySalon.ts` pattern; core must not import
  `src/data/`): the v5 house table is frozen in `src/core/migrations/house.ts`.
- `saveProblem` returns the FIRST broken key: `house` goes last, so every existing `Kod: corrupt/<field>` keeps its meaning.
- The frozen table object must be COPIED into each lifted save (a shared reference would let one session mutate the table).
- `miniatureMode` takes one thumbnail key for any room: a room without a thumbnail must fall back to `drawn`, never to the
  salon's picture.
- The board recolour refuses an implausible mask (5–30 %, change audit-art-renderer): a cream room (the kitchen) cannot go
  through it, so the flag must be per room.

## What We're NOT Doing

- No kitchen `RoomDef`, kitchen art, kitchen copy or kitchen row in the art script (S-22). The data house lists `kitchen` as
  a cell only (shown as today's "Wkrótce" tile, because `ROOMS` has no kitchen).
- No celebration intensity / rebuild of "Pokój gotowy!" into FR-040 (S-22); the card only reads per-room data.
- No wiring of the renovation rule into the card's "Dalej" (S-22 owns the visible move; decision P-3).
- No street, district, plot, closed grid cells or kids' room in the save or the data (research R1, decision P-2).
- No edit of `src/core/migrations/legacySalon.ts`, any older fixture byte, `MIGRATIONS[1..3]`, `writeVerdict`,
  `putBackupOnce`/`attempt` (save-truth follow-up §23 stays unfired), `balance.ts`, curriculum, salon slots/costs, `public/`.
- No change to `RoomView.render`, `RoomScene` wake/sleep, `stepPanel`, `celebrate`, `fadeStage` (keeps L-R8, L-R11,
  VO2/F5/F7, wake/sleep and `ghostTweens` follow-ups unfired); `RoomScene` edits are limited to `listItems` and the two
  `doneCard.show` calls.
- No room-neutral rewording of `pl.settings.roomMismatch` / `pl.saveTransfer.roomMismatch` ("Stan salonu …"): still true
  with one room; S-22 changes the copy in `src/data/pl.ts` when the kitchen makes it untrue (follow-up).
- No two-real-builds e2e (save-truth §15; follow-up + `[human]` row), no GRD-09/S13-06/SV2-13 learner or `variants`
  changes (scope: v5 = house only).
- No rename of `SalonBackdrop`, `UI_ART.salonAfter`, `MINIGAME_WORDS`, icon/sound scripts (not room content).

## Implementation Approach

Pure rules first, while the build is still v4 (phase 1: house rules on synthetic rooms + the v4 salon fixture accepted by
the v4 code — this is what makes the fixture a genuine v4 sample); then the save format v5 end to end in core, data and
the registry (phase 2); then the load path and the room list from the house, with the e2e seam (phase 3); then the
per-room name/thumbnail and the done-card fix (phase 4); then the art table and script per room (phase 5); then docs, the
seam sweep and the visual pass (phase 6, last impl); then the browser proof that a v4 salon survives into the v5 build
(phase 7, e2e). Each phase is independently green and touches at most one widget.

## Critical Implementation Details

- **Fixture authenticity.** `save-v4-salon.json` is committed in phase 1 while `SAVE_VERSION` is still 4 and is proven there
  by `decodeSave` (ok, `migratedFrom: null`) and `saveProblem` (null). From then on it is frozen: no later phase edits it
  (each later phase checks `git diff <phase-1 sha> -- tests/fixtures/save-v4-salon.json` is empty).
- **Order at load.** `repairCurrentRoom` (unknown id → first room) → house merge → `nextRoom`; the renovation rule must see
  a repaired `currentRoom`, and `nextRoom` adds `emptyRoomState()` for a room it moves to so `saveProblem('currentRoom')`
  still holds.
- **Byte identity of the art.** The art-script refactor must not change job order, `cwebp` arguments or the recolour call;
  proof is `npm run art` + an empty `git status --porcelain public/` (needs local `designs/`, `cwebp`, the pinned Pillow and
  numpy — all present on this machine).

## Phase 1: House rules and the frozen v4 salon fixture

Driver: tdd
Driver why: the house types and rules are absent pure logic with literal synthetic oracles, and the fixture's v4 acceptance is a failing test until the file exists.

### Overview

`HouseState` types, the pure house module, and the frozen v4 salon save accepted by today's v4 code.

### Changes Required:

#### 1. Types

**File**: `src/core/types.ts`

**Intent**: name the house shape once for the save and the data.

**Contract**: `HouseRoomPlace { room: string; floor: number; place: number }` (floor 0 = ground floor, place 0 = left);
`HouseState { id: string; rooms: HouseRoomPlace[] }` (list order = opening order). No save type change in this phase.

#### 2. House rules

**File**: `src/core/house.ts` (new; no Phaser, no data import)

**Intent**: the rules F-04 and S-22 need, pure and testable on synthetic rooms.

**Contract**:
- `houseRoomList(house: HouseState, known: Readonly<Record<string, RoomDef>>): RoomListEntry[]` — rooms in house order
  while they are known (`{ room }`, the second and later with `unlockAfter` = the previous room); the first unknown room
  becomes `{ teaser: true, unlockAfter: <previous room> }` and ends the list; a house whose first room is unknown yields `[]`.
- `roomInRenovation(house, known, states): string | null` — the first room of `house.rooms` present in `known` and not
  `roomDone(known[id], states[id] ?? emptyRoomState())`; null when every known room is done.
- `nextRoom(session: Pick<SessionSave,'rooms'|'currentRoom'>, house, known): { rooms; currentRoom; movedFrom: string | null }`
  — `roomInRenovation(...) ?? session.currentRoom`; when it differs from the current room, the returned `rooms` gains
  `emptyRoomState()` for it if absent; never mutates its input.
- `mergeHouse(saved: HouseState, data: HouseState): { house: HouseState; extraRooms: string[] }` — same id required by the
  caller: data rooms in data order, then saved rooms whose `room` is not in data (kept, appended, listed in `extraRooms`).
- `houseLayout(saved: HouseState, houses: readonly HouseState[], first: HouseState): HouseState` — the data house with the
  saved id, else `first`.
- `houseEqual(a: HouseState, b: HouseState): boolean` — structural: same `id`, same cells in the same order (`room`,
  `floor`, `place`). The load path uses it to decide "the merged house differs" (plan review F2: every helper returns a
  fresh copy, so a reference compare would mark the save dirty, and write it, on every start).
- Every returned house/array is a fresh copy.

#### 3. Frozen v4 salon fixture

**File**: `tests/fixtures/save-v4-salon.json` (new, frozen from this phase on)

**Intent**: the scope's frozen v4 sample with a real salon in it (`save-v4.json` has none).

**Contract**: a v4 save as a device stores it: `version: 4`, `profileId: 'default'`, `stars: 23`, `rooms.salon = {
tasksDone: 6, chosen: { sofa: 2, rug: 1, 'coffee-table': 0, cabinet: 1, armchair: 2 } }` (stage + 5 slots, non-zero
variants), `currentRoom: 'salon'`, `settings.autoRead: true`, a populated learner (stage E2, mastery, streak, history with
one `example`, `pendingUnlock: null`), `variants` with `roundsSince: 2`, `lastMinigame: 'dice'`, a `puzzleDay`, one
`puzzlesDone` id, stamped guard fields `generation: 12`, `writer: 'tab1:n1'`.

#### 4. Tests

**Files**: `tests/house.test.ts` (new), `tests/saveV4.test.ts`, `tests/fixtureLoadPath.test.ts`

**Contract**: `house.test.ts` builds two synthetic `RoomDef`s (`a`, `b`, one stage task each, like `tests/rooms.test.ts`):
list = `[{room:'a'},{room:'b',unlockAfter:'a'}]`; unknown `c` after `a` → teaser after `a`, list ends; `roomInRenovation`
→ `a` while `a` not done, `b` after `a` done, `null` when both done, skips an unknown room; `nextRoom` keeps the current
room when nothing is left, moves to `b` and adds its empty state, does not mutate (deep-frozen input); `mergeHouse` keeps
a saved extra room at the end and reports it; `houseLayout` falls back to `first` for an unknown id; `houseEqual` is true
for two separately built equal houses and false for a different id, a swapped cell order or a changed `place`. `saveV4.test.ts`: the
v4 salon fixture decodes `ok` with `migratedFrom: null` and `saveProblem` null (this test is reworded to v5 in phase 2).
`fixtureLoadPath.test.ts` `FIXTURES` gains `save-v4-salon`.

### Success Criteria:

#### Automated Verification:

- `tests/house.test.ts` red before `src/core/house.ts` exists, green after; the fixture cases red before the file exists; unit `<branch baseline> + N`
- Deliberate break: make `roomInRenovation` ignore `roomDone` → the "b after a done" case red; drop the teaser stop in `houseRoomList` → the unknown-room case red; each restored; meta-check: oracles are literal synthetic rooms and literal lists, not values computed by the code under test
- `git diff --stat bc19919 -- src/core/save.ts src/data tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4.json public` empty (v4 code unchanged while the fixture is proven)
- Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 2: Save format v5 carries the house

Driver: tdd
Driver why: `MIGRATIONS[4]`, the `house` check and the copy are absent; the frozen v4 salon fixture and literal v5 shapes lead them red-first.

### Overview

`SAVE_VERSION` 5, the frozen migration step, the strict check, the session field, the house data, and every caller that
builds a session; `backup-v4` proven.

### Changes Required:

#### 1. Migration table

**File**: `src/core/migrations/house.ts` (new)

**Intent**: lift v4 to v5 without reading live data.

**Contract**: `HOUSE_V5: Readonly<HouseState> = { id: 'house-1', rooms: [{ room: 'salon', floor: 0, place: 0 }] }` (FROZEN,
comment: never edited, a later house change adds a version); `LIFT_V4_HOUSE = (raw) => ({ ...raw, version: 5, house:
<fresh copy of HOUSE_V5> })`; `rooms`, `currentRoom`, `stars`, `learner`, `variants`, `generation`, `writer` pass
through unchanged (a v4 save whose room is `living` keeps it).

#### 2. Save core

**Files**: `src/core/types.ts`, `src/core/save.ts`

**Contract**: `SaveV5 extends Omit<SaveV4,'version'> { version: 5; house: HouseState }`, `SaveState = SaveV5`;
`SAVE_VERSION = 5`; `MIGRATIONS[4] = LIFT_V4_HOUSE`; `saveProblem` checks `house` LAST (record, string `id`, array of
`{ room: string, floor: count, place: count }`; duplicates and unknown ids are NOT rejected) and its doc says v5;
`SessionSave.house: HouseState`; `copyHouse` used by `encodeSave` and `toSession`; `freshSession(house: HouseState, stars = 0)`
— first room = `house.rooms[0].room`, `house` copied. Header comment and `validateSave` doc name v5.

#### 3. House data

**File**: `src/data/houses.ts` (new); `src/data/rooms.ts`

**Contract**: `HOUSES: readonly HouseState[]` with house `house-1`: `salon` (0,0), `kitchen` (0,1) (layout of
`docs/designer-brief-m03.md` "Układ domów"; the kids' room and the closed cell come with S-25/S-23); `FIRST_HOUSE =
HOUSES[0]`; `FIRST_ROOM` in `rooms.ts` becomes `FIRST_HOUSE.rooms[0].room` (value still `'salon'`). Data may import data.

#### 4. Callers and the registry

**Files**: `src/main.ts`, `src/scenes/UIScene.ts` (reset `fresh`), `src/testing/e2eHook.ts` (`slow` seam),
`src/data/layout.ts`

**Contract**: `REGISTRY_KEYS.house` (`HouseState`, saved) added and listed in `SAVE_KEYS`; `preBoot` sets it from
`start.house`; the autosaver's `snapshot` reads it; every `freshSession(FIRST_ROOM, …)` becomes
`freshSession(FIRST_HOUSE, …)`. No load-time merge yet (phase 3): a loaded session keeps the saved house.

#### 5. Tests

**Files**: `tests/saveV5.test.ts` (new), `tests/fixtures/save-v5.json` (new, frozen), `tests/saveV4.test.ts`,
`tests/save.test.ts`, `tests/fixtureLoadPath.test.ts`, `tests/autosave.test.ts`, `tests/idbStore.test.ts`, every test
calling `freshSession(` (today `tests/saveFile.test.ts`, `tests/ageBack.test.ts`, `tests/legacySalonMigration.test.ts`,
`tests/save.test.ts`; pass a one-room house, e.g. a local `houseOf('living')` helper), every literal `SessionSave` in tests
(`tests/save.test.ts` `session`/`withExample`/`fresh`, `tests/rooms.test.ts`; gains `house`), and the v4 encode pin in
`tests/legacySalonMigration.test.ts` (`toMatchObject({ version: 4, … })` → 5)

**Contract**: `saveV5.test.ts`: `SAVE_VERSION` 5; `MIGRATIONS[4](v4 salon fixture)` deep-equals `{ ...fixture, version: 5,
house: { id: 'house-1', rooms: [{ room: 'salon', floor: 0, place: 0 }] } }` (literal), does not mutate its input, and two
lifts do not share the house object; `decodeSave(v4 salon)` → `migratedFrom: 4`, `session.rooms`, `stars`,
`settings`, `variants` and `learner` field-equal to the fixture; `save-v4.json` (room `living`) lifts with `living` kept;
`saveProblem` names `house` for a missing house, a non-array `rooms`, a negative `floor`, a non-string `room`, and accepts
duplicates; `save-v5.json` decodes unmigrated and `encodeSave` returns it with guard placeholders; `importProblem` of the v4
salon fixture is null; a v6 save is `future`. `saveV4.test.ts`: the `SAVE_VERSION` 4 pin becomes a `MIGRATIONS[3]`-only
assertion (the v3→v4 meaning kept), the "v4 decodes unmigrated" cases become `migratedFrom: 4`. `save.test.ts`: the
`toBe(4)` pins and `version: 4` encodes move to 5 + `house`. `fixtureLoadPath`: title "writes v5", and for both v4
fixtures `profile:default:backup-v4` equals the raw bytes. `autosave.test.ts`: `migrated: { from: 4 }` copies with
`from` 4. `idbStore.test.ts`: `readBackups` returns a stored `backup-v4`.

### Success Criteria:

#### Automated Verification:

- `tests/saveV5.test.ts` red against v4 (no `MIGRATIONS[4]`, no `house` check), green after; unit `<phase-1 count> + N`
- Deliberate break: make `LIFT_V4_HOUSE` reuse the `HOUSE_V5` object without copying → the "two lifts do not share" case red; drop `house` from `toSession` → the fixture round-trip case red; move the `house` check before `stars` → a `corrupt/stars` case red; each restored; meta-check: the v4 oracle is the frozen fixture proven by the v4 code in phase 1, the v5 oracle a literal, so neither is computed by the migration under test
- `git diff <phase-1 sha> -- tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4.json tests/fixtures/save-v4-salon.json src/core/migrations/legacySalon.ts` empty
- `grep -rn "freshSession(FIRST_ROOM" src` empty; `grep -n "house" src/data/layout.ts` shows the registry key and its `SAVE_KEYS` entry
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (the existing `save-migration.spec.ts` asserts `writtenVersion` against `SAVE_VERSION`, so it follows to 5)

---

## Phase 3: The load path applies the house; the room list comes from the house

Driver: impl
Driver why: wiring of phase 1-2 rules into `main.ts`, `RoomScene.listItems` and the e2e seam — Phaser/registry glue proven by a data test, source guards and the phase-7 e2e.

### Overview

At load the saved house is merged with data, the current room follows the renovation rule, the done-card list is derived
from the house (`ROOM_ORDER` removed), and the e2e build can start from the frozen v4 salon save.

### Changes Required:

#### 1. Load path

**File**: `src/main.ts`

**Intent**: data is the authority for a known house; the save keeps what it does not know (report, never repair).

**Contract**: after `repairCurrentRoom`: if `HOUSES` has `session.house.id` → `session.house = mergeHouse(saved, data).house`,
`console.warn` once when `extraRooms` is non-empty; else keep the saved house and `console.warn` the unknown id. Then
`nextRoom(session, houseLayout(session.house, HOUSES, FIRST_HOUSE), ROOMS)`; `movedFrom !== null` → `console.info` and
`saver.markDirty()` (like `roomRepaired`). A merged house that differs from the saved one — `!houseEqual(merged, saved)`,
never a reference compare — also marks dirty: an unchanged v5 save must NOT be written at start (a start-time write would
bump `generation` and stale an already open tab through `writeVerdict`, a behaviour change). No other load behaviour changes.

**Why the kitchen cell is invisible in F-04** (plan review F1): `ROOMS` has no `kitchen`, so `houseRoomList` turns the cell
into today's teaser entry (`{ teaser: true, unlockAfter: 'salon' }`, no room id), `roomInRenovation` skips it (only rooms in
`known`), `nextRoom` therefore returns `null` → keeps `salon` for a finished salon, and `repairCurrentRoom` still repairs
against `Object.keys(ROOMS)`. A child with a done salon stays in the salon with today's card; no stand-in kitchen is drawn.

#### 2. Room list

**Files**: `src/scenes/RoomScene.ts` (`listItems` only), `src/data/rooms.ts`

**Contract**: `listItems` = `roomsListView(houseRoomList(houseLayout(<registry house>, HOUSES, FIRST_HOUSE), ROOMS), ROOMS,
rooms)`; `ROOM_ORDER` deleted from `src/data/rooms.ts`; `RoomListEntry` stays.

#### 3. e2e seam

**Files**: `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`

**Contract**: seam `v4-salon` (`E2ESaveSeam`, `E2E_SAVE_SEAMS`, doc line) seeding the store with
`structuredClone(save-v4-salon.json)`; `E2ESaveStoreLog.writtenHouse: HouseState | null` set on each write; the hook
snapshot gains `house` (registry value, frozen copy) and `currentRoom` (the raw registry value: `room.roomId` reports
`room.id` after the `ROOMS[id] ?? ROOMS[FIRST_ROOM]` fallback, so it cannot see a move to an unknown room). Marker `v4-salon` added to `E2E_HOOK_MARKERS` (absent from `dist/`).

#### 4. Tests

**Files**: `tests/roomsData.test.ts`, `tests/houseWiring.test.ts` (new source guards)

**Contract**: `houseRoomList(FIRST_HOUSE, ROOMS)` deep-equals the old literal `[{ room: 'salon' }, { teaser: true,
unlockAfter: 'salon' }]`; every room of `ROOMS` is placed in `FIRST_HOUSE`; `HOUSE_V5.id === FIRST_HOUSE.id` and its salon
cell equals the data's; the ROOM_ORDER test is rewritten on the house; with the real data and a finished salon state
(every `SALON` task done) `roomInRenovation(FIRST_HOUSE, ROOMS, states)` is `null` and `nextRoom` returns `currentRoom:
'salon'`, `movedFrom: null` and `rooms` without a `kitchen` key (plan review F1). Source guards: `main.ts` calls
`repairCurrentRoom(` before `nextRoom(` and compares houses with `houseEqual(`; `ROOM_ORDER` appears nowhere in `src/`;
`RoomScene.ts` calls `houseRoomList(`.

### Success Criteria:

#### Automated Verification:

- New data and guard tests green; unit `<phase-2 count> + N`
- Deliberate break: swap the salon/kitchen order in `HOUSES` → the "equals the old literal" case red; call `nextRoom` before `repairCurrentRoom` → the order guard red; each restored; meta-check: the order guard proves wiring only; the behaviour under a real v4 save is proven by phase 7
- `npm run build` prints `e2e hook: absent (` (the new `v4-salon` marker is not in `dist/`)
- `git diff --stat <phase-2 sha> -- src/ui/widgets src/core/save.ts tests/fixtures public` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 4: Per-room name and thumbnail; each done-card tile drawn from its own room

Driver: impl
Driver why: widget change in `RoomDoneCard` (one UI component) plus a small pure change in `artPick`, led by a unit case; the visible card is proven by the visual pass and phase-7 e2e.

### Overview

The room name and the fallback thumbnail become per-room data, and the card stops drawing every tile from the current room.

### Changes Required:

#### 1. Data

**Files**: `src/data/pl.ts`, `src/core/types.ts`, `src/data/rooms.ts`

**Contract**: `pl.room.names: { salon: 'Salon' }` replaces `pl.room.name`; `roomText.name(id)`; `RoomDef.name` removed;
`RoomDef.thumbnail?: string` (a UI art key) — the salon gets `UI_ART_KEYS.salonAfter`. No visible copy change.

#### 2. Picker

**File**: `src/core/artPick.ts`

**Contract**: `miniatureMode(needed, exists, thumbnailKey: string | undefined)`: undefined → `drawn` when a piece is missing.

#### 3. Card

**Files**: `src/ui/widgets/RoomDoneCard.ts`, `src/scenes/RoomScene.ts` (the one `doneCard.show` call, in `redraw`), `src/scenes/UIScene.ts`
(`roomName`), `src/core/rooms.ts` (`RoomListItem.nameKey` comment)

**Contract**: `show(items, catalogue: Readonly<Record<string, RoomDef>>, states: Readonly<Record<string, RoomState>>,
current: string)`: each room tile uses `catalogue[item.id]` and `states[item.id] ?? emptyRoomState()`; a room item absent
from the catalogue is drawn as a teaser tile (never throws); caption `roomText.name(id) ?? id`; thumbnail
`room.thumbnail`; `miniature()` reports the mode of the `current` room's tile. `UIScene` `roomName: (id) =>
roomText.name(id) ?? id` (both dialog call sites). **One intended, parent-only visible change** (plan review F3): today
`RoomDef.name` is the id `'salon'`, so the export/import/reset summaries print "salon"; after this phase they print
"Salon" (`pl.room.names.salon`). Nothing a child sees changes. The DESIGN-GAP comment names per-room thumbnails (row 108 unchanged).

#### 4. Tests

**Files**: `tests/artPick.test.ts` (or the existing picker test file), `tests/roomsData.test.ts`, `tests/roomDoneCardWiring.test.ts` (new source guard)

**Contract**: `miniatureMode([...missing], exists, undefined)` → `drawn`; every room in `ROOMS` has a non-empty
`roomText.name`; a room's `thumbnail` (when set) is a `UI_ART_KEYS` value; source guard: `RoomDoneCard.ts` contains no
`UI_ART_KEYS.salonAfter` and no `pl.room.name`, and `drawRoomTile(` is called with `catalogue[`.

### Success Criteria:

#### Automated Verification:

- New cases green (the `undefined` picker case red before the signature change); unit `<phase-3 count> + N`
- Deliberate break: pass the current `room`/`state` to every tile again → the source guard red; return `'thumbnail'` for an undefined key → the picker case red; each restored; meta-check: the guard cannot see the pixels; the visual pass (6.x) and phase 7 look at the drawn card
- `git diff <phase-3 sha> -- src/data/pl.ts` shows only `name` → `names` (and `roomText.name`); `grep -rn "pl.room.name\b\|\.name ?? id" src` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (`salon-*` specs reading `doneMiniature` stay green)

---

## Phase 5: The art table and the art script per room

Driver: impl
Driver why: a data-table refactor of `roomArt.ts` and a node script whose proof is byte identity of `public/` and an equality test against a snapshot of today's table — no failing behaviour test can lead it.

### Overview

`ROOM_ART` from every room with a per-room scene-file map; the art script from a room table with `recolourBoard`.

### Changes Required:

#### 1. Snapshot first

**File**: `tests/fixtures/room-art-salon.json` (new, written from the UNCHANGED `ROOM_ART` before any edit of `roomArt.ts`)

**Contract**: the 37 entries `{ key, url, width, height, label }` in order.

#### 2. Art table

**File**: `src/data/roomArt.ts`

**Contract**: `SCENE_FILES` becomes `ROOM_SCENE_FILES: Readonly<Record<string, Record<'before'|'after'|'shadows', string>>>`
(`salon`: the three current names); `roomArt(room: RoomDef): RoomArtEntry[]` with folder `assets/rooms/<room.id>/`;
`ROOM_ART = Object.values(ROOMS).flatMap(roomArt)`; `SALON_ART` removed (or kept only if a reader needs it — grep). A
room in `ROOMS` without a scene-file row fails a data test, not at runtime.

#### 3. Art script

**File**: `scripts/make-task-art.mjs`

**Contract**: one `ROOM_PACKS` table `{ room, pack, scene: { file → output }, decor: [...], furniture: [...],
recolourBoard: boolean }` (salon: `designs/martynka-salon-v2`, the current three scene files, `recolourBoard: true`);
`ROOM_JOBS` and the recolour decision derived from it (recolour only the `before`/`after` scene files of a room with the
flag); the kit-existence check covers every pack; job order, `cwebp` arguments, the log lines and the total stay the same.
Header comment names the table as the place S-22 adds a row.

#### 4. Tests

**Files**: `tests/roomArt.test.ts`

**Contract**: `ROOM_ART` deep-equals `room-art-salon.json`; every room of `ROOMS` has a `ROOM_SCENE_FILES` row; the existing
file/header checks run over every entry (no `SALON` import left).

### Success Criteria:

#### Automated Verification:

- `tests/roomArt.test.ts` green; unit `<phase-4 count> + N`
- Deliberate break: change the salon folder in `roomArt` to `assets/rooms/salon2/` → the snapshot case red; set the salon `recolourBoard: false` and run `npm run art` → `git status --porcelain public/` lists `architecture-before.webp` and `architecture-after.webp`; each restored; meta-check: the snapshot is taken from the code before the edit, so it is an oracle of today's behaviour, not of the refactor
- `npm run art` then `git status --porcelain public/` empty; `git status --porcelain scripts/` shows only `make-task-art.mjs`
- `git diff --stat <phase-4 sha> -- src/core src/scenes src/ui public` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

---

## Phase 6: Docs, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, rollback note, follow-ups and leftovers over phases 1-5 plus the screenshot matrix — docs and glue.

### Overview

CLAUDE.md "Current state" to v5, the rollback note, follow-ups with triggers, the seam sweep, screenshots, and the rows only
a human or CI can close.

### Changes Required:

#### 1. Rule files and runbook

**Files**: `CLAUDE.md` (and `AGENTS.md` only if it repeats the facts — grep first), `deploy/README.md`

**Intent**: CLAUDE.md says save format v5 wherever it states the current format (`SAVE_VERSION` 4 → 5 in the S-11 sentence,
"save format stays v4" claims that are now history get "(v5 since rooms-as-data)" only where they state the CURRENT
version), plus one sentence group for this change: `src/core/house.ts` (`houseRoomList`, `roomInRenovation`, `nextRoom`,
`mergeHouse`, `houseLayout`), `src/data/houses.ts`, `MIGRATIONS[4]` with the frozen `HOUSE_V5`, `backup-v4`,
`save-v4-salon.json`, `ROOM_SCENE_FILES` and the art script's `ROOM_PACKS` with `recolourBoard`, per-room
`pl.room.names`/`thumbnail`, `?e2eSave=v4-salon`. `deploy/README.md`: one docs-only rollback note for v5 next to the v4
note (`pl.saveFuture`, nothing overwritten).

#### 2. Follow-ups

**File**: `context/changes/rooms-as-data/follow-ups/review-fixes.md` (new)

**Intent**: one entry per deferred or re-recorded item, each with a `Trigger:` line: "Stan salonu" mismatch lines
(Trigger: S-22); wire `nextRoom` after "Dalej" (Trigger: S-22); kitchen without a pack thumbnail → `drawn` miniature
(Trigger: S-22); `salon-before` thumbnail / curtains in the thumbnail (Trigger: S-22 kitchen tile not done); texture atlas
and boot budget (Trigger: S-22 `tests/bootBudget.test.ts`); M-6 SW install warn (Trigger: the next change to the room art
set — S-22); plan-review F3 / M-R5 panel placeholder throw (Trigger: S-22 celebration); GRD-09, S13-06, SV2-13 re-recorded
with Trigger "the next save-format change (v6)"; two-real-builds e2e re-recorded (Trigger: v6 or a cross-build report);
kids' room id and closed cells in the house (Trigger: S-25 / S-23). Closed by history, recorded as closed: P-8 first
`backup-v3`, earlier stale signal.

#### 3. Seam sweep

**Files**: anything phases 1-5 left

**Intent**: no duplicated house copy helpers (one `copyHouse`), no second frozen house table, `FIRST_ROOM` only derived,
no `ROOM_ORDER`/`SALON_ART`/`SCENE_FILES`/`pl.room.name` left, stale comments (`src/core/save.ts` header and `saveProblem`
doc "v4", `RoomListItem.nameKey`, `roomArt.ts` header "salon", `make-task-art.mjs` header, `RoomDoneCard` class doc,
`e2eHook.ts` seam doc), `tests/e2e/save-migration.spec.ts` titles that say "v4 build" when they mean the current build.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "save format v5|houseRoomList" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/rooms-as-data/follow-ups/review-fixes.md` ≥ 10
- `grep -rnE "ROOM_ORDER|SALON_ART|SCENE_FILES\b|pl\.room\.name\b|freshSession\(FIRST_ROOM" src scripts tests` empty; `grep -rn "HOUSE_V5 = \|HOUSE_V5:" src` lists one place
- `git diff --stat bc19919 -- src/data/balance.ts src/data/curriculum public tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4.json` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024: the salon before the stage, the salon after the stage with some furniture, a finished salon with the "Pokój gotowy!" card (salon tile with its check mark, the "Wkrótce" tile without its padlock), "Zmień wygląd" mode, the welcome backdrop, the task screen backdrop, settings "Zapis gry" after a v4 → v5 load (`?e2eSave=v4-salon`, the migration line and the `backup-v4` line), each compared with `main` at `bc19919` — no visible difference except the parent-only room name in the export/import/reset summaries ("salon" → "Salon", plan review F3)
- [human] Accept the rollback risk: a build older than v5 meets a v5 save as `pl.saveFuture` and never overwrites it (note in `deploy/README.md`, as at v3/v4)
- [human] Accept that the v4 → v5 update is proven by unit tests on the real IndexedDB load path (`tests/fixtureLoadPath.test.ts`) and an e2e on the in-memory seam, not by two real builds (save-truth follow-up §15, decision P-6)
- [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in the `check` log of run 41118206318, job 124277837113: `Tests  3959 passed | 3 skipped (3962)`, `e2e hook: absent (2 chunks checked)`)

---

## Phase 7: A v4 salon save survives into the v5 build — e2e (#10, #2)

Driver: e2e
Driver why: the risk is the real browser load → migration → registry → drawn room → autosave write and copy (test-plan #10, #2); built by phases 2-4, contract `E2E=on`.

### Overview

One new hook spec on the `v4-salon` seam, modelled on `tests/e2e/save-migration.spec.ts`.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/rooms-as-data.spec.ts` (new; added to `ROUND_SPEC` in `playwright.config.ts`, as every hook spec)

**Contract**: open `./?e2eSave=v4-salon&e2eMonth=10&e2eVariant=off`; oracles read from the imported fixture JSON.
- `#10 rooms-as-data a v4 salon save opens in the v5 build with the same room, variants and stars` — `save.migratedFrom === 4`,
  stars and counter text equal the fixture, `house` equals `{ id: 'house-1', rooms: [salon (0,0), kitchen (0,1)] }`;
  answer the open task, `roomSwitch`: `room.roomId === 'salon'`, `tasksDone` and `chosen` equal the fixture, `stageDone`
  true, `shown` carries the bought variants.
- `#2 rooms-as-data after a round the save is written as v5 with the house and the v4 copy right after it` — play a round,
  `store.writtenVersion === 5`, `store.writtenHouse` equals the house above, `ops.slice(0, 2) = ['write', 'backup']`, one
  backup op.
- `#10 rooms-as-data a finished salon reopens in the salon, never in the kitchen cell` — the seed is not enough to finish
  the salon, so this test uses `?e2eStars` on a fresh device to buy all 12 tasks through the touch path (as
  `room-change.spec.ts` does), checks `card.items` = salon done + unlocked teaser and `doneMiniature === 'live'`, then
  `page.reload()` (same context, the real IndexedDB keeps the save) and checks the hook's `currentRoom === 'salon'`,
  `room.tasksDone === 12`, `house` unchanged, and `rooms` without a `kitchen` key (plan review F1: the load-time `nextRoom`
  must not route a finished salon to the cell the build does not ship). `room-change.spec.ts` already pins the card items;
  the reload is the new proof.

No `sleep`/`until`/`while` loops or `tail -f` waiters (profile § 8); waits through `expect.poll`.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`: drop `house` from `toSession` → `#10` house case red; make `LIFT_V4_HOUSE` drop `chosen` → `#10` room case red; drop `migrated` from the autosaver options in `main.ts` → `#2` red on the backup op; make `roomInRenovation` return the first house cell even when unknown → the finished-salon reload case red on `currentRoom`; return the current room/state for every tile → done-card case unaffected (one room — recorded as the expected blind spot, covered by the phase-4 guard); each restored), green after
- `npx playwright test tests/e2e/rooms-as-data.spec.ts tests/e2e/save-migration.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 3`; total equals `npx playwright test --list | tail -1`
- Full local gate green

---

## Testing Strategy

### Unit Tests:

- `tests/house.test.ts`: list, renovation rule, move, merge, layout on synthetic rooms (phase 1).
- `tests/saveV5.test.ts`: frozen-table lift, no shared object, strict `house` check, v5 fixture round trip, `future` (phase 2).
- `tests/fixtureLoadPath.test.ts`: all 10 fixtures through IndexedDB, `backup-v4` write-once (phases 1-2).
- `tests/roomsData.test.ts`, `tests/houseWiring.test.ts`, `tests/roomDoneCardWiring.test.ts`, `tests/roomArt.test.ts`
  (phases 3-5).

### Integration Tests:

- `tests/e2e/rooms-as-data.spec.ts` (three tests on the `v4-salon` seam and the touch path, risks #10, #2).

### Manual Testing Steps:

1. `npm run art`: same log, `git status --porcelain public/` empty.
2. Hook build `?e2eSave=v4-salon`: the salon shows the fixture's furniture and variants; "Zapis gry" names the move from v4.
3. Finish the salon (`?e2eStars=200` fresh device): the card shows "Salon" with a check mark and the "Wkrótce" tile.

## Performance Considerations

None measurable: one small array in the save, one merge at load, `ROOM_ART` unchanged in size (no boot payload change).

## Migration Notes

v4 → v5 by `MIGRATIONS[4]` (frozen table, lossless); the raw v4 save copied once to `profile:default:backup-v4`; a pre-v5
build shows `pl.saveFuture` and never overwrites (rollback note in `deploy/README.md`, `[human]` row 6.7). Older fixtures
stay byte-identical and load through the whole chain.

## Known risks

- An e2e seam fixture imported into `src/testing/e2eHook.ts` could leak into `dist/`: the `v4-salon` marker in
  `vite/e2eHookGuard.mjs` fails the build if it does.
- `freshSession` signature change touches ~8 test files: a phase agent must update them, never add a default house in core
  (core does not import data).
- The phase-7 done-card test needs all 12 salon purchases through touch (~ the length of `salon-extra-slots` specs); if it
  runs close to its limit, raise only that test's timeout.
- (plan review F2) A start-time write would bump `generation` and refuse the next write of an already open tab
  (`writeVerdict`): the house compare at load must be `houseEqual`, and only a migrated, repaired, moved or really merged
  save is marked dirty. An existing multi-tab spec (`stale-tab.spec.ts`, `load-and-tab-guard.spec.ts`) going red in phase 3
  is this bug, not a flake.
- (plan review F5, observation) Every v5 save written by F-04 stores a `kitchen` cell the build does not ship. Harmless:
  data wins for a known house (`mergeHouse`), so S-22/S-23 may move or rename it; an unknown cell only shows as the teaser.
- (plan review F4, observation) `freshSession(house)` and `SessionSave.house` make TypeScript fail in every test literal
  listed in phase 2 § 5 — the typecheck is the checklist; never silence it with `as never`.

## Autonomous decisions

- **P-0 Scope fixed by the maintainer (scope.md).** v5 = house + floor grid, salon moved without loss, frozen v4 fixture,
  write-once `backup-v4`, no balance change, F-04 adds no art. Would change: a new maintainer instruction.
- **P-1 The frozen v5 table lists only `salon`** (`{ id: 'house-1', rooms: [salon (0,0)] }`). Rejected: freezing the whole
  brief layout (salon, `kitchen`, `kids-room`). Why: data is the authority for a known house and `mergeHouse` adds the data
  rooms at load, so the frozen table needs only what every v4 save already has; a guessed `kids-room` id frozen forever
  would stay as an extra room if S-25 picks another id. Would change: a reason to read the grid from a save before data
  (e.g. a house the build no longer ships).
- **P-2 The data house lists salon and kitchen only** (no kids' room, no closed cell). Why: the kitchen id is fixed by its
  pack (`kitchen`) and needed for today's "Wkrótce" tile; the kids' room id and closed cells belong to S-25/S-23, and an id
  written into saves now would become a kept extra later. Would change: S-25/S-23 fixing those ids.
- **P-3 The renovation rule runs at load only; "Dalej" on the done card is wired in S-22.** Rejected: wiring "Dalej" now.
  Why: with one real room the move is invisible and untestable in the browser, and the card's "Dalej" is exactly where S-22
  builds the celebration; editing `RoomScene` beyond `listItems`/`show` would fire L-R8/L-R11/wake-sleep follow-ups. Would
  change: S-22 being cancelled while a second room still ships.
- **P-4 `house` is checked last in `saveProblem`, and duplicates/unknown ids are accepted.** Why: every existing `Kod:` line
  keeps its meaning; a strict cross-check would turn a recoverable save into the error card (SV2-13 lesson). Would change: a
  real save found with a broken grid that the game cannot render.
- **P-5 Data wins for a known house id; an unknown id is kept verbatim and the first house is used for the layout.** (research
  R3; "report, never repair"). Would change: the maintainer wanting the saved layout to win over data.
- **P-6 v4 → v5 proven by the real IndexedDB load path in unit tests plus the in-memory e2e seam, not two real builds.**
  Departs from the literal test-plan phase-4 wish of a two-build e2e → `[human]` row 6.7 (the two-build e2e is out of scope for
  the run per change.md). Would change: a cross-build bug report or v6.
- **P-7 `RoomDef.name` removed; the name lives only in `pl.room.names`.** Why: one source of player text per room, scenes
  carry none (CLAUDE.md working rules). Would change: nothing known.
- **P-8 `RoomDef.thumbnail` optional; a room without one falls back to the drawn miniature, never to the salon's picture.**
  Would change: the author shipping a thumbnail per room (then it becomes required).
- **P-9 The "Stan salonu" mismatch lines are left for S-22.** Why: still true with one room; S-22 changes `src/data/pl.ts`
  (data) when the kitchen makes them untrue; no `[human]` copy row now. Would change: F-04 adding a second room after all.
- **P-10 Seven phases**, each with at most one widget touched (phase 4: `RoomDoneCard`). Rejected: one save phase with the load
  wiring. Why: phases are implemented by separate fresh agents and must be independently green. Would change: per-phase
  overhead dominating.
- **P-11 Risk ids** #10 (an update keeps stars, room and stage) and #2 (progress never lost) for the e2e phase. Would change:
  the test plan adding a room-data risk.
- **PR-1 (plan review) Keep the kitchen cell in the F-04 data house.** Checked against the code: `roomsListView` turns an
  unknown cell into today's teaser (no id), `roomInRenovation` reads only known rooms, `repairCurrentRoom` uses
  `Object.keys(ROOMS)` — so a finished salon stays the current room and the card is unchanged. Rejected: a salon-only data
  house plus a generic teaser (it would recreate `ROOM_ORDER`'s special case). Added proof: a phase-3 data test and a
  phase-7 reload test with a hook `currentRoom`. Would change: either test failing.
- **PR-2 (plan review) Structural `houseEqual` for the dirty decision**, so an unchanged save is never written at start.
  Would change: nothing known.
- **PR-3 (plan review) The parent save summaries now say "Salon" instead of the raw id "salon".** A correction, parent-only,
  recorded in the visual row 6.6; no `[human]` row (no child-facing or balance change). Would change: the maintainer
  preferring the old text.

## References

- Research: `context/changes/rooms-as-data/research.md`; identity `context/changes/rooms-as-data/change.md`
- Scope: `context/runs/2026-10-30-rooms-kitchen/scope.md`; contract `context/runs/2026-10-30-rooms-kitchen/agent-contract.md`
- Format example: `context/archive/2026-10-25-audit-art-renderer/plan.md`
- Code: `src/core/save.ts` (`SAVE_VERSION`, `MIGRATIONS`, `saveProblem`, `encodeSave`, `toSession`, `freshSession`),
  `src/core/types.ts` (`SaveV4`, `RoomDef`, `RoomListEntry`), `src/core/rooms.ts` (`roomsListView`, `repairCurrentRoom`,
  `roomDone`), `src/core/artPick.ts` (`miniatureMode`), `src/core/migrations/legacySalon.ts` (frozen-table pattern),
  `src/data/rooms.ts`, `src/data/roomArt.ts`, `src/data/pl.ts` (`room`, `roomText`), `src/data/layout.ts`
  (`REGISTRY_KEYS`, `SAVE_KEYS`), `src/main.ts` (load path, `preBoot`, autosaver `snapshot`), `src/scenes/RoomScene.ts`
  (`listItems`, `doneCard.show`), `src/scenes/UIScene.ts` (`roomName`, reset `fresh`), `src/ui/widgets/RoomDoneCard.ts`,
  `src/storage/idb.ts` (`backup`, `readBackups`), `src/testing/e2eHook.ts` (`E2E_SAVE_SEAMS`, `e2eSaveStore`),
  `vite/e2eHookGuard.mjs`, `scripts/make-task-art.mjs`, `playwright.config.ts` (`ROUND_SPEC`)
- Tests: `tests/saveV4.test.ts`, `tests/save.test.ts`, `tests/fixtureLoadPath.test.ts`, `tests/roomArt.test.ts`,
  `tests/roomsData.test.ts`, `tests/e2e/save-migration.spec.ts`
- Docs: `docs/designer-brief-m03.md` "Układ domów", `deploy/README.md` (v3/v4 rollback notes)
- Test plan: `context/foundation/test-plan.md` risks #2, #10

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: House rules and the frozen v4 salon fixture

#### Automated

- [x] 1.1 `tests/house.test.ts` red before `src/core/house.ts` exists, green after; the fixture cases red before the file exists; unit `<branch baseline> + N` — dd6db69
- [x] 1.2 Deliberate break: make `roomInRenovation` ignore `roomDone` → the "b after a done" case red; drop the teaser stop in `houseRoomList` → the unknown-room case red; each restored; meta-check: oracles are literal synthetic rooms and literal lists, not values computed by the code under test — dd6db69
- [x] 1.3 `git diff --stat bc19919 -- src/core/save.ts src/data tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4.json public` empty (v4 code unchanged while the fixture is proven) — dd6db69
- [ ] 1.4 Full local gate green (lint, typecheck, unit + deploy scripts + `sample` E1–E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

### Phase 2: Save format v5 carries the house

#### Automated

- [ ] 2.1 `tests/saveV5.test.ts` red against v4 (no `MIGRATIONS[4]`, no `house` check), green after; unit `<phase-1 count> + N`
- [ ] 2.2 Deliberate break: make `LIFT_V4_HOUSE` reuse the `HOUSE_V5` object without copying → the "two lifts do not share" case red; drop `house` from `toSession` → the fixture round-trip case red; move the `house` check before `stars` → a `corrupt/stars` case red; each restored; meta-check: the v4 oracle is the frozen fixture proven by the v4 code in phase 1, the v5 oracle a literal, so neither is computed by the migration under test
- [ ] 2.3 `git diff <phase-1 sha> -- tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4.json tests/fixtures/save-v4-salon.json src/core/migrations/legacySalon.ts` empty
- [ ] 2.4 `grep -rn "freshSession(FIRST_ROOM" src` empty; `grep -n "house" src/data/layout.ts` shows the registry key and its `SAVE_KEYS` entry
- [ ] 2.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (the existing `save-migration.spec.ts` asserts `writtenVersion` against `SAVE_VERSION`, so it follows to 5)

### Phase 3: The load path applies the house; the room list comes from the house

#### Automated

- [ ] 3.1 New data and guard tests green; unit `<phase-2 count> + N`
- [ ] 3.2 Deliberate break: swap the salon/kitchen order in `HOUSES` → the "equals the old literal" case red; call `nextRoom` before `repairCurrentRoom` → the order guard red; each restored; meta-check: the order guard proves wiring only; the behaviour under a real v4 save is proven by phase 7
- [ ] 3.3 `npm run build` prints `e2e hook: absent (` (the new `v4-salon` marker is not in `dist/`)
- [ ] 3.4 `git diff --stat <phase-2 sha> -- src/ui/widgets src/core/save.ts tests/fixtures public` empty
- [ ] 3.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

### Phase 4: Per-room name and thumbnail; each done-card tile drawn from its own room

#### Automated

- [ ] 4.1 New cases green (the `undefined` picker case red before the signature change); unit `<phase-3 count> + N`
- [ ] 4.2 Deliberate break: pass the current `room`/`state` to every tile again → the source guard red; return `'thumbnail'` for an undefined key → the picker case red; each restored; meta-check: the guard cannot see the pixels; the visual pass (6.x) and phase 7 look at the drawn card
- [ ] 4.3 `git diff <phase-3 sha> -- src/data/pl.ts` shows only `name` → `names` (and `roomText.name`); `grep -rn "pl.room.name\b\|\.name ?? id" src` empty
- [ ] 4.4 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0` (`salon-*` specs reading `doneMiniature` stay green)

### Phase 5: The art table and the art script per room

#### Automated

- [ ] 5.1 `tests/roomArt.test.ts` green; unit `<phase-4 count> + N`
- [ ] 5.2 Deliberate break: change the salon folder in `roomArt` to `assets/rooms/salon2/` → the snapshot case red; set the salon `recolourBoard: false` and run `npm run art` → `git status --porcelain public/` lists `architecture-before.webp` and `architecture-after.webp`; each restored; meta-check: the snapshot is taken from the code before the edit, so it is an oracle of today's behaviour, not of the refactor
- [ ] 5.3 `npm run art` then `git status --porcelain public/` empty; `git status --porcelain scripts/` shows only `make-task-art.mjs`
- [ ] 5.4 `git diff --stat <phase-4 sha> -- src/core src/scenes src/ui public` empty
- [ ] 5.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

### Phase 6: Docs, follow-ups, seam sweep and the visual pass

#### Automated

- [ ] 6.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "save format v5|houseRoomList" CLAUDE.md` present
- [ ] 6.2 `grep -c "Trigger:" context/changes/rooms-as-data/follow-ups/review-fixes.md` ≥ 10
- [ ] 6.3 `grep -rnE "ROOM_ORDER|SALON_ART|SCENE_FILES\b|pl\.room\.name\b|freshSession\(FIRST_ROOM" src scripts tests` empty; `grep -rn "HOUSE_V5 = \|HOUSE_V5:" src` lists one place
- [ ] 6.4 `git diff --stat bc19919 -- src/data/balance.ts src/data/curriculum public tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4.json` empty
- [ ] 6.5 Full local gate green; e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 0`

#### Manual

- [ ] 6.6 [visual] Hook build on 4399, desktop 1440 and tablet 1024: the salon before the stage, the salon after the stage with some furniture, a finished salon with the "Pokój gotowy!" card (salon tile with its check mark, the "Wkrótce" tile without its padlock), "Zmień wygląd" mode, the welcome backdrop, the task screen backdrop, settings "Zapis gry" after a v4 → v5 load (`?e2eSave=v4-salon`, the migration line and the `backup-v4` line), each compared with `main` at `bc19919` — no visible difference except the parent-only room name in the export/import/reset summaries ("salon" → "Salon", plan review F3)
- [ ] 6.7 [human] Accept the rollback risk: a build older than v5 meets a v5 save as `pl.saveFuture` and never overwrites it (note in `deploy/README.md`, as at v3/v4)
- [ ] 6.8 [human] Accept that the v4 → v5 update is proven by unit tests on the real IndexedDB load path (`tests/fixtureLoadPath.test.ts`) and an e2e on the in-memory seam, not by two real builds (save-truth follow-up §15, decision P-6)
- [ ] 6.9 [reviewer] (CI at ship) PR job `check` of workflow `CI` green: its log matches `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in the `check` log of run 41118206318, job 124277837113: `Tests  3959 passed | 3 skipped (3962)`, `e2e hook: absent (2 chunks checked)`)

### Phase 7: A v4 salon save survives into the v5 build — e2e (#10, #2)

#### Automated

- [ ] 7.1 Spec red before (deliberate breaks, each run alone with `-g`: drop `house` from `toSession` → `#10` house case red; make `LIFT_V4_HOUSE` drop `chosen` → `#10` room case red; drop `migrated` from the autosaver options in `main.ts` → `#2` red on the backup op; make `roomInRenovation` return the first house cell even when unknown → the finished-salon reload case red on `currentRoom`; return the current room/state for every tile → done-card case unaffected (one room — recorded as the expected blind spot, covered by the phase-4 guard); each restored), green after
- [ ] 7.2 `npx playwright test tests/e2e/rooms-as-data.spec.ts tests/e2e/save-migration.spec.ts` green; full e2e (orchestrator, `--workers=4`) `<branch e2e baseline> + 3`; total equals `npx playwright test --list | tail -1`
- [ ] 7.3 Full local gate green
