# Handoff — `bathroom-room` (slice S-31)

Written by the `/10x-research` step of run 2026-11-01-bathroom-polish-lab: `research.md` answers the card, test, boot, house-cell,
pack and rollback questions; nothing is implemented. The next agent must not leave the "Pokój gotowy!" card at a fixed 1144 width:
with the bathroom every house-1 card (after each of the four rooms) lists four tiles, so `tests/layout.test.ts` and four e2e specs change.

## 1. State

| | |
|---|---|
| Branch | `feat/bathroom-room`, cut from `main` at `e451fa8` |
| Commits | 2 on the branch after this step: `c208e25` change identity, then `docs(bathroom-room): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/bathroom-room/research.md` | research: card options with numbers (recommended: card width by tile count), the unit tests and e2e specs that pin the card and the house-1 list, boot budget measured per room plus the bathroom converted with the script's `cwebp` options, `upper-right` cell, pack slot table, rollback path, last-room path |
| `context/changes/bathroom-room/change.md` | frontmatter only: `status: new` → `preparing`, `updated` 2026-11-01 |
| `context/changes/bathroom-room/handoff.md` | this handoff |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/bathroom-room` |
| boot payload per room (scratchpad script, same sums as `tests/bootBudget.test.ts`) | common 889 112 B; salon 41.85 s, kitchen 33.74 s, children 35.03 s, bridge 31.76 s, hangar 29.91 s; limit 48 s |
| `cwebp -q 85 -alpha_q 100 -m 6` over the 21 pack PNGs into the scratchpad (not `public/`) | 563 514 B → bathroom boot 29.05 s |
| Pillow caption widths in `MartynkaNext.ttf` 36 px, weight 600/700 | "Pokój dziecięcy" 257/261 px, "Łazienka" 150/152, "Laboratorium" 223/227 |
| local gate (lint, typecheck, tests, build, e2e) | not run: docs-only step, no product code changed |

No deliberate break: nothing testable was written. The measuring script and WebP files live only in the session scratchpad.

## 4. Next command

`/10x-plan bathroom-room`

## 5. Open

- Card (`src/ui/widgets/RoomDoneCard.ts` `RoomDoneCard.show`, `src/data/layout.ts` `ROOM_DONE_LAYOUT`): recommended option A, width
  `max(1144, n·340 + (n−1)·32 + 2·30)` centred on 960 (n=4 → 1516, left 202); 2- and 3-tile cards unchanged; fits up to n=5. Option B
  (fixed 1516, data only) is the fallback. Delete `ROOM_DONE_LAYOUT.tiles.left` (kids-room follow-up 3). Edit design gap 204.
- Tests to update: `tests/layout.test.ts` (card tiles test pins n=3), `tests/roomsData.test.ts` (`houseRoomList` of the first house;
  "Dalej stays" in children → moves to the bathroom), `tests/fixtureLoadPath.test.ts` (kitchen-done house → four rooms); e2e
  `kids-room.spec.ts` #16, `kitchen-room.spec.ts`, `rooms-as-data.spec.ts`, `room-change.spec.ts` (card item lists).
- New frozen fixture: a finished children's room saved by the current build (precedent `tests/fixtures/save-v6-kitchen-done.json`).
- House-cross-section follow-up 21: the e2e for the bathroom card can assert `houseButton` null while the card is up (`RoomScene` `blocked`).
- `[human]`: card option A changes code outside room data (named for the product owner in the PR body); costs (D3) and wording (new gap row after 204).
- PRD FR-040 'house' intensity is not used when house 1 completes; roadmap S-24 owns it (research § 7).

## 6. Autonomous decisions

- R1 Research done in the main context, no sub-agents (the skill's default is 2–4 parallel workers). Why: the questions were narrow
  and sequential (card geometry → tests → measurements), reading the same handful of files. Changes if: a follow-up widens scope.
- R2 Recommended card option A (width by count) over B (fixed wide), C (smaller tiles), D (two rows). Why: keeps the accepted two- and
  three-tile cards pixel-identical, captions fit, clears the HUD; C breaks "Pokój dziecięcy" at 36 px, D crowds "Dalej". Changes if:
  the plan prefers no code change (B) or a designer card for four rooms arrives.
- R3 Bathroom boot budget measured with a scratchpad conversion instead of running `npm run art` (which would write `public/`).
  Why: research writes no product files. Changes if: the plan's art phase shows different byte counts (re-measure there).
- R4 Keep the `'room'` celebration for the house-completing bathroom. Why: roadmap S-24 owns the finished-house moment (FR-034/040/041).
  Changes if: the maintainer wants the 'house' intensity in S-31.
- Skill's "ask the user" points decided in place (unattended run).
