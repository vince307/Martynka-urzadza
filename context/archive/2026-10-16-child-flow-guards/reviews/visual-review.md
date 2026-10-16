# Visual review — child-flow-guards

This is the visual gate of run 2026-10-16-audit-sweep, run after `MERGE: CLEAR` (`reviews/impl-review.md`), on `76daf9a`. Frames and the route are in
`screenshots/README.md`: Playwright on the hook build, port 4399, 1440×900 and 1024×768.

The frames were judged against:
- the `[visual]` rows 2.6, 3.6, 5.6, 6.6 and 10.5 of `plan.md`;
- the copy in `src/data/pl.ts`;
- DESIGN-GAP rows 122-125 in `docs/design-gaps.md`. The kit has none of these states, so no kit frame applies;
- the task-screen and settings-panel patterns already on main.

## Discrepancies and fixes

No code change was needed. The gate found two things and recorded them as follow-ups in `follow-ups/review-fixes.md`. It also answered two impl-review follow-ups whose triggers named this gate:
- **VG-1:** the E3.5 pyramid with its base cell empty overflows at its third solution step. The hook reported `solutionOverflow` true at both widths. Every line is still on screen above "Już wiem", but the text is at `minScale` 0.6, about 10 px tall at 1024. This is a real overflow that the WNA-04 signal now reports. Row 10.5 asks for "cells readable, lines inside the screen", and that still holds, so the fix is deferred.
- **VG-2:** a wallet example can wrap between "2" and "zł" in the panel. This is cosmetic.
- **F3 and F7:** both now carry a note on what the frames show, and new triggers.

## States

| Row | Frames | Verdict |
|---|---|---|
| 2.6 Progress on E6.11 with a weak E5 skill | progress-e6-review | "Krok 11 z 11: Powtórka całego roku — „Test przed klasą 4”". The E5 skill heads "Do poćwiczenia" at mastery 0 under its own E5 step title. Desktop shows "Dzielenie do 100, dzielna/dzielnik/iloraz", example `30 : 3 — odpowiedź dziecka: 11, poprawna: 10`. Tablet shows two E5 skills (calendar, timetable) first. E6 skills missed in the same rounds follow at mastery 5 ("opanowanie 5 z 5"). The ranking is mastery ascending, as in `progressView`. Three skills, at most 2 examples each (`balance.parentSettings`). Reached in the first review round at both widths |
| 3.6 Progress with a wallet and a shapes example | progress-e1 | Wallet: "Zapłać 9 zł. Użyj jak najmniej monet. — odpowiedź dziecka: 2 zł, 2 zł, 2 zł, 2 zł, 1 zł, poprawna: 5 zł, 2 zł, 2 zł". Shapes: "Dotknij wszystkich kół. — odpowiedź dziecka: mały zielony prostokąt, poprawna: duże zielone koło, duże żółte koło". The tablet adds an older wallet example (`Zapłać 8 zł. — 5 zł, 2 zł, 1 zł, 1 zł`). Coins are largest first and faces are words with the right gender agreement ("duże zielone koło", "duży żółty kwadrat"). Text wraps inside the panel at both widths. VG-2 is the wrap between "2" and "zł" |
| 5.6 Wallet line in the second-try bar | wallet-line | The bar reads "Spróbuj jeszcze raz" with `pl.tasks.moneyPayTooManyCoins` below it ("Kwota się zgadza. Spróbuj zapłacić mniejszą liczbą monet."). It is calm, gives no verdict word and does not give away the answer. The wallet is emptied for the second try, as for any miss. Stars stay 0 on the first task. It fits in the bar at 1024 on two lines |
| 6.6 COMPARE_QTY tiles | compare-qty | "Po lewej · Tyle samo · Po prawej" left to right, in game x 682 / 960 / 1238 at both widths (from the hook targets). The left tile sits under the left group, "Tyle samo" in the middle, "Po prawej" toward the right group. The groups (4 vs 4 teapots, 3 vs 3 stickers) were "Tyle samo" cases in these draws |
| 6.6 HALF first hint | half-hint | After one miss on "Ile to jest połowa liczby 24?" (tablet: 28), the bar shows "Spróbuj jeszcze raz" and the method line `pl.tasks.halfMethodHint` "Połowa to jedna z dwóch równych części.". The computed line with the result is not in the first hint |
| 10.5 PUZZLE_GRID pyramid in the solution phase | pyramid-solution-step0/1/2, pyramid-retype | With a three-line prompt, the cells measure about 63 game px at both widths (47 and 34 screen px), above the `figure.minCell` floor of 36 (F3). Step 0 shows the method line, step 1 adds the reverse rule, step 2 adds `3 − 1 = 2` / `8 − 1 = 7`. At step 2 `solutionOverflow` is true (VG-1). The lines stay on screen and do not overlap "Już wiem". Retype shows the last line in the bar |
| 10.5 PERIMETER composite in the solution phase | perimeter-solution-step0/1, perimeter-retype | The lattice figure is fully inside its strip. The solution line `7 + 5 + 5 + 4 + 1 + 4 + 1 + 5 = 32` (tablet) and `4 + 1 + 1 + 2 + 3 + 3 = 14` (desktop) fit on one line. `solutionOverflow` is false at every step at both widths, which agrees with e2e #11. The 7×5 lattice at 1024 has a cell of 137 / 7 = 19.6 screen px = 36.7 game px, just above the floor (F3) |

## Hand-checked numbers (mandatory)

- **Wallet, desktop 5.6:** 2 + 2 + 2 + 2 + 1 = 9 zł = 5 + 2 + 2, so the sum is right. 5 coins > 3, the fewest, so `tooManyCoins` applies and the line shows ✓.
- **Wallet, tablet 5.6:** 1 + 1 + 1 = 3 = 2 + 1, and 3 coins > 2 ✓.
- **Wallet, tablet 3.6 older example:** 5 + 2 + 1 + 1 = 9 ≠ 8. This was the plain miss (sum + 1 zł), and it correctly got the generic hint, not the line ✓.
- **Perimeter, desktop:** the vertices (4,3) (0,3) (0,2) (1,2) (1,0) (4,0) give sides 4, 1, 1, 2, 3, 3. 4 + 1 + 1 + 2 + 3 + 3 = 14, which matches the frame ✓.
- **Perimeter, tablet:** (0,5) (7,5) (7,0) (2,0) (2,4) (1,4) (1,0) (0,0) give 7 + 5 + 5 + 4 + 1 + 4 + 1 + 5 = 32 ✓.
- **Pyramid, desktop:** the base is 6, 1, ? under 7, 3 under 10. 6 + 1 = 7 ✓ and 7 + 3 = 10 ✓, so ? = 3 − 1 = 2, as the frame says ✓.
- **Progress example 2.6:** 30 : 3 = 10, the child gave 11 ✓.
- **HALF:** 24 : 2 = 12. The hook answer is 12 and the wrong input was 13. The first hint does not contain 12 ✓.

## Keyboard, focus, input switch

This change touches no DOM control. The progress list is rendered by `progressView.ts` through `textContent` as before. The panel opened and
closed with "Anuluj" in every run, and the game took input afterwards (the next round played). Initial focus was not re-measured in this step,
because the panel's structure did not change since the stale-tab-and-health gate, which observed the first stage button.

## Autonomous decisions

- **Playwright instead of Claude in Chrome.** Every state needs canvas touches: drags into the wallet, the 2 s gear hold, keypad taps and
  whole rounds (profile § 8). This is the route the previous gate used. Would change: a Chrome tool that can drive canvas touches.
- **E6.11 reached by importing a save through the parent's "Wczytaj z pliku", then unlocking through play.** No URL seam reaches the review
  step, and mastering all of E6 by play is out of reach for a gate. The file is the one `tests/e2e/review-round.spec.ts` imports (a save the game
  could have written), with mastery widened to every E6 skill. A child on the review step has mastered the stage, and this keeps E6 misses
  below the E5 one in the ranking. Nothing was written to IndexedDB by the test. Would change: an `e2eStep` seam.
- **Every review-round task missed once.** The hook does not expose the open task's skill, so E5 tasks cannot be singled out. Two weak rounds
  would have eased the draw to 70/30, but an E5 miss arrived in round 1 at both widths. Would change: a `skillId` field in the hook snapshot.
- **VG-1 deferred, not fixed.** A fix changes PUZZLE_GRID hint lines, which is content that needs a teacher read, or the keypad-solution layout of
  every drawn skill. Both are outside this fix slice. The plan's criterion for row 10.5 (lines inside the screen, cells readable) is met, and the
  overflow is now reported by the signal this change added. Would change: a reviewer counting 10 px text at 1024 as unreadable.
  The text is about 10 px tall: 0.6 scale × 0.533 canvas scale × the bar font.

## Gate in this step

No source changed, so the local gate was not re-run. The impl-review step observed it green on `03a597e`: unit 3416, e2e 127. Port 4399 was
not listening afterwards, and `tests/e2e/visual.local/` was moved out of the repo.

VISUAL: PASS — all five [visual] rows captured at 1440×900 and 1024×768 through the product. The wallet line, fixed COMPARE_QTY order, HALF method hint and previous-stage/list examples in the progress preview match pl.ts and gaps 122-125. Wallet 9 = 5+2+2, perimeters 14 and 32, and pyramid 3−1=2 were hand-checked. VG-1 (E3.5 pyramid third solution step raises the overflow flag, lines still on screen) and VG-2 (zł wrap) went to follow-ups.
