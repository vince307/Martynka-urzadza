# Handoff — `text-measure-time-types` (slice S-14c)

Written by `/10x-tdd` phase 4 of run `2026-10-15-fix-s14c-s14d`. Phase 4 is done and committed (CLOCK_ELAPSED, TIME_UNITS; E5.3, E5.8, E6.1, E6.2 playable; E6 calendar start moved). The next agent must not get wrong: the E6 start oracle is now `[2, 3, 5, 7, 9, 10]` and `playableSteps(E6)` is `[1..10]` (phase 8 makes it `[1..11]` without changing the oracle); tests that needed an unplayable E6 step now use E6 with step 2 emptied (`GAPPED_E6`); `vite/e2eHookGuard.mjs` stays unchanged.

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | plan commits, p1 `9507da3`, p2 `ab3d603`, p3 `1b18c9e`, p4 `1ced210` + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; status changes are the orchestrator's) |
| `## Progress` rows remaining | 4.5 (e2e part), 4.6 `[reviewer]`, 4.7 `[visual]`, 4.8 `[human]`; 1.5, 2.6, 2.7, 3.5, 3.6 as before; phases 5-11 pending |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/generators/{clockElapsed,timeUnits}.ts` | the two generators and parsers; registered in `registry.ts`; `CLOCK_ELAPSED` added to `UNBOUNDED_TYPES` |
| `src/data/elapsed.ts` | event, timetable, night and to-hour prompt templates ({a} {b} {d}), `timeUnitsPairs` |
| `src/core/text/time.ts` | `spokenTime(hour, minute)` ("8 15", full hour "8") |
| `src/core/tasks/validate.ts` | `ACCUSATIVE_ONE` + `trwa|trwał|trwała|trwało` |
| `src/data/nouns.ts`, `src/data/pl.ts` | sekunda, doba, kwadrans; `pl.tasks.elapsed*`, `timeUnits*` |
| `src/data/curriculum/E5.ts`, `E6.ts` | `E5.3.clock_end_lesson`, `E5.8.clock_span_timetable`, `E6.1.time_units`, `E6.2.clock_to_hour`, `E6.2.clock_span_programme`; E6.2 `childName` "Ile minut do pełnej godziny" |
| `tests/{clockElapsed,timeUnits}.test.ts`, `tests/{time,validate,timesMore,curriculum,curriculumStart,curriculumPick,curriculumEnd,progress}.test.ts` | new and updated tests |

## 3. Verification

| command | result |
|---|---|
| RED (stubs returning an empty task) | `AssertionError: T.clock_elapsed.["end"] seed=1 draw=0 prompt="": expected [ { …(3) } ] to deeply equal []` (15 red across the new tests); `spokenTime`: `expected '' to be '8 15'`; TIMES_MORE fix: `factor 32: expected 32 to be less than or equal to 10` |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2561 passed = baseline 2525 + 36 (new tests in clockElapsed, timeUnits, time and validate, plus the per-skill content and solvable-in-mode invariants of the 5 new skills) |
| `sample` E1-E6 | exit 0 each, 0 violations |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied, plain command `--workers=4`); expected 82 passed = baseline 82 + 0. Checked by grep: the only E6 e2e use is `written-column.spec.ts` (forces `E6.7.*` through `?e2eSkills`), the rest mention E6 in comments, so the moved calendar start touches no spec. Phase 3's row 3.4 ticked from the orchestrator note (82 passed on `1b18c9e`) |
| Deliberate breaks | nightHours `to - from` -> red; toHour answer = minutes (counts from 0) -> `expected 58 to be 2`; `speak` with "8.15" -> red; old E6 oracle `[3, 4, 6, 8, 10, 10]` and old `playableSteps` list -> `tests/curriculumStart.test.ts` red (2); restored, 134 files green. Meta-check: oracles read the printed prompt, not `task.answer` |
| TIMES_MORE E5.10 teacher probe | both factors <= 10 (`a` capped by `maxFactor`); test checks `factors` per variant; no "78 : 13" |
| Teacher read E5 and E6 `--count 6` | times written "12.05", "trwa 45 minut", "Do 9.00 brakuje 10 minut." then "45 − 10 = 35"; first hints carry no number; counts agree (1 minuta, 53 minuty, 5 godzin, 2 doby, 5 dób, 3 kwadranse, 120 sekund); "Ile kwadransów to 60 minut?"; speech "o 8 50", "Jest 8 06. Ile minut zostało do 9?". First read had "Bajka na dobranoc" lasting 109 minutes: replaced by "Mecz w telewizji" |

## 4. Next command

`/10x-tdd text-measure-time-types phase 5` (phase 5, `Driver: tdd`)

## 5. Open

- `[reviewer]` 4.6 (done informally above), `[visual]` 4.7 screenshots (E5.3 tiles first try and hint, E5.8 timetable on the keypad, E6.2 to-hour, TIME_UNITS solution step; 1440x900 and 1024x768); 1.5, 2.6, 2.7, 3.5, 3.6 as before; `[human]` 4.8, 9.6.
- 4.5 stays unticked until the orchestrator's e2e run (`82 + 0`).
- Unlock thresholds now (for the PR body): E5.3 n 2 -> 3 (threshold 1 -> 2), E5.8 n 1 -> 2 (1 -> 1), E6.1 n 3 -> 4 (2 -> 2), E6.2 n 0 -> 2 (-> 1). A learner saved on E6 step 1 or 2 now unlocks step 2 normally.
- The E6 calendar start moves earlier by one step per month (spring: 2, 3, 5, 7, 9, 10).
- Nothing in the app lists E5.8 vs E6.2 spans separately: `theme: 'ride'|'show'` (parser extension, see §6) keeps them apart.

## 6. Autonomous decisions

1. **TIMES_MORE both factors in the table (<= `maxFactor` = 10):** the smaller amount `a` is now drawn from `2..min(max, maxFactor)` (was `2..max`), so "Ile razy więcej" never divides 78 by 13. Rejected: a new param (the existing `maxFactor` already says it). Would change: a skill wanting two-digit bases (E6.4 style).
2. **`theme?: 'ride' | 'show'` added to CLOCK_ELAPSED params** (contract in the plan lists only variants/maxSpan/lesson): E5.8 uses timetables, E6.2 uses programmes; absent = both. Would change: the maintainer wants the same pool in both.
3. **`end` is tiles only, durations per event** (lesson 45; break 10-20; film 60-90; cartoon 20-30; walk 30-50), start minutes in steps of 5 so the tile slips (+-5/10/15, +-60) are believable and never "8.60". `lesson: true` selects the lesson event only.
4. **`span` crosses at most one full hour** (end hour = start or start+1, spans 10..`maxSpan`, both minutes 1..59), so the hint is "to the full hour, then the rest, sum". Longer multi-hour spans wait for a follow-up.
5. **`speak` for times uses `spokenTime`** in templates ({a} {b} swapped); TIME_UNITS has no clock times and no `speak`.
6. **TIME_UNITS `max` 400 and `maxN` per pair** (10 for hours/minutes/days, 4 for quarters) keep every number on screen <= max; n starts at 2 so the fact line "1 godzina to 60 minut." never equals the answer.
7. **Tests pinned to an unplayable E6 step 2** now use `GAPPED_E6` (E6 with step 2 emptied) to keep the "nearest lower playable step" behaviour tested; the real E6 now unlocks step 2 after step 1.
8. **Mixed phase:** none; the whole phase was TDD (data inline at the end).
