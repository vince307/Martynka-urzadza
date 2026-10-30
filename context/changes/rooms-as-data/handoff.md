# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-research` step of run 2026-10-30-rooms-kitchen: `research.md` answers the v5 shape, the
`MIGRATIONS[4]` step, `backup-v4`, street/district (no) and the salon-only code list; `change.md` is `preparing`. The one
thing the next agent must not get wrong: the v4 save is already multi-room, so v5 ADDS `house: { id, rooms: [{ room,
floor, place }] }` beside the unchanged `rooms`/`currentRoom` (do not nest room states), the migration table is frozen
in core (never imported from `src/data/`), and `RoomDoneCard.show` currently draws every room tile from the current room
(a bug the plan must fix before a second room exists).

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` (confirmed with `git branch --show-current`) |
| Commits | 2 on the branch: `docs(rooms-as-data): change identity (autonomous run)` and this step's `docs(rooms-as-data): research` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/rooms-as-data/research.md` | research: v5 shape and rules, `MIGRATIONS[4]`, `backup-v4` path, street/district decision with evidence, salon-assumption table (data vs leave), renovation rule API, kitchen pack inventory, design bounds, open questions |
| `context/changes/rooms-as-data/change.md` | frontmatter only: `status: new -> preparing`, `updated` |
| `context/changes/rooms-as-data/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/rooms-as-data` |
| grep of `src/` for writers of `currentRoom` | only `src/main.ts` (`booting.registry.set(REGISTRY_KEYS.currentRoom, ...)`); no scene moves the child to another room |
| grep of `src/`, `scripts/`, `vite/` for `FIRST_ROOM`, `ROOM_ORDER`, `ROOMS`, `SALON`, `ROOM_ART`, `salonAfter`, `salon/`, `martynka-salon` | every hit tabled in research "Salon assumptions" |
| kitchen pack (`designs/martynka-locations-v2/manifest.json`, `assets/`) read with python | 6 slots x 3 variants, `shadowEllipses: []`, no decor, no thumbnail; scene files `kitchen-{before,after,shadows}.png` |
| pixel sample of `kitchen-before.png` vs salon `architecture-before.png` (PIL) | kitchen `(255,245,223)` at 3 points (cream, no board); salon green board -> board recolour must be per room |
| `metadata-guard.mjs inspect` / `mark-researched` | ok, `change.md` sha256 409593f4... |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no source change |

## 4. Next command

`/10x-plan rooms-as-data`

## 5. Open

- Plan inputs (research "Save format v5", "Salon assumptions", "Room switching"): `SaveV5`/`HouseState` in
  `src/core/types.ts`; `saveProblem` check `house`; `copyHouse` in `encodeSave`/`toSession`; `freshSession` takes the
  house; `MIGRATIONS[4]` with a frozen table; `HouseDef`/`HOUSES`/`FIRST_HOUSE` in `src/data/`; `ROOM_ART` and the art
  script driven by a room list (per-room scene files and `recolourBoard` flag); `ROOM_ORDER` derived from the house;
  per-room name (`pl.room.names`) and optional thumbnail (G-3) in `RoomDoneCard.drawRoomTile`; fix
  `RoomDoneCard.show` per-tile room/state; pure `roomInRenovation` tested on synthetic rooms, applied at load.
- Tests to update, not break: `tests/saveV4.test.ts` (`SAVE_VERSION` 4), `tests/fixtureLoadPath.test.ts` `FIXTURES`,
  `tests/roomArt.test.ts` (37 entries, `SALON` keys). New frozen fixtures: `tests/fixtures/save-v4-salon.json`, a v5 one.
- Open choices for the plan: room ids `kitchen` / kids' room in the frozen v5 table (or freeze only `salon`); wire the
  renovation rule at load only or also at the card's "Dalej" (S-22 owns the visible move, D2).
- `[human]` candidate: rollback below the v5 build shows `pl.saveFuture`; docs note in `deploy/README.md` (as for v3/v4).
- DESIGN-GAP candidates (rows from 175 in `docs/design-gaps.md`): room-neutral mismatch lines
  (`pl.settings.roomMismatch`, `pl.saveTransfer.roomMismatch`); room without a pack thumbnail on the done card. For
  S-22: kitchen cream background vs the salon board `#BCD799`.
- Follow-ups: the table "Open follow-ups triggered by this slice" in `change.md` stands; re-record the out-of-scope ones
  in `follow-ups/review-fixes.md` at archive.

## 6. Autonomous decisions

- R0 scope fixed by the maintainer (scope.md): v5 = house + floor grid, salon moved without loss, frozen v4 fixture,
  write-once `backup-v4`. Recorded as fixed. Would change: a new maintainer instruction.
- R1 no street/district in v5 (confirms D1). Why: no code of this run reads one, and S-24 (stickers, inhabited house,
  FR-034/FR-041) forces another save version before the street anyway. Rejected: a `street` field now. Would change:
  the plan adding code in F-04/S-22 that reads a street or plot.
- R2 house added beside the top-level `rooms`/`currentRoom`, not nesting room states. Why: every room consumer and the
  migration stay unchanged; room ids are already unique. Rejected: `houses[].rooms` with nested states. Would change: a
  need for two houses holding the same room id.
- R3 data is the authority for a known house; the save carries the child's copy and keeps unknown entries (report, not
  repair). Why: resolves FR-038 ("floors are data") against scope.md ("save carries the grid") without overriding
  either. Would change: the maintainer wanting the saved layout to win over data.
- R4 the research was done in the main context (no sub-agents) although the skill defaults to delegation: the scope was
  a known, bounded file set listed in `change.md`. Would change: nothing for this step.
- Skill checkpoints: no clarification asked (unattended run; question derived from `change.md`).
