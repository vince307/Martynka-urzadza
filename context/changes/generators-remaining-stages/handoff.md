# Handoff — `generators-remaining-stages` (slice S-03)

Written by the `/10x-tdd phase 2` step of run `2026-10-12-s03-remaining-stages`. Phases 1–2 are committed (`3361723`, `c0e8bc9`): ADD_SUB tweaks + BONDS, then CHAIN + MISSING_OP on the shared `arith.ts`. Phases 3–10 remain.

## 1. State

| | |
|---|---|
| Branch | `feat/generators-remaining-stages`, cut from `main` at `a24b502` |
| Commits | … + `3361723` (p1) + `c0e8bc9` `feat(generators-remaining-stages): CHAIN i MISSING_OP … (p2)` + this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 25 (5 ticked: 1.1–1.3, 2.1–2.2) |
| Working tree | clean for this step's files; untracked `designs/martynka-expansion-v1/` is the maintainer's |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/arith.ts` | `applyOp`, `opSign`, `arithLine`, type `Op`; `addSub.ts` imports them (no private `apply`/`sign`/`line`) |
| `src/core/tasks/generators/chain.ts` | CHAIN: `parseChainParams`, `generateChain` (3 terms, every intermediate and final result in [1; max]) |
| `src/core/tasks/generators/missingOp.ts` | MISSING_OP: `parseMissingOpParams` (only + and − both required), `generateMissingOp` (b >= 1, a − a at 5 %) |
| `src/core/tasks/registry.ts`, `src/data/pl.ts` | CHAIN, MISSING_OP registered; `pl.tasks.missingOpHint(a, plus)` |
| `tests/chain.test.ts`, `tests/missingOp.test.ts` | new tests (`generateChain`, `generateMissingOp`) |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run) | stubs throwing; quoted: `AssertionError: expected function to throw an error, but it didn't` (`parseChainParams({ max: 2, ops: ['+'], terms: 3 })`) plus `Error: not implemented` in the draw tests (stub added after the missing-module state, so no import error) |
| GREEN | `npx vitest run tests/chain.test.ts tests/missingOp.test.ts`: 7 passed |
| `npm run lint` / `typecheck` / `build` | OK |
| `npm test` | branch baseline 246 + 7 = 253 passed (29 files) |
| deploy test scripts, `sample -- E3`, `sample -- E4` | OK, `Naruszenia: 0` each |
| `grep "const apply\b\|const sign\b" addSub.ts` | empty |
| Deliberate break | CHAIN range check `n >= 1` dropped: `x.chain … prompt="7 − 8 + 4": expected [ {…} ] to deeply equal []` (validator negative) and `6 − 7 − 1`; MISSING_OP `b` from 0: `prompt="8 □ 0 = 8": expected 0 to be greater than or equal to 1`. 3 red; restored, 7 green. Meta-check: the uniqueness test counts both signs via its own `fits()`, not the generator's `answer`; b = 0 would also fail it (both signs fit) |
| Teacher read | not possible via sample yet (no E1 data until phase 6). Hint reads "Wynik jest mniejszy niż 8, więc odejmujemy." then `8 − 2 = 6`; chain hint `2 + 3 = 5`, `5 + 4 = 9`; correct Polish |

## 4. Next command

`/10x-tdd generators-remaining-stages phase 3`

## 5. Open

- MISSING_OP prompt is the bare expression `8 □ 2 = 6` (no instruction sentence), answer is the sign string, choices the two signs; the scene/phase 6 sample shows it as is.
- CHAIN does not bound the number of distinct tasks for tiny `max`; phase 6 data must pick `max` large enough for the contentInvariants thresholds.
- Plan notes still apply (drivers, gate command change in phases 6/9, manual rows, known risks).

## 6. Autonomous decisions

1. Manual gate / commit message / next-phase / unrelated-dirty-paths prompts: committed the planned set only, took the proposed subject, stopped after phase 2. Phase keeps `Driver: tdd`; `arith.ts` extraction, registry and `pl.ts` wiring were done inline as scaffolding.
2. Stubs for chain/missingOp added before the quoted RED so it is an assertion failure, not a missing module.
3. MISSING_OP parser requires both `+` and `-` (a single sign leaves no choice) and rejects `*`, `/`. Operand `a` drawn from [1; max] (no zero operand). Would change: a stage needing only-plus tiles.
4. `change.md` status not touched.
