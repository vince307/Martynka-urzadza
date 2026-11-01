# Screenshots for the base-cross-section visual gate (plan row 4.6)

Captured on 2026-11-01 from the hook build of `1e0fcc3` (after the review fix `c52c53c`; no product change since), rebuilt with `E2E_HOOK=1 npm run build -- --outDir dist-e2e` and served by `vite preview` on the visual port 4399. PNG, desktop 1440×900 and tablet 1024×768: 18 game frames over 9 shots (the 8 items of row 4.6 plus the salon with "Dom"), and one pack frame (`kit-*`).

## Route

Playwright fallback (`visual-gate.md` § 2) with a throwaway config and spec reusing `tests/e2e/support/{hook,salon,welcome}.ts`, both removed from the repository after the run. Two projects (desktop 1440×900, tablet 1024×768, Chromium, `hasTouch`), one worker; 10 tests passed in 3.3 min. Every test is a new browser context, so a fresh device (fresh IndexedDB). Taps are Playwright touch taps at the hook's read-only targets; nothing was written to IndexedDB. The welcome is the parent path (`passWelcome`: gate, "10+", "Klasa 2, I półrocze"), then "Baza kosmiczna" or "Dom"; variants off (`?e2eVariant=off`). Into the room: one task solved by the retype (no star), then "Do pokoju".

- **A (04, 01):** base, `?e2eStars=40` → Mostek before the stage with "Baza" (04) → "Baza" → base cross-section (01).
- **B (05, 06, 02):** base, `?e2eStars=100` (the Mostek total), all 7 Mostek tasks bought with look 0 → "Pokój gotowy!" (05) → "Dalej" → Mostek in change mode (06) → "Baza" → base cross-section with Mostek done (02).
- **C (03):** as A with `?e2eArt=house` → the base with the stand-in shell.
- **D (07a, 07):** house, `?e2eStars=40` → salon with "Dom" (07a) → "Dom" → house cross-section (07).
- **E (08):** as D with `?e2eArt=house` → the house with the stand-in shell.

Each shot waits 1.8 s after the state is reached in the hook; house shots first wait for four cells, no pending picture, and `shellReady` true (false under `?e2eArt=house`).

## Frames

| # | State (row 4.6 item) | Desktop 1440 | Tablet 1024 | Hook facts |
|---|---|---|---|---|
| 01 | Base cross-section at the start (1) | `desktop-01-base-start.png` | `tablet-01-base-start.png` | `house base-1`, cells `ground-left:bridge:current:live`, three `closed`, `shellReady true`, stars 40; rendered stage pixel `#e8efeb` |
| 02 | Base with Mostek done, still framed (2) | `desktop-02-base-mostek-done.png` | `tablet-02-base-mostek-done.png` | ground-left `current` (no next module), `shellReady true`, stars 0 |
| 03 | Base under `?e2eArt=house` (3) | `desktop-03-base-stand-in.png` | `tablet-03-base-stand-in.png` | `artFallbacks.house 'drawn'`, `shellReady false`, no roof |
| 04 | Mostek with "Baza" (4) | `desktop-04-mostek-baza-button.png` | `tablet-04-mostek-baza-button.png` | `houseLabel 'Baza'`, `houseButton` (1750, 224), task `renovate` 6, stars 40 |
| 05 | Mostek room-done card (5) | `desktop-05-mostek-room-done-card.png` | `tablet-05-mostek-room-done-card.png` | card items `room:bridge:done` only, `houseButton` null, `houseLabel` null, stars 0 |
| 06 | Mostek after "Dalej" (6) | `desktop-06-mostek-after-dalej.png` | `tablet-06-mostek-after-dalej.png` | `modeText 'Zmień wygląd'`, `houseLabel 'Baza'`, `houseButton` (1750, 224) |
| 07a | Salon with "Dom" (regression, entry to 7) | `desktop-07a-salon-dom-button.png` | `tablet-07a-salon-dom-button.png` | `house house-1`, `houseLabel 'Dom'`, task `renovate` 5 |
| 07 | House cross-section unchanged (7) | `desktop-07-house-start.png` | `tablet-07-house-start.png` | cells `salon current`, `kitchen closed`, two empty closed; pixel-identical to S-23 `*-02-house-start.png` (0 differing pixels at both widths); stage pixel `#e7f4f4` |
| 08 | House under `?e2eArt=house` (8) | `desktop-08-house-stand-in.png` | `tablet-08-house-stand-in.png` | `artFallbacks.house 'drawn'`, `shellReady false`, gable roof drawn |
| kit | Pack frame, read only | `kit-base-with-bridge.png` | — | copy of `designs/bystrow-space-base-v1/screenshots/base-with-bridge.png` |
