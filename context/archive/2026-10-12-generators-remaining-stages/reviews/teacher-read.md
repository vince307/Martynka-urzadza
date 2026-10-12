# Teacher read — generators-remaining-stages (S-03)

Rows 6.4, 9.4 and 10.4 of the plan. Reviewer: impl-review step of run `2026-10-12-s03-remaining-stages`, 2026-10-12.

Method: `npm run sample -- <stage> --count 6` for E1, E2, E5, E6 (plus E3 and E4 for regressions), default seed, before and after the fix commit `499e449`. I read every printed task as a Polish primary-school teacher would. For each one I checked:

- the answer;
- numeral agreement, and the accusative after „ma”, „kupił”, „oddał” and „o … więcej”;
- verb gender;
- whether the context makes sense;
- whether the hint teaches the school method without giving the result in its first line;
- step constraints;
- whether the tiles leave exactly one correct answer.

Every stage ended with `Naruszenia: 0` both before and after the fix commit. I also drew larger samples (E6 `--count 60/80`, `--seed 7`) to see the COMPARE_NUM digit-count hints, which the default 6 draws do not show.

## Verdict per stage (after `499e449`)

| Stage | Verdict | Notes |
|---|---|---|
| E1 | PASS with observations | Fixed: the complement prompt. Remaining items are in the observations below |
| E2 | PASS with one judgement for the maintainer | `20 − 7` in steps without crossing, see (a) |
| E5 | PASS | Fixed: `fact_check_div_100` now stays within the times table |
| E6 | PASS | Fixed: hints for `mult_teens`, the complement prompt, the digit-count hint and its trivial pairs, the „wiek” question |
| E3, E4 (regression) | PASS | Prompt and hint text changed only in E3.6 (`30 − 9`), E4.4 (`sub_from_full_ten`, `complement_next_ten`) and E4.2 (`90 − 1`), all through the same fixes |

## The orchestrator's items a)–f)

**a) `20 − 7` in E2.1 / E2.9 (`bridge: 'none'`): confirmed that it is drawn; judged NOT a step violation; the hint is fixed.**

- `src/core/tasks/generators/addSub.ts` `crossesTen` / `hasCarry` treat a minuend that is a full ten as non-crossing ("50 − 3 do not", an S-02 decision).
- The catalogue `docs/ZADANIA.md` agrees. E4.2, a step without crossing, lists „36 + 2, 47 − 5, 47 + 3, **50 − 3**”, and crossing starts at E4.4.
- In grade 1, „20 − 7” in the 11–20 range is taught by analogy with „10 − 7” (20 = 10 + 10, „budowa 10 + n”, which is exactly E2.1's title).
- What was wrong was the hint. „20 − 10 = 10 | 10 + 3 = 13” is the compensation method. After the F12 change in (f) it reads „10 − 7 = 3 | 10 + 3 = 13”, which is the analogy itself.
- Severity: WARNING (a didactic call). I left it for the maintainer's read (row 10.6) with a follow-up.

**b) „2 ma 1 cyfra”: CONFIRMED, CRITICAL (a grammar error a child sees). Fixed.**

- `compareNum.ts` `largeHint` now uses `digitsPhrase`, which writes `pl.tasks.oneDigit` = „1 cyfrę”.
- `src/core/tasks/validate.ts` gained `ACCUSATIVE_ONE`, which flags „<verb> 1 <feminine nominative in -a>” after „ma, mają, miał(a), kupił(a), oddał(a), dostał(a), zabrano, dołożono, o”.
- Tests:
  - `tests/validate.test.ts` "flags a feminine nominative after a verb…" checks the validator rule directly.
  - `tests/compareNum.test.ts` "a one-digit number „ma 1 cyfrę”" uses `max: 1000`. At `max: 1 000 000` (E6.10) a one-digit number is now practically unreachable.
- Before the fix nothing caught this: only `tests/wordTemplates.test.ts` had the accusative regex, and only for word templates.

**c) Trivial pairs `612 449 □ 2`: CONFIRMED (about 8 % of draws had one number ≥ 100 000 and the other < 100). WARNING. Fixed.**

- `compareNum.ts` `largePartner`: a pair of different lengths now differs by exactly one digit. The uniform branch draws a partner of the same length.
- A 7-digit length that holds only `max` is skipped, so 1 000 000 is no longer the partner in about 14 % of the draws.
- Read after the fix: „60 272 ma 5 cyfr | 420 836 ma 6 cyfr | Liczba z większą liczbą cyfr jest większa | 60 272 < 420 836”, „51 606 □ 1558 → 1558 ma 4 cyfry”. Both are correct.

**d) „Ile brakuje od 2 do 10?”: CONFIRMED awkward. WARNING. Fixed** in `src/data/pl.ts` `pl.tasks.complement`.

- New prompt: „Ile trzeba dodać do 2, żeby było 10?”. It is the same question as the BONDS hint, so the child meets one phrasing.
- It applies to E1.7, E4.4 and E6.5 („Ile trzeba dodać do 175, żeby było 1000?”).

**e) `E6.4.mult_teens`: CONFIRMED (5 · 13 → 5 · 12 = 60 | 60 + 5; 3 · 18 → halving; 2 · 17 → the answer alone). WARNING. Fixed** in `mult.ts` `multHint`.

- A second factor of 11–19 with a first factor of 2–9 now gets three lines: „5 · 10 = 50 | 5 · 3 = 15 | 50 + 15 = 65”.
- E3/E4 never draw a teen second factor, so they are unchanged.

**f) F12 for small subtrahends („90 − 4 → 90 − 10 = 80 | 80 + 6”): CONFIRMED odd. WARNING. Fixed** in `addSub.ts` `addSubHint`.

- Instead of restricting the rule to subtrahends ≥ 6, the hint now always breaks one ten: „10 − 4 = 6 | 80 + 6 = 86”, „10 − 9 = 1 | 60 + 1 = 61”, „10 − 7 = 3 | 10 + 3 = 13”.
- This is the grade-2 method for „80 − 7” (70 + (10 − 7)). It reads naturally for every subtrahend 1–9, and the first line never contains the result.

## Other findings from the read

| Step | Finding | Severity | Decision |
|---|---|---|---|
| E5.9 `fact_check_div_100` | „98 : 49 = 2. Sprawdź: 2 · 49”, „78 : 26 = 3”. Checking requires multiplying beyond the times table, which is outside step E5.9 | WARNING | Fixed: in `factFamily.ts`, `checkDiv` keeps divisor and quotient ≤ `TABLE` (10). After the fix: „60 : 6 = 10. Sprawdź: 10 · 6 = □” |
| E6.1 `calendar_time` | „Ile lat ma wiek?” is ambiguous („wiek” = age) | OBSERVATION | Fixed in `src/data/calendar.ts` `timeFacts`: „Ile lat trwa jeden wiek?” |
| E1.3 `choose_op_5`, E3.1 `word_20` | „Tomek miał 3 złote i kupił jeszcze 2 złote.” You do not buy money. The cause is S-02's `sum.bought` template with the `złoty` context | WARNING | Follow-up (template data, S-02 origin), Trigger: S-17 |
| E1.2 `compare_num_5` | Hint „3 to 3 jedności” uses place value for numbers 1–5 | OBSERVATION | Accepted (shared `max ≤ 100` hint, correct) |
| E1.3 `missing_5`, E3.2 | „Policz w drugą stronę: 4 − 1 = 3” gives the result in the first line | OBSERVATION | Known F14, Trigger: S-04 |
| E1.6, E3.7 `even_odd` | The one-line hint names the answer („…więc jest parzysta”) | OBSERVATION | Accepted (S-02 pattern) |
| E1.7, E4.4, E6.5 complement | The hint is one line containing the answer („175 + 825 = 1000”), with no step method (175 + 25 = 200, 200 + 800 = 1000) | OBSERVATION | Follow-up, Trigger: S-17 |
| E5.8 `mult_6_9` | „10 · 6 → 10 · 3 = 30 \| 30 + 30” halves the factor where „10 · 6 = 60” is direct | OBSERVATION | Accepted (correct; S-02 `multHint`) |
| E5.10 `word_100` | „64 kredki rozłożono po równo na 8 talerzy” is an odd context | OBSERVATION | Follow-up with the złote item (S-17) |
| E6.4 `div_teens` | The hint is a multiplication check („7 · 12 = 84”), not the split 70 : 7 + 14 : 7 | OBSERVATION | Follow-up, Trigger: S-17 |
| E6.8 `mult_tens_hundreds` | „2 · 90 = 180” is one line (the ·2 direct rule) | OBSERVATION | Accepted |

These passed with no remarks:

- weekday cases („po piątku”, „przed niedzielą”);
- BONDS, CHAIN, COMPARE_EXPR („10 − 7 □ 6 − 3 → =”, with both results shown) and MISSING_OP (direction sentence, then the equation);
- CHOOSE_OP tiles (exactly one correct; no swapped-sum distractor);
- SEQUENCE hints;
- FACT_FAMILY swap, checkSub and checkAdd;
- ROUNDING to 100 and 1000;
- ROMAN up to MM;
- grouped numbers ≥ 10 000 with NBSP;
- MULT tens and hundreds („5 · 7 = 35 | 35 · 10 = 350”);
- DIV with quotients;
- calendar quarters, months and days of a month (the knuckles hint);
- E5.6 bridging hints;
- E6.8 `sub_from_hundreds`.

Rows 6.4, 9.4 and 10.4 pass after `499e449`.
