# Visual review for house-cross-section

This is the visual gate of run 2026-10-31-house-cross-section, slice S-23 `house-cross-section`. It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `2bbf72f`, and found one real fault, fixed in `15a086f`; every frame in `screenshots/` is from `15a086f`.

Capture: Playwright fallback against the rebuilt hook build (`dist-e2e/`, `E2E_HOOK=1`) served by `vite preview` on port 4399, desktop 1440×900 and tablet 1024×768. 12 states, 24 game frames, plus the pack frames. The route, the hook facts and every frame are listed in `screenshots/README.md`.

The frames were judged against:
- plan row 5.6 (items 1-8);
- the pack's house frames `designs/martynka-house-street-v1/screenshots/house-with-dioramas.png` and `house-empty.png` (copied as `kit-*`), and its `README.md` (draw order, opaque cells), read only;
- the S-22 gate frames (`context/archive/2026-10-31-kitchen-room/screenshots/`) for the rooms;
- the copy source `src/data/pl.ts`.

## Discrepancy found and fixed

**The house showed empty cells.** In the first capture (on `2bbf72f`) every cell of the real shell was plain cream: no salon or kitchen miniature, no roller blind, only the "Wkrótce" text, under WebGL and under Canvas alike. Under `?e2eArt=house` (stand-in shell) the salon miniature was visible. Cause: the pack shell `house-1-shell` has four opaque cells of `#FFF5DF` (pack README: "cztery kryjące komórki dokładnie #FFF5DF"; measured: pixel (480, 810) of the WebP is (255, 245, 223, 255)), and the pack README orders the drawing "skorupa, następnie całe płótna dioram ... ramka". `HOUSE_LAYOUT.depth` had `cells: 1, shell: 2`, so the shell covered the cells. The plan's own draw-order line ("background, miniatures/closed cells, shell, frame", under the `HouseView.render` contract) carried the same mistake, and the e2e check passed because `housePixel` reads the cell texture, not the screen.

Fix `15a086f` (`fix(house-cross-section): skorupa domu pod komórkami`): `HOUSE_LAYOUT.depth` is now `background 0, shell 1, cells 2, frame 3, teaser 4, controls 5`; the `HouseView` comment states the pack order; `tests/layout.test.ts` "draws the house shell under the cells" pins the order. Break: swapping the two depths back turned that test red (1 failed / 33 passed); restored. Meta-check: the test proves the depth tokens, which are the only thing that orders the shell and the cells (both are added through `HouseView.render` with these depths), so a regression of the order cannot pass it. The stand-in shell is unaffected: its outline and roof lie outside the cells, and its stairwell fill is between them.

## States (after the fix)

| Item | Frames | Verdict |
|---|---|---|
| (1) salon at the start, "Dom" | `*-01-salon-start-dom-button` | The worn salon before its stage. "Dom" is a primary pill under the star counter (gap 183), clear of the counter, the gear, "Wróć do notesu" and the task button; it overlaps only the third wall picture of the art, as the S-22 visit button did. |
| (2) house at the start | `*-02-house-start` | Matches `kit-house-with-dioramas.png` in shell, roof, stairs, door and cell places. The salon cell shows the live worn miniature (the pre-stage salon, muted grade) with the yellow frame; the other three cells show the pack's turquoise roller blind with "Wkrótce" (kitchen closed, decision P5, gap 188). "Wróć do pokoju" sits in the top-left corner above the roof, the counter top right. |
| (3) salon partly furnished | `*-03-house-salon-partly-furnished` | After the stage, the sunny sofa and rug look 2: the miniature is the after-state with exactly those pieces plus the fixed decor, matching the room. The rug stays inside the cell. The plan's "partly furnished before its stage" cannot occur (the stage is the first task); the worn grade is shown in (2), the partly furnished state here. |
| (4) salon done, kitchen current | `*-04-house-salon-done-kitchen-current`, `*-04a-kitchen-current-dom-button` | Salon cell: the finished salon (turquoise sofa, curtains, frames) on its green board (gap 190, human row 5.9). Kitchen cell: the pack's worn kitchen before-state on cream, with the frame. Same layout as the kit's lower row. The curtains and rug stay inside the salon cell (the miniature is captured at the cell size, nothing can spill). |
| (5) salon from the house, change mode | `*-05a-salon-visited-from-house`, `*-05-salon-visited-change-mode`, `*-05b-salon-visited-change-panel` | The visit shows "Zmień wygląd", then "Gotowe" with "Dom" kept; the change panel ("Morska / Słoneczna / Listkowa") hides "Dom". Stars stay 71. |
| (6) stand-in shell | `*-06-house-stand-in-shell` | Outline, stairwell and roof drawn in code, turquoise stand-in cells with "Wkrótce", the salon miniature with the frame (gap 189). The drawn roof is a thin sliver, not a gable (apex only about 24 scene px above its base); acceptable for a fallback, noted in follow-up 20. |
| (7) Canvas | `*-07-house-canvas` | The shell, the roller blinds and the salon miniature all draw under Canvas; the miniature is ungraded (`artFallbacks.worn 'ungraded'`, same as the room under Canvas, gap 173). |
| (8) no "Dom" under panel or card | `*-08a-room-panel-open-no-dom`, `*-08b-room-celebration-card-no-dom` | `houseButton` null in both, and nothing is drawn in its place. The card shows the salon (done) and kitchen tiles and "Dalej". |

Both widths show the same layout (`Scale.FIT` letterbox at 1024×768); no overlap or clipping at either width.

## Hand-checked number: the star counter

Costs from `src/data/rooms.ts`: salon 5+7+9+10+12+13+15+8+10+12+13+15 = **129**, kitchen 5+7+9+10+12+13+15 = **71**.

- Route A: seed 40; the first task solved by the retype pays 0, so **40** (counter "40" in frame 01). Stage 5, sofa 7, rug 9: 40 − 5 − 7 − 9 = **19**. The counter and the hook showed 19 (frame 03).
- Route B: seed 200 = 129 + 71, retype 0, all 12 salon tasks: 200 − 129 = **71** = the kitchen total. The counter showed 71 on the card (08b), in the house (04) and after the free change view (05).

## Not covered

- Reduced motion and real touch on a tablet: not part of row 5.6; the house has no tween. Human row 5.10 covers the tablet.
- Claude in Chrome was not used (see Decisions).
- Rows 5.7-5.10 [human] and the `(CI at ship)` rows 2.7 and 5.11 are not part of this gate.

## Decisions

- **Playwright fallback instead of Claude in Chrome.** Item (7) needs Chromium launched without WebGL, which Claude in Chrome cannot do, and items (2)-(5) and (8) need up to 13 purchases per width, which the repository's own hook helpers (`finishSalon`, `openHouse`, `housePixel`) drive deterministically through real touch input. Rejected: Chrome for some states and Playwright for others (two routes, same evidence). Would change: a defect visible only in the maintainer's Chrome profile.
- **Served the rebuilt hook build, not the dev server.** The first dev-server run kept serving the old `HOUSE_LAYOUT` after an in-place edit (the file watcher lost the file), so the final frames come from `dist-e2e/` rebuilt at `15a086f` and checked for the new depths in the bundle. Would change: nothing; a build is the closer evidence.
- **Item (3) read as "after the stage, partly furnished".** The stage is always the first task, so "furnished before the stage" does not exist; the worn grade is evidenced by (2). Would change: a plan author meaning a different state (e.g. the decor shown before purchase), which (2) also shows.
- **Fixed instead of a gap.** The pack README states the order and the opacity, so this was a code fault, not missing design.

VISUAL: PASS — after fix `15a086f` (the shell covered every cell; now drawn under them as the pack orders), all eight row-5.6 items were captured at 1440 and 1024 and match the pack's house frames: worn and furnished salon miniatures, the done salon and the kitchen before-state, roller blinds with "Wkrótce", the frame on the room in renovation, the visit in change mode, the stand-in shell, Canvas, and no "Dom" under the panel or the card; stars checked (40 → 19, 200 → 71).
