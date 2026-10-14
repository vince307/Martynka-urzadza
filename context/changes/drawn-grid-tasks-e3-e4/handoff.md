# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Phase 5 (impl) done and committed as c01c12e. The magic square, pyramid and coordinate grid are drawn in the round and E3.5 / E3.7 have the new skills. Row 5.5 (e2e) and the `[reviewer]`/`[visual]` rows 5.6, 5.7 are open.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4` |
| Commits | c01c12e (phase 5) on e69e6e8 (p4) on 3cb42cc (p3) on 2166514 (p2) on c84ece8 (p1) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 5.5 (e2e), 5.6 `[reviewer]`, 5.7 `[visual]`; 4.4, 3.5, 2.5, 1.5 `[reviewer]` open; phases 6-12 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/NumberCells.ts` | magic square / pyramid (`cellPositions`), empty cell dashed with "?"; `shown()`/`bounds()` |
| `src/ui/widgets/CoordGrid.ts` | grid with column letters and row numbers, five shapes drawn in code (`starPoints`); `shown()`/`bounds()` |
| `src/ui/widgets/TaskPicture.ts` | `cells` and `grid` branches (figure still a placeholder for phase 6); both widgets in `drawn` so `bounds()` works for the hook |
| `src/data/layout.ts` | `TASK_LAYOUT.cells`, `TASK_LAYOUT.coord`, fonts `cellValue`, `gridLabel` (DESIGN-GAP rows 73, 74 to be written in phase 10) |
| `src/data/curriculum/E3.ts` | E3.5 + `magic_square_30`, `pyramid_30`; E3.7 + `grid_where`, `grid_what`; childNames "Kwadrat magiczny i odcinki", "Siatka i liczby słowami" |
| `src/data/pl.ts`, `src/core/tasks/generators/grid.ts` | `gridWhatSpeak` (letter names "ce 3"), set as `speak` of the `what` variant |
| `tests/gridSkills.test.ts` (new) | pins E3.5 (3 skills, threshold 2) and E3.7 (5 skills, grid on tiles, threshold 3) |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| unit | branch baseline 2153 + 19 = 2172 passed (3 new + per-skill generated tests); deploy and ops scripts OK; `sample` E1-E6 exit 0 |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium launch failed, plain command); expected branch baseline 57 + 0 |
| Deliberate break | `case 'cells'` removed from `TaskPicture` -> typecheck "TS2322 ... kind: "cells" ... is not assignable to type 'never'"; restored. Meta-check: the red is the exhaustive `never`, not a copy of a message |
| Fixes found by the suite | `childName` limit 28 chars (plan text "Siatka, parzyste i liczby słowami" is 33) -> "Siatka i liczby słowami"; `tests/spoken.test.ts` Roman-token rule failed on "Co leży na polu D1?" -> `speak` with letter names |
| Teacher read (`sample -- E3 --count 6`, E3.5 new, E3.7 new) | prompts agree and are 1 sentence; magic hints give the line sum, then subtraction, answer only in the last step; pyramid hint[1] for a base-cell question names the rule; grid tiles A3/3A render as plain text; "leży kwadrat/koło/serce/gwiazdka" correct. Phase 3 points: `where` hint[1] "Pole A3: ..." names the answer cell in step 2 (it is a solution step, shown after the second miss; acceptable, `[reviewer]` may still object); `what` hint[1] repeats the cell from the prompt (harmless); "3A" distractor is plain text |

## 4. Next command

`/10x-implement drawn-grid-tasks-e3-e4 phase 6`

## 5. Open

- 5.5 e2e (orchestrator: 57 + 0; E3 round pool now contains grid tasks, `adaptive.spec` plays E3 rounds on tiles/keypad so it should be unaffected, check its time), 5.6, 5.7, 4.4, 3.5, 2.5, 1.5.
- `docs/design-gaps.md` rows 73 (number cells) and 74 (grid marks, 5 x 4 not 8 x 5) are referenced from comments; phase 10 writes them. `layout.ts` also still has the `clockSet` gap comment.
- `figure` draws nothing yet (phase 6); the picture rectangle for `cells`/`grid` is the normal one (tiles/keypad solution phase scaling to be looked at in the visual gate: the cell size must stay >= 36 px at 768 x 190 only for PERIMETER, phase 6).
- Plan table says E3.7 childName "Siatka, parzyste i liczby słowami"; shipped "Siatka i liczby słowami" (limit 28).

## 6. Autonomous decisions

1. Cell and grid sizes are own-unit constants in `layout.ts` (cell 96, grid cell 76, max scale 1.5); the empty cell is butter-yellow with a dashed teal frame and "?" so it differs by geometry and colour.
2. Heart/star/triangle drawn with `fillPoints` from `Phaser.Math.Vector2` (widgets import Phaser values; core stays free of it).
3. Speech for the `what` variant uses Polish letter names through `speak` rather than weakening the Roman-numeral test. Would change: a tablet test where the voice reads "C2" well anyway.
4. No `playableSteps` or fixture change; the E3.5/E3.7 steps were already playable.
