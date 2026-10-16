# Screenshots — stale-tab-and-health visual gate (plan row 12.4)

Captured 2026-10-16 on `3e0636b` (no fix was needed, so every frame shows the code that ships; the build id in the frames is `3e0636b`).

Route: Playwright only. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`, `hasTouch`,
`locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, projects `desktop` 1440×900 and `tablet` 1024×768) reused
`tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by
`npm run preview -- --outDir dist-e2e --port 4399 --strictPort`; the folder was moved out of the repo afterwards and the server stopped.
Claude in Chrome was not used: the settings panel opens only after a 2 s hold on the canvas gear and the child card needs rounds
played on the canvas (profile § 8). Frames are JPEG q 80, viewport-sized; a panel frame is scrolled so the named section is centred.

Every state starts with `passWelcome` (parent path, stage E3, `?e2eMonth=10&e2eVariant=off`), then the gear hold and the adult gate
(`openSettings`). No IndexedDB write from the test; the only e2e seams are the query switches above.

- `desktop-*` = 1440×900; `tablet-*` = 1024×768.
- Kit reference: none — the kit (`designs/martynka-maths-A-v1/screenshots/`) has no settings panel and no refusal card (DESIGN-GAP rows 116–121).

| State | Desktop | Tablet | How reached |
|---|---|---|---|
| Panel top (stage, reading, sound) | `desktop-ready-panel-top.jpg` | `tablet-ready-panel-top.jpg` | service worker allowed, after `sw.phase` = `ready` |
| "Zapis gry" (ok, last write) | `desktop-ready-save.jpg` | `tablet-ready-save.jpg` | same page |
| Offline `ready` | `desktop-ready-offline.jpg` | `tablet-ready-offline.jpg` | Chromium really installs the worker of the hook build |
| "Obrazki" UI line ok | `desktop-uiart-ok.jpg` | `tablet-uiart-ok.jpg` | same page, nothing blocked |
| Offline `installing` | `desktop-installing-offline.jpg` | `tablet-installing-offline.jpg` | `context.route` holds the worker's precache request for `assets/ui/wallet-open.webp` forever (worker requests routed with `PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1`); page requests continue |
| Offline `install-failed` + `Kod: InstallFailed` | `desktop-install-failed-offline.jpg` | `tablet-install-failed-offline.jpg` | same route, the worker's request aborted → worker `redundant` |
| Offline `unsupported` | `desktop-unsupported-offline.jpg` | `tablet-unsupported-offline.jpg` | init script removes `Navigator.prototype.serviceWorker` (a browser without service workers) |
| Offline `register-failed` + `Kod: TypeError` (extra, not in the row) | `desktop-register-failed-offline.jpg` | `tablet-register-failed-offline.jpg` | `serviceWorkers: 'block'` makes `register` reject |
| Offline `ready` + `takenOver` | `desktop-taken-over-offline.jpg` | `tablet-taken-over-offline.jpg` | worker of build A installed and the save written; the 4399 server swapped for a second hook build with another build id (`GITHUB_SHA=feedface…`); reload (page still runs A under A's worker), then `registration.update()` → the new worker installs, `clientsClaim` → `controllerchange` |
| "Obrazki" UI line missing, "1 z 5" | `desktop-uiart-missing.jpg` | `tablet-uiart-missing.jpg` | `serviceWorkers: 'block'` + `page.route` aborts `assets/ui/wallet-open.webp` before the first load |
| Music `loading` | `desktop-music-loading.jpg` | `tablet-music-loading.jpg` | worker blocked; `page.route` holds `music-loop.(m4a|ogg)`; music switched on in the panel, "Zatwierdź", panel reopened |
| Music `missing` | `desktop-music-missing.jpg` | `tablet-music-missing.jpg` | same, the music request aborted |
| Music `waiting-unlock` | `desktop-music-waiting-unlock.jpg` | `tablet-music-waiting-unlock.jpg` | init script keeps the `AudioContext` `suspended` (`resume` never settles: a device whose audio stays locked); music on, panel reopened (`sound.locked` = true) |
| Sound choice not kept | `desktop-prefs-not-kept.jpg` | `tablet-prefs-not-kept.jpg` | init script makes `localStorage.setItem('martynka:sound', …)` throw `QuotaExceededError`; effects switched off, "Zatwierdź", panel reopened |
| Child card `saveRefused` over the task screen | `desktop-child-card.jpg` | `tablet-child-card.jpg` | two pages of one context (as `tests/e2e/stale-tab.spec.ts`): A saves a round, B opens, plays and saves a round, A answers one task → its write is refused (`blockedBy` `otherTab`) |
| After "Zacznij od nowa" | `desktop-child-card-after-restart.jpg` | `tablet-child-card-after-restart.jpg` | tap on the card's button: page reloads onto the task screen with B's stars (14 = 14), input on, no card |
| "Zapis gry" `otherTab` in the panel | — | — | **not captured, code-reviewed only**: in the refused window the card holds the input switch, so the gear hold opens nothing (checked: 0 gate dialogs after a 2.3 s hold); the line comes from `saveHealthView` → `pl.settings.saveOff.otherTab` (unit test `tests/saveHealth.test.ts` "saveHealthView otherTab") |
