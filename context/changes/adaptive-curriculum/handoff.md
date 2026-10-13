# Handoff — `adaptive-curriculum` (slice S-07)

Written by `/10x-tdd adaptive-curriculum phase 1`. Phase 1 committed (`8fd7bd0`); row 1.4 open for the e2e gate only.

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phase 1 `8fd7bd0` on top of the docs commits; this handoff after it |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 41 (1.4 open: e2e orchestrator gate; phases 2–9) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/mastery.ts` | `MasteryRules`, `SkillResult`, `recordRound` (first-try mastery 0..5, streak, history cut to 200) |
| `src/core/types.ts` | `LearnerState` + `weakStreak`, `easedRounds`; `Adaptation` type |
| `src/core/placement.ts`, `src/data/placement.ts` | `PlacementData`/`Band` now in core; data file `satisfies` it (F5 closed) |
| `src/data/balance.ts` | `balance.mastery` |
| `tests/mastery.test.ts` | 14 tests (rule values written in the test, one test pins `balance.mastery`) |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub returning input) | `AssertionError: expected undefined to be 1`; `expected 3 to be 2`; `expected [] to deeply equal [ …(3) ]` (12 of 14 red; balance test red before the data edit) |
| `npx vitest run tests/mastery.test.ts` | 14 passed |
| Break 1: `'second'` counted like `'first'` | 2 red (`lowers mastery … second-try`, `never raises … second-try`); restored |
| Break 2: streak not reset after a gain | 3 red (`+1 after three`, `six in a row give +2`, `twelve → 4`); restored. Meta-check: expectations are the PRD rule literals in the test, not read from implementation |
| `grep -rn "from '../data" src/core/` | empty |
| lint / typecheck | OK / OK |
| unit (npm test + deploy tests) | baseline 767 + 14 = 781 passed; `sample` E1–E6 `Naruszenia: 0` |
| build | OK, `e2e hook: absent` |
| e2e `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate (4 failed + 10 not run, all `MachPortRendezvous … Permission denied`) |

## 4. Next command

`/10x-tdd adaptive-curriculum phase 2`

## 5. Open

- Row 1.4 (full local gate) open only for e2e: the orchestrator runs `npx playwright test` on the phase 1 commit; phase 1 changes only types, data and a new pure module (no runtime path).
- Later phases as in the plan; `[human]`/`[reviewer]`/`[visual]` rows untouched.

## 6. Autonomous decisions

1. Skill's TDD gate/commit-message/next-phase questions decided in place: TDD the phase, proposed message, stop after phase 1.
2. `Band` type moved with `PlacementData` into `core/placement.ts` (the data file no longer defines it; nothing else used it).
3. Rules in the test are literals of the PRD rule; `balance.mastery` is pinned to them by one test rather than read by the others.
