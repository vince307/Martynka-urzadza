# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by `/10x-tdd` phase 7 of run `2026-10-15-fix-s14c-s14d`. Phase 7 is committed and green except e2e (not runnable here). No coin skill exists in the programme: MONEY_PAY is registered but unreachable until phase 8 adds E1.11 / E2.2 together with the e2e helpers.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode` |
| Commits | phases 1-6 up to `a992ecf`; phase 7 `1929895`, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress | 6.4 ticked citing the orchestrator note (86 passed on `a992ecf`); 7.1-7.3 ticked with `1929895`; 7.4 (e2e part, orchestrator), 7.5 `[reviewer]`, 6.5 `[reviewer]`, 5.5, 4.6, 4.7, 3.5, 1.5, 2.7, 2.8 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/tasks/generators/moneyPay.ts` (new) | `parseMoneyPayParams` (tray 1-4 kinds, min/max whole zł, variants; rejects unreachable targets and wallets over `coinDrag.maxTotal`), `generateMoneyPay` (answer = fewest wallet from `fewestCoins`, `check` per variant) |
| `src/core/tasks/visual.ts` | `money.pay?: { tray; fewest }`, key, validation (empty table + 1-4 distinct known nominals), `describeVisual` |
| `src/core/tasks/dragMode.ts` | `DragMode` gets `'coins'` (money drawing with `pay`); money without `pay` still throws |
| `src/core/round/canonicalInput.ts` | coins branch returns the answer wallet, throws if `check` refuses it or it exceeds the wallet |
| `src/core/tasks/validate.ts` | rule `coins`; checks mode `drag`, wallet of tray nominals within the limit, `check` accepts the answer and refuses empty / longer / shorter wallets |
| `src/core/round/artFilter.ts` | `artBlocked` for MONEY_PAY: any missing nominal of the tray |
| `src/core/tasks/registry.ts`, `src/data/pl.ts`, `src/data/measures.ts` | registration; `tasks.moneyPay*` strings; `ART_LIMITS.trayKinds` 4 |
| `tests/moneyPay.test.ts` (new) | 22 tests, oracle = exhaustive wallet search written in the test |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2821 passed (branch baseline 2799, +22); deploy and ops test scripts OK |
| `npm run sample -- E1` ... `E6` | exit 0 x6 (output unchanged: no MONEY_PAY skill) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e | `e2e: not runnable in this session — orchestrator gate` (Chromium cannot start, plain `--workers=4`); expected 86 + 0; nothing in the scene changed |
| RED | stubs first (parser returns empty data, generator returns an empty task); 16 of 22 failed on assertions, e.g. `AssertionError: expected [] to include 'visual'` (validator on a tray with items) and `AssertionError: expected false to be true` (`artBlocked` of a MONEY_PAY tray) |
| Breaks | `fewest` check without the length condition -> 2 red (`wallet 200,200,100: expected true to be false`); `dragMode` returns `coins` for any money drawing -> red (`expected 'coins' to be 'throws'`); `artBlocked` ignores the tray -> red. Restored. Meta-check: wallet sets come from the exhaustive search inside the test, not from `fewestCoins`/the generator; the second break is caught only by the "money without tray still throws" case, which is the rule itself |
| Teacher read (scratch script, 6 draws x variant x E1/E2) | "Zapłać 7 zł." / "Zapłać 7 zł najmniejszą liczbą monet."; spoken "Zapłać siedem złotych ..."; złote/złotych right in speech (formatMoney uses "zł", no declension needed); hints: "Połóż największą monetę, która nie jest za duża." (E2: "monetę lub banknot, który nie jest za duży.") -> "5 zł i jeszcze 2 zł." -> "5 zł + 2 zł = 7 zł", the amount only in the last line; a one-coin wallet gives "Wystarczy jedna moneta: 5 zł." (also "moneta" for a 10 zł note) |

## 4. Next command

`/10x-implement e1-shapes-picture-mode phase 8` (Phase 8, `Driver: impl`)

## 5. Open

- 7.4 e2e (orchestrator, `--workers=4`, expect 86 + 0); 7.5 `[reviewer]` teacher read (phrases above; "najmniejszą liczbą monet" is the plan's wording, a reviewer may prefer a simpler one for 6-year-olds, a `pl.ts` change only); 6.5 and 5.5 `[reviewer]`; manual rows 4.6, 4.7, 3.5, 1.5, 2.7, 2.8.
- Phase 8 must add the wallet widget (`TaskPicture` `money` case still draws `items` only; a pay drawing has empty items), `TaskScene` drag switch, hook `dragMode`, exhaustive e2e helpers, the E1.11 / E2.2 data and move MONEY_PAY out of `LATER` in `tests/curriculum.test.ts`; `screenBound` for MONEY_PAY needs no entry (`params.max` is in zł). The test "no stage holds a MONEY_PAY skill" in `tests/moneyPay.test.ts` is to be replaced then.

## 6. Autonomous decisions

1. The wallet answer is the DP-fewest list (`fewestCoins`), not the plan's greedy list; they agree on 1-2-5-10 trays and the DP stays right for any tray. Would change: never.
2. `check` also rejects an empty wallet and a wallet over `coinDrag.maxTotal`; the validator rule for those is a new `ViolationRule` `coins`.
3. `ART_LIMITS.trayKinds = 4` added next to `moneyItems` as the one source for the tray limit (parser, validator).
4. The hint for a one-coin wallet is two lines (no "i jeszcze" line); both end with the amount.
5. Commit message and next-phase prompts decided in place, stopped after phase 7.
