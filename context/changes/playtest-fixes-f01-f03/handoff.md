# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-tdd` step, phase 5 (F-02 b core: when "Wróć" is offered), run 2026-10-20-playtest-boot.
Phase 5 committed; local gate green; e2e left to the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03` |
| Commits | phases 1-4 (49a682f, e6b1d9c, 9f0cb7c, 27227e3), phase 5 `test(playtest-fixes-f01-f03): When Wróć is offered, pure rule over saved data (p5)` 6bd7c17, a docs commit with this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 5.4 (e2e, orchestrator), 4.5, 4.6 [visual], 4.7 [reviewer], 1.6, 3.5 [reviewer]; phases 6-9 open |
| Working tree | clean after the commits |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/placement.ts` | `firstRoundDone(learner, variants, warmupLength)`, `ageBackOffered(...)` pure, no balance import |
| `tests/ageBack.test.ts` | 7 cases: fresh, parent, roundsSince, variants (3 fields), history 6/7, v1 fixture lifted (variants asserted fresh), learner-less save round-trip |

## 3. Verification

| command | result |
|---|---|
| RED (stub: firstRoundDone false, ageBackOffered true) | 5 of 7 failed, first: `AssertionError: expected true to be false // Object.is equality` (parent case) |
| lint / typecheck / npm test | OK / OK / 3681 passed (phase 4 3674, +7) |
| deploy scripts, sample E1-E6, build | OK, `e2e hook: absent (2 chunks checked)` |
| deliberate break | history clause dropped: history 6/7 and v1 cases red; parent clause dropped: parent case red; both restored (green 7/7) |
| `git diff --stat main -- src/core/save.ts src/core/migrations tests/fixtures` | empty |
| e2e | not run (orchestrator); phase 4 gate 139/139 recorded in row 4.4 |

## 4. Next command

Phase 6 (`Driver: impl`): `/10x-implement playtest-fixes-f01-f03 phase 6`

## 5. Open

- Manual rows: 4.5, 4.6 [visual], 4.7 [reviewer], 1.6, 3.5 [reviewer].
- Row 5.4 waits for the orchestrator's e2e (`139 + 0`).
- Phase 4 hint bubble overlap check (see phase 4 notes) still for the visual gate.

## 6. Autonomous decisions

- T-1..T-3, P4-1..P4-3 stand.
- P5-1 Did not invoke the Skill tool; followed the TDD sequence directly (stub, red, green, breaks). Commit message: proposed one. Stopped after phase 5.
- P5-2 `firstRoundDone` also exported (the plan names it); `ageBackOffered` takes `Pick<SessionLearner,'history'|'stageOverriddenByParent'>` so the scene can pass the session learner.
