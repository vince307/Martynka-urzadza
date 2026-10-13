# Screenshots — variant-change-room-done (S-10) visual gate

Captured 2026-10-13 with the Playwright fallback (Claude in Chrome not used, see `../reviews/visual-review.md`): a
throwaway spec in a gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`, service workers blocked,
`hasTouch`), reusing `tests/e2e/support/{welcome,hook}.ts`, against the e2e-hook build
(`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`
on the visual port 4399. The folder was moved out of the repo before the lint gate. Frames are at `a3dade4` (after this
step's caption fix; the code under the frames is that commit's tree, the build was made from it before the commit).

- `desktop-*` = 1440×900 viewport (canvas 1440×810, scale 0.75); `tablet-*` = 1024×768 (canvas 1024×576, scale 0.533).
- Every state was reached through the product: "Rodzic" → adult gate → age 10+ → "Klasa 2, I półrocze" (E3, no warm-up)
  with the e2e-only start balance `?e2eStars=40` or `?e2eStars=96`; the first task solved by the retype (pays 0), the HUD
  "Do pokoju", then taps on the task button, thumbnails and "Wybieram". The hold is a raw CDP `touchStart` on the hook's
  hold point of the slot, a screenshot 200 ms in (the hold threshold is 600 ms), then held until the panel opens and
  lifted. Nothing was written to the game state or IndexedDB. A fake Polish voice is installed before load, so the HUD
  speaker shows whenever there is narration.
- Reduced motion: `page.emulateMedia({ reducedMotion: 'reduce' })` before load.

| # | State | Desktop | Tablet | How reached |
|---|---|---|---|---|
| 01 | salon after 5 purchases (floor, walls, curtains, sofa, rug), 5 stars; captions | `desktop-01-salon-5-bought-captions.png` | `tablet-01-…` | `?e2eStars=40`, 5 × task button → thumbnail 1 → "Wybieram" (5+6+7+8+9 = 35) |
| 02 | hold on the rug, 200 ms in: thick deep-teal outline around the rug | `desktop-02-hold-outline-rug.png` | `tablet-02-…` | touchStart on `targets.slots.rug`; hook `hold: holding`, `heldSlot: rug` |
| 03 | change panel of the rug, no preview ("Wybieram" faded) | `desktop-03-change-panel-no-preview.png` | `tablet-03-…` | the same hold held past 600 ms; hook panel `{mode: change, slot: rug, preview: null}` |
| 04 | change panel, preview of variant 3 (butter, dots) in the room | `desktop-04-change-panel-preview.png` | `tablet-04-…` | thumbnail 3 |
| 05 | change frame ~120 ms after "Wybieram": the rug pops over the sofa (V2) with the star burst | `desktop-05-change-pop-rug-over-sofa.png` | `tablet-05-…` | "Wybieram" |
| 06 | salon after the change: butter rug, balance still 5, task button "Postaw stolik ★10 / masz 5/10" | `desktop-06-salon-after-change.png` | `tablet-06-…` | 1.5 s later |
| 07a | normal motion, 100 ms after the last "Wybieram": pop + burst on the picture, no card yet | `desktop-07a-card-frame-100ms.png` | `tablet-07a-…` | `?e2eStars=96`, 9 purchases, then the picture (15) |
| 07 | "Pokój gotowy!" card: Salon tile (miniature, check mark), dashed "Wkrótce" tile, "Dalej"; balance 0 | `desktop-07-room-done-card.png` | `tablet-07-…` | 1.2 s after the card appeared |
| 08 | done room after "Dalej": "Zmień wygląd" in the task button's place, no speaker (no narration) | `desktop-08-done-room-zmien-wyglad.png` | `tablet-08-…` | "Dalej" |
| 09 | change mode: the button reads "Gotowe", the HUD speaker appears (it reads the hint) | `desktop-09-change-mode-gotowe-hint.png` | `tablet-09-…` | "Zmień wygląd" |
| 10 | change panel opened by a plain tap on the sofa in the change mode | `desktop-10-change-panel-from-tap-sofa.png` | `tablet-10-…` | tap on `targets.slots.sofa` |
| 10b | change mode after changing the sofa: butter sofa, balance 0, still "Gotowe" | `desktop-10b-change-mode-after-change.png` | `tablet-10b-…` | thumbnail 3, "Wybieram", 1.5 s |
| 11 | reduced motion: hold outline on the rug | `desktop-11-reduced-hold-outline.png` | `tablet-11-…` | as 02, reduced motion |
| 12 | reduced motion: ~120 ms after "Wybieram" of a change: new rug at once, no pop, no particles | `desktop-12-reduced-change-frame.png` | `tablet-12-…` | thumbnail 2, "Wybieram" |
| 13 | reduced motion: 100 ms after the last "Wybieram" the card is already there | `desktop-13-reduced-card-100ms.png` | `tablet-13-…` | `?e2eStars=96`, 10 purchases (first look each) |

Kit: the kit has no hold view, change mode, "Pokój gotowy!" card or room list (DESIGN-GAP rows 37–41); the card follows
the unlock card's look (`designs/martynka-maths-A-v1/screenshots/unlock.png`, butter frame, title, one primary button),
compared read-only and not copied into the repo.
