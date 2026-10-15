# Screenshots — salon-load-health visual gate

Captured 2026-10-15 on `b4c8565` (the build id in the corner). No fix was needed, so every frame shows the code that ships.

Route: Playwright only. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`, service
workers blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, projects `desktop` 1440×900 and `tablet` 1024×768)
reused `tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by
`npm run preview -- --outDir dist-e2e --port 4399 --strictPort`; the folder was deleted afterwards. Claude in Chrome was not used:
the settings panel opens only after a 2 s touch hold on the gear drawn on the Phaser canvas, which the extension cannot drive (same
reason as the S-16a gate). A silent speech stub is installed, so the panel shows the "no Polish voice" line. PNG kept (≈ 1.2 MB in
all; `sips` cannot write in the sandbox).

States are reached through the product: the parent path (`passWelcome`: age 10+, stage E3, no warm-up) or straight to the task
screen when the save has a learner, then the gear hold and the adult gate (`openSettings`). No round is played in any frame.
The "Zapis gry" / "Obrazki" section is scrolled to the middle of the panel's scroll area. Each test is a new browser context.

| # | State | Frames (`desktop-` / `tablet-`) | How reached |
|---|---|---|---|
| v01 | `?e2eSave=legacy-salon` (frozen v2 old salon, no learner): panel top, then "Zapis gry" with "Zapis przeniesiono z wersji 2. Stara kopia została na tym urządzeniu." | `v01-panel-top`, `v01-legacy-salon-save` | welcome → parent path → gear hold + gate |
| v02 | `?e2eSave=v1` (frozen v1, has a learner): task screen at start, then "Zapis gry" with "… z wersji 1. …" | `v02-task-screen`, `v02-v1-save` | task screen → gear hold + gate |
| v03 | `?e2eArt=stall`, `assets/rooms/salon/furnishings-before.webp` held open by `page.route`: "Obrazki" with "1 z 26 obrazków pokoju nie wczytał się. …" | `v03-stall-obrazki` | parent path → gear hold + gate |
