# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-new` step of run 2026-10-30-rooms-kitchen: the change folder and its identity (`change.md`, status
`new`) exist; no research, plan or code yet. The one thing the next agent must not get wrong: the v4 save is ALREADY
multi-room (`rooms` map + `currentRoom`); v5 adds the house and the floor x place grid (scope.md, fixed), and the
existing `tests/fixtures/save-v4.json` holds a room `living`, not the salon, so a new frozen salon fixture is needed.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` (confirmed with `git branch --show-current`) |
| Commits | 1 on the branch: this step's `docs(rooms-as-data): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/rooms-as-data/change.md` | change identity: notes, roadmap claim table (11 rows, 9 with a correction), design-kit views and copy keys, migration statement (v4 -> v5), triggered follow-ups with takes, autonomous decisions D0-D5 |
| `context/changes/rooms-as-data/handoff.md` | this file |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| `git branch --show-current` | `feat/rooms-as-data` |
| kebab-case / uniqueness of `rooms-as-data` | passes; no folder in `context/changes/` or `context/archive/` |
| boot payload (same sum as `tests/bootBudget.test.ts`, run with `node --import tsx`) | 1 977 856 B = 39.6 s at 50 KB/s vs limit 48 s; room art 37 files, 1 203 384 B |
| kitchen pack inventory (`designs/martynka-locations-v2/manifest.json`, read-only) | `rooms.kitchen`: before/after/shadows, 6 slots x 3 variants, `shadowEllipses`, no decor |
| follow-up grep over `context/archive/*/follow-ups/review-fixes.md` (`Trigger:` naming a second room, kitchen, rooms, save format v5, `RoomScene`, `RoomView`, room art) | 16 rows recorded in `change.md` |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no source change |

## 4. Next command

`/10x-research rooms-as-data`

## 5. Open

- Research questions (from `change.md`): (a) the v5 shape of the house and the floor x place grid, and what is saved versus
  game data (`src/core/save.ts` `SessionSave`/`SaveState`, `MIGRATIONS`); (b) street/district in v5: default no (D1);
  (c) how `src/data/roomArt.ts` `ROOM_ART`/`SALON_ART` and `scripts/make-task-art.mjs` (hard-coded `martynka-salon-v2`,
  `salon/`) become driven by a list of rooms; (d) a room with no `worn` list and no `decor` (kitchen shape) in
  `RoomView.render` and `miniaturePieces`; (e) the room in renovation (`currentRoom`) after `roomDone` and
  `roomsListView`/`ROOM_ORDER` from house data; (f) per-room name and thumbnail in `RoomDoneCard.drawRoomTile`
  (`pl.room.name`, `UI_ART_KEYS.salonAfter`); (g) "Stan salonu" lines `pl.settings.roomMismatch`,
  `pl.saveTransfer.roomMismatch`.
- Fixtures: new frozen `tests/fixtures/save-v4-salon.json`; `save-v1*.json`..`save-v4.json` stay byte-identical.
- `[human]` candidates: rollback below the v5 build meets a v5 save as `future` (note in `deploy/README.md`, docs only).
- DESIGN-GAP candidates (next row 175 in `docs/design-gaps.md`): per-room thumbnail fallback; room-neutral mismatch lines.
- Follow-ups: the table "Open follow-ups triggered by this slice" in `change.md`; out-of-scope ones (GRD-09/S13-06,
  SV2-13, E2E on two real builds) must be re-recorded with a new trigger in this change's
  `follow-ups/review-fixes.md` at archive.

## 6. Autonomous decisions

- D0 scope fixed by the maintainer (scope.md): v5 = house + floor grid, salon moved without loss, frozen v4 fixture,
  `backup-v4` write-once, kitchen and celebration and boot budget in S-22. Would change: a new maintainer instruction.
- D1 no street/district in v5 (scope default). Would change: research finding a field this run's code reads.
- D2 F-04 builds the data contract, the pure "room in renovation" rule (tested on a synthetic second room) and the
  migration; the visible flow stays one real room; the kitchen is S-22. Rejected: adding the kitchen here. Would
  change: research showing the move between rooms cannot be tested without a real second room in `src/data/`.
- D3 the parameterised celebration (FR-040) is S-22; F-04 only makes the card's per-room inputs data. Would change:
  research showing the room list cannot read house data without the rewrite.
- D4 next step `/10x-research` (fixed by the step prompt) instead of the skill's default `/10x-plan`. Would change: nothing.
- D5 title written from the roadmap outcome (no intent text given). Would change: nothing.
- Skill checkpoint: `/10x-new` asks nothing when an argument is given; the clipboard copy was skipped (unattended run).
