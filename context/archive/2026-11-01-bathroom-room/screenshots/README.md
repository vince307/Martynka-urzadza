# Screenshots for the bathroom-room visual gate (plan row 5.6)

Captured on 2026-11-01 from the hook build of the branch at `beed03f` (`E2E_HOOK=1 npm run build -- --outDir dist-visual.local`, a gitignored folder, so `dist-e2e/` on 4397 was never touched), served by `vite preview` on the visual port 4399 only. PNG, desktop 1440×900 and tablet 1024×768: 32 game frames over 16 shots, plus four pack frames (`kit-*`).

## Route

Playwright fallback (`visual-gate.md` § 2) with a throwaway config and spec in a gitignored `visual.local/` folder reusing `tests/e2e/support/{hook,salon,welcome}.ts`, moved to the session scratchpad after the run (before lint). Two projects (desktop, tablet; Chromium with `hasTouch`), one worker, own `webServer` on 4399: 6 tests passed in 5.9 min. Every test is a new browser context (a fresh device). Claude in Chrome was not used (see `../reviews/visual-review.md`, Decisions).

- **A (01, 02, 03, 04, 05, 11, 06, 09, 10, 12, 08, 08b):** house (`passWelcome`), `?e2eStars=355` (salon 129 + kitchen 71 + children 84 + bathroom 71), `?e2eVariant=off`, the first task by the retype (0 stars), all 12 salon tasks with look 0 → salon card (01) → "Dalej" → 7 kitchen tasks → kitchen card (02) → "Dalej" → 9 children tasks → children card (03) → "Dalej" → bathroom at the start (04) → "Odnów ściany i podłogę" (05) → "Dom" (11) → upper-right cell back to the room → "Postaw wannę z zasłonką", first thumbnail previewed (06) → "Wybieram" and the other five slots with look 0 → bathroom card (09) → "Dalej" (10) → "Dom" (12) → upper-right cell → "Zmień wygląd", each of the six slots tapped and set to "Miętowa" (08) → "Gotowe" (08b).
- **B (13, 13b):** as A with `&e2eArt=room` and no card shots → bathroom at the start without room pictures (13); the stage, tub, sink and towel shelf bought → stand-in boxes (13b).
- **C (14, 14b):** space base (`passWelcome(..., 'space')`), `?e2eStars=200`, retype, all 7 Mostek tasks → Mostek card (14) → "Dalej" → all 7 Hangar tasks → Hangar card (14b).

Each shot waits until `roomLoad.pending` is empty (for the house also `shellReady` and `houseView.pending` empty), then 1.8 s.

## Frames

| # | State (row 5.6 item) | Desktop 1440 | Tablet 1024 | Hook facts |
|---|---|---|---|---|
| 01 | Salon card, four tiles (1) | `desktop-01-salon-room-done-card.png` | `tablet-01-salon-room-done-card.png` | items salon done; kitchen, children, bathroom not done; counter 226 |
| 02 | Kitchen card, four tiles (2) | `desktop-02-kitchen-room-done-card.png` | `tablet-02-kitchen-room-done-card.png` | salon, kitchen done; children, bathroom not; counter 155 |
| 03 | Children card, four tiles (3) | `desktop-03-children-room-done-card.png` | `tablet-03-children-room-done-card.png` | salon, kitchen, children done; bathroom not; counter 71 |
| 04 | Bathroom at the start (4) | `desktop-04-bathroom-start.png` | `tablet-04-bathroom-start.png` | `tasksDone 0`, button "Odnów ściany i podłogę 5", `houseLabel 'Dom'`, counter 71 |
| 05 | After the stage (5) | `desktop-05-bathroom-after-stage.png` | `tablet-05-bathroom-after-stage.png` | `tasksDone 1`, button "Postaw wannę z zasłonką 7", counter 66 |
| 06 | Tub panel (6) | `desktop-06-bathroom-tub-panel.png` | `tablet-06-bathroom-tub-panel.png` | panel `open/buy place-tub`, preview 0; captions Naturalna / Słoneczna / Miętowa |
| 08 | Mint, change mode (8) | `desktop-08-bathroom-mint-change-mode.png` | `tablet-08-bathroom-mint-change-mode.png` | `mode 'change'`, `modeText 'Gotowe'`, every `chosen` = 2, counter 0 |
| 08b | Mint, after "Gotowe" (8) | `desktop-08b-bathroom-mint.png` | `tablet-08b-bathroom-mint.png` | `mode 'normal'`, `modeText 'Zmień wygląd'`, every `chosen` = 2 |
| 09 | Bathroom card (9) | `desktop-09-bathroom-room-done-card.png` | `tablet-09-bathroom-room-done-card.png` | four rooms done, no teaser; counter 0 |
| 10 | After "Dalej", natural (7, 10) | `desktop-10-bathroom-after-dalej.png` | `tablet-10-bathroom-after-dalej.png` | `tasksDone 7`, every `chosen` = 0, `modeText 'Zmień wygląd'`, `houseLabel 'Dom'` |
| 11 | House, bathroom current (11) | `desktop-11-house-bathroom-current.png` | `tablet-11-house-bathroom-current.png` | cells `ground-left:salon:done`, `ground-right:kitchen:done`, `upper-left:children:done`, `upper-right:bathroom:current`; counter 66 |
| 12 | House, four rooms done (12) | `desktop-12-house-four-rooms-done.png` | `tablet-12-house-four-rooms-done.png` | same cells (the last room stays `current`), no closed cell; counter 0 |
| 13 | Stand-ins at the start (13) | `desktop-13-bathroom-stand-in.png` | `tablet-13-bathroom-stand-in.png` | `?e2eArt=room`, `artFallbacks.miniature 'thumbnail'`, counter 71 |
| 13b | Stand-ins, four tasks bought (13) | `desktop-13b-bathroom-stand-in-pieces.png` | `tablet-13b-bathroom-stand-in-pieces.png` | `tasksDone 4`, button "Połóż dywanik 12", counter 40 |
| 14 | Mostek card (14) | `desktop-14-mostek-room-done-card.png` | `tablet-14-mostek-room-done-card.png` | items bridge done, hangar not; counter 100 |
| 14b | Hangar card (14) | `desktop-14b-hangar-room-done-card.png` | `tablet-14b-hangar-room-done-card.png` | items bridge, hangar done; counter 0 |
| kit | Pack frames, read only | `kit-bathroom-before.png`, `kit-bathroom-after-natural.png`, `kit-bathroom-after-mint.png`, `kit-house-four-rooms.png` | — | copies of `designs/martynka-bathroom-v1/screenshots/{bathroom-before,bathroom-after-natural,bathroom-after-mint,house-four-rooms}.png` |
