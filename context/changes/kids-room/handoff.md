# Handoff — `kids-room` (slice S-25)

Written by the `/10x-tdd kids-room phase 1` step of run 2026-11-01-kids-room. Phase 1 is done and committed (5fe9dd2): the pure
background rule `sceneKey` and the fade rule `stageFade` exist in `src/core/rooms.ts`, and `backdropMode` uses `sceneKey`.
Nothing visible changed. Phase 2 wires the four call sites. Keep two things in mind from the plan review: the children's costs
are 5/6/7 + 7/9/10/12/13/15 = 84, and phase 3 adds a temporary placement exemption in `tests/roomsData.test.ts` that phase 4 removes.

## 1. State

| | |
|---|---|
| Branch | `feat/kids-room`, cut from `main` at `bfdf193` |
| Commits on the branch | 7: identity, research, plan, handoff row count, plan review, phase 1 (5fe9dd2), handoff |
| Pushed / PR / merged | no / no / no |
| `## Progress` rows remaining | 32 (rows 1.1-1.4 ticked with the sha) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/types.ts` | stage `RoomTaskDef` gains optional `scene` |
| `src/core/rooms.ts` | `sceneKey`, `stageFade` |
| `src/core/backdrop.ts` | `backdropMode` reads `sceneKey` |
| `tests/rooms.test.ts` | describe `sceneKey and stageFade (kids-room phase 1)`: 3 cases (synthetic three-stage room with literal expectations, salon/kitchen ternary guard) |
| `tests/backdrop.test.ts` | describe `backdropMode on a room with staged scenes`: 1 case |
| `context/changes/kids-room/plan.md` | rows 1.1-1.4 ticked |

## 3. Verification

| command | result |
|---|---|
| RED (stubs returning `before` / `null`) | `AssertionError: expected [ 'b0', 'b0', 'b0', 'b0', 'b0' ] to deeply equal [ 'b0', 'st1', 'st2', 'aft', 'aft' ]`; `expected null to deeply equal { from: 'b0', neglected: true }`; `expected 'plain' to be 'salon'`; `expected 'salon/before' to be 'salon/after'` (4 failed) |
| GREEN | `tests/rooms.test.ts tests/backdrop.test.ts` 53 passed |
| Break 1: `sceneKey` takes the FIRST done stage | 2 red (sceneKey case and stageFade case), restored |
| Break 2: `stageFade` `neglected: true` always | stageFade case red, restored |
| Meta-check | expectations are literals from the synthetic room, not computed by `sceneKey`; the salon/kitchen guard compares against the old ternary |
| lint, typecheck, `npm test` (4198 passed = 4194 + 4), deploy and ops tests, `sample` E1-E6, `npm run build` (`e2e hook: absent (2 chunks checked)`) | all green |
| `git diff --stat bfdf193 -- src/ui src/scenes src/data src/testing` | empty |
| e2e | not run (core-only phase; orchestrator gate) |

## 4. Next command

`/10x-implement kids-room phase 2`

## 5. Open

- Phases 2-6 as in the plan (2 impl, 3 impl, 4 tdd, 5 impl, 6 e2e).
- Manual rows 3.7, 3.8, 5.6-5.12 stay as the human/reviewer/visual checklist.
- Risks unchanged: smaller miniature on every card, `npm run art` needs local tools (missing = BLOCKED), purchase-heavy e2e is load-sensitive.

## 6. Autonomous decisions

- **Skill gates decided in place**: commit message taken as proposed; stopped after phase 1. Driver stays `tdd`; no part was done inline.
- **Stubs before RED**: `sceneKey`/`stageFade` stubs and the `scene?` field were added first so the RED is an assertion failure, not a missing export.
- **`stageFade` uses `{...state, tasksDone - 1}`** for the previous state, so `chosen` is carried unchanged (irrelevant to the rule).
