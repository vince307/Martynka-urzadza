<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Kids' room, the third room of house 1

- **Plan**: context/changes/kids-room/plan.md
- **Mode**: Deep (code checked inline by the reviewer; no sub-agent, the risky claims were few and local)
- **Date**: 2026-11-01
- **Verdict**: REVISE → SOUND after the fixes applied to plan.md
- **Findings**: 2 critical, 4 warnings, 1 observation

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F3, F5, F6, F7) |
| Plan Completeness | FAIL before fixes (F1, F2, F4); PASS after |

## Grounding

Grounding: 14/14 paths ✓ (`src/core/{types,rooms,backdrop}.ts`, `src/ui/widgets/{RoomView,RoomDoneCard}.ts`,
`src/scenes/RoomScene.ts`, `src/data/{roomArt,rooms,houses,layout,pl}.ts`, `scripts/make-task-art.mjs`,
`tests/{rooms,backdrop,roomArt,roomsData,roomHit,layout,houseCells,fixtureLoadPath,bootBudget,deployCheck}.test.ts`,
`tests/fixtures/save-v6-bridge-done.json`, `tests/e2e/support/hook.ts` `renderedPixel`), 9/9 symbols ✓ (the four copies
of `stagesDone > 0 ? after : before` at `RoomView.render`, `miniaturePieces`, `backdropMode`, and `fadeStage` ghosting
`room.scene.before`; `roomArt`/`ROOM_SCENE_FILES`/`bootRoomArt`/`roomArtLoader` defaultEntries; `ROOM_DONE_LAYOUT.tiles`
440/60; `houseRoomList` teaser rule; `mergeHouse` data rows first; `ROUND_SPEC`; `sceneKey`/`stageFade` absent;
`public/assets/rooms/children` absent; pack files `children-{stage-0,1,2,after,shadows}.png` and the 18 furniture PNGs
present), brief↔plan ✓ (after the brief was updated for F1/F3).

Drivers checked against the code: 1 `tdd` (helpers absent, pure core) ✓; 2 `impl` (glue) ✓; 3 `impl` (art + data) ✓;
4 `tdd` (row and tile numbers absent; flipped tests lead) ✓; 5 `impl` ✓; 6 `e2e` (feature built by 1-4, after the
phase-5 seam sweep, contract `E2E=on`) ✓. No driver changed.

Toolchain for phase 3 (read-only probe): `/usr/local/bin/cwebp` present; `python3` has Pillow 12.1.0 and numpy 2.4.3.

Follow-ups whose `Trigger:` names this slice: house-cross-section 13 (S-25) and rooms-as-data 11 → in scope (phase 4
row, phase 5 closes); kitchen-room 5 (a third room) → measured in research, carried with a trigger (phase 5);
hangar-module 5 → satisfied by the phase-2 stage keys in `roomArt`. Fired by the files the slice touches but NOT named in
the plan before review: salon-style F4 (`ghostTweens`, Trigger "a second stage task in a room") → F5 below.

PRD: D1 (three stage tasks) matches FR-033 ("najpierw ściany i podłoga … mogą być dwoma osobnymi wyborami"), the
`[human]` row 5.7 names the code outside data. Costs 3/4 contradicted FR-016 (start 5-15) → F1.

## Findings

### F1 — Stage costs 3 and 4 break the room-cost invariant

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §2 (tasks), §4 (tests); Desired End State; rows 5.9; P3
- **Detail**: `tests/roomsData.test.ts` `describe('every room in ROOMS')` "has one furniture task per slot, whole costs of
  5-21 stars …" asserts `cost >= 5` for every task of every room in `ROOMS`; PRD FR-016 starts room costs at 5. Phase 3
  as written (3/4/5) is red and cannot reach its own gate.
- **Fix**: costs 5/6/7 + 7/9/10/12/13/15 = 84 everywhere (plan, brief, change.md note, `[human]` 5.9, CLAUDE.md sentence);
  first task 5 ≤ one clean round (7). Recorded as R1.
- **Decision**: FIXED

### F2 — Phase 3 is not independently green: "placed in exactly one house"

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §4, Phase 4 §4, Phase 5 seam sweep
- **Detail**: the same `describe` asserts every room of `ROOMS` is placed in exactly one house of `HOUSES`. Phase 3 adds
  `CHILDREN` to `ROOMS` with no house row (phase 4), so the invariant goes red. The S-30 slice solved the same split with
  a named temporary exemption (`041e279`, `id === 'hangar' ? 0 : 1`); this plan did not say so, leaving the phase-3 agent
  to improvise with a test.
- **Fix**: phase 3 adds the exemption `id === 'children' ? 0 : 1` with its comment; phase 4 removes it (the red-first
  signal for the row); the phase-5 seam sweep greps that it is gone. Recorded as R3.
- **Decision**: FIXED

### F3 — Tiles at 320 hide the done mark under the miniature

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 4 §2 (card tiles), §4 (layout test); rows 5.8; P5
- **Detail**: `RoomDoneCard.drawRoomTile` draws the check-mark circle on `this.graphics` (`depth.card`) and the miniature
  images at `depth.card + 1`. With width 320, thumb `1920 × 0.13` = 250 centred (x 35-285) and the mark at inset 34,
  radius 26 (x 260-312, y 8-60), half the mark is under the opaque background picture. The mark is the shape sign of
  "done" (the comment: "not only a colour"). The plan said "unchanged unless the mark leaves the tile", which misses this.
- **Fix** (applied): width 340, gap 32 (1084 ≤ 1144), `thumbScale` 0.12 (right edge 285.2), mark inset 28 radius 22
  (x 290-334); the layout test adds "the mark circle is inside the tile and clear of the thumb rect" (red at 320/40).
  Strength: layout data only, keeps the bound. Tradeoff: every card's miniature is ~8 % smaller. Confidence: HIGH — the
  geometry is arithmetic on the drawing code. Blind spot: legibility of the 0.12 miniature, judged by frames 1/8/13.
  Rejected: drawing the mark above the pictures (code in `RoomDoneCard`). Recorded as R2.
- **Decision**: FIXED

### F4 — The tests flipped in phase 4 were not named assertion by assertion

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Phase 4 §4
- **Detail**: the plan listed kitchen-room #16 and rooms-as-data and deferred the rest to a grep, with kitchen-room #16's
  change-mode proof "moved … or dropped". The grep at review finds two more assertions that turn red:
  `room-change.spec.ts` `card?.items).toHaveLength(2)` (salon to the end) and `kitchen-room.spec.ts` #2 card items after
  the salon; and dropping the kitchen change-mode proof would lose coverage silently.
- **Fix** (applied): a table in phase 4 with each assertion, its new value and why (only "house 1 now lists a third known
  room"); kitchen-room #16 keeps its change-mode proof through a house visit to `ground-right` (the path
  `house-cross-section.spec.ts` uses); the specs that stay true are listed with why; any flip outside the table is a
  finding, not an edit.
- **Decision**: FIXED

### F5 — A fired follow-up on `fadeStage` (three stages) was not named

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 §2; Phase 5 §1
- **Detail**: salon-style impl-review F4 ("`RoomScene` `ghostTweens` keeps finished tweens until sleep: bounded (one stage
  purchase per room …)", Trigger "a second stage task in a room or the next change to `fadeStage`") fires: the children's
  room has three stages and phase 2 edits `fadeStage`. Also fired by the `RoomView.render`/`RoomScene`/room-art edits and
  only covered by a catch-all: final-art-salon VO2/F5/F7, salon-extra-slots VO2 and L-R8/L-R11, rooms-as-data 12,
  kitchen-room 8, salon-load-health M-6.
- **Fix** (applied): phase 2 drops the finished tween from `ghostTweens` in its `onComplete` and states the overlap of
  back-to-back stage fades; phase 5 names each fired item with close/re-record.
- **Decision**: FIXED

### F6 — No rule for a missing art toolchain in phase 3

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 §1
- **Detail**: `npm run art` needs `cwebp`, Pillow 12.1.0 + numpy 2.4.3 and the local-only `designs/` packs; the plan
  named the needs but not what an agent does without them (risk: a hand-made WebP that differs from the script output,
  which phase 5's "`npm run art` then `git status` empty" would catch only later). Tools are present at review time.
- **Fix** (applied): sandbox-disabled re-run of the one command first, then `STATUS: BLOCKED` with the error line; never
  hand-convert, re-pin or write into `designs/`. Also in Known risks.
- **Decision**: FIXED

### F7 — Expected stage pixels taken from bare pack PNGs

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 6 test 1
- **Detail**: the pixel candidates were measured on the background PNGs alone; at stage 0 the room view also draws the
  `shadows` layer, and room UI may cover a point. The assertion already reads the rendered frame (profile § 8), so this
  is about the expected value, not the method.
- **Fix** (applied): expected values composed with what the view draws there and checked against a first rendered read;
  each transition also asserts a change of ≥ 30 in one channel from the previous read (the measured transitions differ
  by 43-63).
- **Decision**: FIXED

## Probes from the step prompt

- Phase 4 flipped tests: now a per-assertion table with the reason (F4).
- e2e pixel reads the rendered frame: yes (`renderedPixel` screenshots a 1×1 clip of the page); expected values revised (F7).
- Card tiles for 2 and 3 tiles: the layout test uses the longest house list (3); 2 tiles (base, Mostek/Hangar) are
  narrower but centred by `RoomDoneCard.show` and fit trivially; the mark/thumb clash affected both and is fixed (F3).
  Frame 13 (base card) remains the visual check.
- Art conversion: `designs/` is only read by the script; toolchain present; BLOCKED rule added (F6).

VERDICT: PROCEED — the approach (one pure background rule, room as data, one house row) holds against the code; two gate-blocking data errors (costs below 5, the placement invariant) and four gaps were fixed in plan.md.
