# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-tdd phase 4` step of run `2026-10-12-s03-remaining-stages`. Phases 1–4 are committed (`3361723`, `c0e8bc9`, `308c458`, `0b5382e`): ADD_SUB tweaks + BONDS, CHAIN + MISSING_OP, COMPARE_EXPR + SEQUENCE, then FACT_FAMILY + CHOOSE_OP. Phases 5–10 remain.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | … + `308c458` (p3) + `0b5382e` `feat(generators-remaining-stages): FACT_FAMILY i CHOOSE_OP (p4)` + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 21 (9 ticked: 1.1–1.3, 2.1–2.2, 3.1–3.2, 4.1–4.2) |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/generators/factFamily.ts` | FACT_FAMILY: `parseFactFamilyParams`, `generateFactFamily` (variants swap, checkSub, checkAdd, checkDiv) |
| `src/core/tasks/generators/chooseOp.ts` | CHOOSE_OP: `parseChooseOpParams`, `generateChooseOp` (kinds sum, left, moreBy; reuses `drawNumbers`, `MIN_MAX`, `pickTwoPeople` from `word.ts`, now exported) |
| `src/core/tasks/registry.ts`, `src/data/pl.ts` | both registered; `pl.tasks.factSwapHint`, `factCheck`, `factCheck{Sub,Add,Div}Hint`, `chooseOp`, `chooseOpHint` |
| `tests/factFamily.test.ts`, `tests/chooseOp.test.ts` | new tests (`generateFactFamily`, `generateChooseOp`) |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run) | stubs throwing; quoted: `AssertionError: expected function to throw an error, but it didn't` (parser tests, both files) plus `Error: not implemented` in the draw tests |
| GREEN | `npx vitest run tests/factFamily.test.ts tests/chooseOp.test.ts`: 6 passed |
| `npm run lint` / `typecheck` / `build` | OK |
| `npm test` | branch baseline 258 + 6 = 264 passed (33 files) |
| deploy test scripts, `sample -- E3`, `sample -- E4` | OK, `Naruszenia: 0` each |
| Deliberate break | CHOOSE_OP sum distractor replaced by swapped terms: `AssertionError: ... expected [ '5 + 1', '1 + 5' ] to deeply equal [ '1 + 5' ]` (1 red). FACT_FAMILY first hint line given a number ("sumy 7"): `expected [ 7 ] to deeply equal []` (red). Both restored, 6 green. Meta-check: the tile test computes each tile's value itself and compares with the result on the last hint line, so it catches a second correct tile the generator did not flag; the hint test scans digits of line 0 independently of the generator |
| Teacher read | via a script (no E1/E2 data until phase 6): "Na kanapie jest 7 poduszek. Zabrano 2 poduszki. Ile poduszek zostało? Które działanie pasuje?" tiles 7 + 2 / 7 − 3 / 7 − 2, hint "Ubyło, więc odejmujemy." / "7 − 2 = 5"; "27 + 3 = 30. Sprawdź: 30 − 3 = □" hint "Odejmij od sumy jeden ze składników." / "30 − 3 = 27"; "96 + 4 = □ + 96" hint "Zamiana składników nie zmienia sumy." / "4 + 96 = 100". Agreement and accusative correct |

## 4. Next command

`/10x-tdd generators-remaining-stages phase 5`

## 5. Open

- CHOOSE_OP prompt is the story (incl. its "Ile …?" question) plus "Które działanie pasuje?", so sum.place gives 4 short sentences. Answer and choices are strings like `3 + 7`; data should use `tiles`. Third tile keeps the first operand and changes the second; the sign-flipped tile for a sum puts the larger term first (never negative, never the swapped sum).
- FACT_FAMILY answers are numbers (data: `keypad`); swap prompt is bare `4 + 7 = 7 + □` (no instruction sentence), check prompts use `Sprawdź:`. `max` bounds all numbers (checkDiv product too).
- Earlier open points still apply (MISSING_OP bare prompt, CHAIN tiny `max`, SEQUENCE no E2.7 data until phase 6). Plan notes: drivers, gate command change in phases 6/9, manual rows, known risks.

## 6. Autonomous decisions

1. Manual gate / commit message / next-phase / unrelated-dirty-paths prompts: committed the planned set only, took the proposed subject, stopped after phase 4. Phase keeps `Driver: tdd`; registry, `pl.ts` and the `word.ts` exports were done inline as scaffolding.
2. Stubs for factFamily/chooseOp added before the quoted RED so it is an assertion failure, not a missing module.
3. CHOOSE_OP hint is `[direction sentence, template line "a ± b = c"]`; the answer operation appears only in line 2. Would change: teacher read wanting the operation named without the result.
4. Sum distractor for a sum is `larger − smaller`; for a subtraction `a + b`. Would change: a stage wanting a "wrong order" subtraction distractor.
5. `change.md` status not touched.
