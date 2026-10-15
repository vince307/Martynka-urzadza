---
date: 2026-10-15T05:28:20+02:00
researcher: Claude (autonomous run 2026-10-15-fix-s14c-s14d, research step)
git_commit: 1683e5e66c2663f8f8411e95c19abdd0870c54da
branch: feat/text-measure-time-types
repository: Martynka-urzadza
topic: "S-14c text-measure-time-types: text generators CLOCK_ELAPSED, TIME_UNITS, UNIT_CHOICE, PRICE, TIMES_MORE, ORDER_OPS, INEQUALITY; text variants of MASS, LENGTH, PLACE_VALUE (>= 1000) and CAPACITY; the review step MIX (E6.11); unlock thresholds and calendar start on live v2 saves"
tags: [research, tasks, generators, curriculum, review-step, calendar-start, unlock, check, tiles, keypad, nouns, validator, contentInvariants, e2e]
status: complete
last_updated: 2026-10-15
last_updated_by: Claude (autonomous run, research step)
---

# Research: S-14c text-measure-time-types

**Git Commit**: `1683e5e` · **Branch**: `feat/text-measure-time-types` · Research only, no product code changed.
Anchors are file + symbol (run contract: no line numbers). `docs/zrodla/` was not read; every task shape below is an
original example built from the type definitions in `docs/ZADANIA.md` § 2–4, not a textbook task. `lessons.md` in
`context/foundation/` does not exist (checked with `ls`), so no lesson applies.

Three read-only workers covered (A) curriculum, review step, calendar start, unlock, warm-up, S-15 variants, save
validation and pinning tests; (B) the task model, `isCorrect`, `canonicalInput`, keypad, hints/solution lines,
narration and the e2e helpers; (C) the existing MASS/LENGTH/PLACE_VALUE/CAPACITY/WORD generators, units and time
formatting, nouns and the validator, `contentInvariants`, `pl.ts`, triggered follow-ups. Decisive anchors were re-read
in the main context: `isCorrect` (`src/core/round.ts`), `answerWrong` (`tests/e2e/support/hook.ts`),
`markCorrect`/`markHint` calls in `src/scenes/TaskScene.ts`, `playableSteps`/`calendarStart`/`skillBuckets`/
`unlockThreshold` (`src/core/curriculum.ts`), the `max > 999` throw in `parsePlaceValueParams`, the MASS/CAPACITY
branches of `artBlocked` (`src/core/round/artFilter.ts`), `UNBOUNDED_TYPES`/`screenBound` (`src/core/tasks/bounds.ts`),
`leaksAnswer`/`firstHint` (`src/core/round/hints.ts`), `ACCUSATIVE_ONE` (`src/core/tasks/validate.ts`) and
`clockSetSpeak` (`src/data/pl.ts`). One worker detail corrected: the unlock-threshold rise also hits E5.10, E6.3, E6.9
and E6.10 (the worker's "even to odd" rule misses 1 → 3 skills); the full table is in § 7.

## Research Question

From `change.md` (scope table, claims table, autonomous decisions 1–7) and the step prompt: for every new type, what
are the exact task shapes and number ranges per step (ZADANIA), the answer mode, a hint that teaches the school method
without giving the result in its first line, and the Polish numeral agreement for new nouns and time expressions? How
does INEQUALITY with several correct answers fit the round (tiles + `check`)? What shape should MIX take as a
curriculum step (round composition, unlock, calendar start)? What happens to live v2 saves when unlock thresholds rise?

## Summary

1. **No new answer mode is needed.** Every new type fits `keypad` (integer answers) or `tiles` (strings or numbers).
   The keypad submits `Number(buffer)` with at most `balance.keypad.maxDigits` = 7 digits (`keypadInput`,
   `src/core/round/keypad.ts`): integers 0–9 999 999 only, no separator, no minus. So a time result ("8.45") or a
   mixed amount ("2 h 15 min", "3 zł 40 gr") must be a tile string or be asked as one integer (minutes, grams, złote).
2. **`check` already wins in every phase** (`isCorrect` in `src/core/round.ts`: `if (task.check) return
   task.check(input)`), so INEQUALITY on tiles works in the state machine as is, including the retype. What is missing
   is around it: `TaskScene` marks `task.answer` green instead of the tapped tile (`this.tiles.markCorrect(... task.answer
   ...)`), `answerWrong` taps the first tile `!== state.answer` (could be another correct tile), distractor builders
   and `validateTask` know nothing about `check`, and `leaksAnswer` judges the first hint against `task.answer` only.
3. **Several correct tiles are pedagogically right (ZADANIA § 4 INEQUALITY: "sprawdzamy warunek, wiele poprawnych
   odpowiedzi") and cost four small fixes** (§ 3). Recommendation: tiles with 2 correct and 2 wrong values, one
   canonical `answer` for the solution line, plus a DESIGN-GAP row (the kit has no view for several right tiles).
4. **MIX = a `review` flag on `StepDef` and one shared playability predicate** (`playableSteps` today is
   `step.skills.some(playable)`; E6.11 has `skills: []`, so a flag alone leaves it invisible). In `skillBuckets`, a
   review step's `current` bucket = every playable skill of the stage's other steps, `earlier` = `[]`, `previous` kept.
   It is ordinary `kind: 'round'`: `nextRoundKind`/`afterRound` (`src/core/variants.ts`) depend only on `roundsSince`,
   day and stage, so the S-15 schedule is untouched. No saved state: save stays v2.
5. **E6.2 and E6.11 becoming playable move the calendar start** (`calendarStart`: `k = ceil(progress · n)` over
   `playableSteps`). With n 9 → 11: July–August E6 starts on E6.11 unless the review step is excluded; autumn E6 (age 10)
   starts on E6.2 instead of E6.3. Recommendation (agrees with change.md decision 4): exclude the review step from
   `calendarStart`/`floorToCalendar` and from `firstPlayableSteps` (warm-up); keep E6.2 in.
6. **Unlock thresholds rise on 9–10 steps** (`unlockThreshold(n) = ceil(0.5 · n)`); `endRound` only raises
   `unlockedStep` and `floorToCalendar` takes a max, so no saved learner moves backwards (§ 7). Archive precedent
   (S-14, S-14b) accepted this as a `[human]` PR note.
7. **Validator and invariants need per-type bounds.** `screenBound` falls back to `params.max`; conversions (1 kg =
   1000 g, 1 t = 1000 kg) and place value to 1 000 000 need `max` sized to the numbers shown; times ("8.15" counts as 8
   and 15) suggest adding CLOCK_ELAPSED to `UNBOUNDED_TYPES` (as CLOCK is) with a param bound on the answer.
8. **Nouns: 23 of the listed words are missing from `src/data/nouns.ts`** (§ 6); the validator checks agreement for any
   n once a noun is in the dictionary, but does not understand locative/instrumental time phrases ("po 45 minutach")
   and checks the accusative of 1 only after a fixed verb list without "trwa".
9. **`capacity_half_l_e5` is feasible as a text variant** with ½ and ¼ l both ways (≥ 20 distinct tasks); ½ l alone up
   to 5 l gives 5 tasks and fails `MIN_DISTINCT` 12 and the 15 % top share.

## Detailed Findings

### 1. Task model, round evaluation, keypad and speech (worker B, decisive lines re-read)

- `Task` (`src/core/tasks/types.ts`): `answer: number | string | number[]`, `choices?`, `hint: string[]`,
  `check?: (input) => boolean` ("tasks with several correct answers"), `input?: AnswerMode`, `speak?`, `visual?`,
  `hintVisual?`, `tileRange?`. `AnswerMode` = tiles | keypad | select | drag | digits.
- Today one generator sets `check`: EVEN_ODD select (`src/core/tasks/generators/evenOdd.ts`), a set-equality check.
  No tiles or keypad task uses it.
- `isCorrect` (`src/core/round.ts`): `check` first, then set equality for arrays, else `===`. It is used for every
  submission (first try, second try, retype). `captureFirstWrong`/`roundResults` record `task.answer` as the answer in
  the parent's mistake examples — fine for INEQUALITY (an example answer).
- `canonicalInput` (`src/core/round/canonicalInput.ts`): tiles/keypad return `task.answer`; `tests/solvableInMode.test.ts`
  feeds it to `answer()` and expects `done` on the first try. A check-based tiles task passes when `check(answer)` and
  `answer ∈ choices`. Nothing asserts that a wrong tile exists.
- `solutionSteps` (`src/core/round/hints.ts`): hint lines, then an answer line unless the last line already "closes"
  (numeric: last number equals the answer; string: the line contains it). `firstHint` drops the first line when
  `leaksAnswer` (numeric: its last number equals `task.answer`, unless it is an open expression without "=").
- Tiles hold strings already (CLOCK times, `<`/`>`/`=` in `SIGNS` of `compareNum.ts`, temperature text). Unit tiles
  ("cm", "kg") work; `leaksAnswer` judges word-like string answers by whole token (`containsToken`).
- `formatTime` (`src/core/text/time.ts`) gives school notation "8.15" / "15.00". The narrator does nothing special for
  times; CLOCK supplies a `speak` text (`pl.tasks.clockSetSpeak`: "godzinę 8 i 15 minut"). Numbers are spoken as words
  only in bare calculations up to `MAX_NUMBER_WORD` = 1000 (`src/core/text/numberWords.ts`); `<`/`>` are spoken
  "mniejsze niż"/"większe niż" (`pl.speech`), `□` "okienko". The prompt blank must be `□` (`symbols.ts BOX`,
  `promptBlank.ts splitBlanks`).

### 2. Per-type task shapes, ranges, modes and hints

Ranges from `docs/ZADANIA.md` § 2 (table) and § 3 (steps); shapes are original examples. "Hint" = `task.hint`, first
line shown after the first miss (must not end in the answer), last line closes on the answer.

| Type (step) | Shapes and ranges (ZADANIA) | Mode | Hint (school method, result only at the end) |
|---|---|---|---|
| **INEQUALITY** (E1.9) | `a + □ < c`, `a + □ > c`, `□ + a < c`, `a − □ > c`; all numbers 0–10, sums ≤ 10 (§ 2 E1: "wynik ≤ 10"; § 4: "5 + _ < 8", "wiele poprawnych odpowiedzi") | tiles + `check` | 1: "Najpierw znajdź równość: 5 + □ = 8." 2: "5 + 3 = 8, więc w okienku musi być mniej niż 3." 3: "Pasuje np. 2: 5 + 2 = 7." (canonical answer ≥ 1 so no `5 + 0` line) |
| **CLOCK_ELAPSED** (E5.3) | lesson 45 min: start time → end time ("Lekcja zaczyna się o 8.00 i trwa 45 minut. O której się kończy?"); through midnight in full hours ("od 22.00 do 3.00") (§ 2 E5: "upływ czasu przez północ, lekcja 45 min") | tiles (time strings) for "o której"; keypad (hours/minutes) for "ile trwa" | 1: "Licz do pełnej godziny: od 8.30 do 9.00 to 30 minut." 2: "Zostało 15 minut: 9.00 + 15 minut." 3: "Lekcja kończy się o 9.15." Midnight: "Od 22.00 do 24.00 to 2 godziny" → "od 0.00 do 3.00 to 3 godziny" → "2 + 3 = 5" |
| **CLOCK_ELAPSED** (E5.8) | doba and a timetable given as text ("Autobus odjeżdża o 7.40 i przyjeżdża o 8.25. Ile minut jedzie?"; "od 18.00 do 6.00 rano" in hours); minutes ≤ 120, any minute (S-13b follow-up: answers to the minute) | keypad | 1: "Od 7.40 do 8.00 to 20 minut." 2: "Od 8.00 do 8.25 to 25 minut." 3: "20 + 25 = 45" |
| **CLOCK_ELAPSED** (E6.2) | "ile minut do pełnej godziny" ("Jest 7.35. Ile minut zostało do 8.00?"), duration of a programme from a text schedule ("od 16.50 do 17.35") (§ 3 E6.2) | keypad (minutes) | 1: "Godzina ma 60 minut." 2: "60 − 35 = 25" ; programme: counting on to the full hour as above |
| **TIME_UNITS** (E6.1) | 1 h = 60 min, doba = 24 h, 1 min = 60 s, kwadrans = 15 min (§ 4): "Ile minut to 3 kwadranse?" (45), "Ile sekund to 2 minuty?" (120), "Ile godzin to 2 doby?" (48), "180 sekund to ile minut?" (3) | keypad | 1: "1 kwadrans to 15 minut." 2: "3 · 15 = 45" |
| **UNIT_CHOICE** (E5.7) | "Długopis ma 14 □." → mm / cm / m / km; mass: "Jabłko waży 150 □." → g / dag / kg (§ 4, § 2 E5 "g") | tiles (unit strings) | 1 (no unit token, or `firstHint` drops it): "Pomyśl, czy to krótkie jak palec, czy długie jak pokój." last: "Długopis ma 14 cm." (contains the answer, satisfies the string-answer invariant) |
| **PRICE** (E5.10) | ilość · cena = wartość ("Zeszyt kosztuje 4 zł. Ola kupiła 3 zeszyty. Ile zapłaciła?"), unit price ("5 bułek kosztuje 10 zł. Ile kosztuje 1 bułka?"); whole złote ≤ 100 (§ 2 E5 "zakupy, ilość · cena") | keypad | 1: "Wartość = ilość · cena: 3 razy po 4 zł." 2: "3 · 4 = 12"; unit: "Podziel cenę na 5 równych części." → "10 : 5 = 2" |
| **TIMES_MORE** (E5.10) | "n razy więcej" (product), "n razy mniej" (quotient), "ile razy więcej" (factor); ≤ 100, factors ≤ 10 (§ 2 E5 "„ile razy więcej”") | keypad | 1: "„3 razy więcej” to 3 razy po 4, a nie „o 3 więcej”." 2: "3 · 4 = 12"; "ile razy": "Ile razy 4 mieści się w 12?" → "12 : 4 = 3" |
| **ORDER_OPS** (E5.11) | `a + b · c`, `a − b : c`, `a · b + c`, `a : b − c`; no brackets, results 0–100, products in the table ≤ 100 (§ 4 "6 + 6 · 8; 20 − 12 : 4") | keypad | 1: "Najpierw mnożenie: 6 · 8." 2: "6 · 8 = 48" 3: "6 + 48 = 54". Generator must reject left-to-right = correct (else the rule is not tested). |
| **MASS text** (E5.7) | grams, gross/net/tare ("Słoik z miodem waży 500 g, pusty słoik 200 g. Ile waży sam miód?"), "2 kg = □ g", ¼ kg and ½ kg in grams | keypad | 1: "Netto = brutto − tara." 2: "500 − 200 = 300"; conversions: "1 kg = 1000 g." → "2 · 1000 = 2000" |
| **MASS text** (E6.3, E6.5) | E6.3 gross/net/tare in kg/dag; E6.5 tonne and quintal ("Ile kilogramów to 3 kwintale?" 300; "2 t = □ kg" 2000) (§ 2 E6) | keypad | 1: "1 kwintal to 100 kg." 2: "3 · 100 = 300" |
| **LENGTH text** (E5.12) | scale ("Na planie 1 cm to 2 m. Pokój na planie ma 4 cm. Ile metrów ma naprawdę?" 8; inverse divisible) (§ 2 E5 "skala") | keypad | 1: "1 cm na planie to 2 m naprawdę." 2: "4 · 2 = 8" |
| **LENGTH text** (E6.3) | two-unit expressions "4 cm 7 mm = □ mm" (47), "2 m 35 cm = □ cm" (235), reverse "47 mm = 4 cm □ mm" (one box) (§ 2 E6) | keypad | 1: "1 cm = 10 mm, więc 4 cm = 40 mm." 2: "40 + 7 = 47" |
| **PLACE_VALUE text** (E6.9) | to 10 000: thousands, decomposition ("4382 = 4000 + □ + 80 + 2"), building from words ("3 tysiące, 5 setek, 2 dziesiątki i 7 jedności"), (§ 4 "E6 do 10 000") | keypad | 1: "Cyfra setek w 4382 to 3." 2: "3 setki to 300." |
| **PLACE_VALUE text** (E6.10) | reading up to 1 000 000, full orders ("Ile tysięcy to 250 000?" 250; "Ile setek tysięcy ma 700 000?" 7) (§ 4 "odczyt do 1 000 000") | keypad (≤ 7 digits) | 1: "Odczytaj grupę tysięcy: 250 000." 2: "250 tysięcy" |
| **CAPACITY text** (E5.5 follow-up) | "Ile szklanek po ¼ l nalejesz z 3 l?" (12) and inverse "8 szklanek po ½ l to ile litrów?" (4); ½ and ¼ l, up to 5 l | keypad | 1: "1 l to 4 szklanki po ¼ l." 2: "3 · 4 = 12" |

Notes on the table:
- **Keypad ceiling**: 7 digits covers every answer above (max 1 000 000 is not asked as an answer; 700 000 is).
- **Time as an answer**: "o której" answers are `formatTime` strings on tiles; distractors "close but unambiguous" are
  ± 5/10/15 minutes and ± 1 hour, as `clock.ts` builds them for CLOCK `later`.
- **Speech**: every task whose prompt contains a time or a number ≥ 1000 should set `speak` (pattern:
  `pl.tasks.clockSetSpeak`), since the narrator reads "8.15" and "250 000" digit by digit in sentences.
- **ORDER_OPS hint lines** are single-operator `a op b = c` lines, so the hint-arithmetic invariant
  (`tests/contentInvariants.test.ts`, `ARITHMETIC_LINE`) checks them; a full-expression line "6 + 6 · 8 = 54" would
  not match and would go unchecked.

### 3. INEQUALITY with several correct answers (decision for the plan)

Observed: the round accepts any tile `check` accepts (`isCorrect`). Missing pieces, each with its anchor:

1. `src/scenes/TaskScene.ts`: `this.tiles.markCorrect(... task.answer ...)` and `this.tiles.markHint(... task.answer ...)`
   highlight the canonical tile, not the tapped one; a child tapping another correct tile would see a different tile
   turn green. Fix: mark the submitted value when `task.check` exists (the stars already fly from the tapped tile via
   `answerSpot`).
2. `tests/e2e/support/hook.ts` `answerWrong`: `tiles.find((t) => t.value !== state.answer)` can pick a second correct
   tile. Fix: expose `correctChoices` (each choice through `check`) in `TaskSnapshot` (`src/testing/e2eHook.ts` /
   `TaskScene` snapshot) and pick a tile outside it. `answerRight` (taps `=== state.answer`) is safe.
3. `src/core/tasks/distractors.ts` `numberChoices`/`pickChoices` pick values `≠ answer` and could add correct tiles at
   random. INEQUALITY needs its own choice builder (e.g. 2 correct + 2 wrong among 0–10, wrong ones next to the border).
4. `src/core/tasks/validate.ts` `validateTask` checks distinct choices and `answer ∈ choices`; add: when `check`
   exists, `check(answer)` is true and at least one choice fails `check`. `leaksAnswer` should also treat any number
   that `check` accepts as a leak in the first hint (or the generator guarantees the first line has no candidate value,
   as in the hint shape in § 2).

Options for the plan:
- **A (recommended)**: tiles with several correct values + the four fixes + DESIGN-GAP row ("several right tiles";
  solution shows one example, "np. 2"). Keeps ZADANIA's intent (the child learns that several numbers fit).
- **B**: exactly one correct tile among the choices (check kept only as a guard). No scene/e2e fix, but it reduces the
  type to "find the one value" and contradicts "wiele poprawnych odpowiedzi". Would change the answer: the plan's
  budget being exceeded, or the teacher read finding several right tiles confusing for a 6-year-old.
- Keypad is not an option for E1: E1 skills default to `'tiles'` in `src/data/curriculum/E1.ts`.

### 4. MIX as a curriculum step (worker A, decisive lines re-read)

- `StepDef` (`src/core/types.ts`) is `{ step, title, childName?, types, skills }`; there is no flag. `playable`
  (`src/core/round/pick.ts`) needs a registered generator and a known mode; `playableSteps` (`src/core/curriculum.ts`)
  keeps steps with at least one playable skill. E6.11 is `types: ['MIX', 'LOGIC'], skills: []`, no `childName`.
- `skillBuckets` builds `current` (skills of `currentStep`), `earlier` (steps below) and `previous` (all playable skills
  of the previous stage); `buildAdaptiveRound` filters through `withoutArtBlocked` with `minCurrent =
  unlockThreshold(current.length)`, then `pickRoundSkills` (60/30/10, empty buckets give their weight away; easing
  20/50/30) and `distinctTasks`.
- `unlockReady` needs a later playable step; `endRound` unlocks at most one step per round. **There is no stage
  advance**: a stage changes only through the warm-up drop or `changeStageByParent`. E6.11 is therefore terminal, as the
  last step of every stage already is.
- **Recommended shape** (agrees with change.md decision 3): `review?: true` on `StepDef` (data only); one exported
  predicate `stepPlayable(step) = step.review === true || step.skills.some(playable)` used by `playableSteps`,
  `firstPlayableSteps`, `progressView` and the `childName` test in `tests/curriculum.test.ts`; in `skillBuckets`, when
  the current step is a review step, `current` = all playable skills of the stage's non-review steps, `earlier` = `[]`,
  `previous` unchanged. Resulting weights: 60 + 30 redistributed → about 86 % stage / 14 % previous stage (easing about
  40/60 — `pickRoundSkills` redistribution, inferred, not measured). For `withoutArtBlocked`, pass a `minCurrent` of 1
  for a review step (otherwise ceil(0.5 · ~30) keeps blocked skills).
- **Round composition choice for the plan**: uniform over skills makes steps with many skills dominate; drawing a step
  first and then a skill spreads the year evenly. ZADANIA § 3 E6.11 says only "runda losująca ze wszystkich typów
  etapu" — silent on weights. Recommendation: step first, then skill (type variety per round), via `distinctTasks`.
- Mastery: review rounds record mastery on the underlying skills (`recordRound`) — no new id, no saved state.
- S-15: `nextRoundKind`/`afterRound` (`src/core/variants.ts`) read `roundsSince`, the day and the stage only; every 4th
  round is still a variant; `WORD_TYPES` (ADD_SUB, MULT, DIV) and `puzzleStages` (E3, E4) are unaffected.
- LOGIC in E6.11 stays unserved (S-15 pool is E3–E4 only, `balance.variants.puzzleStages`); change.md decision 5.
- Copy: `childName` and `title` for E6.11 (and E6.2) in `src/data/curriculum/E6.ts`; `UnlockCard` shows nothing for a
  step without `childName` (`unlockView` in `TaskScene`). A review-round title in the HUD would be a DESIGN-GAP; the
  `childName` on the unlock card alone needs none.

### 5. Calendar start, warm-up and pinned tests

- `calendarStart`: `position = (month + 4) % 12`, `semesterStart` 0 (E1/E3/E5) or 5 (E2/E4/E6), `progress = behind ?
  1 : clamp((position − semesterStart + 0.5) / 5)`, `k = min(n, max(1, minStartSteps = 2, ceil(progress · n)))`,
  result `playableSteps[k − 1]`. Callers: `startLearning` (WelcomeScene), `floorToCalendar` on load (`main.ts`);
  `changeStageByParent` (`src/core/placement.ts`) calls neither.
- E6 playable steps today 1, 3–10 (n = 9). After S-14c with both E6.2 and E6.11: 1–11 (n = 11).
  - July–August (progress 1): today E6.10; with E6.11 counted, **E6.11** for every E6 learner, placed or loaded.
  - Autumn, age 10 (progress 0 → k = 2): today E6.3; after, **E6.2**.
  - Worker A's recomputed oracle for `tests/curriculumStart.test.ts` (Feb–Jun + Jul, n = 11): `[2,4,6,8,10,11]`
    instead of `[3,4,6,8,10,10]`; excluding the review step gives n = 10 → the plan recomputes.
- ZADANIA § 3 calls E6.11 a "finałowe wyzwanie" (final challenge), i.e. reached by progress. **Recommendation:** the
  review step is not a calendar start (exclude it in `calendarStart`/`floorToCalendar` via the playable list they use)
  and not a warm-up step (`firstPlayableSteps`); it is reached by unlocking E6.10. Would change: the author wanting the
  summer start to be the year's review.
- Warm-up (`src/core/round/warmup.ts` via `firstPlayableSteps`): E6's first two playable steps become E6.1 and E6.2
  (today E6.1 and E6.3) — the new CLOCK_ELAPSED skill enters the E6 warm-up. Acceptable; noted for the plan.
- Saved learners with `unlockedStep.E6 = 2` (fixtures `tests/fixtures/save-v1*.json`, `save-v2*.json` hold E6: 2)
  today resolve to E6.1 via `currentStep`; after the change they play E6.2 as current. No save edit; fixtures stay
  byte-identical (only test expectations change).
- Tests pinning today's data (worker A, not all re-read): `tests/curriculumStart.test.ts` (E6 list and oracle),
  `tests/curriculumEnd.test.ts` (expects step 3; a test relying on E6.2 being unplayable needs a synthetic stage),
  `tests/curriculumPick.test.ts`, `tests/progress.test.ts` ("1st of 9"), `tests/perimeterSkills.test.ts` (E5.12 exactly
  2 skills/threshold 1; E6.3 exactly `['E6.3.perimeter_composite']`), `tests/curriculum.test.ts` (`LATER` list; the
  `childName` rule), plus the generator tests asserting a drawing (`tests/mass.test.ts` expects `visual.kind ===
  'scale'`).

### 6. Nouns, validator and Polish agreement

- `src/data/nouns.ts` is `Record<string, [one, few, many]>`; the accusative lives in `Context.accusative`
  (`src/data/wordTemplates.ts`). Present: godzina, minuta, setka, dziesiątka, jedność, złoty, grosz, naklejka, litr.
  **Missing** (23): sekunda, doba, kwadrans, dzień, lekcja, przerwa, film, program, pociąg, autobus, tysiąc, gram,
  dekagram, kilogram, tona, kwintal, metr, centymetr, milimetr, kilometr, zeszyt, długopis, bułka.
- Forms to add (one/few/many): sekunda/sekundy/sekund, doba/doby/dób, kwadrans/kwadranse/kwadransów, dzień/dni/dni,
  lekcja/lekcje/lekcji, tysiąc/tysiące/tysięcy, gram/gramy/gramów, dekagram/dekagramy/dekagramów,
  kilogram/kilogramy/kilogramów, tona/tony/ton, kwintal/kwintale/kwintali, metr/metry/metrów,
  centymetr/centymetry/centymetrów, milimetr/milimetry/milimetrów, kilometr/kilometry/kilometrów,
  zeszyt/zeszyty/zeszytów, długopis/długopisy/długopisów, bułka/bułki/bułek. Accusative singular: lekcję, sekundę,
  dobę, godzinę, minutę, tonę, bułkę (feminine -a → -ę); masculine inanimate = nominative.
- `validateTask` agreement (`NUMBER_WORD`): `(number) (word)` + dictionary lookup, any n (`pluralCategory` mod 10/100,
  grouped numbers parsed). So "1000 gramów", "2 tony" are checked once the nouns exist; abbreviations (g, kg, cm, zł)
  are not words in the dictionary and are not inflected.
- **Time expressions**: "o 8.15" is safe (the regex sees "15" followed by the next word and skips non-dictionary
  words; `ACCUSATIVE_ONE` needs "o 1 <letter>"). "po 45 minutach" (locative) is not in the dictionary → silently
  unchecked; recommendation: avoid locative/instrumental phrasings ("po … minutach", "przed … godzinami") and use
  "za 15 minut", "trwa 45 minut", "2 godziny 15 minut" (all nominative/accusative forms the validator checks).
- **Accusative of 1 after "trwa"**: "trwa 1 godzinę" is correct Polish but `ACCUSATIVE_ONE` lists only ma, mają, miał(a),
  kupił(a), oddał(a), dostał(a), zabrano, dołożono, o, za — "trwa 1 godzina" would pass unflagged. Recommendation:
  add trwa/trwała/trwał/trwało (and "jedzie", "czeka" if used) to the verb list, or avoid 1 in durations.
- **After "więcej/mniej"** the noun is genitive plural for every n ("3 razy więcej naklejek"): use the `many` form;
  "razy" is not a dictionary word, so the validator skips "3 razy". Teacher read guards it.
- **Verb with numeral subjects**: "5 kwadransów ma" (singular neuter) vs "3 kwadranse mają"; recommendation: phrase
  TIME_UNITS as "Ile minut to 3 kwadranse?" (no verb agreement).
- Verb gender per name: `verb(p, pl.words.X)` with `[m, f]` pairs; names with `gender` in `people`
  (`src/data/wordTemplates.ts`). `contexts` carry `price` in grosze (reusable for PRICE); no "ilość · cena" and no
  "n razy więcej" template exists today (`word_100` kinds: groups, share, each, sum, left).

### 7. Unlock thresholds on live saves

`unlockThreshold(n) = ceil(0.5 · n)` (`src/core/curriculum.ts`, `balance.curriculum.unlockShare` 0.5). Skill counts
today from the data files (worker A dump); "after" assumes one new skill per new type/variant in the step (the plan
may add more — recompute with the formula):

| Step | Today n → threshold | After n → threshold | Rises? |
|---|---|---|---|
| E1.9 | 2 → 1 | 3 → 2 | yes |
| E5.3 | 2 → 1 | 3 → 2 | yes |
| E5.5 (if `capacity_half_l_e5`) | 2 → 1 | 3 → 2 | yes |
| E5.7 (UNIT_CHOICE + MASS) | 2 → 1 | 4 → 2 | yes |
| E5.8 | 1 → 1 | 2 → 1 | no |
| E5.10 (PRICE + TIMES_MORE) | 1 → 1 | 3 → 2 | yes |
| E5.11 | 1 → 1 | 2 → 1 | no |
| E5.12 | 2 → 1 | 3 → 2 | yes |
| E6.1 | 3 → 2 | 4 → 2 | no |
| E6.2 | unplayable | 1–2 → 1 | new |
| E6.3 (MASS + LENGTH) | 1 → 1 | 3 → 2 | yes |
| E6.5 | 2 → 1 | 3 → 2 | yes |
| E6.9 | 2 → 1 | 3 → 2 | yes |
| E6.10 | 2 → 1 | 3 → 2 | yes |

`endRound` only raises `unlockedStep`; `floorToCalendar` takes the max with the calendar start; `validLearner`
(`src/core/save.ts`) checks only the shape (`mastery` open map of counts, `unlockedStep` a record of counts) — so a
higher threshold slows the next unlock for a learner sitting on that step and never moves anyone backwards; new skill
ids need no v3. Archive precedent: `context/archive/2026-10-14-number-line-written-arrows/` (research, plan,
impl-review) and `context/archive/2026-10-14-art-tasks-all-stages/` accepted the same rise as a `[human]` PR note.

### 8. Generators to extend (worker C, PLACE_VALUE and MASS anchors re-read)

- **MASS** (`src/core/tasks/generators/mass.ts`): `parseMassParams` requires a non-empty `weights` and every variant
  draws a `scale`. A text variant needs a parser branch, an early `generateMass` branch, and **`artBlocked`
  (`src/core/round/artFilter.ts`) must not block it** — today its MASS case blocks on any missing weight art (CAPACITY
  already exempts `howMany` the same way). New gram/tonne values belong in `src/data/measures.ts` (no g, t, q today).
- **LENGTH** (`length.ts`): `LengthParams` is a union `ruler | convert`; `convert` is already text-only
  ("2 m 40 cm to ile centymetrów?"), so scale and mm/cm two-unit variants are more union members.
- **PLACE_VALUE** (`placeValue.ts`): `parsePlaceValueParams` throws for `max > 999` for every variant ("blocks show at
  most 999"); `validateVisual` `blocks` knows hundreds/tens/ones only; `build` is capped at 99. A ≥ 1000 text variant
  needs the 999 check per variant (blocks variants keep it).
- **CAPACITY** (`capacity.ts`): `toLitres|howMany`, both with `jugs`. `screenBound` CAPACITY = per-litre count ×
  `maxLitres` (¼ l to 5 l → 20).
- **WORD** (`word.ts`): retry loop with `MAX_ATTEMPTS` 1000 — the pattern for every new generator with a rejection loop
  (and for follow-up F9 in `written.ts`).
- **Registry**: `generators`/`parsers` in `src/core/tasks/registry.ts` (37 types; none of the 7 new ones). Each new
  type leaves the `LATER` list in `tests/curriculum.test.ts`.

### 9. Content invariants (`tests/contentInvariants.test.ts`)

1000 draws per skill; each must pass `validateTask` with `screenBound`; keypad/digits first hint ≤ 64 characters
(`KEYPAD_HINT_MAX`); `a op b = c` hint lines true; last arithmetic line contains a numeric answer; a string answer
appears in the last hint unless the type is in `ANSWER_LINE_TYPES` (COMPARE_NUM, EVEN_ODD, NUMBER_WORDS, ROMAN); every
number in prompt and hints ≤ `screenBound` unless the type is in `UNBOUNDED_TYPES` (CALENDAR, ROMAN, NUMBER_WORDS,
CLOCK, GRID); binary `+`/`−` prompts with operands ≥ 1; ≥ 12 distinct keys (`MIN_DISTINCT`) unless in `SMALL_SPACES`;
top task ≤ 15 %. Consequences: CLOCK_ELAPSED → `UNBOUNDED_TYPES` (or a `screenBound` case); TIME_UNITS, MASS text,
LENGTH text and PLACE_VALUE text need `max` covering the conversion numbers shown (1000, 2000, 1 000 000);
INEQUALITY prompts contain `□`, not a binary `N op N`, so the zero-operand rule does not apply to them.

## Code References

- `src/core/round.ts` `isCorrect`, `captureFirstWrong`, `roundResults` — evaluation, `check` first.
- `src/core/round/canonicalInput.ts` `canonicalInput`; `tests/solvableInMode.test.ts`.
- `src/core/round/hints.ts` `leaksAnswer`, `firstHint`, `solutionSteps`.
- `src/core/round/keypad.ts` `keypadInput`; `src/data/balance.ts` `keypad.maxDigits`.
- `src/scenes/TaskScene.ts` `markCorrect`/`markHint` calls, `answerSpot`, `unlockView`, `TaskSnapshot`.
- `tests/e2e/support/hook.ts` `answerRight`, `answerWrong`.
- `src/core/tasks/distractors.ts` `numberChoices`, `pickChoices`; `src/core/tasks/validate.ts` `validateTask`,
  `NUMBER_WORD`, `ACCUSATIVE_ONE`, `NEGATIVE_TYPES`.
- `src/core/tasks/bounds.ts` `UNBOUNDED_TYPES`, `screenBound`, `validationBounds`.
- `src/core/curriculum.ts` `playableSteps`, `calendarStart`, `floorToCalendar`, `currentStep`, `skillBuckets`,
  `buildAdaptiveRound`, `unlockReady`, `unlockThreshold`, `endRound`.
- `src/core/round/pick.ts` `playable`, `firstPlayableSteps`; `src/core/round/warmup.ts`; `src/core/round/artFilter.ts`
  `artBlocked`, `withoutArtBlocked`.
- `src/core/variants.ts` `nextRoundKind`, `afterRound`; `src/core/minigames/word.ts` `WORD_TYPES`.
- `src/core/types.ts` `StepDef`, `StageDef`, `Task`; `src/core/save.ts` `validLearner`, `SAVE_VERSION`.
- `src/core/tasks/generators/{mass,length,placeValue,capacity,clock,word,evenOdd}.ts`; `src/core/tasks/registry.ts`.
- `src/core/text/{time,measure,formatNumber,plural,numberWords}.ts`; `src/core/narration/spoken.ts`.
- `src/data/{nouns,wordTemplates,measures,pl,balance}.ts`; `src/data/curriculum/{E1,E5,E6}.ts`.
- `tests/contentInvariants.test.ts`, `tests/curriculum.test.ts`, `tests/curriculumStart.test.ts`,
  `tests/curriculumEnd.test.ts`, `tests/curriculumPick.test.ts`, `tests/progress.test.ts`,
  `tests/perimeterSkills.test.ts`, `tests/mass.test.ts`, `tests/length.test.ts`.

## Architecture Insights

- The one-step-one-skill-list model already carries "stage-wide" pools (`previous` bucket, minigame pools); a review
  step is a different bucket recipe, not a new round kind — that is what keeps S-15 and the save untouched.
- Text variants follow the LENGTH `convert` precedent: a params union member without `visual`, the drawing-only
  checks (parsers, `artBlocked`, visual tests) gated per variant.
- `check` is a first-class part of `isCorrect`; what lags is everything that assumes one right value (scene marking,
  distractors, validator, `leaksAnswer`, e2e helpers). INEQUALITY is the first type to exercise it on tiles.

## Historical Context (from prior changes)

- `context/archive/2026-10-14-art-tasks-all-stages/change.md` — "MIX = runda z całego roku (funkcja programu, nie
  generator)" assigned to S-14c (supported, still the recommendation); LOGIC for E6.11 out of v1 scope (supported).
- `context/archive/2026-10-14-art-tasks-all-stages/follow-ups/review-fixes.md` — MASS/LENGTH text and PLACE_VALUE ≥ 1000
  (`Trigger: S-14c`, in scope); 200/500 zł notes (`Trigger: S-14c or a money skill above 100 zł`, out: PRICE stays
  ≤ 100 zł in E5).
- `context/archive/2026-10-14-drawn-grid-tasks-e3-e4/follow-ups/review-fixes.md` — set-the-clock in E5–E6 and answers to
  the minute (`Trigger: S-14c or a tablet test`): set-the-clock out (no CLOCK in E5–E6 `types:`, ZADANIA § 3);
  CLOCK_ELAPSED keypad answers are to the minute.
- `context/archive/2026-10-14-number-line-written-arrows/follow-ups/review-fixes.md` — WRITTEN missing digits and
  ARROW_TABLE multi-field (out), E5.5 `capacity_half_l_e5` (`Trigger: S-14c`, feasible as text, § 2), F9 attempt cap
  in `written.ts` (optional).
- Same archive (research, plan, impl-review) — threshold rise on live saves accepted with a `[human]` PR note.

## Related Research

- `context/archive/2026-10-14-number-line-written-arrows/research.md` — answer modes, `isCorrect`, unlock rise.
- `context/archive/2026-10-14-art-tasks-all-stages/research.md` — art types, `screenBound`, `artBlocked`.

## Open Questions

1. INEQUALITY option A (several right tiles) vs B (one) — recommendation A; the plan decides and writes the DESIGN-GAP
   row (from 98 in `docs/design-gaps.md`).
2. MIX round composition (step-first vs skill-uniform) — ZADANIA is silent; recommendation step-first.
3. Review step and calendar start — recommendation: excluded (final challenge reached by progress); the author may
   prefer a summer review start.
4. Spoken text for times and numbers ≥ 1000: per-generator `speak` vs extending `numberWords` past 1000 — not
   investigated beyond `MAX_NUMBER_WORD`; plan checks `spoken.ts` on a sample.
5. Exact skill counts per step are a plan choice; § 7 table recomputes by `ceil(0.5 · n)`.
6. Not inspected: e2e specs that reference E6 steps (art-tasks, written-column, daily-puzzle) — the plan greps them
   for E6.2/E6.3 assumptions before changing E6 data.
