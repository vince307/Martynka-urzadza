# Handoff — `number-line-written-arrows` (slice S-14b)

Written by the `/10x-plan-review` step: verdict PROCEED, 2 CRITICAL + 1 WARNING fixed in `plan.md`, no code yet. The next agent
(phase 1, `tdd`) must not get this wrong: phase 1 no longer builds `digitBoxCount` or the full `canonicalInput` `digits` branch.
Those wait for phase 2, which adds the `column` drawing. In phase 1, `case 'digits'` in `canonicalInput` throws, and
`playable` still leaves `digits` out (that changes only in phase 8).

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, cut from `main` at `882cd93` (after S-15) |
| Commits | 4 on top of `882cd93`: change identity, research, plan, `docs(number-line-written-arrows): plan review` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 62 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (only the four files below staged) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/number-line-written-arrows/reviews/plan-review.md` | Plan review: table of answer-mode consumers vs phase, the check that no task path reaches `digits` before phase 8, follow-ups with `Trigger: S-14b`, the 6 findings, `VERDICT: PROCEED` |
| `context/changes/number-line-written-arrows/plan.md` | Fixes F1 (phase 1 → 2: `digitBoxCount`, full `canonicalInput` `digits`), F2 (`TaskPicture.ts` throwing `case`s in phases 2 and 3, phase 5 contract), F3 (phase 8: `tests/pick.test.ts`, `tests/curriculumPick.test.ts` `isPlayable`), F4 entry in `## Known risks` |
| `context/changes/number-line-written-arrows/change.md` | Frontmatter `status: plan_reviewed` |
| `context/changes/number-line-written-arrows/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/number-line-written-arrows` (observed) |
| Grep of answer-mode branches (`.input`, `AnswerMode`, `skill.answer ===`) across `src/`, `tests/`, `scripts/` | Every consumer is mapped to a phase (see the review table). Two test oracles were not mapped, so phase 8 now covers them (F3) |
| Task paths vs `playable` (`skillBuckets`, `pickSkills`/`buildWarmup`, `forcedSkills`, `buildWordRound` `eligible`, dice, puzzle) | All of them filter through `playable` or use no generator → no `digits` task before phase 8 |
| `TaskPicture.render` `switch` | ends in `const unreachable: never` (observed), the basis for F2 |
| Plan structure check (python) | 11 phases ↔ 11 Progress headings; criteria ↔ rows 1:1 (5,5,5,5,7,6,5,8,6,5,5); 0 checkboxes outside Progress; drivers tdd×4, impl×5, e2e×2 |
| Gate (lint, typecheck, unit, build, e2e) | not run: this step changed only docs. The main baseline is the contract's (`882cd93`: unit 2326, e2e 71) and was not checked here |

No deliberate break, because nothing testable changed.

## 4. Next command

`/10x-tdd number-line-written-arrows` (phase 1, `Driver: tdd`)

## 5. Open

- `[human]` rows (post-run checklist): **8.8**, the carry/borrow notation in the column (`columnMarks` in `src/core/tasks/written.ts`,
  widget `WrittenColumn`); **9.6**, decisions that go against the literal ZADANIA/PRD text, and the higher unlock thresholds on
  live saves (E2.6 1→2, E3.9 2→3, E5.2 1→2, E6.7 1→2).
- `[visual]` rows 5.7, 6.6, 8.7. `[reviewer]` teacher reads 2.5, 3.5, 5.6, 6.5, 8.6.
- Provisional layout numbers to confirm at the visual gate: `TASK_LAYOUT.picture.digits` and `TASK_LAYOUT.picture.hint.keypad`.
- Phase 6 must check the E3 specs that play a round with a miss (`task-round`, `adaptive`, `narrator`), because of `targets.hintPicture`.
- Phases 2 and 3 add throwing `case`s in `TaskPicture.render` (F2). Phase 5 replaces them for `numberLine`/`arrows`, phase 7 for `column`.
- Known risk F4: in `drawTask` (`src/core/minigames/word.ts`), stripping `hintVisual` is the only thing that keeps it out of the forced-tiles word round.
- DESIGN-GAP rows from 88 (`docs/design-gaps.md`), and follow-ups for phase 9 as listed in the plan.

## 6. Autonomous decisions

1. **No `AskUserQuestion`; triage done in place** (contract rule 1). Each CRITICAL went in with the skill's single fix, the
   WARNING got its obvious fix, and the OBSERVATIONs were recorded. I rejected leaving the findings PENDING. This would change if
   a finding needed a product choice, which none did.
2. **F1: `digitBoxCount` and the full `canonicalInput` `digits` branch moved to phase 2**, rather than moving the `column` type
   into phase 1. I rejected the type move because the union member would force branches in `visual.ts` and `TaskPicture` in a
   phase about the mode guard. This would change if phase 1 needed `digitBoxCount` for its own reducer tests (it does not, since
   `startDigitBoxes` takes the count).
3. **F3: the test oracles stay explicit lists** (with `digits` added). I rejected deriving them from `ANSWER_MODES`/`playable`
   because an oracle must not be computed from the code it checks. This would change if a maintainer chose a single source.
4. **Step 3 sub-agent skipped.** The risky claims could be checked directly with greps, and every check cites a file and symbol
   in the review. This would change on a claim that needed a wide blast-radius search.
5. **No phase split or merge.** Every phase has ≤ 2 new UI components and every driver is correct. This would change if a phase
   agent reported the work was over budget (split phase 8 into data and helpers, keeping the helpers in the same phase as `playable`).
6. **Commit message**: `docs(number-line-written-arrows): plan review` (step prompt).
