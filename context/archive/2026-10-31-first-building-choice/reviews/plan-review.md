<!-- PLAN-REVIEW-REPORT -->
# Plan Review: "Co urządzamy najpierw?" (Dom or Baza kosmiczna) and the Mostek module

- **Plan**: context/changes/first-building-choice/plan.md
- **Mode**: Deep (code checked directly by this step, no sub-agent: the risky claims were few and greppable)
- **Date**: 2026-10-31
- **Verdict**: REVISE → SOUND after the in-place fixes below
- **Findings**: 3 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F4, F5) |
| Plan Completeness | FAIL before fixes (F1-F3: three success criteria could not pass as written), PASS after |

## Grounding

Grounding: 12/12 paths ✓ (`tests/ageBack.test.ts`, `house.test.ts`, `saveV5.test.ts`, `fixtureLoadPath.test.ts`, `roomsData.test.ts`, `bootBudget.test.ts`, `artHealth.test.ts`, `deployCheck.test.ts`, `houseWiring.test.ts`, `freshRoundWiring.test.ts`, `scripts/check-deploy.ts`, `tests/e2e/support/welcome.ts`), symbols ✓ (`repairCurrentRoom(…, Object.keys(ROOMS), FIRST_ROOM)` in `src/main.ts`, `ageBackOffered`/`firstRoundDone` in `src/core/placement.ts`, `houseLayout`/`mergeHouse`/`nextRoom` in `src/core/house.ts`, `ROOM_PACKS` kitchen row in `scripts/make-task-art.mjs`, `RoomArtLoader.ensure`/`attachLoader`, `bootRoomArt` salon fallback, `houseButton` in `RoomScene.redraw`; `themeBackOffered`, `houseRoomIds`, `buildingStart`, `BUILDING_CHOICES` absent → tdd drivers of phases 1-2 are right), brief↔plan ✓ (9 phases, P1-P12 match). Pack ✓: `designs/bystrow-space-base-v1/assets/{room,furniture,choice}` hold exactly the 3 + 18 + 2 files the plan names; manifest `rooms.bridge.slots` = the six ids of phase 3. Last gap row is 190 → "from 191" ✓. Progress↔phase: 54 rows = 54 criteria, one `## Progress`, no checkboxes in phase bodies ✓.

Frozen fixture proof (prompt check): `save-v5-salon.json` is produced in phase 1 while `SAVE_VERSION` is 5, guarded by `git diff --stat fc13e8c -- src/core/save.ts src/core/migrations …` (1.3) and proven by decode + `encodeSave` round-trip on that unchanged code; the store-stamped `generation`/`writer` are the only hand-set fields, matching `writeVerdict` (`src/core/save.ts`). Same pattern as `save-v4-salon.json` in rooms-as-data. Phase 2's oracles are a literal spread of that file. Genuine ✓.

Drivers (prompt check): 1 tdd (two absent pure rules + fixture acceptance, red-first) ✓; 2 tdd (`MIGRATIONS[5]` absent) ✓; 3 impl (art + data) ✓; 4 impl — see F7; 5-8 impl ✓; 9 e2e after the phase-8 seam sweep, over features of phases 2-7, contract `E2E=on` ✓.

Product decisions (prompt check): the parent path still reaches the choice view (phase 6: the stage panel's `onConfirm` stores the placement and switches to `choice`) — the child chooses ✓. Order age → theme → warm-up ✓. Speaker reads question and both names (`pl.welcome.choice.spoken`), auto-read untouched ✓. P3 — see F6.

## Findings

### F1 — Phase 3 breaks `tests/houseCells.test.ts`, which the plan does not list

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §3 Tests / §4 The base building
- **Detail**: `tests/houseCells.test.ts` `HOUSE_GEOMETRY data` has "has a geometry for every house" (`for (const h of HOUSES) expect(HOUSE_GEOMETRY[h.id]).toBeDefined()`) and "has a cell for every place of every house". Phase 3 adds `base-1` to `HOUSES` with no geometry by design, so the gate (3.6) goes red on a file the phase never names.
- **Fix**: add `tests/houseCells.test.ts` to phase 3: both cases iterate houses with a geometry entry, plus a pin that the houses without one are exactly `['base-1']` (S-29 drops it).
- **Decision**: FIXED (plan.md phase 3 §3)

### F2 — `grep -c` on the one-line `dist/sw.js` prints 1, not 21 / 2

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 criterion 3.4, Phase 5 criterion 5.4
- **Detail**: on the current build `grep -c "assets/rooms/" dist/sw.js` prints `1` while `grep -o … | sort | uniq -c` shows 37 salon + 21 kitchen. The criteria "= 21" and "= 2" could never pass.
- **Fix**: `grep -o "<path>" dist/sw.js | wc -l` in both criteria and Progress rows.
- **Decision**: FIXED (3.4, 5.4, both in the phase bodies and Progress)

### F3 — Seam-sweep grep for `'(house|space)'` cannot be satisfied

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 8 criterion 8.3
- **Detail**: `'house'` already appears in `src/scenes/HouseScene.ts` (seam, `recordFallback`), `src/core/artHealth.ts` (`LoadTable`), `src/core/artPick.ts` (`FallbackWhere`), `src/core/celebration.ts` (`CelebrationIntensity`) and `src/core/save.ts` (`saveProblem`), none of them in the allowed list. (`--include=*.ts` also fails under zsh globbing without quoting.)
- **Fix**: grep only `'space'` (a new, unique choice id) in `src`, allowed in `houses.ts`, `choiceArt.ts`, `types.ts` and the hook.
- **Decision**: FIXED (8.3 body and Progress)

### F4 — A learner-less save with a purchase would lose it at the choice

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 6 §3 (card tap), Phase 1 §2
- **Detail**: stars are credited per task (`TaskScene.syncStars`) and the room is open between tasks, while today's `ageBackOffered` ignores rooms. So a device can hold a v5 save with `learner: null` and `rooms.salon.tasksDone ≥ 1` (bought during the warm-up, then "Wróć"). `needsPlacement` sends it to the welcome; the new card tap writes `rooms` from `buildingStart(…)` (= `freshSession`'s empty rooms), dropping the bought piece and the stars spent on it — against FR-049's "the same rooms" and the "never lose progress" rule.
- **Fix**: pure `hasPurchase(rooms)` in phase 1 (also the purchase term of `themeBackOffered`); phase 6 skips the choice view and starts in the saved building when it holds; wiring case + deliberate break in 6.2. Choice id unchanged for everyone else.
  - Strength: no purchase can be lost; reuses the P3 reasoning.
  - Tradeoff: such a child is not asked the theme (recorded in `## Known risks`).
  - Confidence: HIGH — per-task star credit and the between-task room switch are in the code (`syncStars`, `roundView.switchVisible`).
  - Blind spot: how many devices hold such a save is unknown (likely very few).
- **Decision**: FIXED (plan.md phases 1 and 6, Progress 6.2, Known risks)

### F5 — Follow-ups fired by `BootScene.preload` and the v6 format not named

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 8 §1
- **Detail**: phase 5 changes `BootScene.preload`, which fires `context/archive/2026-10-15-salon-load-health/follow-ups/review-fixes.md` ("time limit of the second font load (`FontFace`)", "per-file loader timeout guarded only by e2e") and `2026-10-14-art-stand-in-and-load-signal` S14-08; v6 fires `2026-10-14-minigame-daily-puzzle` "the next save-format change or S-17". The plan covered them only by a generic clause. The rooms-as-data 8/9/10/15, kitchen 6, N-2, F4 and #16 triggers are handled explicitly and convincingly (research § follow-ups).
- **Fix**: name the four in phase 8 §1, each closed with evidence or re-recorded.
- **Decision**: FIXED (plan.md phase 8 §1)

### F6 — P3 narrows FR-043 ("Wróć" hidden after a purchase)

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: End-State Alignment
- **Location**: Phase 1 `themeBackOffered`, decision P3, row 8.7
- **Detail**: judged sound. Switching building after a purchase either drops the bought piece with its stars (`buildingStart` replaces `rooms`) or needs a refund (a second star source, against FR-035) or two buildings at once (against scope). Hiding is the only option inside the maintainer's other decisions. The plan also widens the back to the parent path, which the maintainer's "the child chooses the theme on the parent path" requires. A `[human]` row (8.7) names it. Not overturned.
- **Decision**: RECORDED

### F7 — Phase 4 driver `impl` while `buildingStart` is new pure logic

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 `Driver:`
- **Detail**: `buildingStart` is new, but it is a pick over `freshSession` plus a named throw; the rest of the phase is data, wiring and characterization tests (FR-050 already holds), which a red-first loop cannot lead. Each new rule has a deliberate break (4.2). `impl` is defensible; not changed.
- **Decision**: RECORDED

### F8 — First-session room art on a fresh install is not judged by "Obrazki"

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 §2
- **Detail**: room health over `[]` plus runtime loading means a missing Mostek/salon picture in the first session is a stand-in box only; the next launch's boot judges it. Acceptable for one session.
- **Decision**: RECORDED (plan.md `## Known risks`)

## Triage summary (autonomous, no AskUserQuestion)

Fixed: F1, F2, F3, F4, F5 · Recorded: F6, F7, F8 · Progress rows: 54 (unchanged count; 3.4, 5.4, 6.2, 8.3 texts updated in body and Progress alike).

VERDICT: PROCEED — the approach (v6 bump over a v5-frozen fixture, base as data, choice as a WelcomeScene view) is sound; three unsatisfiable criteria, a missing test file and a purchase-loss edge were fixed in plan.md.
