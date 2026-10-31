# Screenshots for the kitchen-room visual gate (plan rows 4.5 and 7.6)

Captured on 2026-10-31 on `7e1441f`, the build id drawn in the corner of the task frames. The working tree was clean, so every frame shows that commit. The frames are PNG, desktop 1440×900 and tablet 1024×768: 28 frames over 16 states. A state seen at one width only is marked with a dash.

## Route

The capture used Claude in Chrome, the browser the maintainer selected at preflight, in its own tab, which was closed at the end. It ran against the e2e-hook dev server on the visual port: `E2E_HOOK=1 npx vite --config vite/config.dev.mjs --port 4399 --strictPort --host ::`. The server was killed at the end. Playwright was not used, and ports 4397/4398 were not touched.

- **Fresh device.** The origin `http://127.0.0.1:4399` had no IndexedDB databases and no localStorage. This was checked with `indexedDB.databases()`, which only reads. The parent tab showed `/graj/favicon.png`, so no second game page competed for the save. The game ran only in a same-origin `<iframe>`. Nothing was written to storage by hand.
- **Viewports.** The Chrome viewport is 1512×717. The iframe was exactly 1440×900, drawn at a CSS scale of 0.78, or 1024×768 at 0.93. At each state it was switched between the two sizes, so both widths of a state show the same game state. Each frame is a `zoom` capture of the iframe region (1389×868 or 1269×952), resampled with Pillow to its native size. Small resampling softness is expected; the layout is unaffected.
- **Input.** Taps are pointer and mouse events dispatched on the iframe's canvas at the hook's read-only `targets`, mapped from the 1920×1080 scene. These go through Phaser's input like a tap. The adult gate and the stage panel are DOM dialogs; their buttons were clicked. Now and then a tap right after a scene change or a panel close was not taken, and the same tap repeated a second later was. One tap on "Salon" was missed this way and the next worked. The Playwright spec `kitchen-room.spec.ts` covers the real touch path.
- **Reaching the states.**
  1. Open `?e2eStars=200&e2eVariant=off&e2eSkills=E3.2.add_sub_20_bridge`. 200 is 129 for the salon tasks plus 71 for the kitchen tasks in `src/data/rooms.ts`. Then tap "Rodzic", answer the gate (14 · 18 = 252), and choose "10+" and "Klasa 2, I półrocze".
  2. Answer the first task right (+1 star, 201). Open the room switch. Buy the 12 salon tasks with the first look each. The card opens (frame 01).
  3. Tap "Dalej". The kitchen loads at runtime: `roomLoad.settled` is `['kitchen']`, `roomArtHealth` is 21/0 missing, and the save is clean (frame 02). Buy the stage (03).
  4. Buy the counter (look 1), the fridge (2) and the table (0) (04). Open the coffee corner panel and preview look 2 (05). Choose it, then buy the bench with look 1 (06).
  5. Reload the iframe without `e2eStars` to get the task screen with the kitchen as the current room (07). Answer right (+1). Open the room switch, tap the gear once to get the hint (08), then tap "Salon" (09).
  6. Tap "Zmień wygląd", tap the sofa, preview "Słoneczna" (11) and choose it, which is free (10).
  7. Tap "Kuchnia" and buy the rack with look 1. The kitchen card opens (12). Tap "Dalej" (13). Tap "Zmień wygląd", tap the fridge and preview "Naturalna" (14). Choose it (15).
  8. Reload with `?e2eArt=room`, answer, and open the room switch (16).

## Frames

| # | State | Desktop 1440 | Tablet 1024 | Hook facts |
|---|---|---|---|---|
| 01 | Finished salon's celebration card: salon tile with check, kitchen tile with its before miniature, "Dalej" (row 4.5 settled card, 7.6 (1)) | `desktop-01-salon-done-card.png` | `tablet-01-salon-done-card.png` | `card.items` salon done, kitchen not done and unlocked; `celebration {room, revealMs 1200, burst 22}`; stars 72 |
| 02 | Kitchen before its stage, with the "Salon" visit button (7.6 (2), (8)) | `desktop-02-kitchen-before.png` | `tablet-02-kitchen-before.png` | `currentRoom kitchen`, `tasksDone 0`, next task "Odnów ściany i podłogę ★5" |
| 03 | Kitchen after the stage (7.6 (3)) | `desktop-03-kitchen-after-stage.png` | `tablet-03-kitchen-after-stage.png` | stars 67, next "Postaw szafki ★7" |
| 04 | Kitchen with counter (sunny), fridge (mint), table (natural) (7.6 (4)) | `desktop-04-kitchen-some-furniture.png` | `tablet-04-kitchen-some-furniture.png` | stars 41, next "Urządź kącik kawowy ★12" |
| 05 | Buy panel for the coffee corner, "Miętowy" previewed | `desktop-05-kitchen-buy-panel-coffee.png` | `tablet-05-kitchen-buy-panel-coffee.png` | `panel {open, buy, set-up-coffee, preview 2}`; the visit button is hidden while the panel is open |
| 06 | Bench (sunny) joined to the counter (7.6 (4), gap 181) | `desktop-06-kitchen-bench-joined.png` | `tablet-06-kitchen-bench-joined.png` | stars 16, next "Ustaw naczynia ★15" |
| 07 | Task screen while the kitchen is current (7.6 (6)) | `desktop-07-task-backdrop-kitchen.png` | `tablet-07-task-backdrop-kitchen.png` | `backdrop {mode salon, drawn, blurred, webgl}`, `backdropPixel` [221, 206, 183]; the diorama lies under the notebook (gap 182) |
| 08 | Kitchen, gear hint bubble next to the "Salon" visit button (7.6 (8)) | — | `tablet-08-kitchen-visit-button-gear-hint.png` | `settingsHint true`; hint is shown once per page load for 3 s |
| 09 | Visited salon from the kitchen ("Kuchnia" button, "Zmień wygląd") (7.6 (8)) | `desktop-09-salon-visited.png` | `tablet-09-salon-visited.png` | `visiting salon`, `currentRoom kitchen`, no task button |
| 10 | Visited salon in change mode ("Gotowe" + "Kuchnia") (7.6 (8)) | `desktop-10-salon-visited-change-mode.png` | `tablet-10-salon-visited-change-mode.png` | after "Wybieram": stars 17 kept, `salon.chosen.sofa` 0 → 1 |
| 11 | Visited salon change panel, sofa "Słoneczna" previewed | `desktop-11-salon-visited-change-panel.png` | — | `panel {open, change, sofa, preview 1}` |
| 12 | Kitchen's own card: two done tiles (7.6 (5)) | `desktop-12-kitchen-done-card.png` | `tablet-12-kitchen-done-card.png` | items salon done and kitchen done; stars 2 |
| 13 | Finished kitchen ("Zmień wygląd", "Salon") (7.6 (5)) | `desktop-13-kitchen-done.png` | — | `mode normal`, `card null` |
| 14 | Kitchen change panel, fridge "Naturalna" previewed (7.6 (5)) | `desktop-14-kitchen-change-panel-fridge.png` | `tablet-14-kitchen-change-panel-fridge.png` | `panel {open, change, kitchen-fridge, preview 0}` |
| 15 | Kitchen change mode after a free change ("Gotowe") | — | `tablet-15-kitchen-change-mode.png` | stars 2 kept, `kitchen.chosen.kitchen-fridge` 2 → 0 |
| 16 | Forced miss `?e2eArt=room`: kitchen stand-ins (7.6 (7)) | `desktop-16-kitchen-forced-miss-standins.png` | `tablet-16-kitchen-forced-miss-standins.png` | `roomArtHealth` 21/21 missing; stars 3 (one more right answer) |

## Kit frames compared

- `designs/martynka-locations-v2/previews/kitchen-before.png` against frame 02.
- `designs/martynka-locations-v2/screenshots/kitchen-room-1.png` (sunny) against frames 04, 06 and 13.

## Not captured

- **Reduced motion** (rows 4.5 and 7.6 (1)). Claude in Chrome cannot emulate `prefers-reduced-motion`. The path is covered by `tests/reducedMotionWiring.test.ts` and the celebration unit tests.
- **The salon's last-purchase pop, the burst in flight and the hold of a finished room** (row 4.5). The capture follows the hook's state, so the burst is over by then, and a long press cannot be driven from Claude in Chrome (profile § 8).
- **The HUD room switch on the task screen between tasks.** This HUD control did not change in S-22.
