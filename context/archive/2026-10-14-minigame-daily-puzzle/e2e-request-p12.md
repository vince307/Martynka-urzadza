# E2E request - phase 12 (minigames)

Chromium cannot start in the phase session (MachPortRendezvousServer ... Permission denied, 3 plain tries with --workers=4). The spec is finished and NOT committed; the orchestrator runs the commands below outside the sandbox and commits.

Uncommitted files: `tests/e2e/minigames.spec.ts` (new, 3 tests), `tests/e2e/support/hook.ts` (types only: `Snapshot.variant`, `Targets.doneNext/doneRoom`), `playwright.config.ts` (`minigames` added to `ROUND_SPEC`), `e2e-break-p12a|b|c.patch` (this folder).

Verified without a browser: `tsc --noEmit`, `eslint` on the spec, hook.ts and config, all three patches pass `git apply --check` on the clean tree, patches touch only production code.

## Green run
- `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts tests/e2e/minigames.spec.ts` -> 3 passed (record the time; target < 90 s).
- Full suite `npx playwright test --config=... --workers=4` -> 68 passed (baseline 65 + 3).

Spec starts on E1 through the parent path (age 6, "Klasa 1, I półrocze"), month pinned. Watch if red on the first run:
- (a) the unlock card between rounds is handled (`unlock` -> `unlockNext`); the 4th round is expected `word` (word is chosen first when `lastMinigame` is unset and E1 has no puzzle pool).
- (b) word length is read from `variant.letters.length`; first task: wrong tile -> phase `second`, letters still hidden, stars unchanged; right -> 1 letter, +1 star; end: `summary.earned === length`, `bonusEarned 0`, `screen` stays `summary`, `targets.doneNext/doneRoom` non-null.
- (c) `?e2eVariant=dice` makes every round a dice round, so after `doneNext` the new round is a fresh dice round with `covered []` (not an ordinary round). 13 throws, tiles are the board fields; `answerRight` taps the tile whose value equals the answer.

## Breaks (each alone, then `git checkout` the file and re-run green)
Test names: (a) `#11 after three ordinary rounds`, (b) `#11 Hasło reveals`, (c) `#11 Zakrywanka covers`.
1. p12a: `git apply context/changes/minigame-daily-puzzle/e2e-break-p12a.patch` (afterRound no longer counts ordinary rounds, `src/core/variants.ts`). `npx playwright test --config=... tests/e2e/minigames.spec.ts -g "after three ordinary rounds"` -> RED at `expect(fourth.variant?.kind).toBe('word')` (received undefined/null). Restore: `git checkout src/core/variants.ts`.
2. p12b: `git apply ...e2e-break-p12b.patch` (a letter uncovers only for first-try outcomes, `src/core/minigames/word.ts`). `-g "Hasło reveals"` -> RED at `await expect.poll(revealedCount).toBe(1)` (stays 0 after the second-try right answer). Meta-check: the rule broken is "one letter per finished task", copy and selectors untouched. Restore: `git checkout src/core/minigames/word.ts`.
3. p12c: `git apply ...e2e-break-p12c.patch` (the board's touch zones sit one field to the right of the drawn fields, `src/ui/widgets/CoverBoard.ts`). `-g "Zakrywanka covers"` -> RED at the first `covered` poll (a tap at the hook's target hits no/another zone: phase goes `second`, nothing covered). Meta-check: the hook targets come from the widget's cells, the tap goes through the zones, so the red proves the real input path (lesson S-13 F1). Restore: `git checkout src/ui/widgets/CoverBoard.ts`.
Unit tests also go red under these patches; only the e2e result matters here.

Commit message: `test(minigame-daily-puzzle): Minigry dotykiem - e2e (p12)`; tick 12.1-12.5 with the sha; keep or delete the patches as in p11.
