# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Phase 4 (`/10x-tdd`) is committed as 511d4f1: `errorCode` and a skill-carrying failure from `generateTask`. Phases 1 (e6a0b43), 2 (2e67a1d) and 3 (9013f59) are done; e2e for 3 and 4 is the orchestrator's.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phase 1 e6a0b43, phase 2 2e67a1d, phase 3 9013f59, phase 4 511d4f1, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 4.5 e2e (orchestrator) and phases 5-9 rows; 3.3 e2e, 3.4 [reviewer], 3.5 [visual] still open |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/save.ts` | `errorCode(e)` beside `errorName`: `name` or `name/skillId`, never throws |
| `src/core/tasks/visual.ts` | `assertDrawable(task)`: thin wrapper over `assertPool`/`lineTicks` with `ART_LIMITS` for the checks the widgets already make (icons, row, jugs, money items, number line) on `visual` and `hintVisual`; not `validateVisual` (plan review F5) |
| `src/core/tasks/generateTask.ts` | one `try` over generator, `assertDrawable`, tile choices (same rng order); rethrows `Error` with message `Skill <id>: …`, `cause`, the cause's `name`, `skillId`; "No generator" throw carries `skillId` |
| `tests/errorCode.test.ts` | 4 cases of `errorCode` |
| `tests/generateTaskFailure.test.ts` | 7 cases (mocks `getGenerator` for type `FAKE`): name, skill id, message, cause, non-Error cause, icon pool, hint number line, tile range, missing generator, valid passes |

## 3. Verification

| command | result |
|---|---|
| RED (observed) | with `errorCode` stubbed to `'STUB'`: `AssertionError: expected 'STUB' to be 'RangeError'`; generator cases: `AssertionError: expected 'Error' to be 'RangeError'` and `expected undefined to be 'E9.1.fake'` |
| GREEN | 11 new cases pass |
| Deliberate break | an extra `rng.next()` before the generator -> 64 failures in `tests/generateTask.test.ts` (e.g. `expected 'Dotknij trójkąta.' to be 'Dotknij koła.'`), so the rng-order oracles see order; `assertDrawable` removed -> icon-pool and hint cases red (2 failed / 7); name copy removed (`'Error'`) -> name, icon pool, tile range cases red (3 failed / 7); each restored |
| Meta-check | the literal "call `numberChoices` first" was approximated by an extra rng draw before the generator (same effect on order); `skillId` is still checked in every case so the name break is not the only proof |
| Seeds | `git diff main -- tests/generateTask.test.ts tests/contentInvariants.test.ts tests/solvableInMode.test.ts` has no removed lines; `npm run sample -- E1/E3/E6 --seed 7 --count 3` output identical before/after (diff empty) |
| lint, typecheck | OK |
| unit | 3703 passed, 192 files (phase-3 3692 + 11) |
| deploy scripts, sample E1–E6 | OK (exit 0 each) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | left to the orchestrator (`<branch e2e baseline> + 0`) |
| Teacher read | no generator or data changed; sample output byte-identical, so content unchanged |

## 4. Next command

`/10x-implement audit-boot-hidden-tab phase 5`

## 5. Open

- Row 4.5 open until the orchestrator's e2e run; 3.3 likewise; 3.4 [reviewer], 3.5 [visual] not mine.
- Other manual rows unchanged: 2.5 [reviewer], 2.6 [human]; 5.4, 6.5 [visual]; 7.5 [reviewer].
- Phase 5 uses `errorCode` from `src/core/save.ts` for the "Ups!" card.

## 6. Autonomous decisions

- D-1 **`assertDrawable` scope**: only checks the widgets already assert (icons, row, jugs, money items, number line); scale weights and coin tray left out, since widgets do not throw there and the plan (F5) forbids new round-build throws. Would change: the maintainer wanting every `ART_LIMITS` pool checked.
- D-2 **Test seam**: `vi.mock` of the registry's `getGenerator` for a `FAKE` type (generators are a frozen const table). Rejected: adding a registration API to production code.
- D-3 **Plan Driver** stays `tdd`; implementation did not exist at phase start.
- D-4 **Commit message / next-phase / manual-gate prompts** decided in place: planned set only, stop after phase 4.
