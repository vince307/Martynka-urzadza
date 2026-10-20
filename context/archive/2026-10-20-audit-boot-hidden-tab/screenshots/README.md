# Screenshots for the audit-boot-hidden-tab visual gate (plan rows 3.5, 5.4, 6.5)

Captured on 2026-10-20 on `fa37a67` (the build id in every frame). The two `*-refused-card` frames look the same after the VG-1 focus fix; the fix changes only which element holds the focus, which the e2e spec pins (see `reviews/visual-review.md`).

## Route

Playwright on the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npx vite preview --config vite/config.prod.mjs --outDir dist-e2e --port 4399 --strictPort`. The flow was a throwaway spec in `tests/e2e/visual.local/` (gitignored), reusing `tests/e2e/support/{welcome,hook,saveImport}.ts`, with its own config (no `webServer`, `hasTouch`, `pl-PL`, `Europe/Warsaw`, service workers blocked) and two projects: `desktop` 1440×900 and `tablet` 1024×768. After the run the folder was moved out of the repo and the server stopped.

Claude in Chrome was not used: the settings panel opens only after a 2 s hold on the canvas gear, which the extension cannot drive (profile § 8), and the hidden-tab state needs a faked visibility installed before the page script runs. Every state was reached through the product: real touch taps and holds, the adult gate typed on its pad, the import file chosen in the real file chooser. Nothing writes to IndexedDB. The e2e switches used: `?e2eArt=stallall` (shortened total load limit), `?e2eFail=step|boot`, `?e2eSave=newer` (in-memory store that stores a newer version at the first write), `?e2eVariant=off`.

The "Gra bez internetu" section reads `Kod: TypeError` in the settings frames because the capture blocks service workers; that is the capture setup, not this slice.

Frames are PNG, viewport-sized.

## Kit reference

The kit (`designs/martynka-maths-A-v1/screenshots/`) has no settings panel, no error card and no refusal card: DESIGN-GAP rows 29, 51, 67, 117 and 153 in `docs/design-gaps.md`. The cards and dialogs reuse the overlay styles of the kit's cards (`unlock.png`, `summary.png`: ivory card, teal text, butter border, teal primary button); `tablet-1024.png` is the tablet reference.

## Frames

| State (row) | Desktop | Tablet | How reached |
|---|---|---|---|
| "Obrazki", ordinary cut line `artCut` (3.5) | `desktop-art-cut.png` | `tablet-art-cut.png` | `?e2eArt=stallall`, money pictures, font and salon files held, child path; settings via gear hold + gate |
| "Obrazki", background cut line `artCutBackground` (3.5) | `desktop-art-cut-background.png` | `tablet-art-cut-background.png` | the same, the tab faked hidden for 3.6 s during the load (`hiddenMs` 3736 / 3642), parent path |
| "Ups!" card after a frame failure (5.4) | `desktop-error-step.png` | `tablet-error-step.png` | `?e2eFail=step`, child path |
| "Ups!" card at boot (5.4) | `desktop-error-boot.png` | `tablet-error-boot.png` | `?e2eFail=boot` |
| Reset dialog before the confirmation (6.5) | `desktop-reset-dialog.png` | `tablet-reset-dialog.png` | `?e2eSave=newer`, first write landed, settings → "Zacznij od nowa" |
| Reset refused: `deviceNewer` in the dialog, card behind (6.5) | `desktop-reset-refused-dialog.png` | `tablet-reset-refused-dialog.png` | the confirmation tapped, store answers `NewerSave` |
| Refusal card after "Zamknij" (6.5) | `desktop-reset-refused-card.png` | `tablet-reset-refused-card.png` | "Zamknij"; the card's button then tapped (page reloaded) |
| Import step two ("Teraz" / "Z pliku") (6.5) | `desktop-import-summary.png` | `tablet-import-summary.png` | `?e2eSave=newer`, settings → "Wczytaj z pliku", a v1 save file chosen |
| Import refused: `deviceNewer`, card behind (6.5) | `desktop-import-refused-dialog.png` | `tablet-import-refused-dialog.png` | "Wczytaj" tapped, store answers `NewerSave` |
| Refusal card after "Zamknij" (6.5) | `desktop-import-refused-card.png` | `tablet-import-refused-card.png` | "Zamknij"; the card's button then tapped (page reloaded) |
