# Follow-ups — generators-remaining-stages (S-03)

## Planned (phase 10)

- E1 numeric answers use the keypad; ZADANIA section 4 asks for 3–4 tiles (ADD_SUB). Trigger: S-04
- `monthDays` offers two tiles and has no February 28/29 handling. Trigger: S-17
- BONDS "connect pairs that make 10" and CHOOSE_OP with a picture. Trigger: S-13
- Content polish of E1–E2 and E5–E6 (prompts, hints, distractors). Trigger: S-17

## Open content items from phases 6–9 — resolved by impl-review (`499e449`)

- Complement prompt: now „Ile trzeba dodać do 2, żeby było 10?” (`pl.tasks.complement`). Done.
- `E6.4.mult_teens` hint: `multHint` splits a teen factor into tens and units. Done.
- `E5.9.fact_check_div_100` `98 : 49`: `checkDiv` stays within the times table (`TABLE`). Done.
- COMPARE_NUM „2 ma 1 cyfra”: `digitsPhrase` writes „1 cyfrę”, and the validator rule `ACCUSATIVE_ONE` catches the whole class. Done.
- F12 hint: breaks one ten („10 − 4 = 6 | 80 + 6 = 86”). Done.
- Phase 7/8 hints (COMPARE_NUM large, ROUNDING, ·200, 120 : 6) confirmed in `reviews/teacher-read.md`.

## From impl-review (2026-10-12)

- `E2.1.add_sub_20_units` / `E2.9.add_sub_99` / `E3.6.add_sub_30_nobridge` draw `20 − 7`, `30 − 9` under `bridge: 'none'`. This follows `crossesTen` (a full-ten minuend does not cross) and ZADANIA E4.2 („50 − 3” in a step without crossing), and the hint now reads „10 − 7 = 3 | 10 + 3 = 13” (analogy). If the maintainer reads E2.1 as „no full-ten minuend”, add a `bridge` option (e.g. `'strict'`) that rejects `a % 10 === 0 && b % 10 > 0` for „−”, and use it in E2.1/E3.6 data. Trigger: maintainer read (row 10.6) or S-17
- `src/data/wordTemplates.ts` template `sum.bought` with context `złoty` gives „kupił jeszcze 2 złote” (E1.3 CHOOSE_OP, E3.1 WORD). „64 kredki rozłożono na 8 talerzy” (E5.10) is an odd context too. Add a per-context flag (e.g. `buyable`) and filter contexts per template. Trigger: S-17
- COMPLEMENT hint is one line with the answer („175 + 825 = 1000”); a step method (175 + 25 = 200, 200 + 800 = 1000) is missing. The same applies to DIV for teens („7 · 12 = 84” instead of 70 : 7 + 14 : 7). Trigger: S-17
- `AGENTS.md` Commands line lost „CI runs all three on every PR” (it now says only „CI runs sample for every stage”); restoring it needs a word trimmed elsewhere (limit 400, now 399). Trigger: next AGENTS.md edit
- Parser edge cases not reachable by today's data: `parseComplementParams` without `targets` accepts a `max` that is not a multiple of 10 (max 25 → target 30), `parseRoundingParams` accepts `max` not a multiple of `to` (answer 1100 > max 1080). Reject in the parser. Trigger: a stage adding such params
- Generator unit tests (chain, missingOp, factFamily, rounding, div) parse numbers with bare `\d+`; safe below 10 000, blind to grouped numbers. Use `NUMBER_SOURCE` from `src/core/text/formatNumber.ts`. Trigger: any test param ≥ 10 000
