<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Kitchen in stages and the salon on cream (house-1 polish)

- **Plan**: context/changes/house-1-polish/plan.md
- **Mode**: Deep (claims checked against the code directly in this step, no sub-agent: the risky claims were few and greppable)
- **Date**: 2026-11-01
- **Verdict**: SOUND (after the fixes below were applied to plan.md)
- **Findings**: 0 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, fixed) |
| Plan Completeness | WARNING (F2, F3, fixed) |

## Grounding

Branch `feat/house-1-polish` ✓. Paths 8/8 ✓ (`src/core/save.ts`, `src/core/migrations/building.ts`, `src/data/rooms.ts`,
`scripts/make-task-art.mjs`, `src/testing/e2eHook.ts`, `playwright.config.ts` `ROUND_SPEC`, `tests/rooms.test.ts` "ternary"
case, `designs/martynka-house-1-polish-v1/assets/room/{kitchen-stage-1,kitchen-stage-2,salon-*-cream}.png`). Symbols ✓:
`SAVE_VERSION = 6`, `MIGRATIONS` 1-5, `decodeSave` loops `from..SAVE_VERSION-1` and returns `future` above, `LIFT_V5_BUILDING`
(frozen, no data import), `validRoom`, `roomStateProblems` (`tasks-overflow`, `chosen-not-bought` by slot task index),
`formerTaskCounts` (salon only), `createIdbSaveStore.backup` key `backup-v${from}`, `readBackups` loop, `E2E_SAVE_SEAMS`,
`e2eSaveStore`, `E2ESaveStoreLog`, labels `placeKitchenTable` "Postaw stół i krzesła", `renewFloor`. Fixtures: `save-v6-kitchen-done`
(kitchen 7, `currentRoom` kitchen), `save-v6-children-done` (kitchen 7), `save-v5-salon` (kitchen cell, no kitchen state),
`save-v6` (base-1, bridge only). `cwebp` present. Brief↔plan ✓. Success Criteria ↔ Progress: 6/6, 9/9, 6/6, 5/5, 12/12, 3/3
identical (re-checked after the edits). Deploy: only `deploy/README.md` (docs) changes ✓ (profile § 5).

## Migration audit (the step prompt's hardest check)

| v6 kitchen state | in code | after `MIGRATIONS[6]` | verdict |
|---|---|---|---|
| no `rooms.kitchen` (salon in renovation; base-1 save; house child who went back to the base) | `freshSession` creates only the first room | untouched, `version: 7` | ✓ |
| `tasksDone 0`, `chosen {}` (moved in after "Dalej") | `kitchen-room.spec` `{ tasksDone: 0, chosen: {} }` | untouched | ✓ (0 must not shift: it would mark two stages bought) |
| `tasksDone 1` (old one-step stage) | showed `kitchen/after` | 3 = all three stages, after look | ✓ meaning kept |
| `2..6`, `chosen` keyed by slot id | slot ids unchanged | +2; every slot task index also +2, so `chosen-not-bought` stays consistent | ✓ |
| `7` done (`currentRoom` kitchen or later) | fixtures kitchen-done, children-done | 9 = done; `nextRoom` at load as today | ✓ |
| kitchen visited in change mode | `visiting` is runtime only | n/a | ✓ |
| malformed (string, negative, array) | `validRoom` rejects later | passes through unchanged | ✓ |
| `> 7` (corrupt) | `tasks-overflow` | still overflow | ✓ |

Idempotence: the step runs only from v6 (one pass per save). v5 saves with a kitchen go `[5]` then `[6]`; the kitchen list has
not changed since S-22 (`git log -S place-counter -- src/data/rooms.ts` = one commit), so the +2 is right for them too. Frozen
rule: local constants, source guard test, no `src/data` import ✓. Backup: generic `backup-v${from}` write-once ✓. Import of a v6
export: `parseImport` → `decodeSave` ✓ (unit case in phase 1). Pre-v7 build meeting v7: `future` card on read, `guardedPut`
refuses with `NewerSave` ✓. No defect found that could lose bought furniture → no CRITICAL.

## Follow-ups whose `Trigger:` names this slice

- kids-room 2 / bathroom 11 (`wornPieces`/`contactShadowPieces` for a staged room): included — phase 2 pin, phase 5 re-record ✓.
- kitchen-room 19 / house-cross-section 12 (gap 182, salon on cream): included — phase 5 frames (14)/(15), gap re-judged ✓.
- final-art-salon F / gap 109 (in-between backgrounds): included — closed for the kitchen ✓.
- final-art-salon "future slots appended at the end": included — re-recorded with the version-step exception ✓.
- kitchen-room 13 / hangar 8 (kitchen wording; Trigger "next change to `src/data/rooms.ts` kitchen rows"): fires in phase 2 but was
  only covered by the catch-all → F3, now named.
- pack thumbnails (kitchen-room 4 / kids-room 12 / hangar 4): not fired, carried with the `salonAfter` note ✓.

## Product decisions vs PRD

Save v7 (overturns scope.md's starting decision with evidence: `tasksDone` counts positions; appending stages contradicts FR-033's
"walls and floor first") — `[human]` 5.7 ✓. Costs 5/6/7 + slots = 84 — `[human]` 5.8 ✓. Salon cell fill D4 — `[human]` 5.9 ✓
(scope.md asked for exactly this). Salon before D5 — `[human]` 5.10 ✓. None clearly wrong; none overturned.

## Drivers

1 tdd (pure logic led by literal fixtures) ✓; 2 impl (data + art, invariants exist) ✓; 3 impl (art) ✓; 4 impl (test seam glue) ✓;
5 impl (docs, sweep, visual) ✓; 6 e2e, after the phase-5 seam sweep, features built by 1-4 ✓. Single-spec rule per scope.md ✓.

## Findings

### F1 — Phase 6 test 2 asserts what the in-memory seam cannot show

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 6 — spec contract, test `#2 S-32 FR-021`
- **Detail**: The plan asked the spec to prove "a `backup-v6` copy equal to the fixture" and "reload → still `tasksDone 5`".
  `E2ESaveStoreLog` (`src/testing/e2eHook.ts`) carries only `ops`, `writtenVersion`, `writtenHouse` — no backup bytes, no `from`;
  and `e2eSaveStore` re-seeds the frozen fixture on every page load, so a reload would re-migrate the same v6 bytes and pass
  without proving persistence. The phase-6 agent would either fail or quietly extend the hook.
- **Fix**: assert `migratedFrom: 6`, `writtenVersion 7`, `ops` starting `['write','backup']` with one backup, `save.backup 'done'`;
  leave byte equality and persistence to the unit `fixtureLoadPath` cases; do not extend the hook for it.
- **Decision**: FIXED (plan.md phase 6 contract)

### F2 — Phase-5 diff gate contradicts the phase-5 seam sweep

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 5 — criterion/row 5.4; Phase 4 contract
- **Detail**: The sweep must fix "v6 as the current format" comments in `src/`, `scripts/`, yet 5.4 required an empty diff for
  `src/core`, `src/testing`, `scripts`. Known leftover: the `e2eHook.ts` seam doc says `v5-salon` "lifts it to v6".
- **Fix**: phase 4 rewrites that `v5-salon` doc line; 5.4 allows comment-only lines (listed in the handoff) and adds a grep that
  non-comment diff lines stay empty. Body and Progress row kept identical.
- **Decision**: FIXED

### F3 — Kitchen-wording follow-up fires but is not named

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 5 — follow-ups list
- **Detail**: kitchen-room 13 (carried as hangar 8), Trigger "the next change to `src/data/rooms.ts` kitchen rows", fires in
  phase 2; the plan relied on its catch-all sentence.
- **Fix**: named in phase 5 with the new stage labels and the row-2.8 read; designer wording still owed.
- **Decision**: FIXED

### F4 — Migration audit recorded

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Known risks
- **Detail**: the table above; residual generic `olderWriter` behaviour (an older tab's write before this page's first write is
  overwritten by this page's migrated memory) is unchanged by the slice.
- **Fix**: recorded under `## Known risks`.
- **Decision**: FIXED (recorded)

### F5 — Phase-3 break names two acceptable outcomes

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 — row 3.3
- **Detail**: "exits non-zero … or recolours the cream" — either is red, but the implementer should say which.
- **Fix**: recorded under `## Known risks`: the handoff names the observed outcome.
- **Decision**: FIXED (recorded)

VERDICT: PROCEED — the v6 → v7 kitchen remap is correct for every state a v6 build can store, frozen and once-only; three gaps in assertions and gates were fixed in the plan.
