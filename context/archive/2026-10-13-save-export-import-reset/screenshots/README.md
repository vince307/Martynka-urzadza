# Screenshots — save-export-import-reset (S-12) visual gate

Captured 2026-10-13 at `76cdea4` (build id in the corner and on the card). Route: Claude in Chrome first for the one state
that needs no gesture (the unreadable card, `/?e2eSave=unreadable`, desktop, a cross-check only: same text, focus on
"Graj dalej"); every frame below comes from the Playwright fallback, because the settings panel opens only after a 2 s
hold on the gear (profile § 8: Claude in Chrome cannot drive the Phaser long press). A throwaway spec in a gitignored
`tests/e2e/visual.local/` folder (own config, no `webServer`, service workers blocked, `hasTouch`, `timezoneId:
'Europe/Warsaw'`, `locale: 'pl-PL'`) reused `tests/e2e/support/{welcome,hook}.ts` against the e2e-hook build
(`E2E_HOOK=1 npm run build -- --outDir dist-e2e`) served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`;
the folder was moved out of the repo before the lint gate.

- `desktop-*` = 1440×900; `tablet-*` = 1024×768. Every test is a new browser context (a fresh device); IndexedDB is the
  game's own, never opened by the script; the save status was read from the read-only hook.
- A silent speech stub is installed before load (the panel shows the "no Polish voice" line).
- Import files are picked through the real file chooser (`filechooser` event). The import is cancelled at step 2 and
  the reset at its dialog: no frame shows a replaced save (the e2e spec `save-transfer.spec.ts` covers the replace).

| # | State | Desktop | Tablet | How reached |
|---|---|---|---|---|
| 01 | settings panel, top (opens scrolled to the top; "Zatwierdź"/"Anuluj" sticky) | `desktop-01-panel-top.png` | `tablet-01-panel-top.png` | parent welcome (E3, `?e2eMonth=10`), one round right, "Kolejna runda", 2 s hold on the gear, adult gate |
| 02 | "Zapis gry" ok + "Ostatni zapis" + persistence sentence (`denied`) + the three buttons "Zapisz kopię", "Wczytaj z pliku", "Zacznij od nowa" | `desktop-02-panel-save-section.png` | `tablet-02-panel-save-section.png` | frame 01, "Zapisz kopię" scrolled to the centre |
| 03 | export dialog before "Zapisz plik" (focus on "Zapisz plik") | `desktop-03-export-before.png` | `tablet-03-export-before.png` | "Zapisz kopię" |
| 04 | export dialog after: "Plik został pobrany na to urządzenie." + "Zamknij" (focused) | `desktop-04-export-after.png` | `tablet-04-export-after.png` | "Zapisz plik" (download `martynka-zapis-2026-10-13.txt`; headless Chromium has no share sheet) |
| 05 | import step 1 (focus on "Wybierz plik") | `desktop-05-import-step1.png` | `tablet-05-import-step1.png` | gear, gate, "Wczytaj z pliku" |
| 06 | import refused: "To nie jest plik zapisu tej gry. Obecne postępy zostały bez zmian." + "Wybierz inny plik" / "Zamknij" | `desktop-06-import-refused.png` | `tablet-06-import-refused.png` | "Wybierz plik" → `zly.txt` = `{"hello":1}` |
| 07 | import step 2: "Teraz" 7 gwiazdek / E3 / Salon 0 z 10, "Z pliku" 22 gwiazdki / E4 / Salon 0 z 10, "Wczytaj" + "Anuluj" (focused) | `desktop-07-import-summary.png` | `tablet-07-import-summary.png` | "Wybierz inny plik" → an envelope with a v1 save of 22 stars, stage E4 |
| 08 | "Zapis gry" at the earliest moment the panel can open (age 6, E1, right after the welcome): already ok, see `notYet` below | `desktop-08-panel-early.png` | `tablet-08-panel-early.png` | child welcome age 6, gear at once, gate |
| 09 | unreadable card with "Kod: future · Wersja 76cdea4" (focus on "Graj dalej") | `desktop-09-card-unreadable.png` | `tablet-09-card-unreadable.png` | `/?e2eSave=unreadable` |
| 10 | reset dialog: what disappears, the advice, "Anuluj" (initial focus) and "Zacznij od nowa" (plain) | `desktop-10-reset.png` | `tablet-10-reset.png` | gear, gate, "Zacznij od nowa" |

Not captured (no route through the product or no seam): `notYet` (the first write lands 500 ms after the welcome choice,
before the 2 s hold and the gate can open the panel; hook at the panel: `writes: 1`), `earlierFailures` (the `writefail`
seam never succeeds afterwards), persistence `granted` (headless Chromium answered `denied`), export outcomes `shared` /
`cancelled` / `failed` (no share sheet in headless Chromium), import refusals other than `not-ours` (`corrupt` is in the
e2e spec). Covered by unit tests: `tests/saveHealth.test.ts`, `tests/plural.test.ts`, `tests/saveTransferCopy.test.ts`.

Kit: the kit has no settings, export, import, reset or save-card views (DESIGN-GAP 44, 46–51 in `docs/design-gaps.md`);
the dialogs reuse the S-06 parent dialog parts.
