# Screenshots — e1-shapes-picture-mode (S-14d) visual gate

Captured 2026-10-15. The build id in the corner reads `0727dfe` (HEAD before the gate); every frame was taken with the fixes of
`c61099b` in the working tree, so each frame shows the final code. The first capture (on `0727dfe` without fixes) showed V1-V3 of
`reviews/visual-review.md`; those frames were overwritten by the second capture of the same names.

Route: Playwright only. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`, service
workers blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, projects `desktop` 1440×900 and `tablet` 1024×768)
reused `tests/e2e/support/{welcome,hook}.ts` (`passWelcomeAsParent`, `openWelcome`, `answerRight`, `answerWrong`, `payCoins`) against the
e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`.
The folder was moved out of the repo before the lint gate. Claude in Chrome was not used: every state but a first try needs touches on
the Phaser canvas (tiles, drags, "Następny krok"), which synthetic events cannot drive (profile § 8). A silent speech stub hides the
speaker; the spec waited 900 ms before each frame. The coin held mid-drag is a raw CDP `touchStart` + 6 `touchMove`s, photographed
before a `touchCancel`.

States are reached through the product: the parent path (age "10+", month 9, stage override, no warm-up) with
`?e2eSkills=<skill>&e2eVariant=off`, then real touches. The unlock card: the child path (age 6 in September, `?e2eVariant=off`), every
task answered right until the first card.

- `desktop-*` = 1440×900 (scene at 0.75); `tablet-*` = 1024×768 (scene at 0.533). Each test is a new browser context, so desktop and
  tablet frames of one state usually show different tasks.
- Kit: no frame for these views (design-gaps rows 100-104); judged against the kit's tile/task screen, coin and note pictures and icons.

| # | State | Frames (`desktop-` / `tablet-`) | Skill · how reached |
|---|---|---|---|
| s01–s02 | SHAPES `name` first try, wrong tile → hint | `s01-shapes-name-first`, `s02-shapes-name-hint` | `E1.1.shapes_pick`, task with "Dotknij …" |
| s03–s04 | SHAPES `odd` first try, hint | `s03-shapes-odd-first`, `s04-shapes-odd-hint` | `E1.1.shapes_pick`, task with "Który nie pasuje?" |
| s05–s06 | SHAPES `all` (select) first try, two right tiles marked | `s05-shapes-all-first`, `s06-shapes-all-two-marked` | `E1.1.shapes_all` |
| s07–s08 | PATTERN first try, hint, solution steps 1–3, retype | `s07-pattern-first`, `s08-pattern-{hint,solution-1,-2,-3,retype}` | `E1.1.pattern` |
| s11 | PATTERN with hearts (after V2) | `s11-pattern-heart-first` | `E1.1.pattern`, task with a heart |
| s09 | "Nowa umiejętność!" card (first reachable: E1.3 "Działania do 5") | `s09-unlock-card` | child path, age 6 |
| s10 | CoordGrid E3.7 with the shared figures | `s10-grid-e37-first` | `E3.7.grid_where` (stage E3) |
| c01–c03 | COMPARE_QTY first try, equal groups ("Tyle samo"), its hint (after V1) | `c01-compare-qty-first`, `c02-compare-qty-same`, `c03-compare-qty-same-hint` | `E1.1.compare_qty_10` |
| c04–c05 | ORDINAL first try, flag hint, solution steps, retype | `c04-ordinal-first`, `c05-ordinal-{hint,solution-1,-2,-3,retype}` | `E1.2.ordinal_5` |
| c06–c08 | CHOOSE_OP picture `come`, `go`, `go` hint | `c06-choose-op-come`, `c07-choose-op-go`, `c08-choose-op-go-hint` | `E1.3.choose_op_picture_5` |
| c09–c10 | COUNT E1.2 (≥ 2 icons after O4), two first tries | `c09-count-first`, `c10-count-first-2` | `E1.2.count_5` |
| m01–m03 | MONEY_PAY E1: empty wallet + tray, a 2 zł coin held mid-drag, three 1 zł coins in the wallet | `m01-pay-first`, `m02-pay-mid-drag`, `m03-pay-three-coins` | `E1.11.money_pay_10`, amount ≥ 4 zł |
| m04 | wrong payment (answer + 1 zł, OK) → hint with the wallet emptied, solution steps, retype (after V3) | `m04-pay-{hint,solution-1,-2,-3,retype}` | same task, coins tapped out first |
| m05 | "Użyj jak najmniej monet" first try | `m05-fewest-first` | `E1.11.money_pay_10` |
| m06–m07 | E2 tray 2 × 2 with the 10 zł note, paid right | `m06-e2-note-first`, `m07-e2-note-paid` | `E2.2.money_pay_20`, answer with the note |
| m08–m09 | coin stand-ins, two stand-ins in the wallet | `m08-pay-stand-in`, `m09-pay-stand-in-wallet` | `E1.11.money_pay_10` + `?e2eArt=missing` |
