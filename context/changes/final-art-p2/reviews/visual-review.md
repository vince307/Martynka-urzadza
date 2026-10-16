# Visual review — final-art-p2 (S-16c)

This is the visual gate of run 2026-10-15-fix-s16bcd, after `MERGE: CLEAR`. Frames and the route are in `screenshots/README.md`:
Playwright on the hook build, port 4399, 1440×900 and 1024×768, with the 1920×1080 canvas in FIT. The frames are judged against
the pack `designs/martynka-salon-v2`:
- `screenshots/loading-screen.png`
- `screenshots/counting-icons.png`
- `screenshots/app-icons.png`
- `assets/learning/wallet-open.png`

They are also judged against the plan's decisions 2, 4, 5 and 7 and gap rows 104, 105, 108, 112 and 115.

## Discrepancies and fixes

- **Loading title unclear over the background (row 5.4), fixed in `076c213`.** The deep-teal title "Martynka urządza" sat on the
  turquoise sofa of the blurred background. "urządza" was weak there, worst at 1024. The pack's title has a light outline.
  - `LoadingScreen.showArt` now gives the title an ivory outline (`PAGE_BACKGROUND`, `LOADING_LAYOUT.textStroke.title` 12) once
    the background is on screen.
  - `LoadingScreen.slow` gives the slow line one too (`textStroke.slow` 8).
  - The drawn screen keeps plain text (l03/l04).
  - Re-shot as l01/l02: both texts read clearly over the sofa and the rug.
  - Gate after the fix:
    - lint, typecheck: OK
    - `npm test`: 3063 = baseline 3034 + 29, the same as at 04863b9 (no test change)
    - deploy scripts, `sample` E1–E6: OK
    - build: `e2e hook: absent (2 chunks checked)`
    - e2e specs touching the loading screen, `--workers=4`: 8 passed (`final-art-loading`, `load-and-tab-guard`, `salon-load-health`)

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 4.4 | MONEY_PAY E1/E2 on the pack wallet | w01–w11 | See the notes below this table. |
| 4.4 | Held coin, FIRST of two equal (handoff §5) | w07, w08 | The two 2 zł coins sit at the hook's cells 0 (558, 580) and 1 (708, 580). With the finger holding cell 0's coin 150 px up, cell 0 is empty, the coin is under the finger above the clasp, and cell 1 still shows its coin at 708 × 0.75 = 531 CSS px. The painted cell matches the hook, which is the paint check the e2e cannot make. |
| 4.4 | Drawn wallet fallback | w09 | Without `wallet-open.webp`, the S-14d dashed field shows with the coins in a row. It pays (spec #11). It looks plain (VO3). |
| 5.4 | Loading screen with art, with the slow line, and drawn | l01–l04 | See the notes below this table. |
| 6.3 | Unlock card | u01 | Butter frame, "Nowa umiejętność!", the pack notebook with the star and pencil (as in `counting-icons.png`), "Zegar: minuty i kwadrans", "Dalej". Nothing is cramped at 1024. |
| 6.3 | "Pokój gotowy!" live / thumbnail / drawn | d01, d02, d03 | See the notes below this table. |
| (5) | COUNT with the new icons | i01 plate/box/sticker | Plate, box and sticker match the pack icons. The prompts agree with the numerals: "Ile jest talerzy?", "Ile jest pudełek?", "Ile jest naklejek?". Counts 4, 5 and 6 match `answer` in the hook log, and the right tile is present. |
| (7) | App icons | `public/icons/*.png`, `public/favicon.png`, `icon-maskable-safe-circle.jpg` | `icon-192`, `icon-512`, `apple-touch-icon-180` and `favicon` are the pack app icon (sofa, plant, picture, rug on a gradient). The maskable icon is the pack's maskable on ivory. Measured from the centre, its farthest non-background pixel is at 165.7 px, against a safe radius of 204.8 px (80 %), with 0 pixels outside. The [human] row 7.4 (iPad and Android launcher) stays open. |

Row 4.4, MONEY_PAY E1/E2 (w01–w11):
- The pack wallet matches `wallet-open.png`: turquoise purse, gold frame, clasp.
- The six places form a 3 × 2 grid inside the opening. A coin sits centred in its place.
- The 10 zł note fits its place with no overlap (w11).
- A full wallet dims the tray to 0.45 (w06, w11). It is clearly dimmer, and the coins stay recognisable.
- The touch box of a coin in the wallet is 144 × 104 game px, which is 77 × 55 CSS px at 1024. That is above 44 px. The coin picture inside the box is smaller than in the tray (VO1).
- After a miss, the yellow feedback bar "Spróbuj jeszcze raz / Połóż największą monetę, która nie jest za duża." draws over the wallet's lower edge (w04).
- Nothing is clipped at 1024.

Row 5.4, the loading screen (l01–l04):
- The background fills the canvas, letterboxed in ivory by FIT.
- The emblem (house with sofa) is 300² above the title. The bar is below the title. The slow line "Jeszcze chwilka, wczytuję obrazki." is centred under the bar.
- After the fix, the title and the slow line have an ivory outline.
- The composition is the plan's, not the pack preview's (VO2).
- With `stallall` and the loading pictures never answered, the drawn screen shows: ivory, title, bar, and the slow line after 8 s. The hook logs `art: { background: false, emblem: false }`.

Row 6.3, "Pokój gotowy!" (d01–d03):
- Live (d01): the child's salon in miniature, with the check mark, "Salon", the dashed "Wkrótce" tile and "Dalej" over the finished room.
- Thumbnail (d02): `salon-after` shows in the tile, and the room behind it is stand-in boxes.
- Drawn (d03): the miniature of the stand-in boxes, consistent with the room.
- All three hook choices match: `live`, `thumbnail` and `drawn`.

## Hand-checked numbers (mandatory)

- w02, the coin total against the target. The prompt is "Zapłać 3 zł. Użyj jak najmniej monet." and the wallet holds 2 zł + 1 zł,
  so 200 + 100 = 300 gr = 3 zł, which is the target ✓. "Fewest" means two coins, since no single coin is worth 3 zł ✓.
  "OK" ends the task as `first` (w03), and the star counter goes 0 → 1 (w04) ✓.
- w11 (E2): 10 + 5 + 2 + 1 + 1 + 1 = 20 zł in six places, which is the `money_pay_20` maximum.
  `balance.coinDrag.maxTotal` is 6, and the tray is dimmed ✓.
- w06: 6 × 1 zł = 6 zł against the target 10 zł. The wallet is full, so it cannot be overpaid by a seventh coin. Spec #11 shows the seventh flies back.

## Observations (not fixed; follow-ups with triggers in `follow-ups/review-fixes.md`, section "From the visual gate")

- VO1: a coin in the wallet is drawn smaller than in the tray. The touch box is fine.
- VO2: the loading composition follows the plan's layout, not the pack preview's large central emblem with the title at the bottom.
- VO3: the drawn wallet fallback is a plain dashed field.

## Gate in this step

- Fix `076c213`: full local gate re-run (above). The full e2e suite was not re-run here, because the fix only changes the text
  style of the loading widget. The three boot specs that draw it are green, and the full run at 04863b9 was 117 passed (inherited
  from impl-review, not re-observed).
- Port 4399 is not listening afterwards, and 4397/4398 are free.
- `tests/e2e/visual.local/` is deleted.

VISUAL: PASS — every [visual] state of rows 4.4, 5.4 and 6.3 was captured at 1440×900 and 1024×768: the wallet in all states, including the held first coin leaving its own cell empty and the drawn fallback; the loading screen with art, the slow line and drawn; the unlock notebook; "Pokój gotowy!" live, thumbnail and drawn. Also captured: the new count icons and the app icons, with the maskable motif at 65 % of the radius. One fix (`076c213`, a loading-text outline); the coin arithmetic was checked; three observations are left as follow-ups.
