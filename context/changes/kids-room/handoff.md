# Handoff — `kids-room` (slice S-25)

Written by the `/10x-plan-review kids-room` step of run 2026-11-01-kids-room. The plan is reviewed (PROCEED) and fixed in
place; no product code has changed. The next agent must not miss two things. First, the children's costs are now
5/6/7 + 7/9/10/12/13/15 = 84, because every task must cost 5-21. Second, phase 3 adds a temporary placement exemption
in `tests/roomsData.test.ts`, and phase 4 removes it.

## 1. State

| | |
|---|---|
| Branch | `feat/kids-room`, cut from `main` at `bfdf193` |
| Commits on the branch | 5: change identity, research, plan, handoff row count, and `docs(kids-room): plan review` (this step) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 36 (`grep -c '^- \[ \]' plan.md`), all pending; no row added or removed |
| Working tree | clean after the commit (only the files below were staged) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/kids-room/reviews/plan-review.md` | the review: 2 CRITICAL, 4 WARNING, 1 OBSERVATION, all FIXED; ends `VERDICT: PROCEED` |
| `context/changes/kids-room/plan.md` | fixed in place (F1-F7). New `### Plan review` block (R1-R3) under `## Autonomous decisions`, and two new Known risks |
| `context/changes/kids-room/plan-brief.md` | costs and card rows updated (84; tiles 340/32) |
| `context/changes/kids-room/change.md` | status `plan_reviewed`; card numbers and the D3 revision noted in Notes |
| `context/changes/kids-room/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/kids-room` |
| Read `tests/roomsData.test.ts` `describe('every room in ROOMS')` | `toBeGreaterThanOrEqual(5)` on every task cost, which makes 3/4 red (F1). Every room must be in exactly one house, which makes phase 3 red without an exemption (F2). S-30 precedent `git show 041e279` |
| Read `RoomDoneCard.drawRoomTile` + `ROOM_DONE_LAYOUT` | The mark is on the Graphics at `depth.card` and the miniature at `depth.card + 1`. At 320 the mark x 260-312 overlaps the thumb x 35-285. At 340/0.12/28/22 the mark x 290-334 is clear of the thumb, which ends at 285.2 (F3) |
| `grep` of `tests/e2e` for card items / house literals | `room-change.spec.ts` `items).toHaveLength(2)` and `kitchen-room.spec.ts` #2 items were not named in the plan, so they were added to the phase-4 table (F4) |
| `grep Trigger:` over `context/archive/*/follow-ups/review-fixes.md` | salon-style F4 (`ghostTweens`, "a second stage task") fires and is now in phase 2 (F5). S-25 triggers: house-cross-section 13, rooms-as-data 11, kitchen-room 5, hangar 5, all covered |
| `which cwebp`; `python3 -c "import PIL, numpy"` | `/usr/local/bin/cwebp`; `12.1.0 2.4.3` (F6) |
| Python check of `plan.md` | One `## Progress` heading. Phases 1, 2, 4 and 6: automated criteria = Progress rows. Phases 3 and 5: automated rows match, and the manual `[reviewer]`/`[human]`/`[visual]` rows sit under `#### Manual` unchanged. No checkbox in the phase blocks. Every phase starts with `Driver:` |
| lint / typecheck / tests / build / e2e | not run: docs-only step. The baseline on main `bfdf193` (unit 4194, e2e 189) is inherited from the contract and not verified here |

## 4. Next command

`/10x-tdd kids-room phase 1`

## 5. Open

- **Phases and drivers** (unchanged):
  1. `sceneKey`/`stageFade` (tdd).
  2. The four sites, `roomArt` stage keys, and the `ghostTweens` fix (impl).
  3. `CHILDREN` data, art and copy, unreachable, with the placement exemption (impl).
  4. The `HOUSES` row; tiles 340/32 with thumb 0.12 and mark 28/22 plus the mark-clear layout test; the fixture; the
     flipped tests per the table (tdd).
  5. Docs, gaps 202-204, follow-ups, seam sweep, and 13 visual frames (impl).
  6. `tests/e2e/kids-room.spec.ts` (e2e).
- **Code outside room data, for the product owner** (`change.md` Notes): `src/core/{types,rooms,backdrop}.ts`,
  `src/ui/widgets/RoomView.ts`, `src/scenes/RoomScene.ts` (`fadeStage` + `ghostTweens` cleanup), `src/testing/e2eHook.ts`,
  the logic in `src/data/roomArt.ts`, and `ROOM_DONE_LAYOUT.tiles` in `src/data/layout.ts`.
- **Manual rows, as a human checklist:**
  - 3.7 [reviewer]: teacher read.
  - 3.8 [reviewer]: CI shows 123 of 123 room pictures.
  - 5.6 [visual]: 13 frames.
  - 5.7 [human]: D1.
  - 5.8 [human]: tiles 340/32 with a miniature at 0.12.
  - 5.9 [human]: costs = 84.
  - 5.10 [human]: wording.
  - 5.11 [human]: offline tablet.
  - 5.12 [reviewer]: CI `Tests` and `e2e hook: absent`.
- **Risks:**
  - The smaller miniature on every card (frames 1, 8, 13).
  - `npm run art` needs local tools. A missing tool means BLOCKED, never a hand-made WebP.
  - The purchase-heavy e2e is load-sensitive (`--last-failed --workers=1`).
- **Follow-ups for phase 5** are named in plan phase 5 §1, including the fired items re-recorded by this review.

## 6. Autonomous decisions

These were decided at this step without `AskUserQuestion`. Triage was done in place, as the contract directs: every
finding was FIXED in plan.md, none was skipped.

- **R1 costs 5/6/7 + 7/9/10/12/13/15 = 84**, replacing 3/4/5 = 78.
  - Why: the room invariant requires 5-21 per task, and PRD FR-016 starts at 5.
  - Rejected: lowering the test floor.
  - Would change it: S-17 or the maintainer naming prices.
- **R2 tiles 340/32, `thumbScale` 0.12, mark 28/22, with a mark-clear layout test.**
  - Why: at 320 the done mark sits under the miniature.
  - Rejected: drawing the mark above the miniature, which needs `RoomDoneCard` code and breaks the bound.
  - Would change it: the visual gate finding the 0.12 miniature unreadable.
- **R3 temporary placement exemption in phase 3, removed in phase 4** (S-30 `041e279`).
  - Rejected: merging phases 3 and 4, which would make one phase too big for one agent.
  - Would change it: nothing foreseen.
- **Kitchen #16 keeps its change-mode proof by a house visit**, not by dropping it.
  - Why: dropping it would lose coverage silently.
  - Would change it: the visit path failing for a reason outside this slice; that is recorded, not worked around.
- **No sub-agent for the codebase check** (the skill's Step 3).
  - Why: the risky claims were local to about ten files, and reading them directly was cheaper than a brief.
  - Would change it: a plan touching many modules.
- **Drivers unchanged**: each was checked against the code (phase 1 helpers absent; phase 6 after the sweep, `E2E=on`).
