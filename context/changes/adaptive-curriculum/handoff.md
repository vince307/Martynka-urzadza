# Handoff — `adaptive-curriculum` (slice S-07)

Written by `/10x-tdd adaptive-curriculum phase 2`. Phase 2 committed (`1c384c5`); row 2.3 open for the e2e gate only (ticked citing the orchestrator).

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phase 1 `8fd7bd0`, phase 2 `1c384c5`; this handoff after it |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 37 (phases 3–9) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/curriculum.ts` | `CurriculumRules`, `playableSteps`, `calendarStart` (rule D), `startLearning` (all 6 stages) |
| `src/core/round/pick.ts` | `playable` now exported (single predicate) |
| `src/data/balance.ts` | `balance.curriculum` (weights 60/30/10, `minStartSteps` 2, `unlockShare` 0.5) |
| `tests/curriculumStart.test.ts` | 13 tests; plan oracle 6 stages x 6 columns typed in the test |
| Phase 1 artifacts | `src/core/mastery.ts`, `tests/mastery.test.ts` (see commit `8fd7bd0`) |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub returning `[]` / `0`) | `AssertionError: expected [] to deeply equal [ 2, 3, 4, 5, 6, 7, 9, 11 ]`; `expected [ +0 x6 ] to deeply equal [ 3, 4, 5, 7, 11, 11 ]` (11 of 13 red) |
| `npx vitest run tests/curriculumStart.test.ts` | 13 passed |
| Break 1: `semesterStart` always 0 | 3 red (E2, E4, E6 rows); restored |
| Break 2: `behind` with `<=` | 7 red (all 6 rows + `startLearning`); restored. Meta-check: oracle is the plan table (verified 36/36 in plan review), not computed from the function |
| lint / typecheck | OK / OK |
| unit (npm test + deploy tests) | baseline 781 (branch after p1) + 13 = 794 passed; `sample` E1-E6 `Naruszenia: 0` |
| build | OK, `e2e hook: absent` |
| e2e `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate |

## 4. Next command

`/10x-tdd adaptive-curriculum phase 3`

## 5. Open

- Row 2.3 open only for e2e: orchestrator runs `npx playwright test` on `1c384c5`; phase 2 adds only pure core/data (no runtime caller yet), `playable` export is a no-behaviour change.
- Row 1.4 ticked from the orchestrator's e2e 14/14 on `8fd7bd0`.
- Later phases as in the plan; `[human]`/`[reviewer]`/`[visual]` rows untouched.

## 6. Autonomous decisions

1. Skill's TDD gate/commit-message/next-phase questions decided in place: TDD the phase, proposed message, stop after phase 2.
2. `CurriculumRules` carries all three balance keys now (`weights`, `minStartSteps`, `unlockShare`) so phases 3-4 need no interface change; `balance.curriculum` pinned to the PRD literals by one test.
3. The "after the semester" oracle column for E3/E5 uses February with ages 8/9, where the calendar stage is E4/E6 (`behind` branch, same expected value); noted in the test comment.
4. Added tests beyond the plan: unknown age/month throw `RangeError` (from `proposeStage`), `minStartSteps: 3` variant.
