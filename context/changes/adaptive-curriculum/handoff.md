# Handoff — `adaptive-curriculum` (slice S-07)

Written by `/10x-tdd adaptive-curriculum phase 3`. Phase 3 committed (`ee93ff9`); row 3.4 open for the e2e gate only.

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phase 1 `8fd7bd0`, phase 2 `1c384c5`, phase 3 `ee93ff9`; this handoff after it |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 33 (phases 4–9) plus 3.4 e2e-only |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/curriculum.ts` | + `skillBuckets(stage, previous, unlockedStep)`, `buildAdaptiveRound(stage, previous, adaptation, weights, rng, {length, uniqueRetries}, tileCount)` |
| `src/core/round/pick.ts` | + `Weights`, `SkillBuckets`, `pickRoundSkills` (weights renormalised over non-empty buckets, `RangeError` when all empty) |
| `src/core/round/unique.ts` | `distinctTasks(skills, rng, generate, retries)` (redraw same skill, keep duplicate after limit) |
| `src/core/round/warmup.ts` | `buildWarmup(..., tileCount, retries)` now goes through `distinctTasks` (callers `TaskScene`, `scripts/sample.ts`, tests updated) |
| `src/data/balance.ts` | `round.uniqueRetries: 20` (`tests/round.test.ts` pin updated) |
| `tests/curriculumPick.test.ts` | 14 tests; `tests/warmup.test.ts` + 1 uniqueness test (200 seeds x 5 stages) |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs returning `[]`) | `AssertionError: expected Set{} to deeply equal Set{ 6 }`; `expected [] to have a length of 20000 but got +0`; warm-up: duplicate-prompt assertion red on the unchanged `buildWarmup` (real duplicates exist: 12 of 14 + 1 red) |
| Statistical tolerance | 20 000 seeded draws, +-2 pp (sd <= 0.35 pp, > 5 sigma); oracle 60/30/10 and eased 20/50/30 typed from the plan; renormalised E3-step-1 case 6/7 and 1/7 |
| Break 1: `earlier` = `n !== currentStep` | 7 red (bucket, share, build-round tests); restored |
| Break 2: `distinctTasks` retries off | 4 red (real-data round and warm-up uniqueness + both `distinctTasks` unit tests); restored. Meta-check: tests walk the real `stages`; shares are counted from drawn skills mapped back to buckets, not from the weights in code |
| lint / typecheck | OK / OK |
| unit (npm test + deploy tests) | baseline 794 (branch after p2) + 15 = 809 passed (`Naruszenia: 0` for sample E1-E6) |
| build | OK, `e2e hook: absent` |
| e2e `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate |

## 4. Next command

`/10x-tdd adaptive-curriculum phase 4`

## 5. Open

- Row 3.4 open only for e2e: orchestrator runs `npx playwright test` on `ee93ff9`. Behaviour change reaching runtime: the warm-up now redraws duplicate prompts (same rng stream, more draws); the round still uses `buildRound` until phase 5.
- `buildRound`/`pickSkills` stay (warm-up uses `pickSkills`); seam sweep (phase 8) removes `buildRound` if unused.
- `[human]`/`[reviewer]`/`[visual]` rows untouched.

## 6. Autonomous decisions

1. Skill questions decided in place: TDD the phase, proposed commit message, stop after phase 3.
2. `buildWarmup` gets `retries` as a trailing parameter (not inside `WarmupRules`) so `balance.warmup` stays unchanged; `scripts/sample.ts` and `TaskScene` pass `balance.round.uniqueRetries`.
3. `buildAdaptiveRound` takes `rules: {length, uniqueRetries}`; an `unlockedStep` missing for the stage defaults to 1 (resolves to the first playable step).
4. If all weights of non-empty buckets are 0, `pickRoundSkills` falls back to uniform over non-empty buckets instead of throwing.
5. `distinctTasks` keeps the `rng` parameter (named in the plan) though `generate` closes over it; unused, underscore-prefixed.
6. Test of the calendar-start rounds uses 3 months per stage x 200 seeds (1 800 rounds x 5), not every month.
