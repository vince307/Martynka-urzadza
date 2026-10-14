# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Phase 1 (tdd) done and committed as c84ece8. The next agent must not miss: phase 4 must make `canonicalInput` handle the clock via `reachableTimes` (it throws "no reachable set" until then), and phase 2 must add no-op `cells`/`grid`/`figure` cases to `TaskPicture`.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4` |
| Commits | c84ece8 (phase 1) on top of the plan-review commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | phase 1 automated rows 1.1-1.4 ticked; 1.5 `[reviewer]` open; phases 2-12 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/dragMode.ts` | `dragMode(task)`: clock / blocks from the drawing, throws otherwise |
| `src/core/round/canonicalInput.ts` | input the widget of the mode can produce (select reversed copy, blocks digits <= maxPerKind, clock throws until phase 4) |
| `src/core/round.ts`, `src/core/tasks/validate.ts` (rule `mode`, list answers subset of choices), `src/core/tasks/generateTask.ts` (skill id + cause), `src/scenes/TaskScene.ts` (uses `dragMode`) | production changes |
| `tests/solvableInMode.test.ts`, `tests/generateTask.test.ts` | new tests (per-skill solvability 20x50, dragMode, validator, select as set, skill id) |

## 3. Verification

| command | result |
|---|---|
| RED | 6 assertion failures first, e.g. `expected 'second' to be 'done'` (select [3,1] vs [1,3]), `expected 'ADD_SUB params.max must be an integer…' to contain 'E9.9.bad_params'`, `expected [] to include 'mode'` |
| lint / typecheck | OK / OK |
| unit | baseline 1927 + 150 = 2077 passed; deploy and ops scripts OK; `sample` E1-E6 exit 0, E3/E4 output identical to before |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | 57 passed (baseline 57 + 0), run in this session with the plain config-path command, 3.9 min; adaptive #13 passed (1.8 m) |
| Deliberate breaks | isCorrect back to `===` -> "select answer is a set" red; dragMode clock -> blocks -> "picks the clock branch" red; generateTask without skill id -> "wraps a parser error" red; all restored. Meta-check: break 1 does not turn the per-skill test red because no current select skill lacks `check`; the explicit select-set test is the guard |

## 4. Next command

`/10x-tdd drawn-grid-tasks-e3-e4 phase 2`

## 5. Open

- `[reviewer]` 1.5 open; later `[human]`/`[visual]`/`[reviewer]` rows as in the plan-review handoff.
- Known e2e load flake: adaptive.spec #13 under 6 workers (passed here).

## 6. Autonomous decisions

1. TDD gate: phase clearly testable, implementation absent -> TDD. The `TaskScene` branch switch is inline glue (no test; the scene is canvas-only), phase stays `Driver: tdd`.
2. `dragMode` violation rule named `mode` (new `ViolationRule`); rejected reusing `visual`. Would change: a consumer filtering rules by name.
3. `TaskScene` now gives `[]` kinds to a non-blocks drag and to non-drag tasks (tray unused there); rejected leaving the old default. Would change: BlockMat needing kinds when hidden.
4. `generateTask` attaches `cause` with `Object.assign` because the TS lib target lacks ErrorOptions.
5. Select canonical input is a reversed copy so order-insensitivity is exercised.
