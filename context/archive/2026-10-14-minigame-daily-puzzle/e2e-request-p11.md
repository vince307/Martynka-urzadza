# E2E request - phase 11 (save-migration)

Chromium cannot start in the phase session (MachPortRendezvousServer ... Permission denied, 3 plain tries with --workers=4). The spec is finished and NOT committed; the orchestrator runs the commands below outside the sandbox and commits.

Uncommitted files: `tests/e2e/save-migration.spec.ts` (new), `playwright.config.ts` (`save-migration` added to `ROUND_SPEC`), `e2e-break-p11a.patch`, `e2e-break-p11b.patch` (in this folder).

Verified without a browser: `tsc --noEmit`, `eslint` on the spec and config, `npm run lint`, `npm test` (2322 passed), `npm run build` ("e2e hook: absent (2 chunks checked)"), both patches pass `git apply --check` on the clean tree. Playwright's webServer builds (prod + hook) completed before Chromium failed.

## Green run
- `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts tests/e2e/save-migration.spec.ts` -> 2 passed.
- Full suite `npx playwright test --config=... --workers=4` -> 65 passed (baseline 63 + 2).

Spec uses `/?e2eSave=v1&e2eMonth=10&e2eVariant=off` (v1 fixture in the in-memory store, no welcome screen). Things to watch if red on the first run: `pendingUnlock` equals fixture step 3 (session learner stores a number); `learner.mastery` equals the fixture mastery (calendar floor changes only `unlockedStep`, which is not compared).

## Breaks (each run alone, tree restored with `git checkout src/core/save.ts src/core/autosave.ts` after)
Names: (a) `#10 a v1 save loads in the v2 build ...`, (b) `#2 after a round the migrated save is written as v2 ...`.

1. `git apply context/changes/minigame-daily-puzzle/e2e-break-p11a.patch` (MIGRATIONS[1] sets stars: 0)
   `npx playwright test --config=... tests/e2e/save-migration.spec.ts -g "#10 a v1 save loads"` -> RED at `expect(loaded.stars).toBe(7)` (received 0). Test (b) may also go red (its `stars > 7` check); that is fine. Meta-check: the red proves store -> decoder/migration -> registry -> drawn counter.
2. `git apply context/changes/minigame-daily-puzzle/e2e-break-p11b.patch` (autosaver never takes the v1 backup)
   `npx playwright test --config=... tests/e2e/save-migration.spec.ts -g "#2 after a round"` -> RED at `expect(store.ops.slice(0, 2)).toEqual(['backup', 'write'])` (received `['write', 'write']` or `['write']`). Test (a) stays green.

After each red run, restore and re-run green. Commit message: `test(minigame-daily-puzzle): Zapis v1 wczytany przez build v2 - e2e (p11)`; tick 11.1-11.4 with the sha; commit the patches only if the project keeps them (earlier phases: check git log; otherwise delete them).
