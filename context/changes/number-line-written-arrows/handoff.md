# Handoff — `number-line-written-arrows` (slice S-14b)

Written by the `/10x-new` step: the change folder exists with `change.md` (identity, roadmap claims vs repo, scope
proposal, design kit and copy keys, migration verdict, triggered follow-ups, 7 autonomous decisions). No code yet.
The next agent must not miss that the "number line as an ADD_SUB hint" needs a NEW concept (a hint-phase drawing:
`Task.hint` is `string[]` only) and must not put the line into `task.visual` of ADD_SUB (decision 4).

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, cut from `main` at `882cd93` (after S-15) |
| Commits | 1 on top of `882cd93`: `docs(number-line-written-arrows): change identity (autonomous run)` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `new` |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit (only the two files below were staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/number-line-written-arrows/change.md` | Change identity: roadmap claims vs repo (9 rows), scope table (WRITTEN E5.2/E6.7, ARROW_TABLE E2.6, number line for SEQUENCE E2.7, new MULT_GROUPS jumps skill E3.9, ADD_SUB hint ≤ 30), design kit + DESIGN-GAPs from row 88, copy keys, migration verdict (none, v2 stays), triggered follow-ups, autonomous decisions 1–7 |
| `context/changes/number-line-written-arrows/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/number-line-written-arrows` (observed) |
| Repo checks behind the claims table | `src/core/tasks/registry.ts` 35 types, no `WRITTEN`/`ARROW_TABLE`; `TaskVisual` 12 kinds; no `numberLine` in `src/`/`tests/`; `AnswerMode` = tiles/keypad/drag/select; `SAVE_VERSION = 2`; `LONG_KEYPAD_HINTS` still holds `E5.5.capacity_quarter_l`; `docs/design-gaps.md` last row 87 (all observed by grep in this step) |
| Gate (lint, typecheck, unit, build, e2e) | not run — docs-only step, no code changed; baseline on main inherited from the contract (`882cd93`: unit 2326, e2e 71), unverified here |

No deliberate break: nothing testable changed.

## 4. Next command

`/10x-research number-line-written-arrows`

## 5. Open

- Unknowns for research (`change.md` § Autonomous decisions 2–7): shape of the "cyfra w okienku" mode (`src/core/types.ts` `SkillDef.answer`, `src/core/round/canonicalInput.ts` `canonicalInput`, `tests/solvableInMode.test.ts`, `tests/e2e/support/hook.ts` helpers before `src/core/round/pick.ts` `playable`); a hint-phase drawing (`src/core/round/view.ts`, `src/core/round/hints.ts` `firstHint`, `src/core/round/pictureLayout.ts`); fit in `TASK_LAYOUT.picture.keypadSolution` (190 px, O6/O2).
- Unlock thresholds change: E2.6, E3.9, E5.2, E6.7 (numbers in `change.md` claims table) — plan must state them.
- Interaction with S-15: `src/core/minigames/word.ts` `wordSkill`/`wordTask` filter by mode and drop tasks with a drawing — new mode and drawings drop out by themselves; ADD_SUB must keep `task.visual` undefined.
- DESIGN-GAPs to add from row 88 in `docs/design-gaps.md` (listed in `change.md` § Design source and copy) — not yet written.
- Follow-ups to move at archive: E1.10 `place_read_12` → `Trigger: S-14d`, E5.5 `capacity_half_l_e5` → `Trigger: S-14c`, `ArtPool`/S14-09/S14-10 → `Trigger: the next widget built on ArtImage`; new one for WRITTEN "missing digits" (decision 5). O5 (`LONG_KEYPAD_HINTS`) is in scope.

## 6. Autonomous decisions

Full text with reversal conditions in `change.md` § Autonomous decisions. Summary:

1. Next step `/10x-research` (step prompt fixes it), not the skill's default `/10x-plan`. Would change: nothing in this run.
2. "Cyfra w okienku" as a new `AnswerMode` value, answer stays a number. Rejected: keypad typing the whole result, a `drag` branch. Would change: research shows a focused keypad fits `keypad` without new view state.
3. Result boxes filled from the ones leftwards; carry drawn in hint/solution, not typed. Would change: teacher read says the carry must be typed.
4. Number line hint only for ADD_SUB with result ≤ 30, as a separate hint drawing; `task.visual` of ADD_SUB untouched. Rejected: all ADD_SUB, line as `task.visual`. Would change: a readable windowed line for E4–E5 or a teacher read rejecting it in E3.
5. WRITTEN without the E6 "missing digits" variant (follow-up). Would change: the new mode handles any box set at no extra cost.
6. Line for SEQUENCE only in `E2.7.sequence_tens_100`; MULT_GROUPS gets a new "jumps on the line" skill in E3.9. Would change: teacher read finds the line at E2.7 redundant.
7. ARROW_TABLE graph/table with one empty field on `keypad`; a two-arrow chain if it fits. Would change: the new mode handles several number boxes cheaply.
8. Skill's "STOP and wait / clipboard" step: skipped (no human in the loop); the clipboard copy is irrelevant to the run.
