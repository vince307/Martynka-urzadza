# Screenshots — autosave-versioned-save (S-11) visual gate

Captured 2026-10-13 with the Playwright fallback (as in S-10): a throwaway spec in a gitignored `tests/e2e/visual.local/`
folder (own config, no `webServer`, service workers blocked, `hasTouch`), reusing `tests/e2e/support/{welcome,hook}.ts`,
against the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by
`npm run preview -- --outDir dist-e2e --port 4399 --strictPort` on the visual port 4399. The folder was moved out of the
repo before the lint gate. Frames are at `9be4701` (build id drawn in the corner); no production code changed in this step.

- `desktop-*` = 1440×900 viewport; `tablet-*` = 1024×768.
- Every state was reached through the product. The unreadable save comes from the e2e-only `?e2eSave=unreadable` seam
  (an in-memory store holding a v99 save, never IndexedDB). The restore frames use one browser context: welcome as a
  parent (age 10+, "Klasa 2, I półrocze" = E3, no warm-up) with the e2e-only start balance `?e2eStars=20`, the first task
  solved by the retype (pays 0), HUD "Do pokoju", task button, thumbnail 2, "Wybieram", then `page.reload()`. IndexedDB
  was never opened or written by the script; save status was read from the read-only hook.
- A silent speech stub is installed before load (no HUD speaker; the settings panel shows the "no Polish voice" line).

| # | State | Desktop | Tablet | How reached |
|---|---|---|---|---|
| 01 | failed-load card: title, body, "Zachowaj kopię" (quiet), "Graj dalej" (main, focused), note | `desktop-01-card.png` | `tablet-01-card.png` | `/?e2eSave=unreadable` |
| 02 | adult gate over the card ("Pytanie dla rodzica", 13–19 × 13–19 digit pad) | `desktop-02-gate-over-card.png` | `tablet-02-gate-over-card.png` | "Zachowaj kopię" |
| 03 | card again after the export (the copy was a download `martynka-zapis.txt`, 59 bytes, `"version": 99`, `"stars": 7`) | `desktop-03-card-after-export.png` | `tablet-03-card-after-export.png` | product typed into the gate, "OK" |
| 04 | welcome screen after "Graj dalej" (hook: `load: unreadable`, `blocked: true`, `writes: 0`) | `desktop-04-welcome-after-continue.png` | `tablet-04-welcome-after-continue.png` | "Graj dalej" |
| 05 | salon before the reload: floor bought (variant 2), HUD 15, task button "Pomaluj ściany ★6" | `desktop-05-room-before-reload.png` | `tablet-05-room-before-reload.png` | `?e2eStars=20`, retype, "Do pokoju", floor, "Wybieram" |
| 05b | parent settings before the reload: stage "Klasa 2, I półrocze" selected | `desktop-05b-settings-before-reload.png` | `tablet-05b-settings-before-reload.png` | 2 s hold on the gear, gate; closed with "Anuluj" |
| 06 | first task after the reload: HUD 15, a new round of E3 (hook `load: loaded`) | `desktop-06-task-after-reload.png` | `tablet-06-task-after-reload.png` | `page.reload()` |
| 07 | salon after the reload: same floor, HUD 15, "Pomaluj ściany ★6" | `desktop-07-room-after-reload.png` | `tablet-07-room-after-reload.png` | retype (pays 0), "Do pokoju" |
| 08 | parent settings after the reload: same stage selected, same "Krok 8 z 8" | `desktop-08-settings-after-reload.png` | `tablet-08-settings-after-reload.png` | hold on the gear, gate |

Kit: the kit has no failed-load card (DESIGN-GAP 42); it reuses the DOM overlay styles of the other parent dialogs.
