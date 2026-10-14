# Handoff — `art-tasks-all-stages` (slice S-14)

Written by the `/10x-implement` step for phase 8 (commit `fe8e025`): E1.8, E1.10, E2.2, E2.8 and E5.5 are playable, S-13 widget skills joined E1.11, E2.1, E2.9, E2.10, E5.7 and E6.5, and the step-order tests were re-derived by hand from rule D. Phase 9 (docs) is next; the e2e of this phase (8.6) was NOT run here (Chromium cannot start) and two skills of the plan were cut (see §6).

## 1. State

| | |
|---|---|
| Branch | `feat/art-tasks-all-stages`, cut from `main` at `bb00d7f` |
| Commits | `46aff1d` (p1), `d4f4470` + `ab0dc05` (p2), `b6a947d` (p3), `ba4e0da` (p4), `89e5ea0` (p5), `44c4f19` (p6), `5cdf740` (p7), `fe8e025` (p8), this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; the implement epilogue is for the last phase) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; open for this phase: 8.6 e2e (orchestrator), 8.7 reviewer, 8.8 visual, 8.9 human; row 7.5 ticked from the orchestrator note |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/curriculum/E1.ts` | E1.8 `length_ruler_cm_10` ("Centymetr i linijka"); E1.10 `count_12` ("Liczby 11 i 12"); E1.11 `clock_read_full`, `childName` now "Zegar, miesiące i pieniądze" (all tiles) |
| `src/data/curriculum/E2.ts` | E2.1 `place_read_20`; E2.2 `money_count_20`, `money_change_20`, `capacity_litres` ("Pieniądze do 20 zł i litr"); E2.8 `money_count_gr`, `mass_dag_100`, `mass_convert`, `length_convert_m` ("Grosze, dekagramy, metr"); E2.9 `place_read_99`; E2.10 `data_most_10`, `data_howmany_10`, `clock_later_1h`; new consts `ZL_20`, `GR_COINS`, `DAG` |
| `src/data/curriculum/E5.ts`, `E6.ts` | E5.5 `capacity_quarter_l`, `mass_half_kg_e5` ("Litry i kilogramy"); E5.7 `length_ruler_mm`; E6.5 `place_read_1000` |
| `tests/curriculumStart.test.ts` | `playableSteps` E1 `[2..11]`, E2 `[1..10]`, E5 `[1..11]`; `ORACLE` E1 `[3,4,6,8,10,11]`, E2 `[2,3,5,7,9,10]`, E5 `[2,4,6,8,10,11]` with the hand arithmetic in a comment |
| `tests/curriculumEnd.test.ts`, `curriculumPick.test.ts`, `progress.test.ts` | pins moved: E2 step 1 now 2 skills (1-skill cases use E2.3, unlocks to 4); E2.1 unlocks 2, E1.7 unlocks 8, E6.1 unlocks 4 (E6.2/6.3 empty); the "unplayable step falls back" tests use E5.12 (to 11) and E6.3; progress E5 step 12 is 11 of 11 |
| `tests/contentInvariants.test.ts` | `SMALL_SPACES` + `E1.8.length_ruler_cm_10`, `E2.1.place_read_20`, `E2.2.capacity_litres` (10 distinct each) |
| `context/changes/art-tasks-all-stages/plan.md` | rows 7.5, 8.1-8.5 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/art-tasks-all-stages` (observed) |
| `npm test` | 1844 passed (branch baseline 1782, +62: new skills' invariants and generator draws; no test removed) (observed) |
| `npm run lint`, `npm run typecheck` | clean (observed) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK, OK (observed) |
| `npm run sample -- E1` ... `E6` | "Naruszenia: 0" each; `--count 6` read for E1.8, E1.10, E1.11, E2.1, E2.2, E2.8, E2.9, E2.10, E5.5, E5.7, E6.5 |
| `npm run build` | green, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| Deliberate break 1 | E2.2 `skills` emptied: `tests/curriculumStart.test.ts` red ("lists the steps with at least one playable skill" and the E2 oracle row); restored |
| Deliberate break 2 | E1.10 `childName` removed: `tests/curriculum.test.ts` red ("E1.10 has a short childName"); restored |
| Meta-check | the oracle rows are typed from the arithmetic in the comment (k = min(n, max(2, ceil(p·n))), n = 10 / 10 / 11), they match research § 7 and not read from `calendarStart` |
| e2e | not runnable in this session — orchestrator gate (`MachPortRendezvousServer ... Permission denied`, plain `npx playwright test --config=...` tried twice; 22 failed at launch, 20 not run). Expected `42 passed + 0`; row 8.6 unticked |
| adaptive.spec runtime | not measured here. Risk assessment: it draws E4 rounds; E3/E4 pools gained no skill in this phase, only the previous-stage bucket of E4 (all E3, unchanged) and E1/E2/E5 pools changed, so no slower tasks expected |
| Teacher read | E1.8 ruler from 0, "Ile centymetrów ma ten odcinek?"; E1.10 "Ile jest kredek/kłębków/kluczy/filiżanek/poduszek/czajniczków?" with "10 + 1 = 11"; E1.11 clock full hours; E2.2 "Ile złotych leży na stole?", change story "Ania miała 16 zł. Kupiła klocek za 5 zł."; E2.2 litres "To razem 4 litry / 1 litr"; E2.8 grosze, "Jabłko waży 30 dag", "Brakuje 90 dag", "2 m 30 cm to ile centymetrów?"; E2.10 bars and "Która godzina będzie za 1 godzinę?"; E5.5 jugs "Dwa dzbanki po pół litra to razem litr", "do pół kilograma"; E5.7 mm ruler; E6.5 blocks to 999: agreement, accusative and hints OK |

## 4. Next command

`/10x-implement art-tasks-all-stages phase 9` (phase 9, Driver: impl)

## 5. Open

- Row 8.6 (orchestrator): `npx playwright test` expects 42 passed; `first-launch` and `adaptive` are the specs most likely to move (E2 warm-up now steps 1 and 2 with money; E5/E1 starts shifted). Rows 8.7 `[reviewer]`, 8.8 `[visual]` (ruler E1.8, 11-12 ten + rest, money E2.2, grosze and dag scale E2.8, ¼ l jugs E5.5, unlock card with new `childName`), 8.9 `[human]` (scope narrower than the roadmap letter).
- Earlier open: 6.3 (tall-layout break, phase 10), 7.6, 7.7, 1.5, 2.8, 2.9 `[human]`, 3.5, 4.5, 5.7, 5.8, 5.9, 6.6, 6.7.
- Teacher-read notes for the reviewer: `E1.10.count_12` has only 11 and 12 (2 values, tiles; icons vary the distinct tasks); `E5.5.mass_half_kg_e5` repeats `E4.1.mass_half_kg` (same params, revision in grade 3 as the plan wants) and its task space is small (weights 10-40 dag); `E2.8.length_convert_m` is metres 1-2 with tens of cm (the plan's `{convert, …}` left open); E2.10 `childName` "Dni tygodnia i miesiące" now covers charts and clock too (unchanged, plan did not rename).
- Phase 9 writes the DESIGN-GAP rows (from 59) and follow-ups: add `S-14b` (E1.10 `place_read_12`, E5.5 `capacity_half_l_e5`) to the cut list; E4.1 banknotes 200/500 zl follow-up `Trigger: S-14c`.
- `ARTIFACT GAP: none`.

## 6. Autonomous decisions

1. `E1.10.place_read_12` (PLACE_VALUE read 11..12) dropped: 2 distinct tasks in 1000 draws, top share 50 % against `MAX_TOP_SHARE` 0.15, a task space the generator cannot widen (min 11, max 12). E1.10 keeps `count_12` (ten + rest). Rejected: a `SMALL_SPACES` entry (the share rule would still fail), widening to 11..20 (that is E2.1). Would change: a place-value variant for 11-12 with a different drawing.
2. `E5.5.capacity_half_l_e5` dropped, following the plan's cutting order: 5 distinct tasks (top share ~20 %). Raising `maxLitres` to 10 would equal `E4.7.capacity_litres_half` exactly (same jugs, variant, range), so it was not raised. E5.5 keeps `capacity_quarter_l` (`maxLitres` 4, as the plan) and `mass_half_kg_e5`. Would change: a half-litre variant that differs from E4.7 (for example mixed with ¼ l).
3. `E2.8.length_convert_m` params `{ maxM: 2, cmStep: 10 }`: the first try `{ maxM: 5, cmStep: 50 }` gave 9 distinct tasks (< 12); metres 1-2 with tens of cm give 19, no `SMALL_SPACES` needed. Rejected: `maxM 9, cmStep 50` (half metres only, weaker school fit). Would change: the teacher read finding "2 m 30 cm" too hard for grade 1.
4. `SMALL_SPACES` entries only for `E1.8.length_ruler_cm_10`, `E2.1.place_read_20`, `E2.2.capacity_litres` (10 distinct each, top share ~10 %, within `MAX_TOP_SHARE`), as the plan names for E2.1 and E2.2; E1.8 measured here (segment 1..10 cm from zero, `startShift` 0 as grade 1 reads from the zero mark).
5. The E1.11 `childName` changed to "Zegar, miesiące i pieniądze" as the plan table says; "Miesiące roku" was the old name and the unlock card reads it.
6. The curriculumEnd "1-skill step" cases moved from E2.1 to E2.3 (the real 1-skill step, unlock to 4); the E5 "skips unplayable" case became a three-stage case (E2.1 to 2, E1.7 to 8, E6.1 to 4) because E5 has no gap between playable steps anymore; E6.2/E6.3 carry the gap.
7. e2e not run (Chromium cannot start); orchestrator note applied to row 7.5.
