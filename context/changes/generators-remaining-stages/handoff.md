# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-tdd phase 7` step of run `2026-10-12-s03-remaining-stages`. Phases 1–7 are committed (phase 7: `a843254`). Phases 8–10 remain; row 6.4 is the reviewer's.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | … + `a843254` `feat(generators-remaining-stages): Duże liczby — formatNumber i COMPARE_NUM do 1 000 000 (p7)` + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 14 (rows 7.1, 7.2 ticked with `a843254`; 6.4 is [reviewer]) |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/text/formatNumber.ts` | `formatNumber` (< 10 000 plain, else groups of three with U+00A0), `NUMBER_SOURCE` (`\d{1,3}(?:\u00A0\d{3})+|\d+`), `parseNumber` |
| `src/core/tasks/validate.ts` | `NUMBER_WORD` built from `NUMBER_SOURCE`, number via `parseNumber` |
| `tests/contentInvariants.test.ts` | `ARITHMETIC_LINE`, `BINARY_PROMPT` and the bounds scan built from `NUMBER_SOURCE` / `parseNumber` |
| `src/core/tasks/generators/compareNum.ts` | `params.max > 100`: `largePartner` (1/6 equal, 1/3 different digit count, else shared prefix or independent) and `largeHint` (digit count or first differing digit with its place); `max <= 100` path and rng use untouched |
| `src/data/pl.ts`, `src/data/nouns.ts` | `pl.tasks.compareDigitsHint`, `compareMoreDigits`, `compareFirstDiffHint`, `placeNames`; noun `cyfra` |
| `tests/formatNumber.test.ts` (new), `tests/compareNum.test.ts` (`generateCompareNum large numbers`), `tests/validate.test.ts` (grouped number agreement) | the phase-7 tests |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run, stub `formatNumber = String(n)`, `NUMBER_SOURCE = \d+`) | `AssertionError: expected '10000' to be '10 000'` (formatNumber), `expected null not to be null` (pattern), `T.big seed=1 draw=0 prompt="280004 □ 24656": expected '280004 to 28000 dziesiątek i 4 jednoś…' not to match /dziesiąt|jedno/` (COMPARE_NUM). 3 failed, 4 passed |
| GREEN / full | `npm test` 355 passed, 34 files (branch baseline 348 at phase 6, +7); lint, typecheck, build OK; deploy tests exit 0 |
| `sample -- E1..E4 --seed 2` | exit 0 each, byte-identical to the pre-change output (diff empty) |
| Deliberate break 1 | `NUMBER_SOURCE` back to `\d+`: RED in `formatNumber.test.ts` (pattern match) and `validate.test.ts` (grouped agreement); restored |
| Deliberate break 2 | `formatNumber` grouping threshold moved to 10 000 000: RED in `formatNumber.test.ts` and the COMPARE_NUM large test; restored |
| Deliberate break 3 | `NUMBER_WORD` back to `(\d+)`: RED only in `validate.test.ts` (it read "10 001 jabłek" as 001 and flagged a correct text); restored |
| Meta-check | break 1 proves the shared pattern is no longer blind to grouped numbers and break 3 that `validate.ts` uses it. The `ARITHMETIC_LINE` regex in `contentInvariants.test.ts` reverting to `\d+` is NOT caught by a test: no generator emits a grouped arithmetic line yet (COMPARE_NUM's last hint is `a < b`), so that regex is only exercised once phases 8–9 add large MULT/ROUNDING/ADD_SUB hints |

## 4. Next command

`/10x-tdd generators-remaining-stages phase 8`

## 5. Open
- Row 6.4 [reviewer] teacher read of `sample -- E1 --count 6` / `-- E2 --count 6` is open. My own read found: `E1.7.complement_10` prompt "Ile brakuje od 2 do 10?" is awkward Polish (better "Ile brakuje do 10?" with 2 given, e.g. "Do 10 brakuje …" style) — generator `src/core/tasks/generators/complement.ts` / `pl.ts` complement prompt; `E2.1.add_sub_20_units` can show `20 − 7` (crosses ten although `bridge: 'none'`, DU-U shape with a ten as minuend), hint "20 − 10 = 10 | 10 + 3 = 13" is arithmetically right; `E2.4.fact_swap_20` is `1 + 10 = □ + 1` style (clear); E1 tasks shown with keypad (follow-up S-04 later).
- Phase 10 must update profile § 2, env `GATE_UNIT` and `ci.yml` with sample E1–E6 (contract already uses E1–E4).
- Earlier open points still apply (MISSING_OP bare prompt, CHAIN tiny `max`, CHOOSE_OP tiles, FACT_FAMILY keypad, `monthDays` two tiles).
- Phase 7 teacher read (own): COMPARE_NUM large hints read correctly, e.g. "796 866 □ 796 867" → "Porównujemy cyfry od lewej. Pierwsza różna cyfra jest na miejscu jedności: 6 i 7 / 796 866 < 796 867" and "612 449 □ 2" → "612 449 ma 6 cyfr / 2 ma 1 cyfra / Liczba z większą liczbą cyfr jest większa / 612 449 > 2". Reviewer to confirm in phase 9/10 read (E6.10 comparison data arrives in phase 9). `placeNames` has 7 entries (to millions).

## 6. Autonomous decisions

1. Phase keeps `Driver: tdd`: stub-first RED, then green, no redirect. Manual gate, commit message and next-phase prompts decided in place (subject proposed by the phase title, stopped after phase 7). Would change: orchestrator requiring another message.
2. The plan's "hint without the word dziesiątek/jedności" is read as "no tens-and-units decomposition" (`\d (dziesiąt|jedno)`), because the first-differing-digit hint names the place ("na miejscu dziesiątek"), which the plan itself requires ("jej rząd"). Would change: the teacher read finding the place names confusing for grade 6.
3. Added noun `cyfra` to `src/data/nouns.ts` (validator checks "6 cyfr"). Partner generation for `max > 100` is a new rng sequence, allowed because the contract preserves rng use only for `max <= 100`.
4. The `ARITHMETIC_LINE` blindness is not directly testable yet (see §3 meta-check); left to phases 8–9 which add grouped arithmetic hints. Rows 6.4 stays the reviewer's.
