# Screenshots — salon-extra-slots (S-16d) visual gate

Captured 2026-10-16 on `9036f75` (no fix was needed, so every frame shows the code that ships).

Route: Playwright only. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`, service
workers blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, projects `desktop` 1440×900 and `tablet` 1024×768)
reused `tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by
`npm run preview -- --outDir dist-e2e --port 4399 --strictPort`; the folder was deleted afterwards and the server stopped. Claude in
Chrome was not used: purchases, thumbnails and the hold are touches on the Phaser canvas (profile § 8). Frames saved as JPEG (q 85-90).

States are reached through the product: `passWelcome` (parent path, stage E3, no warm-up) with `?e2eVariant=off` and
`?e2eStars=129` (= the whole salon: 5+7+9+10+12+13+15 + 8+10+12+13+15), the first task solved by the retype (pays no star), then the
HUD room switch. The six old tasks are bought with variant 0, each new task previews variant 1 (the `p-` frame) and buys variant 0
(the `f-` frame, so the full room matches the pack's preset 0). `?e2eArt=room` queues no salon picture (`s-` frames).

- `desktop-*` = 1440×900 (scene at 0.75); `tablet-*` = 1024×768 (scene at 0.533).
- Kit reference: `designs/martynka-salon-v2/screenshots/{salon-before,architecture-after-no-curtains,salon-preset-0,variants-*}.png`
  (read-only, not copied).

| # | State | Frames (`desktop-` / `tablet-`) | How reached |
|---|---|---|---|
| r01 | Before the stage: worn room, bare window (rod, no curtains), "Odnów ściany i podłogę ★ 5", 129 | `r01-before-stage` | room switch |
| r02 | After the stage: clean architecture without curtains, old lamp, left plant and pouf (variant 0) shown, no shelf, "Postaw sofę ★ 7", 124 | `r02-after-stage` | stage button, 1.5 s |
| r03 | Seven old tasks done: no shadows, no mode button (F1), "Powieś zasłony ★ 8", 58 | `r03-old-seven-done` | six purchases |
| p-* | Panel of each new task with variant 1 previewed in the room (curtains Lniane, shelf Miętowa, lamp Wiklinowa, plant Paproć, pouf Pleciona) | `p-<slot>-panel-preview1` | task button, thumbnail 2 |
| f-* | Each new slot bought with variant 0, next task label and counter | `f-<slot>-bought` | thumbnail 1, "Wybieram" |
| r04 | "Pokój gotowy!" at the 12th purchase, live miniature with curtains; enlarged tile crop | `r04-done-card`, `r04-done-card-tile` | pouf purchase |
| r05 | Full room with shadows and "Zmień wygląd", 0 stars | `r05-full-room` | "Dalej" |
| r06 | Hold on the curtains band (scene point x 728, y 10): outline frame on desktop; on the tablet the panel had already opened when the frame was taken | `r06-hold-curtains` / `r06-hold-curtains-panel-open` | raw CDP touchStart, frame at ≈ 250 ms |
| r07 | Change panel of the curtains, variant 3 (Botaniczne) previewed | `r07-change-panel-curtains-preview2` | hold released after 1.15 s, thumbnail 3 |
| s01–s02 | Stand-ins with `?e2eArt=room`: before the stage; done card (thumbnail mode, the pack's `ui/salon-after`) with tile crop | `s01-standin-before-stage`, `s02-standin-done-card(-tile)` | `?e2eArt=room&e2eStars=129` |
