# Handoff — `task-round-stars` (slice S-04)

Written by `/10x-tdd task-round-stars phase 4` of autonomous run 2026-10-12-s04-s08. Phases 1 (9f57306), 2 (d77b9c8) and 3 (7d99976) are committed; phases 4–11 are untouched. Phase 3 added the pure round reducer `src/core/round.ts` and `balance.round`/`balance.defaultStage`. `firstHint` treats an open expression without `=` ("18 − 9") as not stating a result, so MISSING keeps its inverse-operation hint on doubles (9 + □ = 18).

## 1. State

| | |
|---|---|
| Branch | `feat/task-round-stars`, cut from `main` at `58244a5` |
| Commits on branch | 5 docs + p1 `9f57306` + p2 `d77b9c8` + `7d99976` (p3) + handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; becomes `implemented` after phase 11) |
| `## Progress` rows remaining | 44 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/round.ts` | New: `startRound(tasks, rules)` (slices to `rules.length`), `answer(state, input)`, `nextSolutionStep(state)`, `next(state)`; phases `first -> second -> solution -> retype -> done`; `RoundState` carries `rules`, `outcomes`, `starsEarned`, `bonusEarned`, `finished`; solution step count = `solutionSteps(task, String).length`; not-allowed actions return the same state |
| `src/data/balance.ts` | `round: { length: 5, starPerTask: 1, cleanRoundBonus: 2 }`, `defaultStage: 'E3'` |
| `tests/round.test.ts` | New, 13 tests: PRD scenarios (5+2, second try +1 no bonus, failed task 0, wrong retype), phase guards, frozen-state purity, string/set answers, real generated tasks, 200-seed random-action property |
| `plan.md` | Progress rows 3.1-3.3 ticked with 7d99976 |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub reducer returning the state unchanged) | assertion failures, e.g. `a clean round pays 5 + 2`: `expected false to be true`; `a second-try answer pays 1 star`: `expected 'first' to be 'second'`; 9 of 13 red |
| GREEN | `npx vitest run tests/round.test.ts` 13 passed |
| Deliberate break 1 | retype pays `starPerTask`: 3 red (two-mistakes scenario, failed-round scenario, property). Restored |
| Deliberate break 2 | bonus when no `retype` (second-try rounds get it): 2 red (second-try scenario, property). Restored. Meta-check: the property test, with expected values derived from the PRD (stars = paid tasks + bonus, bonus only for all-first), catches both without reading the reducer |
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | Tests 549 passed (branch baseline 536, +13); deploy tests OK; `sample` E1-E6 `Naruszenia: 0` |
| `npm run build` | exit 0 |
| `npx playwright test` | 1 passed (baseline 1, +0) |

## 4. Next command

`/10x-tdd task-round-stars phase 4`

## 5. Open

- Manual rows 1.5 and 2.5 `[reviewer]` are NOT ticked; no `reviews/teacher-read.md` written (reviewer row).
- Known gap (plan Known risks): single-line hints and HALF get no first hint, only "Spróbuj jeszcze raz" (human row 10.6).
- Phase 4 note: reducer exposes no view; `roundView` must derive the first-hint bar from `firstHint` and solution lines from `solutionSteps`; the "Dalej" button maps to `next`.
- Carried items unchanged: human rows 8.5, 10.5-10.8, `[visual]` rows 5.6, 6.4, 7.4, 8.4, DESIGN-GAPs and follow-ups written in Phase 10.

## 6. Autonomous decisions

1. **`RoundState` carries `rules`** so `answer`/`next` need only the state (rules are data passed once to `startRound`). Rejected: passing rules to every call. Would change: nothing.
2. **`startRound` slices tasks to `rules.length`**, making the round length data (FR-006). Would change: the caller preferring to guard it.
3. **Solution step count** comes from `solutionSteps(task, String).length` inside `nextSolutionStep`, so core needs no Polish answer line. Would change: a solution walk that differs from the displayed lines.
4. **Clean round = every outcome `first`**; a retype or second try forfeits the bonus (PRD FR-007 "runda bez bledu"). Wrong retype stays in `retype`, no penalty.
5. Skill prompts (exec mode, commit message, next phase) decided in place; stopped after phase 3.
