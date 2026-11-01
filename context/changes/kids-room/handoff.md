# Handoff — `kids-room` (slice S-25)

Written by the `/10x-new kids-room` step of run 2026-11-01-kids-room: the change identity exists, no code changed yet.
The next agent must not miss decision D1 in `change.md`: the children's room is planned with a staged renovation
(three stage backgrounds from the pack), which is a small code change outside data that research must bound or reject.

## 1. State

| | |
|---|---|
| Branch | `feat/kids-room`, cut from `main` at `bfdf193` |
| Commits on the branch | 1 (this step: `docs(kids-room): change identity (autonomous run)`) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/kids-room/change.md` | change identity: roadmap claims re-verified (table), design-kit sources and copy keys, expected DESIGN-GAPs, migration (none expected, v6 stays), triggered follow-ups, autonomous decisions D1-D7 |
| `context/changes/kids-room/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/kids-room` |
| read `designs/martynka-evolution-v1/manifest.json` (`rooms.children`, `renovation`) | 6 slots, 3 variants each (bed: forms Baldachim/Domek/Z szufladami), stages neglected → clean → walls → floor; 6 room PNG + 20 furniture PNG, 1920×1080 backgrounds, about 14 MB |
| grep `Trigger:` in `context/archive/*/follow-ups/review-fixes.md` | rooms-as-data 11 / house-cross-section 13 (kids' room id, fires), kitchen-room 5 (atlas, „a third room”, fires: measure); conditional ones listed in `change.md` |
| `src/data/houses.ts` `HOUSE_GEOMETRY['house-1']` | cell `upper-left` (floor 1, place 0, 252,236, 608×342) exists, no room in it yet |
| lint / typecheck / tests / build / e2e | not run: docs-only step, no code changed (baseline on main bfdf193 from the contract, inherited, unverified) |

## 4. Next command

`/10x-research kids-room`

## 5. Open

- D1 (staged renovation) is the slice's one code change outside data; research lists every file that reads the stage
  background (`stagesDone` in `src/core/rooms.ts`, `RoomDef.scene` in `src/core/types.ts`, the room view, miniature
  capture `captureRoomMiniature`, `wornPieces`, `contactShadowPieces`, `HouseView`) and decides keep or fall back.
- Verify that `children-before.png` and `children-stage-0.png` are the same picture in RGB (the check at this step
  compared alpha only); convert one, not both.
- Boot budget: measure the children's boot set after `npm run art` (`tests/bootBudget.test.ts`, kitchen-room follow-up 5).
- Rollback below this build: where the old build's `repairCurrentRoom` (`src/main.ts`) sends `currentRoom: 'children'`.
- Name length „Pokój dziecięcy” on the HUD, card tile and house cell.
- Expected DESIGN-GAP rows (numbering after 201): children's-room wording; staged miniature/cell (with D1).
- `[human]` row for the product owner: D1 overturns the orchestrator's starting decision (one stage task) — the PR
  body must say the slice changed code outside data and why.

## 6. Autonomous decisions

- `[human]` D1 staged renovation (3 stage tasks with the pack's stage backgrounds) chosen over one stage task; why: the
  roadmap S-32 outcome defines the kitchen's stages „jak pokój dziecięcy”, the S-25 blocker names three stage
  backgrounds, the pack ships them. Changes if research finds the change reaches beyond room data, rooms core, room
  view and miniature, or the boot budget fails: then one stage task.
- D2 pieces and order from the pack (bed, desk, books, toys, reading, wardrobe; bed forms). Changes if the maintainer
  prefers colour families for the bed.
- D3 costs: slots 7/9/10/12/13/15, stages 3/4/5 (total 78). Changes with S-17 measurements or a maintainer price.
- D4 room id `children` (pack ids). D5 cell `upper-left`. D6 no save-format change. D7 research next (chain fixed).
- `/10x-new` would suggest `/10x-plan` by default; research chosen because D1 and the boot budget need a sweep first.
