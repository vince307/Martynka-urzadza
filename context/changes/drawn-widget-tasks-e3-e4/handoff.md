# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by the `/10x-research` step: `research.md` answers the change.md unknowns and confirms the S-13 / S-13b split;
no product code yet. The planner must not let any new answer mode into `playable` (`src/core/round/pick.ts`) before
the e2e answer helpers (`tests/e2e/support/hook.ts` `answerRight`/`answerWrong`) can answer it — six specs draw from
E3 at random.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | 2 on top of `b57433c`: change identity, `docs(drawn-widget-tasks-e3-e4): research` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `preparing` (set by `metadata-guard.mjs mark-researched`) |
| `## Progress` rows remaining | n/a (no `plan.md` yet) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/drawn-widget-tasks-e3-e4/research.md` | Research: `TaskVisual` model + `visualKey`, `Task.input`, layout areas, curriculum/test impact tables, drag reducer + e2e `dragTouch`, narrator, saves, split decision |
| `context/changes/drawn-widget-tasks-e3-e4/change.md` | Frontmatter only: `status: new → preparing`, `updated` |
| `context/changes/drawn-widget-tasks-e3-e4/handoff.md` | This handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/drawn-widget-tasks-e3-e4` (observed) |
| Spot checks of decisive anchors (`roundView` input, `distinctTasks` key, `isCorrect`, contentInvariants key, `playable`, `calendarStart`, `UNBOUNDED_TYPES`, empty steps grep) | match research.md (observed) |
| lint / typecheck / unit / build / e2e | not run: docs-only step, no code changed (baseline on main b57433c per contract: unit 1247 passed, e2e 37 passed — inherited, unverified) |

No deliberate break: nothing testable was changed. Calendar-start "after" values come from a worker's computation of
rule D; October was re-derived by hand (E3: ceil(0.3·11)=4 → step 4); the plan's TDD phase will pin them.

## 4. Next command

`/10x-plan drawn-widget-tasks-e3-e4`

## 5. Open

- Plan must update data-pinned tests: `tests/curriculumStart.test.ts`, `tests/curriculumPick.test.ts`,
  `tests/curriculumEnd.test.ts`, `tests/progress.test.ts`, `tests/pick.test.ts`, `tests/roundView.test.ts`; e2e
  `first-launch.spec.ts` (age 8 Oct → E3 step 4), `adaptive.spec.ts` (E4 unlock → 3, needs `childName`).
- Uniqueness: `src/core/round/unique.ts` `distinctTasks` and `tests/contentInvariants.test.ts` key must include
  `visualKey`; CLOCK into `UNBOUNDED_TYPES` (`src/core/tasks/bounds.ts`); `scripts/sample.ts` must print the visual
  for the teacher read; `firstHint` (`src/core/round/hints.ts`) leak check is numeric-only.
- Choices for the plan: DATA value range (catalogue silent), where solution lines go beside a picture
  (`SolutionSteps`), optional on-picture hint highlight.
- DESIGN-GAP candidates (rows from 52 in `docs/design-gaps.md`): picture beside keypad, bar chart, `select` view (row 7
  revision), drag tray/mat, measured segment on ruler, solution lines with a picture, parent preview without the
  picture (`MistakeExample` prompt-only).
- Follow-ups at archive: S-13b `drawn-grid-tasks-e3-e4` (PUZZLE_GRID, GRID, PERIMETER, clock-hand drag); BONDS pairs /
  CHOOSE_OP picture re-trigger to S-13b or S-14.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. Split kept (S-13b confirmed): S-13 = picture infrastructure + CLOCK read, LENGTH, PLACE_VALUE read/build, DATA,
   `select`, `drag`. Rejected pulling grid/PERIMETER back (infrastructure is ~1–2 phases bigger than change.md assumed)
   and moving `drag` out (reducer + CDP helper mirror `longPress`/`holdTouch`). Reverses if the plan exceeds ~9 phases
   → `drag` moves to S-13b first.
2. Custom drag reducer in `src/core` over Phaser built-in drag (touch cancel counts as drop; `Pointer.reset()` does not
   clear drag state — source reading). Reverses if a runtime check disproves both.
3. CLOCK answers as tiles with string times "15.00" (ZADANIA notation over the kit's "3:30" caption). Reverses if the
   teacher read prefers word forms.
4. No save change; parent preview of visual misses stays prompt-only. Reverses if the visual must appear there (needs
   a v2 migration — rejected for this slice).
5. Research run with 4 parallel read-only workers (core/curriculum, scene/kit, content/catalogue, Phaser drag/e2e);
   decisive anchors spot-checked in the main context. Would change: none — method choice.
