# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-tdd phase 1` step of run `2026-10-12-s03-remaining-stages`. Phase 1 (ADD_SUB without frequent `n − n`, F12 hint `DT − U`, BONDS) is implemented test-first and committed (`3361723`). Phases 2–10 remain. Watch out: the sample printouts for E3/E4 changed on purpose (uniform pair draw, F12 hints).

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | plan-review state + `3361723` `feat(generators-remaining-stages): … (p1)` + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (left unchanged; skill's `implementing` flip not done in this autonomous step) |
| `## Progress` rows remaining | 27 (3 ticked: 1.1–1.3) |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/generators/addSub.ts` | `SAME_SHARE` (0.05), uniform pair draws in `drawFree`, `a − a` thinning in `drawShaped`, `DT − U` hint branch |
| `src/core/tasks/generators/bonds.ts` | new BONDS generator + `parseBondsParams` |
| `src/core/tasks/{registry,bounds}.ts`, `src/data/pl.ts` | BONDS registered, `boundOf` reads `totals`, `pl.tasks.bonds`/`bondsHint` |
| `tests/addSub.test.ts`, `tests/bonds.test.ts` | new tests (`ADD_SUB: rare a − a (E1)`, `generateBonds`) |
| `plan.md` | rows 1.1–1.3 ticked with sha |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run) | `AssertionError: expected 0.4823529411764706 to be less than or equal to 0.1` (max 5; also 0.31 for max 10, 0.213 for DT-DT) and `expected [ '70 − 9 = 61' ] to deeply equal [ '70 − 10 = 60', '60 + 1 = 61' ]`. bonds.test.ts first failed on missing module, so a stub was added; its RED: `Error: not implemented` and `expected function to throw an error, but it didn't` (`parseBondsParams({ totals: [1] })`) |
| GREEN | `npx vitest run tests/addSub.test.ts tests/bonds.test.ts` all pass |
| `npm run lint` / `typecheck` / `build` | OK |
| `npm test` | baseline 236 + 10 = 246 passed (27 files) |
| deploy test scripts, `sample -- E3`, `sample -- E4` | OK, `Naruszenia: 0` each |
| Deliberate break | `SAME_SHARE = 1` and DT − U branch disabled: 5 tests red (3 share tests, F12 test, old hint test); restored, 20 green. Meta-check: share tests count real generator draws, not the constant |
| Teacher read | `sample -- E4`: `90 − 4 → 90 − 10 = 80 | 80 + 6 = 86`, `10 − 3 → 10 − 3 = 7`; correct, natural Polish. BONDS text reads "Uzupełnij domek liczby 7." / "Ile trzeba dodać do 3, żeby było 7?" (not yet in a sample: no E1 data until phase 6) |

## 4. Next command

`/10x-tdd generators-remaining-stages phase 2`

## 5. Open

- Existing assertion `addSubHint(20, 7, '-')` in `tests/addSub.test.ts` changed to the F12 two-line hint (plan row 1 contract says so).
- BONDS prompt is two lines (`text\n7 = 3 + □`); the keypad scene/phase 6 sample shows it as is. Pairs-to-10 pictures stay a follow-up (S-13).
- Remaining plan notes from the previous handoff still apply (phase drivers, gate command change in phases 6/9, manual rows, known risks).

## 6. Autonomous decisions

1. Mixed-phase / manual gate / commit message / next-phase prompts: committed the planned set, took the proposed subject, stopped after phase 1. Phase keeps `Driver: tdd` (the BONDS registry/pl/bounds wiring was done inline as scaffolding).
2. BONDS stub added after first RED (missing module) so the quoted RED is an assertion/behaviour failure.
3. `change.md` status not touched. Would change: orchestrator wanting `implementing`.
4. `SAME_SHARE` realised by rejection (equal pair accepted with probability 0.05), giving ~1–2 % actual share; test only needs (0; 0.1].
