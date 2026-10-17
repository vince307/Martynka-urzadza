# Screenshots for the save-truth visual gate (plan rows 1.7, 2.6, 3.7, 6.5, 7.5, 8.5, 9.5, 10.5, 11.5, 12.5)

These frames were captured on 2026-10-17 on `7aa074c`. The gate fixed nothing, so the build id in the frames is `7aa074c`.

## Route

Every frame comes from Playwright on the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npm run preview -- --outDir dist-e2e --port 4399 --strictPort`. The flow was a throwaway spec in `tests/e2e/visual.local/` (gitignored), modelled on `save-backup-health`, `save-transfer-blocked` and `stale-tab`. It reused `tests/e2e/support/{welcome,hook,saveImport}.ts`. Its own config had no `webServer`, set `hasTouch`, `pl-PL` and `Europe/Warsaw`, and ran two projects: `desktop` at 1440×900 and `tablet` at 1024×768. After the run, the folder was moved out of the repo and the server was stopped.

The frames are JPEG q 80, viewport-sized. `desktop-*` is 1440×900 and `tablet-*` is 1024×768. Nothing in the spec writes to IndexedDB: states come from the `?e2eSave=` seams, the parent panel and play.

## Three states use local patches

Three states have no seam on the branch. For them, the built `dist-e2e` carried a temporary patch. The patch was reverted with `git checkout` right after the build and was never committed:
- **`?e2eSave=vgmigfail`**: an in-memory v1 record whose `stars` getter throws. `MIGRATIONS[1]` throws, so the result is `migration-failed` at step 1. This is the route plan row 2.6 allows ("a throwing step patched locally, never committed").
- **`?e2eSave=vgv1writehang`**: the v1 fixture with writes that never answer, under the e2e write limit. This gives the `pending` line, which needs `migrationWrittenAt === null`. The `backuphang` seam cannot hold it, because the start write lands at once.
- **`?vgOlder=1`**: this calls `saver.noteOlderWriter()` after the saver is created, on real IndexedDB. Only a store that a build older than v4 wrote can set `olderWriter`, and no such build exists on this branch.

## Kit reference

The kit has none of these states. They are parent views and save cards, covered by DESIGN-GAP rows 42-51, 69-72, 87, 94-97, 116 and 126-138. The frames follow the house overlay pattern already on main.

## Frames

| State (row) | Desktop | Tablet | How reached |
|---|---|---|---|
| Unreadable-save card, `Kod: corrupt/stars` (1.7) | `desktop-corrupt-card.jpg` | `tablet-corrupt-card.jpg` | `?e2eSave=corrupt` |
| Migration-failed card, `Kod: migration-failed/1` (2.6) | `*-migfail-card.jpg` | same | `?e2eSave=vgmigfail` (local patch) |
| "Zapis gry" with migration-failed (2.6) | `*-migfail-health.jpg` | same | "Graj dalej", first age, gear hold, adult gate |
| Reset step one: no "Zacznij od nowa", "Zastąp mimo to" offered (2.6) | `*-migfail-reset-step1.jpg` | same | "Zacznij od nowa" in the panel |
| Reset after "Zastąp mimo to" with the warning (2.6) | `*-migfail-reset-forced.jpg` | same | tap "Zastąp mimo to" |
| Unavailable card, first start (3.7) | `*-unavailable-card.jpg` | same | `?e2eSave=unavailable` |
| Import dialog, first `unavailable` start (3.7) | `*-unavailable-first-import.jpg` | same | "Graj dalej", first age, panel, "Wczytaj z pliku" |
| Unavailable card, second start (3.7) | `*-unavailable-card-second.jpg` | same | the same URL again (the start counter in localStorage survives) |
| Import dialog, second start, with "Zastąp mimo to" (3.7) | `*-unavailable-second-import.jpg` | same | as on the first start |
| Import after "Zastąp mimo to" (3.7) | `*-unavailable-second-import-forced.jpg` | same | tap "Zastąp mimo to" |
| "Zapis gry": `uncertain` line + `Kod: timeout` (6.5) | `*-backuphang-health.jpg` | same | `?e2eSave=backuphang`, rounds until `backup` is `skipped` (3 copy tries timed out), then the panel |
| "Zapis gry": `lost` line + `Kod: QuotaExceededError` (6.5) | `*-backupfail-health.jpg` | same | `?e2eSave=backupfail`, the same route |
| "Zapis gry": `pending` line + timeout failing line (6.5) | `*-pending-health.jpg` | same | `?e2eSave=vgv1writehang` (local patch), wait for `lastFailure` `write/timeout`, then the panel |
| "Zapis gry": timeout line (6.5) | `*-writehang-health.jpg` | same | parent path with `?e2eSave=writehang`, wait for `lastFailure` `write/timeout` |
| Reset step one, then `replaceUnconfirmed` (11.5) | `*-writehang-reset-step1.jpg`, `*-writehang-reset-unconfirmed.jpg` | same | the same session: "Zacznij od nowa", then confirm. The write hangs past the limit |
| "Zapis gry": older-writer line (7.5) | `*-older-writer-health.jpg` | same | parent path with `?vgOlder=1` (local patch), real IndexedDB |
| Refusal card with `Kod: OtherWriterSave` (8.5) | `*-refused-card.jpg` | same | the `stale-tab.spec.ts` T-5 scenario: window A plays a saved round, window B (a second page of the same context) plays and saves, then A is brought to the front |
| "Zapis gry": `kept` line + "Zachowaj kopię starego zapisu" (9.5) | `*-kept-copy-health.jpg` | same | `?e2eSave=v1`, one round played right until `backup` is `done`, then the panel (scrolled to the button) |
| Export dialog before and after "Zapisz plik" (10.5) | `*-export-dialog.jpg`, `*-export-download-started.jpg` | same | "Zachowaj kopię starego zapisu", then "Zapisz plik" (Playwright download) |
| Import preview of a salon over-count (12.5) | `*-import-overcount-preview.jpg` | same | fresh context, parent path, "Wczytaj z pliku" with a `*.local` copy of `tests/fixtures/save-v4.json` holding `rooms.salon.tasksDone: 99` |
| "Zapis gry": room-mismatch line (12.5) | `*-overcount-health.jpg` | same | "Wczytaj", the page reloads, then the panel |
| Slow card, then waiting, then error card with `Kod: UnknownError` (13, SVB-02) | `*-slow-card.jpg`, `*-slow-waiting.jpg`, `*-slowfail-error-card.jpg` | same | `?e2eSave=slowfail`, then "Poczekaj dłużej" |
