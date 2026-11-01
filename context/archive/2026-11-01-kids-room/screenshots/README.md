# Screenshots for the kids-room visual gate (plan row 5.6)

Captured on 2026-11-01 from the hook build of the branch (`E2E_HOOK=1 vite build --outDir dist-visual.local`, a gitignored folder so the orchestrator's `dist-e2e/` on 4397 was never touched), served by `vite preview` on the visual port 4399. PNG, desktop 1440×900 and tablet 1024×768: 26 game frames over 13 shots, plus three pack frames (`kit-*`).

## Route

Playwright fallback (`visual-gate.md` § 2) with a throwaway config and spec in a gitignored `visual.local/` folder reusing `tests/e2e/support/{hook,salon,welcome}.ts`, moved out of the repository after the run. Two projects (desktop, tablet; Chromium with `hasTouch`), one worker, own `webServer` on 4399: 4 tests passed in 9.1 min; after the fix commit the stand-in test was run again on a rebuilt hook build (2 passed, 4.2 min) and frames 12/12b were replaced. Every test is a new browser context (a fresh device). Claude in Chrome was not used (see `reviews/visual-review.md`, Decisions).

- **A (13, 01, 02, 10, 03, 04, 11, 05, 06, 08, 09):** house (`passWelcome`), `?e2eStars=284` (salon 129 + kitchen 71 + children 84), first task by the retype (0 stars), all 12 salon tasks bought with look 0 → salon card (13) → "Dalej" → all 7 kitchen tasks → kitchen card (01) → "Dalej" → children at the start (02) → "Dom" (10) → back through the upper-left cell → "Posprzątaj pokój" (03) → "Pomaluj ściany" (04) → "Dom" (11) → back → "Odnów podłogę" (05) → "Postaw łóżko", first thumbnail previewed (06) → "Wybieram" and the other five slots with look 0 → children card (08) → "Dalej" (09).
- **B (12, 12b):** as A with `&e2eArt=room` → children at the start with no room pictures (12); three stages, bed, desk, bookcase bought → stand-in boxes (12b).

Each shot waits until `roomLoad.pending` is empty (for the house also `shellReady` and `houseView.pending` empty), then 1.8 s.

## Frames

| # | State (row 5.6 item) | Desktop 1440 | Tablet 1024 | Hook facts |
|---|---|---|---|---|
| 01 | Kitchen room-done card (1) | `desktop-01-kitchen-room-done-card.png` | `tablet-01-kitchen-room-done-card.png` | items `salon done`, `kitchen done`, `children not done`; counter 84 |
| 02 | Children at the start (2) | `desktop-02-children-start.png` | `tablet-02-children-start.png` | `tasksDone 0`, `stagesDone 0`, button "Posprzątaj pokój 5", `houseLabel 'Dom'`, counter 84 |
| 03 | After "Posprzątaj pokój" (3) | `desktop-03-children-stage-1.png` | `tablet-03-children-stage-1.png` | `stagesDone 1`, button "Pomaluj ściany 6", counter 79 |
| 04 | After "Pomaluj ściany" (4) | `desktop-04-children-stage-2.png` | `tablet-04-children-stage-2.png` | `stagesDone 2`, button "Odnów podłogę 7", counter 73 |
| 05 | After "Odnów podłogę" (5) | `desktop-05-children-after.png` | `tablet-05-children-after.png` | `stagesDone 3`, button "Postaw łóżko 7", counter 66 |
| 06 | Variant panel on the bed (6) | `desktop-06-children-bed-panel.png` | `tablet-06-children-bed-panel.png` | panel `open/buy place-bed`, preview 0; captions Baldachim / Domek / Z szufladami |
| 08 | Children room-done card (8) | `desktop-08-children-room-done-card.png` | `tablet-08-children-room-done-card.png` | items salon, kitchen, children all done, no teaser; counter 0 |
| 09 | After "Dalej" (7, 9) | `desktop-09-children-after-dalej.png` | `tablet-09-children-after-dalej.png` | `tasksDone 9`, `modeText 'Zmień wygląd'`, `houseLabel 'Dom'` |
| 10 | House, children current (10) | `desktop-10-house-children-current.png` | `tablet-10-house-children-current.png` | cells `ground-left:salon:done`, `ground-right:kitchen:done`, `upper-left:children:current`, `upper-right:closed`; `shellReady true` |
| 11 | House after stage 2 (11) | `desktop-11-house-children-stage-2.png` | `tablet-11-house-children-stage-2.png` | same cells; counter 73 |
| 12 | Stand-ins at the start (12) | `desktop-12-children-stand-in.png` | `tablet-12-children-stand-in.png` | `?e2eArt=room`, `artFallbacks.miniature 'thumbnail'`, counter 84 (after the fix commit) |
| 12b | Stand-ins, six tasks bought (12) | `desktop-12b-children-stand-in-pieces.png` | `tablet-12b-children-stand-in-pieces.png` | `tasksDone 6`, button "Postaw skrzynię na zabawki 12", counter 40 (after the fix commit) |
| 13 | Salon room-done card (13) | `desktop-13-salon-room-done-card.png` | `tablet-13-salon-room-done-card.png` | items `salon done`, `kitchen not done`, `children not done`; counter 155 |
| kit | Pack frames, read only | `kit-children-form-0.png`, `kit-children-form-0-chooser.png`, `kit-house-four-rooms.png` | — | copies of `designs/martynka-evolution-v1/screenshots/children-form-0{,-chooser}.png` and `designs/martynka-house-1-polish-v1/screenshots/house-four-rooms.png` |
