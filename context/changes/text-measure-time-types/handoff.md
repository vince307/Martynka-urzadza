# Handoff — `text-measure-time-types` (slice S-14c)

Written by `/10x-impl-review` of run `2026-10-15-fix-s14c-s14d`. The review found no CRITICAL. It fixed five WARNINGs and two OBSERVATIONs in one commit, `fix(text-measure-time-types): poprawki z przeglądu implementacji`. The verdict is `MERGE: CLEAR`. The next agent must not get wrong: the visual gate screenshots the post-fix prompts. E5.12 now reads "Ile centymetrów ma klasa na planie?", and E6.2 TV durations have per-template minimums.

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | plan commits, p1 `9507da3` ... p11 `093b129`, handoff `dbb141b`, review fix `6d20b08`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 9 (`grep -c '^- \[ \]' plan.md`): only `[visual]` and `[human]` rows; every `[reviewer]` row is ticked `— impl-review` |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/text-measure-time-types/reviews/impl-review.md` | review report: F1-F10 with decisions; ends with the `MERGE:` line |
| `src/data/measures.ts` | `SCALE_PLAN_CM.max` 12 → 10 (F1, E5.12 stays inside the times table) |
| `src/data/elapsed.ts`, `src/core/tasks/generators/clockElapsed.ts` | `SpanTemplate.minSpan` per span sentence; `generateSpan` rejects shorter spans (F5) |
| `src/data/pl.ts` | `timesMorePrompt{More,Less,Factor}`, `price{Total,Unit}Prompt`, `placeValue{Join,PartValue}` (F3); `lengthScaleRealPrompt` wording (F6) |
| `src/core/tasks/generators/{timesMore,price,placeValue}.ts` | prompts come from `pl`; `parseTimesMoreParams` maxFactor 3..10, `parsePriceParams` max ≥ 2·maxQty plus a `continue` guard (F4); `drawFourDigit` bounded (F7) |
| `src/core/curriculum.ts`, `src/core/round/artFilter.ts`, `tests/curriculum.test.ts` | stale comments; `UNIT_CHOICE` removed from `LATER` (F7) |
| `tests/round.test.ts` | `round with several right tiles (Task.check)`: 2 tests (F2) |
| `tests/clockElapsed.test.ts`, `tests/price.test.ts`, `tests/timesMore.test.ts`, `tests/lengthText.test.ts` | new span-minimum test, parser rejections, scale prompt regex |
| `context/changes/text-measure-time-types/plan.md` | `[reviewer]` rows 1.5, 2.6, 3.5, 4.6, 5.5, 6.5, 7.5, 8.6, 9.5 ticked |
| `context/changes/text-measure-time-types/follow-ups/review-fixes.md` | section "From the implementation review": 6 follow-ups, each with `Trigger:` |
| `context/changes/text-measure-time-types/change.md` | status `impl_reviewed` |

## 3. Verification

All observed in this step. The baseline is main `e2f7caa`: unit 2479, e2e 82.

| command | result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK (before and after the fixes) |
| `npm test` before the fixes | 2666 passed (139 files) = 2479 + 187 |
| `npm test` after the fixes | 2669 passed (139 files) = 2479 + 190 (branch +3: 2 round, 1 span) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1` ... `E6` | `Naruszenia: 0` × 6 (before and after) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=… --workers=4`, before the fixes | 86 passed (6.3 min) = 82 + 4 |
| same, after the fixes (fix commit `6d20b08` content) | 86 passed (5.8 min) = 82 + 4 |
| break: `startableSteps` keeps the review step | red: `curriculumStart` E6 and `review.test.ts`, expected `[2,3,5,7,9,10]`, received `[2,4,6,8,10,11]`; restored. Meta-check: it proves the calendar exclusion, not the step count |
| break: `isCorrect` ignores `check` (before F2) | all 2666 green, which revealed the gap (F2) |
| same break after F2 | the 2 new `tests/round.test.ts` tests red (`expected 'second' to be 'done'`, `expected null to be 'second'`); restored. Meta-check: the oracle reads the prompt, not `task.check` |
| teacher read `sample -- E1/E5/E6 --count 6` + scans `--count 60`, seeds 1-5 | E5 times-table ops max divisor 10, max quotient 10 (2100 ops); E5.12 max factor 10 after F1; TV match 46-110 min, film 30-107 min after F5 |
| servers 4397/4398 | no listener after the suite (`lsof -sTCP:LISTEN`) |

## 4. Next command

`visual gate`

## 5. Open

- `[visual]` rows 2.7, 3.6, 4.7, 5.6, 6.6, 7.6, 8.7 in plan Progress. The screenshots are taken after this fix commit.
- `[human]` 4.8: the tablet voice reads `spokenTime` "8 15" as a time. Also listen for "okienko plus jeden mniejsze niż pięć" (`pl.speech.less`) and unit symbols such as "560 g".
- `[human]` 9.6: the decisions that differ from ZADANIA/PRD (plan row 9.6).
- Follow-ups in `follow-ups/review-fixes.md`: `pl.speech` comparison verb; unit symbols in `speak`; "Oblicz." before the place-value box; `TaskScene` `reported`; CLOCK_ELAPSED `end` never crosses midnight; duplicates `withSpeech` and the time shifts.
- At archive time: the roadmap still shows S-14c as `planning`.

## 6. Autonomous decisions

1. **I fixed the WARNINGs in place instead of deferring them.** The step prompt says content wording is cheap, so fix it. All the fixes are small and covered by tests. What would change this: a fix that needs a new widget or save format.
2. **I set `SCALE_PLAN_CM.max` to 10 rather than adding a `maxPlan` param.** I rejected the param because E5.12 is the only user and a plan drawn on paper is short anyway. What would change this: an E6 scale skill that needs larger plans.
3. **I left `pl.speech.less/greater` unchanged; it is a follow-up.** The words are shared by COMPARE_EXPR and older types, so changing them would need a teacher read of every one of them. What would change this: the [human] voice check finding the reading wrong.
4. **I wrote per-template `minSpan` values myself** (match 45, film 30, train 20, the rest 10), based on a teacher's sense of real life. What would change this: a teacher read asking for other floors.
5. **I ticked `[reviewer]` 8.6 and 9.5 on code evidence:** an empty diff of `save.ts`/`variants.ts`/fixtures, an unchanged `RoundKind`, every follow-up has a `Trigger:`, and the stale comments are fixed. What would change this: a later change adding review-step state.
