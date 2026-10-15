# Visual review: save-v2-backup-health

This is the visual gate of autonomous run `2026-10-15-fix-s14c-s14d`, after impl-review (`MERGE: CLEAR`, fixes in `58cf156`).
It captured 20 states × 2 widths = 40 frames on `b9883d5`. The frame list and routes are in `screenshots/README.md`. It found
one discrepancy against DESIGN-GAP row 96 and fixed it in `1c7bc51`. It records two observations as follow-ups.

## Capture

The capture used Playwright only, as in the S-13, S-14 and save-reason-and-recovery gates. Claude in Chrome was not used.
Every "Zapis gry" and dialog state sits behind the 2 s gear hold, and Claude in Chrome cannot drive it (profile § 8). The
slow card's timed states (waiting, then the second limit) need the run's shortened limits in the hook build. Running only the
cards in Chrome would have mixed two renderers for the same slice.

- The spec was a throwaway in the gitignored `tests/e2e/visual.local/`. Its own config built `dist-e2e` with `E2E_HOOK=1`,
  served it on 4399 and set `reuseExistingServer: false`. It reused `tests/e2e/support/{welcome,hook}.ts`. It ran as one plain
  `npx playwright test --config=…` command, and Chromium launched in this subagent session. A piped invocation hit the sandbox
  (MachPort) and was re-run plain.
- Viewports were 1440×900 and 1024×768 (profile § 9), both with touch.
- States were reached only through the `?e2eSave=v1|backupfail|backuphang|writefail|writehang|hang|slow|unavailable` seams and
  the real UI: rounds played, the real file chooser, the real gear hold. IndexedDB was never opened.
- For each frame the spec logged five things: the initial focus (`document.activeElement`), the box against the viewport,
  `scrollWidth` against the viewport, the smallest computed font size of any visible text in the box, and every button with
  its disabled flag.

## States (judged)

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 1.6 | "Zapis gry" at `writehang` | 05 | `data-state="failing"`, not `notYet`: "Ostatnie próby zapisu się nie udały…" + muted `1 nieudana próba · zapis · Kod: timeout` ✓ |
| 3.5 | `v1` after the first round | 01 | "Postępy zapisują się…", "Ostatni zapis", then "Zapis przeniesiono z wersji 1. Stara kopia została na tym urządzeniu." The line appears only after the v2 write (store `writtenVersion: 2`, `backup: done`) ✓ |
| 3.5 | `backupfail` | 02 | "…ale starej kopii nie udało się zachować." + muted `Kod: QuotaExceededError · Wersja b9883d5` ✓ (see V1) |
| 3.5 | `backuphang` (extra) | 03 | The same, with `Kod: timeout`. A hung copy reaches the same end as a refused one ✓ |
| 3.5 | `writefail` | 04 | `failing` + `1 nieudana próba · zapis · Kod: QuotaExceededError` ✓ |
| 4.6 | slow card at `hang`: idle, waiting, still slow | 20, 21, 22 | Calm title "Zapis wczytuje się bardzo wolno". "Poczekaj dłużej" is quiet and "Graj dalej" is main. While waiting the button is disabled and reads "Czekam na zapis…". After the second limit the button is gone and the body is the conditional advice, with the warning that clearing site data also removes the save. The note "Postępy zapisane wcześniej… zostają nietknięte." and the code line stay ✓ |
| 4.6 | `slow` (extra) | 26, 27 | Same waiting state. The read answers and the card closes by itself: the task shows 7 stars, which is the seam's save ✓ |
| 4.6 | `unavailable` card | 28 | Unchanged `saveUnavailable` card, `Kod: UnknownError` ✓ |
| 4.6 | "Zapis gry" and reset at `hang` | 23, 24 (+ import 25) | Section: `saveOff.timeout` with the softened "może pomóc usunięcie danych tej strony…" + `Kod: timeout`. Reset and import show only `deviceTimeout` and "Zamknij": a slow read is never forceable ✓ |
| 5.7 | reset at `writehang`: during and after the limit | 06, 07, 08 | Confirmation with "Anuluj" focused. During the write both buttons are dimmed and disabled, and Escape does not close the dialog (covered by e2e SV2-02). After the limit: "Nie udało się zacząć od nowa. Obecne postępy zostały bez zmian." The overwrite button is gone and "Zamknij" is active and focused ✓ |
| 5.7 | import at `writehang` (extra) | 09, 10, 11 | The summary compares "Teraz" and "Z pliku" with "Anuluj" focused. During the write "Wczytaj" and "Anuluj" are disabled. After the limit: `applyFailed` + "Zamknij" (focused) ✓ |

Layout: every dialog and section lies fully inside the viewport at both widths. `scrollWidth` equals the viewport width in every
frame, so there is no horizontal scroll. The tallest dialog is the import after the limit: 687 px at 1440 and 574 px at 1024.
It does not scroll inside. The settings panel scrolls above its sticky "Zatwierdź / Anuluj" bar, as before. Every section frame
centres "Zapis gry".

Legibility: the smallest text in any frame is 19.7 CSS px (the muted code line at 1024). That is well above 12 px. The muted
lines (`Kod: …`, the failing detail) are smaller and grey, so they do not compete with the sentence.

Tone: no red, no "błąd" and no blame. Each failure says that the current progress did not change ("Obecne postępy zostały bez
zmian", "…zostają nietknięte"). The advice to clear site data is always conditional and always says that it also removes the save.

## Keyboard and focus

The initial focus never lands on an overwrite:

- On the slow and unavailable cards it is on "Graj dalej", which never overwrites the save (e2e SRR-02 "continuing… never
  overwrites it").
- On the reset confirmation it is on "Anuluj", never on "Zacznij od nowa".
- On the import summary it is on "Anuluj", never on "Wczytaj".
- On every blocked step and after every failed write it is on "Zamknij".

**Discrepancy found and fixed (`1c7bc51`)**: on the slow card, a tap on "Poczekaj dłużej" disabled the button that held the
focus, so the focus dropped to `BODY`. That happened in frames 21, 22 and 26 of the first pass, and it stayed on the page even
after the button was removed. DESIGN-GAP row 96 says "Graj dalej" keeps the focus. `mountSaveFailedCard` now moves the focus to
"Graj dalej" when the wait starts. On the re-run, frames 20, 21, 22 and 26 log `focus=BUTTON:Graj dalej` at both widths.

During an import or reset write the focus also drops to the page, because both buttons are disabled. Escape is guarded and
"Zamknij" takes the focus after the limit. This is a follow-up (V2), not a fix: no action is possible during those 5 s.

## Hand check (numeric)

| Value | Rule | Shown |
|---|---|---|
| Stars after `v1` + one clean round (frame 01) | fixture `tests/fixtures/save-v1.json` `stars: 7` + clean round 5 × 1 + no-mistake bonus 2 = 14 | 14 ✓ |
| Failed copies before v2 (frames 02, 03) | `balance.save.backupAttempts` = 3, store ops `backup, backup, backup, write` | "Wcześniej: 3 nieudane próby" ✓ |
| Polish agreement | 1 → "nieudana próba", 2–4 → "nieudane próby" (`countNoun`) | "1 nieudana próba" (04, 05), "3 nieudane próby" (02, 03) ✓ |
| Stars after the late read (frame 27) | `?e2eSave=slow` answers `freshSession(FIRST_ROOM, 7)` | 7 ✓ |
| Build id | `__BUILD_ID__` = short HEAD SHA at build time | `b9883d5` = HEAD before this step ✓ |

## Discrepancies and fixes

- `1c7bc51` `fix(save-v2-backup-health): „Graj dalej” zatrzymuje fokus po „Poczekaj dłużej”`: focus on the slow card, see
  above. It changes only `src/ui/dom/saveFailedCard.ts`. The full local gate was run after it (handoff § 3).

## Observations (not fixed; follow-ups with triggers in `follow-ups/review-fixes.md`)

- V1: after a copy that failed 3 times, "Zapis gry" names the code twice. The line "Wcześniej: 3 nieudane próby
  (QuotaExceededError)." is followed by the moved-save line with its own `Kod:` line. This is honest but repetitive.
- V2: the focus drops to the page while an import or reset write is in flight (frames 07, 10).

## Kit

`designs/` has no frame for the "Zapis gry" lines, the slow card or these dialog states. DESIGN-GAP rows 94–97 in
`docs/design-gaps.md` record this, and this step added no gap. Tokens and components are unchanged: the card reuses the
overlay classes (`overlay-secondary`, `overlay-muted`), and the dialogs reuse the S-12 DOM dialog. No new colour was added.

VISUAL: PASS — every [visual] state of rows 1.6, 3.5, 4.6 and 5.7 was captured at 1440 and 1024 and matches the plan; the one discrepancy (focus lost on the slow card, against gap 96) was fixed in 1c7bc51 and re-captured; two observations are follow-ups and the kit has no frames for these views (gaps 94–97).
