# Handoff — `lab-module` (slice S-33)

Written by the `/10x-tdd` phase 2 step of run 2026-11-01-bathroom-polish-lab: phase 2 committed as `e9e6ae2`. The one thing not to get wrong: the Laboratorium is now placed (`upper-left`, floor 1, place 0) and reachable by "Dalej" after the Hangar; phase 3 adds the base's own cell frame and phase 4 the docs and the visual pass.

## 1. State

| | |
|---|---|
| branch | `feat/lab-module` |
| commits | plan-review head, `947e665` (phase 1), `e9e6ae2` (phase 2) |
| pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| Progress rows remaining | 24 of 35 (11 ticked: 1.1-1.6, 2.1-2.5; 1.7, 1.8 are [reviewer]) |
| working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/houses.ts` | `HOUSES['base-1']` row `{ room: 'lab', floor: 1, place: 0 }`, comment updated |
| `tests/fixtures/save-v7-hangar-done.json` | new frozen v7 fixture: Mostek and Hangar done, `currentRoom 'hangar'`, stars 9 |
| tests | `roomsData` (exemption removed, `houseRoomList`, hangar flow flipped, new `lab flow (FR-046)`), `houseCells` (`the Laboratorium cell (FR-046)`), `fixtureLoadPath` (FIXTURES entry, `save-v7-hangar-done meets the Laboratorium`, widened bridge-done expectation) |
| `tests/e2e/hangar-module.spec.ts` | #16 title, three card items, "Dalej" opens `lab` (`tasksDone 0`, `houseLabel 'Baza'`) |

## 3. Verification

| command | result |
|---|---|
| RED (row missing) | `AssertionError: expected [ 'done', 'done', 'closed', 'closed' ] to deeply equal [ 'done', 'done', 'current', 'closed' ]` (houseCells); roomsData `lab: expected [] to have a length of 1`, `expected 'hangar' to be 'lab'`; fixtureLoadPath `expected [ 'bridge', 'hangar' ] to deeply equal [ 'bridge', 'hangar', 'lab' ]` (6 failed) |
| GREEN | the three files green, 101 |
| deliberate break: lab row `place: 1` | houseCells case red (`[ 'done', 'done', 'closed', 'current' ]`); restored |
| deliberate break: row dropped | 6 cases red (roomsData placement, base list, flow; fixtureLoadPath x2; houseCells); restored |
| meta-check | the fixture case mirrors `main.ts`'s calls (`repairCurrentRoom`, `mergeHouse`, `nextRoom`), a reorder in `main.ts` would not be caught here; phase 5 e2e reload is the browser proof |
| `npx playwright test tests/e2e/hangar-module.spec.ts --workers=1` (sandbox off) | 2 passed |
| lint / typecheck / `npm test` + deploy + ops tests / sample E1-E6 / build | all green; unit 4263 (baseline 4259 after phase 1, delta +4); `e2e hook: absent` |
| `git diff --stat 947e665` on scenes, core, ui, main, testing, save, rooms, balance, public, scripts | empty; fixtures v7 and v6-bridge-done unchanged |

## 4. Next command

`/10x-implement lab-module phase 3` (phase 3, `Driver: impl`)

## 5. Open

- Rows 1.7 [reviewer] and 1.8 [reviewer] (CI at ship) remain from phase 1.
- Full e2e is left to the orchestrator after phase 5. Phase 3 needs `designs/bystrow-space-base-v5` for `npm run art`.
- Unchanged: `[human]` rows 4.8-4.11, DESIGN-GAPs planned for phase 4 (208 new, 196 edit, 199 close). No `ARTIFACT GAP`.

## 6. Autonomous decisions

- Skill tool invoked (`10x-tdd`); all its prompts (manual gate, commit message, next phase) decided in place: planned set only, proposed message, stop after the phase. Would change: nothing.
- The first RED of the `houseCells` case was a `ReferenceError` (`b` out of scope); fixed to `HOUSE_GEOMETRY['base-1']` and the assertion RED re-observed above. Would change: nothing.
- Fixture stars set to 9 and chosen variants hand-picked (R2). Would change: nothing.
