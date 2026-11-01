# Handoff — `kids-room` (slice S-25)

Written by the `/10x-tdd kids-room phase 4` step of run 2026-11-01-kids-room. Phases 1-3 are done (see the git log); phase 4 put the children's room into house 1 as data, widened the room-done card to three tiles and flipped the named tests. The e2e row 4.3 and the gate e2e row 4.5 are left to the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/kids-room`, cut from `main` at `bfdf193` |
| Commits on the branch | phases 1-3 with handoffs, then phase 4 (`test(kids-room): ... (p4)`) and this handoff |
| Pushed / PR / merged | no / no / no |
| `## Progress` rows remaining | 4.3, 4.5 (orchestrator e2e); 3.6-3.8; 5.x; 6.x |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/houses.ts` | `HOUSES['house-1']` row `{ room: 'children', floor: 1, place: 0 }` (`upper-left`) |
| `src/data/layout.ts` | `ROOM_DONE_LAYOUT.tiles`: width 340, gap 32, thumbScale 0.12, markRadius 22, markInset 28 (gap 204 comment) |
| `tests/fixtures/save-v6-kitchen-done.json` | frozen v6 save: house-1 with salon + kitchen, both full, `currentRoom` kitchen |
| `tests/layout.test.ts` | "lays the room list tiles ..." uses the longest house list (3); new done-mark-clear-of-miniature case |
| `tests/roomsData.test.ts` | exemption removed; house-1 list of 3; new kitchen -> children move and "Dalej stays" cases |
| `tests/houseCells.test.ts` | new house-1 case `['done','done','current','closed']`, `upper-left` = children |
| `tests/fixtureLoadPath.test.ts` | `save-v6-kitchen-done` in `FIXTURES` and a main.ts-mirroring case |
| `tests/e2e/{kitchen-room,rooms-as-data,room-change}.spec.ts` | edited per the plan table (not run) |

## 3. Verification

| command | result |
|---|---|
| First RED (4 files) | 6 failed: `expected [ 'done', 'done', 'closed', 'closed' ] to deeply equal [ 'done', 'done', 'current', 'closed' ]` (houseCells); `expected 2 to be 3` (layout); `children: expected [] to have a length of 1 but got +0` (roomsData); `expected [ 'salon', 'kitchen' ] to deeply equal [ 'salon', 'kitchen', 'children' ]` (fixture); list and move cases red too |
| GREEN | the row + tile numbers: 118 passed in the 4 files |
| Break `place: 1` | houseCells case red, restored |
| Break `tiles.width` 440 | layout case red, restored |
| Break drop the row | 6 cases red (fixture, houseCells, layout, 3 roomsData), restored |
| Meta-check | the fixture case mirrors `main.ts`'s calls (`repairCurrentRoom` -> `mergeHouse` -> `nextRoom`) and does not run it; the done-mark case alone stays green at width 440 (it guards the numbers, the width break is caught by the three-tile fit); phase 6 is the browser proof |
| lint, typecheck, `npm test` (4215 passed = 4209 + 6), deploy/ops tests, `sample` E1-E6, `npm run build` (`e2e hook: absent (2 chunks checked)`) | green |
| 4.4 diff/log guard | both empty |
| e2e | NOT run. Specs changed: `kitchen-room.spec.ts` (#2 card items, #16 Dalej -> children + visit to the kitchen via `ground-right`), `rooms-as-data.spec.ts` (`HOUSE` constant, #10 card items), `room-change.spec.ts` (3 items, `items[2]` children locked). Rows 4.3 and 4.5 left open |

Grep `house-1|FIRST_HOUSE|'kitchen'|items).toHaveLength` over `tests`: edited (table rows): the three specs above, `layout`, `roomsData`, `houseCells`, `fixtureLoadPath` additions. Stays true: `salon-extra-slots.spec.ts` (index-based items), `house-cross-section.spec.ts` (`upper-left` closed), `first-building-choice`/`base-cross-section` (house id only), `houseCells` synthetic-house cases, `saveV4/V5/V6`, `save.test`, `saveFile.test`, `rooms.test` (state-level, not the house list), `houseArt`, `houseSceneWiring`.

## 4. Next command

`/10x-implement kids-room phase 5`

## 5. Open

- Orchestrator: run `npx playwright test tests/e2e/kitchen-room.spec.ts tests/e2e/rooms-as-data.spec.ts tests/e2e/house-cross-section.spec.ts tests/e2e/room-change.spec.ts` (row 4.3) and the full e2e (4.5, `189 + 0`).
- `ROOM_DONE_LAYOUT.tiles.left` is unused in src (kept as it was); phase 5 seam sweep may drop it.
- Phase 5 (impl): rule-file text, gap rows 202-204, follow-ups, seam sweep, visual pass.

## 6. Autonomous decisions

- **Skill gates decided in place**: gate = TDD (data contracts), commit message taken as proposed, stopped after phase 4.
- **Fixture built by a one-off script** from `save-v6-bridge-done.json` (learner and variants reused; writer `tab3:n5`, generation 6), salon 12 tasks and kitchen 7 with chosen variants for their own slots.
- **Done-mark layout case** added as a guard of the plan's numbers; it is not red-first (current numbers already satisfy it), the width break is covered by the tile-fit case.
- **Progress SHA** written in a separate handoff commit.
