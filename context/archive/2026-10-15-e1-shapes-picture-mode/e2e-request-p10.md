# E2E request, phase 10 (picture tasks by touch, risk #11)

Chromium cannot start in the phase session (MachPortRendezvous, 3 plain tries with `--workers=4`). The spec is finished and NOT committed.

Files (uncommitted): `tests/e2e/picture-tasks.spec.ts` (3 tests), `playwright.config.ts` (`picture-tasks` added to `ROUND_SPEC`), the two patches below.
Verified without a browser: eslint on both files, `npx tsc --noEmit`, `git apply --check` of both patches.

## Green run
- `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 picture-tasks` -> expect 3 passed (project chromium-hook).
- Full suite `npx playwright test --workers=4` -> expect 86 + 3 = 89 passed.

Tests (each can run alone with -g):
- (a) `-g "shape tile drawn as a figure"`: E1.1.shapes_pick/pattern alternate; wrong tile -> phase `second`, right tile -> `done`, outcome `second`, 1 star; then 4 tasks right; the round saw `visual.kind === 'pattern'`.
- (b) `-g "select all circles"`: E1.1.shapes_all (select) + compare_qty_10 (tiles), 5 right on the first try, summary `earned: 7, bonus: 2`.
- (c) `-g "which one in the row"`: E1.2.ordinal_5 + E1.3.choose_op_picture_5 on tiles; drawings `row` and `icons` both seen, summary reached.

## Breaks (apply on a clean tree, run only the named test, expect RED, then `git apply -R`)
1. `git apply context/changes/e1-shapes-picture-mode/e2e-break-p10a.patch` (AnswerTiles: the touch zone of a face tile sits 700 px below its drawing)
   `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 picture-tasks -g "shape tile drawn as a figure"`
   Expected red: `phaseIs(page, 'second')` after `answerWrong` times out (the tap on the drawn figure never reaches a zone). Tests (b) and (c) stay green (their tiles are numbers or a select).
2. `git apply context/changes/e1-shapes-picture-mode/e2e-break-p10b.patch` (SelectTiles: a face tile does not toggle)
   `... picture-tasks -g "select all circles"`
   Expected red: `phaseIs(page, 'done')` times out inside `playRight` for the shapes_all task (OK with nothing marked is a miss, outcome is not `first`: `expect(outcomes[0]).toBe('first')` or the phase wait fails). Tests (a) and (c) stay green.
After each: `git apply -R <patch>` and `git status --short` shows only the spec, config and request files.

## After green
Tick 10.1-10.4 citing the run, commit `test(e1-shapes-picture-mode): Zadania z obrazkami dotykiem, e2e (p10)` with the spec and `playwright.config.ts` (and the plan), then write the handoff.
