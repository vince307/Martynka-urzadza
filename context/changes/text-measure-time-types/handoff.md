# Handoff — `text-measure-time-types` (slice S-14c)

Written by the `/10x-plan` step of run `2026-10-15-fix-s14c-s14d`. `plan.md` (11 phases, drivers tagged) and `plan-brief.md`
are written; the slice is ready for `/10x-plan-review`. The next agent must not get wrong: no INEQUALITY skill may enter the
data before phase 2, which changes `TaskScene` marking, the hook fields, `answerWrong` and E1.9 data in one commit; and the
E6 calendar oracle `[2, 3, 5, 7, 9, 10]` set in phase 4 must stay unchanged in phase 8 (that is the proof the review step is
excluded from `calendarStart`).

## 1. State

| | |
|---|---|
| Branch | `feat/text-measure-time-types`, cut from `main` at `e2f7caa` |
| Commits | 3 on top of `e2f7caa`: change identity, research, `docs(text-measure-time-types): plan` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `planned` (set by `metadata-guard.mjs mark-planned`) |
| `## Progress` rows remaining | 65 (all; `grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the commit (five files staged by path) |

## 2. Artifacts

| path | what it is |
|---|---|
| `context/changes/text-measure-time-types/plan.md` | the plan: 11 phases (1 tdd, 2 impl, 3–8 tdd, 9 impl seam sweep, 10–11 e2e), thresholds table, critical details (`check`, review step, E6 oracle, speech, validator), autonomous decisions, `## Progress` |
| `context/changes/text-measure-time-types/plan-brief.md` | two-page brief with the key-decision table |
| `context/changes/text-measure-time-types/change.md` | status `preparing` → `planned` |
| `context/foundation/roadmap.md` | S-14c `proposed` → `planning` (At a glance row and slice block) |
| `context/changes/text-measure-time-types/handoff.md` | this file |

## 3. Verification

| command | result |
|---|---|
| `git branch --show-current` | `feat/text-measure-time-types` |
| phase headings / drivers | 11 `## Phase N:` bodies, each with `Driver:` + `Driver why:` as first lines |
| Success Criteria ↔ Progress | awk count per phase equal (5,7,6,8,6,6,6,7,6,4,4 = 65 rows) |
| `metadata-guard.mjs mark-planned` | `changed: true` |
| anchors re-read in this step | `playableSteps`/`calendarStart`/`floorToCalendar`/`currentStep`/`skillBuckets`/`unlockReady` (`src/core/curriculum.ts`), `pickRoundSkills`/`SkillBuckets`/`firstPlayableSteps` (`src/core/round/pick.ts`), `withoutArtBlocked`/`artBlocked` (`src/core/round/artFilter.ts`), `markCorrect`/`markHint` (`TaskScene`), `answerWrong` (`tests/e2e/support/hook.ts`), `GROUP_1`/`LATER` (`tests/curriculum.test.ts`), E6 pins (`tests/curriculumStart.test.ts` oracle, `curriculumPick`, `curriculumEnd`, `progress`, `perimeterSkills`), e2e grep for E6/E1 (only `written-column.spec.ts` plays E6, forced skill) |
| lint / typecheck / tests / build / e2e | not run: plan-only step, no code touched (baseline on main e2f7caa: lint OK, typecheck OK, 2479 tests, build OK, e2e 82 — inherited, unverified) |

## 4. Next command

`/10x-plan-review text-measure-time-types`

## 5. Open

- `[human]` rows: 4.8 (tablet voice reads `spokenTime` „8 15”), 9.6 (decisions against ZADANIA literal text: INEQUALITY on tiles with one example in the solution, MIX step-first with ~14 % E5, E6.11 not a calendar start/warm-up, no LOGIC, timetable as text, PRICE whole złote, no set-the-clock in E5–E6; unlock-threshold rises on 10 steps and the E6 start shifted by E6.2).
- DESIGN-GAP planned: row 98 (several right tiles, `TaskScene` marking) in phase 2.
- Conditional: `capacity_half_l_e5` drops to follow-up `Trigger: S-17` if variety invariants fail (plan decision 5).
- Follow-ups with triggers are written in phase 9 (`follow-ups/review-fixes.md`): set-the-clock E5–E6, 200/500 zł, WRITTEN missing digits + F9, ARROW_TABLE multi-number, LOGIC in E6.11, timetable table, review title in HUD.
- E2E phases 10–11 use the request-file protocol (Chromium from subagents is unreliable, profile § 8); phase 11 reaches E6.11 through the product import path (helper possibly extracted from `tests/e2e/save-transfer.spec.ts`).
- Save format stays v2 — no phase needs v3.

## 6. Autonomous decisions

1. **INEQUALITY = option A (2 right + 2 wrong tiles, `check`, solution shows one example).** Rejected: one right tile. Why: ZADANIA § 4, `isCorrect` already honours `check`. Would change: teacher read/playtest finding two right tiles confusing for E1.
2. **MIX = `StepDef.review` + `stepPlayable` + `SkillBuckets.currentGroups`, step-first draw, ordinary `kind: 'round'`, `previous` (E5) kept.** Rejected: MIX generator, new `RoundKind`, skill-uniform draw. Why: no saved state, S-15 untouched, steps with many skills would dominate. Would change: author wanting skill weighting or a "passed test" record (v3 → stop at PR).
3. **Review step excluded from calendar start and warm-up.** Rejected: summer start on E6.11. Why: ZADANIA "finałowe wyzwanie"; `floorToCalendar` would lift saved learners onto it. Would change: author wanting the review as the post-year default.
4. **Generator + data in the same tdd phase (≤ 3 generators/variants), INEQUALITY split core (1) / scene+data (2).** Rejected: S-14b pattern (generators first, data later). Why: the teacher read reads real `sample` output in the same phase; the step prompt requires the scene fix in the phase that makes INEQUALITY reachable. Would change: a phase exceeding one agent's context → split.
5. **`capacity_half_l_e5` in scope as text.** Would change: variety invariants failing → trigger to S-17.
6. **Speech via `spokenTime` and ungrouped numbers in `speak`.** Rejected: number words past 1000 in the narrator. Would change: `[human]` 4.8 finding bad pronunciation.
7. **E2E: two specs; E6.11 reached through save import, no new e2e seam.** Rejected: `?e2eUnlock`, playing to unlock. Would change: import too slow/flaky in a spec → seam with a marker in `vite/e2eHookGuard.mjs`.
8. **No `AskUserQuestion`; complexity HIGH, budget 0 questions** — every open question was answered by research/change.md recommendations (contract rule 1, order: step prompt → recommendation). Plan written in Polish like the archived plan example; roadmap status edit committed with the plan (step prompt).
9. **Progress row titles abbreviated for some deliberate-break criteria** (as in the archived S-14b plan); the phase block holds the full text and indices map one-to-one. Would change: plan-review requiring verbatim copies.
