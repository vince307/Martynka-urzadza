# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by the `/10x-impl-review` step of run `2026-10-15-fix-s14c-s14d`. The review is filed (`MERGE: CLEAR`), its four
warnings are fixed in `203b93c`, `change.md` is `impl_reviewed`. The next agent must not reopen the wallet question: a wrong
payment now EMPTIES the wallet (decision 1 below) and the e2e helpers rely on it.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode`, cut from `main` at `10d6fe7` |
| Commits | `f3aa504`..HEAD: phases 1-11 (last `75861ab`), review fix `203b93c`, then this docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `impl_reviewed` |
| Progress | 5 rows open (`grep -c '^- \[ \]' plan.md`): [visual] 2.8, 4.7, 8.7; [human] 9.6, 9.7 |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/e1-shapes-picture-mode/reviews/impl-review.md` | full-plan review, phases 1-11; 0 critical, 4 warnings (fixed), 4 observations; ends `MERGE: CLEAR` |
| `src/scenes/TaskScene.ts` (`submit`) | a wrong answer also empties the coin wallet (`coinState`) |
| `tests/e2e/support/hook.ts` (`payCoins`) | asserts an empty wallet before paying |
| `tests/e2e/money-pay.spec.ts` | "too many coins" test asserts the wallet is `[]` after each miss and in retype (title updated) |
| `src/data/pl.ts` (`tasks.moneyPayOneLine`, `tasks.ordinalFromMarkHint`), `src/core/tasks/generators/moneyPay.ts` (`generateMoneyPay`) | "Wystarczy jeden banknot: 10 zł."; "Zacznij liczyć od chorągiewki po lewej stronie." |
| `src/core/tasks/generators/chooseOp.ts` (`generateChooseOp`, picture branch) | the table starts with ≥ 2 things (no "było 1 kwiatek") |
| `tests/moneyPay.test.ts`, `tests/chooseOp.test.ts` | two red-first tests for the content fixes |
| `context/changes/e1-shapes-picture-mode/e2e-break-review.patch` | the re-executed break (wallet reset removed) |
| `context/changes/e1-shapes-picture-mode/follow-ups/review-fixes.md` | 8 new follow-ups with `Trigger:` |
| `context/changes/e1-shapes-picture-mode/plan.md` | [reviewer] rows 1.5, 2.7, 3.5, 4.6, 5.5, 6.5, 7.5, 8.6, 9.5 ticked |
| `context/changes/e1-shapes-picture-mode/change.md` | status `impl_reviewed` |

## 3. Verification

All observed in this step. Baseline main `10d6fe7`: unit 2672, e2e 86.

| Command | Result |
|---|---|
| lint, typecheck (HEAD before fixes and after) | OK, OK |
| `npm test` before fixes | 2832 passed (2672 + 160) |
| `npm test` after fixes | 2834 passed (2672 + 162; +2 review tests) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh`, `sample` E1-E6 | OK, OK, all exit 0 |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=…/playwright.config.ts --workers=4` (fixed tree) | **93 passed (6.5 min) = 86 + 7**. A first background attempt failed to launch Chromium (sandbox `bootstrap_check_in` denied: the redirect made it a non-plain command); re-run as one plain command, green |
| Red-first content tests | `chooseOp` picture: `Na stole było 1 kłębek … expected 1 to be ≥ 2`; `moneyPay`: received "Wystarczy jedna moneta: 10 zł."; both green after the fix |
| Deliberate break (`e2e-break-review.patch`: wallet reset removed from `submit`), `-g "too many coins"` | red: `expect(missed.wallet).toEqual([])`, received `[500, 100, 100, 100, 100, 100]`; restored. Meta-check: the hook reads the scene's wallet after a real touch payment, so it proves the scene reset, not the helper |
| Teacher read `sample -- E1 --count 6`, `-- E2 --count 6` (E1.1, E1.2, E1.3, E1.11, E2.2) | passes after F2-F4; details in the review |
| Ports 4397/4398 | free after the runs |

## 4. Next command

`visual gate`

## 5. Open

- Human checklist: [visual] 2.8 (SHAPES/PATTERN/E1.1 unlock card, CoordGrid E3.7), 4.7 (COMPARE_QTY, ORDINAL with the flag hint, CHOOSE_OP come/go, COUNT E1.2), 8.7 (MONEY_PAY E1 empty tray, drag, 3 coins, wrong wallet → now EMPTY with the hint, solution; E2 tray 2 × 2; `?e2eArt=missing`); [human] 9.6 (tablet with a 6-year-old), 9.7 (decisions against ZADANIA/roadmap, plus: wrong payment empties the wallet; CHOOSE_OP picture starts at 2).
- Follow-ups: `follow-ups/review-fixes.md` (review section: `grosze` helper, `PatternRow` dashedRect, full-wallet cue in `stepTrayDrag`, `CoinWallet.paint` lifted-cell gap, SHAPES `all` throw, CHOOSE_OP first hint, gender data for "1", `feedDrag`/`submit` switches).
- No DESIGN-GAP added in this step.

## 6. Autonomous decisions

1. **Wallet after a wrong payment: emptied.** Chosen: `TaskScene.submit` resets `coinState`; `payCoins` asserts an empty
   wallet. Rejected: keep the wrong wallet and make `payCoins` tap it empty first. Why: the plan's „Scena” lists a per-kind reset
   after a wrong answer; every other answer mode is cleared there (mat, digits, select, clock); the solution should not sit next
   to the wrong coins; the child is never stuck either way (tap-out still works during an attempt). Would change: a tablet
   playtest ([human] 9.6) showing children prefer fixing one coin over laying the payment again.
2. **Severity WARNING, not CRITICAL, for the wallet.** The child could always tap coins out (verified in `stepTrayDrag` and the
   e2e test of taking a coin out), so nobody was stuck; the defect was plan drift + helper fragility. Would change: evidence of a
   state where no coin can be removed.
3. **Content wording fixed in place (cheap WARNINGs):** banknote line, "chorągiewka" (the `IconRow` mark is a flag, design-gaps
   row 102), picture story from 2 things. Rejected: gender data in `nouns.ts` (scope). Would change: gender data arriving.
4. **Phase 3's TypeError RED accepted** (parser rejecting the unimplemented kind; sibling and breaks red on assertions).
   Would change: a rule that every first RED must be an assertion.
5. **Verdict APPROVED / MERGE: CLEAR** after triage. Would change: a [visual] or [human] row failing.
