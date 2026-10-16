<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Child-flow guards for tasks, widgets and gestures

- **Plan**: context/changes/child-flow-guards/plan.md
- **Mode**: Deep (code checked directly by the reviewer; no sub-agent)
- **Date**: 2026-10-16
- **Verdict**: SOUND after triage (REVISE before: 1 critical)
- **Findings**: 1 critical, 1 warning, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | FAIL → PASS after F1 fix |
| Plan Completeness | WARNING → PASS after F2 fix |

## Grounding

Grounding: 37/37 named paths ✓ (all `src/` files and every test file the plan calls existing), symbols ✓
(`artBlocked`, `withPictures` call with `afterArt.current.length`, `skillBuckets` review branch `earlier: []`,
`unlockReady`, `captureFirstWrong`/`exampleAnswer`, `validExample`, `Task.check` boolean, `canonicalInput` used by tests
only, the four `TaskScene.create` pointer listeners with id-less `cancel`, clock OK guarded by `clockState.carrying`,
`countRound`/`finishVariant`/`applyRound`, `keypad.maxDigits` 7, ORDINAL `rng.shuffle(ICONS)`), brief↔plan ✓.
Progress↔Phase: 14/14 headings, every success-criteria bullet has its row, no checkboxes in phase blocks ✓.
Drivers: 1-10, 12 `tdd` (new pure rules or changed behaviour with exact oracles), 11 and 13 `impl` (guards, types,
glue, docs), 14 `e2e` after the seam-sweep phase 13, features built in phases 4 and 10, E2E=on ✓.
Save format: no phase changes the save shape; phase 3 changes only the content of new examples (`given`/`answer` as
string, already valid under `validExample`); phase 4 changes only write timing ✓ (stays v4).
Design docs: `docs/ZADANIA.md` l.37 gives ~60/30/10 for ordinary steps and does not name the review step;
`Martynka-urzadza.md` and ZADANIA are silent on COMPARE_QTY tile order.
Follow-ups with a `Trigger:` in this area (change.md table): each is either in a phase or carried with a reason that holds
(format change, no kit view, pure dedup with no child impact) ✓.
`?e2eVariant=puzzle` keeps the day rule (`src/core/variants.ts` `nextRoundKind`), so phase 14 (a) can go red/green ✓.

## Findings

### F1 — Variant-counted flag reset in the wrong place

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details "SV2-10 ordering"; Phase 4 § 2-3
- **Detail**: The plan resets `variantCounted` (and clears `reported`) in `beginRound` "where it sets `this.kind`". In code
  `this.kind` is set in `applyRound` (`src/scenes/TaskScene.ts`), which is also called from `create` and
  `applyParentStage`. A puzzle answered (flag set) and then a parent stage change before "Dalej" would open the next
  round without a reset; the next variant round would never be counted, so its puzzle could be paid ×2 again — the very
  defect SV2-10 closes.
- **Fix**: reset the flag and clear `reported` in `applyRound`; the wiring source test checks `applyRound`.
- **Decision**: FIXED (plan.md Critical Implementation Details and Phase 4 § 2-3 edited)

### F2 — Product decisions without a `[human]` row

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 (TXT-01), Phase 6 (PIC-06); Autonomous decisions 1 and 9
- **Detail**: The review-step share 90/10 is a reasonable reading of ZADANIA l.37 (not clearly wrong, so not overturned),
  but ZADANIA does not name the review step and S-14c pinned ≈ 14 % on purpose. The COMPARE_QTY order has no source at
  all (gap 125). Both change what the child sees and need the maintainer's acceptance; the wallet line already has 5.7.
- **Fix**: `[human]` rows 2.7 (review share) and 6.7 (tile order) added to the phase blocks and Progress; decisions 1
  and 9 updated.
- **Decision**: FIXED

### F3 — Legacy wallet examples in the preview

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 § 2
- **Detail**: Saved v4 examples may already hold a wallet `answer` as `number[]` of grosze (`exampleAnswer` today); new
  ones become a string. Both are valid, but the test list named only an old numeric example.
- **Fix**: the Phase 3 test contract now also requires an old `number[]` answer to render.
- **Decision**: FIXED

### F4 — Shared art frames in `visualArtIds`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 § 3
- **Detail**: `TASK_ART` also holds `balance-scale` and `thermometer-frame`, used by every scale/thermometer task. Listing
  them would make each such task burn all `artRetries` without a chance of success; the plan did not say.
- **Fix**: the contract now excludes the shared frames explicitly (their loss stays with the stand-in and "Obrazki").
- **Decision**: FIXED

### F5 — A deliberate break that fails by hanging

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 7 Success Criteria
- **Detail**: "`drawUntil` without the cap → its test times out" proves the bound only through the 30 s vitest timeout.
- **Fix**: the criterion now asks for a call-counting test whose draw throws after `max + 1` calls (red by assertion).
  Progress row 7.2 keeps its title.
- **Decision**: FIXED

### F6 — `CLAUDE.md` written before the last spec

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 13 § 3, Phase 14
- **Detail**: The paragraph lands in phase 13, the new spec in phase 14.
- **Fix**: Known risks entry: phase 14 appends the spec name to the paragraph.
- **Decision**: FIXED (Known risks)

## Checked and fine (no finding)

- Phase sizes: each phase touches one rule cluster plus at most one scene/widget call site; phases 1, 9, 10 are the
  largest and still one fresh agent each. No split or merge needed.
- TXT-04: `unlockReady` returning null on a review step is only reachable for a review step that is not last; the plan
  pins "review is last" by a content test and a synthetic stage, which is the right proof.
- PIC-01 threshold (`ICONS` loaded < `max`) plus the G-4 redraw: with one icon missing the redraw avoids it in most draws;
  exhausted retries fall back to today's stand-in, as the plan states.
- TXT-03 strict oracle: `canonicalInput` has no runtime caller (tests only), so tightening it cannot affect a child.

VERDICT: PROCEED — the approach is sound and grounded in the code; one wrong reset point (F1) and two missing `[human]` acceptance rows (F2) are fixed in plan.md, the rest recorded.
