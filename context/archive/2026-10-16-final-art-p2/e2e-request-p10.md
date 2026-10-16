# E2E request, phase 10 (final-art-p2): orchestrator run

Chromium cannot start in the phase agent session (MachPortRendezvous ... Permission denied, 3 plain tries). Nothing is committed.
Uncommitted in the tree: `tests/e2e/final-art-wallet.spec.ts` (3 tests), `holdDrag` in `tests/e2e/support/hook.ts`
(named `holdDrag`, not `holdTouch`: that name is the existing room long press), `final-art-wallet` added to `ROUND_SPEC` in `playwright.config.ts`.
Verified without a browser: `npx tsc --noEmit` and ESLint on the three files clean; all three break patches `git apply --check` on this tree.

## Green runs (plain commands, outside the sandbox)

1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 final-art-wallet money-pay` -> expected 7 passed (3 new + 4 money-pay).
2. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4` -> expected 114 passed (111 + 3).

If a test is red on clean code, likely suspects: (b) `holdDrag` travel too short to lift (raise steps or distance) or lifted coin not published as
removed from `targets().coins.coins` mid-drag; (a) the seventh drag aim; (c) route not hit (serviceWorkers are blocked in the spec).

## Deliberate breaks (apply, run `... --workers=4 final-art-wallet`, `git apply -R`)

- `git apply context/changes/final-art-p2/e2e-break-p10a.patch` -> test (b) "lifting the first of two equal coins leaves its own place empty" RED (drawn cells keep cell 0, miss cell 1: `expect(drawn).toEqual(second)`); (a),(c) stay green.
- `git apply context/changes/final-art-p2/e2e-break-p10b.patch` -> test (c) "without the wallet picture the drawn wallet still pays" RED (`walletArt` 'art' instead of 'drawn' with the file aborted); (a),(b) green.
- `git apply context/changes/final-art-p2/e2e-break-p10c.patch` (`maxTotal` 6 -> 10) -> test (a) "six coins fill ... a seventh flies back" RED (`placed` length 7 not 6). Meta-check: (a) goes through real touch drags, so it proves the cap in the touch path.

After the green runs and breaks: commit `test(final-art-p2): MONEY_PAY with the six-place wallet by touch (p10)`, tick the phase 10 rows, kill ports 4397 and 4398.
