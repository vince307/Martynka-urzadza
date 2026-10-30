---
date: 2026-10-30T21:11:30+01:00
researcher: Claude (autonomous run 2026-10-30-rooms-kitchen, research step)
git_commit: 5a49a7139fe24819afb920226847c5950ecf084e
branch: feat/rooms-as-data
repository: Martynka-urzadza
topic: "F-04 rooms-as-data: the v5 save shape (house + floor x place grid), the v4 -> v5 migration, and what a room-as-data API must expose so S-22 adds the kitchen with data and files only"
tags: [research, save-format, migrations, rooms, room-art, art-script, room-done-card, RoomScene, F-04]
status: complete
last_updated: 2026-10-30
last_updated_by: Claude (autonomous run, research step)
---

# Research: rooms and the house as data, save format v5

**Date**: 2026-10-30T21:11:30+01:00
**Researcher**: Claude (autonomous run 2026-10-30-rooms-kitchen)
**Git Commit**: 5a49a7139fe24819afb920226847c5950ecf084e
**Branch**: feat/rooms-as-data
**Repository**: Martynka-urzadza

## Research Question

Derived from `context/changes/rooms-as-data/change.md` (no interview, unattended run): (a) the exact v5 shape of the
house and its floor x place grid, saved versus game data; (b) street/district in v5 or not (roadmap F-04 unknown);
(c) how `MIGRATIONS[4]` lifts v4 losslessly, including a v4 save whose room is unknown (`living`), and the `backup-v4`
copy; (d) where the salon-only code lives (art table, art script, done card, room switching, `RoomScene`) and what a
"room as data" API must expose so S-22 adds the kitchen with `src/data/`, the art-script table and assets only;
(e) design bounds (views, copy, gaps). Scope decisions fixed by the maintainer are in
`context/runs/2026-10-30-rooms-kitchen/scope.md` and are not re-opened here.

Lessons file: `context/foundation/lessons.md` does not exist; none applied.

## Summary

1. **The v4 save is already multi-room.** `SessionSave` and `SaveV4` (`src/core/save.ts`, `src/core/types.ts`) hold
   `rooms: Record<string, RoomState>` plus `currentRoom`; `saveProblem` accepts any room id and only requires
   `currentRoom` to be a key of `rooms`. v5 therefore adds the house only; the room map and `currentRoom` stay where
   they are (every consumer of `session.rooms` keeps working: `RoomScene.resolve`, `TaskScene.nextRoomTaskCost`,
   `SalonBackdrop.render`, `saveSummary`, `roomStateProblems`, `roomGrowth`, `repairCurrentRoom`).
2. **Recommended v5 shape** (details in "Save format v5"): `SaveV5 = SaveV4 + { version: 5; house: { id: string;
   rooms: { room: string; floor: number; place: number }[] } }`. The list order is the opening order (FR-033
   "kolejność pokoi jest danymi domu"); `floor`/`place` is the grid cell (FR-038). Game data (`HOUSES` in
   `src/data/`) is the authority for a house the build knows; the saved copy is the record of the child's house and
   keeps a house or room the build does not know (the same "keep, never drop" rule as unknown rooms today).
3. **No street/district in v5 (D1 confirmed).** No code of this run reads one (S-26/S-27 are `proposed`/blocked in
   `context/foundation/roadmap.md`), and a further save change is already unavoidable before the street: S-24
   (residents) must save the album sticker and the "inhabited" state (PRD FR-034, FR-041), so a street field now would
   not save a migration.
4. **`MIGRATIONS[4]`** is a pure step with a frozen table (pattern of `MIGRATIONS[3]` and
   `src/core/migrations/legacySalon.ts`): `{ ...raw, version: 5, house: FROZEN_HOUSE_V5 }`, never reading live data;
   `rooms`, `currentRoom`, `stars`, learner and variants pass through byte-for-byte, so a v4 save with the unknown
   room `living` (`tests/fixtures/save-v4.json`) keeps it unchanged. `backup-v4` needs no new mechanism: the backup key
   is `${key}:backup-v${from}` (`src/storage/idb.ts`, `backup`) and `readBackups` loops `from < SAVE_VERSION`.
5. **Salon-only code that blocks "a room is data + files"** (exact list in "Salon assumptions"): the art table
   `SALON_ART`/`ROOM_ART` and `SCENE_FILES` (`src/data/roomArt.ts`), the art script `scripts/make-task-art.mjs`
   (`SALON_V2`, `ROOM_JOBS`, `BOARD_JOBS`), the single room name `pl.room.name`, the single thumbnail
   `UI_ART_KEYS.salonAfter` in `RoomDoneCard.drawRoomTile`, the list `ROOM_ORDER` with its teaser, and the
   `FIRST_ROOM` fallbacks. A real bug for two rooms: `RoomDoneCard.show` draws EVERY room tile from the current
   room and state (`this.drawRoomTile(left, room, state, item.done)`), so a second room tile would show the wrong room.
6. **Nothing moves the child to the next room.** `REGISTRY_KEYS.currentRoom` is written only at load (`src/main.ts`,
   `repairCurrentRoom` / `freshSession`); no scene changes it. FR-033/FR-039 need one pure rule ("the room in
   renovation is the first room of the house order that the build knows and that is not done"), applied at load and
   after "Dalej" on the done card. It can be tested on synthetic rooms (`tests/rooms.test.ts` already builds a
   synthetic `RoomDef`), so D2 (no kitchen in F-04) holds.
7. **The kitchen pack differs from the salon pack in ways the art script must accept as data**: other scene file
   names (`assets/room/kitchen-before.png` vs `architecture-before.png`), a cream background (sampled `#FFF5DF` at
   three points; the salon is the green board that `recolour-board.py` recolours, so board recolouring must be a
   per-room flag), no decor, no worn list, empty `shadowEllipses`, no thumbnail file, and a different manifest schema
   (`rooms.kitchen.slots[]` with `targetRect`/`sourceSceneRect` vs the salon's `slots{}` with `taskCost`).

## Detailed Findings

### Save format today (v4) and the migration chain

- `SAVE_VERSION = 4`, `MIGRATIONS` 1 -> 2 (variants), 2 -> 3 (`LIFT_V2_SALON`, frozen salon tables), 3 -> 4
  (`generation: 0, writer: ''`) — `src/core/save.ts` (`MIGRATIONS`). The header comment of `src/core/save.ts` states
  the rule: a shape change adds a version, a migration step and a frozen fixture, never edits an older fixture.
- `saveProblem` checks top-level keys in a fixed order and returns the first broken one (`version`, `profileId`,
  `stars`, `rooms`, `currentRoom`, `settings`, `learner`, `variants`, `generation`, `writer`); the name goes to the
  `Kod:` line as `corrupt/<field>` (save-truth). A v5 `house` check is one more line there, named `house`.
- `decodeSave` runs `from .. SAVE_VERSION-1` steps, catches a throwing step as `migration-failed` with `step`, and
  special-cases step 2 only to collect the `salonCarried` note (`carryV2Salon`). A v5 step needs no note (lossless).
- `encodeSave` / `toSession` copy field by field (`copyRooms`, `copyVariants`, `savedLearner`): a new `house` field
  needs a `copyHouse` in both, or it is silently dropped on write.
- `freshSession(firstRoom, stars)` builds `rooms: { [firstRoom]: empty }`; for v5 it needs the house (the caller
  passes data, since core does not import data — the comment on `freshSession` already says so).
- `importProblem` replays the same steps for an import preview; nothing salon-specific.
- Fixtures: `tests/fixtures/save-v1.json`, `save-v1-fresh.json`, `save-v1-legacy-salon.json`, `save-v2.json`,
  `save-v2-fresh.json`, `save-v2-legacy-salon.json`, `save-v3.json`, `save-v4.json` (8 files, listed by
  `tests/fixtureLoadPath.test.ts` `FIXTURES`). `save-v4.json` holds `rooms.living` and `currentRoom: 'living'`, i.e.
  no salon. No fixture holds a v4 salon with the stage done and non-zero variants — the scope's "frozen v4 fixture"
  needs a NEW file (proposed name `tests/fixtures/save-v4-salon.json`).
- Tests pinned to v4 that a v5 build must update rather than break: `tests/saveV4.test.ts` (`expect(SAVE_VERSION).toBe(4)`;
  "save-v4.json decodes with migratedFrom null"); `tests/fixtureLoadPath.test.ts` `FIXTURES`. The v3 -> v4 test keeps
  its meaning by asserting on `MIGRATIONS[3]` directly (it already does: `lifted` from `MIGRATIONS[3]`).

### Backup copy (`backup-v4`)

- `src/storage/idb.ts` `backup(raw, from)` writes `${key}:backup-v${from}` through `putBackupOnce` (write-once since
  save-truth) and records `${key}:backup-status`; `readBackups` loops `from = 1 .. SAVE_VERSION - 1`.
- `src/core/autosave.ts` passes `options.migrated.from` = the raw version read (`src/main.ts` `migrated: { from:
  outcome.migratedFrom, raw: outcome.raw }`). Inference from these two paths: with `SAVE_VERSION = 5`, a device holding
  v4 gets `backup-v4`, a device still on v3 gets `backup-v3` (the raw read version, as today), and `readBackups` lists
  `backup-v4`; no code change is needed for the copy itself. Tests must prove it (scope); `tests/autosave.test.ts`
  already drives `migrated: { from: 1, ... }` and can do the same with `from: 4`.
- `src/core/saveHealth.ts` `migrationOf` is version-generic (`from` from the status or the stored record).
- Rollback: `deploy/README.md` carries one note per format bump (v3, v4: the `pl.saveFuture` card, nothing
  overwritten). v5 needs the same docs-only note (allowed to ship, profile § 5) and a `[human]` row.

### Save format v5 — recommended shape and rules

```ts
// src/core/types.ts
export interface HouseRoomPlace { room: string; floor: number; place: number }   // floor 0 = ground floor, place 0 = left
export interface HouseState { id: string; rooms: HouseRoomPlace[] }               // list order = opening order
export interface SaveV5 extends Omit<SaveV4, 'version'> { version: 5; house: HouseState }
export type SaveState = SaveV5;
// src/core/save.ts SessionSave gains `house: HouseState`
```

- Why the house keeps `rooms`/`currentRoom` at top level and does not nest the room states: nesting moves every
  consumer listed in Summary 1 and makes the migration non-trivial; room ids are already globally unique (the kitchen
  pack prefixes slot ids `kitchen-`, and the room id `kitchen` differs from `salon`). The street (S-26) will need a
  further version anyway (Summary 3).
- Data side (game data, `src/data/`): `HouseDef { id; rooms: { room; floor; place }[]; closed?: { floor; place }[] }`
  (closed cells = the brief's "komórka zamknięta" on floor 1 right, a separate layer in S-23) and `HOUSES`,
  `FIRST_HOUSE`. House 1 per `docs/designer-brief-m03.md` "Układ domów": salon (0,0), kitchen (0,1), kids' room (1,0),
  closed (1,1). A room listed in the house but absent from `ROOMS` is a "Wkrótce" cell — that replaces the
  hand-written teaser entry of `ROOM_ORDER`.
- Which wins on load: the data's house for a known `house.id` (FR-038 "piętra są danymi domu"); a saved room absent
  from the data's house is kept in the saved copy (never dropped) and reported like `roomStateProblems` does (report
  only, no repair — save-truth rule). An unknown `house.id` falls back to `FIRST_HOUSE` the way `repairCurrentRoom`
  falls back to `FIRST_ROOM`, keeping the saved value. `encodeSave` writes the session's house.
- `saveProblem('house')`: record with string `id` and an array of `{ room: string; floor: count; place: count }`.
  Recommend NOT rejecting duplicates or unknown ids (a stricter check turns a recoverable save into the error card;
  SV2-13 "one bad field rejects the whole save" is a known follow-up for the `variants` block).
- `MIGRATIONS[4]`: `(raw) => ({ ...raw, version: 5, house: { id: 'house-1', rooms: [ { room: 'salon', floor: 0,
  place: 0 }, { room: 'kitchen', floor: 0, place: 1 }, { room: 'kids-room', floor: 1, place: 0 } ] } })` with the table
  FROZEN in a migration module (like `LEGACY_SALON_V2`), never imported from `src/data/` (core must not import data;
  `eslint.config.mjs` boundary rules). Whether the frozen table lists only `salon` or the whole house 1 is a plan
  choice; listing the brief's layout is harmless (ids are strings; data wins on load) and makes an exported v5 file
  self-describing. Room ids `kitchen`/`kids-room` must then be the ids S-22/S-25 use (decide in the plan, record).
- PRD contradiction to record: FR-038 says the floors are house DATA; scope.md fixes that the SAVE carries the grid.
  Resolution above: data is the authority, the save carries the child's copy. Neither text is overridden.

### Salon assumptions in the code (PRD Open Question 14) — data vs leave

| place (file, symbol) | today | take |
|---|---|---|
| `src/data/roomArt.ts` `SALON_ART`, `ROOM_ART`, `SCENE_FILES`, url `assets/rooms/salon/...` | table built from `SALON` alone; scene file names global (`architecture-before` ...) | **data**: build `ROOM_ART` from every room in `ROOMS`; scene file names per room (kitchen: `kitchen-before`, `kitchen-after`, `kitchen-shadows`); folder = room id. `tests/roomArt.test.ts` asserts 37 entries and `SALON` keys — generalise to "every key of every room" |
| `scripts/make-task-art.mjs` `SALON_V2`, `ROOM_JOBS`, `sceneFiles`, `furniture`, `BOARD_JOBS` | one pack, one folder, hard-coded file lists, board recolour keyed by file id | **data (script table)**: a list of room packs `{ room, pack dir, scene files, furniture files, recolourBoard: boolean }`; the kitchen row S-22 adds. The kitchen background is cream (no board): `recolour-board.py` would refuse (mask outside 5–30 %), so recolouring must be per room |
| `src/data/rooms.ts` `ROOM_ORDER` (salon + teaser `unlockAfter: 'salon'`) | hand-written list for the done card | **data**: derive the list from the house (`HOUSES`); keep today's visible card (salon + one "Wkrótce") by listing rooms up to and including the first one the build does not have |
| `src/data/rooms.ts` `FIRST_ROOM`, used by `main.ts`, `RoomScene.resolve`, `TaskScene.nextRoomTaskCost`, `SalonBackdrop.render`, `UIScene` reset, `e2eHook` | fallback room | **keep** as fallback, derive from `FIRST_HOUSE.rooms[0]` |
| `RoomDoneCard.show` -> `drawRoomTile(left, room, state, item.done)` | every room tile drawn from the CURRENT room/state | **fix** (bug for two rooms): pass `ROOMS[item.id]` and `rooms[item.id]` per tile |
| `RoomDoneCard.drawRoomTile` caption `pl.room.name` ("Salon") | one name for all rooms | **data**: per-room name `pl.room.names[id]` (copy stays in `pl.ts`; the kitchen manifest `label` "Kuchnia" is the source for S-22). `RoomListItem.nameKey` already carries the id |
| `RoomDoneCard.drawRoomTile` thumbnail `UI_ART_KEYS.salonAfter`; `miniatureMode(..., thumbnailKey)` in `src/core/artPick.ts` | one thumbnail for any room | **data**: optional per-room thumbnail key on `RoomDef` (follow-up G-3); no thumbnail -> `live` or `drawn`. The kitchen pack has no thumbnail file (`designs/martynka-locations-v2/assets/` holds `furniture`, `icons`, `room` only) -> DESIGN-GAP |
| `RoomDef.name: 'salon'` (lowercase, read by `UIScene` `roomName` for `pl.saveTransfer.room`) | player text in room data | **align**: name through `pl.ts` like the caption, so one name source per room |
| `pl.settings.roomMismatch`, `pl.saveTransfer.roomMismatch` ("Stan salonu ...") | salon named in a parent line | **copy**: room-neutral or naming the room; agent wording -> DESIGN-GAP row |
| `pl.settings.salonCarried` (v2 -> v3 note) | still correct | **leave** |
| `src/core/migrations/legacySalon.ts` | frozen history of the v2 -> v3 step | **leave** (frozen by design) |
| `RoomDef.worn`, `contactShadows`, `decor`, `formerTaskCounts` | already per room | **leave**; `wornPieces`/`contactShadowPieces`/`miniaturePieces`/`RoomView.render` iterate arrays, so `worn: []`, `decor: []`, `contactShadows: []` render a before state of background + shadows only (inspected paths: `RoomView.render` `room.decor.forEach`, `buildWorn`, `miniaturePieces`) |
| `ROOM_LAYOUT.worn` grade numbers, `ROOM_LAYOUT.contactShadow` | global | **leave** (one house style) |
| `SalonBackdrop` (name), `BackdropMode 'salon'` in `src/core/backdrop.ts` | renders `currentRoom` already | **leave** (rename optional, not needed) |
| `UI_ART` `salonAfter`, `scripts/make-icons.mjs`, `scripts/copy-sounds.mjs` read `designs/martynka-salon-v2` | app icons, sounds, UI pictures come from the salon pack | **leave** (not room content) |
| `MINIGAME_WORDS` (salon captions) | fixed word list | **leave** |
| `scripts/check-deploy.ts` `precacheCovers('room pictures', ..., ROOM_ART...)`, `tests/bootBudget.test.ts` | read `ROOM_ART` | generic once `ROOM_ART` covers every room; S-22 measures the kitchen (scope) |

### Room switching (FR-033 "one room in renovation", FR-039)

- `src/main.ts` load path: `repairCurrentRoom(session, Object.keys(ROOMS), FIRST_ROOM)`, then `roomStateProblems`,
  `roomGrowth`; first launch `freshSession(FIRST_ROOM, ...)`. No other writer of `currentRoom` (searched `src/` for
  `REGISTRY_KEYS.currentRoom` writes: `main.ts` only).
- `RoomScene.dispatch`: on the last purchase `roomDone` sets `this.card = true`; the card's "Dalej" callback only hides
  the card and redraws (`RoomDoneCard` constructor callback in `RoomScene.create`). After a finished room the scene
  offers "Zmień wygląd"/"Gotowe" (`modeButton`) for free changes.
- Recommended pure API (core, no data import), tested with synthetic rooms:
  `roomInRenovation(house: HouseState, catalogue: Record<string, RoomDef>, states: Record<string, RoomState>): string | null`
  = first room of `house.rooms` present in `catalogue` and not `roomDone`; `null` = every known room done.
  `nextCurrentRoom(...)` = `roomInRenovation(...) ?? current` (a finished house keeps the last room for free changes,
  FR-034). Applied at load (a child who finished the salon on an older build meets the kitchen at once in S-22) and
  after "Dalej" (S-22 wires the scene; F-04 may wire load only, keeping the visible flow unchanged with one room).
  Moving adds `emptyRoomState()` for the new room so `saveProblem('currentRoom')` holds.
- Interaction with `repairCurrentRoom`: run repair first (unknown id -> first room), then the renovation rule.

### Room-as-data API S-22 needs (inventory of the kitchen pack)

`designs/martynka-locations-v2/manifest.json` `rooms.kitchen`: `label: "Kuchnia"`, `backgroundBefore`/`backgroundAfter`/
`shadows` (`assets/room/kitchen-*.png`), 6 slots `kitchen-counter` (z 20), `kitchen-fridge` (25), `kitchen-table` (40),
`kitchen-coffee` (45), `kitchen-bench` (18), `kitchen-rack` (10), each with 3 variants `-natural`/`-sunny`/`-mint`
(families "Naturalny"/"Słoneczny"/"Miętowy"), `x, y, width, height, z, anchor, visibleRect` (same geometry fields as
`PlacedArt`), `shadowEllipses: []`, no decor, no worn list, no `taskCost`. So adding the kitchen needs, all data:
a `RoomDef` (scene keys, `slots`, `decor: []`, `worn: []`, `contactShadows: []`, `tasks` with 5–15 costs per scope),
`pl.room.slots/variants/tasks` keys, a name, the room in `HOUSES`, a row in the art-script room table, a per-room scene
file map in `roomArt.ts`. With the F-04 changes above, no scene or widget code changes for the kitchen except the
celebration (FR-040, S-22 by D3).

### Design bounds

- No new screen in F-04 (change.md "Design kit views"). The kit has no "Pokój gotowy!" view (gaps 37–41). Copy source
  `src/data/pl.ts`; new parent/child wording by the agent gets a DESIGN-GAP row; next free row is 175
  (`docs/design-gaps.md` ends at 174).
- DESIGN-GAP candidates: (175) per-room name on the done card tile and in the save lines (wording "Kuchnia" from the
  pack label is kit copy, not a gap; the neutral mismatch line is agent wording); (176) a room without a pack
  thumbnail on the done card (live miniature, else drawn); (S-22) the kitchen's cream background next to the salon's
  `#BCD799` board — the brief's P3 order ("salon na kremowym tle") suggests the house moves to cream; not an F-04 matter.

## Code References

- `src/core/save.ts` — `SAVE_VERSION`, `SessionSave`, `MIGRATIONS`, `saveProblem`, `importProblem`, `encodeSave`, `toSession`, `decodeSave`, `freshSession`
- `src/core/types.ts` — `RoomDef`, `RoomListEntry`, `RoomState`, `SaveV4`, `SaveState`
- `src/core/migrations/legacySalon.ts` — `LIFT_V2_SALON`, `carryV2Salon` (frozen-table pattern)
- `src/core/rooms.ts` — `roomDone`, `roomsListView`, `repairCurrentRoom`, `roomStateProblems`, `roomGrowth`, `wornPieces`, `contactShadowPieces`
- `src/core/artPick.ts` — `miniatureMode` (single `thumbnailKey`)
- `src/data/rooms.ts` — `SALON`, `ROOMS`, `FIRST_ROOM`, `ROOM_ORDER`
- `src/data/roomArt.ts` — `SCENE_FILES`, `SALON_ART`, `ROOM_ART`
- `src/data/uiArt.ts` — `salonAfter`
- `src/data/pl.ts` — `pl.room.name`, `pl.settings.roomMismatch`, `pl.saveTransfer.roomMismatch`, `roomText`
- `src/ui/widgets/RoomDoneCard.ts` — `show`, `drawRoomTile`
- `src/ui/widgets/RoomView.ts` — `render`, `miniaturePieces`, `drawRoomMiniature`
- `src/scenes/RoomScene.ts` — `resolve`, `dispatch`, `showCard`, `listItems`
- `src/scenes/TaskScene.ts` — `nextRoomTaskCost`; `src/ui/widgets/SalonBackdrop.ts` — `render`
- `src/main.ts` — load path (`repairCurrentRoom`, `freshSession`, `migrated`)
- `src/storage/idb.ts` — `backup`, `putBackupOnce`, `readBackups`
- `scripts/make-task-art.mjs` — `SALON_V2`, `ROOM_JOBS`, `BOARD_JOBS`; `scripts/check-deploy.ts` — room pictures
- `tests/saveV4.test.ts`, `tests/fixtureLoadPath.test.ts`, `tests/roomArt.test.ts`, `tests/rooms.test.ts`, `tests/bootBudget.test.ts`

## Architecture Insights

- Save evolution pattern: one-way versions, pure `MIGRATIONS[n]` with frozen tables, strict `saveProblem` naming the
  first broken key, field-by-field copy in `encodeSave`/`toSession`, frozen fixtures per version, write-once
  `backup-v<from>`. v5 fits it with one step, one check line, one copy function, two fixtures (v4 salon, v5).
- "Report, never repair" (save-truth): unknown rooms and mismatches are kept and reported; the house follows that.
- Core never imports data: the house layout reaches core through parameters, like `ROOMS` reaches `roomsListView`.

## Historical Context (from prior changes)

- v3 bump (salon-load-health) and v4 bump (stale-tab-and-health): each added a fixture, a `deploy/README.md` rollback
  note and a `backup-v<N>` copy — supported by `deploy/README.md` (two notes) and `src/storage/idb.ts` `backup`.
- change.md's roadmap-claim table (this change): all 11 rows re-checked against the files above; supported, with one
  addition — the `RoomDoneCard.show` per-tile room bug, which change.md did not list.

## Related Research

Not applicable (no earlier research on a second room; follow-ups are tabled in `change.md`).

## Open Questions

- Room ids for kitchen and kids' room in the frozen v5 table (`kitchen` matches the pack; `kids-room` is a guess) —
  decide in `/10x-plan`, or freeze only `salon` in the migration.
- Whether F-04 wires the renovation rule into the done card's "Dalej" or only into load (no visible difference with one
  room) — plan choice; D2 says the visible move is S-22.
- Whether the child may choose which closed room opens next (FR-033, roadmap S-23 unknown) — out of F-04; the house
  list order is the default.
