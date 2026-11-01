# Handoff — `bathroom-room` (slice S-31)

Phase 4 (`tdd`) is done and committed as 8eab432: one `HOUSES` row puts the bathroom in `upper-right` of house 1, so house 1 is complete and every house-1 card shows four tiles. Phase 5 is docs, gap rows, follow-ups, seam sweep and the visual pass.

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | identity, research, plan, plan review, `7c742b8` p1, `32c2a5b` p2, `69694ce` p3, 8eab432 p4, then this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 18 (rows 1.1-4.5 ticked except `[reviewer]` 2.5, 3.7, 3.8) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/houses.ts` | `HOUSES['house-1']` gains `{ room: 'bathroom', floor: 1, place: 1 }`; header comment updated |
| `tests/fixtures/save-v6-children-done.json` | new frozen v6 fixture: salon, kitchen, children done, `currentRoom 'children'`, house of three cells |
| `tests/roomsData.test.ts`, `tests/houseCells.test.ts`, `tests/fixtureLoadPath.test.ts` | exemption removed; house list of four; children -> bathroom move; bathroom stays after its last task; `upper-right` cell cases; fixture mirror case; kitchen-done case expects four merged rooms |
| `tests/e2e/{kids-room,kitchen-room,room-change,rooms-as-data}.spec.ts` | the flips listed in the plan table (edited rows below) |

## 3. Verification

| command | result |
|---|---|
| RED (before the row) | `AssertionError: expected [ 'done', 'done', 'done', 'closed' ] to deeply equal [ 'done', 'done', 'done', 'current' ]` (houseCells); `bathroom: expected [] to have a length of 1 but got +0` (roomsData); `expected [ 'salon', 'kitchen', 'children' ] to deeply equal [ Array(4) ]` (fixtureLoadPath); 7 failed |
| GREEN | 90 passed in the three files |
| Break `place: 0` | 2 houseCells cases red; restored |
| Break: drop the row | 7 cases red (roomsData, houseCells, both fixtureLoadPath); restored |
| Meta-check | the fixture case mirrors `main.ts`'s calls (`repairCurrentRoom` -> `mergeHouse` -> `nextRoom`), not `main.ts`; the phase-6 e2e reload is the browser proof |
| lint / typecheck | OK |
| unit incl. deploy and ops tests, `sample` E1-E6 | `Tests 4233 passed (4233)` = phase-3 4228 + 5; samples 0 violations |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e, one spec at a time, `--workers=1`, sandbox off | `kids-room` 2 passed, `kitchen-room` 4 passed, `rooms-as-data` 3 passed, `room-change` 2 passed, `house-cross-section` 4 passed |
| 4.4 diffs | `git diff --stat 0af14dd -- src/scenes src/core src/ui src/main.ts src/testing src/data/rooms.ts src/data/layout.ts src/data/balance.ts public scripts` empty; the three older save fixtures untouched since `69694ce` |

Grep `house-1|FIRST_HOUSE|'children'|toHaveLength(3)|upper-right|room:false:false` in `tests/e2e`: edited (table rows): `room-change` 189-192 (four items, bathroom locked), `kitchen-room` 61 and 110 (fourth tile), `rooms-as-data` 15 and 61 (`HOUSE` four cells, four items), `kids-room` 77-83 (four items, bathroom unlocked, "Dalej" -> bathroom, children's change mode via a visit). Stay true: `kids-room` #2 (upper-right still closed), `house-cross-section` (closed cells for unreached rooms), `first-building-choice`, `base-cross-section` (house id only), `salon-art` (thumb count 3), `save-backup-health`.

## 4. Next command

`/10x-implement bathroom-room phase 5`

## 5. Open

- `[reviewer]` rows: 2.5, 3.7, 3.8, 5.12. `[visual]` row 5.6. `[human]` rows 5.7-5.11.
- Phase 5 writes design gap rows 204 (closed by the four-tile card) and 205 into `docs/design-gaps.md`, follow-ups, CLAUDE.md text and the visual pass.
- The `kids-room` spec's second test relies on the bathroom cell staying closed; it passed.
- E2E: single specs only per phase; the orchestrator runs the full suite after phase 6.

## 6. Autonomous decisions

- Manual gate, "how to proceed", unrelated-dirty-paths and commit-message prompts: decided in place (only the planned set committed, proposed message used, stopped after phase 4). Would change: none.
- Driver stays `tdd` (the `HOUSES` row was absent; unit cases were observed red before it). Would change: none.
- The "no closed cell once all four are done" case asserts `not.toContain('closed')` and four cells, because the current room's own cell reports `current`. Would change: none.
- The fixture's stars (17) and chosen variants are invented but valid (`roomStateProblems` = []). Would change: none.
