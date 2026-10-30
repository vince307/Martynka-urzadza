# Handoff — `rooms-as-data` (slice F-04)

Written by the `/10x-tdd rooms-as-data phase 1` step of run 2026-10-30-rooms-kitchen: phase 1 is committed (`dd6db69`), the
house rules and the frozen v4 salon fixture exist, `SAVE_VERSION` is still 4. The one thing the next agent must not get wrong:
`tests/fixtures/save-v4-salon.json` is frozen from now on (phase 2 must not edit it) and the load path must compare houses with
`houseEqual`, never by reference.

## 1. State

| | |
|---|---|
| Branch | `feat/rooms-as-data`, cut from `main` at `9d28753` |
| Commits | 5 docs/test commits before this handoff; phase 1 is `dd6db69` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (unchanged; the implementing step owns later status changes) |
| `## Progress` rows remaining | 32 (`grep -c '^- \[ \]' plan.md`); rows 1.1-1.3 ticked, 1.4 left open (e2e part is the orchestrator's) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/house.ts` | new: `houseRoomList`, `roomInRenovation`, `nextRoom`, `mergeHouse`, `houseLayout`, `houseEqual` (pure, copies, no mutation) |
| `src/core/types.ts` | `HouseRoomPlace`, `HouseState` added; no save type change |
| `tests/house.test.ts` | new: 18 cases on synthetic rooms `a`, `b` and literal lists |
| `tests/fixtures/save-v4-salon.json` | new, frozen: v4 save with a real salon (stars 23, tasksDone 6, 5 non-zero-variant picks, learner E2, variants, generation 12, writer `tab1:n1`) |
| `tests/saveV4.test.ts` | one case: the salon fixture decodes unmigrated, `saveProblem` null (reworded to v5 in phase 2) |
| `tests/fixtureLoadPath.test.ts` | `FIXTURES` gains `save-v4-salon` |
| `context/changes/rooms-as-data/plan.md` | rows 1.1-1.3 ticked with `dd6db69` |

## 3. Verification

| command | result (observed in this step) |
|---|---|
| unit baseline (`npm test` before the first edit) | 209 files, 3962 tests passed |
| unit after phase 1 | 210 files, 3982 tests passed: baseline 3962, +20 (18 house, 1 saveV4, 1 fixtureLoadPath case) |
| RED | stub `src/core/house.ts` returning empty values: 13 of 18 failed on assertions, e.g. `AssertionError: expected [] to deeply equal [ { room: 'a' }, …(1) ]`, `expected null to be 'a'`, `expected true to be false` (houseEqual). The fixture cases were written after the fixture file, so they were not observed red; the file's absence is the red (`readFileSync` ENOENT) |
| GREEN | `tests/house.test.ts`, `saveV4.test.ts`, `fixtureLoadPath.test.ts`: 61 passed |
| deliberate break 1 | `roomInRenovation` made to ignore `roomDone` (`if (state) return`): 4 red (`is the second room after the first is done`, `is null when every known room is done`, two `nextRoom` cases); restored |
| deliberate break 2 | teaser `break` replaced by `continue` in `houseRoomList`: 2 red (`turns the first unknown room into a teaser…`, `is empty when the first room is unknown`); restored |
| meta-check | oracles are literal rooms and lists written in the test, nothing computed by the code under test; break 1 also proves `nextRoom` depends on the rule |
| lint / typecheck | pass / pass |
| deploy scripts (`test-martynka-deploy.sh`, `test-martynka-ops.sh`) | OK / OK |
| `sample` E1-E6 | all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| row 1.3 diff vs `bc19919` (`save.ts`, `src/data`, fixtures v1-v4, `public`) | empty |
| Playwright e2e | NOT run (orchestrator owns ports 4397/4398); row 1.4 e2e part left unticked |

## 4. Next command

`/10x-tdd rooms-as-data phase 2`

## 5. Open

- Row 1.4 stays unticked until the orchestrator's e2e (`--workers=4`, expected branch baseline + 0).
- Phase 2 checks `git diff dd6db69 -- tests/fixtures/save-v4-salon.json` empty.
- Manual rows 6.6-6.9 as in the plan (unchanged). Carried risks as in the plan `## Known risks`.
- DESIGN-GAP: none added. Follow-ups: none new.

## 6. Autonomous decisions

- Skill checkpoints (manual gate, how to proceed, commit message) decided in place: commit the planned set only, stop after
  phase 1, proposed message used (Polish title).
- The phase keeps `Driver: tdd`; no redirect (implementation did not exist).
- `houseRoomList` gives the first entry no `unlockAfter`; later entries `unlockAfter` the previous room (matches the plan
  contract and today's `ROOM_ORDER`). `houseLayout` returns a copy of the data house. Would change: phase 3's "equals the old
  literal" test showing a mismatch.
- The `Skill` tool was not invoked; the skill's steps were followed directly from the plan (no user prompts involved).
