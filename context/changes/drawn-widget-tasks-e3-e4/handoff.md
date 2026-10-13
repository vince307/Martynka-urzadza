# Handoff — `drawn-widget-tasks-e3-e4` (slice S-13)

Written by `/10x-tdd` phase 1 (commit 42a0bee): the drawing/answer-mode model is in `core`; no new skill is playable yet.
The next agent must keep the ordering rule: no answer mode enters `playable` (`src/core/round/pick.ts`) before
`tests/e2e/support/hook.ts` `answerRight`/`answerWrong` can answer it (`select` phase 7, `drag` phase 9).

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-widget-tasks-e3-e4`, cut from `main` at `b57433c` |
| Commits | 5 docs/plan commits + `42a0bee` test(p1) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (phase 1 left: 1.4 e2e part, 1.5 [reviewer]) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/visual.ts` | `TaskVisual`, `AnswerMode`, `visualKey`, `validateVisual`, `describeVisual` |
| `src/core/text/time.ts` | `formatTime` ("15.00") |
| `src/core/tasks/{types,generateTask,validate}.ts` | `Task.visual`/`Task.input`, `input` stamped from `skill.answer`, violation rule `visual` |
| `src/core/round/{view,unique}.ts` | `RoundView.input: AnswerMode` + `visual`; uniqueness key `prompt|visualKey` |
| `src/scenes/TaskScene.ts`, `tests/e2e/support/hook.ts` | types widened; `render` throws `Unsupported input mode` for select/drag (remove in phases 7, 9) |
| `scripts/sample.ts` | prints `visual: …` line when a task has a drawing |
| `tests/visual.test.ts`, `tests/time.test.ts`, `tests/{generateTask,roundView,curriculumPick,validate,contentInvariants}.test.ts` | new/extended tests |

## 3. Verification

| Command | Result |
|---|---|
| RED (before implementation, stubs in place) | `AssertionError: expected '' to be '15.00'`; `expected 'TODO' to be ''`; `E1.2.compare_num_5: expected undefined to be 'tiles'`; `expected 'tiles' to be 'select'`; `expected 22 to be 2` (distinctTasks redraws); `expected [] to have a length of 1` (observed) |
| `npm test` | 1276 passed (baseline 1247, +29) (observed) |
| lint / typecheck / build | OK / OK / OK, `e2e hook: absent (2 chunks checked)` (observed) |
| `npm run sample -- E1..E6` | exit 0; E3 output identical before/after (md5) (observed); `git diff --stat tests/fixtures` empty |
| Deliberate breaks | uniqueness key = prompt only -> `distinctTasks` drawing test red; no `input` stamp -> generateTask mode test red; `visualKey` without minute -> visualKey test and distinctTasks test red; all restored. Meta-check: expectations come from the plan contract, not the implementation (observed) |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied); expected `37 passed` (baseline 37, +0) |

## 4. Next command

`/10x-tdd drawn-widget-tasks-e3-e4 phase 2`

## 5. Open

- Row 1.4 stays unticked until the orchestrator runs e2e (expect 37 passed); row 1.5 is [reviewer].
- Manual `[human]` rows and DESIGN-GAPs 52–58 as in the plan-review handoff (phases 4–10).
- `TaskScene.render` temporary throw for `select`/`drag` is removed in phases 7 and 9.
- ARTIFACT GAP: none.

## 6. Autonomous decisions

1. `Task.input` is optional on the type (hand-built test tasks) while `generateTask` always stamps it; `RoundView` falls back to the old tiles/keypad rule. Reverses if all hand-built tasks get `input`.
2. New violation rule `'visual'` added to `ViolationRule` for `validateVisual` results; `describeVisual` ruler line prints cm for `unit 'cm'`, mm for `'mm'`.
3. Scene typing: instead of widening every helper, `TaskScene.render` throws for select/drag right after `roundView`, so the rest stays typed `tiles|keypad` via narrowing; phases 7 and 9 widen properly.
