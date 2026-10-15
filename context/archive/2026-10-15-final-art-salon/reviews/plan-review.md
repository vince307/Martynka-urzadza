<!-- PLAN-REVIEW-REPORT -->
# Plan Review: S-16a `final-art-salon` — plan implementacji

- **Plan**: `context/changes/final-art-salon/plan.md`
- **Mode**: Deep (claims checked directly against the code; no sub-agent)
- **Date**: 2026-10-15
- **Verdict**: REVISE → SOUND after the fixes below (applied to plan.md in this step)
- **Findings**: 2 critical, 4 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | FAIL → fixed (F1) |
| Lean Execution | PASS |
| Architectural Fitness | WARNING → fixed (F3) |
| Blind Spots | WARNING → fixed (F4, F6) |
| Plan Completeness | WARNING → fixed (F2, F5, F7, F9) |

## Grounding

Paths 13/13 ✓ (`scripts/make-task-art.mjs`, `src/data/taskArt.ts`, `tests/taskArt.test.ts`, `src/ui/widgets/UnlockCard.ts`,
`src/ui/widgets/ArtImage.ts`, `src/core/artHealth.ts`, `src/ui/dom/artHealthView.ts`, `src/ui/motion.ts`,
`docs/designer-brief-s16.md`, `docs/art-inventory.md`, `public/assets/tasks/icons/book.webp`,
`designs/martynka-expansion-v1/manifest.json` with 4 room layers + 22 furniture PNGs = 26 outputs).
Symbols ✓: `repairCurrentRoom` (`src/main.ts` `start`, after `loadSave`, before `createGame`), `UIScene.openImport`
`summarize: saveSummary(s, ROOMS)`, `deviceSaveView(saver.status(), saver.current(), ROOMS)` (`current()` encodes the
registry snapshot, so it already sees the remapped state), `E2ESaveSeam`/`E2EArtSeam` + markers `e2eSave`/`e2eArt` in
`vite/e2eHookGuard.mjs`, `TaskScene.shake` without a `prefersReducedMotion` guard, Phaser `getPixelAlpha(x, y, key, frame?)`
in `node_modules/phaser/types/phaser.d.ts`, `MINIGAME_WORDS` + the Ó/Ł assertion in `tests/wordRound.test.ts`,
`SALON_PLACEHOLDERS` in `tests/e2e/room-change.spec.ts`. Remap arithmetic re-done by hand: old cumulative 5, 11, 18, 26,
35, 45, 56, 68, 81, 96; new 5, 12, 21, 31, 43, 56, 71 → rule B gives 0,1,2,3,4,5,6,6,7,7,7 ✓. brief↔plan ✓.
Progress↔phases ✓ (criteria = rows: 3, 5, 5, 7, 4, 4, 4, 3, 4, 4; one `## Progress`; no checkboxes in phase bodies).
Follow-ups with `Trigger: S-16` (archives adaptive-curriculum, task-round-stars, first-furniture-purchase,
variant-change-room-done, observability-c1-c2, art-tasks-all-stages, e1-shapes-picture-mode): every one is either in
scope or re-triggered in phase 9; the purchase/change sound was missing from that list (F9, fixed).

## Product decisions checked against the PRD and the maintainer rules

- **Remap rule B** (shortest new prefix ≥ stars spent, variants carried, no refund): consistent with "stars never taken
  away" (`src/core/stars.ts` invariant untouched) and "nothing bought lost silently" — every old furniture piece lands
  in the new prefix. Not clearly wrong → kept; the `[human]` row 2.5 now also names the two consequences the maintainer
  must accept: gifted furniture gets variant 0, and old `tasksDone` 9–10 (81/96 stars) map to a complete 71-star room
  with no refund of the surplus.
- **Save format stays v2**: the remap needs no new field (marker = an old slot key in `chosen.salon`); `validRoom`
  accepts the new keys; frozen fixtures use room `living` / an empty salon and are never touched (criterion 2.2). ✓
- **Phase 3 size**: kept as one phase (F8) — see Known risks in plan.md.
- **Drivers**: tdd for phases 1–3 (stage kind, `remapLegacySalon`, alpha/z hit-test do not exist; failing tests lead) ✓;
  impl for 4–9 (asset pipeline, rendering, docs; phase 9 is the seam sweep) ✓; e2e for phase 10 only, after the seam
  sweep, contract `E2E=on`, feature built in 1–8 ✓. No driver changed.

## Findings

### F1 — Furniture gifted by the remap has no `chosen` entry and would be invisible

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 2 — Funkcja przeliczenia / Testy; Phase 10 (b)
- **Detail**: Rule B rounds up, so the new prefix often contains a furniture task the child never bought (old
  `tasksDone` 2 → stage + sofa; the e2e seam's 4 → stage, sofa, rug, coffee-table). The plan only carries variants
  "według mapy nazw". `slotAt`, `holdPoint` (`src/core/roomHit.ts`) and `RoomView.render` treat a slot with
  `chosen[slot.id] === undefined` as empty, so that task would count as done while its furniture is never drawn and
  can never be changed — the room could never look complete.
- **Fix**: every `slot` task in the new prefix gets a `chosen` entry (carried variant or 0); unit-test invariant; e2e (b)
  asserts `chosen.rug`/`chosen['coffee-table']` 0 and slot targets present.
- **Decision**: FIXED (plan.md phase 2 Intent + tests, phase 10 (b), `[human]` 2.5)

### F2 — Remap test demands "new prefix cost ≥ old" for every old `tasksDone` 0–10, impossible for 9 and 10

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Testy
- **Detail**: Old 9 and 10 spent 81 and 96 stars; the whole new list costs 71. The test as written cannot pass; a TDD
  agent would either weaken it ad hoc or stall.
- **Fix**: "≥ old, or the new list is complete"; the surplus is named in `[human]` 2.5.
- **Decision**: FIXED

### F3 — Manifest `z` used as Phaser depth would put furniture over the room controls

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architectural Fitness
- **Location**: Phase 3 (stand-ins at depth `z`), Phase 5 (`RoomLayer.show(…, depth, …)`), Phase 7 (pop at `setDepth(z)`)
- **Detail**: Manifest `z` runs 5–60. Today `RoomView.outline` is depth 1, `RoomDoneCard` depth 5, the variant panel and
  the task button default 0 — the sofa (30) or pouf (60) would cover the panel tray, the hold outline and the "Pokój
  gotowy!" card.
- **Fix**: depth band — room layers 0–99 by `z`, controls at fixed depths above it from `ROOM_LAYOUT.depth` (layout.ts).
  Strength: keeps V2 (pop at its own depth) without a Container sort. Tradeoff: one more layout token group.
  Confidence: HIGH — depths read from the widgets. Blind spot: the particle emitter's depth in `RoomScene.celebrate`.
- **Decision**: FIXED (phase 3 change 4 + contract, phase 5 contract)

### F4 — Phase 10 claims "after reload the same (saved)" with an in-memory seam store

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 10 (b)
- **Detail**: `e2eSaveStore` (`src/testing/e2eHook.ts`) builds its value from the seam on every page load, so a reload
  re-reads the legacy save; it proves idempotent re-remap, not persistence. The remap also triggers no write by itself.
- **Fix**: persistence proven by the seam log (`writtenVersion` 2 after the next change); reload described as re-remap.
- **Decision**: FIXED

### F5 — `du -cb` does not exist on macOS

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 criterion 4.3 (and its Progress row)
- **Detail**: `du: invalid option -- b` observed on this machine.
- **Fix**: `cat public/assets/rooms/salon/*.webp | wc -c`.
- **Decision**: FIXED (criterion and Progress row 4.3 together)

### F6 — OBRAZKI makes the word minigame round 7 tasks / 7 letter boxes

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 — Copy i słowa
- **Detail**: `buildWordRound` draws one task per letter (`Array.from(word).length`); today's longest words have 6
  letters. A 7-letter word lengthens the round, the letter row and the star pace, unmentioned in the plan.
- **Fix**: test that the longest word's `letterRow` fits and `buildWordRound` succeeds on every stage; fallback to a
  shorter caption recorded in Known risks; pace → S-17.
- **Decision**: FIXED

### F7 — Inline test rooms outside the listed files

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phases 1 and 3 — Testy
- **Detail**: `tests/save.test.ts` and `tests/saveFile.test.ts` define inline `SlotDef`/`RoomTaskDef` objects that the
  `kind` union (phase 1) and the new `SlotDef` shape (phase 3) break at typecheck.
- **Fix**: listed in both phases.
- **Decision**: FIXED

### F8 — Phase 3 is the largest phase

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Lean Execution
- **Location**: Phase 3
- **Detail**: ~17 small files. The type switch, data, copy, minigame words and the three salon specs must land together
  for a green typecheck + e2e at the phase commit; a split would first re-express the old 10 slots in the new geometry
  only to delete them one phase later.
- **Fix**: kept as one phase; Known risks tells the phase agent to return `NEEDS_CONTINUATION` (never commit without a
  green e2e) if it nears the context limit.
- **Decision**: ACCEPTED (recorded in plan.md `## Known risks`)

### F9 — Purchase/change sound not in the phase 9 re-trigger list

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 9 — Follow-upy
- **Detail**: Archive follow-ups (first-furniture-purchase, variant-change-room-done) with `Trigger: S-16` name the
  purchase sound (`playPurchaseSound`) and the change sound; "What We're NOT Doing" mentions them, phase 9 did not.
- **Fix**: added `→ S-16b`.
- **Decision**: FIXED

### F10 — Phase 5 and 7 deliberate breaks prove nothing automatically

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phases 5, 7
- **Detail**: Both breaks admit the e2e may stay green; their proof is the visual gate.
- **Fix**: Known risks makes `[visual]` 5.3 and 7.4 non-skippable.
- **Decision**: ACCEPTED

VERDICT: PROCEED — approach sound; two critical remap gaps (gifted furniture without `chosen`, an unsatisfiable test bound) and four warnings fixed in plan.md, drivers correct, save format stays v2, rule B kept under `[human]` 2.5.
