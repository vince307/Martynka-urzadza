# Handoff — `task-round-stars` (slice S-04)

Written by `/10x-tdd task-round-stars phase 2` of autonomous run 2026-10-12-s04-s08. Phases 1 (9f57306) and 2 (d77b9c8) are committed; phases 3–11 are untouched. `firstHint` treats an open expression without `=` ("18 − 9") as not stating a result, so MISSING keeps its inverse-operation hint on doubles (9 + □ = 18).

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 5 docs + `9f57306` (p1) + handoff p1 + `d77b9c8` (p2) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; becomes `implemented` after phase 11) |
| `## Progress` rows remaining | 47 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/round/hints.ts` | New: `firstHint(task)` (null for hints under 2 lines or when the last number of line 0 equals the numeric answer, except ROUNDING via `FIRST_HINT_EXEMPT_TYPES`, type read from the skill id name), `solutionSteps(task, answerLine)` (all hint lines, closed by `answerLine(answer)` when the last line does not end with the result) |
| `src/core/tasks/generators/missing.ts` | F14: hidden operand gives 2 lines (`Policz w drugą stronę: 16 − 9`, `16 − 9 = 7`); hidden result stays 1 line; `inverseOf` returns expression + result |
| `tests/hints.test.ts` | New, 9 tests on real generators/curriculum (HALF, ROUNDING, MISSING, all-stage leak scan, solutionSteps) |
| `tests/missing.test.ts` | hint assertions updated to the two-line form |
| `plan.md` | Progress rows 2.1–2.4 ticked with d77b9c8 |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub `firstHint` = `hint[0]`, `solutionSteps` = copy of hint) | assertion failures, e.g. `E3.10.half_30 seed 0: expected '2 : 2 = 1' to be null`, `E3.2.missing_20 seed 0 "7 + 4 = □": expected '7 + 4 = 11' to be null`, `E1.3.add_sub_5 seed 0 "4 + 1" hint "4 + 1 = 5": expected 5 not to be 5` |
| GREEN | `npx vitest run tests/hints.test.ts tests/missing.test.ts` 13 passed |
| Deliberate break 1 | `firstHint` returns `hint[0]` unconditionally: 5 of 9 hints tests red (HALF null, MISSING, leak scan, open-expression, string); restored |
| Deliberate break 2 | MISSING back to one line: 3 red (E3.2.missing_20 and E4.6.missing_mult_div_50 draws, MISSING hints test); restored. Meta-check: cases come from real generators and curriculum skills |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | Tests 536 passed (branch baseline 527, +9); deploy tests OK; `sample` E1–E6 `Naruszenia: 0` |
| `npm run build` | exit 0 |
| `npx playwright test` | 1 passed (baseline 1, +0) |
| Teacher read (agent, not the `[reviewer]` row) | `sample -- E1/E3/E4 --count 6`: line 0 names the inverse operation with the result missing, line 1 completes it (e.g. `9 + □ = 14` → `14 − 9` / `14 − 9 = 5`); operations correct for + − · : and both operand slots |

## 4. Next command

`/10x-tdd task-round-stars phase 3`

## 5. Open

- Manual rows 1.5 and 2.5 `[reviewer]` are NOT ticked; no `reviews/teacher-read.md` written (reviewer row).
- Known gap (plan Known risks): single-line hints (MISSING hidden result, COMPLEMENT, DIV, ...) and HALF get no first hint, only "Spróbuj jeszcze raz" (human row 10.6).
- Carried items unchanged: human rows 8.5, 10.5–10.8, `[visual]` rows 5.6, 6.4, 7.4, 8.4, DESIGN-GAPs and follow-ups written in Phase 10.

## 6. Autonomous decisions

1. **Leak rule refined for open expressions.** An expression without `=` whose last token is an operand ("18 − 9") is not a leak even when that operand equals the answer (9 + □ = 18). Rejected: the plan's bare "last number equals answer" (blocks the MISSING hint on doubles). Would change: a teacher preferring the stricter rule.
2. **Exemption by skill id.** `firstHint(task)` keeps the planned signature and reads the type from the skill id name (`rounding_*`). Rejected: extra parameter. Would change: ids that no longer carry the type name.
3. **Skill prompts** (exec mode, commit message, next phase) decided in place; stopped after phase 2.
