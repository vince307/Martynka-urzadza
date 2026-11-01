<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Hangar with the rocket, the second module of the base

- **Plan**: context/changes/hangar-module/plan.md
- **Mode**: Deep (claims checked locally against the code, no subagent: the risky claims were few and narrow)
- **Date**: 2026-11-01
- **Verdict**: SOUND (after the in-place fixes below)
- **Findings**: 0 critical, 1 warning, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, fixed) |
| Plan Completeness | PASS (F2-F4 recorded, fixed) |

## Grounding

Grounding: 15/15 paths ✓ (data, script, tests, e2e spec, gaps file, pack screenshots/previews), symbols ✓ (`unreachableSlots`,
`houseRoomList`, `nextRoom`, `mergeHouse`, `repairCurrentRoom`, `ROOM_PACKS`, `SPACE_BASE`/`SPACE`, `ROUND_SPEC`,
`E2E_MAX_STARS` = 500 ≥ 200), brief↔plan ✓ (brief test count corrected, F1).

Claims verified against the code:
- **No scene/core/ui/main/testing code names Mostek or a one-room base**: `grep -rnE "'bridge'|BRIDGE|Mostek|base-1|hangar" src/scenes src/core src/ui src/main.ts src/testing` → empty. Runtime iteration over rooms is generic (`ROOM_ART` in `BootScene`/`UIScene`, `houseRoomList`, `houseCells`). The roadmap Risk holds on paper.
- **Pack**: `designs/bystrow-space-base-v2/manifest.json` `rooms.hangar` six slots match the phase-1 literal exactly (x, y, w, h, z); 3 scene + 18 furniture PNGs present; `shadowEllipses: []`.
- **Load order mirror**: `src/main.ts` runs `houseLayout` → `repairCurrentRoom` → `mergeHouse` → `nextRoom`; `tests/fixtureLoadPath.test.ts` already has a `repair` helper and `FIXTURES` list to extend.
- **CI-at-ship lines really printed** (gh, plain command, sandbox disabled): job 124766298916 `Smoke check (deploy)` → `ok   precache covers room pictures — 79 of 79 room pictures precached` (37+21+21; +21 = 100); job 124765733845 → `Tests  4182 passed | 3 skipped (4185)` (step `Run npm test`, ANSI stripped) and `e2e hook: absent (2 chunks checked)` (step `Run npm run build`).
- **Phase-1 gates green on their own**: room unreachable (not in `HOUSES`); `roomArt` snapshot/count/orphan/key/label/weight tests are edited in the same phase as the files; `scripts/check-deploy.ts` derives from `ROOM_ART` and `tests/deployCheck.test.ts` pins no count; `tests/bootBudget.test.ts` `it.each(Object.keys(ROOMS))` covers `hangar` (research: 29.9 s vs 48 s); no e2e iterates all rooms.
- **Follow-ups whose trigger names this slice**: base-cross-section 5 (S-30) included; first-building-choice 5 / kitchen-room 5 (atlas, budget) carried with the measured headroom; kitchen-room 6 (precache set) and audit-art-renderer 2 (`make-task-art.mjs` `-I`) already closed by earlier slices (F3); first-building-choice 18 / base-cross-section 8 not fired, carried; save-observability / health-lines "a second room" long fired by the kitchen.
- **Drivers**: P1 `impl` (art pipeline + data glue, invariant tests exist) ✓; P2 `tdd` (the `HOUSES` row is absent, flipped unit cases lead red-first) ✓; P3 `impl` (docs, sweep, visual) ✓; P4 `e2e` (rendered Hangar miniature in `ground-right` and the two-module card flow are browser-level, built by P1-P2, after the P3 seam sweep, contract `E2E=on`) ✓.
- **Product decisions vs PRD**: FR-046/FR-047 satisfied (after Mostek the next module opens; the Hangar stays as last module like Mostek did). Author-owned costs, wording and last-module behaviour each carry a `[human]` row (3.7, 3.8). No overturn.

## Findings

### F1 — A fourth test flips that the plan calls unchanged

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Current State Analysis "Tests that pin a one-room base"; Phase 2 §3 `houseCells`
- **Detail**: `tests/houseCells.test.ts` "shows the bridge as current and the rest closed, also with the Mostek done" calls `houseCells(b(), base, 'bridge', () => true)`. `houseCells` (`src/core/houseCells.ts`) marks any non-current room whose `doneOf` is true as `done`, so once the Hangar row exists the all-true callback turns `ground-right` into `done` and the expectation `['current','closed','closed','closed']` goes red. The plan listed it as "(unchanged)".
- **Fix**: Plan edited: the line becomes `doneSet('bridge')` (Mostek done, Hangar not) and stays `['current','closed','closed','closed']`; Current State lists the test; brief count corrected.
- **Decision**: FIXED

### F2 — `houseRoomList` shape left vague

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 §3 `roomsData`
- **Detail**: The plan wrote `[{ room: 'bridge' }, { room: 'hangar' }]` "(shape as the helper returns it)"; `houseRoomList` returns `{ room: 'hangar', unlockAfter: 'bridge' }` for a second room (`src/core/house.ts`, `tests/house.test.ts`).
- **Fix**: Plan edited to the exact shape.
- **Decision**: FIXED

### F3 — Two follow-ups named as firing are already closed

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §1 follow-ups; handoff §5
- **Detail**: Kitchen-room 6 ("the precache set") was closed by first-building-choice follow-up 6 (install warning added by house-cross-section); audit-art-renderer 2 (`make-task-art.mjs` without `-I`) was closed by house-cross-section (`execFileSync('python3', ['-I', …])` present). The plan said kitchen-room 6 "fires and must be handled".
- **Fix**: Plan edited: cite both as closed, do not reopen.
- **Decision**: FIXED

### F4 — Hangar art snapshot could be self-referential

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 §4 Tests
- **Detail**: `tests/fixtures/room-art-hangar.json` dumped from `roomArt(ROOMS.hangar)` would prove nothing about the table. The size test reads the WebP files, so only keys/labels would be unproven.
- **Fix**: Plan edited: the fixture is written from the pack (manifest file names, PNG sizes, caption table), not dumped from `roomArt()`.
- **Decision**: FIXED

## Not findings (checked, fine)

- Phase sizing: four phases, each one fresh-agent sized; phase 3 is the largest (docs + 8 frames × 2 widths) but has no code.
- The e2e #12 rendered-pixel check at `ground-right` (closed airlock) stays valid: with Mostek current and the Hangar not done the cell is `closed`.
- Phase-4 load sensitivity (7 + 14 purchases) is already in `## Known risks`.

VERDICT: PROCEED — plan is data-and-art only as the roadmap Risk demands, verified against code; one missed test flip and three precision gaps fixed in plan.md.
