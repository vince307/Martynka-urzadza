# Handoff — `adaptive-curriculum` (slice S-07)

Written by `/10x-tdd adaptive-curriculum phase 4`. Phase 4 committed (`dba1791`); row 4.3 open for the e2e gate only.

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phase 1 `8fd7bd0`, phase 2 `1c384c5`, phase 3 `ee93ff9`, phase 4 `dba1791`; this handoff after it |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 30 (phases 5-9) plus 4.3 e2e-only |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/curriculum.ts` | + `EasingRules`, `RoundResult` (= `SkillResult`), `unlockReady(stage, adaptation, rules)` (next playable step or null), `endRound(adaptation, stage, results, at, kind, rules)` -> `{ adaptation, unlocked }`, `roundWeights(adaptation, rules)` |
| `src/data/balance.ts` | + `easing: { weakBelow: 3, weakRounds: 2, rounds: 2, weights: { current: 20, earlier: 50, previous: 30 } }` |
| `tests/curriculumEnd.test.ts` | 18 tests on real `stages` (E3 steps 1/2/10/11, E4 step 6, E2 step 1) |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub returning `unlocked: null`, no counters) | `AssertionError: expected null to be 2` (14 of 18 red); mastery-after-round case `expected 3 to be 4` |
| Break 1: `mastered >= ceil` -> `>` | 6 red (1 of 2, 1 skill, 2 of 3, 3 of 5, mastery-after-round, unlock during easing); restored |
| Break 2: weak counter not reset after a good round | 1 red (`weak, good, weak does not ease`); restored. Meta-check: expectations (1 of 2, 2 of 3, 3 of 5, easing 2+2) are typed from decision 3 and the plan; one test pins `balance.easing`/`curriculum` to the same literals |
| lint / typecheck | OK / OK |
| unit (npm test + deploy tests) | baseline 809 (branch after p3) + 18 = 827 passed (`Naruszenia: 0` for sample E1-E6) |
| build | OK, `e2e hook: absent` |
| e2e `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate |

## 4. Next command

`/10x-implement adaptive-curriculum phase 5`

## 5. Open

- Row 4.3 open only for e2e: orchestrator runs `npx playwright test` on `dba1791`. Phase 4 is pure core + balance data, no runtime path calls `endRound` yet (phase 5 wires it).
- Row 3.4 ticked citing the orchestrator run on `ee93ff9` (14/14).
- `[human]`/`[reviewer]`/`[visual]` rows untouched.

## 6. Autonomous decisions

1. Skill questions decided in place: TDD the phase, proposed commit message, stop after phase 4.
2. `unlockReady` judges the "current step" like `skillBuckets` (nearest playable step at or below `unlockedStep`, else the first); `n` = playable skills of that step; returns the next playable step number or null (also null for the last step).
3. Weak round = fewer than `weakBelow` results with outcome `'first'` (null/unplayed results count as not first). Easing order as in the plan: decrement `easedRounds` for a round played while easing, then update `weakStreak`; reaching `weakRounds` sets `easedRounds = rounds` and zeroes the streak (so a weak pair during easing can re-arm it).
4. `RoundResult` is an alias of `SkillResult` (same `{ skillId, outcome }` shape), no new type.
5. `endRound` rules argument takes `MasteryRules` whole; `unlockReady` needs only `unlockAt` from it.
