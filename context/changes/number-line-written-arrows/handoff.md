# Handoff — `number-line-written-arrows` (slice S-14b)

Phase 5 (impl) is committed (`99cc307`): widgets `NumberLine` and `ArrowGraph`, data E2.6 / E2.7 / E3.9. E2E was NOT run in this session (Chromium cannot start): the orchestrator must run the full suite before rows 5.1 and 5.5 are ticked.

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, from `main` at `882cd93` |
| Commits | plan commits + p1 `cfea708` + p2 `f852b48` + p3 `a7e3025` + p4 `88f71d7` + p5 `99cc307` + this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` | 1.1-1.4, 2.1-2.4, 3.1-3.4, 4.1-4.4, 5.2-5.4 ticked; open: 1.5, 2.5, 3.5, 4.5 [reviewer], 5.1 (e2e part), 5.5 (e2e), 5.6 [reviewer], 5.7 [visual] |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/NumberLine.ts` (new) | axis with arrowhead, ticks, labels, arcs with "+k"/"−k", gold start dots, dashed box on a tick; `render(line, rect)` takes the `numberLine` fields (phase 6 reuses it for the hint line) |
| `src/ui/widgets/ArrowGraph.ts` (new) | graph (disc - arrow with rule - disc) and table (inputs over outputs, rule on a down arrow at the left); empty field dashed with "?" |
| `src/ui/widgets/dashed.ts` (new) | `dashedRect` helper |
| `src/ui/widgets/TaskPicture.ts` | `numberLine` and `arrows` cases now render widgets; `column` still throws (phase 7) |
| `src/data/layout.ts` | `TASK_LAYOUT.numberLine`, `TASK_LAYOUT.arrows`, font roles `lineLabel`, `lineJump`, `arrowRule` |
| `src/data/curriculum/E2.ts`, `E3.ts` | E2.6 `arrow_graph_20` (graphOut/graphIn, n 1-9) and `arrow_table_20` (table, n 1-6), childName "Sprawdzanie i grafy" (28-char limit; plan said "…odejmowania i grafy", 31 chars); E2.7 `sequence_tens_100` + `line: true`; E3.9 `mult_groups_jumps` (tiles) |
| `tests/curriculum.test.ts` | ARROW_TABLE moved from LATER to GROUP_1 |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| unit `npm test` | baseline 2403 + 12 (new skill draws and name tests from the new data) = 2415 passed; deploy and ops tests OK |
| sample E1-E6 | all exit 0; teacher read below |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| deliberate break | removed the `arrows` case from `TaskPicture` -> typecheck red (`not assignable to type 'never'`, exhaustive default); restored. Meta-check: the red comes from the real union exhaustiveness, so it proves the case is required |
| fixtures | `tests/fixtures/` unchanged; `art-tasks.spec.ts` unchanged |
| e2e | not runnable in this session — orchestrator gate (MachPortRendezvous Permission denied); expected baseline 71 + 0. Specs that may now meet the new tasks (E2/E3 rounds): `adaptive.spec`, `first-launch.spec` (E3 warm-up), `narrator.spec` (E3 round), `task-round.spec`, `parent-settings.spec`, `minigames.spec`, `daily-puzzle.spec`, room specs that play rounds. E2.6 arrows are keypad tasks, E3.9 jumps are tiles, E2.7 sequence stays keypad with a picture beside it |

## 4. Next command

`/10x-implement number-line-written-arrows phase 6` (Driver: impl)

## 5. Open

- Rows 1.5, 2.5, 3.5, 4.5, 5.6 [reviewer]; 5.7 [visual] (screenshots 1440x900 and 1024x768 of the seven pictures listed in the plan); 5.1 and 5.5 need the orchestrator's e2e run.
- The widgets were never rendered in a browser here: geometry (own units in `TASK_LAYOUT.numberLine` / `arrows`) is untested visually; the visual gate decides tweaks (arc height, 31-tick density, table rule column).
- DESIGN-GAP rows due in phase 9: number line 0-100 with box, jumps > 1 and the arc label, dashed box on a tick, arrow graph, rule table (comments are in the widget files).
- Teacher read (`npm run sample -- E2 --count 6`, `-- E3 --count 6`): E2.6 graph "Uzupełnij graf." with rule hint "Reguła strzałki: dodaj 3 do liczby." then "7 + 3 = 10"; graphIn "Wracamy pod strzałkę: odejmij 1 od liczby." then "3 − 1 = 2"; table "Uzupełnij tabelkę."; values stay 0-20, one empty field. E2.7 sequences on tens with the axis 0-100 (labels the shown terms, box the gap). E3.9 jumps "Które działanie pokazują skoki?" with tiles "5 · 6" and near distractors (5 · 7, 5 + 6), hint "Skoków: 5. Każdy ma długość 6." Hint last line gives the result, the first does not (project pattern). No new nouns. Remark: the two ARROW graphOut/graphIn prompts are the same sentence "Uzupełnij graf."; acceptable because the picture shows which field is empty.
- Unlock thresholds changed as planned: E2.6 1 -> 3 skills (threshold 1 -> 2), E3.9 4 -> 5 (2 -> 3); E2.7 unchanged.

## 6. Autonomous decisions

1. Executed in this context, no subagent (no human to choose).
2. childName "Sprawdzanie i grafy" instead of the plan's text because `tests/curriculum.test.ts` caps child names at 28 characters; the cap stays.
3. ARROW_TABLE added to GROUP_1 of the curriculum test (plan: "ARROW_TABLE z LATER"): now E2.6 must keep a skill of that type.
4. `NumberLine.render` takes the `numberLine` fields (Pick) so phase 6 can draw the hint line from `hintVisual` without a wrapper.
5. Arc label is skipped when the arc is narrower than `minLabelSpan` (k = 1 jumps on a dense line) to avoid overlap; dense spacing (30 units) from 12 ticks.
6. Commit message `feat(number-line-written-arrows): Widżety NumberLine i ArrowGraph, dane E2.6, E2.7, E3.9 (p5)`.
