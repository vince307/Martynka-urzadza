# "Co urządzamy najpierw?" (Dom or Baza kosmiczna) and the Mostek module — Implementation Plan

## Overview

Roadmap slice S-28 `first-building-choice` (milestone M-03, Stream D "Baza kosmiczna"; PRD FR-042, FR-043, FR-044,
FR-049, FR-050, US-05, US-06, US-07, Open Question 17), autonomous run `2026-10-31-space-base`, branch
`feat/first-building-choice` cut from `main` at `fc13e8c`. Outcome: a new child, after the age (or after the parent set the
stage), sees "Co urządzamy najpierw?" with two picture cards (Dom, Baza kosmiczna), can have them read by a speaker button,
and taps one. With the base she renovates the Mostek module like a room (walls and floor before → after, then 6 elements
× 3 variants, 100 stars in all). Until her first round ends a "Wróć" on the task screen takes her back to the choice. A
child with a save from before this change plays on in the house with no choice screen (FR-049), and the same seed gives
the same tasks in both buildings (FR-050).

Binding inputs: `context/runs/2026-10-31-space-base/scope.md` (maintainer decisions, orchestrator starting decisions),
`change.md` D1-D10, `research.md` R1-R7 (its Code References are the grounding). No lessons file exists in
`context/foundation/` (checked at this step), so no lesson is named in a phase.

**A phase that finds it must change star income, mastery, curriculum, variants, task generators, the salon or kitchen
data or pictures, or `balance.loader.totalMs` stops with `STATUS: BLOCKED`.** Only the Mostek costs are new numbers.

## Current State Analysis

Grounded in `research.md`, spot-checked on this branch at `c5c2a21`:

- **Save.** `SAVE_VERSION` 5 (`src/core/save.ts`), v5 = v4 + `house: HouseState` (`{ id, rooms[] }`); `validHouse` checks
  types only, so an unknown house id passes. `MIGRATIONS[4]` lifts v4 with the frozen `HOUSE_V5`
  (`src/core/migrations/house.ts`). Backups (`backup-v<N>`), `readBackups`, `migratedFrom` and `parseImport` are generic
  in the version number. Frozen fixtures `tests/fixtures/save-v1*.json` … `save-v5.json`; `save-v5.json` holds an unknown
  room `living` and is no FR-049 sample.
- **Why v6** (research §1): a pre-S-28 v5 build that reads a base save (`house.id 'base-1'`, `currentRoom 'bridge'`)
  repairs the room to the salon (`repairCurrentRoom` in `src/main.ts` with `Object.keys(ROOMS)` and `FIRST_ROOM`), lets
  `nextRoom(houseLayout(…, FIRST_HOUSE))` pick the salon and writes it back. Under v6 the old build meets `future`,
  shows `pl.saveFuture` and overwrites nothing (`replaceGate`, `guardedPut`).
- **Welcome.** `WelcomeScene.start(placed)` is the only writer of `REGISTRY_KEYS.learner` and the only hand-off to
  `TaskScene`, reached by `choose(age)` (child) and `openStagePanel … onConfirm` (parent). No speaker: `UIScene` (home of
  `SpeakerButton`) is launched by `TaskScene`. `targets()` returns `ages` and `parent`; the hook reports
  `screen: 'welcome'`.
- **Back.** `ageBackOffered` (`src/core/placement.ts`) = `!stageOverriddenByParent && !firstRoundDone(…)`;
  `TaskScene.renderAgeBack` / `backToAge` null the learner, flush, stop UI and Room, start `WelcomeScene` at the age.
  Users: `tests/ageBack.test.ts`, `tests/layout.test.ts`, `tests/e2e/first-launch.spec.ts`, `tests/e2e/support/hook.ts`,
  `src/testing/e2eHook.ts` (`ageBack` target), `TASK_LAYOUT.ageBack`, `pl.round.ageBack`.
- **Buildings.** `HOUSES` (`src/data/houses.ts`) = one `house-1` (salon 0/0, kitchen 0/1); `HOUSE_GEOMETRY` has `house-1`
  only; `ROOMS` (`src/data/rooms.ts`) = `{ salon, kitchen }`; the kitchen (manifest slots copied slot by slot, 7 tasks
  5-15) is the model for a new room. `RoomScene` shows the "Dom" button (`houseButton`, `pl.house.open`) whenever not
  blocked. `tests/roomsData.test.ts` requires every room in `FIRST_HOUSE` and every cost in 5-15.
- **Boot.** `BootScene` queues `bootQueue(['loadingArt','font','task','room','ui','sound'])`; `room` loads
  `bootRoomArt(currentRoom)`; room health is computed over the boot room; then `needsPlacement(learner) ? welcome : task`.
  A fresh install boots the salon (about 1.2 MB). `createRoomArtLoader` attaches to `UIScene`'s loader
  (`attachLoader`), so it has no loader while the welcome runs. `tests/bootBudget.test.ts` checks every room of `ROOMS`.
- **Art.** `scripts/make-task-art.mjs`: `ROOM_PACKS` rows `salon` (`recolourBoard: true`) and `kitchen` (`false`), plus
  the UI, fox and house roots. Pack `designs/bystrow-space-base-v1/manifest.json`: `rooms.bridge` (6 slots, z 5-40,
  families natural/sunny/mint), `choices` (`choice-house.png`, `choice-space.png`, 720×480, no label in the picture).
- **Smoke.** Deploy run 41232755289, job `deploy` 124630959484 (main `fc13e8c`), seen:
  `ok   precache covers room pictures — 58 of 58 room pictures precached`,
  `ok   precache covers house pictures — 3 of 3 house pictures precached`. Job `build` 124630170144 seen (ANSI stripped):
  `Tests  4089 passed | 3 skipped (4092)` and `e2e hook: absent (2 chunks checked)`.
- **Counts on this branch.** `npx playwright test --list | tail -1` → `Total: 179 tests in 47 files` (e2e baseline 179);
  43 files under `tests/e2e/` use the `passWelcome*` helpers. Unit baseline: measured by each phase on the branch
  (main's CI saw 4089).

## Desired End State

- **Save v6** = v5 + `version: 6`, nothing else (`house.id` names the building). `MIGRATIONS[5]` is a frozen identity
  step in `src/core/migrations/building.ts` (no `copyHouse`, rooms-as-data follow-up 15). `backup-v5` follows the
  write-once policy. Frozen fixtures `save-v5-salon.json` (written by the v5 code in phase 1) and `save-v6.json` (a base
  save). `deploy/README.md` § 6 carries the v6 rollback note.
- **Base as data.** `HOUSES` gains `base-1` with one cell `bridge` (floor 0, place 0) and no `HOUSE_GEOMETRY`;
  `BUILDING_CHOICES` (`src/data/houses.ts`) maps the cards `house` → `house-1` and `space` → `base-1`; `ROOMS` gains
  `bridge` (Mostek: stage + 6 slots, costs 6/10/13/14/17/19/21 = 100). The room view hides the zoom-out button for a
  building without geometry. The load path repairs a `currentRoom` outside the current building to that building's first
  room.
- **Fresh install boot** loads no room art and the two choice cards (`CHOICE_ART`, `public/assets/choice/`); a returning
  player boots exactly as today. Room health on a fresh install is recorded over an empty list (nothing claimed missing);
  `UIScene` asks the room loader for the current room once it attaches.
- **Choice view.** `WelcomeScene` has two views: `age` (today) and `choice` (title "Co urządzamy najpierw?", two
  `ChoiceCard`s with the picture or a drawn stand-in and the label below, a `SpeakerButton` shown while a voice exists, and
  "Wróć" to the age on the child path only). Both placement paths reach the choice; the card tap writes `house`, `rooms`,
  `currentRoom` from `buildingStart(…)` and then the learner, and starts `TaskScene`. Nothing is written before the tap.
- **Theme back.** The task-screen "Wróć" (`themeBack`) shows on both paths while `themeBackOffered` holds (first round not
  done AND no room task bought); it nulls the learner, logs one `console.info` (post-run-polish N-2) and restarts
  `WelcomeScene` on the choice view with the placement as scene data (runtime only).
- **e2e.** Hook `welcomeView: 'age' | 'choice'`, targets `choices`, `choiceBack`, `choiceSpeaker`, task target
  `themeBack`; seam `?e2eSave=v5-salon` (marker `v5-salon`); helpers tap "Dom" by default; spec
  `tests/e2e/first-building-choice.spec.ts`.
- Verify: unit and wiring tests, the full local gate per phase, the visual pass of every listed state, the phase-9 e2e.

### Key Discoveries:

- `WelcomeScene.start` is the single choke point of both placement paths (`src/scenes/WelcomeScene.ts` `start`), so the
  choice is a local insertion in front of it.
- The building already lives in the save as `house.id`; every `src/core/house.ts` function takes the house as an argument.
  The single-building assumptions are `FIRST_HOUSE`/`FIRST_ROOM` fallbacks at callers and two tests.
- `createRoomArtLoader` has no loader until `UIScene.create` calls `attachLoader`; the welcome cannot load room art.
- `bootRoomArt(undefined)` falls back to the salon, so "skip the room group" must be a group decision, not an empty id.
- `ArtImage` sizes come from `TASK_ART` + `UI_ART` (`SIZES` map), so a choice card needs its own drawing (new widget).
- `tests/roomsData.test.ts` caps costs at 15: 7 tasks then sum to at most 97 and cannot all exceed the salon's cost at the
  same index (FR-044), so the cap must widen for Mostek.

## What We're NOT Doing

- No base cross-section, no "Baza" zoom-out button, no base shell or airlock art (S-29, FR-045/046/048); `bases.base-1`
  of the manifest is not converted.
- No Hangar (S-30), no second module, no "next module" teaser.
- No switching between buildings after the first round, no two buildings at once; a different building only through
  "Zacznij od nowa" (existing reset, which leads back to the welcome and the choice).
- No `building` save field (R1), no change to `validateSave`/`saveProblem` beyond doc wording, no lenient `variants`
  (rooms-as-data follow-up 9 re-recorded), no two-real-builds e2e (follow-up 10 re-recorded).
- No change to star income, mastery, curriculum, variants, generators, `MINIGAME_WORDS` (kept shared, R7), the salon or
  kitchen data and pictures, `balance.loader`, `createRoomArtLoader` internals, `drawRoomMiniature`, `HouseScene`.
- No texture atlas (Mostek 699 KB is lighter than the salon; follow-up re-recorded).
- No animation on the choice view (`ChunkyFace` press only, which already obeys `prefersReducedMotion()`).
- No auto-read of the choice view (auto-read stays off by default; the speaker reads on tap).

## Implementation Approach

The frozen v5 fixture and the pure rules come first while the code is still v5; then the version bump on its own; then
Mostek as content (art + room data); then the base building as data with the load path and the FR-049/FR-050 proofs;
then the fresh-install boot and the card art; then the choice view (the e2e helpers move with it so the suite stays
green); then the task-screen back; then docs, gaps, follow-ups, the seam sweep and the visual pass; finally the e2e spec.
Every phase is green on the full local gate; no phase adds more than two new UI components.

## Critical Implementation Details

- **State sequencing (card tap).** Set `house`, `rooms`, `currentRoom` first and the `learner` last, in one tick (the
  autosaver debounces to one write); the learner is the "placement done" flag that `needsPlacement` reads, so a crash
  between the two leaves a learner-less save that asks the age again, never a learner in a building she did not pick.
  `stars`, `variants`, `settings` are never written by the choice.
- **Timing & lifecycle (theme back).** `scene.start(SCENE_KEYS.welcome, { placed })` restarts the scene: `create(data)`
  must reset every field (as today) and open the choice view only when `data.placed` is a well-formed `PlacedLearner`;
  any other data opens the age view. The learner is nulled and flushed BEFORE the restart (today's `backToAge` order).

## Phase 1: The frozen v5 salon save and the pure building rules

Driver: tdd
Driver why: the fixture's v5 acceptance and the two absent pure rules (`themeBackOffered`, `houseRoomIds`) are led red-first by literal oracles while the code is still v5.

### Overview

Freeze a real v5 save with a salon in progress while v5 code writes it, and add the two pure rules later phases wire.

### Changes Required:

#### 1. Frozen v5 salon fixture

**File**: `tests/fixtures/save-v5-salon.json` (new, frozen from this phase on)

**Intent**: the FR-049 sample: what a device stores today for a child mid-salon.

**Contract**: produced by the v5 code, not typed by hand: a throwaway script (scratchpad, not committed) builds a session
with `freshSession(FIRST_HOUSE, 17)`, sets a child-placed learner on stage E2 (mastery, streak, history of 8 answers with
one `example`, `pendingUnlock: null`), `rooms.salon = { tasksDone: 4, chosen: { sofa: 2, rug: 1, 'coffee-table': 0 } }`,
`settings.autoRead: true`, `variants` with `roundsSince: 2`, `lastMinigame: 'dice'`, a `puzzleDay`, one `puzzlesDone`
id, runs the real `encodeSave` and stamps `generation: 9`, `writer: 'tab1:n1'` as `guardedPut` would. `version: 5`,
`house` = the `house-1` cells of `HOUSES` today, `currentRoom: 'salon'`.

#### 2. Pure rules

**Files**: `src/core/placement.ts`, `src/core/house.ts`

**Intent**: the task-screen back's rule for both paths, and "which rooms belong to this building" for the load path.

**Contract**:
- `themeBackOffered(learner: Pick<SessionLearner, 'history'>, variants: VariantState, warmupLength: number, rooms: Readonly<Record<string, RoomState>>): boolean`
  = `!firstRoundDone(learner, variants, warmupLength)` AND every `rooms[*].tasksDone === 0`. No stage-override term
  (both paths). `ageBackOffered` stays until phase 7 removes it.
- `hasPurchase(rooms: Readonly<Record<string, RoomState>>): boolean` = some `rooms[*].tasksDone > 0`; `themeBackOffered`
  uses it, and phase 6 uses it to keep a learner-less save that already bought something in its saved building (plan
  review F4).
- `houseRoomIds(house: HouseState, known: Readonly<Record<string, RoomDef>>): string[]` — the house's cells' rooms present
  in `known`, in house order, fresh array.

#### 3. Tests

**Files**: `tests/themeBack.test.ts` (new), `tests/house.test.ts`, `tests/saveV5.test.ts`, `tests/fixtureLoadPath.test.ts`

**Contract**: `themeBack.test.ts` literal cases: parent-placed learner with empty history → true; child-placed → true;
history of `warmupLength + 1` → false; `roundsSince: 1` → false; any room with `tasksDone: 1` → false; a room map with
only zeros → true; `hasPurchase({})` false, `{ salon: { tasksDone: 0 } }` false, `{ salon: 0, kitchen: 1 }` true. `house.test.ts`: `houseRoomIds` over a synthetic house `[a, unknown, b]` → `['a', 'b']`, empty for an
all-unknown house, no mutation. `saveV5.test.ts`: `save-v5-salon.json` decodes `ok`, `migratedFrom: null`,
`saveProblem` null, and `encodeSave(decoded session)` deep-equals the fixture except the store-stamped `generation` and
`writer` (round-trip = this is exactly what v5 writes). `fixtureLoadPath.test.ts` `FIXTURES` gains `save-v5-salon`.

### Success Criteria:

#### Automated Verification:

- `npx vitest run tests/themeBack.test.ts tests/house.test.ts tests/saveV5.test.ts tests/fixtureLoadPath.test.ts` green; the new cases red before the code/fixture exist; unit `<branch unit baseline> + N`
- Deliberate break: drop the `tasksDone` term from `themeBackOffered` → the "room with a purchase" case red; decode a scratch copy of the fixture with `house` removed → the `ok`/`saveProblem` case red (the fixture is the v5 shape, not v4); each restored; meta-check: the fixture is proven a genuine v5 write by decode + re-encode on the unchanged v5 code, never by the v6 migration under test
- `git diff --stat fc13e8c -- src/core/save.ts src/core/migrations src/data tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4*.json tests/fixtures/save-v5.json public` empty (v5 code unchanged while the fixture is frozen)
- Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `179 + 0`

---

## Phase 2: Save format v6 (version bump)

Driver: tdd
Driver why: `MIGRATIONS[5]` and `SAVE_VERSION` 6 are absent; the phase-1 frozen v5 fixture and a literal v6 shape lead them red-first.

### Overview

`SAVE_VERSION` 6 as a rollback guard over the v5 shape; `backup-v5`; every version pin moves; the README rollback note.

### Changes Required:

#### 1. Frozen migration

**File**: `src/core/migrations/building.ts` (new)

**Intent**: lift v5 to v6 without reading live data.

**Contract**: `LIFT_V5_BUILDING = (raw: Record<string, unknown>) => ({ ...raw, version: 6 })`; comment: frozen, the
building is `house.id`, never calls `copyHouse` or imports `src/data`; a v5 save keeps its house as saved.

#### 2. Save core

**Files**: `src/core/types.ts`, `src/core/save.ts`

**Contract**: `SaveV6 extends Omit<SaveV5, 'version'> { version: 6 }`, `SaveState = SaveV6`; `SAVE_VERSION = 6`;
`MIGRATIONS[5] = LIFT_V5_BUILDING`; header comment and `saveProblem`/`validateSave` docs name v6. `encodeSave`,
`toSession`, `validHouse`, `freshSession` unchanged.

#### 3. Fixtures and pins

**Files**: `tests/fixtures/save-v6.json` (new, frozen: a base save — learner, `house { id: 'base-1', rooms: [{ room: 'bridge', floor: 0, place: 0 }] }`,
`rooms.bridge { tasksDone: 2, chosen: { 'bridge-console': 1 } }`, `currentRoom: 'bridge'`, stars, variants, guard
fields), `tests/saveV6.test.ts` (new), `tests/save.test.ts`, `tests/saveV5.test.ts`, `tests/saveV4.test.ts`,
`tests/legacySalonMigration.test.ts`, `tests/autosave.test.ts`, `tests/fixtureLoadPath.test.ts`, `tests/idbStore.test.ts`,
`tests/e2e/rooms-as-data.spec.ts`

**Contract**: `saveV6.test.ts`: `SAVE_VERSION` 6; `MIGRATIONS[5](save-v5-salon)` deep-equals `{ ...fixture, version: 6 }`
(literal spread of the frozen file), does not mutate its input; `decodeSave(save-v5-salon)` → `migratedFrom: 5`, house
`house-1`, stars, rooms, learner field-equal to the fixture; `save-v6.json` decodes unmigrated with house `base-1`; a
`{ version: 7 }` save is `future`; `importProblem(save-v5-salon)` null; a source guard that `building.ts` imports nothing
from `src/data` and does not mention `copyHouse`. Pins: every `toBe(5)` / `version: 5` encode / "v6 is future" case moves
to 6 / 7; `saveV5.test.ts` keeps the `MIGRATIONS[4]` meaning and its "unmigrated" cases accept `migratedFrom: 5`;
`fixtureLoadPath`: title "writes v6", rows `save-v5-salon`, `save-v6`; both v5 fixtures leave `profile:default:backup-v5`
equal to the raw bytes; `idbStore`: `readBackups` returns a stored `backup-v5`; the rooms-as-data spec's `SAVE_VERSION`
pin becomes 6.

#### 4. Rollback note

**File**: `deploy/README.md` § "6. Deploy, rollback, status", **Rollback** bullet

**Contract**: a fourth note "Uwaga (format v6, first-building-choice)" in the form of the v3/v4/v5 notes: a rollback below
the v6 build shows the `pl.saveFuture` card and overwrites nothing; a child who chose the base keeps it. Docs only; no
script under `deploy/` changes.

### Success Criteria:

#### Automated Verification:

- `tests/saveV6.test.ts` red against v5 (no `MIGRATIONS[5]`), green after; unit `<phase-1 count> + N`
- Deliberate break: make `LIFT_V5_BUILDING` call `copyHouse` on the house → the source guard red; make it drop `house` → the deep-equal case red; leave `SAVE_VERSION` at 5 with `MIGRATIONS[5]` present → the version pin and `fixtureLoadPath` "writes v6" red; each restored; meta-check: the v5 oracle is the phase-1 fixture proven by v5 code, the v6 oracle a literal spread of that file, neither computed by the migration
- `git diff <phase-1 sha> -- tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4*.json tests/fixtures/save-v5*.json src/core/migrations/house.ts src/core/migrations/legacySalon.ts` empty
- `git diff --stat <phase-1 sha> -- deploy/` shows `deploy/README.md` only
- Full local gate green; e2e (orchestrator, `--workers=4`) `179 + 0` (`save-migration.spec.ts` follows `SAVE_VERSION`)

#### Manual Verification:

- [human] Read the v6 rollback note in `deploy/README.md` § 6: a Deploy rollback below this build shows existing players the "nowszy zapis" card until the roll-forward (accepted in scope.md; this row confirms the wording)

---

## Phase 3: Mostek art and room data

Driver: impl
Driver why: an art-script row, 21 generated WebP files, a room table, a building row and Polish copy, proven by data tests and the deploy smoke — content and glue, no logic a failing test could lead.

### Overview

Mostek becomes a room in `ROOMS` with its pictures precached, inside a second building `base-1` that nobody can choose yet.

### Changes Required:

#### 1. Art script and files

**Files**: `scripts/make-task-art.mjs`, `public/assets/rooms/bridge/*.webp` (21, generated)

**Intent**: convert the pack's Mostek like the kitchen (`convert()` settings unchanged).

**Contract**: a `SPACE_BASE` root (`designs/bystrow-space-base-v1`) and a `ROOM_PACKS` row `{ room: 'bridge', pack: SPACE_BASE,
scene: ['bridge-before', 'bridge-after', 'bridge-shadows'], decor: [], furniture: 18 × 'bridge-{console,chair,telescope,shelf,rug,plants}-{natural,sunny,mint}', recolourBoard: false }`
(cream `#FFF5DF` edges, no board). Every other output byte-identical.

#### 2. Room data

**Files**: `src/data/rooms.ts`, `src/data/roomArt.ts`, `src/data/pl.ts`

**Intent**: the module as data, copied slot by slot from `manifest.json` `rooms.bridge`.

**Contract**: `BRIDGE: RoomDef` with `id: 'bridge'`, scene keys `bridge/before|after|shadows`, no decor, six slots
(`bridge-console`, `bridge-chair`, `bridge-telescope`, `bridge-shelf`, `bridge-rug`, `bridge-plants`: x, y, width,
height, z, anchor, visibleRect from the manifest, variants `bridge/bridge-<slot>-{natural,sunny,mint}`), tasks in this
order and cost: `renovate` (stage) 6, console 10, chair 13, telescope 14, shelf 17, rug 19, plants 21 (= 100; each above
the salon's task at the same index, first ≤ `cleanRound`); `ROOMS` gains `bridge`. `ROOM_SCENE_FILES.bridge`.
`pl.room.names.bridge = 'Mostek'`; slot names `pulpit sterowniczy`, `fotel pilota`, `teleskop`, `regał z planetami`,
`mata orbitalna`, `kapsuła roślinna`; variant names gender-matched (`Naturalny/Słoneczny/Miętowy` for the four masculine,
`Naturalna/Słoneczna/Miętowa` for mata and kapsuła); task labels (imperative + accusative, DESIGN-GAP comment):
`Postaw pulpit`, `Postaw fotel pilota`, `Ustaw teleskop`, `Postaw regał z planetami`, `Połóż matę orbitalną`,
`Ustaw kapsułę roślinną`; the stage reuses `renovate`.

#### 3. Tests

**Files**: `tests/roomArt.test.ts`, `tests/fixtures/room-art-bridge.json` (new), `tests/roomsData.test.ts`, `tests/houseCells.test.ts`

**Contract**: room-art fixture and per-room count (bridge 21), header sizes, labels without `-`/`/`; the room-size cap
(1 550 000 B) holds. `roomsData`: the cost cap becomes `MAX_TASK_COST = 21` (test constant, comment: Mostek FR-044) with
min 5 and the first-task rule kept; a pin `BRIDGE.tasks` costs `[6, 10, 13, 14, 17, 19, 21]`, sum 100, and each greater
than `SALON.tasks[i].cost`; "placed in the first house" → "placed in exactly one house of `HOUSES`"; `houseRoomList(base-1,
ROOMS)` → `[{ room: 'bridge' }]` (no teaser); with every Mostek task done `nextRoom` keeps `currentRoom: 'bridge'`,
`movedFrom: null` (D7: "Dalej" stays in Mostek). `houseCells.test.ts` (plan review F1: its "has a geometry for every house" and
"a cell for every place of every house" iterate `HOUSES` and go red when `base-1` joins without geometry): both cases run over
the houses that have a `HOUSE_GEOMETRY` entry, plus a pin that the houses without one are exactly `['base-1']` (comment: S-29
adds the base geometry and drops the pin).

#### 4. The base building

**File**: `src/data/houses.ts`

**Contract**: `HOUSES` gains `{ id: 'base-1', rooms: [{ room: 'bridge', floor: 0, place: 0 }] }` (no `HOUSE_GEOMETRY`
entry; comment: S-29). No building can be chosen yet (phase 6), so no player reaches it.

### Success Criteria:

#### Automated Verification:

- `npm run art` regenerates the files; `git status --short public/assets` shows only `public/assets/rooms/bridge/`
- `npx vitest run tests/roomArt.test.ts tests/roomsData.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `<phase-2 count> + N`
- Deliberate break: rename one bridge WebP → the room-art fixture/file case red; set the console cost to 9 → the "above the salon" case red; each restored; meta-check: the cost oracle is the literal list written from FR-044, the art oracle the pack manifest sizes
- `npm run build` then `grep -o "assets/rooms/bridge/" dist/sw.js | wc -l` = 21 (sw.js is one line, so `grep -c` would print 1)
- `git diff --stat <phase-2 sha> -- public/assets/rooms/salon public/assets/rooms/kitchen src/data/balance.ts src/data/curriculum src/core src/scenes src/main.ts` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `179 + 0`

#### Manual Verification:

- [reviewer] Polish copy read as a primary-school teacher would (profile § 2 content rule): Mostek task labels, slot and variant names (gender agreement, accusative after the verb); `npm run sample -- E1 --count 6` output unchanged (no task data touched)
- [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 79 of 79 room pictures precached` (format seen in Deploy run 41232755289, job 124630959484: `ok   precache covers room pictures — 58 of 58 room pictures precached`)

---

## Phase 4: The base building as data, the load path and the FR-049/FR-050 proofs

Driver: impl
Driver why: a data table, a one-line pure wrapper over `freshSession`, load-path and room-view wiring over the phase-1 rules, and characterization tests for FR-049/FR-050 whose behaviour already holds — glue, no logic a failing test would lead.

### Overview

A card choice maps to a building, the load path stays inside the building, the room view hides the
zoom-out button where no cross-section exists, and the e2e build can start from the frozen v5 salon save.

### Changes Required:

#### 1. The choice table

**Files**: `src/data/houses.ts`, `src/core/types.ts`, `src/core/house.ts`

**Contract**: `BuildingChoice { id: 'house' | 'space'; house: string; art: string }` and
`BUILDING_CHOICES: readonly BuildingChoice[]` = `[{ id: 'house', house: 'house-1', art: 'choice/house' }, { id: 'space', house: 'base-1', art: 'choice/space' }]`
(art keys of phase 5). Pure `buildingStart(choice: BuildingChoice['id'], choices, houses, stars): Pick<SessionSave, 'house' | 'rooms' | 'currentRoom'>`
in `src/core/house.ts` = the house/rooms/currentRoom of `freshSession(<house of the choice>, stars)`; throws on an unknown
choice or house (named error).

#### 2. Load path

**File**: `src/main.ts`

**Intent**: a `currentRoom` outside the current building is repaired to that building's first room, not to the salon.

**Contract**: `repairCurrentRoom({…}, houseRoomIds(layout, ROOMS), layout.rooms[0].room)` where `layout =
houseLayout(session.house, HOUSES, FIRST_HOUSE)`; the unknown-house warn, `mergeHouse`, `nextRoom` order unchanged
(`tests/houseWiring.test.ts` order guard still green). A fresh start stays `freshSession(FIRST_HOUSE, …)` (replaced at
the choice in phase 6).

#### 3. Room view

**File**: `src/scenes/RoomScene.ts`

**Contract**: the "Dom" button shows only when `HOUSE_GEOMETRY[<current house id>]` exists AND nothing blocks it; one
data-driven condition, no `base` string in the scene.

#### 4. e2e seam

**Files**: `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`

**Contract**: seam `v5-salon` (`E2ESaveSeam`, `E2E_SAVE_SEAMS`, doc line) seeding the store with
`structuredClone(save-v5-salon.json)`; marker `'v5-salon'` in `E2E_HOOK_MARKERS` (absent from `dist/`).

#### 5. Tests

**Files**: `tests/roomsData.test.ts`, `tests/house.test.ts`, `tests/buildingNeutral.test.ts` (new),
`tests/freshRoundWiring.test.ts`, `tests/houseWiring.test.ts`

**Contract**: `roomsData`: every `BUILDING_CHOICES` house is in `HOUSES`, ids `house` and `space` exactly. `house.test.ts`: `buildingStart('space', …, 7)` → house `base-1`, `currentRoom
'bridge'`, `rooms { bridge: { tasksDone: 0, chosen: {} } }` (literal); `'house'` → salon; unknown choice throws.
`buildingNeutral.test.ts` (FR-050): for seeds 1..20, rounds built by `buildAdaptiveRound`, `buildWarmup`,
`nextRoundKind`, `buildWordRound` from the same learner/variants/stars after `buildingStart('house')` and
`buildingStart('space')` are deep-equal; `MINIGAME_WORDS` is one list. `freshRoundWiring`: `TaskScene.freshRound`'s
body reads none of `REGISTRY_KEYS.house`, `.currentRoom`, `.rooms`. Load-path guard: `main.ts` calls `houseRoomIds(`
before `repairCurrentRoom(` and no longer passes `Object.keys(ROOMS)` to it. FR-049 unit: `fixtureLoadPath` for
`save-v5-salon` → house `house-1`, `currentRoom 'salon'`, same stars, `needsPlacement(learner) === false`; for
`save-v6.json` → `currentRoom 'bridge'` kept (a `currentRoom 'salon'` inside a `base-1` save repairs to `bridge`).

### Success Criteria:

#### Automated Verification:

- New and changed tests green; unit `<phase-3 count> + N`
- Deliberate break: map `space` to `house-1` in `BUILDING_CHOICES` → the `buildingStart` literal case red; pass `Object.keys(ROOMS)` and `FIRST_ROOM` again in `main.ts` → the load-path guard and the "salon inside base-1 repairs to bridge" case red; make `freshRound` read `REGISTRY_KEYS.currentRoom` → the wiring guard red; each restored; meta-check: FR-050's deep-equal proves the round inputs carry no building and the guard proves the scene passes none; the browser path is phase 9
- `npm run build` prints `e2e hook: absent (` (the `v5-salon` marker is not in `dist/`)
- `git diff --stat <phase-3 sha> -- src/core/save.ts src/core/migrations src/data/balance.ts src/data/curriculum src/data/minigames.ts src/scenes/HouseScene.ts` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `179 + 0`

---

## Phase 5: Fresh-install boot and the choice-card art

Driver: impl
Driver why: boot-queue wiring, an art root, a data table and a smoke line, proven by data/budget tests and the build — glue and art conversion.

### Overview

A fresh install boots the two choice cards and no room; a returning player boots exactly as today.

### Changes Required:

#### 1. Art

**Files**: `scripts/make-task-art.mjs`, `public/assets/choice/{choice-house,choice-space}.webp` (generated),
`src/data/choiceArt.ts` (new)

**Contract**: a 2-file job list from `designs/bystrow-space-base-v1/assets/choice/` at native 720×480 into
`public/assets/choice/`, in the kit-existence check and the printed total; other outputs byte-identical.
`CHOICE_ART: readonly { id: 'house' | 'space'; key: string; url: string; width: 720; height: 480 }[]` with keys
`choice/house`, `choice/space` (the `BUILDING_CHOICES` art keys), relative `assets/choice/…` URLs.

#### 2. Boot

**Files**: `src/core/artHealth.ts`, `src/scenes/BootScene.ts`, `src/scenes/UIScene.ts`

**Contract**: `BootGroup` gains `'choice'`; pure `bootGroups(placementNeeded: boolean): BootGroup[]` = `['loadingArt',
'font', 'task', 'choice', 'ui', 'sound']` when true, today's list when false (order from `QUEUE_ORDER`, `choice` where
`room` sits). `BootScene.preload` queues `bootQueue(bootGroups(needsPlacement(<registry learner>)))`; the `choice` queuer
loads `CHOICE_ART`; room health is computed over `[]` when the room group was skipped (total 0, nothing missing) and the
`roomArtHealth` record is written as today otherwise; `tables()` knows the choice keys for `loadErrorLine` (logged under
the `ui` table name; "Obrazki" gets no new line). `UIScene.create`, right after `attachLoader`, calls
`ensure([<currentRoom>])` so the chosen room loads during the first round. e2e build only: `?e2eArt=choice` (inside
the existing `e2eArt` marker, `E2EArtSeam` gains `'choice'`) queues no card, for the stand-in frame.

#### 3. Deploy smoke

**File**: `scripts/check-deploy.ts`

**Contract**: `record(precacheCovers('choice pictures', precache, CHOICE_ART.map((a) => a.url)))` beside `house pictures`.

#### 4. Tests

**Files**: `tests/choiceArt.test.ts` (new), `tests/bootBudget.test.ts`, `tests/artHealth.test.ts` (or the file that tests
`bootQueue`)

**Contract**: `choiceArt`: each entry has its file with the stated WebP header size, no orphan in `public/assets/choice/`,
keys disjoint from every other art table, every `BUILDING_CHOICES.art` is a `CHOICE_ART` key, total ≤ 130 000 B.
`bootGroups(true)` / `(false)` literal lists. `bootBudget`: a "fresh install" case (task + UI + choice + font + boot
sounds, no room) within the same limit; the per-room cases include `bridge`.

### Success Criteria:

#### Automated Verification:

- `npm run art` regenerates the 2 files; `git status --short public/assets` shows only `public/assets/choice/`
- `npx vitest run tests/choiceArt.test.ts tests/bootBudget.test.ts tests/artHealth.test.ts tests/deployCheck.test.ts` green; unit `<phase-4 count> + N`
- Deliberate break: make `bootGroups(true)` include `'room'` → its literal case red; delete `choice-space.webp` → the file case red; each restored; meta-check: the boot proof is the pure group list plus the build; the browser proof that the welcome shows the cards is phase 9
- `npm run build` then `grep -o "assets/choice/" dist/sw.js | wc -l` = 2
- `git diff --stat <phase-4 sha> -- src/ui/roomArtLoader.ts src/data/balance.ts public/assets/rooms public/assets/ui public/assets/tasks` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `179 + 0`

#### Manual Verification:

- [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers choice pictures — 2 of 2 choice pictures precached` (format seen in Deploy run 41232755289, job 124630959484: `ok   precache covers house pictures — 3 of 3 house pictures precached`)

---

## Phase 6: The choice view

Driver: impl
Driver why: a scene view and one new widget over the phase-4 rule `buildingStart`, with the hook and the e2e helpers moved in the same commit to keep the suite green — rendering glue proven by layout/wiring tests and the full e2e.

### Overview

`WelcomeScene` gets the `choice` view between placement and the task scene; two new UI components only (`ChoiceCard`,
the choice view); `SpeakerButton` and `PageButton` are reused.

### Changes Required:

#### 1. Tokens and copy

**Files**: `src/data/layout.ts`, `src/data/pl.ts`, `src/core/artPick.ts`

**Contract**: `WELCOME_LAYOUT.choice`: `title` (the `question` position), `cards` (two card rects inside the notebook face
right of `CONTENT_LEFT`, the picture at 720:480 scaled, label band below), `speaker` (a rect clear of the title and
cards), `back` (child path "Wróć", left bottom where `parent` is not); `WELCOME_TOUCH_TARGETS` entries;
DESIGN-GAP comments (gap rows in phase 8). `pl.welcome.choice = { question: 'Co urządzamy najpierw?', house: 'Dom',
space: 'Baza kosmiczna', spoken: 'Co urządzamy najpierw: dom czy bazę kosmiczną?', back: 'Wróć' }`. `FallbackWhere`
gains `'choice'`.

#### 2. Widget

**File**: `src/ui/widgets/ChoiceCard.ts` (new)

**Contract**: a card with a `ChunkyFace` (`LIPS` entry for the card), the `CHOICE_ART` texture fitted into the picture
rect or, when the texture is missing, a drawn stand-in rect (`PLACEHOLDER_COLORS`) with the label; the label text below;
fires on `pointerup` only when the press began on it (the `AgeButton` pattern); `target()` = an interior point; no tween
beyond `ChunkyFace` (reduced motion holds by construction).

#### 3. Scene

**File**: `src/scenes/WelcomeScene.ts`

**Intent**: both placement paths end on the choice; the tap starts the game in the chosen building.

**Contract**: `create(data?)` resets every field; a well-formed `data.placed` (`PlacedLearner`) opens the `choice` view at
once (phase 7 uses it), anything else the `age` view. `choose(age)` and the stage panel's `onConfirm` store the
`PlacedLearner` and switch to the `choice` view (age buttons, "Rodzic" and the age question hidden; the backdrop,
notebook, brand and build id stay). The choice view: title, one `ChoiceCard` per `BUILDING_CHOICES` row (label from
`pl.welcome.choice[id]`), a `SpeakerButton` speaking `pl.welcome.choice.spoken` through the registry narrator
(`REGISTRY_KEYS.narrator`), visible only while `narrator.available` (`onAvailability`, listener removed on shutdown),
`narrator.cancel()` when leaving; "Wróć" (`PageButton`) back to the age view only when `!placed.stageOverriddenByParent`
and the placement came from the age view (not from scene data of a parent-placed learner). Purchase guard (plan
review F4): when `hasPurchase(<registry rooms>)` holds (a learner-less v5 save written after today's "Wróć" followed a
first-round purchase: stars are earned per task and the room is open between tasks), the placement skips the choice
view and calls today's `start(placed)` in the saved building, so no bought piece is dropped. A card tap (once):
`registry.set` `house`, `rooms`, `currentRoom` from `buildingStart(id, BUILDING_CHOICES, HOUSES, <registry stars>)`, then
today's `start(placed)` body (learner, `TaskScene`). `recordFallback(this, 'choice', 'drawn')` when a card drew its
stand-in. Retire the JSDoc nit of notebook-polish follow-up #16 and align the `openParent` suspender guard
(audit-backdrop-fox F4) while in the file.

#### 4. e2e hook and helpers

**Files**: `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`, `tests/e2e/support/welcome.ts`, any spec that taps an
age directly

**Contract**: welcome snapshot gains `welcomeView: 'age' | 'choice'` and `choiceSpeaker: boolean`; welcome targets gain
`choices: Record<'house' | 'space', Point> | null` and `choiceBack: Point | null`. Helper `passChoice(page, building =
'house')` taps the card and waits for `screen === 'task'`; `passWelcomeAsParent`, `passWelcomeAsChild`, `passWelcome` take an
optional `building` (default `'house'`) and call it, so no spec using them changes; specs that tap an age by hand call
`passChoice` after it.

#### 5. Tests

**Files**: `tests/layout.test.ts`, `tests/welcomeChoiceWiring.test.ts` (new)

**Contract**: layout — cards, speaker and back ≥ `MIN_TOUCH_TARGET`, inside the notebook face, not overlapping each
other or the brand/title. Wiring (source text): the card tap sets `REGISTRY_KEYS.house` before `REGISTRY_KEYS.learner`;
`WelcomeScene` writes none of `REGISTRY_KEYS.stars`, `.variants`, `.settings`; it calls `buildingStart(`; it calls
`hasPurchase(` before showing the choice view; it never calls
`tweens`; the speaker uses `REGISTRY_KEYS.narrator` and calls `cancel()` on shutdown.

### Success Criteria:

#### Automated Verification:

- `npx vitest run tests/layout.test.ts tests/welcomeChoiceWiring.test.ts` green; unit `<phase-5 count> + N`
- Deliberate break: set the learner before the house in the card tap → the order guard red; move `WELCOME_LAYOUT.choice.speaker` onto a card → the overlap case red; drop the `hasPurchase` guard → its wiring case red; each restored; meta-check: the guards prove wiring only; phase 9 proves the browser path
- `npm run build` prints `e2e hook: absent (`
- `git diff --stat <phase-5 sha> -- src/core/save.ts src/data/balance.ts src/scenes/BootScene.ts src/scenes/RoomScene.ts` empty
- Full local gate green; full e2e (orchestrator, `--workers=4`) `179 + 0` with every welcome helper passing the choice; total equals `npx playwright test --list | tail -1`

---

## Phase 7: "Wróć" from the task screen to the choice

Driver: impl
Driver why: scene wiring of the phase-1 rule `themeBackOffered` into `TaskScene` plus the hook/spec renames that must move together — glue proven by wiring guards and the rewired first-launch spec.

### Overview

One "Wróć" on the task screen, on both paths, until the first round ends or something was bought; it lands on the
choice view with the same placement.

### Changes Required:

#### 1. Rule and names

**Files**: `src/core/placement.ts`, `src/data/layout.ts`, `src/data/pl.ts`, `tests/ageBack.test.ts` → `tests/themeBack.test.ts`

**Contract**: `ageBackOffered` removed (its cases fold into `themeBack.test.ts`); `TASK_LAYOUT.ageBack` →
`TASK_LAYOUT.themeBack`, touch target likewise, `pl.round.ageBack` → `pl.round.themeBack` ('Wróć'; comment: back to the
building choice).

#### 2. Task scene

**File**: `src/scenes/TaskScene.ts`

**Contract**: `renderThemeBack` shows the button while `themeBackOffered(learner, variants, balance.warmup.length,
<registry rooms>)`; `backToChoice` keeps `backToAge`'s cleanup order (narrator cancel, drag reset, flying stars,
wobble, HUD keys null, learner null, `flush('now')`, stop UI and Room), logs `console.info` once with the stage and
whether the parent placed it (closes post-run-polish N-2), then `scene.start(SCENE_KEYS.welcome, { placed })` with
`placed` = `{ age, stage, stageOverriddenByParent, warmupPending }` of the learner it nulled.

#### 3. Hook and specs

**Files**: `src/testing/e2eHook.ts`, `tests/e2e/support/hook.ts`, `tests/e2e/first-launch.spec.ts`

**Contract**: task target `ageBack` → `themeBack` (still `null` while `inRoom() || inHouse()`); first-launch spec cases
that tapped "Wróć" now expect `welcomeView: 'choice'` and pass the choice again; the parent-path case that asserted no
back now asserts `themeBack` present during the first round.

#### 4. Tests

**Files**: `tests/layout.test.ts`, `tests/themeBackWiring.test.ts` (new)

**Contract**: layout renames. Wiring: `TaskScene` calls `themeBackOffered(` with `REGISTRY_KEYS.rooms`; `backToChoice`
sets the learner `null` before `flush(` and before `scene.start(SCENE_KEYS.welcome, { placed`; it logs `console.info`;
`ageBackOffered` appears nowhere in `src/` or `tests/`.

### Success Criteria:

#### Automated Verification:

- `npx vitest run tests/themeBack.test.ts tests/themeBackWiring.test.ts tests/layout.test.ts` green; unit `<phase-6 count> − (folded ageBack cases) + N`
- `grep -rn "ageBack" src tests` empty
- Deliberate break: start the welcome without `{ placed }` → the wiring guard red; call `themeBackOffered` without the rooms → the guard red; each restored; meta-check: source guards prove wiring; first-launch and phase 9 prove the browser
- `npx playwright test tests/e2e/first-launch.spec.ts` green (orchestrator; sandbox disabled)
- Full local gate green; full e2e (orchestrator, `--workers=4`) `179 + 0`; total equals `npx playwright test --list | tail -1`

---

## Phase 8: Docs, gap rows, follow-ups, seam sweep and the visual pass

Driver: impl
Driver why: rule-file text, gap rows, follow-ups and leftovers over phases 1-7 plus the screenshot matrix — docs and glue.

### Overview

Close the slice in the repo's records, sweep leftovers, and look at every state a child can see.

### Changes Required:

#### 1. Docs

**Files**: `CLAUDE.md`, `docs/design-gaps.md`, `context/changes/first-building-choice/follow-ups/review-fixes.md` (new)

**Contract**: CLAUDE.md "Current state": ONE compact S-28 sentence (save v6 = version bump, `MIGRATIONS[5]` in
`src/core/migrations/building.ts`, `backup-v5`, `save-v5-salon.json`/`save-v6.json`; `base-1` + `bridge` in data,
`BUILDING_CHOICES`/`buildingStart`; the choice view of `WelcomeScene`, `ChoiceCard`, `CHOICE_ART` booted only under
`needsPlacement` (`bootGroups`); `themeBackOffered`/`backToChoice`; `?e2eSave=v5-salon`), the "Project" paragraph's save
version and the "rooms-as-data" sentence's `SAVE_VERSION` 5 wording updated. Gap rows from 191: choice-screen layout,
speaker on the welcome, Mostek task wording, no zoom-out for the base until S-29, Mostek celebration with no next module,
choice-card stand-in, plain welcome/task backdrop on a fresh install until the room loads, Hasło words from the house in
the base (R7). Follow-ups with `Trigger:` lines: rooms-as-data 8, 9, 10 (re-recorded), 15 (applied, closed), texture
atlas (re-recorded `Trigger: tests/bootBudget.test.ts fails or headroom < 2 s`), kitchen 6 (closed as stale, evidence in
research), post-run-polish N-2 (closed by phase 7), audit-backdrop-fox F4 and notebook-polish #16 (closed by phase 6),
the `bases.base-1.label` "Baza księżycowa" nit (`Trigger: S-29`), the follow-ups whose trigger fires on this slice's
`BootScene.preload` change or the v6 format (plan review F5): salon-load-health "time limit of the second font load
(`FontFace`)" and "per-file loader timeout guarded only by e2e", art-stand-in-and-load-signal S14-08 (font logged without
URL), minigame-daily-puzzle "the next save-format change or S-17" — each closed with evidence or re-recorded; every other open follow-up whose `Trigger:` names a file
this slice changed (`WelcomeScene`, `BootScene.preload`, `TaskScene.backToAge`, `src/core/migrations/`, save format) —
each included, closed as stale with evidence, or re-recorded.

#### 2. Seam sweep

**Files**: as found

**Contract**: `grep` for leftovers of phases 1-7 — "age back"/`backToAge` wording in comments, `salon` wording in comments
of code that is now building-neutral (`main.ts` load path, `bootRoomArt` doc), stale "v5" in comments of `save.ts`/
`autosave.ts`/`idb.ts`, duplicated choice-id strings outside `BUILDING_CHOICES`/`CHOICE_ART`, unused exports
(`ageBackOffered`, `FIRST_ROOM` callers that should be the house's first room), `pl.welcome.choice` keys all used, hook doc
lines for `v5-salon`, gap numbers cited in comments match the new rows.

### Success Criteria:

#### Automated Verification:

- `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "buildingStart|CHOICE_ART|themeBackOffered|SAVE_VERSION. 6|v5-salon" CLAUDE.md` present
- `grep -c "Trigger:" context/changes/first-building-choice/follow-ups/review-fixes.md` ≥ 8; `grep -cE "^\| (19[1-9]|20[0-9]) " docs/design-gaps.md` ≥ 7
- Seam sweep: `grep -rn "ageBack\|backToAge" src tests CLAUDE.md` empty; `grep -rn "'space'" src` only in `src/data/houses.ts`, `src/data/choiceArt.ts`, `src/core/types.ts` and the hook (`'house'` is not grepped: `HouseScene`, `artHealth`, `artPick`, `celebration` and `save.ts` already use it for other meanings)
- `git diff --stat <phase-7 sha> -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty
- Full local gate green; e2e (orchestrator, `--workers=4`) `179 + 0`

#### Manual Verification:

- [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the choice view on the child path (with "Wróć") and (2) on the parent path (no "Wróć"), both with the speaker when a voice exists; (3) the choice view under `?e2eArt=choice` (both card stand-ins); (4) Mostek before (stage not bought) and (5) after the stage; (6) a family — one slot in each of natural, sunny, mint (variant panel open); (7) the room-done card for Mostek (one tile, no teaser, "Dalej" stays in Mostek, no "Dom" button); (8) the task screen during the first round with "Wróć" on both paths, and gone after a purchase; (9) an old save resuming in the house (`?e2eSave=v5-salon`: task screen, then the salon with its 4 tasks); compare against `designs/bystrow-space-base-v1/screenshots/choice-cards.png` and `previews/bridge-*.png`
- [human] Accept hiding the task-screen "Wróć" once something was bought in the first round, which narrows FR-043's literal "do końca pierwszej rundy" (decision P3: switching building would drop a purchase, and spent stars are never refunded)
- [human] Accept the Mostek costs 6/10/13/14/17/19/21 = 100 and the widened per-task cap (21, was 15) in `tests/roomsData.test.ts` (decision P4; S-17 tunes)
- [human] Accept the choice-screen layout, card labels under the pictures, the speaker place and the plain backdrop on a fresh install until the chosen room has loaded (DESIGN-GAP rows; decisions P5, P6)
- [human] On a real tablet, freshly installed and then offline: both cards draw on the choice screen, and after choosing Baza the Mostek pictures draw (precache)
- [reviewer] (CI at ship) Deploy job `build` of the merge sha prints `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in Deploy run 41232755289, job 124630170144: `Tests  4089 passed | 3 skipped (4092)`, `e2e hook: absent (2 chunks checked)`)

---

## Phase 9: The first-building choice in the browser — e2e (FR-042, FR-043, FR-044, FR-049; #12, #2, #16)

Driver: e2e
Driver why: the risk exists only in the rendered welcome flow, the boot routing of a stored save and the room taps (test-plan #12 first launch by touch, #2 save across versions, #16 purchase deducts once); built by phases 2-7, after the phase-8 seam sweep, contract `E2E=on`.

### Overview

One spec against the hook build modelled on `tests/e2e/first-launch.spec.ts` and `tests/e2e/rooms-as-data.spec.ts`.

### Changes Required:

#### 1. Spec

**File**: `tests/e2e/first-building-choice.spec.ts` (new); `playwright.config.ts` (add `first-building-choice` to the
`ROUND_SPEC` alternation, project `chromium-hook`; no other field)

**Contract**: tests (risk ids in titles), each in a fresh context:
- `#12 S-28 FR-042 child path: age, then the choice, then Baza starts the task screen in the base` — tap age 8 →
  `welcomeView 'choice'`, both `choices` targets present; tap `space` → `screen 'task'`, `house.id 'base-1'`,
  `currentRoom 'bridge'`, stars unchanged.
- `#12 S-28 FR-042 parent path: the child still chooses, Dom keeps the salon` — `passWelcomeAsParent` with
  `building: 'house'` → `house.id 'house-1'`, `currentRoom 'salon'`; no `choiceBack` on the parent path.
- `#12 S-28 FR-043 "Wróć" returns to the choice until the first round ends` — child path, choose Dom, tap `themeBack` →
  `welcomeView 'choice'`, choose Baza → base; play the first round to its end → `themeBack` null.
- `#2 S-28 FR-049 a v5 salon save resumes in the house with no choice screen` — `?e2eSave=v5-salon` → first screen
  `task` (never `welcome`), `house.id 'house-1'`, stars 17, salon `tasksDone 4`; the store log's `writtenVersion` equals
  `SAVE_VERSION` (6) after the first write.
- `#16 #2 S-28 FR-044 Mostek: the stage then a slot are bought once each; a reload resumes in Mostek without the choice`
  — `?e2eStars=40`, choose Baza, room switch → room `bridge`; buy the stage (stars 40 − 6), buy the console in a variant
  (− 10); reload → `screen 'task'`, room switch → `bridge` with `tasksDone 2` and the chosen variant.

### Success Criteria:

#### Automated Verification:

- Spec red before (deliberate breaks, each run alone with `-g`): make `WelcomeScene.start` skip the choice view → the FR-042 tests red; route a stored learner to the welcome in `BootScene` → the FR-049 test red; make `TaskScene` show "Wróć" without asking `themeBackOffered` → the FR-043 "gone after the first round" assert red; map `space` to `house-1` → the base asserts red; each restored; green after
- `npx playwright test tests/e2e/first-building-choice.spec.ts --list` lists 5 tests under `chromium-hook` only; spec green; full e2e (orchestrator, `--workers=4`) `179 + 5`; total equals `npx playwright test --list | tail -1`
- Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)

---

## Testing Strategy

### Unit Tests:

- `tests/themeBack.test.ts`: the back rule on both paths, after a round, after a purchase (phases 1, 7).
- `tests/saveV5.test.ts`, `tests/saveV6.test.ts`, `tests/fixtureLoadPath.test.ts`: frozen fixtures, the bump, `backup-v5`, FR-049 on the real load path (phases 1, 2, 4).
- `tests/house.test.ts`: `houseRoomIds`, `buildingStart` (phases 1, 4).
- `tests/buildingNeutral.test.ts`: FR-050 seed equality (phase 4).
- `tests/roomArt.test.ts`, `tests/roomsData.test.ts`, `tests/choiceArt.test.ts`, `tests/bootBudget.test.ts`: art, costs, budget (phases 3, 5).
- Wiring guards: `freshRoundWiring`, `houseWiring`, `welcomeChoiceWiring`, `themeBackWiring`; `layout` (phases 4, 6, 7).

### Integration Tests:

- Deploy smoke: `room pictures` 79 of 79, `choice pictures` 2 of 2 (proven at ship).
- e2e: phase-9 spec; first-launch spec rewired (phase 7); every welcome helper passes the choice (phase 6).

### Manual Testing Steps:

1. Fresh start, child path: age → choice → Baza → task; "Wróć" → choice; Dom → salon.
2. Parent path: gate, stage → choice → Baza; buy the Mostek stage; "Wróć" is gone.
3. Old save (`?e2eSave=v5-salon`): straight to the task screen in the house.
4. Tablet, installed, offline after one online launch: both paths draw their pictures.

## Performance Considerations

Fresh-install boot: task + UI + choice (about 107 KB) + font + boot sounds, no room (about 1.2 MB less than today's
salon boot). Returning players: unchanged; worst case stays the salon boot (`tests/bootBudget.test.ts`). Mostek 699 KB
loads at runtime from the precache during the first round.

## Migration Notes

v5 → v6 is a version bump (`MIGRATIONS[5]` identity, frozen). A v5 save keeps its house, rooms, stars and learner; the
first write after the migration copies the raw v5 save to `profile:default:backup-v5` (write-once). A rollback below the
v6 build meets `future`, shows `pl.saveFuture` and overwrites nothing (`deploy/README.md` § 6 note). Import of a v5 file
migrates through `decodeSave`.

## Known risks

- (plan review F8) A fresh install computes room health over `[]`, and the chosen room loads at runtime through the room
  loader, which "Obrazki" does not judge; a missing Mostek or salon picture in the first session shows only as a stand-in
  box and reaches "Obrazki" at the next launch, when `bootRoomArt` loads the room. Gap row "plain backdrop on a fresh
  install" covers the visible part; would change: a parent report of a blank first room.
- (plan review F4) Phase 6 skips the choice for a learner-less save with a purchase; such a child never sees the choice
  and keeps the house. Would change: the maintainer wanting those children asked too (then only with no room purchase lost).

## Autonomous decisions

Maintainer decisions (scope.md) and starting decisions D1-D10 (change.md) and R1-R7 (research) are kept; none is
overturned. Decided at this step (no `AskUserQuestion`; the skill's complexity and structure confirmations were decided
from the artifacts: HIGH complexity, 0 open product questions left after research, 9 phases):

- **P1 — the fixture is frozen in phase 1 from the v5 code and proven a genuine v5 write by decode + re-encode** on the
  unchanged code (`git diff` guard on `src/core/save.ts`), the rooms-as-data phase-1 pattern. Rejected: writing it in the
  bump phase (the oracle would be produced by the code under test). Would change: nothing.
- **P2 — the choice writes `house`/`rooms`/`currentRoom` before the learner, nothing before the tap** (D3/R3). Would
  change: a need to resume on the choice screen after closing the app.
- **P3 — the task-screen "Wróć" is hidden once any room task was bought** (research open question 1). Rejected: a refund
  (a second star source, against "stars only from rounds") and keeping the purchase across buildings (two buildings).
  This narrows FR-043's literal "do końca pierwszej rundy" → `[human]` row 8.7. Would change: the maintainer preferring
  the literal rule with a refund.
- **P4 — Mostek costs 6/10/13/14/17/19/21 = 100, the test cap widened to 21 as a test constant** (R6). Not a
  `balance.ts` number (scope: no balance change). `[human]` row 8.8. Would change: S-17 tuning or the maintainer keeping
  the 15 cap (then 94 within the cap, FR-044's "higher than the salon" fails at the 7th task).
- **P5 — fresh install boots no room** (R5); the welcome and the first task screen show the plain page backdrop until the
  chosen room arrives (`UIScene` `ensure`), DESIGN-GAP row. Rejected: booting the salon for every fresh install (the base
  child pays 1.2 MB for a building she may not pick; against the one-building NFR). Would change: the visual gate or a
  playtest finding the plain backdrop jarring (then boot the salon only for the welcome and accept the bytes).
- **P6 — the choice view is a second view of `WelcomeScene`** with a new `ChoiceCard` widget and the reused
  `SpeakerButton` (R3); "Rodzic" is hidden on the choice view (the stage is already decided on both paths); "Wróć" to the
  age only on the child path. Would change: the visual gate finding the missing back on the parent path confusing.
- **P7 — the theme back restarts the welcome with the placement as scene data** and re-runs `startLearning` (the
  warm-up/first-round answers of the abandoned building are dropped, as `backToAge` dropped them; the stage, a warm-up
  lowering and the parent override are kept). Would change: a playtest showing the child expects the warm-up result kept.
- **P8 — names**: `themeBackOffered`/`backToChoice`/`themeBack` replace the `ageBack*` names everywhere (the meaning
  changed); `BUILDING_CHOICES` ids `house`/`space` (the pack's `choices` keys). Would change: nothing.
- **P9 — "Obrazki" gets no choice-card line**; a card stand-in is a fallback record (`artFallbacks.choice`), like the
  house art (house-cross-section P4). Would change: the maintainer wanting runtime art judged in "Obrazki".
- **P10 — the load path repairs inside the current building** (`houseRoomIds` + the building's first room), research §1
  load-path rule. Would change: a building with no known room (then today's salon fallback stays).
- **P11 — FR-049 browser proof uses the in-memory seam `v5-salon`**; two real builds stay re-recorded (rooms-as-data
  follow-up 10, decision P-6 precedent). Would change: the maintainer asking for the two-build e2e.
- **P12 — phases**: nine (2 tdd, 6 impl, 1 e2e), at most two new UI components per phase (phase 6: `ChoiceCard`, the
  choice view); the e2e helpers move with the choice view (phase 6) and the first-launch spec with the back (phase 7) so
  every phase keeps the e2e suite at 179.

## References

- Research: `context/changes/first-building-choice/research.md`; identity and decisions: `context/changes/first-building-choice/change.md`; run scope: `context/runs/2026-10-31-space-base/scope.md`
- Format examples: `context/archive/2026-10-31-house-cross-section/plan.md`; save bump with frozen fixtures: `context/archive/2026-10-30-rooms-as-data/plan.md` (phases 1-3)
- Pack: `designs/bystrow-space-base-v1/manifest.json` (`rooms.bridge`, `choices`), `README.md`, `preview.html?view=choices`, `screenshots/choice-cards.png`, `previews/bridge-*.png`
- Code: `src/scenes/WelcomeScene.ts` (`create`, `choose`, `openParent`, `start`), `src/scenes/TaskScene.ts` (`renderAgeBack`, `backToAge`, `freshRound`), `src/scenes/BootScene.ts` (`preload` queuers, `create` health), `src/main.ts` (load path), `src/core/save.ts`, `src/core/placement.ts`, `src/core/house.ts`, `src/data/houses.ts`, `src/data/rooms.ts`, `src/data/roomArt.ts`, `src/ui/roomArtLoader.ts`, `src/testing/e2eHook.ts`, `vite/e2eHookGuard.mjs`, `scripts/make-task-art.mjs`, `scripts/check-deploy.ts`
- PRD: `context/foundation/prd.md` FR-042-FR-044, FR-049, FR-050, OQ 17; test plan `context/foundation/test-plan.md` risks #2, #12, #16

## Progress

> Convention: `- [ ]` pending, `- [x]` done. Append ` — <commit sha>` when a step lands. Do not rename step titles. See `references/progress-format.md`.

### Phase 1: The frozen v5 salon save and the pure building rules

#### Automated

- [x] 1.1 `npx vitest run tests/themeBack.test.ts tests/house.test.ts tests/saveV5.test.ts tests/fixtureLoadPath.test.ts` green; the new cases red before the code/fixture exist; unit `<branch unit baseline> + N` — 9b537e7
- [x] 1.2 Deliberate break: drop the `tasksDone` term from `themeBackOffered` → the "room with a purchase" case red; decode a scratch copy of the fixture with `house` removed → the `ok`/`saveProblem` case red (the fixture is the v5 shape, not v4); each restored; meta-check: the fixture is proven a genuine v5 write by decode + re-encode on the unchanged v5 code, never by the v6 migration under test — 9b537e7
- [x] 1.3 `git diff --stat fc13e8c -- src/core/save.ts src/core/migrations src/data tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4*.json tests/fixtures/save-v5.json public` empty (v5 code unchanged while the fixture is frozen) — 9b537e7
- [x] 1.4 Full local gate green (lint, typecheck, unit + deploy/ops tests + `sample` E1-E6, build prints `e2e hook: absent (`); e2e (orchestrator, `--workers=4`) `179 + 0` (e2e: not run, no UI change, orchestrator gates it) — 9b537e7

### Phase 2: Save format v6 (version bump)

#### Automated

- [x] 2.1 `tests/saveV6.test.ts` red against v5 (no `MIGRATIONS[5]`), green after; unit `<phase-1 count> + N` (unit 4107 + 9 = 4116) — da7bccc
- [x] 2.2 Deliberate break: make `LIFT_V5_BUILDING` call `copyHouse` on the house → the source guard red; make it drop `house` → the deep-equal case red; leave `SAVE_VERSION` at 5 with `MIGRATIONS[5]` present → the version pin and `fixtureLoadPath` "writes v6" red; each restored; meta-check: the v5 oracle is the phase-1 fixture proven by v5 code, the v6 oracle a literal spread of that file, neither computed by the migration — da7bccc
- [x] 2.3 `git diff <phase-1 sha> -- tests/fixtures/save-v1*.json tests/fixtures/save-v2*.json tests/fixtures/save-v3.json tests/fixtures/save-v4*.json tests/fixtures/save-v5*.json src/core/migrations/house.ts src/core/migrations/legacySalon.ts` empty — da7bccc
- [x] 2.4 `git diff --stat <phase-1 sha> -- deploy/` shows `deploy/README.md` only — da7bccc
- [x] 2.5 Full local gate green; e2e (orchestrator, `--workers=4`) `179 + 0` (`save-migration.spec.ts` follows `SAVE_VERSION`) (e2e: not run, no UI change; orchestrator gates it) — da7bccc

#### Manual

- [ ] 2.6 [human] Read the v6 rollback note in `deploy/README.md` § 6: a Deploy rollback below this build shows existing players the "nowszy zapis" card until the roll-forward (accepted in scope.md; this row confirms the wording)

### Phase 3: Mostek art and room data

#### Automated

- [x] 3.1 `npm run art` regenerates the files; `git status --short public/assets` shows only `public/assets/rooms/bridge/` — 5628349
- [x] 3.2 `npx vitest run tests/roomArt.test.ts tests/roomsData.test.ts tests/bootBudget.test.ts tests/deployCheck.test.ts` green; unit `<phase-2 count> + N` (4116 + 4 = 4120) — 5628349
- [x] 3.3 Deliberate break: rename one bridge WebP → the room-art fixture/file case red; set the console cost to 9 → the "above the salon" case red; each restored; meta-check: the cost oracle is the literal list written from FR-044, the art oracle the pack manifest sizes — 5628349
- [x] 3.4 `npm run build` then `grep -o "assets/rooms/bridge/" dist/sw.js | wc -l` = 21 (sw.js is one line, so `grep -c` would print 1) — 5628349
- [x] 3.5 `git diff --stat <phase-2 sha> -- public/assets/rooms/salon public/assets/rooms/kitchen src/data/balance.ts src/data/curriculum src/core src/scenes src/main.ts` empty — 5628349
- [x] 3.6 Full local gate green; e2e (orchestrator, `--workers=4`) `179 + 0` (e2e: not run, no UI change; orchestrator gates it) — 5628349

#### Manual

- [ ] 3.7 [reviewer] Polish copy read as a primary-school teacher would (profile § 2 content rule): Mostek task labels, slot and variant names (gender agreement, accusative after the verb); `npm run sample -- E1 --count 6` output unchanged (no task data touched)
- [ ] 3.8 [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers room pictures — 79 of 79 room pictures precached` (format seen in Deploy run 41232755289, job 124630959484: `ok   precache covers room pictures — 58 of 58 room pictures precached`)

### Phase 4: The base building as data, the load path and the FR-049/FR-050 proofs

#### Automated

- [x] 4.1 New and changed tests green; unit `<phase-3 count> + N` — 930363a
- [x] 4.2 Deliberate break: map `space` to `house-1` in `BUILDING_CHOICES` → the `buildingStart` literal case red; pass `Object.keys(ROOMS)` and `FIRST_ROOM` again in `main.ts` → the load-path guard and the "salon inside base-1 repairs to bridge" case red; make `freshRound` read `REGISTRY_KEYS.currentRoom` → the wiring guard red; each restored; meta-check: FR-050's deep-equal proves the round inputs carry no building and the guard proves the scene passes none; the browser path is phase 9 — 930363a
- [x] 4.3 `npm run build` prints `e2e hook: absent (` (the `v5-salon` marker is not in `dist/`) — 930363a
- [x] 4.4 `git diff --stat <phase-3 sha> -- src/core/save.ts src/core/migrations src/data/balance.ts src/data/curriculum src/data/minigames.ts src/scenes/HouseScene.ts` empty — 930363a
- [x] 4.5 Full local gate green; e2e (orchestrator, `--workers=4`) `179 + 0` (e2e not run by this step; the orchestrator gates it) — 930363a

### Phase 5: Fresh-install boot and the choice-card art

#### Automated

- [ ] 5.1 `npm run art` regenerates the 2 files; `git status --short public/assets` shows only `public/assets/choice/`
- [ ] 5.2 `npx vitest run tests/choiceArt.test.ts tests/bootBudget.test.ts tests/artHealth.test.ts tests/deployCheck.test.ts` green; unit `<phase-4 count> + N`
- [ ] 5.3 Deliberate break: make `bootGroups(true)` include `'room'` → its literal case red; delete `choice-space.webp` → the file case red; each restored; meta-check: the boot proof is the pure group list plus the build; the browser proof that the welcome shows the cards is phase 9
- [ ] 5.4 `npm run build` then `grep -o "assets/choice/" dist/sw.js | wc -l` = 2
- [ ] 5.5 `git diff --stat <phase-4 sha> -- src/ui/roomArtLoader.ts src/data/balance.ts public/assets/rooms public/assets/ui public/assets/tasks` empty
- [ ] 5.6 Full local gate green; e2e (orchestrator, `--workers=4`) `179 + 0`

#### Manual

- [ ] 5.7 [reviewer] (CI at ship) Deploy job `deploy`, step `Smoke check (deploy)` of the merge sha prints `ok   precache covers choice pictures — 2 of 2 choice pictures precached` (format seen in Deploy run 41232755289, job 124630959484: `ok   precache covers house pictures — 3 of 3 house pictures precached`)

### Phase 6: The choice view

#### Automated

- [ ] 6.1 `npx vitest run tests/layout.test.ts tests/welcomeChoiceWiring.test.ts` green; unit `<phase-5 count> + N`
- [ ] 6.2 Deliberate break: set the learner before the house in the card tap → the order guard red; move `WELCOME_LAYOUT.choice.speaker` onto a card → the overlap case red; drop the `hasPurchase` guard → its wiring case red; each restored; meta-check: the guards prove wiring only; phase 9 proves the browser path
- [ ] 6.3 `npm run build` prints `e2e hook: absent (`
- [ ] 6.4 `git diff --stat <phase-5 sha> -- src/core/save.ts src/data/balance.ts src/scenes/BootScene.ts src/scenes/RoomScene.ts` empty
- [ ] 6.5 Full local gate green; full e2e (orchestrator, `--workers=4`) `179 + 0` with every welcome helper passing the choice; total equals `npx playwright test --list | tail -1`

### Phase 7: "Wróć" from the task screen to the choice

#### Automated

- [ ] 7.1 `npx vitest run tests/themeBack.test.ts tests/themeBackWiring.test.ts tests/layout.test.ts` green; unit `<phase-6 count> − (folded ageBack cases) + N`
- [ ] 7.2 `grep -rn "ageBack" src tests` empty
- [ ] 7.3 Deliberate break: start the welcome without `{ placed }` → the wiring guard red; call `themeBackOffered` without the rooms → the guard red; each restored; meta-check: source guards prove wiring; first-launch and phase 9 prove the browser
- [ ] 7.4 `npx playwright test tests/e2e/first-launch.spec.ts` green (orchestrator; sandbox disabled)
- [ ] 7.5 Full local gate green; full e2e (orchestrator, `--workers=4`) `179 + 0`; total equals `npx playwright test --list | tail -1`

### Phase 8: Docs, gap rows, follow-ups, seam sweep and the visual pass

#### Automated

- [ ] 8.1 `bash .claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh` PASS; `grep -nE "buildingStart|CHOICE_ART|themeBackOffered|SAVE_VERSION. 6|v5-salon" CLAUDE.md` present
- [ ] 8.2 `grep -c "Trigger:" context/changes/first-building-choice/follow-ups/review-fixes.md` ≥ 8; `grep -cE "^\| (19[1-9]|20[0-9]) " docs/design-gaps.md` ≥ 7
- [ ] 8.3 Seam sweep: `grep -rn "ageBack\|backToAge" src tests CLAUDE.md` empty; `grep -rn "'space'" src` only in `src/data/houses.ts`, `src/data/choiceArt.ts`, `src/core/types.ts` and the hook (`'house'` is not grepped: `HouseScene`, `artHealth`, `artPick`, `celebration` and `save.ts` already use it for other meanings)
- [ ] 8.4 `git diff --stat <phase-7 sha> -- src/data/balance.ts src/data/curriculum src/core/save.ts tests/fixtures public` empty
- [ ] 8.5 Full local gate green; e2e (orchestrator, `--workers=4`) `179 + 0`

#### Manual

- [ ] 8.6 [visual] Hook build on 4399, desktop 1440 and tablet 1024 (landscape 1024×768), each frame named in `reviews/visual-review.md`: (1) the choice view on the child path (with "Wróć") and (2) on the parent path (no "Wróć"), both with the speaker when a voice exists; (3) the choice view under `?e2eArt=choice` (both card stand-ins); (4) Mostek before (stage not bought) and (5) after the stage; (6) a family — one slot in each of natural, sunny, mint (variant panel open); (7) the room-done card for Mostek (one tile, no teaser, "Dalej" stays in Mostek, no "Dom" button); (8) the task screen during the first round with "Wróć" on both paths, and gone after a purchase; (9) an old save resuming in the house (`?e2eSave=v5-salon`: task screen, then the salon with its 4 tasks); compare against `designs/bystrow-space-base-v1/screenshots/choice-cards.png` and `previews/bridge-*.png`
- [ ] 8.7 [human] Accept hiding the task-screen "Wróć" once something was bought in the first round, which narrows FR-043's literal "do końca pierwszej rundy" (decision P3: switching building would drop a purchase, and spent stars are never refunded)
- [ ] 8.8 [human] Accept the Mostek costs 6/10/13/14/17/19/21 = 100 and the widened per-task cap (21, was 15) in `tests/roomsData.test.ts` (decision P4; S-17 tunes)
- [ ] 8.9 [human] Accept the choice-screen layout, card labels under the pictures, the speaker place and the plain backdrop on a fresh install until the chosen room has loaded (DESIGN-GAP rows; decisions P5, P6)
- [ ] 8.10 [human] On a real tablet, freshly installed and then offline: both cards draw on the choice screen, and after choosing Baza the Mostek pictures draw (precache)
- [ ] 8.11 [reviewer] (CI at ship) Deploy job `build` of the merge sha prints `Tests +[0-9]+ passed` and `e2e hook: absent \(` (as seen in Deploy run 41232755289, job 124630170144: `Tests  4089 passed | 3 skipped (4092)`, `e2e hook: absent (2 chunks checked)`)

### Phase 9: The first-building choice in the browser — e2e (FR-042, FR-043, FR-044, FR-049; #12, #2, #16)

#### Automated

- [ ] 9.1 Spec red before (deliberate breaks, each run alone with `-g`): make `WelcomeScene.start` skip the choice view → the FR-042 tests red; route a stored learner to the welcome in `BootScene` → the FR-049 test red; make `TaskScene` show "Wróć" without asking `themeBackOffered` → the FR-043 "gone after the first round" assert red; map `space` to `house-1` → the base asserts red; each restored; green after
- [ ] 9.2 `npx playwright test tests/e2e/first-building-choice.spec.ts --list` lists 5 tests under `chromium-hook` only; spec green; full e2e (orchestrator, `--workers=4`) `179 + 5`; total equals `npx playwright test --list | tail -1`
- [ ] 9.3 Full local gate green (lint, typecheck, unit, build `e2e hook: absent (`)
