# E2E request - phase 13 (daily puzzle)

Chromium cannot start in the phase session (MachPortRendezvousServer ... Permission denied, 3 plain tries). The spec is finished and NOT committed; the orchestrator runs the commands below outside the sandbox and commits.

Uncommitted files: `tests/e2e/daily-puzzle.spec.ts` (new, 3 tests), `playwright.config.ts` (`daily-puzzle` added to `ROUND_SPEC`), `e2e-break-p13a|b|c.patch` (this folder; production code only).
Verified without a browser: `tsc --noEmit`, `eslint` on the spec and config, all three patches pass `git apply --check` on the clean tree.

## Green run
- `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts tests/e2e/daily-puzzle.spec.ts` -> 3 passed (record the time; target < 90 s).
- Full suite `npx playwright test --config=... --workers=4` -> 71 passed (branch baseline 68 + 3; parent-settings #14 is a known load flake).

Spec: parent path, age "10+", stage "Klasa 2, II półrocze" (E4; proposal for age 10 is E6, so no warm-up), month 10, `?e2eVariant=puzzle&e2eDay=2026-10-14`. Watch if red on the first run:
- the first round is `variant.kind === 'puzzle'` with a non-null `puzzleId` (E4 has a pool; the day is fresh);
- (a) wrong tile/number -> phase `second`, stars unchanged; right -> +2 stars (counter too); after "Dalej" summary `earned === 2`, `bonusEarned 0`;
- (b)/(c) wait for `save` `{lastReason: 'now', dirty: false}` after "Dalej" (the round end flushes), then `page.goto` the same path (new session, same context = same IndexedDB). (b): `variant.kind` is not `puzzle`, `puzzleId` null, stars equal to before. (c): `e2eDay=2026-10-15` -> `puzzle` again, `puzzleId` different from the first (puzzlesDone holds the first).

## Breaks (each alone with -g, then restore with `git checkout <file>`, re-run green)
Test names: (a) `#11 the daily puzzle pays two stars`, (b) `#2 the same day after a reload`, (c) `#11 the next day brings the puzzle back`.
1. p13a: `git apply context/changes/minigame-daily-puzzle/e2e-break-p13a.patch` (`balance.variants.puzzleMultiplier` 2 -> 1, `src/data/balance.ts`). `-g "pays two stars"` -> RED at `expect.poll(stars).toBe(start.stars + 2)` (received start+1). Restore: `git checkout src/data/balance.ts`.
2. p13b: `git apply ...e2e-break-p13b.patch` (the autosaver snapshot writes the session's STARTING `variants`, `src/main.ts`). `-g "same day after a reload"` -> RED at `expect(after.variant?.kind).not.toBe('puzzle')` (the saved day is lost, the puzzle returns). Meta-check: it proves the save carries `variants` (the reload is a new session); the stars of the answer still dirty the save and `flush('now')` writes the whole snapshot, which is why `variants` is not simply left out of `SAVE_KEYS`. Test (c) is likely red too (the same puzzle may return). Restore: `git checkout src/main.ts`.
3. p13c: `git apply ...e2e-break-p13c.patch` (`pickPuzzle` ignores `puzzlesDone`, `src/core/variants.ts`). `-g "next day brings the puzzle back"` -> RED at `expect(next.variant?.puzzleId).not.toBe(first)` ONLY when the seeded draw lands on the same puzzle again; the rng seed per session may differ, so the red is probabilistic (pool size of E4 puzzles). If it stays green once, rerun it a few times (`--repeat-each=6`); if it never goes red the test cannot prove the rule and (c) should be reduced to "puzzle returns on the next day" with the "different" assertion dropped (tell the maintainer). Restore: `git checkout src/core/variants.ts`.
Unit tests also go red under these patches; only the e2e result matters here.

Commit message: `test(minigame-daily-puzzle): Zagadka dnia x2 raz dziennie - e2e (p13)`; tick 13.1-13.5 with the sha; then the epilogue: `change.md` status `implemented`.

## Result notes (orchestrator)
- p13c with `--repeat-each=6`: red only 1 of 6 (Expected not "floors-up"). The seeded draw rarely lands on the same puzzle, so the e2e cannot prove the `puzzlesDone` rule reliably. The same break turns 2 unit tests red every time (tests/variants.test.ts `pickPuzzle` "never repeats inside a cycle and restarts when all are done", "ignores unknown done ids"); that is where the rule is proven. p13c.patch is kept as evidence.
- p13d (added by the orchestrator, `e2e-break-p13d.patch`): `nextRoundKind` gives a puzzle only when `puzzleDay === null`, i.e. never again after the first day. `-g "next day brings the puzzle back"` -> red `toBe` Expected "puzzle", Received "word". Deterministic proof of that test's main claim. Restored.
