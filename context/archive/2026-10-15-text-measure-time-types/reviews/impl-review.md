<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Typy tekstowe — czas, jednostki, ceny, kolejność działań, nierówności i runda powtórkowa (E1, E5–E6)

- **Plan**: context/changes/text-measure-time-types/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- **Date**: 2026-10-15
- **Verdict**: APPROVED (after the fixes below; NEEDS ATTENTION before them)
- **Findings**: 0 critical, 5 warnings (all fixed), 5 observations (2 fixed, 3 recorded as follow-ups)

Method: two read-only subagents (plan drift; safety and patterns, with a 20 000-draw probe of every new or extended skill), plus the
reviewer's own checks: the full local gate and e2e re-run, a code-level check of INEQUALITY, the review step, and the teacher read of
`npm run sample -- E1|E5|E6 --count 6` with larger multi-seed scans (`--count 60`, seeds 1-5) for arithmetic and plausibility.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (minor drifts in F10) |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F1, F2, F4, F5 fixed) |
| Architecture | PASS |
| Pattern Consistency | PASS (F3 fixed) |
| Success Criteria | PASS |

## Key checks

- **INEQUALITY: a right tap is never shown as wrong.** `isCorrect` (`src/core/round.ts`) calls `task.check` first, in `first`, `second`
  and `retype`. `TaskScene.submit` stores `reported` only when `check` accepts the value. `render` marks the tapped value, or
  `task.answer` when there is no `check`. The retype `markHint` shows the canonical answer, and `check` accepts any right tile.
  `AnswerTiles.markedValue()` feeds `markedTile`. `answerWrong` (`tests/e2e/support/hook.ts`) picks a tile outside `correctChoices`.
  No path compares `=== task.answer` for a `check` task. `roundResults` records `task.answer` as the parent's example, which is an
  existing follow-up.
- **Review step E6.11.** `stepPlayable` includes it. The private `startableSteps` (used by `calendarStart`) excludes it, so neither
  `startLearning` nor `floorToCalendar` lands on it, and a behind stage starts at E6.10. `floorToCalendar` only raises, so a saved
  learner never moves backwards. `firstPlayableSteps` skips it because it has no skills. `changeStageByParent` and `warmupResult`
  never touch `unlockedStep`. `unlockReady` gives 11 from step 10 and `null` from step 11. `skillBuckets` builds `currentGroups`,
  `pickRoundSkills` draws a step and then a skill, `withoutArtBlocked` filters the groups, and `minCurrent` is 1. The round is a
  plain `kind: 'round'` and `RoundKind` is unchanged. `git diff main..HEAD -- src/core/save.ts src/core/variants.ts tests/fixtures`
  is empty, so the save stays v2 and the fixtures are byte-identical.
- **Unlock thresholds.** The plan table matches live data for every step: E1.9 3/2, E5.3 3/2, E5.5 3/2, E5.7 4/2, E5.8 2/1,
  E5.10 3/2, E5.11 2/1, E5.12 3/2, E6.1 4/2, E6.2 2/1, E6.3 3/2, E6.5 3/2, E6.9 3/2, E6.10 3/2.
- **Grade-3 arithmetic** (the "78 : 13" fix). Across 2100 operations in E5.10/E5.11 hints (seeds 1-5, `--count 60`), the largest
  divisor is 10 and the largest quotient is 10. The subagent probe found the same over 20 000 draws per skill. It also found no
  answer longer than `balance.keypad.maxDigits`, no missing or duplicate tile and no `validateTask` violation. The only
  out-of-table case was E5.12 (F1).
- **Teacher read** (rows 1.5, 2.6, 3.5, 4.6, 5.5, 6.5, 7.5, all `[reviewer]`). Numeral agreement holds: "4 pączki", "7 bułek",
  "3 złote", "7 złotych", "53 minuty", "5 godzin", "4 kwintale", "7 kwintali", "5 ton", "4 tony", "9 tysięcy", "4 szklanki",
  "20 szklanek". The accusative after "kupił/kupiła" is right, and verb gender follows the name ("Hania kupiła", "Kuba kupił").
  Hints teach the school method without giving the result in line 1 ("Najpierw policz minuty do pełnej godziny", "Odetnij z końca
  liczby trzy zera", "„Razy więcej” to mnożenie, nie dodawanie"). The UNIT_CHOICE tiles are unambiguous. Prices of goods run
  2-8 zł. Before the fixes, two problems remained: a TV match of 11 min and a film of 10 min (F5), and the E5.12 question wording
  (F6). After the fixes, a match lasts 46-110 min and a film 30-107 min.

## Findings

### F1 — E5.12 plan scale left the grade-3 times table

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/data/measures.ts `SCALE_PLAN_CM`
- **Detail**: Plans of 11 and 12 cm produced hints such as "24 : 2 = 12" and "55 : 5 = 11" in about 13 % of `E5.12.length_scale` draws, outside the E5 table (factors up to 10).
- **Fix**: `SCALE_PLAN_CM.max` 12 → 10, with the comment stating why. A rescan over 4 seeds × 60 shows the largest factor or quotient is now 10, and the variety invariants still pass.
- **Decision**: FIXED

### F2 — No unit test guards `isCorrect` for `Task.check`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/round.test.ts (src/core/round.ts `isCorrect`)
- **Detail**: Breaking `isCorrect` to ignore `check` left all 2666 unit tests green. Only the e2e break p10b caught it, and e2e never runs in CI. The phase-1 plan also asked for a tiles-with-`check` case in `tests/solvableInMode.test.ts`, which is missing.
- **Fix**: Added two tests in `round with several right tiles (Task.check)`. They use a real `E1.9.inequality_10` task with an independent oracle read from the prompt. A non-model right tile pays on the first try; it pays on the second try; it settles the retype. Re-running the break (drop `check` in `isCorrect`) turned both red (`expected 'second' to be 'done'`, `expected null to be 'second'`), and the code was restored.
- **Decision**: FIXED

### F3 — Polish prompts written in `src/core`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/tasks/generators/timesMore.ts `generateTimesMore`, price.ts `generatePrice`, placeValue.ts `generateThousands`
- **Detail**: Full prompt sentences ("razy więcej", "kosztuje", "Ile złotych … za zakupy?") and the joiners " i " / " to " were inline in core. The contract requires Polish strings in `src/data/`, and no generator on main does this.
- **Fix**: Moved them to `pl.tasks.timesMorePrompt{More,Less,Factor}`, `pl.tasks.price{Total,Unit}Prompt` and `pl.tasks.placeValue{Join,PartValue}`. The output text is unchanged (checked against the sample). The UNIT_CHOICE verb literal `'ma' | 'waży'` stays: it is a typed key passed into the `pl` templates.
- **Decision**: FIXED

### F4 — Parsers accepted params that make the generator throw

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/price.ts `parsePriceParams` / `generatePrice`; timesMore.ts `parseTimesMoreParams`
- **Detail**: PRICE with `max < 2 · maxQty` raised a `RangeError` from `rng.int` outside the attempt loop. TIMES_MORE accepted `maxFactor` 2 (always rejected, so it threw after 1000 attempts) and values above 10 (outside the table). Current data was safe.
- **Fix**: PRICE now requires `max ≥ 2 · maxQty`, and the generator `continue`s when no price fits (the dead `price < good.price[0]` check is gone). TIMES_MORE requires `maxFactor` in 3..10. Rejection cases were added to `tests/price.test.ts` and `tests/timesMore.test.ts`.
- **Decision**: FIXED

### F5 — Implausible TV durations in E6.2

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/data/elapsed.ts `spanTemplates`; src/core/tasks/generators/clockElapsed.ts `generateSpan`
- **Detail**: "Mecz w telewizji … trwa 11 minut" and a 10-minute "Film" appeared, because every span template shared a 10-minute floor.
- **Fix**: Each template now carries `SpanTemplate.minSpan`: match 45, film 30, train 20, bus/tram/programme 10. `generateSpan` picks the template per attempt and rejects shorter spans. New test: `span (show): a match lasts at least 45 minutes and a film at least 30`.
- **Decision**: FIXED

### F6 — Clumsy E5.12 question

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/data/pl.ts `lengthScaleRealPrompt`
- **Detail**: "Ile centymetrów długości ma na planie?" has no subject. This was the orchestrator's OBS.
- **Fix**: Changed to "Ile centymetrów ma klasa na planie?" (the place in lower case). `tests/lengthText.test.ts` checks that the place matches the subject.
- **Decision**: FIXED

### F7 — Stale comments and an unbounded loop

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/curriculum.ts `skillBuckets` ("three pools"); src/core/round/artFilter.ts `artBlocked` (CAPACITY `text` missing); tests/curriculum.test.ts `GROUP_1` header and `UNIT_CHOICE` listed in both `GROUP_1` and `LATER`; src/core/tasks/generators/placeValue.ts `drawFourDigit` `for (;;)`
- **Fix**: Comments updated, `UNIT_CHOICE` removed from `LATER`, and `drawFourDigit` bounded by `MAX_FOUR_DIGIT_ATTEMPTS` with a throw, like its siblings.
- **Decision**: FIXED

### F8 — Spoken text reads awkwardly in places

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality (content)
- **Location**: src/data/pl.ts `speech.less` / `speech.greater`; src/core/narration/spoken.ts
- **Detail**: E1.9 is spoken "okienko plus jeden mniejsze niż pięć", with no "jest". MASS/LENGTH speak unit symbols ("560 g", "1 m okienko cm"). The E6.9 decomposition is spoken with an "Oblicz." prefix. The speech words are shared with COMPARE_EXPR and the older types, so changing them is not local.
- **Fix**: Recorded as follow-ups in follow-ups/review-fixes.md, with the trigger "the [human] tablet-voice check (row 4.8)".
- **Decision**: DEFERRED (follow-up)

### F9 — `TaskScene.reported` is keyed by index, not cleared on task change

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/scenes/TaskScene.ts `reported`
- **Detail**: The plan said to clear it on task change. The code guards it with `index` and `task.check` instead. A stale value could only be one that `check` accepts, so nothing wrong can show.
- **Fix**: Follow-up with a trigger.
- **Decision**: DEFERRED (follow-up)

### F10 — Minor drifts

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/core/tasks/generators/placeValue.ts `PlaceValueParams` (flat, not union members); src/data/elapsed.ts `endEvents` (the `end` variant never crosses midnight, only `nightHours` does); `placeValue.ts` `withSpeech` duplicates `spoken.ts` digit-space stripping; tests/variants schedule test for E6.11 absent (`nextRoundKind` does not read the step); CLAUDE.md "with 21 generators" (pre-existing); roadmap S-14c still `planning` (archive step).
- **Fix**: The relevant items are in follow-ups; the roadmap is the archive step's job.
- **Decision**: ACCEPTED

Suites (observed): lint/typecheck OK; unit 2669 = baseline 2479 + 190 (2666 before fixes); sample E1-E6 0 violations; build OK, hook absent; e2e 86 = baseline 82 + 4, before and after the fixes (fix commit `6d20b08`).

MERGE: CLEAR — no CRITICAL; 5 WARNINGs fixed in 6d20b08 with tests (break re-executed red), all suites green incl. e2e 86/86; remaining items are [visual]/[human] rows and triggered follow-ups.
