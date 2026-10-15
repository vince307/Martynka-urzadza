# E2E request — phase 10 (text-measure-time-types)

Chromium did not launch in the phase session (3 plain tries with `--workers=4`: `MachPortRendezvousServer ... Permission denied`).
Spec finished, NOT committed. Uncommitted files: `tests/e2e/inequality.spec.ts` (new), `playwright.config.ts` (`inequality` added to `ROUND_SPEC`), the two patches below, this file.
Verified without a browser: `npm run lint` OK, `npm run typecheck` OK, both patches pass `git apply --check` on a clean tree.

## Green runs (expected)
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 tests/e2e/inequality.spec.ts` -> 2 passed (project chromium-hook).
2. Full suite `npx playwright test --workers=4` -> 84 passed (baseline 82 + 2).

## Breaks (apply on a clean tree, run the named test alone, then `git apply -R` / `git checkout` the production file)
- p10a: `git apply context/changes/text-measure-time-types/e2e-break-p10a.patch` (TaskScene paints `task.answer`, not the tapped tile)
  `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 -g "takes a right tile that is not the model answer"`
  Expected RED: `expect(done.markedTile).toBe(other)` (received the model answer). The wrong-tile test stays green. Proves the scene, not `isCorrect`.
- p10b: `git apply context/changes/text-measure-time-types/e2e-break-p10b.patch` (`isCorrect` ignores `check`, uses `===`)
  same `-g` command. Expected RED: tapping the non-canonical right tile gives phase `second` (not `done`): `phaseIs(page, 'done')` poll fails / outcome 'second'. The "wrong tile" test stays green.
Each break must also be run once with the other test (`-g "wrong inequality tile"`) to confirm it stays green.
After the breaks: `git status --short` must show only the uncommitted files above; then commit `test(text-measure-time-types): Nierownosc z kilkoma dobrymi kafelkami dotykiem (p10)` and tick rows 10.1-10.4.
