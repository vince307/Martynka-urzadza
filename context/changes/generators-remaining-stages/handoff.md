# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-tdd phase 8` step of run `2026-10-12-s03-remaining-stages`. Phases 1–8 are committed (phase 8: `9bdb2b0`). Phases 9–10 remain; row 6.4 is the reviewer's.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | … + `9bdb2b0` `feat(generators-remaining-stages): ROUNDING do setek i tysięcy, DIV z listą ilorazów, podpowiedź MULT dla pełnych dziesiątek (p8)` + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 12 (rows 8.1, 8.2 ticked with `9bdb2b0`; 6.4 is [reviewer]) |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/generators/rounding.ts` | `RoundingParams.to: 10 \| 100 \| 1000`, parser (`max` ≤ 10 000, `max` ≥ 2·`to` for 100/1000), ties (`n % to === to/2`) skipped, text via `formatNumber` |
| `src/core/tasks/generators/div.ts` | `DivParams.quotients`; parser rejects empty/non-positive lists and lists with no fitting divisor·quotient; quotient picked from list, `ONE_SHARE` only without it |
| `src/core/tasks/generators/mult.ts` | `multHint`: second factor k·10 / k·100 (k 2–9) with `a` 2–9 gives table line + `· 10`/`· 100` line; `b === 100` joins `b === 10` as a single line |
| `src/data/pl.ts` | `pl.tasks.rounding(n: string, to)` (setka / tysiąc, gender), `roundingHint` takes strings |
| `tests/rounding.test.ts`, `tests/div.test.ts`, `tests/mult.test.ts` | phase-8 tests (`rounds to the nearest full 100/1000`, `words the E6 prompts in the right gender`, `draws the quotient from the list when given`, `rejects quotients that fit no divisor`, `splits full tens and hundreds by the table`) |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run, no stub needed: behaviour absent) | `AssertionError: expected [Function] to not throw an error but 'TypeError: ROUNDING params.to supports only 10 for now, got 100' was thrown`; `expected undefined to deeply equal [ Array(13) ]` (DIV quotients); `expected [ '4 · 35 = 140', '140 + 140 = 280' ] to deeply equal [ '4 · 7 = 28', '28 · 10 = 280' ]` (MULT). 6 failed, 11 passed |
| GREEN / full | `npm test` 361 passed (branch baseline 355 after phase 7, +6); lint, typecheck, build OK; deploy tests exit 0; `sample -- E1..E4` exit 0 |
| `sample -- E3/E4 --seed 2` | byte-identical to the pre-change output (diff empty) |
| Deliberate break 1 | ROUNDING tie skip removed: RED in the new `to: 100` test and in the existing E4.4 test (`expected 5 not to be 5`); restored |
| Deliberate break 2 | DIV ignoring `quotients`: RED `T.divq … prompt="32 : 4": expected [ Array(13) ] to include 8`; restored |
| Meta-check | the nearest-multiple test computes distances itself over all multiples (not via the hint), so it proves the answer, not the hint; break 1 is caught by the pre-existing E4.4 test too, so the new test is not the only guard for `to: 10`. DIV break proves the list is honoured, not the divisor filter |

## 4. Next command

`/10x-implement generators-remaining-stages phase 9`

## 5. Open

- Row 6.4 [reviewer] teacher read of `sample -- E1 --count 6` / `-- E2 --count 6` is open. My own read found: `E1.7.complement_10` prompt "Ile brakuje od 2 do 10?" is awkward Polish (better "Ile brakuje do 10?" with 2 given, e.g. "Do 10 brakuje …" style) — generator `src/core/tasks/generators/complement.ts` / `pl.ts` complement prompt; `E2.1.add_sub_20_units` can show `20 − 7` (crosses ten although `bridge: 'none'`, DU-U shape with a ten as minuend), hint "20 − 10 = 10 | 10 + 3 = 13" is arithmetically right; `E2.4.fact_swap_20` is `1 + 10 = □ + 1` style (clear); E1 tasks shown with keypad (follow-up S-04 later).
- Phase 9 (E6.4/E6.8/E6.9 data) uses ROUNDING `to: 100/1000`, DIV `quotients`, MULT full tens/hundreds from this phase. Phase 10 must update profile § 2, env `GATE_UNIT` and `ci.yml` with sample E1–E6 (contract already uses E1–E4).
- Earlier open points still apply (MISSING_OP bare prompt, CHAIN tiny `max`, CHOOSE_OP tiles, FACT_FAMILY keypad, `monthDays` two tiles).
- Phase 7 teacher read (own): COMPARE_NUM large hints read correctly, e.g. "796 866 □ 796 867" → "Porównujemy cyfry od lewej. Pierwsza różna cyfra jest na miejscu jedności: 6 i 7 / 796 866 < 796 867" and "612 449 □ 2" → "612 449 ma 6 cyfr / 2 ma 1 cyfra / Liczba z większą liczbą cyfr jest większa / 612 449 > 2". Reviewer to confirm in phase 9/10 read (E6.10 comparison data arrives in phase 9). `placeNames` has 7 entries (to millions).
- Phase 8 teacher read (own): "Która pełna setka jest najbliżej liczby 3763?" hint "3763 jest między 3700 a 3800 | 3763 jest bliżej 3800"; "Który pełny tysiąc jest najbliżej liczby 7216?" hint "7216 jest między 7000 a 8000 | 7216 jest bliżej 7000"; "4 · 200" hint "4 · 2 = 8 | 8 · 100 = 800"; "120 : 6" hint "6 · 20 = 120". Numbers ≥ 10 000 use NBSP grouping. Reviewer to confirm.


## 6. Autonomous decisions

1. Phase keeps `Driver: tdd`: stub-first RED, then green, no redirect. Manual gate, commit message and next-phase prompts decided in place (subject proposed by the phase title, stopped after phase 7). Would change: orchestrator requiring another message.
2. The plan's "hint without the word dziesiątek/jedności" is read as "no tens-and-units decomposition" (`\d (dziesiąt|jedno)`), because the first-differing-digit hint names the place ("na miejscu dziesiątek"), which the plan itself requires ("jej rząd"). Would change: the teacher read finding the place names confusing for grade 6.
3. Added noun `cyfra` to `src/data/nouns.ts` (validator checks "6 cyfr"). Partner generation for `max > 100` is a new rng sequence, allowed because the contract preserves rng use only for `max <= 100`.
4. The `ARITHMETIC_LINE` blindness is not directly testable yet (see §3 meta-check); left to phases 8–9 which add grouped arithmetic hints. Rows 6.4 stays the reviewer's.
5. Phase 8 keeps `Driver: tdd` (no redirect). The plan's ROUNDING contract was self-contradictory (`{ max: 150, to: 100 }` must throw, yet 101–149 contains non-ties): parser rule chosen = `max >= 2 * to` for `to` 100/1000 plus `max <= 10000`. Would change: E6 data needing e.g. `max: 150, to: 100`.
6. The plan's "multHint(3, 100) equals the pre-change result" contradicts "one line for ·100" (before: halving `3 · 50`); implemented the one-line form (`b === 100` added to the direct cases). E3/E4 do not use ·100, sample seed 2 unchanged.
7. Manual gate, commit message and next-phase prompts decided in place; stopped after phase 8.
