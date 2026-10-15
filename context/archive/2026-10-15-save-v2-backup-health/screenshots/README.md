# Screenshots: save-v2-backup-health

A throwaway Playwright spec captured these frames. It lived in the gitignored `tests/e2e/visual.local/` folder and was moved
out of the repo after the run. It ran against the e2e hook build (`E2E_HOOK=1`, `dist-e2e`) on the visual port 4399, with
`reuseExistingServer: false`. Viewports: `desktop` 1440×900 and `tablet` 1024×768, both with touch. It reused
`tests/e2e/support/{welcome,hook}.ts`. The corner shows build `b9883d5`. Frames 20–22 and 26 were captured again after the
focus fix `1c7bc51`, on a build of the working tree with that fix, so their corner still reads `b9883d5`.

Each state was reached through the product. `?e2eSave=<seam>` swaps IndexedDB for an in-memory store, and IndexedDB is never
opened. The settings panel opens with the real gear hold (2.3 s) and the adult gate answered from the dialog text.

- v1 seams (`v1`, `backupfail`, `backuphang`): load `/?e2eSave=<seam>&e2eMonth=10&e2eVariant=off`. A task is on screen
  (E3 learner from the fixture). Clean rounds are played until the store reports `writtenVersion: 2`, then the panel opens.
- Write seams (`writefail`, `writehang`): `passWelcome` (parent path, E3) with the seam. The spec waits for the first failure.
- Read seams (`hang`, `slow`, `unavailable`): load `/?e2eSave=<seam>&e2eVariant=off`. The start card is the first screen.

| # | State | Desktop (1440) | Tablet (1024) | How reached |
|---|---|---|---|---|
| 01 | "Zapis gry", moved from v1, copy kept | `desktop-01-section-v1-kept.png` | `tablet-01-section-v1-kept.png` | `v1`, one clean round, gear |
| 02 | "Zapis gry", moved, copy lost, `Kod: QuotaExceededError` | `desktop-02-section-backupfail-lost.png` | `tablet-02-…` | `backupfail`, rounds until v2 (3 copies failed), gear |
| 03 | "Zapis gry", moved, copy lost, `Kod: timeout` | `desktop-03-section-backuphang-lost.png` | `tablet-03-…` | `backuphang`, as 02 |
| 04 | "Zapis gry" `failing`: `1 nieudana próba · zapis · Kod: QuotaExceededError` | `desktop-04-section-writefail-failing.png` | `tablet-04-…` | `writefail`, first write failed, gear |
| 05 | "Zapis gry" `failing`: `1 nieudana próba · zapis · Kod: timeout` | `desktop-05-section-writehang-failing.png` | `tablet-05-…` | `writehang`, first write timed out, gear |
| 06 / 07 / 08 | reset after a timed-out write: confirmation, during the write (both buttons disabled), after the limit (`resetFailed`, "Zamknij") | `desktop-06-reset-writehang-confirm.png`, `desktop-07-…-during.png`, `desktop-08-…-failed.png` | `tablet-06/07/08-…` | as 05 + "Zacznij od nowa", then "Zacznij od nowa" in the dialog |
| 09 / 10 / 11 | import after a timed-out write: summary step, during the write, after the limit (`applyFailed`, "Zamknij") | `desktop-09-import-writehang-summary.png`, `desktop-10-…-during.png`, `desktop-11-…-failed.png` | `tablet-09/10/11-…` | as 05 + "Wczytaj z pliku", a valid 7-star file through the real file chooser, "Wczytaj" |
| 20 | slow card, idle ("Poczekaj dłużej", "Graj dalej" focused) | `desktop-20-card-hang-idle.png` | `tablet-20-…` | `hang`, after the first read limit |
| 21 | slow card, waiting ("Czekam na zapis…" disabled) | `desktop-21-card-hang-waiting.png` | `tablet-21-…` | as 20 + "Poczekaj dłużej" |
| 22 | slow card, still slow (advice, only "Graj dalej") | `desktop-22-card-hang-stillslow.png` | `tablet-22-…` | as 21, after the second limit |
| 23 | "Zapis gry", `off` / `timeout` | `desktop-23-section-hang.png` | `tablet-23-…` | as 22 + "Graj dalej", first age, gear |
| 24 / 25 | reset / import at `hang` (`deviceTimeout`, only "Zamknij") | `desktop-24-reset-hang.png`, `desktop-25-import-hang.png` | `tablet-24/25-…` | as 23 + button |
| 26 | slow card, waiting, at `slow` | `desktop-26-card-slow-waiting.png` | `tablet-26-…` | `slow` + "Poczekaj dłużej" |
| 27 | the late read answered: task with 7 stars | `desktop-27-slow-loaded-task.png` | `tablet-27-…` | as 26, the card closes by itself, first age |
| 28 | `unavailable` card (unchanged) | `desktop-28-card-unavailable.png` | `tablet-28-…` | `unavailable` |

There are 40 frames: 20 states at 2 widths. Kit frames: none. `designs/` has no frame for the "Zapis gry" section, the
slow-read card or these dialog states. DESIGN-GAP rows 94–97 in `docs/design-gaps.md` record this.
