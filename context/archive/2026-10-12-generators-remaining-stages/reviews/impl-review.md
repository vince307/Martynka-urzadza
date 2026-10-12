<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Generators for the remaining stages (E1–E2, E5–E6)

- **Plan**: context/changes/generators-remaining-stages/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
- **Date**: 2026-10-12
- **Verdict**: NEEDS ATTENTION before triage. After triage (fix commit `499e449`): no open CRITICAL, all suites green.
- **Findings**: 1 critical, 7 warnings, 2 observations

## Verdicts

The second column is the verdict before triage. The third is after triage, at `499e449`.

| Dimension | Verdict | After triage |
|-----------|---------|--------------|
| Plan Adherence | PASS | PASS |
| Scope Discipline | PASS | PASS |
| Safety & Quality | FAIL | PASS |
| Architecture | PASS | PASS |
| Pattern Consistency | WARNING | PASS |
| Success Criteria | PASS | PASS |

**Plan adherence**: a subagent compared every "Changes Required" item with the code, and all of them MATCH. There are two drifts, both already documented in handoff §6:

- `parseRoundingParams` uses `max >= 2 * to`, because the plan's example contradicted itself.
- `multHint(3, 100)` gives one line, not the halving the plan described.

The TDD phases (1–5, 7, 8) put tests and production code in the same commit (3361723, c0e8bc9, 308c458, 0b5382e, 8f4a7ee, a843254, 9bdb2b0).

**Hooks**: nothing was bypassed. `.claude/settings.json` was last modified 2026-10-10, and `.claude/hooks/*` on 2026-10-12 at 15:29, before the run started. No commit message on the branch mentions `--no-verify`. There is no migration, no endpoint and no external identifier in this slice.

### Suites, re-run in this step

The baseline on main at `a24b502` is 236 tests. The branch had 438 before this review.

| Gate | Before fixes (at `69cf447`) | After fixes (at `499e449`) |
|---|---|---|
| `npm run lint` | exit 0 | exit 0 |
| `npm run typecheck` | exit 0 | exit 0 |
| `GATE_UNIT` from `autonomous-run.env` | exit 0, `Tests 438 passed`, six `Naruszenia: 0` | exit 0, `Tests 441 passed`, six `Naruszenia: 0` |
| `npm run build` | exit 0 | exit 0 |

The arithmetic: 236 + 202 = 438 on the branch. This review adds 3 tests (`validate` accusative, `mult` teen split, `compareNum` „1 cyfrę”), so 438 + 3 = 441 = 236 + 205. The other new checks are assertions inside existing tests.

### Deliberate break, re-executed

**RED tests first.** Before any production edit I ran the 8 new or changed tests, and all 8 were red:

- validate: accusative;
- complement: two prompt tests;
- compareNum: lengths differ by one digit;
- mult: teens;
- factFamily: checkDiv within the times table;
- addSub: two F12 tests.

The two parser tests (compareExpr, chooseOp) were also red before their fix.

**Break.** I reverted `compareNum.ts` `digitsPhrase` to `countNoun(n, nouns.cyfra)`.

- The new test "a one-digit number „ma 1 cyfrę”" went red, with the validator detail `"ma 1 cyfra" needs the accusative after "ma"`.
- I restored the file and checked it with `cmp`.

**Meta-check.** The first attempt at this break stayed GREEN on the `max: 1 000 000` test. With partners now one digit apart, a one-digit number is practically unreachable at E6.10, so that test proved nothing about the accusative. That is why the guard test uses `max: 1000`, where one-digit numbers do occur. The break now shows two things: the validator rule reaches every generator through `forEachDraw`, and the fix is what keeps the test green.

## Findings

### F1 — „2 ma 1 cyfra”: nominative after „ma” in COMPARE_NUM hints

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generators/compareNum.ts `largeHint`; src/core/tasks/validate.ts `validateTask`
- **Detail**: `countNoun(la, nouns.cyfra)` produced „2 ma 1 cyfra”, a grammar error the child sees. It appeared in about 5 % of draws at max 1 000 000 (subagent measurement). Neither the validator nor any test caught the accusative outside the word templates.
- **Fix**:
  - `digitsPhrase` uses `pl.tasks.oneDigit` („1 cyfrę”).
  - The validator gets the rule `ACCUSATIVE_ONE`: a feminine nominative in -a after „ma, mają, miał(a), kupił(a), oddał(a), dostał(a), zabrano, dołożono, o” is an `inflection` violation.
  - Tests: `tests/validate.test.ts` and `tests/compareNum.test.ts`.
- **Decision**: FIXED — 499e449

### F2 — F12 hint and `20 − 7` under `bridge: 'none'`

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality (didactics)
- **Location**: src/core/tasks/generators/addSub.ts `addSubHint`, `crossesTen`
- **Detail**: Items (a) and (f) from the orchestrator.
  - For every DT − U the hint was „subtract ten, add back” („90 − 4 → 90 − 10 = 80 | 80 + 6 = 86”), which reads oddly for small subtrahends.
  - E2.1 / E2.9 / E3.6 (`bridge: 'none'`) draw `20 − 7` and `30 − 9`. `crossesTen` counts a full-ten minuend as non-crossing, which matches ZADANIA E4.2 („50 − 3” in a step without crossing) and the grade-1 analogy „20 − 7 like 10 − 7”.
- **Fix A ⭐ Recommended** (applied): the hint breaks one ten, „10 − b = c | (a − 10) + c = a − b” („10 − 7 = 3 | 10 + 3 = 13”, „10 − 4 = 6 | 80 + 6 = 86”). The draw rule stays as it is, and a follow-up asks the maintainer about a stricter `bridge`.
  - Strength: one rule that reads naturally for subtrahends 1–9, and it is the school method for „80 − 7”.
  - Tradeoff: E2.1 still shows `20 − 7`.
  - Confidence: MED — the catalogue supports it, but a teacher could read E2.1 more strictly.
  - Blind spot: the maintainer's reading of „bez przekroczenia” for E2.1.
- **Fix B**: a new `bridge: 'strict'` that rejects a full-ten minuend in E2.1 / E3.6.
  - Strength: a literal reading of the step.
  - Tradeoff: it contradicts E4.2 and the S-02 rule, and changes the data of three steps.
  - Confidence: MED.
  - Blind spot: the textbooks.
- **Decision**: FIXED via Fix A — 499e449. Fix B is in follow-ups.

### F3 — `E6.4.mult_teens` hints are not the tens-and-units method

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (didactics)
- **Location**: src/core/tasks/generators/mult.ts `multHint`
- **Detail**: Before the fix:
  - `5 · 13` → `5 · 12 = 60 | 60 + 5`
  - `3 · 18` → halving
  - `2 · 17` → the answer alone
- **Fix**: a factor of 11–19 with the other factor 2–9 gives „5 · 10 = 50 | 5 · 3 = 15 | 50 + 15 = 65”. Test in `tests/mult.test.ts`.
- **Decision**: FIXED — 499e449

### F4 — Trivial large comparisons (`612 449 □ 2`) and 1 000 000 as a frequent partner

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/core/tasks/generators/compareNum.ts `largePartner`
- **Detail**: Partners of different length were drawn from any length, and the uniform branch from 1..max.
- **Fix**:
  - Partners of different length differ by exactly one digit, and the uniform branch keeps the same length.
  - A length that holds only `max` is skipped.
  - Test: `tests/compareNum.test.ts` checks that the lengths differ by 1.
- **Decision**: FIXED — 499e449

### F5 — „Ile brakuje od 2 do 10?” reads awkwardly

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/data/pl.ts `pl.tasks.complement`
- **Detail**: Affects E1.7, E4.4 and E6.5.
- **Fix**: „Ile trzeba dodać do 2, żeby było 10?”, the same wording as the BONDS hint. Test: `tests/complement.test.ts` matches the new prompt.
- **Decision**: FIXED — 499e449

### F6 — `E5.9.fact_check_div_100` leaves the times table (`98 : 49`, `78 : 26`)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (step constraint)
- **Location**: src/core/tasks/generators/factFamily.ts `generateFactFamily` (checkDiv)
- **Fix**: divisor and quotient ≤ `TABLE` (10). Test in `tests/factFamily.test.ts`.
- **Decision**: FIXED — 499e449

### F7 — COMPARE_EXPR and CHOOSE_OP parsers accept infeasible `max`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence (risk #5: parsers reject infeasible params)
- **Location**: src/core/tasks/generators/compareExpr.ts `parseCompareExprParams`; src/core/tasks/generators/chooseOp.ts `parseChooseOpParams`
- **Detail**: `ops ['+']` with max 2–3, and CHOOSE_OP with max 2, passed the parser and then made the generator throw at draw time (I probed this with a scratch script). Today's data is safe.
- **Fix**: COMPARE_EXPR with sums only needs max ≥ 4, and CHOOSE_OP needs max ≥ `MIN_TILES_MAX` (3). Tests updated.
- **Decision**: FIXED — 499e449

### F8 — „kupił jeszcze 2 złote” (nonsense context)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality (content)
- **Location**: src/data/wordTemplates.ts `templates` (`sum.bought`) with `contexts` (`złoty`)
- **Detail**: The template came from S-02. It is visible in E1.3 CHOOSE_OP and E3.1 WORD.
- **Fix**: a per-context flag (`buyable`) filtered per template; this needs a template–context compatibility model.
  - Strength: removes the whole class of mismatches.
  - Tradeoff: touches the S-02 word data and the rng sequence of WORD and CHOOSE_OP.
  - Confidence: MED.
  - Blind spot: other template/context pairs („kredki na talerzach”).
- **Decision**: DEFERRED — follow-ups/review-fixes.md, Trigger: S-17

### F9 — Seams: stale docs and comments, duplicated `SAME_SHARE`

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: CLAUDE.md "Current state"; src/core/tasks/generators/compareNum.ts (header); tests/contentInvariants.test.ts (header); src/data/curriculum/index.ts (header); `SAME_SHARE` in addSub.ts and missingOp.ts; AGENTS.md Commands
- **Fix**:
  - Comments and CLAUDE.md updated.
  - `SAME_SHARE` moved to `src/core/tasks/arith.ts`.
  - AGENTS.md („CI runs all three” was lost) is deferred because of the 400-word limit.
  - Bare `\d+` in generator unit tests goes to follow-ups.
- **Decision**: FIXED (partly) — 499e449; rest in follow-ups

### F10 — Documented drifts and parser edges not reachable by today's data

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/core/tasks/generators/rounding.ts `parseRoundingParams`; src/core/tasks/generators/mult.ts `multHint`; src/core/tasks/generators/complement.ts `parseComplementParams`
- **Detail**:
  - The ROUNDING parser rule and the one-line `·100` hint are justified in handoff §6.
  - COMPLEMENT without `targets` and ROUNDING both accept a `max` that is not a multiple of 10 / `to`, so the answer can exceed `max`. No data does that today.
- **Decision**: ACCEPTED; follow-up with Trigger

## Progress rows

- 6.4, 9.4, 10.4 `[reviewer]`: ticked. They pass after `499e449`; see `reviews/teacher-read.md`.
- 10.5 `[reviewer] (CI at ship)`: left open for the ship step. It names the job `check` of workflow `CI`, and the log lines matching `##\[group\]Run npm run sample -- E[1256]$`, each followed by `Naruszenia: 0`.
- 10.6 and 10.7 `[human]`: open.

MERGE: CLEAR — the only CRITICAL (F1) is fixed with a test in 499e449, every automated criterion is met, all suites are green (441 tests = 236 + 205, sample E1–E6 `Naruszenia: 0`), and the remaining warnings are deferred with triggers.
