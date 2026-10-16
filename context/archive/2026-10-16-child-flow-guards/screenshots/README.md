# Screenshots — child-flow-guards visual gate (plan rows 2.6, 3.6, 5.6, 6.6, 10.5)

Captured 2026-10-16 on `76daf9a`. No fix was needed, so every frame shows the code that ships; the build id in the frames is `76daf9a`.

Route: Playwright only. A throwaway spec in `tests/e2e/visual.local/` had its own config: no `webServer`, `hasTouch`, `locale: 'pl-PL'`,
`timezoneId: 'Europe/Warsaw'`, and two projects, `desktop` at 1440×900 and `tablet` at 1024×768. It reused `tests/e2e/support/{welcome,hook,saveImport}.ts`
against the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by
`npm run preview -- --outDir dist-e2e --port 4399 --strictPort`. Afterwards the folder was moved out of the repo and the server was stopped.
Frames are JPEG q 80 and viewport-sized. The game canvas is 1920×1080 with FIT, so the canvas scale is 0.75 at 1440 and 0.533 at 1024.

Every state starts on the parent path (`passWelcomeAsParent`, `?e2eVariant=off`, `?e2eMonth=9`). Nothing in the test writes to IndexedDB. Each run draws
different tasks, so the desktop and tablet frames show different numbers.

- `desktop-*` = 1440×900; `tablet-*` = 1024×768.
- Kit reference: none. The kit (`designs/martynka-maths-A-v1/screenshots/`) has no progress preview with list answers or previous-stage skills
  (gaps 122, 123), no wallet line (gap 124) and no COMPARE_QTY tile order (gap 125). The task-screen frames follow the existing house pattern
  (same bar, keypad and tiles as the frames on main).

| State (row) | Desktop | Tablet | How reached |
|---|---|---|---|
| Wallet line in the second-try bar (5.6) | `desktop-wallet-line.jpg` | `tablet-wallet-line.jpg` | E1 parent, `?e2eSkills=E1.11.money_pay_10,E1.1.shapes_all,E1.1.compare_qty_10`. On a "fewest" task (`visual.pay.fewest`), one answer coin was split into smaller tray coins and paid by dragging to the wallet, then "OK" |
| COMPARE_QTY tiles (6.6) | `desktop-compare-qty.jpg` | `tablet-compare-qty.jpg` | same round, first phase of the COMPARE_QTY task |
| Progress: wallet and shapes examples (3.6) | `desktop-progress-e1.jpg` | `tablet-progress-e1.jpg` | same session: the first wallet task and the first `shapes_all` task answered wrong, then right; next round; gear hold + adult gate; list scrolled into view |
| HALF first hint (6.6) | `desktop-half-hint.jpg` | `tablet-half-hint.jpg` | E3 parent, `?e2eSkills=E3.10.half_30`, one wrong keypad answer (answer + 1) |
| PUZZLE_GRID pyramid, solution steps (10.5) | `*-pyramid-solution-step0/1/2.jpg`, `*-pyramid-retype.jpg` | same names | E3 parent, `?e2eSkills=E3.5.pyramid_30`; tasks answered right until one has its base cell empty (three solution lines); two wrong answers, then "Następny krok" until "Już wiem"; retype frame after it |
| PERIMETER composite, solution steps (10.5) | `*-perimeter-solution-step0/1.jpg`, `*-perimeter-retype.jpg` | same names | E6 parent, `?e2eSkills=E6.3.perimeter_composite`, two wrong answers, then the steps |
| Progress on E6.11 with a weak E5 skill (2.6) | `desktop-progress-e6-review.jpg` | `tablet-progress-e6-review.jpg` | E6 parent. The parent's "Wczytaj z pliku" loads a save at E6 step 10 with every E6 skill mastered (the file of `tests/e2e/review-round.spec.ts`, mastery widened to all E6 skills). One round unlocks E6.11 through play (`unlockedStep.E6` = 11). Then review rounds with every task missed once and answered, until the history holds an E5 miss (round 1 at both widths); gear hold + gate |
