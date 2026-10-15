# Visual review — final-art-salon (S-16a)

Run 2026-10-15-s16a-salon-art, visual gate after `MERGE: CLEAR`. Frames and route: `screenshots/README.md` (Playwright on the hook
build, port 4399, 1440×900 and 1024×768, the 1920×1080 canvas in FIT). Judged against the art pack `designs/martynka-expansion-v1`
(`screenshots/room-preset-0.png`: the full salon with the same pieces; `manifest.json` positions and `z`), the kit's unlock card and
design-gaps rows 22, 37, 39, 40, 108.

## Discrepancies and fixes

None needing a code change. Every [visual] state matches the pack or its design-gap row; the items below are observations.

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 4.7 | "Obrazki" in the parent panel, full art and `?e2eArt=room` | o01, o02 | Two lines under the heading: "Wszystkie obrazki zadań są wczytane." / "Wszystkie obrazki pokoju są wczytane."; with the seam "26 z 26 obrazków pokoju nie wczytało się. W pokoju zamiast obrazka jest napis. Uruchom grę ponownie." Numeral agreement right (26 → "obrazków", "wczytało się"). Fits at 1024 without clipping |
| 5.3 | Before the stage, after the stage, each slot empty → furnished, full room, holds, stand-ins | r01, r03, f-*, r06, r07, r08, s01–s05 | Before: neglected backdrop with worn furniture (`furnishingsBefore`). After: clean walls and floor, only lamp table, two plants and pouf. Each purchase adds one piece in its pack position. Full room matches `room-preset-0` piece for piece (only the HUD differs); soft shadows under the sofa, table, armchair and plants. Hold outline: a thick deep-teal rectangle on the slot's visible rectangle (gap 37). Stand-ins: labelled boxes in `z` order, room playable |
| 5.4 | No captions/placeholders on full art; `z` order | r06, f-*, x03 | No slot captions anywhere on full art. Rug under the armchair, pouf and coffee table; coffee table in front of the sofa; sofa in front of the frames (frames hang above its back, no overlap); pouf in front of the armchair; plant-right in front of the sofa arm |
| 6.4 | Variant panel per slot with variant 1, change mode, "Pokój gotowy!" | p-*, r09, r10, r05 | Thumbnails (`VariantPanel.show` crop) show the whole piece centred in each 200 px box for all six slots, including the wide rug and frames; names under them readable at 1024 (≈ 11-12 CSS px). The previewed piece is drawn in the room; the tray covers most of the coffee table and the rug's front (VO1). Change panel: same layout, "Wybieram" dimmed until a different look is previewed. Card: salon miniature in scale with the check mark; "Wkrótce" tile is the dashed teaser without a padlock because the next room is unlocked when the salon is done (`roomsListView`, gap 40) |
| 7.4 | Cross-fade mid-frame, sofa pop with particles, reduced motion | r02, r04, x02, m01, m02 | Mid-fade the neglected room is a translucent ghost over the renovated one. Sofa pop: the sofa scaled up (1.08) with a burst of small stars, settled in the next frame. Rug bought after the sofa pops UNDER the sofa (V2 of the earlier follow-ups no longer occurs). With `reducedMotion: 'reduce'` the stage and the sofa appear at once, no ghost, no scale, no particles. F1 (leave during the fade): coming back shows the settled room in the first captured frame; not observed at this capture latency |
| 8.3 | Loading screen, unlock card with the book | l01, u01 | Loading: ivory page, "Martynka urządza" in the fallback font, a turquoise bar in a deep-teal frame (drawn in code, DESIGN-GAP P2). Unlock card: butter frame, title, the counting icon `book` (gap 22), step name, "Dalej" |

## Hand-checked numbers (mandatory)

- Star counter through the full renovation, costs from `SALON.tasks` (5, 7, 9, 10, 12, 13, 15): 71 → stage 71 − 5 = 66 (r02/r03 show
  66 and "Postaw sofę ★ 7") → sofa 66 − 7 = 59 (r04, rug panel) → rug 59 − 9 = 50 (coffee-table panel) → table 50 − 10 = 40 (f-coffee-table,
  "Postaw komodę ★ 12") → cabinet 40 − 12 = 28 → armchair 28 − 13 = 15 (frames panel, "Powieś obrazki ★ 15") → frames 15 − 15 = 0 (card) ✓.
- Reduced motion: 12 − 5 = 7 (m01), 7 − 7 = 0, next task "Połóż dywan ★ 9" with "masz 0/9" (m02) ✓.
- x02: 30 − 5 − 7 − 9 = 9, "Postaw stolik ★ 10, masz 9/10" ✓.

## Fit and legibility on the 1024 tablet

Task button and "Wróć do notesu" ≈ 250×45 CSS px; thumbnails ≈ 107 CSS px; "Wybieram"/"Zamknij" ≈ 250×30 CSS px. The task label and the
star cost do not touch (p6 fix holds for "Odnów ściany i podłogę"). Nothing overlaps on full art. Stand-in labels may be hidden by other
stand-ins (VO2, missing-art state only).

## Observations (not fixed; follow-ups with triggers in `follow-ups/review-fixes.md`, section "From the visual gate")

- VO1: the variant tray covers most of the coffee table and the rug's front while previewing.
- VO2: overlapping stand-ins hide each other's labels with `?e2eArt=room`.
- VO3: the hold outline is a rectangle (the rug's crosses the armchair and sofa), gap 37.
- impl-review F1 not seen in frames; F2 (miniature with PARTLY missing art) is unreachable through a seam (`?e2eArt=room` drops all
  salon art, s05 shows a consistent all-stand-in miniature): code-reviewed only, follow-up stays.

## Gate in this step

No code changed, so the local gate was not re-run (the impl-review step observed it green on this tree: lint, typecheck, `npm test`
2939 = 2839 + 100, sample E1–E6, build, e2e 98). Port 4399 not listening afterwards; `tests/e2e/visual.local/` deleted.

VISUAL: PASS — every [visual] state of rows 4.7, 5.3, 5.4, 6.4, 7.4 and 8.3 captured at 1440×900 and 1024×768 (animation frames at 1440) and matching the expansion pack's salon and the gap rows; star arithmetic checked through the whole renovation; three observations (tray over previewed piece, stand-in labels overlapping, rectangular hold outline) left as follow-ups
