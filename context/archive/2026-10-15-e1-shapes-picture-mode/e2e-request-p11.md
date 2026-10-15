# E2E request — phase 11 (money-pay), orchestrator run needed

Chromium cannot launch in the phase session (3 plain tries, `--workers=4`: MachPortRendezvousServer Permission denied). Spec finished, NOT committed.

Files (uncommitted): `tests/e2e/money-pay.spec.ts` (new), `playwright.config.ts` (`money-pay` added to `ROUND_SPEC`).
Verified without a browser: `npm run lint`, `npm run typecheck`, `npm test` (2832 passed, +0), all three patches `git apply --check` clean.

## Green run
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=1 money-pay` -> expect 4 passed (project chromium-hook, target < 90 s).
2. Full suite `npx playwright test --config=... --workers=4` -> expect 89 + 4 = 93 passed; record the time.

Tests (each can run alone with `-g`):
- `coins dragged into the wallet pay the amount and earn a star` (a)
- `a wallet with too many coins in the fewest-coins task gives a hint, a retype pays no star` (b)
- `a cancelled drag places no coin and a tap on a wallet coin takes it out` (c)
- `the 10 zł note is part of the E2 tray and pays like a coin` (d)

Things to watch on the first browser run (not provable here):
- After a wrong wallet the scene does NOT clear the wallet (`submit` resets only `dragState`; plan row 8.7 "zły portfel z podpowiedzią" shows it stays). Test (b) therefore taps the coins out via `targets.coins.coins[0]` before the next payment. If the wallet is in fact cleared, `left` is 0 and the loops are skipped, still green. If it is a bug, say so in the review (the generic `answerRight` helper assumes an empty wallet).
- (b) and (d) play other tasks right until the wanted kind (fewest / answer with a 10 zł note) appears (up to 40 tasks, across rounds). Expected 1-3 extra tasks.
- (c) assumes tray tile `coin-2zl` and `coin-5zl` exist in the E1.11 tray.

## Deliberate breaks (apply, run ONLY the named test with -g and `--workers=1`, then `git apply -R`)
Port 4397/4398 servers must be free so the hook build is rebuilt with the break.

| Patch | Break | Command | Expected red |
|---|---|---|---|
| `e2e-break-p11a.patch` | scene publishes `dragMode: 'blocks'` for a coin task, so `answerRight` takes the `buildOnMat` branch | `... money-pay -g "coins dragged into the wallet"` | `expect(drag?.mat).toBeTruthy()` in `buildOnMat` (Received undefined), in well under 30 s, not a test timeout; only (a) must be red among the tests using `answerRight` on E1 coin tasks (b, d also use answerRight and may go red: record which) |
| `e2e-break-p11b.patch` | `walletCheck` ignores the fewest length | `... money-pay -g "too many coins"` | `phaseIs(page,'second')` poll: Expected "second", Received "done" (a star for the non-minimal wallet) |
| `e2e-break-p11c.patch` | `stepTrayDrag` `cancel` puts the carried tray coin | `... money-pay -g "cancelled drag"` | `expect.poll(wallet).toEqual([500])`: Received [200,500] |

Apply: `git apply context/changes/e1-shapes-picture-mode/e2e-break-p11a.patch`, undo: `git apply -R <same>`. Break (b) also turns unit tests red (moneyPay.test.ts); that is fine, the e2e point is the scene path.

## After green
Tick 11.1-11.5 in `plan.md` Progress with the observed numbers, commit `test(e1-shapes-picture-mode): Płacenie monetami dotykiem — e2e (#11) (p11)` (spec, playwright.config.ts, the three patches, request file, plan.md), then the epilogue: `change.md` status `implemented`.
