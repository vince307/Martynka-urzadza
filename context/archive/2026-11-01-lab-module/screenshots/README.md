# Screenshots for the lab-module visual gate (plan row 4.6)

Captured on 2026-11-01 from the hook build of the branch at `b35554b` (`E2E_HOOK=1 npm run build -- --outDir dist-visual.local`, a gitignored folder, so `dist-e2e/` on 4397 was never touched), served by `vite preview` on the visual port 4399 only. PNG, desktop 1440×900 and tablet 1024×768: 24 game frames over 12 shots, plus four pack frames (`kit-*`).

## Route

Playwright fallback (`visual-gate.md` § 2) with a throwaway config and spec in a gitignored `visual.local/` folder reusing `tests/e2e/support/{hook,salon,welcome}.ts` (the approach of the house-1-polish gate), moved to the session scratchpad after the run (before lint). Two projects (desktop, tablet; Chromium with `hasTouch`), one worker, own `webServer` on 4399: 6 tests passed, then route C again (2 passed) with one slot added. Every test is a new browser context (a fresh device). Claude in Chrome was not used (see `../reviews/visual-review.md`, Decisions).

- **A (01, 09, 02, 03, 08, 04, 06, 05-07):** base (`passWelcome(..., 'space')`), `?e2eStars=300` (three modules × 100), `?e2eVariant=off`; first task by the retype (0 stars) → room → Mostek bought to the end (look 0 each) → card (01) → "Dalej" → Hangar → "Baza" (09) → ground-right cell back to the room → Hangar bought → card (02) → "Dalej" → Laboratorium before (03) → "Baza" (08) → upper-left cell back to the room → stage → microscope panel open (04) → look 0 "Wybieram" → five more slots in look 0 → card (06) → "Dalej" (05-07).
- **B (10):** house 1 (`passWelcome(..., 'house')`), `?e2eStars=5`, retype, room, "Dom".
- **C (11a-11c):** `?e2eArt=room`, `?e2eStars=216` (Mostek 100 + Hangar 100 + 16), both modules bought on stand-ins, Laboratorium before (11a), stage (11b), microscope look 0 (11c).

Each room shot waits until `roomLoad.pending` is empty (the house also `houseView.shellReady` and `pending` empty), then 1.8 s; a card shot waits 2.5 s after the card appears.

## Frames

| # | State (row 4.6 item) | Desktop 1440 | Tablet 1024 | Hook facts |
|---|---|---|---|---|
| 01 | Mostek card (1) | `desktop-01-bridge-card.png` | `tablet-01-bridge-card.png` | items `bridge done`, `hangar`, `lab` not done; counter 200 |
| 02 | Hangar card (2) | `desktop-02-hangar-card.png` | `tablet-02-hangar-card.png` | items `bridge`, `hangar` done, `lab` not; counter 100 |
| 03 | Laboratorium before (3) | `desktop-03-lab-before.png` | `tablet-03-lab-before.png` | `tasksDone 0`, button "Odnów ściany i podłogę 6", `houseLabel 'Baza'`, counter 100 |
| 04 | Microscope panel (4) | `desktop-04-lab-panel-microscope.png` | `tablet-04-lab-panel-microscope.png` | panel `open buy place-microscope`, thumbnails Naturalny / Słoneczny / Miętowy, counter 94 |
| 05-07 | After, furnished, after "Dalej" (5, 7) | `desktop-05-07-lab-after-change-mode.png` | `tablet-05-07-lab-after-change-mode.png` | `tasksDone 7`, every `chosen` 0, `modeText 'Zmień wygląd'`, `houseLabel 'Baza'`, counter 0 |
| 06 | Laboratorium card (6) | `desktop-06-lab-card.png` | `tablet-06-lab-card.png` | items `bridge`, `hangar`, `lab` all done, no teaser; counter 0 |
| 08 | Base, lab current (8) | `desktop-08-base-lab-current.png` | `tablet-08-base-lab-current.png` | cells `ground-left:bridge:done`, `ground-right:hangar:done`, `upper-left:lab:current`, `upper-right:null:closed` |
| 09 | Base, Hangar current (9) | `desktop-09-base-hangar-current.png` | `tablet-09-base-hangar-current.png` | cells `ground-left:bridge:done`, `ground-right:hangar:current`, `upper-left:lab:closed`, `upper-right:null:closed` |
| 10 | House 1, salon current (10) | `desktop-10-house-1-salon-current.png` | `tablet-10-house-1-salon-current.png` | cells `ground-left:salon:current`, the rest closed; counter 5 |
| 11a-c | Stand-ins (11) | `desktop-11{a,b,c}-lab-stand-in-*.png` | `tablet-11{a,b,c}-lab-stand-in-*.png` | buttons "Odnów ściany i podłogę 6", "Postaw mikroskop 10", "Postaw gablotę z kamieniami 13 / masz 0/13"; counters 16, 10, 0; 11c shows the box "mikroskop / Naturalny" |
| kit | Pack frames, read only | `kit-lab-before.png`, `kit-lab-after-natural.png`, `kit-base-with-three-modules.png` (v3), `kit-base-cell-frame.png` (v5) | — | copies of `designs/bystrow-space-base-v3/screenshots/` and `designs/bystrow-space-base-v5/screenshots/` |
