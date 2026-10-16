# Visual review — salon-extra-slots (S-16d)

Run 2026-10-15-fix-s16bcd, visual gate after `MERGE: CLEAR`. Frames and route: `screenshots/README.md` (Playwright on the hook
build, port 4399, 1440×900 and 1024×768, the 1920×1080 canvas in FIT). Judged against the salon-v2 pack
(`designs/martynka-salon-v2/screenshots/salon-before.png`, `architecture-after-no-curtains.png`, `salon-preset-0.png`,
`variants-{curtains,wall-shelf,lamp-table,plant-left,pouf}.png`), plan row 3.7, impl-review F1/F3/F5 and the follow-ups VO1–VO3.

## Discrepancies and fixes

None needing a code change. Two observations added as follow-ups (VG-1, VG-2 in `follow-ups/review-fixes.md`).

## States

| Plan row 3.7 item | Frames | Verdict |
|---|---|---|
| Before the stage, curtain-less worn room | r01 | Worn walls, scuffed furniture; the window has the rod and no curtains. The pack's `salon-before.png` still shows curtains; the game uses the curtain-less architecture by the author's decision (roadmap S-16d), so this is the intended difference |
| After the stage: old lamp, left plant, pouf; no curtains, no shelf | r02 | Matches `architecture-after-no-curtains.png` walls and floor; lamp (Klasyczna), monstera and the yellow pouf drawn as variant 0; window bare, wall above the cabinet empty; right plant fixed |
| Old salon done (7 tasks) | r03 | Room from S-16c with the old lamp/plant/pouf, no shadows and no "Zmień wygląd" (F1, author-accepted); button "Powieś zasłony ★ 8" |
| Five panels, variant previewed | p-* | Each previewed variant is drawn in its place (linen curtains at the window, mint shelf above the cabinet, wicker lamp, fern, knit pouf). Thumbnails fit their 200 px boxes, including both curtain halves; names (Listkowe/Lniane/Botaniczne, Dębowa/Miętowa/Z łukiem, Klasyczna/Wiklinowa/Kwiatowa, Monstera/Paproć/Fikus, Pikowana/Pleciona/Na nóżkach) readable at 1024. The tray covers the pouf (VO1, known) |
| Curtains above the shadows; shelf behind the cabinet | f-curtains, f-wall-shelf, r05 | Curtains hang from the rod down behind the monstera and the cabinet, as in preset 0. The shelf sits on the wall behind the cabinet's plants (books visible between them), as in preset 0 |
| Full room with shadows | r05 | Piece for piece the pack's `salon-preset-0.png` (only the HUD differs). Shadows: a pixel diff r03 → r05 is non-zero only under the armchair, the sofa's right legs, the right plant and the floor in front of the cabinet (mean ΔL 2–2.6 there, 0.0 on the wall) — the soft shadow layer is drawn and stays under every piece and under the curtains |
| Hold outline on the curtains | r06 (desktop) | Deep-teal rectangle on the curtains' visible rectangle; its top edge lies above the canvas, so three sides show (VG-2). The hold point (728, 10) is inside the scene. Release opens the change panel (r07) with "Wybieram" dimmed until another look is previewed; Botaniczne previewed at 0 stars |
| "Pokój gotowy!" at task 12 | r04, r04-tile | Card appears at the 12th purchase, live miniature with the green curtains, check mark, "Wkrótce" teaser, "Dalej". F5 seen: the curtain rings reach ≈ 5 CSS px above the miniature picture at 1440 (≈ 9 scene px × 0.75 = 7 px predicted), on the tile padding, inside the tile border, clear of the check mark and caption → observation VG-1, not fixed |
| Room-task button labels | r01–r03, f-* | "Powieś zasłony ★ 8", "Powieś półkę ★ 10", "Wymień lampę ★ 12", "Wymień roślinę ★ 13", "Wymień pufę ★ 15"; label and cost never touch at either width |
| Stand-ins (`?e2eArt=room`) | s01, s02 | Room playable with boxes; lamp/plant/pouf boxes opaque with captions ("roślina Monstera", "pufa Pikowana", F3 known) and labels hidden by overlaps (VO2 known). The done card uses the pack thumbnail (`miniatureMode` 'thumbnail'), so no curtain overhang there; the 'drawn' mode needs the thumbnail missing too and has no seam: code-reviewed only |

## Hand-checked numbers (mandatory)

Total seeded = 5 + 7 + 9 + 10 + 12 + 13 + 15 + 8 + 10 + 12 + 13 + 15 = 71 + 58 = 129 (r01 shows 129).
Stage 129 − 5 = 124 (r02) → six old pieces 124 − (7 + 9 + 10 + 12 + 13 + 15 = 66) = 58 (r03, "Powieś zasłony ★ 8") →
curtains 58 − 8 = 50 (f-curtains, "Powieś półkę ★ 10") → shelf 50 − 10 = 40 (f-wall-shelf, "Wymień lampę ★ 12") →
lamp 40 − 12 = 28 (f-lamp-table) → plant 28 − 13 = 15 (f-plant-left, "Wymień pufę ★ 15") → pouf 15 − 15 = 0 (r04, r05) ✓.
Every panel frame shows the balance before the purchase (58, 50, 40, 28, 15): preview spends nothing ✓. The change of the curtains
after completion keeps 0 ✓. Same values logged from the hook at both widths.

## Fit and legibility on the 1024 tablet

Task button and "Wróć do notesu" ≈ 250×45 CSS px; panel thumbnails ≈ 107 CSS px with readable names; "Wybieram"/"Zamknij" ≈ 250×30.
Nothing new overlaps except the known tray-over-pouf (VO1).

## Autonomous decisions

- F5 / VG-1 judged an observation, not a defect: the overhang stays inside the tile and is ≈ 5 CSS px; a fix needs clipping in
  `drawRoomMiniature` (mask or per-image crop) with its own test. Would change: the author or the iPad check (human row 8.4) finding
  it distracting, or the overhang crossing the tile border.
- Playwright instead of Claude in Chrome (profile § 8: canvas touches and the long press cannot be driven synthetically).

## Gate in this step

No code changed, so the local gate was not re-run (the impl-review step observed it green on `063e7fd` + docs). Port 4399 not
listening afterwards; `tests/e2e/visual.local/` deleted.

VISUAL: PASS — every item of row 3.7 captured at 1440×900 and 1024×768 and matching the salon-v2 pack (before, curtain-less after, preset 0, five variant sets); star arithmetic 129 → 0 checked across the five new purchases (8, 10, 12, 13, 15); two cosmetic observations (miniature curtain overhang ≈ 5 px, hold outline top off-canvas) left as follow-ups
