<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Rooms and the house as game data, save format v5 carrying the house

- **Plan**: context/changes/rooms-as-data/plan.md
- **Mode**: Deep (claims verified inline against the code; no sub-agent — the risky claims were a handful of greps)
- **Date**: 2026-10-30
- **Verdict**: SOUND after triage (REVISE before: 2 warnings fixed in plan.md)
- **Findings**: 0 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, F2 — fixed in plan) |
| Plan Completeness | WARNING (F3, F4 — fixed in plan) |

## Grounding

Paths 8/8 ✓ (`src/core/save.ts`, `src/core/rooms.ts`, `src/core/artPick.ts`, `src/data/rooms.ts`, `src/data/roomArt.ts`,
`src/scenes/RoomScene.ts`, `src/ui/widgets/RoomDoneCard.ts`, `scripts/make-task-art.mjs`); symbols ✓ (`roomsListView`,
`repairCurrentRoom`, `miniatureMode`, `SCENE_FILES`, `SALON_ART`, `ROOM_ORDER`, `BOARD_JOBS`, `freshSession` in 4 src + 4
test files, `RoomDef.name` read only by `UIScene` `roomName`); brief↔plan ✓. `lessons.md` and
`docs/reference/contract-surfaces.md` absent (nothing applied). Progress↔Phase: 7 phase headings, 7 `Driver:` lines, 35
Progress rows matching the Success Criteria bullets one-to-one, no checkboxes outside `## Progress`.

## Orchestrator questions answered

**Kitchen cell in the F-04 data house — is a finished-salon child routed to a non-existent kitchen?** No, proven from the code:
- `roomsListView` (`src/core/rooms.ts`) maps a `{ teaser: true, unlockAfter }` entry to `kind: 'teaser', id: null`; the plan's
  `houseRoomList` emits exactly that for the unknown `kitchen` cell, i.e. today's `ROOM_ORDER` literal (salon + teaser).
- `roomInRenovation` reads only rooms present in `known` (`ROOMS`, which has no kitchen) → `null` for a finished salon →
  `nextRoom` keeps `currentRoom`; `repairCurrentRoom` still repairs against `Object.keys(ROOMS)`; `RoomScene.resolve` falls
  back to `ROOMS[FIRST_ROOM]` anyway.
- The plan proved this only on synthetic rooms; F1 adds the proof on the real data and in the browser.

**Does F-04 alone change anything visible for a child?** No child-visible change: the card list equals today's literal,
the art table is snapshot-equal, the art script is byte-identical, the thumbnail fallback for the salon is the same
`salonAfter`. One parent-only change was undeclared (F3).

**Drivers.** 1 tdd (house rules absent, literal oracles), 2 tdd (`MIGRATIONS[4]`/`house` check absent), 3 impl (glue),
4 impl (widget, small pure change), 5 impl (byte-identity refactor), 6 impl (docs + seam sweep), 7 e2e (browser-level risk
#10/#2, after the seam sweep, features built by 2-4). All right; none changed.

**Triggered follow-ups.** Checked every archive `Trigger:` naming v5 / the next save-format change / a second room / G-3:
stale-tab-and-health (earlier stale signal — closed by history; P-8 first `backup-v3` — closed; two-build e2e — re-recorded +
`[human]` 6.8), save-truth SV2-13 and §15, child-flow-guards GRD-09, minigame S13-06, health-lines G-3 (in scope),
final-art-salon / salon-extra-slots / salon-style atlas and VO2/F5/F7, final-art-p2 thumbnail, save-observability F3/M-R5.
Each is included or deferred with a reason in change.md and phase 6 § 2. Convincing.

## Findings

### F1 — The "finished salon stays in the salon" guarantee had no test on real data or in the browser

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 § 4 Tests, Phase 3 § 3 e2e seam, Phase 7 third test
- **Detail**: The kitchen cell is safe only because `roomInRenovation` skips unknown rooms; that was tested on synthetic
  rooms. The phase-7 done-card test duplicated `tests/e2e/room-change.spec.ts` (which already asserts the salon-done +
  unlocked-teaser items) and never reloaded, so the load-time `nextRoom` on a finished salon was never exercised. The hook's
  `room.roomId` reports `room.id` after the `ROOMS[id] ?? ROOMS[FIRST_ROOM]` fallback, so it could not even see a wrong move.
- **Fix**: Phase 3: a data test (finished `SALON` state → `roomInRenovation` null, `nextRoom` keeps salon, no `kitchen` key)
  and the hook snapshot gains the raw registry `currentRoom`. Phase 7: the third test becomes "a finished salon reopens in
  the salon" (finish, check card, `page.reload()`, `currentRoom === 'salon'`, no `kitchen` state), with a deliberate break
  (`roomInRenovation` returning the unknown cell) in 7.1. E2E count stays +3.
- **Decision**: FIXED (plan.md phases 3, 7, Progress 7.1; decision PR-1)

### F2 — "A merged house that differs" was unspecified; a reference compare writes the save on every start

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 3 § 1 Load path
- **Detail**: Every house helper returns a fresh copy, so `merged !== saved` is always true. A start-time `markDirty` writes
  at once, bumps `generation`, and makes the next write of an already open tab refused by `writeVerdict`
  (`OtherWriterSave`) — today a plain load never writes. That is a multi-tab behaviour change hidden in a "foundation" slice.
- **Fix**: `houseEqual` (structural: id + cells in order) in `src/core/house.ts`, unit-tested in phase 1; the load path
  marks dirty only on `!houseEqual(merged, saved)`; a source guard in phase 3; Known risks names the multi-tab specs that
  would catch it.
  - Strength: keeps today's "a load writes only when something changed" rule.
  - Tradeoff: one more pure helper.
  - Confidence: HIGH — `main.ts` already marks dirty only on `roomRepaired`.
  - Blind spot: none significant.
- **Decision**: FIXED (plan.md phases 1, 3, Known risks; decision PR-2)

### F3 — Undeclared visible change: the parent save summaries switch from "salon" to "Salon"

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 § 3 Card, Progress 6.6
- **Detail**: `SALON.name` is `'salon'` (the id) and `UIScene` `roomName` is `ROOMS[id]?.name ?? id`, so the export,
  import and reset summaries print "salon" today. Phase 4's `roomText.name(id)` prints "Salon". The plan claimed "No visible
  copy change" and the visual row expected "no visible difference". Parent-only and a correction, so not a BLOCKED case.
  Also: phase 4 named "the two `doneCard.show` calls"; `RoomScene` has one (in `redraw`).
- **Fix**: Declared in phase 4 and in visual row 6.6 (phase body and Progress); call count corrected; decision PR-3.
- **Decision**: FIXED

### F4 — Phase 2 test list missed the literal sessions and a v4 encode pin

- **Severity**: 🔎 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 § 5 Tests
- **Detail**: Besides `freshSession(` callers, literal `SessionSave` objects in `tests/save.test.ts` and `tests/rooms.test.ts`
  and `tests/legacySalonMigration.test.ts`'s `toMatchObject({ version: 4, … })` break at v5. The typecheck/test gate would
  surface them, but the list now names them.
- **Fix**: Listed in phase 2 § 5 and Known risks.
- **Decision**: FIXED

### F5 — Every F-04 save stores a `kitchen` cell the build does not ship

- **Severity**: 🔎 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Decision P-2, Phase 2 § 3 House data
- **Detail**: The orchestrator asked whether the data house should hold only shipped rooms. Kept as planned: the cell
  reproduces today's teaser without a special case, `mergeHouse` lets data win for a known house (S-22/S-23 may move it),
  and F1's tests prove it is never routed to. A salon-only house would need a generic teaser rule, i.e. `ROOM_ORDER`
  again.
- **Fix**: Recorded in Known risks and decision PR-1.
- **Decision**: ACCEPTED

## Triage summary

Fixed: F1, F2, F3, F4 · Accepted: F5 · Verdict after fixes: SOUND. No `Driver:` changed; Progress still 35 rows, row text of
6.6 and 7.1 kept identical between phase body and Progress.

VERDICT: PROCEED — the approach is sound; the kitchen cell is provably invisible in F-04 (now tested on real data and after a reload), and the start-time write and the undeclared parent-copy change are fixed in plan.md.
