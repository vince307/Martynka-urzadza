<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Adaptacja trudności — wagi kroków, opanowanie 0–5, „Nowa umiejętność!” i łagodzenie

- **Plan**: context/changes/adaptive-curriculum/plan.md
- **Mode**: Deep (code checked in this step, no sub-agent: the riskiest claims were verified directly)
- **Date**: 2026-10-13
- **Verdict**: SOUND after triage (REVISE before: 3 warnings fixed in plan.md)
- **Findings**: 0 critical, 3 warnings, 2 observations

Lessons: `context/foundation/lessons.md` does not exist; none applied.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F1, F3) |
| Plan Completeness | WARNING (F2) |

## Grounding

Paths 16/16 ✓ (`src/core/round/pick.ts`, `warmup.ts`, `src/core/placement.ts`, `src/data/placement.ts`,
`src/scenes/TaskScene.ts`, `WelcomeScene.ts`, `src/testing/e2eHook.ts`, `tests/e2e/support/welcome.ts`,
`playwright.config.ts`, `SummaryPanel.ts`, `docs/design-gaps.md`, `tests/curriculum.test.ts`, `layout.test.ts`,
`warmup.test.ts`, `pick.test.ts`, `scripts/sample.ts`; new files absent as planned). Symbols ✓: `playable` (private),
`firstPlayableSteps`, `pickSkills`, `buildRound` (only caller `TaskScene.freshRound`), `buildWarmup`, `warmupResult`,
`SessionLearner`, `proposeStage`, `placeByParent` (override ⇒ `warmupPending: false`), `TaskScene.advance` /
`startNextRound` / `finishWarmup` (spreads the learner, so adaptation fields survive), `render` / `currentSummary`,
`roundView.switchVisible` (`!finished`), `installE2EHook` `learner()` (shallow `Object.freeze`), `e2eMonth`,
`ROUND_SPEC`. Only registry writers of the learner: `WelcomeScene` and `TaskScene.finishWarmup`. brief↔plan ✓.
Progress↔Phase ✓ (9/9 phases, every criterion has a row, no checkboxes in phase bodies, 9 `Driver:` lines).

Independent check (script outside the repo, real `stages` + `getGenerator`): playable steps E1 2,3,4,5,6,7,9,11 … E6
1,4,5,6,7,8,9,10; rule D table = plan oracle in all 36 cells (E1 3,4,5,7,11,11; E3 2,6,7,9,11,11; E5 2,3,6,8,10,11);
prompt pools < 12 distinct in 1000 draws: only `E1.7.complement_10` (9) and `E1.6.even_odd_single_10` (11).

## Focus points (orchestrator)

- (a) Calendar floor vs ZADANIA §3 — E1 and E5 follow the book within a step; E3 (October = step 6) and E6
  (February = step 4) run ~1 month ahead → F1 (Known risks, [human] 8.6 note, S-17 follow-up). Rule D itself stands.
- (b) A round always has 5 tasks: `current` is never empty (calendarStart returns a playable step; fallback made
  explicit in F4), empty buckets renormalise, `distinctTasks` keeps a duplicate after 20 retries instead of shortening
  the round. E1 in September/October: current = step 3/4 (4/2 skills), earlier = step 2 (`compare_num_5`, 25 prompts),
  previous = none → 67/33; smallest pool 9 → uniqueness holds with ~10⁻⁷ failure per round.
- (c) Existing e2e stay deterministic: `passWelcome` (age 10+, E3) ⇒ `behind` ⇒ whole E3, current = step 11;
  no spec reaches 12 first tries of one skill in normal rounds; specs never assert task content; the 10% E2 share is
  covered for speech by `tests/spoken.test.ts` (all stages). First-launch child paths pin `?e2eMonth=9`.
- (d) Phase 9 runtime → F2 (one test, timeout 180 s sized for the 12-round bound).
- (e) Phase 6: 48 `childName` in `src/data/curriculum/*`, teacher-read row 6.5 present; `pl.unlock` row 7.5 present.
- (f) Hook: deep-frozen copy, `screen: 'unlock'`, `targets.unlockNext` (null in room), marker only in `e2eHook.ts`,
  `e2e hook: absent` checked in phases 5, 7, 9 ✓; resolution order made explicit (F3).

Follow-ups with `Trigger: S-07` (3 archives): duplicate prompt in a round (narrator) — Phase 3 ✓; duplicate prompt in
the warm-up — Phase 3 ✓; F5 `PlacementData` in core — Phase 1 ✓; ` = ?` after expressions — moved to S-16 with a
convincing reason (drawing, not picking; needs width screenshots) and re-filed in Phase 8 ✓; visual O1 `□` — already
closed (`9b9b9d3`) ✓.

Product decisions vs PRD: rule D (no literal PRD text; anchor Success Criteria) [human] 8.6; `≥ ceil(0.5·n)` vs literal
majority [human] 8.7 (consistent with the FR-014 Socrates note); unlock during easing [human] 8.8; easing by weights
instead of "mniejszy zakres, tryb z obrazkami" [human] 8.9; no stage auto-advance [human] 8.10; session-only state
[human] 8.5. None clearly wrong; all named.

Drivers: 1–4 `tdd` (logic absent, failing tests lead) ✓; 5 `impl` (glue) ✓; 6 `tdd` (failing "every playable step
has a name" test leads the data) ✓; 7 `impl` (widget + scene) ✓; 8 `impl` with the seam sweep, last non-e2e phase ✓;
9 `e2e` after the sweep, feature built in 5 and 7, E2E=on ✓. Phase sizes fit one fresh agent (Phase 7 = one new
component).

## Findings

### F1 — Calendar floor runs ahead of the textbook for E3 and E6

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details (rule D), [human] 8.6
- **Detail**: Progress is mapped onto the index of *playable* steps with `ceil` and `minStartSteps = 2`. Where
  non-playable steps cluster early the floor jumps over them: E3 in October = step 6 („Liczby 21–30”), while by book
  order (11 steps, ~30% of the semester) the class is around steps 3–4 (clock, mass — not playable); E6 in February =
  step 4 (6 · 12), the book is at steps 1–2. E1 (Sept 3, Oct 4, Nov 5, Dec 7) and E5 (2, 3, 6, 8, 10) match the
  book within a step. October E3 is the persona's live case today. Not clearly wrong (easing, 40% from earlier
  steps/previous stage, the orchestrator adopted rule D), so the formula and the oracle stay.
- **Fix**: Known risks entry with the numbers; [human] 8.6 body note; Phase 8 S-17 follow-up names the alternative
  (book-step index rounded down to a playable step).
- **Decision**: FIXED (Known risks + 8.6 + Phase 8 follow-up text)

### F2 — Phase 9: timeout sized for ~6 rounds, loop bound 12, two full walks to the card

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Phase 9 — Spec i projekt; Known risks „Rozkład w e2e”
- **Detail**: The loop allows ≤ 12 rounds but `test.setTimeout` was "fitted to ~6 rounds"; the existing round specs
  use 60 s for 1–2 rounds (task-round: 4 tests in 35.9 s incl. two builds), so a 12-round worst case would time out
  rather than fail on an assertion. Test 2 repeated the whole path to the card only to add the room round-trip,
  doubling ~1 min of serial e2e. Folding the room round-trip into the single path proves the same behaviour (card
  waits through „Do pokoju”, „Dalej” clears it, card does not return); both deliberate breaks still turn it red.
- **Fix**: One test; the room round-trip happens at the first summary with `pendingUnlock`; `test.setTimeout(180_000)`
  for the 12-round bound, measured time in handoff §3; rows 9.1–9.3 and decision 11 updated (+1 e2e, not +2).
- **Decision**: FIXED

### F3 — The card must be a branch of `TaskScene.render`, not only of `startNextRound`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 — Widżet i scena; Hak
- **Detail**: `TaskScene.render` shows `SummaryPanel` whenever `currentSummary()` returns one, and `startNextRound`
  ends with `render()`; with the card open the round is still finished, so any render (including the one in
  `startNextRound` itself, or `wake`) would put the summary back over the card. The hook's screen order (room vs
  unlock vs summary) was also implicit.
- **Fix**: Phase 7 intent: card state is a `render()` branch before the summary branch (hides summary and task layer,
  `roomSwitch` false); hook resolves `room` → `unlock` → `summary` → `task`.
- **Decision**: FIXED

### F4 — Bucket edge cases unstated

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 — Logika
- **Detail**: `skillBuckets` said "nearest lower playable step" but not what happens with none below; `pickRoundSkills`
  did not say what happens with all buckets empty. Both unreachable with rule D, but the implementer would guess.
- **Fix**: fallback to the first playable step; all-empty → `RangeError` like `pickSkills`; a round always has `count`
  tasks.
- **Decision**: FIXED

### F5 — F5 grep criterion is narrow

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1, row 1.3
- **Detail**: `grep -rn "from '../data" src/core/` matches only files directly in `src/core/` (today only
  `placement.ts`); generators in `src/core/tasks/generators/` import `data/pl` etc. by design (`'../../../data`) and
  are not matched. That is exactly the scope F5 needs (placement + the new `curriculum.ts`/`mastery.ts`), so no change.
- **Decision**: DISMISSED (criterion fits its purpose)

VERDICT: PROCEED — approach sound and grounded in the code; rule D table verified independently; three warnings fixed in plan.md (floor-vs-book risk recorded, phase-9 single test with a 180 s timeout, card as a render branch).
