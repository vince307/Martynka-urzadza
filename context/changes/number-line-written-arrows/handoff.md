# Handoff — `number-line-written-arrows` (slice S-14b)

Phase 3 (tdd) is committed (`a7e3025`): the `arrows` drawing, generator ARROW_TABLE, `line` option of SEQUENCE and the `jumps` variant of MULT_GROUPS. No curriculum skill uses any of them yet (data in phases 5/6/8); `TaskPicture` still throws for `column`, `numberLine`, `arrows` until phases 5/7.

## 1. State

| | |
|---|---|
| Branch | `feat/number-line-written-arrows`, from `main` at `882cd93` |
| Commits | plan commits + `cfea708` (p1) + `f852b48` (p2) + `a7e3025` (p3) + this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` | 1.1-1.4, 2.1-2.4, 3.1-3.3 ticked; open: 1.5, 2.5, 3.5 [reviewer], 3.4 (e2e part, orchestrator) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/visual.ts` | `arrows` kind (graph / table): key, `validateVisual` (one empty field, rule, 0..20, 3-4 rows), `describeVisual` |
| `src/core/tasks/generators/arrowTable.ts` | `generateArrowTable`, `parseArrowTableParams` `{variants, max, n}`; registered |
| `src/core/tasks/generators/sequence.ts` | `line: true` param (needs `start: 'multiple'`, ticks within `maxTicks`); drawing with terms as labels, gap as box |
| `src/core/tasks/generators/multGroups.ts` | variant `jumps`: line 0..g*k, tick 1, labels every 5, g arcs of length k, tile answer |
| `src/data/pl.ts`, `src/data/balance.ts` | `tasks.arrow*`, `multGroupsJumps*`; `balance.arrows` `{maxValue 20, tableMin 3, tableMax 4}` |
| `tests/arrowTable.test.ts` (new), `visual`, `sequence`, `multGroups` tests | 24 new tests |

## 3. Verification

| Command | Result |
|---|---|
| RED (stubs first) | `expected function to throw an error, but it didn't` (arrow params and 11 visual rejections), `no arrows drawing ... prompt=""`, `no number line ... prompt="Które działanie pokazuje obrazek?"` |
| lint, typecheck | OK |
| unit `npm test` | baseline 2362 + 24 = 2386 passed; deploy tests OK |
| sample E1-E6 | exit 0; E2 and E3 output identical to before (compared) |
| build | OK (e2e hook absent) |
| deliberate breaks | table with two empty outputs, SEQUENCE labels include the gap, jumps with k+1 -> 5 tests red; restored. Meta-check: rule recomputed in the test from the drawing, not from hint lines |
| e2e | not runnable in this session - orchestrator gate (a plain `--workers=4` run: Chromium did not start, 30 did not run). Expected 71 + 0. Row 2.4 ticked from the orchestrator note |

## 4. Next command

`/10x-tdd number-line-written-arrows phase 4` (Driver: tdd)

## 5. Open

- Row 3.4 e2e part (orchestrator); 1.5, 2.5, 3.5 [reviewer].
- Teacher read (6 per variant): rule lines "Reguła strzałki: dodaj 6 do liczby." (no result), then "5 + 6 = 11"; graphIn "Wracamy pod strzałkę: odejmij 6 od liczby." then "11 − 6 = 5"; jumps "Skoków: 4. Każdy ma długość 3." then "4 · 3 = 12". When the step equals the answer, `firstHint` withholds the rule line (existing rule, accepted). Table n is capped so 3 inputs fit.
- Existing `tests/sequence.test.ts` defaults check now includes `line: false`.
- Number-line leak rule still covers only `visual`; phase 4 extends it to `hintVisual`. `TASK_LAYOUT.picture.digits` and DESIGN-GAP rows from 88 are due in phase 9.

## 6. Autonomous decisions

1. Mixed phase: TDD of arrows validation, generator, SEQUENCE line and jumps; `pl.ts` strings, `balance.arrows` and the throwing `case 'arrows'` in `TaskPicture` were inline scaffolding. Driver stays `tdd`.
2. Rule line wording avoids ending in a number so `firstHint` does not treat it as the result.
3. SEQUENCE line: tick = the chosen step, `to` = largest multiple of it within `max`; `line` with `start: 'any'` or too many ticks is rejected by the parser.
4. Arrow values: validator reads the empty field from its pair (derived by the rule) and checks 0..`balance.arrows.maxValue`.
5. Commit message `test(number-line-written-arrows): Rysunek arrows, generator ARROW_TABLE, oś w SEQUENCE i skoki MULT_GROUPS (p3)`.
