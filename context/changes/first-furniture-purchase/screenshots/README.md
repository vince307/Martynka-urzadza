# Screenshots — first-furniture-purchase (S-09) visual gate

Captured 2026-10-13 with the Playwright fallback (Claude in Chrome was tried first, see `../reviews/visual-review.md`):
a throwaway spec in a gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`, service workers
blocked, `hasTouch`), reusing `tests/e2e/support/{welcome,hook}.ts`, against the e2e-hook build
(`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`
on the visual port 4399. The folder was moved out of the repo before the lint gate. Frames are at `9096a52` (the
build id drawn in the task screen corner; the room does not draw it), i.e. after the visual-gate fix.

- `desktop-*` = 1440×900 viewport (canvas 1440×810, scale 0.75); `tablet-*` = 1024×768 (canvas 1024×576, scale 0.533,
  letterboxed 96 px top and bottom).
- Every state was reached through the product: "Rodzic" → adult gate (product read from the dialog) → age 10+ →
  "Klasa 2, I półrocze" (E3, no warm-up), then taps on answer tiles / keypad keys, "Dalej", "Do pokoju", the room's
  task button, thumbnails and "Wybieram". Answers come from the read-only hook (e2e build only); nothing was written to
  the game state or IndexedDB. A fake Polish voice is installed before load (`fakePolishVoice`), so the HUD speaker shows.
- Reduced motion: `page.emulateMedia({ reducedMotion: 'reduce' })` before load.

| # | State | Desktop | Tablet | How reached |
|---|---|---|---|---|
| 01 | salon, 0 stars: task button short ("Napraw podłogę ★5 / masz 0/5"), speaker in the room | `desktop-01-salon-0-stars.png` | `tablet-01-…` | first task solved by the retype (2 misses, solution steps, retype: 0 stars), then the HUD "Do pokoju" |
| 02 | summary of a round with a mistake, "Do pokoju" not highlighted (balance 4 < 5) | `desktop-02-summary-mistakes-no-highlight.png` | `tablet-02-…` | "Wróć do notesu", "Dalej", 4 tasks right on the first try |
| 03 | task screen 300 ms after a right answer, normal motion (star in flight) | `desktop-03-task-star-flight-normal.png` | `tablet-03-…` | fresh load, first task right |
| 04 | summary of a clean round, "Do pokoju" highlighted (balance 7 ≥ 5) | `desktop-04-summary-clean-highlighted.png` | `tablet-04-…` | the rest of that round right on the first try |
| 05 | salon, 7 stars: task button active "Napraw podłogę ★5" | `desktop-05-salon-7-stars.png` | `tablet-05-…` | "Do pokoju" on that summary |
| 06 | variant panel open, no preview ("Wybieram" faded) | `desktop-06-panel-no-preview.png` | `tablet-06-…` | task button |
| 07 | previews 1, 2, 3 in the floor slot (chosen thumbnail lifted, thick border) | `desktop-07-panel-preview-{1,2,3}.png` | `tablet-07-…` | thumbnails 1, 2, 3 |
| 08 | purchase animation frame (~120 ms after "Wybieram": pop + star burst) | `desktop-08-purchase-animation-frame.png` | `tablet-08-…` | thumbnail 2, "Wybieram" |
| 09 | salon after the purchase: butter floor, 2 stars, "Pomaluj ściany ★6 / masz 2/6" | `desktop-09-salon-after-purchase.png` | `tablet-09-…` | 1.5 s later |
| 10 | reduced motion: task screen 300 ms after a right answer, no flying star | `desktop-10-reduced-task-no-star-flight.png` | `tablet-10-…` | fresh load with reduced motion |
| 11 | reduced motion: ~120 ms after "Wybieram", no pop, no particles | `desktop-11-reduced-purchase-frame.png` | `tablet-11-…` | clean round, "Do pokoju", task button, thumbnail 3, "Wybieram" |

Kit frame compared (read-only, not copied into the repo, as in earlier gates): `designs/martynka-maths-A-v1/preview.html`,
view "Pokój" (finished room art, a star note in the top left, "Wróć do notesu" centred at the bottom), captured at both
sizes into a temporary folder outside the repo. The kit has no screenshot of the room in `screenshots/` and no
task button, slots or variant panel (DESIGN-GAP rows 31–34).
