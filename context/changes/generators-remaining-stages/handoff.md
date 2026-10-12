# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-implement phase 10` step of run `2026-10-12-s03-remaining-stages`. All phases 1–10 are committed (phase 10: `9145691`). Rows 6.4, 9.4, 10.4–10.7 are the reviewer's or the human's.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | … + `9145691` `feat(generators-remaining-stages): Bramka, CI, dokumentacja, follow-upy i seam sweep (p10)` + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 6 (6.4, 9.4, 10.4, 10.5 reviewer; 10.6, 10.7 human); 10.1–10.3 ticked with `9145691` |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's |

## 2. Artifacts

| Path | What it is |
|---|---|
| `.github/workflows/ci.yml` | six `sample -- E1..E6` steps |
| `context/foundation/autonomous-run.{md,env}` | `GATE_UNIT` and § 2 with sample E1–E6 |
| `CLAUDE.md`, `AGENTS.md` (399 words), `context/foundation/test-plan.md` | docs for six stages, `SMALL_SPACES`, `formatNumber.ts` |
| `tests/curriculum.test.ts` | bound via `boundOf` |
| `context/changes/generators-remaining-stages/follow-ups/review-fixes.md` | 4 planned follow-ups plus the open content items of §5 |

## 3. Verification

| Command | Result |
|---|---|
| Driver | `impl` |
| Full gate | lint, typecheck, build 0; `GATE_UNIT` from env exit 0 (`npm test` 438 passed, same as phase 9, +0; six `Naruszenia: 0`); `grep -c "npm run sample -- E" ci.yml` = 6; AGENTS.md 399 words |
| Seam sweep | no `params.max`/`E3–E4` in curriculum.test.ts; no `const apply`; `S-03` in src only real references (E1/E2 headers); `Trigger:` count 10 |
| Deliberate break | `E5` removed from `stages`: `npm test` stays green (398 passed), `GATE_UNIT` exit 2 (`Użycie: npm run sample`); restored |
| Meta-check | only the new sample step catches it (plan body used E5-removal, not `E5.4.div_50`; `maxDividend: 1` would fail npm test first) |

## 4. Next command

`/10x-impl-review generators-remaining-stages`

## 5. Open

- Row 6.4 [reviewer] teacher read of `sample -- E1 --count 6` / `-- E2 --count 6` is open. My own read found: `E1.7.complement_10` prompt "Ile brakuje od 2 do 10?" is awkward Polish (better "Ile brakuje do 10?" with 2 given, e.g. "Do 10 brakuje …" style) — generator `src/core/tasks/generators/complement.ts` / `pl.ts` complement prompt; `E2.1.add_sub_20_units` can show `20 − 7` (crosses ten although `bridge: 'none'`, DU-U shape with a ten as minuend), hint "20 − 10 = 10 | 10 + 3 = 13" is arithmetically right; `E2.4.fact_swap_20` is `1 + 10 = □ + 1` style (clear); E1 tasks shown with keypad (follow-up S-04 later).
- Same items are listed in `follow-ups/review-fixes.md`.
- Earlier open points still apply (MISSING_OP bare prompt, CHAIN tiny `max`, CHOOSE_OP tiles, FACT_FAMILY keypad, `monthDays` two tiles).
- Phase 7 teacher read (own): COMPARE_NUM large hints read correctly, e.g. "796 866 □ 796 867" → "Porównujemy cyfry od lewej. Pierwsza różna cyfra jest na miejscu jedności: 6 i 7 / 796 866 < 796 867" and "612 449 □ 2" → "612 449 ma 6 cyfr / 2 ma 1 cyfra / Liczba z większą liczbą cyfr jest większa / 612 449 > 2". Reviewer to confirm in phase 9/10 read (E6.10 data now present). `placeNames` has 7 entries (to millions).
- Phase 8 teacher read (own): "Która pełna setka jest najbliżej liczby 3763?" hint "3763 jest między 3700 a 3800 | 3763 jest bliżej 3800"; "Który pełny tysiąc jest najbliżej liczby 7216?" hint "7216 jest między 7000 a 8000 | 7216 jest bliżej 7000"; "4 · 200" hint "4 · 2 = 8 | 8 · 100 = 800"; "120 : 6" hint "6 · 20 = 120". Numbers ≥ 10 000 use NBSP grouping. Reviewer to confirm.

- Phase 9 teacher read (own; row 9.4 stays the reviewer's): `E6.4.mult_teens` hints are uneven: `5 · 13` gives "5 · 12 = 60 | 60 + 5" and `3 · 18` gives "3 · 9 = 27 | 27 + 27" (halving) rather than the tens-and-units split (5 · 10 + 5 · 3); arithmetically right but not the school method. `E6.5` prompt "Ile brakuje od 35 do 100?" shares the E1 awkward "od … do" wording. `E5.9.fact_check_div_100` can show `98 : 49 = 2` (valid but unusual). Candidate fixes: multHint for a two-digit second factor and the complement prompt.

## 6. Autonomous decisions

1. Phase keeps `Driver: tdd`: stub-first RED, then green, no redirect. Manual gate, commit message and next-phase prompts decided in place (subject proposed by the phase title, stopped after phase 7). Would change: orchestrator requiring another message.
2. The plan's "hint without the word dziesiątek/jedności" is read as "no tens-and-units decomposition" (`\d (dziesiąt|jedno)`), because the first-differing-digit hint names the place ("na miejscu dziesiątek"), which the plan itself requires ("jej rząd"). Would change: the teacher read finding the place names confusing for grade 6.
3. Added noun `cyfra` to `src/data/nouns.ts` (validator checks "6 cyfr"). Partner generation for `max > 100` is a new rng sequence, allowed because the contract preserves rng use only for `max <= 100`.
4. The `ARITHMETIC_LINE` blindness is not directly testable yet (see §3 meta-check); left to phases 8–9 which add grouped arithmetic hints. Rows 6.4 stays the reviewer's.
5. Phase 8 keeps `Driver: tdd` (no redirect). The plan's ROUNDING contract was self-contradictory (`{ max: 150, to: 100 }` must throw, yet 101–149 contains non-ties): parser rule chosen = `max >= 2 * to` for `to` 100/1000 plus `max <= 10000`. Would change: E6 data needing e.g. `max: 150, to: 100`.
6. The plan's "multHint(3, 100) equals the pre-change result" contradicts "one line for ·100" (before: halving `3 · 50`); implemented the one-line form (`b === 100` added to the direct cases). E3/E4 do not use ·100, sample seed 2 unchanged.
7. Manual gate, commit message and next-phase prompts decided in place; stopped after phase 8.
8. Phase 9 `Driver: impl`, no redirect; confirmation, commit-message and next-phase prompts decided in place (subject `Dane E5 i E6 (p9)`, stop after the phase). Step `types` lists copy the ZADANIA.md §3 type names; answer modes follow E3/E4 (tiles for ROMAN, NUMBER_WORDS, CALENDAR, COMPARE_NUM). Would change: reviewer asking for other answer modes.
9. Phase 10 `Driver: impl`; prompts decided in place. Break = removing E5 from `stages` (plan body), not the Progress-row wording `E5.4.div_50`. Epilogue: `change.md` set to `implemented` with rows 6.4, 9.4, 10.4–10.7 open. Would change: reviewer wanting the Progress-row break.
