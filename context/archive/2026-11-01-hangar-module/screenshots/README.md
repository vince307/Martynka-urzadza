# Screenshots for the hangar-module visual gate (plan row 3.6)

Captured on 2026-11-01 from the hook build of the phase-3 working tree (product code as of the phase-2 commit `de5ab57`; phase 3 changes no file under `src/`), built with `E2E_HOOK=1 npm run build -- --outDir dist-e2e` and served by `vite preview` on the visual port 4399. PNG, desktop 1440×900 and tablet 1024×768: 16 game frames over 8 shots, plus three pack frames (`kit-*`).

## Route

Playwright fallback (`visual-gate.md` § 2) with a throwaway config and spec reusing `tests/e2e/support/{hook,salon,welcome}.ts`, both removed from the repository after the run. Two projects (desktop, tablet; Chromium with `hasTouch`), one worker: 6 tests passed in 3.3 min, then the stand-in test again with more stars (2 passed, 55 s). Every test is a new browser context, so a fresh device. Claude in Chrome was not used: its profile holds the maintainer's save on localhost:4399, and a fresh device would mean wiping that site data.

- **B (01, 02, 07):** base (`passWelcome(…, 'space')`), `?e2eStars=100`, first task by the retype (0 stars), all 7 Mostek tasks bought with look 0 → card (01) → "Dalej" → Hangar before look (02) → "Baza" → base cross-section (07).
- **C (03, 05, 06):** as B with `?e2eStars=200`; after "Dalej" the 7 Hangar tasks bought with look 0 (Naturalny family); the rocket panel shot with the first thumbnail previewed (03); card (05); "Dalej" → change mode (06).
- **D (08, 08b):** as B with `?e2eStars=129&e2eArt=room` → Hangar at the start with no room pictures (08); stage, rocket and rover bought → stand-in boxes (08b).

Each shot waits 1.8 s after the state is reached in the hook (and, for the Hangar, after `roomLoad.pending` is empty; for the base after `shellReady`).

## Frames

| # | State (row 3.6 item) | Desktop 1440 | Tablet 1024 | Hook facts |
|---|---|---|---|---|
| 01 | Mostek room-done card (1) | `desktop-01-mostek-room-done-card.png` | `tablet-01-mostek-room-done-card.png` | card items `room:bridge:done`, `room:hangar:not done`, no teaser; `houseLabel` null; counter 0 |
| 02 | Hangar at the start after "Dalej" (2) | `desktop-02-hangar-start.png` | `tablet-02-hangar-start.png` | room `hangar`, `tasksDone 0`, task `renovate` 6, `houseLabel 'Baza'`, counter 0 |
| 03 | Hangar variant panel on the rocket (3) | `desktop-03-hangar-rocket-panel.png` | `tablet-03-hangar-rocket-panel.png` | panel `open/buy place-rocket`, preview 0; captions Naturalna / Słoneczna / Miętowa; counter 94 |
| 05 | Hangar room-done card (5) | `desktop-05-hangar-room-done-card.png` | `tablet-05-hangar-room-done-card.png` | card items `room:bridge:done`, `room:hangar:done`, no teaser; `houseLabel` null (no "Baza"); counter 0 |
| 06 | Hangar after "Dalej" (4, 6) | `desktop-06-hangar-after-dalej.png` | `tablet-06-hangar-after-dalej.png` | `tasksDone 7`, all six slots chosen 0, `modeText 'Zmień wygląd'`, `houseLabel 'Baza'` |
| 07 | Base with two modules (7) | `desktop-07-base-two-modules.png` | `tablet-07-base-two-modules.png` | cells `ground-left:bridge:done`, `ground-right:hangar:current`, two `closed`; `shellReady true` |
| 08 | Hangar under `?e2eArt=room`, at the start (8) | `desktop-08-hangar-stand-in.png` | `tablet-08-hangar-stand-in.png` | room `hangar`, `artFallbacks.miniature 'drawn'`, counter 29 |
| 08b | Hangar under `?e2eArt=room`, three tasks bought (8) | `desktop-08b-hangar-stand-in-pieces.png` | `tablet-08b-hangar-stand-in-pieces.png` | `tasksDone 3`, task `place-workbench` 14, counter 0 |
| kit | Pack frames, read only | `kit-hangar-after-natural.png`, `kit-base-with-two-modules.png`, `kit-hangar-before.png` | — | copies of `designs/bystrow-space-base-v2/screenshots/{hangar-after-natural,base-with-two-modules}.png` and `previews/hangar-before.png` |
