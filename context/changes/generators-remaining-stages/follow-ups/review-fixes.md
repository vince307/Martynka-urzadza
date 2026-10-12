# Follow-ups — generators-remaining-stages (S-03)

## Planned (phase 10)

- E1 numeric answers use the keypad; ZADANIA section 4 asks for 3–4 tiles (ADD_SUB). Trigger: S-04
- `monthDays` offers two tiles and has no February 28/29 handling. Trigger: S-17
- BONDS "connect pairs that make 10" and CHOOSE_OP with a picture. Trigger: S-13
- Content polish of E1–E2 and E5–E6 (prompts, hints, distractors). Trigger: S-17

## Open content items from phases 6–9 (for the impl-review to judge and fix)

- `E1.7.complement_10` prompt "Ile brakuje od 2 do 10?" is awkward Polish; same wording in `E6.5` ("od 35 do 100"). Fix in `src/core/tasks/generators/complement.ts` / `pl.ts`. Trigger: impl-review S-03
- `E2.1.add_sub_20_units` can show `20 − 7` although `bridge: 'none'`. Trigger: impl-review S-03
- `E6.4.mult_teens` hints use 5 · 12 = 60 | 60 + 5 and halving (3 · 18) instead of the tens-and-units split; fix `multHint` for a two-digit second factor. Trigger: impl-review S-03
- `E5.9.fact_check_div_100` can show `98 : 49 = 2` (valid, unusual). Trigger: impl-review S-03
- Earlier open points: MISSING_OP bare prompt, CHAIN tiny `max`, CHOOSE_OP tiles, FACT_FAMILY keypad. Trigger: impl-review S-03
- Teacher read of phase 7/8 hints (COMPARE_NUM large, ROUNDING hundreds/thousands, ·200, 120 : 6) to confirm. Trigger: impl-review S-03
