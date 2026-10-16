# e2e request, phase 10 (final-sound) - Chromium could not launch in the phase agent (MachPortRendezvous ... Permission denied)

Uncommitted in the tree: `tests/e2e/final-sound-failure.spec.ts` (new), `tests/e2e/seed.spec.ts` (sound requests/offline block),
`playwright.config.ts` (`final-sound-failure` in `ROUND_SPEC`). Patches here: `e2e-break-p10a|b|c.patch` (each `git apply`, run, `git checkout <file>`).

## Green run (orchestrator)
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 final-sound-failure seed` -> 3 passed
   (this passed once in the phase agent before the launcher started failing).
2. Full `--workers=4` -> baseline 107 + 2 = 109 passed (the seed test gained assertions, no new test).

## Breaks (each must turn red; restore with `git checkout` of the touched file)
- p10a (`src/core/errorSignal.ts`, no `EncodingError` in `QUIET_REJECTIONS`): spec (a) red. VERIFIED in the phase agent: the restart card
  appeared (alertdialog "Zacznij od nowa" in the error context) and `passWelcome` failed at `openWelcome` (`screen` undefined, hook stopped). Seed/(b) not affected.
- p10b (`src/scenes/loaderCut.ts`, `return [];` before `const waiting`): spec (b) red - NOT RUN. Expected: `expect.poll(screen).toBe('welcome')` times out at 15 s (load never cut).
- p10c (`vite/config.shared.mjs`, globPatterns without `ogg,m4a`): seed red - NOT RUN. Expected: the sound requests are not all in `servedBySw`
  (the final `expect.poll(...).toEqual([])` lists `/assets/sounds/...`), or the offline reload fails before. Needs `npm run build` re-run (the webServer does it; stop stale servers on 4397/4398 first).

## Verified without a browser
lint and typecheck green; patches apply cleanly. Remaining after the green run + breaks: tick 10.1-10.5, set change.md `implemented`, handoff, commit
`test(final-sound): ... (p10)` by explicit path (spec, seed, config, three p10 patches; drop this request file).
