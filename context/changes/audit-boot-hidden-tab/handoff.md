# Handoff — `audit-boot-hidden-tab` (slice fix:audit-boot-hidden-tab)

Phase 5 (`/10x-implement`) is committed as 1482ff4: the "Ups!" card shows `Kod: <code> · Wersja <id>` and the prompt-fitting layout names the skill. Phases 1 (e6a0b43), 2 (2e67a1d), 3 (9013f59), 4 (511d4f1) are done; e2e for 3, 4 and 5 is the orchestrator's.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-boot-hidden-tab`, cut from `main` at 48c2c7e |
| Commits | phase 1 e6a0b43, phase 2 2e67a1d, phase 3 9013f59, phase 4 511d4f1, phase 5 1482ff4, plus docs commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 4.5 and 5.3 e2e (orchestrator) and phases 6-10 rows; 3.3 e2e, 3.4 [reviewer], 3.5 [visual] still open |
| Working tree | clean after the docs commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/dom/errorCard.ts` | `mountErrorCard(parent, buildId, code, onRestart)`; muted line is `pl.saveFailed.detail(code, buildId)`; doc names DESIGN-GAP 29 and 51; first call wins |
| `src/main.ts` | boundary callback passes `errorCode(error)`; `saver.block('fatal', errorName(error))` unchanged |
| `src/scenes/TaskScene.ts` | `drawPrompt` passes `task.skillId` to `pictureLayout` (both calls now carry it) |

## 3. Verification

| command | result |
|---|---|
| grep rows | `mountErrorCard` has one caller (`main.ts`) with `errorCode(error)`; both `pictureLayout(` calls in `TaskScene.ts` carry `task.skillId` |
| Deliberate break | `main.ts` passes `''` as code -> unit suite stays green, 3703 passed (expected: no unit test renders the card, plan row 5.2); restored |
| Meta-check | the green is the point: the card is DOM glue with no node-environment test, so the proof is phase 9's tightened spec (`''` -> red) and the [visual] row 5.4 |
| lint, typecheck | OK |
| unit | 3703 passed, 192 files (phase-4 3703 + 0) |
| deploy scripts, sample E1-E6 | OK (exit 0 each) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | left to the orchestrator (`<branch e2e baseline> + 0`); `error-boundary.spec.ts` matches `pl.errorCard.build(build)` as a substring of the new line |

## 4. Next command

`/10x-tdd audit-boot-hidden-tab phase 6`

## 5. Open

- Rows 3.3, 4.5, 5.3 open until the orchestrator's e2e run; 3.4 [reviewer], 3.5 [visual], 5.4 [visual] not mine.
- Other manual rows unchanged: 2.5 [reviewer], 2.6 [human]; 6.5 [visual]; 7.5 [reviewer].
- `pl.errorCard.build` is still used by `tests/e2e/error-boundary.spec.ts` (phase 9 tightens it); remove in phase 7 only if unused (row 7.3).
- Phase 6 is `Driver: tdd` (`Autosaver.replace` and `failureText`).

## 6. Autonomous decisions

- D-1 **`assertDrawable` scope**: only checks the widgets already assert (icons, row, jugs, money items, number line); scale weights and coin tray left out, since widgets do not throw there and the plan (F5) forbids new round-build throws. Would change: the maintainer wanting every `ART_LIMITS` pool checked.
- D-2 **Test seam**: `vi.mock` of the registry's `getGenerator` for a `FAKE` type (generators are a frozen const table). Rejected: adding a registration API to production code.
- D-3 **Plan Driver** stays `tdd`; implementation did not exist at phase start.
- D-4 **Commit message / next-phase / manual-gate prompts** decided in place: planned set only, stop after phase 4.
- D-5 **Phase 5 decisions**: no options-object, a positional `code` parameter (one caller); `pl.errorCard.build` kept for now. Commit message and next-phase prompts decided in place, stop after phase 5.
