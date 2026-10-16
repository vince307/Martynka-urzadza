# e2e request, phase 9 (final-art-p2): needs an orchestrator run

Chromium cannot launch in the agent session (MachPortRendezvous ... Permission denied, 4 plain tries). Nothing is committed.
Uncommitted in the working tree: `tests/e2e/final-art-loading.spec.ts` (2 tests, lint and tsc clean) and `final-art-loading`
added to `ROUND_SPEC` in `playwright.config.ts`.

## Green run
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 final-art-loading` -> 2 passed (project chromium-hook).
2. Full `npx playwright test --config=... --workers=4` -> 111 passed (109 + 2).
If (b) is slow: it waits up to 15 s polls for the 3 s boot cut (`?e2eArt=stallall`).

## Breaks (each run alone with `-g`; restore with `git checkout src/scenes/BootScene.ts`)
- p9a: `git apply context/changes/final-art-p2/e2e-break-p9a.patch` (BootScene no longer listens to the loading-art `filecomplete`, so the screen never gets the pictures). Run `... final-art-loading -g "shows the background and the emblem"` -> expected red: `loading.art` poll ends with `{background:false, emblem:false}` instead of both true.
- p9b: `git apply context/changes/final-art-p2/e2e-break-p9b.patch` (loading art queued after the total limit, outside the cut). Run `... final-art-loading -g "never answer"` -> expected red in test (b): the loading art / `bootLoad.creates` / welcome expectation fails (start blocked or art queued late). If it stays green, the break is wrong: report it.

## Verified without a browser
eslint and `tsc --noEmit` clean; both patches pass `git apply --check`; selectors use the hook snapshot fields `loading.art`, `loading.phase`, `bootLoad.creates` from `src/testing/e2eHook.ts`.
