# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by `/10x-implement` phase 6 (commit 7824b24): E3.3, E3.4, E3.5, E4.3, E4.7 are playable, E3.6, E3.11, E4.1, E4.8 got new skills; the step order changed here and only here, tests and the `first-launch`/`adaptive` specs follow it.
The ordering rule stays: no answer mode enters `playable` (`src/core/round/pick.ts`) before `tests/e2e/support/hook.ts` `answerRight`/`answerWrong` can answer it (`select` phase 7, `drag` phase 9).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | docs/plan commits + p1 `42a0bee` + p2 `43002aa` + p3 `d481d3c` + p4 `bd16d47` + p5 `9b7da6e` + p6 `7824b24` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (open: 1.5, 2.5, 3.4 [reviewer]; 4.4 [visual], 4.5 [reviewer], 4.6 [human]; 5.3 [reviewer]; 6.7 [reviewer], 6.8 [visual], 6.9 [human]; phases 7-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/curriculum/E3.ts`, `E4.ts` | 17 new skills (E3.3 2, E3.4 4, E3.5 1, E3.6 +2, E3.11 +1; E4.1 +2, E4.3 3, E4.7 2, E4.8 +1) and `childName` for E3.3 "Zegar: pełne godziny", E3.4 "Diagramy", E3.5 "Mierzenie odcinków", E4.3 "Zegar: minuty i kwadrans" (the plan's longer name broke the 28-character limit of `tests/curriculum.test.ts`), E4.7 "Metry, centymetry, milimetry" |
| `tests/curriculumStart.test.ts` | `playableSteps` E3 [1..11], E4 [1..8]; `ORACLE` rows E3 `[2,4,6,8,10,11]`, E4 `[2,3,4,6,8,8]` derived by hand from rule D (derivation in the comment above `ORACLE`); `minStartSteps 3` case now 3; `startLearning` E3 October = 4 |
| `tests/curriculumPick.test.ts`, `tests/curriculumEnd.test.ts`, `tests/progress.test.ts` | cases that used a gap in E3/E4 moved to E5 step 5 (still `skills: []`); E3 earlier = steps 1-5, E3 has 11 steps, E4 step 6 unlocks 7 |
| `tests/curriculumPick.test.ts`, `tests/warmup.test.ts` | the "no repeated prompt" checks now key on `prompt|visualKey` (several blocks tasks share "Jaka to liczba?") |
| `tests/e2e/first-launch.spec.ts`, `tests/e2e/adaptive.spec.ts` | October warm-up leaves `unlockedStep.E3` at 4; adaptive unlock is step 3 named "Zegar: minuty i kwadrans" |
| `docs/design-gaps.md`, `src/ui/dom/progressView.ts` | row 58 (parent preview without drawing) and its `DESIGN-GAP` comment |
| `context/changes/drawn-widget-tasks-e3-e4/plan.md` | Progress rows 5.1, 6.1-6.6 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `npm test` | 1412 passed (branch baseline 1353, +59: content invariants and 1000-draw checks cover the new skills automatically) (observed) |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)`; deploy tests OK (observed) |
| `npm run sample -- E1..E6` | 0 violations each (observed) |
| e2e | `npx playwright test --config=...` ran in this session: 37 passed (baseline 37, +0), including `first-launch` and `adaptive` (observed) |
| `git diff --stat tests/fixtures` | empty |
| Deliberate break 1 | `childName` removed from E4.3 -> `tests/curriculum.test.ts` "E4.3 has a short childName" red; restored |
| Deliberate break 2 | E3.4 back to `skills: []` -> `tests/curriculumStart.test.ts` "lists the steps with at least one playable skill", "E3: the five months..." and "opens every stage at its calendar start" red; restored. Meta-check: the oracle is typed from rule D, the break changes data not the test's `RULES`, so the red comes from the step order |
| Teacher read | `npm run sample -- E3 --count 6` (E3.3, E3.4, E3.5, E3.6, E3.11) and `-- E4 --count 6` (E4.1, E4.3, E4.7, E4.8) read task by task, plus 30 draws of `clock_read_half`. Read: numeral agreement ("1 godzinę", "2 godziny", "1 dziesiątka / 2 dziesiątki / 5 dziesiątek / 1 setka / 5 setek"), accusative ("na jabłko", "na gruszkę", "na konia", "na królika niż na kota"), clock hints (first step names the hands, the time only in the last line), `later` hint "9 + 3 = 12", 24-hour distractors (without +12, one hour either side) unambiguous, bar-chart `most/least/howMany/diff` hints list the values first and give the result last, ruler hints give start and end, results only in the last step, `convert` "3 m 60 cm" and "3 m" (never "1 m"), blocks `read` with 0 tens ("108") and with hundreds. No change needed. Notes: `clock_read_half` and `clock_read_quarter` include full hours (by design of `randomMinute`, :30 appears ~50% of draws in `half`); the `diff` hint ends with the subtraction, which is the answer line |

## 4. Next command

`/10x-implement drawn-widget-tasks-e3-e4 phase 7`

## 5. Open

- [reviewer] 6.7 teacher read is recorded above for the reviewer to confirm; [visual] 6.8 and 4.4 need screenshots (blocks E3.6/E4.8, chart `most`/`diff`, chart with steps, unlock card of E3.3, clock, ruler); [human] 6.9, 4.6.
- Rows 1.5, 2.5, 3.4, 4.5, 5.3 [reviewer].
- `TaskScene.render` still throws for `select`/`drag` (removed in phases 7 and 9); `playable` still excludes them, so `E3.7.select_even_30` stays out of rounds.
- Karta "Nowa umiejętność!" for E3 step 3 now reachable (fixture `save-v1.json` `pendingUnlock {E3, 3}` unchanged, load test green).
- DESIGN-GAP 58 added. ARTIFACT GAP: none.

## 6. Autonomous decisions

1. `childName` of E4.3 shortened to "Zegar: minuty i kwadrans" (plan said "Zegar: minuty, pół godziny, kwadrans", 36 characters > 28 limit of the existing test). Rejected: raising the limit. Reverses if the card layout is measured to take more.
2. Tests that needed a step without playable skills use E5 step 5 (`skills: []`, S-14 scope); they will need another stage when S-14 fills it (record for S-14). Rejected: fabricating an empty step in test data.
3. Uniqueness assertions in `curriculumPick`/`warmup` use `prompt|visualKey`, the same key as `distinctTasks`, since identical prompts with different drawings are different tasks.
4. Hand-derived `ORACLE` cells: E3 `[2,4,6,8,10,11]`, E4 `[2,3,4,6,8,8]` (E4 September floors at `minStartSteps` 2, July stays in E4 so progress 1).
5. Ticked 5.1 from the orchestrator note (e2e 37 passed on 95691b0); e2e of this phase ran here and passed.
