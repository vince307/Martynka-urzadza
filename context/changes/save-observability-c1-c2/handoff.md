# Handoff — `save-observability-c1-c2` (slice fix, non-roadmap)

Written by `tdd` phase 3: `repairCurrentRoom` (core, pure), its `main.ts` wiring and the single `RoomScene.resolve()` landed test-first (commit 5b78176). e2e was NOT run here (Chromium MachPort), so it is the orchestrator's gate on 5b78176.

## 1. State

| | |
|---|---|
| Branch | `feat/save-observability-c1-c2`, cut from `main` at `4698110` |
| Commits | phase 1 `fb2e7bb`, phase 2 `11b492c`, phase 3 `5b78176` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 23 (`grep -c '^- \[ \]' plan.md`; 1.5 is `[reviewer]`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/rooms.ts` | `repairCurrentRoom(session, knownIds, firstRoom)`: known room -> same object; unknown -> `currentRoom = firstRoom`, `rooms[firstRoom]` added only when absent, other rooms copied by reference |
| `src/main.ts` | `loaded` branch: repair after `floorToCalendar`, `console.warn` when `repairedFrom`; no write |
| `src/scenes/RoomScene.ts` | `resolve()` replaces `roomId()/roomState()/room()`; all call sites use it |
| `tests/rooms.test.ts`, `tests/roomsData.test.ts` | repair tests (incl. both frozen fixtures, `living` -> `salon`), loops over `ROOMS` (one task per slot, costs, placeholders M-R5, texts L-R10) |
| `plan.md` | rows 3.1-3.4 ticked; 2.4 cites the orchestrator e2e run |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub returned input unchanged) | 4 failed, e.g. `expected null to be 'living'` (repairedFrom), `expected undefined to deeply equal { tasksDone: 0, chosen: {} }` (rooms.salon) |
| `npm test` | 1172 passed (branch baseline 1162, +10: 6 repair incl. 2 fixtures, 4 data) |
| lint, typecheck, `sample` E1 | clean / clean / 0 violations |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate |
| Break: `rooms` replaced by `{ [firstRoom]: empty }` | 3 failed (adds-empty-only-when-missing, both fixtures) |
| Break: existing `rooms.salon` overwritten with empty | 1 failed (other rooms untouched test) |
| Break: `rug` placeholder deleted from `src/data/rooms.ts` | 4 failed incl. new M-R5 loop test; restored via `git checkout` of that file (no other edits in it) |
| Meta-check | expectations come from the run contract (other rooms never touched), not from the code |
| `grep -n "this.roomState()\|this.room()" src/scenes/RoomScene.ts` | empty |

## 4. Next command

`/10x-implement save-observability-c1-c2 phase 4`

## 5. Open

- Row 1.5 and 3.5 `[reviewer]`. e2e on 5b78176: orchestrator gate (rows 3.4).
- Note for impl-review: the `.catch` in `loadSave` is defensive (phase 2).
- Karta for `unavailable` is phase 4.

## 6. Autonomous decisions

- No stubs for RED: the new parameters and seam values fail on assertions at runtime. Reversal: none.
- Timeout is signalled by rejecting the race with an `Error` named `timeout` (lint forbids non-Error rejections), turned into `error: 'timeout'` by `errorName`. Reversal: if a typed timeout is wanted.
- The plan's `.catch` break stays green; recorded honestly, the refactor-path break is the proof. Reversal: drop the `.catch` if impl-review calls it dead code.
- `timers` hoisted in `start` and shared between `loadSave` and `createAutosaver`.
- Phase 3 mixed part: the `main.ts` wiring and `RoomScene` refactor done inline; phase keeps `Driver: tdd`.
- Data-test loops over `ROOMS` pass at once (only the salon exists); the RED comes from the repair tests. Reversal: none.
- `SALON_PLACEHOLDERS` is shared by all rooms, so the M-R5 loop checks it for every room's slots.
