<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Task headings, round variety cap, "Obrazki" cut lines, skill id on drawing errors

- **Plan**: context/changes/post-run-polish/plan.md
- **Mode**: Deep (code checked directly by the reviewer, no sub-agent: every risky claim sat in a handful of named files)
- **Date**: 2026-10-21
- **Verdict**: SOUND (after the three in-plan fixes below)
- **Findings**: 0 critical, 3 warnings (all fixed in plan.md), 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, fixed) |
| Plan Completeness | WARNING (F1, F3, fixed) |

## Grounding

Paths 10/10 ✓ (`src/core/round/variety.ts`, `src/core/narration/spoken.ts`, `src/core/artHealth.ts`, `src/core/tasks/visual.ts`,
`src/core/tasks/written.ts`, `src/scenes/TaskScene.ts`, `src/scenes/UIScene.ts`, `tests/variety.test.ts`, `tests/e2e/load-and-tab-guard.spec.ts`,
`tests/e2e/narrator.spec.ts`); symbols ✓ (`pickVariedSkills`, `spreadTypes`, `spokenTask`/`NarrationOptions.calculate`, `isExpression`,
`artHealthLines` `background`, `cutByTable`, `assertDrawable` money case skips `pay` today, `columnMarks` RangeError, `coinLayout`
`maxKinds`, `ART_LIMITS.trayKinds` 4 = `TASK_LAYOUT.coinDrag.maxKinds` 4, `pictureCutCount` absent, `headingOf` absent); brief↔plan ✓;
Progress↔Phase 9/9 phases, every criterion 1:1, 9 `Driver:` lines.

Claims re-verified in code:
- `round.calculate` consumers: `TaskScene.currentNarration`, `TaskScene.render` (prompt branch), `scripts/sample.ts`, `tests/spoken.test.ts` only — phase 2 lists all; no e2e spec names "Oblicz".
- F3 repros run on today's code (throwaway vitest, removed): `E2.1` seeds 1 and 21 draw buckets current,current,current,previous,current with types PV,AS,PV,AS,PV (the previous-bucket draw took ADD_SUB from a 24-type pool → avoidable); `E1.10` seed 107 draws earlier,earlier,current,earlier,current with 3 × COUNT (one-type current, an earlier draw took COUNT → avoidable). Red-first is real.
- F3 repair keeps buckets per draw (each draw stays in its rolled pool/group, no rng), so oracle (a) and the 60/30/10 shares per seed stay; unlock thresholds live in `buildAdaptiveRound`'s pool filtering before `variedRound` and are untouched. Two of a type in a row: `spreadTypes` (unchanged, after the repair) guarantees no neighbours whenever the most frequent type has ≤ ceil(5/2) = 3; the repair only lowers the maximum, so it never creates adjacency.
- Seeds: phase 4 and phase 7 prove `npm run sample` byte-identical to their parent commits; phase 2 explains its `czyta:`-only diff (wording corrected, F2); phases 1, 3, 5, 6 touch no generator or narration text.
- e2e `#15 H-1` (`load-and-tab-guard.spec.ts`) pins `pl.settings.artCutBackground`; phase 5 (the removal) adapts it, so it is never left red.
- Drivers: tdd for 1, 2, 4, 6, 7 (absent pure behaviour, failing oracle available — `assertDrawable` money case today skips `pay`, so the tray test is red first); impl for 3 (scene glue), 5 (removal), 8 (docs + seam sweep); e2e for 9 only, after the feature (2–3) and after the seam sweep (8), E2E=on. All correct.
- Save format: no phase touches `src/core/save.ts`, `MIGRATIONS` or fixtures; phase 5 checks `git diff --stat main -- src/core/save.ts src/core/migrations tests/fixtures` empty. Stays v4.

Scope fidelity (scope.md): "Wstaw znak" for comparison (and MISSING_OP, a sign answer) ✓; every other generic-heading type checked (survey table in change.md) and given "Uzupełnij" or kept "Oblicz" ✓; narrator reads the same heading via one `headingOf` ✓; F3 cap regardless of draw order, 3 only when the rolled pools force it ✓; N-1 removal, `hiddenMs` kept, DESIGN-GAP 153 rewritten ✓; H-2 picture-only count (`task + room + ui`) ✓; N-4 skill id via build-time `assertDrawable` checks, no rng change ✓; no creep (no generator change, no new `balance` number, no new section).

Teacher read of the wording: "Oblicz" over "38 + 27" and "17 − 8 = □"; "Wstaw znak" over "72 □ 37", "2 + 6 □ 4 − 1" and "6 □ 2 = 4" (a sign of an operation is still a sign; matches the speak line "Jakiego znaku działania brakuje"); "Uzupełnij" over "2 + □ = 4", "4 + 1 = 1 + □", "81 = 80 + □" — all three are the instructions Polish grade 1–3 workbooks use for these shapes. Narration "Wstaw znak. Jaki znak pasuje w okienku? 72 okienko 37." is one imperative plus one question, not a double question (F4).

Open follow-ups whose `Trigger:` names this area: F3 (in scope, closed by phase 4); `modeWidgets` in `TaskScene.render`, M-1/M-2/M-13/H-3/H-4 (narrator), L-8 + muted `Kod:` (`artHealthView.ts`), G-2/G-3/B-4/B-5 (`artHealth`) all fire and are re-recorded in phase 8 with reasons (out of scope per PA-6; L-8 has no DOM test environment — no jsdom/happy-dom in the repo, checked). Deferrals justified.

## Findings

### F1 — Hook snapshot lives in TaskScene, not e2eHook.ts

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 — Changes Required #2
- **Detail**: The plan names `src/testing/e2eHook.ts` as "the task snapshot that already carries `narration`". In code `TaskSnapshot` and `snapshot()` (with `narration`) are in `src/scenes/TaskScene.ts`; `e2eHook.ts` only spreads `task().snapshot()`. An agent following the plan would look for the field in the wrong file.
- **Fix**: Point phase 3 at `TaskSnapshot`/`snapshot()` in `src/scenes/TaskScene.ts`, note `e2eHook.ts` needs no edit.
- **Decision**: FIXED (plan.md phase 3 Files)

### F2 — Sample-diff criterion forbids a replacement the change makes

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 — Success Criteria 2.3 (and Progress 2.3)
- **Detail**: 2.3 allowed only "added or kept" heading prefixes. Today FACT_FAMILY `fact_swap_20` and PLACE_VALUE decompose (`withSpeech` sets a plain-expression `speak`) are read "Oblicz. …"; after phase 2 they read "Uzupełnij. …" — a replacement. The criterion as written would fail a correct implementation (or push the agent to bend the rule).
- **Fix**: 2.3 lists each case: added (four `speak`-question types), replaced `Oblicz.`→`Uzupełnij.` (fact swap, place-value decompose), kept elsewhere.
- **Decision**: FIXED (plan.md 2.3 body and Progress row)

### F3 — Phase 7 test seam names a non-existent registration

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 7 — Changes Required #2
- **Detail**: "a registered test generator" in `tests/generateTask.test.ts`: the registry has no registration API; the existing seam is the `vi.mock` of `src/core/tasks/registry` with a `FAKE` generator in `tests/generateTaskFailure.test.ts`, which already has the `assertDrawable` icon-pool case to model on.
- **Fix**: Phase 7 tests go to `tests/generateTaskFailure.test.ts` using its `FAKE` seam; also pinned phase 6's test file to `tests/artHealth.test.ts` (it already tests `cutByTable`).
- **Decision**: FIXED (plan.md phases 6 and 7)

### F4 — Narration length after the heading

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 2, Known risks
- **Detail**: COMPARE_EXPR will read "Wstaw znak. Porównaj wyniki. Jaki znak pasuje w okienku? …" and a MISSING result slot "Oblicz. Jaka liczba pasuje w okienku? …". Not a double question; slightly long. Teacher read 2.5 and the phase-8 follow-up cover it.
- **Fix**: Known risks entry widened to name both readings.
- **Decision**: RECORDED (plan.md Known risks)

### F5 — Repair favours the first skill of the new type

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 4, Critical Implementation Details
- **Detail**: Already in Known risks; affects only repaired rounds (159 of 12 600 in research's count) and keeps the rng contract. No action.
- **Decision**: RECORDED

VERDICT: PROCEED — no critical finding; three warnings were wrong file/criterion details fixed in plan.md; drivers, seeds, F3 repair, e2e #15 adaptation and save v4 verified against the code.
