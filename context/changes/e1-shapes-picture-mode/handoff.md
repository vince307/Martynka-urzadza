# Handoff — `e1-shapes-picture-mode` (slice S-14d)

Written by `/10x-implement` phase 8 of run `2026-10-15-fix-s14c-s14d`. Phase 8 is committed (one commit, no p8a/p8b split) and green except e2e (not runnable here). MONEY_PAY is now reachable (E1.11, E2.2); the full e2e run must prove no unpinned spec breaks on a coin task.

## 1. State

| | |
|---|---|
| Branch | `feat/e1-shapes-picture-mode` |
| Commits | phases 1-7 up to `1929895`; phase 8 `9ee5d56`, then this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress | 7.4 ticked citing the orchestrator note (86 passed on `1929895`); 8.1-8.4 ticked with `9ee5d56`; 8.5 e2e (orchestrator), 8.6 `[reviewer]`, 8.7 `[visual]`, 7.5, 6.5, 5.5, 4.6, 4.7, 3.5, 1.5, 2.7, 2.8 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/CoinWallet.ts` (new), `dashedRect.ts` (new, shared with `BlockMat`) | tray of coin pictures + dashed wallet + "OK"; `targets()` = tray per id, wallet, ok, placed coins; no sum drawn while paying |
| `src/scenes/TaskScene.ts` | `dragKind: DragMode \| null` (replaces the `clockTask` field; `clockTask` is a getter), `coinState` on `stepTrayDrag`, exhaustive switches (render, `answerSpot`) with `never`; snapshot `dragMode`, `wallet`, `walletCarrying`; targets `coins` |
| `src/core/coins.ts`, `src/core/round/dragLayout.ts` | `walletList`, `emptyWallet`; `coinGeometry` (tray, wallet cells in largest-first order) |
| `tests/e2e/support/hook.ts` | `Snapshot.dragMode/wallet`, `Targets.coins`, `COIN_GROSZE`, `payCoins`; `answerRight` exhaustive switch (clock, coins, blocks, null/undefined throw, default `never`); `answerWrong` coins = answer + one 1 zł |
| `src/data/curriculum/E1.ts`, `E2.ts`, `pictureSkills.ts` | `E1.11.money_pay_10` (tray 1/2/5 zł, 2-10 zł), `E2.2.money_pay_20` (+ 10 zł note, 3-20 zł), both `drag`, variants pay + fewest |
| `src/data/pl.ts`, `src/data/layout.ts`, `docs/design-gaps.md` | prompt, `TASK_LAYOUT.coinPay`, gap row 104 (row 103 was taken by picture mode; the plan said 103) |
| tests | `moneyPay.test.ts` (programme holds exactly the two skills, canonical input per draw), `coins.test.ts` (+2), `coinLayout.test.ts` (+2), `curriculum.test.ts` (MONEY_PAY out of `LATER`, into `GROUP_1`), `artFilter.test.ts` (compares via JSON: MONEY_PAY tasks carry a `check` closure) |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `typecheck` | OK / OK |
| `npm test` | 2832 passed (branch baseline 2821, +11); deploy and ops test scripts OK |
| `npm run sample -- E1` ... `E6` | exit 0 x6; E1 and E2 `--count 6` contain MONEY_PAY tasks |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `tests/fixtures/` untouched |
| e2e | `e2e: not runnable in this session — orchestrator gate` (Chromium dies with MachPortRendezvous, plain `--workers=4`, also a throwaway coin spec that I deleted). Expected 86 + 0. Row 8.5 left open; record the `adaptive.spec` time. The coin flow in the scene (drag, tap-out, OK, wrong sum then right) is NOT yet exercised by any browser run: phase 11 owns the spec |
| Break | `case 'coins'` removed from `answerRight` -> `npm run typecheck` red: `hook.ts(447,30): error TS2345: Argument of type '"coins"' is not assignable to parameter of type 'never'`. Restored. Meta-check: proves the helper is exhaustive, not that the scene works (phase 11) |
| Teacher read | E1 and E2 `--count 6`: "Zapłać 9 zł. Użyj jak najmniej monet." -> hints "Połóż największą monetę, która nie jest za duża." / "5 zł i jeszcze 4 zł." / "5 zł + 2 zł + 2 zł = 9 zł"; E2 "monetę lub banknot", 10 zł note only in E2 (13 zł = 10 + 2 + 1); one-coin payments say "Wystarczy jedna moneta: 5 zł."; spoken numerals right (pięć, dziewięć, trzynaście złotych); amount only in the last hint line |
| Specs that can now draw a coin task | pinned by `e2eSkills`: none. Unpinned and able to reach E1.11 / E2.2 (late-calendar E1/E2 starts, unlocked steps): `first-launch.spec.ts`, `adaptive.spec.ts`, `minigames.spec.ts`, `review-round.spec.ts`, `task-round.spec.ts`, `narrator.spec.ts`, `room-purchase.spec.ts` and any spec playing a child path in E1/E2. All reach it through `answerRight` / `answerWrong`, now exhaustive and with a coins branch |

## 4. Next command

`/10x-implement e1-shapes-picture-mode phase 9` (Phase 9, `Driver: impl`)

## 5. Open

- 8.5 e2e (orchestrator, `--workers=4`, expect 86 + 0, note `adaptive.spec` time); 8.6 `[reviewer]`; 8.7 `[visual]` (pay screens at 1440x900 and 1024x768, E2 2 x 2 tray, `?e2eArt=missing` stand-in; coin sizes `coinPay` are provisional); 7.5, 6.5, 5.5 `[reviewer]`; manual rows 4.6, 4.7, 3.5, 1.5, 2.7, 2.8.
- Phase 9 (seam sweep) should check comments that still speak of two drag branches (blocks / clock) and the `DESIGN-GAP` comments against rows 100-104.
- Phase 11 spec: payment by touch incl. tapping a placed coin out; `walletCarrying` and `targets.coins.coins` are there for it.

## 6. Autonomous decisions

1. Prompt for the "fewest" variant: "Zapłać 7 zł. Użyj jak najmniej monet." (spoken the same) instead of "…najmniejszą liczbą monet." Why: shorter for a 6-year-old. Would change: reviewer prefers the plan's wording (pl.ts + one test line).
2. One commit for phase 8 (no p8a/p8b): scene, hook, helpers and curriculum data land together, satisfying the safety rule.
3. The wallet shows no sum while paying (plan: caption only in the solution); the solution lines already state the sum, so no caption was added.
4. Gap row 104, not 103 (103 describes picture mode). The plan's mention of row 103 is stale.
5. `answerWrong` for coins: the answer plus one 1 zł coin (sum one złoty too high, refused by plain and fewest variants).
6. `artFilter.test.ts` equality now goes through JSON because a MONEY_PAY task holds a `check` closure.
7. Commit message and next-phase prompts decided in place; stopped after phase 8.
