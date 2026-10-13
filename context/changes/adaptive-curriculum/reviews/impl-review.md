<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Adaptacja trudności — wagi kroków, opanowanie 0–5, „Nowa umiejętność!” i łagodzenie

- **Plan**: context/changes/adaptive-curriculum/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9
- **Date**: 2026-10-13
- **Verdict**: APPROVED (after the fixes in 88e898c)
- **Findings**: 0 critical, 3 warnings (fixed), 5 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F1 fixed) |
| Architecture | PASS |
| Pattern Consistency | PASS (F2, F3 fixed) |
| Success Criteria | PASS |

## Evidence observed in this review

- Branch `feat/adaptive-curriculum`, reviewed at `ea069c4` (code `7d03dc7`), fixes in `88e898c`.
- Gate re-run by the reviewer before and after the fixes: lint OK, typecheck OK, unit `npm test` 881 passed
  (main baseline 767 + 114), `deploy/test-martynka-deploy.sh` OK, `deploy/ops/test-martynka-ops.sh` OK,
  `npm run sample -- E1…E6` `Naruszenia: 0` each, build OK `e2e hook: absent (2 chunks checked)`;
  `grep -rl "__martynkaE2E\|e2eMonth" dist/` empty.
- E2E: `npx playwright test` in this session fails at `browserType.launch` (headless Chromium cannot start inside the
  agent sandbox, all 5 started tests fail before any page, 10 did not run). Not a product failure. E2E evidence is the
  orchestrator's run on `7d03dc7`: 15/15 (baseline 14 + 1), both breaks red (run-log "S-07 p9"). `88e898c` changes
  scene code (`TaskScene.startNextRound` fallback, comments), so the orchestrator re-runs e2e.
- Domain properties on the real `stages` (scratch script, not committed): every age (6–10) × month (0–11) × stage
  (E1–E6) × normal and easing weights × 30 seeds = 21 600 rounds, all with 5 tasks and no repeated prompt; 30 second-try
  answers leave mastery at 0, then 12 first-try answers reach 4; E4 from the September floor (step 2, one skill) unlocks
  step 4 after the third clean round; two weak rounds set `easedRounds` 2 and the weights 20/50/30. Stars:
  `src/core/round.ts` (S-04 star rules) is unchanged on the branch; `sessionStars` is added once per round in
  `TaskScene.beginRound`, which the card path reaches through `closeUnlock` only.
- Deliberate breaks re-executed (no browser): `recordRound` counting `'second'` like `'first'` → 3 tests red
  (`mastery.test.ts` "never raises mastery on a second-try answer", "lowers mastery … after a second-try answer",
  `curriculumEnd.test.ts` warm-up case); `unlockReady` with `>` instead of `>=` → 5 `curriculumEnd.test.ts` tests red
  (1 of 2, 1 of 1, 2 of 3, 3 of 5, run of three). Both restored (`git status` clean). Meta-check: the expectations are
  written from ZADANIA §1 and decision 3, not read from `balance`, so the reds prove the rules, and the TDD RED lines of
  phases 1–4 and 6 in the run log are consistent with these.
- Hooks: `.claude/settings.json` (10 Oct) and `.claude/hooks/*` (≤ 12 Oct) predate the branch (13 Oct); no
  `--no-verify` in this step.
- Seams: S-06 warm-up still draws through `pickSkills` + `firstPlayableSteps` (plus `distinctTasks`); `buildRound` has
  no caller left (removed with its test); the hook learner is `deepFreeze(structuredClone(...))`; the calendar floor is
  applied once, in `WelcomeScene.start` via `startLearning` for all six stages (`finishWarmup` only changes `stage`).
- `[reviewer]` rows: 5.5, 6.5, 7.5, 8.4 performed and ticked (teacher read in `reviews/teacher-read.md`).

## Findings

### F1 — The child could get stuck on the summary when the pending card has no name

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/TaskScene.ts (`startNextRound`, `unlockView`)
- **Detail**: `startNextRound` set `unlockShown` whenever `pendingUnlock !== null`, but `unlockView` returns null when
  the step has no `childName` (or is not a step of `this.stage`); `render` then redrew the summary and every
  „Kolejna runda” repeated this, so no new round could start. Latent today (`tests/curriculum.test.ts` requires a name
  on every playable step), real after a data regression or a stage change (S-08).
- **Fix**: when `unlockView()` is null, `closeUnlock()` (clears `pendingUnlock`, starts the round).
- **Decision**: FIXED (88e898c)

### F2 — Duplicated helpers in core

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/curriculum.ts (`skillBuckets`, `unlockReady`), src/core/placement.ts (`ORDER`)
- **Detail**: the stage order was declared twice (placement and curriculum) and the "current playable step" rule was
  written twice (`skillBuckets`, `unlockReady`); the two must never drift apart.
- **Fix**: `STAGE_ORDER` exported from `core/placement.ts`; private `currentStepOf` in `core/curriculum.ts`.
- **Decision**: FIXED (88e898c)

### F3 — DESIGN-GAP comments without row numbers or missing; stale comments

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/scenes/TaskScene.ts (`startNextRound`, `autoReadUnlock`), src/ui/widgets/UnlockCard.ts, src/data/layout.ts (`UNLOCK_LAYOUT`), src/data/pl.ts (`unlock`), docs/design-gaps.md row 22, tests/e2e/adaptive.spec.ts header, tests/e2e/support/welcome.ts header
- **Detail**: rows 23 and 24 had no comment in `TaskScene`; row 22 comments had no row number; row 22 described "two
  pages" while the code draws a cover; the e2e header mentioned a "cooldown" that does not exist; the welcome helper
  header still said it always starts on E3.
- **Fix**: comments with row numbers, row 22 wording, e2e headers updated.
- **Decision**: FIXED (88e898c)

### F4 — Teacher read: one weak child step name

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/data/curriculum/E4.ts (step 2 `childName`)
- **Detail**: „Działania z małą liczbą” is unnatural for a child; the other 47 names pass (E3.8 „Przekraczanie
  dziesiątki”, E5.2, E5.6 considered and kept, reasons in `reviews/teacher-read.md`).
- **Fix**: „Działania do 100”.
- **Decision**: FIXED (88e898c)

### F5 — `pendingUnlock` carries no stage

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architecture
- **Location**: src/core/placement.ts (`SessionLearner.pendingUnlock`), src/scenes/TaskScene.ts (`unlockView`)
- **Detail**: a bare step number resolved against the current stage; safe while nothing changes the stage between the
  end of a round and the card, not after S-08 / S-11.
- **Fix**: store `{ stage, step }` or clear on stage change — follow-up `Trigger: S-08 … or S-11`.
- **Decision**: DEFERRED (follow-ups/review-fixes.md)

### F6 — `endRound` returns more than `Adaptation`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/core/mastery.ts (`recordRound`), src/scenes/TaskScene.ts (`finishRound`)
- **Detail**: `{ ...adaptation }` keeps the placement fields of the `SessionLearner` passed in; harmless because the
  scene spreads the result back over the learner.
- **Fix**: pick the `Adaptation` keys explicitly when S-11 saves `LearnerState` — follow-up `Trigger: S-11`.
- **Decision**: DEFERRED (follow-ups/review-fixes.md)

### F7 — Small drifts from the plan text, accepted

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: tests/e2e/adaptive.spec.ts, tests/e2e/support/hook.ts, src/core/round/pick.ts (`pickRoundSkills`), src/core/round/unique.ts (`distinctTasks`)
- **Detail**: the spec checks `unlocked > START_STEP` and that card, `unlockedStep` and `pendingUnlock` agree instead of
  the literal `step === 4` (equivalent: E4's next playable step after 2 is 4, and the spec is robust to data); helper
  names differ (`tapTarget`, `playRoundRight` instead of `tapNext`); `pickRoundSkills` also skips zero-weight buckets
  with a uniform fallback (unreachable with today's balance); `distinctTasks` keeps an unused `_rng` parameter to match
  the plan's signature.
- **Fix**: none needed.
- **Decision**: ACCEPTED

### F8 — `firstPlayableSteps` and `playableSteps` share a filter; `balance` branches without `satisfies`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/round/pick.ts (`firstPlayableSteps`), src/core/curriculum.ts (`playableSteps`), src/data/balance.ts
- **Detail**: same predicate in two shapes (steps vs numbers); `balance.mastery/curriculum/easing` are checked
  structurally at the `endRound` call, which typecheck covers.
- **Fix**: follow-up `Trigger: next change to pick.ts or curriculum.ts`.
- **Decision**: DEFERRED (follow-ups/review-fixes.md)

MERGE: CLEAR — 0 critical; the three warnings were fixed in 88e898c with lint, typecheck, unit 881 (main baseline 767 + 114), sample E1–E6 and build green; e2e must be re-run by the orchestrator on 88e898c because Chromium cannot launch in this session (last observed 15/15 on 7d03dc7).
