# Screenshots: save-reason-and-recovery

Captured on `49e468e` (the build id in each frame's corner) by a throwaway Playwright spec in the gitignored
`tests/e2e/visual.local/` folder, moved out of the repo after the run. The spec ran against the e2e hook build
(`E2E_HOOK=1`, `dist-e2e`) on the visual port 4399. Viewports: `desktop` 1440×900 and `tablet` 1024×768, both with touch.
It reused `tests/e2e/support/{welcome,hook}.ts`. Each state was reached through the product:

1. Load `/?e2eSave=<mode>`. The seam replaces the store with an in-memory one; IndexedDB is never opened.
2. Pass the start card with "Graj dalej" and tap the first age button, which leads to an E1 task.
3. Hold the gear for 2.3 s, answer the adult gate from the dialog text, then tap the panel button.

The healthy state starts with `passWelcome` and waits for the first write.

| # | State | Desktop (1440) | Tablet (1024) | How reached |
|---|---|---|---|---|
| 01 | start card, `unavailable` (code line `Kod: UnknownError`) | `desktop-01-card-unavailable.png` | `tablet-01-card-unavailable.png` | `?e2eSave=unavailable` |
| 02 | "Zapis gry", `unavailable` | `desktop-02-section-unavailable.png` | `tablet-02-section-unavailable.png` | as 01 + gear; section scrolled to the middle |
| 03 / 04 | import, blocked step / after "Zastąp mimo to" | `desktop-03-import-unavailable.png`, `desktop-04-import-unavailable-forced.png` | `tablet-03-…`, `tablet-04-…` | as 01 + "Wczytaj z pliku" (+ "Zastąp mimo to") |
| 05 / 06 | reset, blocked step / after "Zastąp mimo to" | `desktop-05-reset-unavailable.png`, `desktop-06-reset-unavailable-forced.png` | `tablet-05-…`, `tablet-06-…` | as 01 + "Zacznij od nowa" (+ "Zastąp mimo to") |
| 07 | export with the `exportNotDevice` warning | `desktop-07-export-unavailable.png` | `tablet-07-export-unavailable.png` | as 01 + "Zapisz kopię" |
| 10 | start card, `timeout` (code line `Kod: timeout`) | `desktop-10-card-hang.png` | `tablet-10-card-hang.png` | `?e2eSave=hang` (card after the 5 s read limit) |
| 11 | "Zapis gry", `timeout` | `desktop-11-section-hang.png` | `tablet-11-section-hang.png` | as 10 + gear |
| 12 / 13 | import / reset, `timeout` (no "Zastąp mimo to") | `desktop-12-import-hang.png`, `desktop-13-reset-hang.png` | `tablet-12-…`, `tablet-13-…` | as 10 + button |
| 20 | start card, `future` | `desktop-20-card-future.png` | `tablet-20-card-future.png` | `?e2eSave=unreadable` (the seam's newer-version save) |
| 21 | "Zapis gry", `future` | `desktop-21-section-future.png` | `tablet-21-section-future.png` | as 20 + gear |
| 22 / 23 | import / reset, `future` (only "Zamknij") | `desktop-22-import-future.png`, `desktop-23-reset-future.png` | `tablet-22-…`, `tablet-23-…` | as 20 + button |
| 30 | start card, `corrupt` | `desktop-30-card-corrupt.png` | `tablet-30-card-corrupt.png` | `?e2eSave=corrupt` |
| 31 | "Zapis gry", `corrupt` | `desktop-31-section-corrupt.png` | `tablet-31-section-corrupt.png` | as 30 + gear |
| 32 / 33 | import / reset, `corrupt` (warning, actions available) | `desktop-32-import-corrupt.png`, `desktop-33-reset-corrupt.png` | `tablet-32-…`, `tablet-33-…` | as 30 + button |
| 34 | export with the warning, `corrupt` | `desktop-34-export-corrupt.png` | `tablet-34-export-corrupt.png` | as 30 + "Zapisz kopię" |
| 40 | "Zapis gry", healthy (reference) | `desktop-40-section-healthy.png` | `tablet-40-section-healthy.png` | `passWelcome`, after the first write |
| 41 | export, healthy (no warning) | `desktop-41-export-healthy.png` | `tablet-41-export-healthy.png` | as 40 + "Zapisz kopię" |

There are 44 frames: 22 states at 2 widths. Kit frames: none. `designs/` has no frame for these dialogs or for the
"Zapis gry" section. DESIGN-GAP rows 69–72 in `docs/design-gaps.md` record this. The dialogs follow the S-12 frames
of the same dialogs.
