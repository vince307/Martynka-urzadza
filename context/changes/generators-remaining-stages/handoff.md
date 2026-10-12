# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-tdd phase 3` step of run `2026-10-12-s03-remaining-stages`. Phases 1–3 are committed (`3361723`, `c0e8bc9`, `308c458`): ADD_SUB tweaks + BONDS, CHAIN + MISSING_OP on `arith.ts`, then COMPARE_EXPR + SEQUENCE. Phases 4–10 remain.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | … + `c0e8bc9` (p2) + `308c458` `feat(generators-remaining-stages): COMPARE_EXPR i SEQUENCE (p3)` + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 23 (7 ticked: 1.1–1.3, 2.1–2.2, 3.1–3.2) |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/generators/compareExpr.ts` | COMPARE_EXPR: `parseCompareExprParams`, `generateCompareExpr` (reuses `SIGNS`; "=" forced at 1/6, coincidental equality and identical/swapped expressions rejected) |
| `src/core/tasks/generators/sequence.ts` | SEQUENCE: `parseSequenceParams` (defaults length 4, start multiple, both directions; infeasible params throw), `generateSequence` |
| `src/core/tasks/registry.ts`, `src/data/pl.ts` | both registered; `pl.tasks.sequence`, `pl.tasks.sequenceHint(step, up)` |
| `tests/compareExpr.test.ts`, `tests/sequence.test.ts` | new tests (`generateCompareExpr`, `generateSequence`) |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run) | stubs throwing; quoted: `AssertionError: expected error to be instance of TypeError` (parser tests, both files) plus `Error: not implemented` in the draw tests |
| GREEN | `npx vitest run tests/compareExpr.test.ts tests/sequence.test.ts`: 5 passed |
| `npm run lint` / `typecheck` / `build` | OK |
| `npm test` | branch baseline 253 + 5 = 258 passed (31 files) |
| deploy test scripts, `sample -- E3`, `sample -- E4` | OK, `Naruszenia: 0` each |
| Deliberate break | COMPARE_EXPR without forcing "=": `AssertionError: expected 0.073 to be greater than 0.1` (equal share). SEQUENCE `down` start shifted by 25 (no lower-bound control): `expected 5 to be +0` and `"-16, □, -22, -25"` flagged by validator negative (2 red). Restored, 5 green. Meta-check: the sign test recomputes results with `applyOp` from the prompt, not from the hint; the sequence test rebuilds terms from the prompt and the answer, so the break was caught by its own checks, not by generator output alone |
| Teacher read | via a script (no E1/E2 data until phase 6): "Uzupełnij ciąg: 80, □, 60, 50" hint "Każda następna liczba jest o 10 mniejsza." / "80 − 10 = 70"; gap first: "□, 40, 30, 20" / "40 + 10 = 50"; COMPARE_EXPR "1 + 1 □ 10 − 2" hint "1 + 1 = 2 / 10 − 2 = 8 / 2 < 8". Correct Polish; "o 2 większa" agrees with "liczba" |

## 4. Next command

`/10x-tdd generators-remaining-stages phase 4`

## 5. Open

- COMPARE_EXPR answers are sign tiles; SEQUENCE answers are numbers (data should use `keypad`). SEQUENCE has no E2.7 data yet (phase 6).
- MISSING_OP prompt is the bare expression `8 □ 2 = 6` (no instruction sentence), answer is the sign string, choices the two signs; the scene/phase 6 sample shows it as is.
- CHAIN does not bound the number of distinct tasks for tiny `max`; phase 6 data must pick `max` large enough for the contentInvariants thresholds.
- Plan notes still apply (drivers, gate command change in phases 6/9, manual rows, known risks).

## 6. Autonomous decisions

1. Manual gate / commit message / next-phase / unrelated-dirty-paths prompts: committed the planned set only, took the proposed subject, stopped after phase 3. Phase keeps `Driver: tdd`; registry and `pl.ts` wiring were done inline as scaffolding.
2. Stubs for compareExpr/sequence added before the quoted RED so it is an assertion failure, not a missing module.
3. MISSING_OP parser requires both `+` and `-` (a single sign leaves no choice) and rejects `*`, `/`. Operand `a` drawn from [1; max] (no zero operand). Would change: a stage needing only-plus tiles.
4. `change.md` status not touched.
5. SEQUENCE prompt is `Uzupełnij ciąg: a, b, □, d` (instruction in `pl.tasks.sequence`); `start: 'multiple'` means the lowest term is a multiple of the step. Would change: S-04 wanting a number line.
