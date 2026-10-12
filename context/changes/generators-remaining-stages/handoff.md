# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-implement phase 9` step of run `2026-10-12-s03-remaining-stages`. Phases 1–9 are committed (phase 9: `6607b71`). Phase 10 remains; rows 6.4 and 9.4 are the reviewer's.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | … + `6607b71` `feat(generators-remaining-stages): Dane E5 i E6 (p9)` + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 9 (rows 9.1–9.3 ticked with `6607b71`; 6.4, 9.4 are [reviewer]) |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/curriculum/E5.ts`, `E6.ts` | stage data, 12 and 11 steps; empty steps E5.5, E5.12, E6.2, E6.3, E6.11; E6 uses a local `range` helper for teens and tens/hundreds lists |
| `src/data/curriculum/index.ts` | registers E5, E6 |
| `tests/curriculum.test.ts` | `LATER` += WRITTEN, CLOCK_ELAPSED, UNIT_CHOICE, PRICE, TIMES_MORE, ORDER_OPS, TIME_UNITS, MIX, LOGIC; describe renamed `curriculum E1–E6` |

## 3. Verification

| Command | Result |
|---|---|
| Driver | `impl` (data only), no RED stage; the new data is exercised by the existing per-skill tests and invariants |
| Full gate | lint, typecheck OK; `npm test` 438 passed (branch baseline 361 after phase 8, +77); deploy tests 0; `sample -- E1..E6` exit 0, `Naruszenia: 0`; build 0 |
| `sample -- E5` / `-- E6` | `brak generatora` exactly E5.5, E5.12, E6.2, E6.3, E6.11 (all LATER types); E5.4 ·0/·1 invariant silent |
| Deliberate break | `E6.9.rounding_100` `max: 150`: RED in `contentInvariants` (`ROUNDING params.max must be at least 200 for to 100, got 150`) and in `curriculum` 200 draws; `sample -- E6` exit 1 (`błędy generatorów: 3`); restored |
| Meta-check | proves infeasible data is caught at parse time (invariant parses the params, TypeError), not only at draw time; the `sample` exit comes from the same TypeError |

## 4. Next command

`/10x-implement generators-remaining-stages phase 10`

## 5. Open

- Row 6.4 [reviewer] teacher read of `sample -- E1 --count 6` / `-- E2 --count 6` is open. My own read found: `E1.7.complement_10` prompt "Ile brakuje od 2 do 10?" is awkward Polish (better "Ile brakuje do 10?" with 2 given, e.g. "Do 10 brakuje …" style) — generator `src/core/tasks/generators/complement.ts` / `pl.ts` complement prompt; `E2.1.add_sub_20_units` can show `20 − 7` (crosses ten although `bridge: 'none'`, DU-U shape with a ten as minuend), hint "20 − 10 = 10 | 10 + 3 = 13" is arithmetically right; `E2.4.fact_swap_20` is `1 + 10 = □ + 1` style (clear); E1 tasks shown with keypad (follow-up S-04 later).
- Phase 10 must update profile § 2, env `GATE_UNIT` and `ci.yml` with sample E1–E6 (contract already uses E1–E4).
- Earlier open points still apply (MISSING_OP bare prompt, CHAIN tiny `max`, CHOOSE_OP tiles, FACT_FAMILY keypad, `monthDays` two tiles).
- Phase 7 teacher read (own): COMPARE_NUM large hints read correctly, e.g. "796 866 □ 796 867" → "Porównujemy cyfry od lewej. Pierwsza różna cyfra jest na miejscu jedności: 6 i 7 / 796 866 < 796 867" and "612 449 □ 2" → "612 449 ma 6 cyfr / 2 ma 1 cyfra / Liczba z większą liczbą cyfr jest większa / 612 449 > 2". Reviewer to confirm in phase 9/10 read (E6.10 data now present). `placeNames` has 7 entries (to millions).
- Phase 8 teacher read (own): "Która pełna setka jest najbliżej liczby 3763?" hint "3763 jest między 3700 a 3800 | 3763 jest bliżej 3800"; "Który pełny tysiąc jest najbliżej liczby 7216?" hint "7216 jest między 7000 a 8000 | 7216 jest bliżej 7000"; "4 · 200" hint "4 · 2 = 8 | 8 · 100 = 800"; "120 : 6" hint "6 · 20 = 120". Numbers ≥ 10 000 use NBSP grouping. Reviewer to confirm.


## 6. Autonomous decisions

1. Phase keeps `Driver: tdd`: stub-first RED, then green, no redirect. Manual gate, commit message and next-phase prompts decided in place (subject proposed by the phase title, stopped after phase 7). Would change: orchestrator requiring another message.
2. The plan's "hint without the word dziesiątek/jedności" is read as "no tens-and-units decomposition" (`\d (dziesiąt|jedno)`), because the first-differing-digit hint names the place ("na miejscu dziesiątek"), which the plan itself requires ("jej rząd"). Would change: the teacher read finding the place names confusing for grade 6.
3. Added noun `cyfra` to `src/data/nouns.ts` (validator checks "6 cyfr"). Partner generation for `max > 100` is a new rng sequence, allowed because the contract preserves rng use only for `max <= 100`.
4. The `ARITHMETIC_LINE` blindness is not directly testable yet (see §3 meta-check); left to phases 8–9 which add grouped arithmetic hints. Rows 6.4 stays the reviewer's.
5. Phase 8 keeps `Driver: tdd` (no redirect). The plan's ROUNDING contract was self-contradictory (`{ max: 150, to: 100 }` must throw, yet 101–149 contains non-ties): parser rule chosen = `max >= 2 * to` for `to` 100/1000 plus `max <= 10000`. Would change: E6 data needing e.g. `max: 150, to: 100`.
6. The plan's "multHint(3, 100) equals the pre-change result" contradicts "one line for ·100" (before: halving `3 · 50`); implemented the one-line form (`b === 100` added to the direct cases). E3/E4 do not use ·100, sample seed 2 unchanged.
7. Manual gate, commit message and next-phase prompts decided in place; stopped after phase 8.
8. Phase 9 `Driver: impl`, no redirect; confirmation, commit-message and next-phase prompts decided in place (subject `Dane E5 i E6 (p9)`, stop after the phase). Step `types` lists copy the ZADANIA.md §3 type names; answer modes follow E3/E4 (tiles for ROMAN, NUMBER_WORDS, CALENDAR, COMPARE_NUM). Would change: reviewer asking for other answer modes.
