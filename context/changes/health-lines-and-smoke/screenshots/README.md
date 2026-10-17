# Screenshots for the health-lines-and-smoke visual gate (plan rows 2.5, 5.5, 6.5, 7.5, 8.5, 10.6)

Captured on 2026-10-17 on `d090f0b` plus the uncommitted VG-1 fix (the build id in the frames is `d090f0b`, the HEAD at build time). The final frames were all shot after the fix.

## Route

Playwright on the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`. The flow was a throwaway spec in `tests/e2e/visual.local/` (gitignored). It reused `tests/e2e/support/{welcome,hook}.ts` and was modelled on `health-lines.spec.ts`, `load-and-tab-guard.spec.ts` and `final-sound.spec.ts`. Its own config had no `webServer`, set `hasTouch`, `pl-PL` and `Europe/Warsaw`, and ran two projects: `desktop` at 1440×900 and `tablet` at 1024×768. After the run the folder was moved out of the repo and the server was stopped.

The frames are JPEG q 80 and viewport-sized. Every panel was opened through the real gear hold and the adult gate. Nothing writes to IndexedDB. Except for `sw-update-failed`, service workers are blocked, so `page.route` reaches the loader. That is why those frames show "Gra bez internetu" with the failed registration line (`registerFailed`, `Kod: TypeError`).

## One temporary seam

**`?vgSwUpdateFailed`** was patched into `src/main.ts` only for the `dist-e2e` build. It was reverted with `git checkout` right after each build and never committed.
- Once the real worker is `ready` and active, it feeds the real reducer `stepSw` an `installing` worker (id 999) that turns `redundant`.
- The reducer then yields `phase: 'ready', error: 'InstallFailed'`, and `offlineView` turns that into `updateFailed`.
- This is the "unit-built status rendered through the hook build" route that plan row 2.5 allows.
- A real failed update would need a second build of `sw.js` whose install fails.

## Kit reference

The kit has no parent panel. The lines are DESIGN-GAP rows 139-150 (and 66, 67, 114, 119, 120). The frames follow the settings-panel pattern already on main.

## Frames

| State (row) | Desktop | Tablet | How reached |
|---|---|---|---|
| "Obrazki": 41 task pictures missing, folders, skipped, `never` cause, no-restart, `Kod: never` (5.5, 6.5) | `desktop-art-missing.jpg` | `tablet-art-missing.jpg` | `?e2eArt=missing`, parent path, panel |
| "Obrazki": cut line, labels, font line, `Kod: cut` (5.5) | `desktop-art-stallall.jpg` | `tablet-art-stallall.jpg` | `?e2eArt=stallall` with money pictures, the font and salon pictures held (`page.route` never answers) |
| "Obrazki": one stalled coin, `network` cause, restart advice (6.5, restart branch) | `desktop-art-stall.jpg` | `tablet-art-stall.jpg` | `?e2eArt=stall`, `coin-1zl.webp` held |
| "Obrazki": 38 room pictures, labels (cap 3), no-restart (6.5) | `desktop-art-room.jpg` | `tablet-art-room.jpg` | `?e2eArt=room` |
| "Obrazki": font fallback line | `desktop-font-fallback.jpg` | `tablet-font-fallback.jpg` | the task font answers 404 |
| Wallet task drawn as a fallback (7.5) | `desktop-ui-wallet-task.jpg` | `tablet-ui-wallet-task.jpg` | `?e2eArt=ui&e2eSkills=E1.11.money_pay_10`, stage E1 by the parent |
| "Obrazki": screen pictures 3 of 5, "Zamiast obrazka gra rysuje: portfel." (7.5) | `desktop-ui-wallet.jpg` | `tablet-ui-wallet.jpg` | the same session, panel |
| Unlock card with the book icon for the notebook (7.5) | `desktop-ui-notebook-card.jpg` | `tablet-ui-notebook-card.jpg` | `?e2eArt=ui`, stage E4 in September, rounds played right until the unlock |
| "Obrazki": "… rysuje: zeszyt." (7.5) | `desktop-ui-notebook.jpg` | `tablet-ui-notebook.jpg` | "Dalej", then the panel |
| "Dźwięki": `soundNoDevice`, no "n not loaded" line (8.5) | `desktop-sound-nodevice.jpg` | `tablet-sound-nodevice.jpg` | an init script deletes `AudioContext`, `webkitAudioContext` and `Audio`, so Phaser picks the no-audio manager (`device: none`) |
| "Dźwięki": music `missing` + `Kod: http:404` (8.5) | `desktop-music-404.jpg` | `tablet-music-404.jpg` | `music-loop.(m4a\|ogg)` answers 404; music turned on, "Zatwierdź", `music` = `missing`, then the panel again |
| "Zapis gry": `salonCarried` under `kept` (10.6) | `desktop-salon-carried.jpg` | `tablet-salon-carried.jpg` | `?e2eSave=legacy-salon`, parent path, panel |
| "Gra bez internetu": `updateFailed` + `Kod: InstallFailed` (2.5) | `desktop-sw-update-failed.jpg` | `tablet-sw-update-failed.jpg` | service worker allowed, `?vgSwUpdateFailed` (temporary seam above) |

A section taller than the panel's scroll area is cut by the sticky "Zatwierdź / Anuluj" bar in the desktop `art-stallall` frame: the `Kod: cut` line is under the bar. The tablet frame shows the whole section. The text of every section was also read from the DOM at both widths, and the two widths gave identical text.
