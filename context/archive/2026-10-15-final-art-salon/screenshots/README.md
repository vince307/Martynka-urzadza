# Screenshots — final-art-salon (S-16a) visual gate

Captured 2026-10-15 on `ce89b62` (the build id in the corner of the task screens). No fix was needed, so every frame shows the code
that ships.

Route: Playwright only. A throwaway spec in the gitignored `tests/e2e/visual.local/` folder (own config, no `webServer`, service
workers blocked, `hasTouch`, `locale: 'pl-PL'`, `timezoneId: 'Europe/Warsaw'`, projects `desktop` 1440×900 and `tablet` 1024×768)
reused `tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by
`npm run preview -- --outDir dist-e2e --port 4399 --strictPort`; the folder was deleted afterwards. Claude in Chrome was not used:
the room is driven by touches on the Phaser canvas (purchases, thumbnails, the hold), which synthetic events cannot drive (profile § 8).
A silent speech stub hides the speaker. Frames were saved as PNG and converted to JPEG (quality 88) to keep the folder at ≈ 10 MB
instead of 44 MB.

States are reached through the product: the parent path (`passWelcome`: age 10+, stage E3, no warm-up) with `?e2eVariant=off`, the
first task solved by the retype (pays no star), then the HUD room switch. `?e2eStars=71` (= 5 + 7 + 9 + 10 + 12 + 13 + 15, the whole
salon) seeds the balance; `?e2eArt=room` queues no salon picture. Each test is a new browser context.

- `desktop-*` = 1440×900 (scene at 0.75); `tablet-*` = 1024×768 (scene at 0.533).
- Animation frames are named by the delay after the tap (`-150ms`); a screenshot of the WebGL canvas itself takes ≈ 100-300 ms, so
  the real moment is later than the name says.
- Kit reference: `designs/martynka-expansion-v1/screenshots/room-preset-{0,1,2}.png` (read-only, not copied).

| # | State | Frames (`desktop-` / `tablet-`) | How reached |
|---|---|---|---|
| r01 | Salon before the stage (neglected backdrop and furniture), "Odnów ściany i podłogę ★ 5" | `r01-before-stage` | room switch, 71 stars |
| r02 | Stage cross-fade mid-frame (desktop only) | `r02-stage-fade-150ms`, `-300ms` | tap on the stage button |
| r03 | After the stage: renovated walls and floor, fixed decoration only, "Postaw sofę ★ 7" | `r03-after-stage` | 1.2 s after the tap |
| p-* | Variant panel of each of the 6 slots with variant 1 previewed (sofa, rug, coffee table, cabinet, armchair, frames) | `p-<slot>-panel-preview1` | task button, thumbnail 2 |
| f-* | Each slot furnished with variant 0, in purchase order (before = the previous frame) | `f-<slot>-furnished` | thumbnail 1, "Wybieram" |
| r04 | Sofa pop with particles (desktop only) | `r04-sofa-pop-80ms`, `-200ms` | "Wybieram" on the sofa |
| r05 | "Pokój gotowy!" card: salon miniature with the check mark, "Wkrótce" tile (unlocked, so no padlock), "Dalej" | `r05-room-done-card` | last purchase (frames) |
| r06 | Full room, all six pieces and decoration, with shadows | `r06-full-room` | "Dalej" on the card |
| r07–r08 | Hold outline on the sofa and on the rug | `r07-hold-sofa`, `r08-hold-rug` | raw CDP touchStart, frame before 600 ms |
| r09–r10 | Change mode ("Gotowe") and its panel on the sofa with variant 3 previewed | `r09-change-mode`, `r10-change-panel-sofa-preview2` | "Zmień wygląd", tap on the sofa |
| m01–m02 | Same purchases with `reducedMotion: 'reduce'`: no fade, no pop, no particles (desktop only) | `m01-reduced-stage-150ms`, `m02-reduced-sofa-80ms` | 12 stars |
| x01 | F1 check: leave the room 100 ms into the fade, come back (desktop only) | `x01-f1-back-after-fade-leave-50ms`, `x01-f1-settled` | "Wróć do notesu", room switch |
| x02–x03 | Rug pop after the sofa (rug stays under the sofa) and the settled pair (desktop only) | `x02-rug-pop-40ms`, `-150ms`, `x03-sofa-and-rug` | 30 stars |
| s01–s05 | Stand-ins with `?e2eArt=room`: before / after the stage, sofa panel (colour thumbnails), three pieces, done card miniature | `s01-standin-before-stage` … `s05-standin-done-card` | `?e2eArt=room&e2eStars=71` |
| o01–o02 | Parent panel "Obrazki": both lines with full art; room line "26 z 26 obrazków pokoju nie wczytało się…" | `o01-obrazki-full`, `o02-obrazki-room-missing` | gear hold 2 s + adult gate |
| l01 | Loading screen (title, bar at ≈ 60 %) | `l01-loading` | `page.route` delays `assets/rooms/**` by 2.5 s |
| u01 | "Nowa umiejętność!" card with the book (E1 "Działania do 9") | `u01-unlock-card` | child path, age 6, month 9, rounds right until the card |
