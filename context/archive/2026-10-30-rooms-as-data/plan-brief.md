# Rooms and the house as game data, save format v5 — Plan Brief

> Full plan: `context/changes/rooms-as-data/plan.md`
> Research: `context/changes/rooms-as-data/research.md`

## What & Why

Roadmap foundation F-04: a room must be addable with data and art only, before the kitchen (S-22) arrives. Today the art
table, the art script, the room order, the room name and thumbnail, and the "Pokój gotowy!" card assume the salon; the
save has no notion of a house. F-04 makes those room data, adds the house (rooms in a floor × place grid) to a v5 save, and
moves the child's salon into the first house without loss.

## Starting Point

Save v4 is already multi-room (`rooms`, `currentRoom`), with frozen fixtures v1–v4, a migration chain and write-once
`backup-v<N>` copies. `ROOM_ART`, `scripts/make-task-art.mjs`, `ROOM_ORDER`, `pl.room.name` and the done card's thumbnail
are salon-only; `RoomDoneCard.show` draws every tile from the current room; nothing ever moves `currentRoom`.

## Desired End State

Every save carries `house: { id: 'house-1', rooms: [salon (0,0), kitchen (0,1)] }`; a v4 salon save loads in v5 with every
slot, variant, star and learner field identical and leaves `backup-v4`. The room list, art table, art script, name and
thumbnail come from per-room data; a pure "room in renovation" rule exists and runs at load. The child sees exactly
today's salon.

## Key Decisions Made

| Decision | Choice | Why (1 sentence) | Source |
| --- | --- | --- | --- |
| v5 shape | `house` beside the unchanged `rooms`/`currentRoom` | every room consumer and the migration stay untouched | Research |
| Street/district | not in v5 | no code of this run reads them; S-24 forces a v6 anyway | Research |
| Frozen migration table | salon only (`house-1`, salon at 0,0) | data adds its rooms at load; a guessed kids' room id frozen forever would linger | Plan |
| Data house | salon + kitchen only | kitchen id fixed by its pack and needed for the "Wkrótce" tile; kids' room/closed cells wait for S-25/S-23 | Plan |
| Who wins at load | data for a known house id; unknown kept verbatim | "report, never repair" (save-truth) | Research |
| Renovation rule | pure, tested on synthetic rooms, applied at load only | with one room the "Dalej" move is invisible; S-22 wires it with the celebration | Plan |
| `saveProblem('house')` | checked last, duplicates accepted | keeps every `Kod:` meaning; avoids rejecting recoverable saves | Plan |
| Room name / thumbnail | `pl.room.names[id]`, optional `RoomDef.thumbnail`; `RoomDef.name` removed | one source of player text per room; no salon picture for another room | Plan |
| Board recolour | `recolourBoard` flag per room in the art script table | the cream kitchen would be refused by the 5–30 % mask guard | Research |
| Update proof | real IndexedDB load path in unit tests + in-memory e2e seam | two-build e2e is out of the run's scope (`[human]` row) | Plan |
| Scope fixed | v5 house + grid, frozen v4 fixture, backup-v4, no art/balance | maintainer's scope.md | Scope |

## Scope

**In scope:** `src/core/house.ts` rules; save v5 (`MIGRATIONS[4]`, `saveProblem`, copy, `freshSession(house)`);
`src/data/houses.ts`; registry key `house`; load merge + renovation rule; room list from the house; per-room name and
thumbnail; done-card per-tile fix; `ROOM_ART` and the art script per room; `save-v4-salon.json` + `save-v5.json`;
`?e2eSave=v4-salon`; CLAUDE.md v5; rollback note; follow-ups; one e2e spec.

**Out of scope:** kitchen data/art, celebration intensity, "Dalej" move (S-22); kids' room, closed cells, street; copy
change of the "Stan salonu" lines; two-build e2e; any balance, slot, cost, curriculum or `public/` byte change.

## Architecture / Approach

Core gets a pure house module and the v5 step with a frozen table (core never imports data). Data gets `HOUSES`, derives
`FIRST_ROOM`, per-room scene files and names. `main.ts` loads: decode (lifts v4 → v5) → `repairCurrentRoom` →
`mergeHouse` → `nextRoom`; the registry holds the house and the autosaver writes it. `RoomScene` lists rooms through
`houseRoomList`; `RoomDoneCard` draws each tile from its own room.

## Phases at a Glance

| Phase | What it delivers | Key risk |
| --- | --- | --- |
| 1. House rules + v4 salon fixture (tdd) | pure rules on synthetic rooms; fixture proven by v4 code | fixture not a real v4 shape |
| 2. Save format v5 (tdd) | `MIGRATIONS[4]`, `house` check/copy, data house, registry | shared frozen object; `freshSession` churn in tests |
| 3. Load path + room list (impl) | merge + renovation rule at load, list from house, `v4-salon` seam | order of repair vs rule |
| 4. Name, thumbnail, done card (impl) | per-room caption/thumbnail, per-tile drawing | a visible card change |
| 5. Art table + script per room (impl) | `ROOM_ART` from all rooms, `ROOM_PACKS` + `recolourBoard` | byte drift in `public/` |
| 6. Docs, sweep, visual (impl) | CLAUDE.md v5, rollback note, follow-ups, screenshots | stale v4 text |
| 7. v4 salon survives into v5 (e2e) | three hook specs (#10, #2) | long touch path to finish the salon |

**Prerequisites:** branch `feat/rooms-as-data`; local `designs/`, `cwebp`, pinned Pillow/numpy for `npm run art`.
**Estimated effort:** ~7 phase sessions plus reviews.

## Open Risks & Assumptions

- `freshSession(house)` touches ~8 test files; no default house in core.
- The e2e seam fixture could leak into `dist/` — guarded by the new `v4-salon` marker.
- Rollback below v5 shows `pl.saveFuture` (accepted risk, `[human]` row).

## Success Criteria (Summary)

- The salon looks and plays as today; a v4 salon save opens unchanged in v5 and leaves `backup-v4`.
- S-22 can add the kitchen with data, an art-table row, a script row and assets, plus its own scene work.
- Every older fixture still loads; full local gate and e2e green.
