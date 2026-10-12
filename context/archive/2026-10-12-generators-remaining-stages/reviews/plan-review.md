<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Generatory dla pozostałych etapów (E1–E2, E5–E6)

- **Plan**: context/changes/generators-remaining-stages/plan.md
- **Mode**: Deep
- **Date**: 2026-10-12
- **Verdict**: SOUND (after the triage fixes below; REVISE before them)
- **Findings**: 0 critical, 6 warnings, 4 observations

Run `2026-10-12-s03-remaining-stages`, autonomous: no questions asked; triage decided in place (contract rule 1). No `lessons.md` exists, so no lesson was applied. No sub-agent was used: the risky claims were checked directly against the code (listed under Grounding).

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | WARNING (F6, fixed) |
| Blind Spots | WARNING (F1, F2, F9, fixed / recorded) |
| Plan Completeness | WARNING (F3, F4, F5, fixed) |

## Grounding

Grounding: 12/12 paths ✓ (`registry.ts`, `bounds.ts`, `validate.ts`, `addSub.ts`, `mult.ts`, `div.ts`, `rounding.ts`, `compareNum.ts`, `evenOdd.ts`, `calendar.ts`, `complement.ts`, `scripts/sample.ts`; the 8 new files are absent as expected), 9/9 symbols ✓ (`drawFree`, `addSubHint`, private `apply`/`sign`/`line`, `boundOf`, `ONE_SHARE`/`drawQuotient`, `parseRoundingParams` rejects `to ≠ 10`, `weekdays` as bare strings, `MIN_DISTINCT`/`ARITHMETIC_LINE`/`BINARY_PROMPT`, `GROUP_1`/`LATER`), brief↔plan ✓.

Checks requested by the step prompt:

- **Baseline**: `npx vitest run` on the branch → `Tests 236 passed (236)`, observed.
- **CI-at-ship regex (row 10.5)**: `gh run view 38278623270 --log --job 114910141466` (job `check`, success) saved to the scratchpad; `grep -cE '##\[group\]Run npm run sample -- E[34]$'` = 2 (lines `##[group]Run npm run sample -- E3` / `-- E4`, no `\r`, a BOM before the timestamp does not matter for an unanchored start). Each step's last output line is `Naruszenia: 0` and carries the step name in the log's second column. The regex `E[1256]$` is therefore sound; row text extended with the job id and the "save to file, then grep" note (profile § 8: `gh` without pipes).
- **Extensions keep E3–E4**: `sample.ts` seeds every task by `seed:skillId:i`, so per-skill printouts are independent and the "identical before/after" diffs (5.1, 8.1) are meaningful. CALENDAR (new variants are additive; `rng.pick(p.variants)` over E3's own list is unchanged), EVEN_ODD (`min` default 1), ROUNDING (`to: 10` path unchanged), DIV (`quotients` optional, `ONE_SHARE` kept without it) are safe. Two were not: COMPARE_NUM (F1) and MULT (F2) — fixed. ADD_SUB changes E3 and E4 printouts on purpose (phase 1; text now names E4.4 too, F10).
- **Phase size vs "~2 new generators per phase"**: phases 1–4 have ≤ 2 new generators each (1: BONDS + two ADD_SUB fixes; 2: CHAIN, MISSING_OP + `arith.ts` extraction; 3: COMPARE_EXPR, SEQUENCE; 4: FACT_FAMILY, CHOOSE_OP); 5, 7, 8 are 2–3 small extensions; 6 and 9 are data; 10 is config/sweep. Every phase is green on its own (stage files enter only after all their group-1 generators). No split/merge needed; merging 7+8 would be possible but not better.
- **Drivers**: 1–5, 7, 8 `tdd` — verified nothing exists yet (no `bonds.ts` … `chooseOp.ts`, no `formatNumber.ts`, `parseRoundingParams` throws for `to: 100`, `DivParams` has no `quotients`, `multHint` has no tens branch, `CalendarVariant` has no weekday variants, `EvenOddParams` has no `min`, `describe` in `compareNum.ts` only knows tens/units); 6, 9, 10 `impl` (data/config). E2E=off, no `e2e` phase. All drivers correct.
- **Follow-ups with `Trigger:` naming S-03**: none exist in the formal format (`grep -rln "Trigger:" context` hits only this change and the contract). Informal pointers in `context/archive/2026-10-12-generators-e3-e4/follow-ups/review-fixes.md`: F11 (feasibility at parse time — done by `testing-content-invariants`, kept as a requirement for the 7 new parsers ✓), F12 (`DT − U` hint — included in phase 1 ✓; its "skew in free mode" half is phase 1's uniform pairs ✓). F14 → S-04, F10 → S-07, F6 → `deploy/`: deferrals justified in `change.md`.
- **Data vs ZADANIA §3**: every E1/E2/E5/E6 step's group-1 types have a skill in phases 6/9; every other type is in `LATER` after the phase 6/9 additions (checked step by step). Every param set parses with today's or the planned parsers (`WORD` `max ≥ 5` and `MIN_MAX`, `MISSING` defaults, `COMPLEMENT` `max ≥ 10`, `EVEN_ODD` `max ≥ 10`, `ROMAN ≤ 3999`, `NUMBER_WORDS ≤ 1000`, shape tokens `HT`, `HTU`, `H-HTU` exist).
- **PRD**: FR-004 / Non-Goals honoured (E1–E2/E5–E6 on shared generators, correctness not relaxed). Product decisions: E1 `keypad` vs ZADANIA §4 tiles has `[human]` row 10.7 ✓ (FR-006 allows both); February skipped matches ZADANIA §2 E5 "miesiące 30/31 dni" ✓; NBSP grouping from 10 000 is the Polish norm ✓. None clearly wrong; none overturned.

## Findings

### F1 — COMPARE_NUM hint rule contradicts itself for E4.1

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 — COMPARE_NUM ≥ 1000
- **Detail**: The contract said "for `max ≤ 100` unchanged (E2.7, E4.1); for numbers ≥ 100 the new hint". `E4.1.compare_num_100` has `max: 100` and `generateCompareNum` draws `rng.int(1, p.max)`, so it draws 100 — the two rules disagree on it, and the "E4.1 identical at the same seed" criterion could fail.
- **Fix**: Gate the new hint on `params.max > 100` (parameter, not the drawn number); rng use unchanged for `max ≤ 100`.
- **Decision**: FIXED (plan.md Phase 7 § 2 Contract)

### F2 — MULT tens branch would change E3.9 and produce "3 · 1 = 3"

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 8 — MULT hint
- **Detail**: "a factor `k · 10` or `k · 100` (k 1–9)" covers `10` and `100` and does not say which factor. `E3.9.mult_30` (`maxFactor: 10`) draws `a = 10` (`10 · 3`), whose hint today is the halving pair; the branch would change it (breaking 8.1 "E3/E4 identical") and `3 · 100` would become "3 · 1 = 3, 3 · 100 = 300".
- **Fix**: Branch only on the second factor `b` with `b = k·10` or `k·100`, k 2–9; `b = 10`/`100` stay one line; tests pin `multHint(10, 3)`, `multHint(7, 10)`, `multHint(3, 100)` to today's output.
- **Decision**: FIXED (plan.md Phase 8 § 3 Contract)

### F3 — Phase 10 deliberate break does not prove the new sample steps run

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 10 — Success Criteria (10.3)
- **Detail**: `E5.4.div_50` → `maxDividend: 1` makes `parseDivParams` throw, so `npm test` (content invariants) fails first and `GATE_UNIT` stops before any `sample` step. The meta-check's claim ("proves the new command runs sample E5") was false.
- **Fix**: Break = remove E5 from `stages` in `src/data/curriculum/index.ts`: `npm test` stays green, `npm run sample -- E5` exits 2 via `usage()`, so only the new step turns the gate red; meta-check rewritten.
- **Decision**: FIXED (plan.md Phase 10 Automated Verification)

### F4 — "brak generatora" list in 6.2 does not match what `sample` prints

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 6 and Phase 9 — Automated Verification
- **Detail**: `scripts/sample.ts` prints `(brak generatora: …)` only for steps with zero skills; partial steps (E1.2, E1.4, E1.9, E1.11, E2.1, E2.6, E2.9, E2.10) print their skills. The listed expectation would make an implementer chase a non-issue.
- **Fix**: Exact empty steps named (E1.1, E1.8, E1.10, E2.2, E2.8; E5.5, E5.12, E6.2, E6.3, E6.11); partial steps are guarded by `tests/curriculum.test.ts`. Progress titles unchanged.
- **Decision**: FIXED

### F5 — Teacher-read row expects a DIV hint no phase builds

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 9 — Manual Verification (9.4)
- **Detail**: Row text named "8 : 4 → 800 : 4" as a hint to check, but Phase 8 only adds `quotients` to DIV; the hint stays the inverse multiplication `4 · 200 = 800` (correct). A reviewer would report a "missing" feature.
- **Fix**: Row text states the actual DIV hint and adds the two Known-risks skills to the read.
- **Decision**: FIXED

### F6 — CHOOSE_OP would copy WORD's private number drawing

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 4 — CHOOSE_OP
- **Detail**: "`drawNumbers`-podobnie" invites a copy of the private `drawNumbers` in `word.ts`, which Phase 10's seam sweep ("no duplicated helpers") would then have to undo.
- **Fix**: Export `drawNumbers` from `word.ts` and import it in `chooseOp.ts`.
- **Decision**: FIXED

### F7 — `arithLine` has no multiplication for FACT_FAMILY `checkDiv`

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 § 1 / Phase 4 § 1
- **Detail**: `arith.ts` is specified for `+`/`−`; `checkDiv`'s last hint is `7 · 6 = 42`.
- **Fix**: Phase 2 contract notes that the `checkDiv` line is built with `TIMES` from `symbols.ts`, as in `div.ts`.
- **Decision**: FIXED

### F8 — Number regex in the plan used an invisible NBSP

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 7 § 1
- **Detail**: `NUMBER_SOURCE` was written with a literal U+00A0 that reads as a plain space; an implementer copying it may type a space.
- **Fix**: Written as ` ` with a note to keep it explicit in code.
- **Decision**: FIXED

### F9 — Two E6 skills whose reading may differ from the catalogue intent

- **Severity**: OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 9 — E6.4, E6.5
- **Detail**: `E6.4.mult_teens` keeps the halving hint (`4 · 12 = 48, 48 + 4 = 52`): correct arithmetic, not the school `4 · 10 + 4 · 3`. `E6.5.complement_100_1000` reads "dopełnianie do setki" as "to 100", not "to the next full hundred" (COMPLEMENT only knows the next ten).
- **Fix**: Recorded under `## Known risks` in plan.md; teacher read 9.4/10.4 decides; a different reading becomes a follow-up (`Trigger: S-17`), not a new phase (PRD FR-004: E5–E6 polish is M8).
- **Decision**: ACCEPTED (Known risks)

### F10 — Phase 1 changes the E4 printout too

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 1 § 1
- **Detail**: F12 rewrites the hint of `E4.4.sub_from_full_ten` (`90 − 4` → `90 − 10 = 80`, `80 + 6 = 86`; seen in the CI log); the plan only warned about E3.
- **Fix**: Text names E4.4 as an expected printout change.
- **Decision**: FIXED

VERDICT: PROCEED — approach is sound and every phase is green alone with a correct driver; six warnings (COMPARE_NUM/MULT E3–E4 regressions, a non-proving break, wrong expectations in 6.2/9.4, a helper copy) were fixed in plan.md and two E6 content readings went to Known risks.
