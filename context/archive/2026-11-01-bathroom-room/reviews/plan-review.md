<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Bathroom, the fourth room of house 1, and a four-tile room-done card

- **Plan**: context/changes/bathroom-room/plan.md
- **Mode**: Deep (code checks done inline by the reviewer, no sub-agent: every risky claim was a handful of greps)
- **Date**: 2026-11-01
- **Verdict**: SOUND (after the triage below; REVISE before it)
- **Findings**: 0 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, fixed) |
| Plan Completeness | WARNING (F1, fixed) |

## Grounding

Paths 7/7 ✓ (`src/ui/widgets/RoomDoneCard.ts`, `src/data/layout.ts`, `src/data/rooms.ts`, `src/data/houses.ts`,
`src/data/pl.ts`, `scripts/make-task-art.mjs`, `designs/martynka-bathroom-v1/{assets/room,assets/furniture,screenshots}`
21 PNGs); new files absent as the tdd drivers need (`src/core/roomDoneLayout.ts`, `tests/roomDoneLayout.test.ts`).
Symbols ✓: `RoomDoneCard.show` centres tiles on `card.left + card.width / 2` and bursts there; `ROOM_DONE_LAYOUT.card`
is `{ left 388, top 220, width 1144, height 560 }`; `tiles.left` read nowhere; `houseCells` gives `closed` to a known room
not reached (so kids-room #2 and house-cross-section stay true); `RoomScene` hides the house button while `blocked`
(`open || this.card`); `celebration.ts` has `'room' | 'house' | 'street'`; `ROUND_SPEC` in `playwright.config.ts` exists
(phase 6 adds `bathroom-room`); manifest slots (tub 468,284 441×492 z20 … ducks 1300,316 193×129 z15) equal the plan's
literals; `roomsData.test.ts` iterates `roomText.variant` per slot (phase-3 copy break is real) and pins the placement
count (`toHaveLength(1)`, the exemption target); test-plan risks #2/#16 and the single-spec command in
`context/foundation/test-stack.md` exist. Arithmetic of phase 1 checked: n=3 → 418 (today's `first`), n=4 → 202/1516,
n=5 → 16/1888; phase-2 breaks (minWidth 1100 → 1140 ≠ 1144; padding 60 → 1948 > 1920) turn red. brief↔plan ✓.

Drivers: 1 tdd (pure helper absent) ✓; 2 impl (glue) ✓; 3 impl (art + data) ✓; 4 tdd (`HOUSES` row absent, flipped
cases red first) ✓; 5 impl (docs, seam sweep, visual) ✓; 6 e2e after the phase-5 seam sweep, feature built by 1-4,
E2E=on ✓. Full e2e suite: only the orchestrator after phase 6; every phase row names single specs ✓ (scope.md).

Follow-ups whose `Trigger:` names this slice: kids-room 1 (S-31, in scope), 3 (`ROOM_DONE_LAYOUT`), 11 /
house-cross-section 21 (celebration card), final-art-salon F2 (`RoomDoneCard`), hangar 4, kids-room 7 — all in phase 5
or 6. Missed: kids-room 10 / kitchen-room 6 (precache set) — F2.

## Findings

### F1 — Removing `card.left`/`card.width` breaks a layout test the plan says keeps passing

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Tests
- **Detail**: `tests/layout.test.ts` "keeps the mode button and the "Pokój gotowy!" button touch targets…" builds
  `rect(card)` from `ROOM_DONE_LAYOUT.card` (left/width) and checks the card above `tray.top`, inside the scene, clear of
  the HUD and holding "Dalej". Phase 2 removes `left`/`width` (P2), so the test no longer typechecks, yet the plan said it
  "keeps passing".
- **Fix**: rewrite that test to build the card rect from `roomDoneCardRect(n, …)` for n 2..5 and keep every assertion.
- **Decision**: FIXED (phase 2 Tests contract)

### F2 — The precache-set follow-up fires and is not named

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 — Docs (follow-ups)
- **Detail**: kids-room 10 and kitchen-room 6 (service-worker install warning) carry `Trigger: … or to the precache
  set`; phase 3 grows the precache by 21 room pictures. The plan's catch-all names files, not the precache set.
- **Fix**: phase 5 re-records them with the new count, warning unchanged.
- **Decision**: FIXED (phase 5 follow-up list)

### F3 — The phase-6 tile pixel candidate sits on the caption line

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 6 — Spec
- **Detail**: (1518, 560) is the tile centre x; the caption is centred there at y 372 + 172 = 544 in a 36 px `bar` style, so
  the pixel may hit a glyph and flake. The plan already says "re-measured".
- **Fix**: candidate moved to (1370, 560), left of the caption text.
- **Decision**: FIXED

### F4 — Product decisions against PRD/roadmap text are named for the owner

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Autonomous decisions P3, P4, P5
- **Detail**: P5 keeps the 'room' celebration for the house-completing bathroom against FR-040's literal 'house'
  intensity; the finished-house moment (residents FR-034, sticker) is roadmap S-24, so building the 'house' look now
  would pre-empt S-24 with no art. Not clearly wrong → kept; `[human]` rows 5.8 (costs), 5.9 (wording vs roadmap
  "szafka"/"półka z kaczuszkami"), 5.10 (celebration) exist, and a follow-up with `Trigger: S-24` is planned.
- **Fix**: none.
- **Decision**: RECORDED

### F5 — Phase 6 purchase run is long under machine load

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phase 6 test 1
- **Detail**: 35 purchases across four rooms in one test; already in `## Known risks` with the `--last-failed
  --workers=1` judgement and the kids-room timeout precedent.
- **Fix**: none.
- **Decision**: RECORDED

VERDICT: PROCEED — the plan is grounded in the code (card maths, house cells, hidden house button, manifest literals all verified), drivers and the e2e rule are right, and the two warnings were narrow plan edits now applied.
