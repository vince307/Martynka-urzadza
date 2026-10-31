# Screenshots for the house-cross-section visual gate (plan row 5.6)

Captured on 2026-10-31 from the hook build of `15a086f` (the depth fix found by this gate), served by `vite preview` from a freshly rebuilt `dist-e2e/` (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) on the visual port 4399. PNG, desktop 1440×900 and tablet 1024×768: 24 game frames over 12 states, plus the two pack frames (`kit-*`).

## Route

Playwright fallback (`visual-gate.md` § 2) with a throwaway spec reusing `tests/e2e/support/{hook,salon,welcome}.ts`, kept outside the repository after the run. Two projects (desktop 1440×900, tablet 1024×768, Chromium, `hasTouch`), one worker. Every test is a new browser context, so a fresh device. Taps are Playwright touch taps at the hook's read-only targets; nothing was written to IndexedDB. The parent path of the welcome screen (gate + "10+" + "Klasa 2, I półrocze") is `passWelcome`.

- **A (frames 01, 02, 08a, 03):** `?e2eStars=40&e2eVariant=off`, one task solved by the retype (no star), "Do pokoju" → salon (01). "Dom" → house (02). "Wróć do pokoju", buy the stage (5), open the sofa panel and preview look 1 "Słoneczna" (08a), "Wybieram" (7), buy the rug with look 2 (9). "Dom" → house (03).
- **B (frames 08b, 04a, 04, 05a, 05, 05b):** `?e2eStars=200` (salon 129 + kitchen 71), `finishSalon` buys all 12 salon tasks with look 0 → the celebration card (08b). "Dalej" → kitchen in renovation (04a). "Dom" → house (04). Tap the salon cell → the salon on a visit (05a). "Zmień wygląd" → change mode (05). Tap the sofa → change panel (05b).
- **C (frame 06):** as A with `?e2eArt=house` → house with the stand-in shell.
- **D (frame 07):** as A, Chromium launched with `--disable-webgl --disable-webgl2 --disable-3d-apis` (the flags of `tests/e2e/canvas-renderer.spec.ts`) → house under Canvas.

Each shot waits 1.8 s after the state is reached in the hook, so tweens and reveals have settled. On the house, the shot waits for the miniature pixel of the opened cells to be opaque (`housePixel` alpha 255).

## Frames

| # | State (plan row 5.6 item) | Desktop 1440 | Tablet 1024 | Hook facts |
|---|---|---|---|---|
| 01 | Salon at the start with "Dom" (1) | `desktop-01-salon-start-dom-button.png` | `tablet-01-salon-start-dom-button.png` | stars 40, counter "40", `houseButton` (1750, 224) |
| 02 | House at the start: salon current with frame, three closed cells "Wkrótce" (2) | `desktop-02-house-start.png` | `tablet-02-house-start.png` | cells current/closed/closed/closed, salon `mode live` |
| 03 | House, salon partly furnished: stage, sofa "Słoneczna", rug look 2 (3) | `desktop-03-house-salon-partly-furnished.png` | `tablet-03-house-salon-partly-furnished.png` | stars 19, `tasksDone` 3 |
| 04a | Kitchen in renovation with "Dom" after the salon card | `desktop-04a-kitchen-current-dom-button.png` | `tablet-04a-kitchen-current-dom-button.png` | `currentRoom kitchen`, first task "Odnów ściany i podłogę" |
| 04 | House: salon done, kitchen current with frame (4) | `desktop-04-house-salon-done-kitchen-current.png` | `tablet-04-house-salon-done-kitchen-current.png` | cells done/current/closed/closed, both `mode live`, stars 71 |
| 05a | Salon opened from the house (a visit) | `desktop-05a-salon-visited-from-house.png` | `tablet-05a-salon-visited-from-house.png` | `visiting salon` |
| 05 | The visited salon in change mode ("Gotowe") (5) | `desktop-05-salon-visited-change-mode.png` | `tablet-05-salon-visited-change-mode.png` | `mode change` |
| 05b | The visited salon's change panel for the sofa | `desktop-05b-salon-visited-change-panel.png` | `tablet-05b-salon-visited-change-panel.png` | `panel open`, no "Dom" |
| 06 | House under `?e2eArt=house`: the stand-in shell (6) | `desktop-06-house-stand-in-shell.png` | `tablet-06-house-stand-in-shell.png` | `artFallbacks.house 'drawn'`, `shellReady false` |
| 07 | House under Canvas: miniatures visible (7) | `desktop-07-house-canvas.png` | `tablet-07-house-canvas.png` | `artFallbacks.worn 'ungraded'`, `shellReady true`, salon pixel alpha 255 |
| 08a | Salon with the variant panel open, no "Dom" (8) | `desktop-08a-room-panel-open-no-dom.png` | `tablet-08a-room-panel-open-no-dom.png` | `houseButton` null, preview 1 |
| 08b | Salon with the celebration card, no "Dom" (8) | `desktop-08b-room-celebration-card-no-dom.png` | `tablet-08b-room-celebration-card-no-dom.png` | `houseButton` null, stars 71 |
| kit | Pack frames, read only | `kit-house-with-dioramas.png`, `kit-house-empty.png` | — | copies of `designs/martynka-house-street-v1/screenshots/` |
