# Screenshots — adaptive-curriculum (S-07) visual gate

Captured 2026-10-13 with Claude in Chrome (own tab, closed afterwards) against the dev server on the visual port 4399
(`npx vite --config vite/config.dev.mjs --port 4399 --strictPort`), branch `feat/adaptive-curriculum` at `94ae4de`
(the build id drawn in the bottom-left corner of every frame). Month: the real one, **October 2026** (`getMonth()` 9;
the dev build does not read `?e2eMonth`).

- **One game instance per run, two sizes.** The game ran in a same-origin iframe on a blank page of the dev server
  (profile § 9). Each state was captured at **1024×768** (tablet; canvas 1024×576, scale 0.533, letterboxed 96 px top
  and bottom; PNG cropped to the iframe) and then, without touching the game, the iframe was resized to the full page
  viewport **1440×773** (desktop, the same viewport as a 1440×900 Chrome window; canvas 1374×773, scale 0.716) and
  captured again, then resized back. `Scale.FIT` re-fits on resize, so both frames show the same state.
- Captures are JPEG from the extension, converted to PNG (Pillow); desktop frames are uncropped 1440×773.

Every state was reached by tapping: „Rodzic”, the gate digits (problem read from the dialog text), the panel buttons,
„Zatwierdź”, the age button, keypad keys / answer tiles, „Dalej”, „Kolejna runda”. Every answer was computed from the
task on screen and given right on the first try. No scene state was read or written, no IndexedDB touched; the only
script calls read the parent dialog's text, clicked its DOM buttons, read the canvas rectangle and resized the iframe.

| State | Desktop (1440×773) | Tablet (1024×768) | How reached |
|---|---|---|---|
| summary with a card pending (E4) | `desktop-01-summary-pending-e4.png` | `tablet-01-summary-pending-e4.png` | parent path: gate 13 · 18 = 234, age 8, „Klasa 2, II półrocze” (E4, an override → no warm-up), 5 rounds right on the first try; this is the end of round 5 (the next „Kolejna runda” opened the card) |
| „Nowa umiejętność!” card, long name | `desktop-02-card-long-e4-step4.png` | `tablet-02-card-long-e4-step4.png` | „Kolejna runda” on that summary: „Dopełnianie do dziesiątki” (25 characters) |
| round after „Dalej” (E4) | `desktop-03-round-after-dalej-e4.png` | `tablet-03-round-after-dalej-e4.png` | „Dalej” on the card: 5 dots, index 0, HUD counter 35 kept |
| summary with a card pending (E1) | `desktop-04-summary-pending-e1.png` | `tablet-04-summary-pending-e1.png` | fresh iframe load, child path: age „6” (E1, no warm-up), 7 rounds right on the first try (7 × 7 = 49 on the HUD); end of round 7 |
| card, short name | `desktop-05-card-short-e1-step5.png` | `tablet-05-card-short-e1-step5.png` | „Kolejna runda”: „Działania do 9” (14 characters) |
| round after „Dalej” (E1) | `desktop-06-round-after-dalej-e1.png` | `tablet-06-round-after-dalej-e1.png` | „Dalej” on the card (tapped at 1440): 5 dots, counter 49 kept |

Kit frame compared (read-only, not copied into the repo): `designs/martynka-maths-A-v1/screenshots/unlock.png` and
`.unlock-card` / `.unlock-art` / `.unlock-name` / `.unlock-card .page-button` in `designs/martynka-maths-A-v1/maths.css`.

Capture artefacts (not product defects): stars of the last answer's flight sit mid-way across the summary frames (the
extension tab's frame loop is throttled, as in the S-05/S-06 gates); the first tap after an iframe resize or reload was
sometimes ignored and repeated (follow-up „Bramka wizualna” in `follow-ups/review-fixes.md`).
