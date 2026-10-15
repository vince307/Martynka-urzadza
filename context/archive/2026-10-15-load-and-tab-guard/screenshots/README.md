# Screenshots — load-and-tab-guard visual gate

Captured 2026-10-16 on `41e7bb7` (the build id in the corner; code identical to the review fix `5a11370`, the later commit is docs only). No fix was needed, so every frame shows the code that ships.

Route: Playwright only. A throwaway spec `tests/e2e/visual.local/load-and-tab-guard.spec.ts` (gitignored folder, own config, no `webServer`,
service workers blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, projects `desktop` 1440×900 and `tablet` 1024×768)
reused `tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by
`npm run preview -- --outDir dist-e2e --port 4399 --strictPort`; the folder was deleted and the server stopped afterwards. Claude in Chrome
was not used: it cannot hold network routes open (the loading state) and cannot drive the 2 s touch hold on the canvas gear (the panel).
A silent speech stub is installed. Each test is a new browser context (fresh device).

| # | State | Frames (`desktop-` / `tablet-`) | How reached |
|---|---|---|---|
| v01 | Loading screen with the slow line "Jeszcze chwilka, wczytuję obrazki." (`?e2eArt=stallall&e2eVariant=off`; `assets/tasks/money/*.webp`, `fonts/*.ttf`, `assets/rooms/salon/*.webp` held open by `page.route`), taken after the hook reported `loading.phase === 'slow'` and while `screen === 'loading'` (before the 3 s e2e cut); the test then waited for the welcome screen | `v01-loading-slow` | direct URL |
| v02 | "Zapis gry" with `pl.settings.saveOff.newer` + `Kod: NewerSave` (`?e2eSave=newer&e2eVariant=off`), section scrolled to the top of the panel | `v02-newer-save` | parent path (`passWelcome`) → one task answered right → wait until `save.blockedBy === 'newer'` → gear hold + adult gate (`openSettings`) |
| v03 | Same panel scrolled to the save buttons ("Zapisz kopię", "Wczytaj z pliku", "Zacznij od nowa") and "Postępy" | `v03-newer-save-actions` | as v02 |
| v04 | Reset dialog after "Zacznij od nowa": title + `pl.saveTransfer.deviceNewer`, only "Zamknij" | `v04-newer-reset-dialog` | as v03, tap "Zacznij od nowa" |
