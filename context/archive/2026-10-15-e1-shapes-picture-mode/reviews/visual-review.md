# Visual review — e1-shapes-picture-mode (S-14d)

Run 2026-10-15-fix-s14c-s14d, visual gate after `MERGE: CLEAR`. Frames and route: `screenshots/README.md` (Playwright on the hook build,
port 4399, 1440×900 and 1024×768). Judged against the art pack (`designs/martynka-maths-A-v1`: coin, note and icon pictures, the task
screen and tile look) and design-gaps rows 100-104; no kit frame exists for these views.

## Discrepancies and fixes

| # | Found (first capture on `0727dfe`) | Why it matters | Fix (`c61099b`) |
|---|---|---|---|
| V1 | COMPARE_QTY drew the two groups one under the other (`iconsLayout` stacks two plain groups as rows), while the tiles read "Po lewej" / "Po prawej" and the hint "Z lewej strony: …, z prawej: …" | The task could not be answered from the picture: there was no left or right group | `sides: true` in the `icons` drawing (`src/core/tasks/visual.ts`: validation, key, `describeVisual` "3\|2"), set by `generateCompareQty`; `iconsLayout(..., sides)` keeps both groups on one line, each in a frame, the first on the left; `IconGroups.render`/`TaskPicture` pass it. Tests: `compareQty.test.ts` (`visual.sides`), `visual.test.ts` (two plain groups, no motion), `artLayout.test.ts` (frames side by side for [1,10], [10,10], [7,3], [2,2], [10,1] in three areas). Red first on assertions. Gap row 102 extended |
| V2 | The heart (PATTERN) was two stroked circles plus a triangle: the circles' inner arcs and the triangle's sides showed inside, it read as three figures | PATTERN and SHAPES ask the child to tell figures apart; a heart that looks like two balls on a cone is a different figure | `heartPoints` (`src/ui/widgets/figurePoints.ts`, pure) gives one closed contour from the heart curve; `drawShape` fills and strokes it. Test `tests/figurePoints.test.ts` (red: no module); deliberate break: the curve replaced by a circle (`y = -16 cos t`) → "dips between the two lobes" red (`expected 50 to be greater than 60`), restored. Meta-check: the test asserts the points `drawShape` draws, the frames `s11-*` show the widget uses them. Gap row 100 notes it |
| V3 | MONEY_PAY solution line "5 zł + 2 zł + 1 zł = 8 zł" wrapped in the 392 px strip with a lone "zł" on the last line (tablet and desktop) | A unit cut off its amount, the line a child copies on the retype | `keepTogether` (`src/core/text/nowrap.ts`) also glues a number to its unit (zł, gr, km, dm, cm, mm, m, kg, dag, g, ml, l) and an operator to the amount after it, so the line breaks only before an operator: "5 zł + 2 zł + 1 zł / = 8 zł". Test `tests/nowrap.test.ts` (red: received plain spaces); "Minęło 5 minut." stays untouched |

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 2.8 | SHAPES `name` / `odd` tiles with drawn figures, hint; SHAPES `all` select with two marked; PATTERN first try, hint, solution steps, retype; heart pattern; unlock card; CoordGrid E3.7 | s01–s11 | Figures fill the tiles (254×136 scene px tiles, 135×72 CSS on the tablet; select tiles ≥ 200×140 scene px), outlined so colour is not needed; small (0.6) vs big differ clearly; rectangle visibly wider than the square. The dashed "?" place ends the row. The retype keeps the model tile outlined in gold with "Wynik: duży niebieski trójkąt". The E1.1 card is unreachable (E1.1 is the first step, never unlocked); the first card from the child path is E1.3 "Działania do 5", same card layout, name fits. CoordGrid: the square, triangle and circle are the shared figures, unchanged layout |
| 4.7 | COMPARE_QTY first try and "Tyle samo" with hint; ORDINAL with the flag and number tiles, hint, solution; CHOOSE_OP `come` (solid arrow up) and `go` (dashed arrow down) with hint; COUNT E1.2 | c01–c10 | After V1 the groups sit side by side in frames with a dark border (distinct from the light answer tiles). The flag on a teal pole marks the start; the hint names the "chorągiewka". `come`/`go` differ by shape (solid vs dashed). COUNT shows 5 flowers in a row (never 1, O4) |
| 8.7 | MONEY_PAY empty wallet + 1 × 3 tray, coin mid-drag, three coins, wrong payment → hint with the wallet empty, solution, retype; fewest; E2 2 × 2 tray with the note, paid; stand-ins | m01–m09 | Wallet is the dashed white field, coins land largest-first in its grid, no sum shown while paying. The coin under the finger is drawn over the wallet. After a wrong payment the wallet is empty and the hint reads "Połóż największą monetę, która nie jest za duża."; after V3 the sum line keeps every amount whole. The E2 tray is 2 × 2 with the kit's 10 zł note. Stand-ins show the Polish value (labels small, follow-up) |

## Hand-checked against the task's answer (mandatory)

- COMPARE_QTY: desktop 10 | 7, "więcej" → left has more → "Po lewej" (snapshot answer "Po lewej") ✓; tablet 10 | 10 → "Tyle samo" ✓; sample `[icons yarn 4|2]` "więcej kłębków" → Po lewej, hint "Z lewej strony: 4 kłębki, z prawej: 2 kłębki." ✓.
- ORDINAL: lamp, apple, flower, book; apple is 2nd from the flag → 2 (answer 2) ✓.
- CHOOSE_OP: 2 jabłka, dołożono 3 → 2 + 3 ✓; 4 rogaliki, zabrano 2 → 4 − 2 ✓.
- PATTERN: triangle, circle, circle, triangle, circle, circle, ? → triangle (period ABB) ✓; heart, heart, circle, heart, heart, circle, heart, ? → heart ✓.
- MONEY_PAY: 8 zł fewest = 5 + 2 + 1 (3 coins) ✓; 5 zł + 1 zł = 6 zł ✓; 12 zł = 10 + 2 ✓, stars 0 → 1 "Brawo! +1 ★" ✓; wrong payment = answer + 1 zł (9 zł) → second try, wallet `[]` ✓.
- SHAPES `all`: "Dotknij wszystkich kół." answer {small red circle, big green circle}, both marked ✓.

## Fit and legibility on the 1024 tablet (6-year-old)

Touch targets: answer tiles 254×136 scene px, select tiles ≈ 205×140, tray tiles ≈ 140×140, OK ≥ 220×96, all ≥ 96 scene px. Smallest
game text: hint bar lines ≈ 15 CSS px, solution strip ≈ 19 CSS px, prompts ≈ 30 CSS px. Under 12 CSS px: only the coin stand-in labels
(≈ 9–10 CSS px, a missing-art state; follow-up). Nothing overlaps in any captured state after the fixes; the check mark of a marked big
figure touches its outline (follow-up). Figures and coins are distinguishable by shape and number (1/2/5 on the coins, outline on every
figure).

## Observations (not fixed; follow-ups with triggers in `follow-ups/review-fixes.md`, section "From the visual gate")

- O1: coin stand-in labels ≈ 9–10 CSS px on the tablet.
- O2: the check mark of a marked select tile sits on a big figure's outline.
- O3: COMPARE_QTY 10 | 10 icons ≈ 22 CSS px each on the tablet.
- O4: tray coins smaller than wallet coins.
- The `CoinWallet.paint` lifted-cell follow-up stays open (no frame of a coin lifted out of the wallet).

## Gate in this step (after the fix, working tree = `c61099b`)

lint OK; typecheck OK; vitest 2839 passed (branch before 2834, +5; baseline main 2672, +167); deploy + ops tests OK; `sample` E1–E6
`Naruszenia: 0` each; teacher read `sample -- E1 --count 6` E1.1 compare_qty (wording unchanged, the left group is the first in the
drawing and in the hint); `npm run build` `e2e hook: absent (2 chunks checked)`; `npx playwright test --config=<abs> --workers=4`
93 passed (branch before 93, +0; baseline 86, +7), 6.4 min; ports 4397/4398/4399 not listening afterwards.

VISUAL: PASS — every [visual] state of rows 2.8, 4.7 and 8.7 captured at 1440×900 and 1024×768 (figure tiles, select, pattern row, flag row, come/go arrow, compare groups, coin tray, wallet, mid-drag, wrong payment, solution, E2 note tray, stand-ins); three discrepancies fixed (COMPARE_QTY groups stacked instead of left/right, heart drawn as three figures, "zł" orphaned in the solution strip); O1–O4 left as follow-ups; the E1.1 unlock card is unreachable and the first E1 card was judged instead
