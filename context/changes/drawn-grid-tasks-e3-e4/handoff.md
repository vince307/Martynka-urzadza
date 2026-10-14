# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Phase 6 (impl) done and committed as ab1fa91. Figures with labelled sides are drawn in the round and E4.7 has the perimeter skills. Rows 6.5 (e2e) and the `[reviewer]`/`[visual]` rows 6.6, 6.7 are open.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4` |
| Commits | ab1fa91 (phase 6) on c01c12e (p5) on e69e6e8 (p4) on 3cb42cc (p3) on 2166514 (p2) on c84ece8 (p1) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 6.5 (e2e), 6.6 `[reviewer]`, 6.7 `[visual]`; 5.6, 5.7, 4.4, 3.5, 2.5, 1.5 open; phases 7-12 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/round/figureLayout.ts` | pure `figureLayout(figure, rect, look)`: polygon points, side labels at edge middles on the outer side, cell size, lattice bounds |
| `src/ui/widgets/FigureGrid.ts` | draws outline, lattice and labels from `figureLayout`; `shown()`, `labels()`, `bounds()` |
| `src/ui/widgets/TaskPicture.ts` | `figure` branch now draws (and is in `drawn`) |
| `src/data/layout.ts` | `TASK_LAYOUT.figure` (line, grid, labelPad, fontSize 30, maxCell 64, minCell 36), font `sideLabel` (DESIGN-GAP rows 75, 76 to be written in phase 10) |
| `src/data/pl.ts` | `tasks.sideLabel(cm)` = "N cm" |
| `src/data/curriculum/E4.ts` | E4.7 + `perimeter_rect`, `perimeter_triangle` (keypad, max 60); childName "Metry, litry i obwody" |
| `tests/figureLayout.test.ts`, `tests/perimeterSkills.test.ts` (new) | label places inside/outside, font pin, lattice cell >= 36; E4.7 has 6 skills, threshold 3 |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| unit | branch baseline 2172 + 23 = 2195 passed; deploy and ops scripts OK; `sample` E1-E6 exit 0 |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied, 3 plain tries); expected branch baseline 57 + 0. Row 5.5 ticked from the orchestrator note (57 passed on c01c12e) |
| Deliberate break | `figureLayout` made to ignore `sides` (all labels null) -> `tests/figureLayout.test.ts` 6 failed ("expected [] to have a length of 4 but got +0"); restored, 14 passed. Meta-check: red is the missing-labels rule itself |
| Teacher read (`sample -- E4 --count 6`, E4.7 perimeter_*) | prompts one sentence, "obwód prostokąta/kwadratu/trójkąta w centymetrach"; hint[0] "Obwód to suma długości wszystkich boków." gives no result; hint[1] is the sum with the total (a solution step); rectangle sides up to 2:1 drawn; triangle sides satisfy the triangle inequality; no new nouns |

## 4. Next command

`/10x-implement drawn-grid-tasks-e3-e4 phase 7`

## 5. Open

- 6.5 e2e (orchestrator: 57 + 0), 6.6 `[reviewer]`, 6.7 `[visual]` (768 x 190 solution strip: with 8 x 4 units the unit is about 30 px; labels 30 px font), earlier 5.6, 5.7, 4.4, 3.5, 2.5, 1.5.
- `docs/design-gaps.md` rows 73-76 are referenced from comments; phase 10 writes them.
- Lattice (composite) figures at 7 rows cannot reach cell >= 36 in the 768 x 190 strip; the test pins it for 5 x 4. Phase 9 (E6.3) must give composite a taller rect (plan: "tall drawing beside the keypad") or accept a smaller cell.
- No `playableSteps` or fixture change (E4.7 already playable).

## 6. Autonomous decisions

1. Free (non-lattice) figures are fitted uniformly with margins for the labels (pad + widest label, pad + font height); the minimum cell of 36 px is guaranteed only for lattice figures that fit. Would change: a visual-gate verdict that triangles are too small in the strip.
2. Label width is estimated (`textWidth` 0.62 x font x chars) because core cannot measure text.
3. childName shipped as planned ("Metry, litry i obwody").
