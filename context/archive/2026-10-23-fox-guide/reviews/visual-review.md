# Visual review for fox-guide

This is the visual gate of run 2026-10-23-fox-guide (slice `fix:fox-guide`). It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `b84b2cf`. The capture setup and every frame are listed in `screenshots/README.md`: Playwright on the hook build, port 4399, 1440×900 and 1024×768, 32 frames per width, plus the kit frame `kit-fox-poses.jpg`. Claude in Chrome was tried first and dropped (§ Decisions).

The frames were judged against:
- the `[visual]` rows 3.5 and 4.5 of `plan.md`;
- the kit frame `designs/martynka-fox-guide-v1/preview.png` (copied as `kit-fox-poses.jpg`) and the pack README;
- `scope.md` items 2-5 (corner of the notebook, never covers a task element, bead or HUD pill, three poses, soft pop, decorative only);
- the placement decisions P-1/P-2 and DESIGN-GAP 165-168.

## States

| Row | Frames | Verdict |
|---|---|---|
| 3.5 tiles idle / cheer / think | `tiles-idle`, `tiles-cheer-pop`, `tiles-cheer`, `tiles-think` | Idle at the start, cheer after the right tile (hook `pose: cheer`), back to idle at task 2, think after the wrong tile. The fox stands in the right margin astride the notebook's top-right corner: the left paw rests on the teal right frame line, the ribbon is left of it, the body is otherwise beside the paper. Nothing of the prompt, the pictures, the tiles, the feedback bar, the beads or the HUD pills is covered at either width. |
| 3.5 pop | `tiles-cheer-pop` (110 ms after the tap) vs `tiles-cheer` | At 110 ms of the 240 ms pop (scale 1.06, `Sine.easeOut`) the fox is barely larger than at rest: the change reads as a soft nudge, not a jump. The hook counts the pops (11 and 13 over the word round). |
| 4.5 keypad second try | `keypad-idle`, `keypad-think` | Think after the miss; the keypad, the entry field and "Spróbuj jeszcze raz" are clear of the fox. |
| 4.5 solution, retype | `solution-think`, `solution-step-2/3`, `retype-think` | Think through the solution steps and the retype. The step lines and "Następny krok" sit left of the notebook's right edge; the fox is clear of them. |
| 4.5 select, drag, clock, coins, digits | `select*`, `drag-blocks*`, `clock-set`, `coins`, `digits` | Each widget (tile row with OK, tray and mat with OK, clock with OK, wallet with tray and OK, written column with keypad) is inside the paper; the drag tray, the coin tray and the keypad's right column end well left of the fox. Cheer after the blocks were built. |
| 4.5 tall picture, hint number line | `tall-tiles`, `tall-solution`, `hint-numberline` | The thermometer sits at the left; the solution line ("Znajdź koniec słupka…") and the hint number line are clear of the fox. |
| 4.5 word, dice, puzzle | `word`, `dice`, `puzzle` | The HUD title ("Ukryte słowo", "Kostki · 0–12", "Zagadka dnia ×2") sits in the bead slot, far left of the fox; the letter row, dice board and puzzle keypad are clear. |
| 4.5 warm-up | `warmup` | 6 beads, the rightmost ends far left of the fox. |
| 4.5 summary, minigame card | `summary-cheer`, `minigame-done` | Cheer on both. The cheer (eyes closed, paws up, small star) reads naturally next to "Brawo!" and the star row; on the minigame card next to "Brawo! STOLIK +6". The cheer on a 0-star summary was not reached (no route makes a 0-star round without five retypes); row 4.7 [human] keeps it. |
| 4.5 unlock, no art | `unlock`, `no-fox-art` | No fox on "Nowa umiejętność!" (hook `visible: false`), none with `?e2eArt=ui`, and no stand-in box in its place: the margin is plain backdrop. |
| 4.5 settings hint | `settings-hint` | The bubble "Przytrzymaj, żeby otworzyć ustawienia rodzica" sits next to the gear at the bottom right; the fox is far above it. |
| 4.5 portrait | `portrait-overlay` | "Obróć tablet" covers the whole page, fox included. |
| Kit | `kit-fox-poses` vs every frame | The three poses on screen are the kit's idle, cheer and think, same scale and the same anchor (no jump of the feet between poses). |

## Hand-checked values (mandatory)

- **`guide.rect` against the drawn fox** (`rect-check`, `rect-check-zoom`, both widths): the hook reports `{x 1714.5, y 180, width 188.125, height 220}`.
  - From `GUIDE`: scale s = 320 / 1024 = 0.3125. Left = 1792 + (264 − 512)·s = 1792 − 77.5 = **1714.5**. Right = 1792 + (866 − 512)·s = 1792 + 110.625 = 1902.625, width **188.125**. Top = 400 + (196 − 900)·s = 400 − 220 = **180**, height **220**. All four equal the hook.
  - On the page at 1440×900 the canvas is 1440×810 at y 45 (scale 0.75): x 1714.5·0.75 = 1285.9, y 45 + 180·0.75 = 180, 141.1 × 165, as logged. At 1024×768 (scale 0.5333, canvas at y 96): x 914.4, y 192, 100.3 × 117.3, as logged.
  - In the zoomed frames the magenta outline touches the ear tips at the top, the paws at the bottom and the tail tip at the right; the left edge meets the left paw. The drawn fox and the rect agree.
- **Clearances read off the frames**: the star counter pill ends above the rect's top (its bottom ≈ 157 scene, rect top 180); the speaker and counter pills, the ribbon and every bead are left of or above the rect; the paper content of every mode ends left of x 1700.
- **Summary counter**: hook outcomes [first, retype, first, first, first], `starPerTask` 1, no clean bonus with a retype: 4 × 1 + 0 = **4**, as drawn in `summary-cheer` ("+4", counter 4).

## Designer's read

- **Scale and sharpness**: the 320 px image (silhouette about 188 × 220 scene px) is a companion, not a character: about twice the height of the star counter pill, much smaller than the notebook. The 384² WebP is sharp at 1440 (fox about 141 px on screen) and at 1024 (about 100 px); edges are clean, no halo on the green backdrop.
- **Belonging**: the art pack's soft lighting and outline match the game's flat paper and backdrop. The fox does not float: the left paw rests on the notebook's right frame line, so it reads as perched at the notebook's corner. It sits beside the corner rather than on the paper, which is the P-2 reading the maintainer still has to accept (row 4.6, fallback F5).
- **Pop**: soft and short; no frame shows overshoot or a jump of the feet.

## Discrepancies fixed

None. No frame showed a covered task element, bead or HUD pill, a wrong pose, a stand-in box, or a fox where it must not be.

## Observed, not this slice

- Row 3.5 says "feet at the frame line"; the fox's feet are at y 400 beside the notebook's right frame line (paw on the line), not on the top frame line (y ≈ 204). This is the placement of P-2 / DESIGN-GAP 165, left to the maintainer in row 4.6.

## Decisions

- Claude in Chrome was tried first (own tab, then closed). The game stopped at the slow-save card: another tab of the same origin held IndexedDB, as in the notebook-polish gate. I used the Playwright fallback with fresh contexts. Would change: a Chrome profile with no other tab on `localhost:4399`.
- The portrait check resized the Playwright page to 420×760 instead of using the iframe of profile § 9 (that trick exists because Chrome ignores window resize; Playwright does not). Would change: an overlay that behaves differently inside an iframe.

## Not covered

- Row 4.6 [human]: the place and size of the fox.
- Row 4.7 [human]: a real tablet, the feel of the pop, and the cheer on a 0-star summary.

VISUAL: PASS — every [visual] state of rows 3.5 and 4.5 was captured at 1440 and 1024 through the product next to the kit's poses. The fox poses follow the round (idle, cheer, think, cheer on both cards, absent on the unlock card and without art), `guide.rect` equals the drawn fox and the `GUIDE` arithmetic (1714.5, 180, 188.125 × 220), and nothing of any task element, bead or HUD pill is covered in any frame.
