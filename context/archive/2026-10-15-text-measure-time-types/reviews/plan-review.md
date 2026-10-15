<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Typy tekstowe — czas, jednostki, ceny, kolejność działań, nierówności i runda powtórkowa (E1, E5–E6)

- **Plan**: context/changes/text-measure-time-types/plan.md
- **Mode**: Deep (claims checked against the code directly in this step; autonomous run, no AskUserQuestion)
- **Date**: 2026-10-15
- **Verdict**: REVISE → SOUND after the fixes applied to plan.md
- **Findings**: 2 critical, 6 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | WARNING (F1, F7, F8) |
| Blind Spots | FAIL → fixed (F2, F3, F4) |
| Plan Completeness | WARNING (F5, F6) |

## Grounding

Paths 14/14 exist except `scripts/validate-rule-files.sh` (F5; the script is `.claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh`);
symbols ✓ (`isCorrect`/`task.check` in `src/core/round.ts`, `markCorrect`/`markHint` in `TaskScene.render`, `answerWrong`/`answerRight`
in `tests/e2e/support/hook.ts`, `playableSteps`/`calendarStart`/`floorToCalendar`/`currentStep`/`skillBuckets`/`unlockReady`/
`buildAdaptiveRound` in `src/core/curriculum.ts`, `firstPlayableSteps`/`pickRoundSkills` in `src/core/round/pick.ts`,
`withoutArtBlocked`/`artBlocked`, `WORD_TYPES` in `src/core/minigames/word.ts`, `E2E_HOOK_MARKERS`); brief↔plan ✓ (11 phases,
same decisions); Progress↔Phase ✓ (11 titles match, 65 rows, every phase has `Driver:` + `Driver why:`; drivers correct:
1,3–8 tdd, 2,9 impl, 10–11 e2e after the seam sweep 9; both new specs are added to `ROUND_SPEC`).

## Verified against the code (step-prompt checks)

**INEQUALITY with several right tiles** — every place a child could see a right tap shown as wrong:
- `isCorrect` (`src/core/round.ts`) returns `task.check(input)` first, in every input phase incl. `retype` → right taps settle as right.
- `TaskScene.render` paints `task.answer` via `this.tiles.markCorrect(...)` → would show a non-canonical right tap un-highlighted
  and another tile green. Plan phase 2 fixes it in the same commit as the E1.9 data (contract rule held); F3 pins how
  `markedTile` must be read so the e2e break can see it.
- `markHint` in `retype` outlines `task.answer`; with `check` any right tile is accepted → consistent.
- `tests/e2e/support/hook.ts` `answerWrong` picks `tiles.find(t => t.value !== state.answer)` → could tap another right tile;
  plan phase 2 switches it to `correctChoices`. `answerRight` taps `state.answer` → safe. No other spec picks tiles by
  `!== answer` (only `number-line.spec.ts` taps `=== answer`).
- Reachability outside ordinary rounds: E2 warm-up/`previous` bucket draws E1.9 → same `TaskScene` path, covered by phase 2.
  S-15 word minigame filters `WORD_TYPES = ADD_SUB|MULT|DIV` → INEQUALITY never enters; dice builds its own task; daily puzzle is data.
- `generateTask` leaves generator-supplied `choices` alone (INEQUALITY builds its own 4 tiles; `balance.tiles.count` = 4);
  `tests/generateTask.test.ts` tile invariants hold for 2+2 tiles.
- `validateTask`, `leaksAnswer` (`firstHint`) and `solutionSteps` (closes with `lastNumber(last) === answer`) don't know `check` →
  phase 1 adds the rules; plan's last hint line ends with the canonical answer. Narrator already speaks `<`/`>`/`□`
  (`pl.speech.less/greater/blank`).

**MIX / E6 calendar start**:
- E6 pins: `tests/curriculumStart.test.ts` (`playableSteps(E6)` and oracle `[3,4,6,8,10,10]`), `curriculumPick.test.ts`
  (E6 step 2 bucket case), `curriculumEnd.test.ts` (two E6 step-2 cases), `progress.test.ts` (E6 step 2 "1st of 9"),
  `perimeterSkills.test.ts` (E6.3 single skill, childName check), `mass.test.ts` (`scale` on every MASS) — all listed in phases
  4–6. E2E: only `written-column.spec.ts` plays E6 (forced skill, parent path) → unaffected.
- New oracle recomputed: n = 10, progress (x+0.5)/5 → ceil 1,3,5,7,9 (JS-exact) → `[2,3,5,7,9,10]` ✓; with the review step
  wrongly included n = 11 → `[2,4,6,8,10,11]`, so phase 8's deliberate break goes red ✓.
- Review never a start/warm-up step: `calendarStart` excludes review (phase 8); `firstPlayableSteps` keeps its own
  `skills.some(playable)` filter (E6.11 has `skills: []`) ✓; `changeStageByParent` and warm-up lowering never write
  `unlockedStep` (only `curriculum.ts` does) ✓. `unlockReady` from E6.11 → no later step → `null` ✓.
- Live saves never move backwards: `floorToCalendar` only raises; a saved `unlockedStep.E6 = 11` stays ≥ floor 10; save stays v2
  (`hasOnly(v.mastery, isCount)` accepts new skill ids), fixtures untouched ✓. Higher unlock thresholds slow, never revert.
- S-15 schedule: review rounds are `kind: 'round'`; `variants.ts` untouched ✓. Word round on E6.11 uses `step <= unlocked` → fine.

**Follow-ups with `Trigger: S-14c`** (archive grep): MASS/LENGTH text + PLACE_VALUE ≥ 1000 (in, phases 5–7), `capacity_half_l_e5`
(in, conditional → `S-17`), 200/500 zł banknotes, set-the-clock E5–E6, WRITTEN missing digits + F9, ARROW_TABLE multi-number
(deferred in phase 9 with concrete new triggers). The "porównania cięższe/lżejsze" part of the S-14 MASS follow-up was not named —
added to phase 9 with a trigger (O10).

**Product decisions**: INEQUALITY on tiles with two right tiles, MIX step-first with ~14 % E5 (ZADANIA: „ze wszystkich typów
etapu”), no LOGIC, timetable as text, PRICE whole złote, no set-the-clock, threshold rises and the E6 start shift — none clearly
wrong against ZADANIA/PRD; all named in `[human]` row 9.6 (and 4.8 for the tablet voice). Not overturned.

## Findings

### F1 — New snapshot fields as e2e-guard markers would fail the production build

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Critical Implementation Details „Scena i hak dla `check`”; Phase 2 §1 File list
- **Detail**: The plan said „Nowe pola haka dopisane do listy znaczników w `vite/e2eHookGuard.mjs`”. `checkE2EHook` fails the build when
  any marker string appears in a production chunk, and `TaskScene.snapshot()` is production code: its field names ship (verified:
  `hintVisual` is in `dist/_app/index-*.js`). Adding `correctChoices`/`markedTile` as markers would make `npm run build` fail in phase 2.
- **Fix**: Removed the marker sentence and `vite/e2eHookGuard.mjs` from phase 2's files; the plan now says the guard stays unchanged and why.
- **Decision**: FIXED

### F2 — Phase 11's deliberate break could not turn the review-round spec red

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 11 Intent (a), break `e2e-break-p11a.patch`, Progress 11.2
- **Detail**: Break p11a („`skillBuckets` for the review step takes its own empty skills”) leaves `current = []` but
  `earlier = all E6.1–E6.10 skills` (steps `< 11`) and `previous = E5`, so the round still draws only E6/E5 tasks from several E6
  steps — assertion (a) stays green. Worse, even without phase 8 at all a save with `unlockedStep.E6 = 11` plays E6.10 as current and
  `earlier` spreads over E6 steps: the history assertion does not distinguish the review step from its absence.
- **Fix A ⭐ Recommended (applied)**: Reach E6.11 through the product unlock: import a v2 save at `unlockedStep.E6 = 10` with mastery 4 on
  the E6.10 skills, play one round, assert the unlock card (`screen: 'unlock'`, E6.11 name) and `unlockedStep.E6 = 11`, then the review
  round history; break = `stepPlayable` without the `review` clause → no card → red.
  - Strength: proves the observable product behaviour (the step unlocks and plays); same path as the 8.7 screenshot.
  - Tradeoff: one more round in the spec (~10 s).
  - Confidence: HIGH — `unlockReady` returns `null` without a playable later step (code read).
  - Blind spot: step-first weighting is still only proven by the unit test (phase 8), by design.
- **Decision**: FIXED (Fix A)

### F3 — `markedTile` source unspecified; break p10a might not go red

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details „Scena i hak”; Phase 2 §1
- **Detail**: If the snapshot computed `markedTile` from a scene field set beside the paint call, reverting the paint to `task.answer`
  (break p10a) would leave `markedTile` correct. `render` is re-run from state, so the submitted value must also live in a scene field.
- **Fix**: Plan now requires `markedTile` to be read from `AnswerTiles` (getter of the painted value), the submitted value kept in a
  scene field set in `submit` and cleared per task; `AnswerTiles.ts` added to phase 2's files.
- **Decision**: FIXED

### F4 — Probabilistic e2e assertions in phase 11

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 11 (a) and (b); Phase 7 tests
- **Detail**: „≥ 2 E6 steps in 5 tasks” fails ~0.2 % of runs; „an answer ≥ 100 000 within 2 rounds” depends on an unpinned variant share
  (e.g. 1/3 share → ~1.7 % red).
- **Fix**: Phase 7 pins ≥ 50 % of `E6.10.place_value_1000000` draws with answers ≥ 100 000; phase 11 allows up to 3 rounds for both; Known risk added.
- **Decision**: FIXED

### F5 — Wrong path to the rule-file validator

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 9 criterion 1 and Progress 9.1
- **Detail**: `scripts/validate-rule-files.sh` does not exist; the script is `.claude/skills/10x-autonomous-run/scripts/validate-rule-files.sh`.
- **Fix**: Path corrected in the phase block and in Progress 9.1.
- **Decision**: FIXED

### F6 — Phase 4 is the largest content phase

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Completeness
- **Location**: Phase 4
- **Detail**: CLOCK_ELAPSED with four variants + TIME_UNITS + `spokenTime` + the `trwa` validator rule + ~8 nouns + data for four
  steps + five rewritten E6-pinned tests. Within the ≤ 3 generators rule, but close to one fresh agent's budget. Splitting now would
  renumber every later phase, Progress row and handoff reference.
- **Fix**: Known risk with a concrete in-phase split recipe (commit p4a: CLOCK_ELAPSED + E5.3/E5.8/E6.2 + E6 pins; p4b: TIME_UNITS + E6.1).
- **Decision**: ACCEPTED (Known risks)

### F7 — `MassParams` is not a union today

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 5 §2 Contract
- **Detail**: `src/core/tasks/generators/mass.ts` has a flat `MassParams { variant: 'read'|'half'|'convert'; unit; weights; max }`;
  „nowy członek unii” needs a discriminated-union refactor, and `artBlocked` reads `parseMassParams(...).weights` unconditionally.
- **Fix**: Phase 5 contract now states the union refactor and the narrowing in `artBlocked`.
- **Decision**: FIXED

### F8 — Review-step `minCurrent` and filtered groups placed in the wrong module

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Critical Implementation Details „Krok powtórkowy”
- **Detail**: `minCurrent` is computed by `buildAdaptiveRound` as `unlockThreshold(buckets.current.length, …)` — ~13 for the whole E6,
  so the art filter would almost never filter the review round; `withoutArtBlocked` cannot know about review. When `current` falls back
  unfiltered, `currentGroups` must fall back too or the group draw picks blocked skills.
- **Fix**: Plan now sets `minCurrent = 1` in `buildAdaptiveRound` for the review step and requires `currentGroups` to follow `current`'s fallback.
- **Decision**: FIXED

### O9 — Phase 1 title mentions distractors that do not change

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Phase 1 title
- **Detail**: INEQUALITY builds its own tiles, so `distractors.ts` is not touched; the title says „i dystraktorach”. Left as is (renaming
  would touch Progress titles); the implementer does not need to change `distractors.ts`.
- **Decision**: RECORDED

### O10 — Follow-up bits not named by the plan

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 9 follow-ups
- **Detail**: The S-14 follow-up „warianty tekstowe MASS … (porównania cięższe/lżejsze …)” — comparisons are a scale feature, not text;
  the parent progress preview shows one canonical answer for an INEQUALITY mistake. Also: a save whose `pendingUnlock` skipped E6.2
  meets E6.2 only in the `earlier` bucket (never backwards; acceptable).
- **Fix**: Both added to phase 9's follow-up list with triggers.
- **Decision**: FIXED

## Triage summary

Fixed: F1, F2 (Fix A), F3, F4, F5, F7, F8, O10 · Accepted: F6 (Known risks) · Recorded: O9.
Verdict after fixes: SOUND.

VERDICT: PROCEED — the approach (check-aware scene in the same commit as E1.9 data, review step as data flag excluded from the calendar start, save v2) holds against the code; the two critical gaps (guard markers would break the build, phase 11 break could not go red) are fixed in plan.md.
