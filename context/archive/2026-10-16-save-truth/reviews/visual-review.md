# Visual review for save-truth

This is the visual gate of run 2026-10-16-audit-sweep, slice 2 of 3. It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `7aa074c`. The frames and the route are listed in `screenshots/README.md`: Playwright on the hook build, port 4399, at 1440×900 and 1024×768, 26 states per width.

The frames were judged against:
- the `[visual]` rows of `plan.md`;
- the copy in `src/data/pl.ts`;
- DESIGN-GAP rows 126-138 in `docs/design-gaps.md`;
- the overlay and settings-panel patterns already on main.

The kit has no parent views or save cards, so no kit frame applies.

## States

| Row | Frames | Verdict |
|---|---|---|
| 1.7 | corrupt-card | `pl.saveFailed`, "Zachowaj kopię" and "Graj dalej", then `Kod: corrupt/stars · Wersja 7aa074c`. It is calm and centred at both widths. |
| 2.6 | migfail-card, migfail-health, migfail-reset-step1, migfail-reset-forced | The card shows `pl.saveMigrationFailed` with `Kod: migration-failed/1`. The panel shows `saveOff['migration-failed']` and `Kod: migration-failed` (VG-1 below). Reset step one shows the `deviceUnreadable` text, only "Zastąp mimo to" and "Zamknij", and no "Zacznij od nowa". After the force: "Znikną wszystkie postępy…", the `forcedWarning` line, then "Anuluj" and "Zacznij od nowa". |
| 3.7 | unavailable-card(-second), unavailable-first-import, unavailable-second-import(-forced) | First start: `deviceUnavailableFirst` ("…Uruchom grę ponownie. Zapis zostaje bez zmian.") and only "Zamknij", with no force and no file choice. Second start: `deviceUnavailable` with "Zastąp mimo to" and "Zamknij". After the force: the import body, `forcedWarning`, then "Wybierz plik" and "Anuluj". |
| 6.5 | pending-health, backuphang-health, backupfail-health, writehang-health | `pending`: "Zapis jest przenoszony z wersji 1. Poczekaj chwilę.", under the timeout failing line "5 nieudanych prób · zapis · Kod: timeout". `uncertain`: "…Nie wiadomo, czy stara kopia została zachowana." with `Kod: timeout`. `lost`: "…ale starej kopii nie udało się zachować." with `Kod: QuotaExceededError`. Timeout: `saveFailingTimeout` with "1 nieudana próba · zapis · Kod: timeout". Numeral agreement is right: 1 nieudana próba, 5 nieudanych prób. |
| 7.5 | older-writer-health | "Postępy zapisują się…", "Ostatni zapis: hh:mm", then `pl.settings.olderWriter`, above the persistence line. |
| 8.5 | refused-card | "Zacznijmy grę jeszcze raz", the body, `Kod: OtherWriterSave · Wersja 7aa074c`, and the one button "Zacznij od nowa". It is the same frame as `stale-tab.spec.ts` T-5. |
| 9.5 | kept-copy-health | The `kept` line "Zapis przeniesiono z wersji 1. Stara kopia została na tym urządzeniu." is in the DOM. The frame is scrolled to the buttons: "Zachowaj kopię starego zapisu" sits between "Wczytaj z pliku" and "Zacznij od nowa". The buttons wrap to two rows at 1024 without clipping. |
| 10.5 | export-dialog, export-download-started | After "Zapisz plik", the dialog shows `exportOutcome.downloadStarted` "Pobieranie pliku się zaczęło. Sprawdź folder Pobrane." and only "Zamknij". |
| 11.5 | writehang-reset-step1, writehang-reset-unconfirmed | Step one shows the "Teraz" summary. After the confirm, `replaceUnconfirmed` appears and only "Zamknij" remains. The page does not reload. |
| 12.5 | import-overcount-preview, overcount-health | The preview shows "Teraz" (0 gwiazdek, Salon 0 z 12) and "Z pliku" (7 gwiazdek, Klasa 2 I półrocze, Salon 12 z 12), then `saveTransfer.roomMismatch`. After "Wczytaj" and the reload, "Zapis gry" shows `settings.roomMismatch` under `saveNotYet`. |
| 13 (SVB-02) | slow-card, slow-waiting, slowfail-error-card | The slow card shows `Kod: timeout`. "Poczekaj dłużej" becomes "Czekam na zapis…". The late `UnknownError` replaces it with the `saveUnavailable` card and `Kod: UnknownError`, never the `stillSlow` advice. |

## Hand-checked values (mandatory)

- **Stars after the v1 migration, rows 9.5 and 10.5:** the v1 fixture holds 7 stars. One round was played with every task right, worth 5 × `starPerTask` 1 + `cleanRoundBonus` 2 = 7. That gives 7 + 7 = 14, and the counter in the frames shows 14 ✓. The exported old copy (`"reason": "backup-v1"`) carries `"version": 1, "stars": 7`, the old save and not the 14, which is right for a pre-migration copy ✓.
- **Over-count preview, row 12.5:** the file has `tasksDone: 99` and the salon has 12 tasks (the stage plus 11 slots), so the summary caps it at min(99, 12) = 12, shown as "Salon: 12 z 12". The mismatch line says the count does not fit ✓. The file's 7 stars give "7 gwiazdek" (genitive plural for 5-21 ✓). Stage E3 = grade 2, semester I, shown as "Klasa 2, I półrocze" ✓.

## Keyboard and focus

The focus was read from `document.activeElement` at every frame, at both widths, with the same result each time:
- **Cards:** "Graj dalej". The refusal card's only button is "Zacznij od nowa". It reloads and keeps the newest save, so it is not destructive.
- **Reset step one:** "Zamknij" (migration-failed) or "Anuluj" (writehang).
- **Reset after "Zastąp mimo to":** **"Anuluj"**, not "Zacznij od nowa".
- **Import on the first and second `unavailable` start:** "Zamknij", not "Zastąp mimo to".
- **Import after the force:** "Wybierz plik", which opens the chooser. The summary step and "Wczytaj" still follow.
- **Over-count preview:** **"Anuluj"**, not "Wczytaj".
- **Export:** "Zapisz plik", then "Zamknij".
- **Reset after the timeout:** the outcome line (`P`), then "Zamknij".

No initial focus landed on a destructive action ✓. Escape during a busy reset is covered by e2e SV2-02 and was not re-measured.

## Discrepancies

No code change was needed.
- **VG-1 (follow-up 28):** the "Zapis gry" `Kod:` for a failed read is the bare reason (`migration-failed`, `corrupt`). The start card adds the step or field (`migration-failed/1`, `corrupt/stars`). Both are true, and this predates the slice. It was deferred with a trigger.
- **Frame note:** the `pending` frame also shows the timeout failing line, because the local seam makes writes hang. On a device, `pending` alone shows only for the moment before the start write lands.

## Autonomous decisions

- **Playwright instead of Claude in Chrome.** Every panel state needs the 2 s gear hold on the canvas and played rounds, as in the previous gate.
  - Would change: a Chrome tool that drives canvas touches.
- **Three local seams in the served build** (`vgmigfail`, `vgv1writehang`, `vgOlder`), reverted before any commit; `git status` was clean afterwards apart from the screenshots.
  - Row 2.6 names this route.
  - The pending line (6.5) and the older-writer line (7.5) have no seam on the branch, and IndexedDB is never written by hand.
  - Would change: committed seams for these states, which would be a code change outside a visual gate.
- **VG-1 deferred.** Showing the step in the panel needs a new runtime field in `AutosaveStatus` and changes to the unit tests.
  - Would change: a [human] call at ship.

## Gate in this step

No source changed, so the local gate was not re-run. The impl-review step observed it green on `209afe3` with docs `7aa074c`: unit baseline + 129, e2e baseline + 5.

Port 4399 was not listening afterwards, and `tests/e2e/visual.local/` was moved out of the repo. `dist-e2e/` still holds the patched hook build. It is gitignored, and the e2e `webServer` rebuilds it on every run (`reuseExistingServer: false`).

VISUAL: PASS — all ten [visual] rows captured at 1440×900 and 1024×768 through the product, the hook-build seams and three reverted local seams: the "Zapis gry" lines (pending, uncertain, lost, timeout, older writer, room mismatch, migration-failed), the import, reset and export outcome lines, the refusal card's Kod:, the kept-copy button, and the slow card turning into the error card all match pl.ts. Stars 7 + 5 + 2 = 14 and the over-count cap 12 of 12 were hand-checked. No initial focus is on a destructive action. VG-1 (shorter panel Kod:) went to follow-up 28.
