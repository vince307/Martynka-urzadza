<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Słupek pisemny z okienkami cyfr, grafy strzałkowe i oś liczbowa (rysunek i podpowiedź)

- **Plan**: `context/changes/number-line-written-arrows/plan.md`
- **Mode**: Deep (code checks done directly in this step, no sub-agent: the risky claims were few and greppable)
- **Date**: 2026-10-14
- **Verdict**: REVISE → SOUND after triage (all CRITICAL fixed in plan.md)
- **Findings**: 2 critical, 1 warning, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | FAIL → PASS after fixes |

## Grounding

Grounding: 8/8 paths ✓ (`src/core/round/pick.ts`, `canonicalInput.ts`, `pictureLayout.ts`, `view.ts`, `src/ui/widgets/TaskPicture.ts`, `FeedbackBar.ts`, `src/core/minigames/word.ts`, `tests/e2e/support/hook.ts`), 9/9 symbols ✓ (`playable`, `canonicalInput`, `answerSpans`, `tallOf`, `roundView` fallback, `FeedbackBar.update` `barSpan`, `drawTask`, `answerRight`/`answerWrong`, `Snapshot.input`), brief↔plan ✓. Progress↔Phase: 11/11 phases, Success Criteria ↔ rows 1:1 (5,5,5,5,7,6,5,8,6,5,5), no checkboxes outside Progress.

## `digits` mode — every branch on the answer mode (grep of `src/`, `tests/`, `scripts/`)

| Consumer | Today | Plan phase | Verdict |
|---|---|---|---|
| `src/core/round/pick.ts` `playable` | explicit 4-mode list | 8 (with helpers) | ✓ |
| `src/core/round/pictureLayout.ts` `pictureLayout`, `answerSpans`, `tallOf` | `if` chains ending in tiles | 1 (`switch` + `never`) | ✓ |
| `src/core/round/canonicalInput.ts` | `select`/`drag`, else `task.answer` | 1 → **moved to 2** (F1) | fixed |
| `src/core/tasks/validate.ts` mode rule (`input === 'drag'`) | | 1 / 2 | ✓ |
| `src/core/round/view.ts` `roundView` fallback | `input ?? (choices ? 'tiles' : 'keypad')` | kept for hand-built tasks | ✓ (generated tasks always stamp `input` in `generateTask`) |
| `src/core/round/unique.ts` `taskKey` | `select` only | none needed | ✓ |
| `src/core/tasks/generateTask.ts` | `answer !== 'tiles'` → return | none needed | ✓ |
| `src/core/minigames/word.ts` `eligible` / `drawTask` | `tiles`/`keypad` only; forces `answer: 'tiles'` | 4 (strip `hintVisual`) | ✓ (F4) |
| `src/ui/widgets/FeedbackBar.ts` `update` | `input === 'keypad' ? … : 'tiles'` | 7 | ✓ |
| `src/scenes/TaskScene.ts` render / `drawPrompt` / `answerSpot` / `snapshot` | `if` chains | 7 | ✓ |
| `src/testing/e2eHook.ts` / `TaskScene.snapshot` | `input: AnswerMode` | 7 (`snapshot.digits`) | ✓ |
| `tests/e2e/support/hook.ts` `Snapshot.input`, `answerRight`, `answerWrong` | hand 4-mode union, keypad fallthrough | 8 (same phase as `playable`) | ✓ |
| `tests/pick.test.ts` (`toContain(skill.answer)`, `eligible`), `tests/curriculumPick.test.ts` `isPlayable` | hand 4-mode lists | **not listed** → added to 8 (F3) | fixed |
| `tests/solvableInMode.test.ts` | iterates every skill with a generator | 1/2 hand cases, 8 data | ✓ |

**Can a child meet a `digits` task before it is answerable?** No. Every path that turns a skill into a task goes through `playable`: adaptive rounds (`skillBuckets`), the warm-up (`pickSkills`/`firstPlayableSteps`), `?e2eSkills` (`forcedSkills` ignores unplayable ids), the word minigame (`eligible` also requires `tiles`/`keypad`); the dice board and the daily puzzle do not use generators. `digits` skills appear in data only in phase 8, the same phase that flips `playable` and adds the e2e helpers; the scene branch exists from phase 7. No path to an unanswerable task.

## Follow-ups with `Trigger: S-14b`

| Follow-up | Plan | Verdict |
|---|---|---|
| Number line as ADD_SUB hint (S-14) | in scope (phases 4, 6) | ✓ |
| O5 `E5.5.capacity_quarter_l` first hint (S-13b) | in scope (phase 8) | ✓ |
| E1.10 `place_read_12`, E5.5 `capacity_half_l_e5` (S-14) | re-triggered `S-14d` / `S-14c` | justified: cut in S-14 for task-space reasons that neither a number line nor a column changes |
| `ArtPool`/`fitRect`, S14-09/S14-10 | re-triggered `the next widget built on ArtImage` | justified: every drawing of this slice is code-drawn, no `ArtImage` |

## Product decisions vs PRD / ZADANIA

All departures from the literal ZADANIA text (ARROW_TABLE without "·3"/chain — consistent with the E2.6 step text "grafy +n / −n"; WRITTEN without "missing digits"; carry drawn by the game; hint line without E1 and > 30; SEQUENCE line only in E2.7; E5.2 with carry) and the higher unlock thresholds on live saves are named in `[human]` 9.6, the notation in `[human]` 8.8. None is clearly wrong against PRD FR-023 ("każdy etap ma pełny zestaw typów" is the M6 end criterion). Not overturned.

## Phases and drivers

Drivers checked against content: 1–4 `tdd` (pure `core`, failing tests drive them), 5–8 `impl` (widgets, scene, data), 9 `impl` (last impl = seam sweep), 10–11 `e2e` after the sweep — all right. Each phase adds ≤ 2 new UI components (5: `NumberLine` + `ArrowGraph`; 7: `WrittenColumn`). Every phase ends with the full e2e suite (orchestrator, `--workers=4`); phase 6 updates the E3 specs it can affect in the same phase. No split/merge needed.

## Findings

### F1 — Phase 1 references the `column` drawing before it exists

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 §2–§4; Critical Implementation Details (`digitBoxCount`)
- **Detail**: Phase 1 builds `digitBoxCount(task)` "from `visual.kind === 'column'`" and a `canonicalInput` `digits` branch tested "z rysunkiem `column` testowym", but `column` joins `TaskVisual` only in phase 2. In TypeScript the comparison against a kind outside the union is a type error, and a test cannot build a typed `column` visual — phase 1 cannot be green as written.
- **Fix**: `digitBoxCount`, the full `canonicalInput` `digits` branch and their tests move to phase 2; in phase 1 `case 'digits'` of `canonicalInput` throws (no `digits` skill exists yet).
- **Decision**: FIXED (plan.md phases 1 and 2, contract block)

### F2 — `TaskPicture.render` has a `never` guard: new visual kinds break typecheck in phases 2–3

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phases 2, 3 (files); Phase 5 contract
- **Detail**: `src/ui/widgets/TaskPicture.ts` `render` ends in `default: { const unreachable: never = visual; … }`. Phase 2 adds `column` and `numberLine`, phase 3 `arrows`, but `TaskPicture.ts` is listed only in phases 5 and 7, so phases 2 and 3 would fail `npm run typecheck` (the phase gate).
- **Fix**: `TaskPicture.ts` added to phases 2 and 3 with explicit throwing `case`s (`column`/`numberLine`, then `arrows`); phase 5 replaces `numberLine`/`arrows` with widgets, phase 7 `column`.
- **Decision**: FIXED (plan.md phases 2, 3, 5)

### F3 — Two hand-written "four modes" oracles in tests turn red when `playable` admits `digits`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 8 §2
- **Detail**: `tests/pick.test.ts` asserts `['tiles','keypad','select','drag']` `toContain(skill.answer)` for drawn skills and filters `eligible` by the same list; `tests/curriculumPick.test.ts` has an independent `isPlayable` oracle (`previous` of E6 = all playable E5, which will include WRITTEN). Phase 8 does not list them, so its gate would go red unexpectedly.
- **Fix**: both files added to phase 8 with `digits` in their lists (the oracle stays an explicit list, independent of `playable`).
- **Decision**: FIXED (plan.md phase 8)

### F4 — The word minigame forces tiles; only `drawTask` keeps `hintVisual` out

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 §3
- **Detail**: `drawTask` calls `generateTask({ ...skill, answer: 'tiles' })`, and `generateTask` never runs `validateTask`, so a `line: true` ADD_SUB skill yields a tiles task with `hintVisual` that the "only keypad" validator rule never sees. The plan's strip in `drawTask` plus a test on the real `wordTask` covers it.
- **Fix**: recorded under `## Known risks`.
- **Decision**: RECORDED

### F5 — WRITTEN results have exactly `columns` digits

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Critical Implementation Details (`column`), Autonomous decision 1
- **Detail**: the rule also excludes E5 subtractions with a one-digit difference (52 − 47) and E6 ones below 100. Deliberate (boxes must not reveal the carry into a new column, no leading zero); the teacher read in 2.5/8.6 will see the narrowed range.
- **Fix**: none; recorded.
- **Decision**: RECORDED

### F6 — No path admits `digits` early; follow-ups and drivers sound

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: whole plan
- **Detail**: verified against the code (tables above): every task path goes through `playable`; `digits` data, `playable` flip and e2e helpers share phase 8; follow-ups with `Trigger: S-14b` are in scope or re-triggered with reasons; product departures carry `[human]` rows.
- **Fix**: none.
- **Decision**: RECORDED

## Triage summary

Fixed: F1, F2, F3 (3) · Recorded: F4, F5, F6 (3) · Verdict after fixes: SOUND.

VERDICT: PROCEED — the approach is sound; two phase-greenness defects (a `column` reference in phase 1, the `TaskPicture` `never` guard in phases 2–3) and two stale test oracles in phase 8 are fixed in plan.md, and no path can hand a child a `digits` task before phase 8.
