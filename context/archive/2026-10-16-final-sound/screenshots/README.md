# Screenshots — final-sound visual gate

Captured 2026-10-16 on `ceff218` (the build id in the corner; the last code commit is `82860d2`, later commits are docs only). No fix was needed, so every frame shows the code that ships.

Route: Playwright only. A throwaway spec `tests/e2e/visual.local/final-sound.spec.ts` (gitignored folder, own config, no `webServer`, service workers
blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, projects `desktop` 1440×900 and `tablet` 1024×768) reused
`tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by
`npm run preview -- --outDir dist-e2e --port 4399 --strictPort`; the folder was deleted and the server stopped afterwards. Claude in Chrome was not
used: it cannot drive the 2 s touch hold on the canvas gear that opens the panel, nor route sound files to bad bytes. A silent speech stub is
installed (hence the "no Polish voice" line under the reading group). Each test is a new browser context (fresh device).

Missing effects are made like `tests/e2e/final-sound-failure.spec.ts` does: `page.route` answers the chosen sound files (both formats) with
`200 audio/mp4` and the body `not audio`, so `decodeAudioData` rejects; the hook's `sound.missing` was polled to the expected count before the panel opened.

| # | State | Frames (`desktop-` / `tablet-`) | How reached |
|---|---|---|---|
| v00 | Panel top (title, "Etap nauki", "Czytanie poleceń na głos", start of "Dźwięki") on a healthy start | `v00-panel-top` | parent path (`passWelcome`, `?e2eSkills=E3.2.add_sub_20_bridge&e2eVariant=off`) → gear hold + adult gate (`openSettings`) |
| v01 | "Dźwięki" on a healthy start: effects "Włączone", music "Wyłączone", no missing line | `v01-sound-healthy` | as v00, "Dźwięki" scrolled to the top of the panel |
| v02 | N = 1: "Nie wczytał się 1 dźwięk. Gra działa dalej bez niego." | `v02-sound-missing-1` | `star.*` routed to non-audio bytes; `sound.missing = ["sounds/star"]` |
| v03 | N = 3: "Nie wczytały się 3 dźwięki. Gra działa dalej bez nich." | `v03-sound-missing-3` | `star.*`, `coin.*`, `tap.*` routed |
| v04 | N = 12: "Nie wczytało się 12 dźwięków. Gra działa dalej bez nich." | `v04-sound-missing-all` | every effect file routed (music loop left alone); `sound.missing` has 12 ids |
| v05 | After tapping effects "Wyłączone" and music "Włączone" (before "Zatwierdź"): the pressed state moves per group | `v05-sound-toggled` | as v01, two taps |
