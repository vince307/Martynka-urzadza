# Handoff — `final-art-p2` (slice S-16c)

The `/10x-tdd final-art-p2 phase 1` step of autonomous run `2026-10-15-fix-s16bcd` wrote this. Phase 1 (six-place wallet, pure logic) is committed in `afac8e1`; the e2e row 1.4 is open for the orchestrator (Chromium cannot launch in this session). Next is phase 2 (`Driver: tdd`).

## 1. State

| | |
|---|---|
| Branch | `feat/final-art-p2`, cut from `main` at `c16734d` |
| Commits | phase 1 code `afac8e1` on top of the 5 doc commits, plus this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged) |
| `## Progress` rows remaining | 43 (`grep -c '^- \[ \]' plan.md`): 1.1-1.3 ticked, 1.4 (orchestrator e2e) and 1.5 [reviewer] open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/data/balance.ts` | `coinDrag.maxTotal` 10 -> 6 |
| `src/data/layout.ts` | `TASK_LAYOUT.coinDrag`: `columns/rows/cellInset` gone; `art` (640 x 420, six drop centres), `wallet` {308,380,800,525}, `coinGap` 6 |
| `src/core/round/dragLayout.ts` | `CoinSpec` on the drop centres, `coin(i)` throws for i >= 6, new `liftedSlot`, `walletFull` |
| `src/ui/widgets/CoinWallet.ts` | uses `liftedSlot` (one-line change, no other widget work) |
| `tests/coinLayout.test.ts`, `tests/moneyPay.test.ts`, `tests/blockDrag.test.ts` | new geometry, lifted-cell, full-wallet, feasibility and 7-coin refusal tests; the pin is `{ startDistance: 12, maxTotal: 6 }` |
| `tests/e2e/money-pay.spec.ts` | `spread` = the first coin broken into the fewest coins of smaller tray nominals, asserted `> answer.length` and `<= 6` |

## 3. Verification

| command | result |
|---|---|
| RED (before the change) | 8 failed: `expected { startDistance: 12, maxTotal: 10 } to deeply equal { startDistance: 12, maxTotal: 6 }`; `liftedSlot ... expected -2 to be +0`; `walletFull ... expected false to be true` (stubbed exports; the three layout tests failed with a TypeError on the missing `art`) |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` | 3043 passed (baseline 3034, +9); deploy scripts OK (both) |
| `npm run sample -- E1..E6` | exit 0 each |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session (`money-pay.spec.ts`: Chromium dies, `kill EPERM`) - orchestrator gate; row 1.4 left unticked |
| Break 1: `maxTotal` back to 10 | red (7 tests: pin, "10 placed coins ... apart", "one drop centre per coin", 7-coin refusal); restored |
| Break 2: `coinGap` 0 | first stayed GREEN (boxes touching pass `apart`), so the meta-check found a wrong test; added "placed coins keep a gap of coinGap"; with the break it is red; restored |
| Break 3: `liftedSlot` without the touched-cell branch (always `lastIndexOf`) | red on "the FIRST of two equal coins" (plan-review F2); restored |
| Teacher read | `npm run sample -- E1 --count 6` and `-- E2 --count 6`, all `E1.11.money_pay_10` / `E2.2.money_pay_20` tasks: prompts, hints, spoken text identical to main (diff of E2 output before/after: same). Amounts 2-10 zł (E1), 3-20 zł (E2) need at most 3 pieces in the samples and at most 4 by the new test; numeral agreement ("Zapłać 2 zł", "dwa złote", "trzynaście złotych") fine; first hint leads a child with a full wallet of 1-zł coins to exchange for a bigger one. No new noun. |

## 4. Next command

`/10x-tdd final-art-p2 phase 2` (phase 2: Art files and tables - UI art, three counting icons, `Driver: tdd`)

## 5. Open

- Row 1.4: orchestrator runs `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4` (expected e2e = baseline 109 + 0; `money-pay.spec.ts` green). Risk: the hook aims at `targets().coins` interiors, which now come from the new rects.
- Row 1.5 [reviewer]: teacher read above; `ART_LIMITS.moneyItems` untouched (10).
- `CoinWallet` still draws the dashed field over the new wallet rect and places coins by `layout.coin(i)`; the pack art, `walletFull` use and the lifted-coin-free `targets().coins` belong to phase 4.
- Earlier open items (decisions 1-3, visual rows, gap 115, follow-ups, `holdTouch` in phase 10) stand as in the plan-review handoff.

## 6. Autonomous decisions

- **Stub-first RED**: exported `liftedSlot` / `walletFull` as wrong stubs so the red step is an assertion; the three spec-dependent layout tests failed with a TypeError (no `art` yet), which is the data change itself. Would change: nothing.
- **Break 2 changed the tests**: the `coinGap` break stayed green, so a gap assertion was added in the same commit instead of accepting the weak test.
- **e2e `spread`**: a local `fewestCoins` in the spec (the spec must not import `src/core`); the first coin is never 1 zł in the fewest task (targets start at 2 zł), so the break always yields more coins.
- Mixed phase: none (all pure logic; the one-line `CoinWallet` change is inline scaffolding so the widget stays correct with the new rects).
