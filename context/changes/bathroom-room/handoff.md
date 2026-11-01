# Handoff — `bathroom-room` (slice S-31)

Written by the `/10x-new` step of run 2026-11-01-bathroom-polish-lab: the change folder and its identity exist, nothing
is implemented. The next agent must not plan stages for the bathroom (the pack has one before/after pair) and must not
defer the four-tile "Pokój gotowy!" card: scope.md puts it in this slice.

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | 1 on the branch after this step: `docs(bathroom-room): change identity (autonomous run)` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/bathroom-room/change.md` | change identity: roadmap-claim correction table (5 corrections), bound design sources and copy keys, migration (none, v6), triggered follow-ups, autonomous decisions D1-D8 |
| `context/changes/bathroom-room/handoff.md` | this handoff |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/bathroom-room` |
| `ls context/changes context/archive \| grep -i bath` | no collision |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no code changed |

No deliberate break: nothing testable was written.

## 4. Next command

`/10x-research bathroom-room`

## 5. Open

- Research questions (from `change.md`): the four-tile card geometry (`RoomDoneCard.show`, `ROOM_DONE_LAYOUT.tiles`; 4×340+3×32 = 1456 > card 1144) with two- and three-tile cards still right and the caption „Pokój dziecięcy” fitting; boot budget for the bathroom after `npm run art` (`tests/bootBudget.test.ts`); rollback of an unknown `currentRoom: 'bathroom'` in the old build (`repairCurrentRoom`); the house-1 last-room path (`nextRoom`, `houseRoomList`, `HouseView` with no closed cell, the „Dom” button and salon backdrop) for any house-1-only assumption; whether `bathroom-before` needs worn pieces or contact shadows (`wornPieces`, `contactShadowPieces`; expected none, `shadowEllipses: []`).
- `[human]` (to be carried into plan.md): the four-tile card is a code change outside room data (`src/ui/widgets/RoomDoneCard.ts`, `src/data/layout.ts` `ROOM_DONE_LAYOUT`), named for the product owner in the PR body.
- `[human]`: bathroom costs (D3, 71) and wording (new DESIGN-GAP row after 204) are ours; S-17 and a teacher read cover them.
- Follow-ups firing: kids-room 1 (in scope), kids-room 3 (`ROOM_DONE_LAYOUT.tiles.left`), final-art-salon F2 (`drawRoomMiniature`), house-cross-section 21 (`houseButton` null while the card is up); measured/carried: kids-room 7 (atlas), kids-room 6, hangar 4, kids-room 2 (S-32). Details in `change.md` § Open follow-ups.

## 6. Autonomous decisions

- D1 one stage task then six slots (pack has no stage backgrounds). Rejected: three stages. Changes if: a designer stage set arrives.
- D2 slots and order from the pack (tub, sink, towel shelf, rug, plant, toy shelf), pack captions. Rejected: roadmap words „szafka”, „półka z kaczuszkami”. Changes if: the maintainer prefers the roadmap words.
- D3 costs 5 + 7/9/10/12/13/15 = 71 (kitchen curve, 5-21 rule). Rejected: ~100, 84. Changes if: the author names a price or S-17 measures.
- D4 ids `bathroom`, `bathroom-*`, folder `public/assets/rooms/bathroom/`, `recolourBoard: false`. Changes if: none foreseen.
- D5 cell `upper-right`; house 1 then has no next room: four done tiles, no teaser, „Dalej” stays in change mode (Hangar precedent). Changes if: S-24 defines what follows a finished house.
- D6 four-tile card fixed here by a layout change; exact geometry is the plan's call after research. Rejected: deferring (scope.md). Changes if: a designer card for four rooms.
- D7 save format stays v6, frozen fixture with a finished children's room. Changes if: research finds a needed saved field.
- D8 next step `/10x-research`, not `/10x-plan` (the skill's default): the card geometry and boot budget need measuring. Changes if: none for this run.
- Skill's "copy next command to clipboard" and "STOP and wait" skipped/decided in place (unattended run).
