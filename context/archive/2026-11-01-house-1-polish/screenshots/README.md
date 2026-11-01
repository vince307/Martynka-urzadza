# Screenshots for the house-1-polish visual gate (plan row 5.6)

Captured on 2026-11-01 from the hook build of the branch at `1b6d4ed` (`E2E_HOOK=1 npm run build -- --outDir dist-visual.local`, a gitignored folder, so `dist-e2e/` on 4397 was never touched), served by `vite preview` on the visual port 4399 only. PNG, desktop 1440×900 and tablet 1024×768: 44 game frames over 22 shots, plus seven pack frames (`kit-*`).

## Route

Playwright fallback (`visual-gate.md` § 2) with a throwaway config and two specs in a gitignored `visual.local/` folder reusing `tests/e2e/support/{hook,salon,welcome}.ts` (the approach of the bathroom-room gate), moved to the session scratchpad after the run (before lint). Two projects (desktop, tablet; Chromium with `hasTouch`), one worker, own `webServer` on 4399: 10 tests passed. Every test is a new browser context (a fresh device). Claude in Chrome was not used (see `../reviews/visual-review.md`, Decisions).

- **A (14a, 07, 14b, 12, 01, 06a, 02, 03, 15, 10, 04, 13, 11, 05, 08):** house (`passWelcome`), `?e2eStars=213` (salon 129 + kitchen 84), `?e2eVariant=off`; task screen with the salon current (14a) → first task by the retype (0 stars) → room, salon before (07) → the stage and ten slots with look 0 → "Wróć do notesu", task screen with the renovated salon current (14b) → room, last slot → salon card (12) → "Dalej" → kitchen before (01) → "Posprzątaj kuchnię", frame 200 ms into the 600 ms cross-fade (06a) → stage 1 settled (02) → "Odnów ściany" (03) → task screen with the kitchen current (15) → "Dom" with the kitchen at stage 2 (10) → kitchen cell back to the room → "Odnów podłogę" (04) → six slots with look 0 → kitchen card (13) → "Dalej" (children's room current) → "Dom" (11) → kitchen cell, a visit (05) → "Dom" → salon cell, a visit (08).
- **B (06b):** reduced motion (`page.emulateMedia({ reducedMotion: 'reduce' })`), `?e2eStars=134` (salon 129 + 5), salon finished, "Dalej", "Posprzątaj kuchnię", frame 200 ms after the tap.
- **C (16):** `?e2eSave=v6-kitchen&e2eMonth=9&e2eVariant=off` (the frozen `tests/fixtures/save-v6-kitchen-mid.json`: v6, kitchen `tasksDone 3`, counter look 1, fridge look 2, 23 stars), first task answered right (+1), room.
- **D (17a-17d):** `?e2eArt=room`, `?e2eStars=147` (salon 129 + 5 + 6 + 7), salon finished on stand-ins, "Dalej", kitchen before (17a), then each stage (17b, 17c, 17d).
- **E (09):** separate spec with Chromium launched with `--disable-webgl --disable-webgl2 --disable-3d-apis` (as `tests/e2e/canvas-renderer.spec.ts`), `?e2eStars=5`, retype, room.

Each room shot waits until `roomLoad.pending` is empty (the house also `shellReady` and `houseView.pending` empty, the task screen `backdrop.drawn`), then 1.8 s; 06a and 06b are taken 200 ms after the tap on purpose.

## Frames

| # | State (row 5.6 item) | Desktop 1440 | Tablet 1024 | Hook facts |
|---|---|---|---|---|
| 01 | Kitchen before (1) | `desktop-01-kitchen-before.png` | `tablet-01-kitchen-before.png` | `tasksDone 0`, button "Posprzątaj kuchnię 5", counter 84 |
| 02 | Kitchen stage 1 (2) | `desktop-02-kitchen-stage-1.png` | `tablet-02-kitchen-stage-1.png` | `tasksDone 1`, button "Odnów ściany 6", counter 79 |
| 03 | Kitchen stage 2 (3) | `desktop-03-kitchen-stage-2.png` | `tablet-03-kitchen-stage-2.png` | `tasksDone 2`, button "Odnów podłogę 7", counter 73 |
| 04 | Kitchen after, empty (4) | `desktop-04-kitchen-after.png` | `tablet-04-kitchen-after.png` | `tasksDone 3`, button "Postaw szafki 7", counter 66 |
| 05 | Kitchen furnished (5) | `desktop-05-kitchen-furnished.png` | `tablet-05-kitchen-furnished.png` | visit, `tasksDone 9`, every `chosen` 0, "Zmień wygląd", counter 0 |
| 06a | Cross-fade, normal motion (6) | `desktop-06a-kitchen-fade-mid.png` | `tablet-06a-kitchen-fade-mid.png` | 200 ms after "Posprzątaj kuchnię"; counter already 79 |
| 06b | Stage change, reduced motion (6) | `desktop-06b-kitchen-stage-1-reduced-motion.png` | `tablet-06b-kitchen-stage-1-reduced-motion.png` | 200 ms after the tap, stage 1 in full; button "Odnów ściany 6 / masz 0/6", counter 0 |
| 07 | Salon before on cream (7) | `desktop-07-salon-before.png` | `tablet-07-salon-before.png` | `tasksDone 0`, button "Odnów ściany i podłogę 5", counter 213 |
| 08 | Salon after, furnished (8) | `desktop-08-salon-after.png` | `tablet-08-salon-after.png` | visit, `tasksDone 12`, every `chosen` 0, counter 0 |
| 09 | Salon before under Canvas (9) | `desktop-09-salon-before-canvas.png` | `tablet-09-salon-before-canvas.png` | `backdrop.renderer 'canvas'`, `artFallbacks.worn 'ungraded'`, counter 5 |
| 10 | House, salon done, kitchen stage 2 (10) | `desktop-10-house-salon-done-kitchen-stage-2.png` | `tablet-10-house-salon-done-kitchen-stage-2.png` | gold frame on ground-right; upper cells "Wkrótce"; counter 73 |
| 11 | House, salon and kitchen done (11) | `desktop-11-house-salon-kitchen-done.png` | `tablet-11-house-salon-kitchen-done.png` | cells `ground-left:salon:done`, `ground-right:kitchen:done`, `upper-left:children:current`, `upper-right:bathroom:closed`; counter 0 |
| 12 | Salon card (12) | `desktop-12-salon-room-done-card.png` | `tablet-12-salon-room-done-card.png` | items salon done, kitchen/children/bathroom not; `doneMiniature 'live'`; counter 84 |
| 13 | Kitchen card (13) | `desktop-13-kitchen-room-done-card.png` | `tablet-13-kitchen-room-done-card.png` | items salon, kitchen done; children, bathroom not; counter 0 |
| 14a | Task backdrop, salon before (14) | `desktop-14a-backdrop-salon-before.png` | `tablet-14a-backdrop-salon-before.png` | `backdrop {drawn, blurred, renderer 'webgl', graded 10}`, counter 213 |
| 14b | Task backdrop, salon renovated (14) | `desktop-14b-backdrop-salon-after.png` | `tablet-14b-backdrop-salon-after.png` | stage + ten slots bought, counter 99 |
| 15 | Task backdrop, kitchen current (15) | `desktop-15-backdrop-kitchen-stage-2.png` | `tablet-15-backdrop-kitchen-stage-2.png` | `currentRoom 'kitchen'`, `backdrop {drawn, blurred, captures 5, graded 0}`, counter 73 |
| 16 | v6 kitchen through the seam (16) | `desktop-16-kitchen-v6-save.png` | `tablet-16-kitchen-v6-save.png` | `save {load 'loaded', migratedFrom 6}`, `tasksDone 5`, `chosen {counter 1, fridge 2}`, button "Postaw stół i krzesła 10", counter 24 |
| 17a-d | Kitchen stand-ins (17) | `desktop-17{a,b,c,d}-kitchen-stand-in-*.png` | `tablet-17{a,b,c,d}-kitchen-stand-in-*.png` | `artFallbacks.miniature 'thumbnail'`; buttons "Posprzątaj kuchnię 5", "Odnów ściany 6", "Odnów podłogę 7", "Postaw szafki 7 / masz 0/7"; counters 18, 13, 7, 0 |
| kit | Pack frames, read only | `kit-kitchen-stage-{0,1,2,3}.png`, `kit-salon-before-comparison.png`, `kit-salon-after-comparison.png`, `kit-house-four-rooms.png` | — | copies of `designs/martynka-house-1-polish-v1/screenshots/` |
