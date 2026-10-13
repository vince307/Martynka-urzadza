# Visual review — save-export-import-reset (S-12)

Step: visual gate of autonomous run 2026-10-13-s12-s14, after impl-review (`MERGE: CLEAR`, `b85f251`). Two discrepancies
found and fixed in `76cdea4`; every frame was re-captured on `76cdea4`, 1440×900 and 1024×768. Frame list, routes and
what was not captured: `screenshots/README.md`.

## Capture: Claude in Chrome for the card, Playwright for the rest

Claude in Chrome (the browser selected at preflight, own tab, closed afterwards) loaded `/?e2eSave=unreadable` on the
hook build on 4399: the card rendered with "Kod: future · Wersja 23792f8" and `document.activeElement` = "Graj dalej".
Every other state sits behind the 2 s hold on the gear, which Claude in Chrome cannot drive (profile § 8), so the matrix
went through a throwaway Playwright spec in a gitignored `tests/e2e/visual.local/` folder against the hook build on 4399
(as in the S-10, S-11 and save-observability gates), moved out of the repo before the lint gate. Chromium launched in this
session as a plain `npx playwright` command (the first try, wrapped in `cd … | tail`, hit the MachPort sandbox error).

## Discrepancies and fixes (`76cdea4`)

| # | Found | Why it matters | Fix |
|---|---|---|---|
| V1 | Import step 2 opened with the focus on "Wczytaj" (`openDialog` focuses the first button; `document.activeElement` = "Wczytaj" in both viewports) | "Wczytaj" overwrites the child's progress: initial focus must never be on a destructive action (visual-gate rule; the reset dialog already focuses "Anuluj", gap row 49) | `openSaveImportDialog` `stepTwo` calls `cancel.focus()` after the dialog opens; button order and primary style unchanged. E2E `save-transfer.spec.ts` "#7 #2 a valid file …" now asserts `toBeFocused()` on "Anuluj". Deliberate break (line commented out) → that test RED on `toBeFocused` ("Received: inactive"); restored. Gap row 48 updated |
| V2 | The summary line read "salon: 0 z 10" (lower case at the start of a line) in import "Teraz"/"Z pliku" and the reset dialog | Room names are lower case in `src/data/rooms.ts` (`SALON.name`, used inside sentences); the plan and the copy test expected "Salon: 3 z 10" but the test passed a capitalised name | `pl.saveTransfer.room` capitalises the first letter; `tests/saveTransferCopy.test.ts` "formats a room line" adds `room('salon', 0, 10)` → "Salon: 0 z 10" (red before the fix, green after). Teacher read: "Salon: 0 z 10" — no noun after the number, no agreement needed |

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 4.6, 6.7 | panel with the three buttons | 01, 02 | "Zapis gry" heading, ok line, "Ostatni zapis: 22:16", persistence sentence (`denied`), then a quiet row "Zapisz kopię" / "Wczytaj z pliku" and "Zacznij od nowa" (same quiet style, no alarm colour) above "Postępy"; sticky "Zatwierdź"/"Anuluj" in view at both sizes ✓. At 1024 the section needs a scroll (as in the save-observability gate, O2) |
| 4.6 | export before | 03 | title, one sentence, muted privacy note, "Zapisz plik" (focused, not destructive) + "Anuluj"; nothing downloaded before the tap (L-S2) ✓ |
| 4.6 | export after | 04 | one result line "Plik został pobrany na to urządzenie.", only "Zamknij" (focused) ✓; download `martynka-zapis-2026-10-13.txt` |
| 4.6 | unreadable card with reason + build | 09 | "Kod: future · Wersja 76cdea4" muted under the note; "Graj dalej" main and focused, "Zachowaj kopię" quiet ✓ (M-S3) |
| 5.5 | import step 1 | 05 | "Wczytanie zastąpi obecne postępy na tym urządzeniu." + muted privacy line, "Wybierz plik" (focused; opens a picker, overwrites nothing) + "Anuluj" ✓ |
| 5.5 | refused file | 06 | one calm line "To nie jest plik zapisu tej gry. Obecne postępy zostały bez zmian.", "Wybierz inny plik" + "Zamknij", no "Wczytaj" ✓ |
| 5.5 | summary "Teraz / Z pliku" | 07 | two blocks with headings, stars / stage / room each, "Wczytaj" (primary) + "Anuluj" (focused after V1) ✓ |
| 6.7 | reset dialog | 10 | question title, "Znikną wszystkie postępy z tego urządzenia:", the "Teraz" block, the advice to save a copy, "Anuluj" first and focused, "Zacznij od nowa" plain ✓ |
| 6.7 | "Zapis gry" `notYet` | 08 (shows ok) | not reachable through the product: the hook reads `writes: 0, dirty: true` right after the welcome choice and `writes: 1` by the time the 2 s hold + gate open the panel (500 ms debounce). Unit-tested (`tests/saveHealth.test.ts` "no write yet … is notYet"); code-reviewed `createSaveHealthView` → `pl.settings.saveNotYet` |
| 6.7 | `ok` with the persistence sentence | 02, 08 | `persistence: denied` in headless Chromium → "Przeglądarka może usunąć zapis, gdy zabraknie miejsca. Warto czasem zapisać kopię." ✓; `granted` not reachable here (devices: [human] 6.10) |

Not captured: `earlierFailures` (no seam: `writefail` never succeeds later; unit `tests/saveHealth.test.ts`,
`tests/plural.test.ts`), export outcomes `shared`/`cancelled`/`failed` (no share sheet in headless Chromium; [human] 4.7).

## Fit at 1024×768 and focus (measured)

Each dialog: `scrollHeight == clientHeight` (no inner scroll) and the confirm button inside the viewport — export 317 px,
"Zapisz plik" at y 454–518; import step 2 457 px, "Wczytaj" at y 525–589; reset 403 px, "Zacznij od nowa" at y 497–561;
refusal 384 px, "Wybierz inny plik" at y 488–552 (viewport 768). Initial focus (`document.activeElement`): export
"Zapisz plik", after export "Zamknij", import step 1 "Wybierz plik", refusal "Wybierz inny plik", import step 2 "Anuluj"
(after V1), reset "Anuluj", card "Graj dalej" — never on an overwrite.

## Hand-checked number: stars in the import summary

File: an envelope around a v1 save with `stars: 22`; current game: hook `stars: 7` (one clean round of 5 = 5 + the
no-mistake bonus 2, also the HUD counter "7").
- `pl.saveTransfer.stars(n)` = `countNoun(n, ['gwiazdka', 'gwiazdki', 'gwiazdek'])`.
- 22: last digit 2 ∈ {2,3,4} and 22 mod 100 = 22 ∉ {12,13,14} → form "gwiazdki" → **"22 gwiazdki"**; frame 07 "Z pliku":
  "22 gwiazdki" ✓ (the number matches the file's 22).
- 7: last digit 7 ∉ {2,3,4}, not 1 → form "gwiazdek" → **"7 gwiazdek"**; frame 07 "Teraz" and frame 10: "7 gwiazdek" ✓
  (= hook 7 = HUD 7).

## Tone (DOM text read)

Parent-facing, calm, no "błąd" towards the child, no codes except the card's one muted line meant to be quoted. Every
refusal ends "Obecne postępy zostały bez zmian." Reset is a question, lists what disappears and advises a copy first.
Correct Polish: "Wczytanie zastąpi obecne postępy", "Plik nie jest nigdzie wysyłany", "Znikną wszystkie postępy z tego
urządzenia", numeral agreement as above. Reached by a child only through the 2 s hold and the 13–19 × 13–19 gate.

## Observations (not fixed)

- O1: the panel's "Postępy" shows "Krok 8 z 8" for E3 after one round on the parent path (`?e2eMonth=10`), "Krok 4 z 8" for
  E1 on the child path. Not S-12 code (S-07/S-08 start-step rule D); not investigated here — worth a look when the
  maintainer reads 6.9.
- O2 (carried): at 1024×768 "Zapis gry" and its buttons are below the fold of the panel; the sticky bar's shadow hints at more.
- O3 (carried): DOM overlays use the system sans-serif, not Atkinson Hyperlegible Next.
- O4: the focus ring is not drawn after a touch (`:focus-visible`), so frames 07/10 show no ring on the focused "Anuluj";
  the focus itself is measured above.

## Gate in this step (after the fix, on `76cdea4`)

lint OK; typecheck OK; vitest 1247 passed (baseline 1176 on main + 71, slice; this step +0 tests, +1 assertion); deploy +
ops tests OK; `sample` E1–E6 `Naruszenia: 0`; `npm run build` `e2e hook: absent (2 chunks checked)`; `npx playwright test`
37 passed (baseline 33 + 4); servers 4397/4398/4399 not listening afterwards.

VISUAL: PASS — export (before/after), import (step 1, refusal, "Teraz / Z pliku"), reset, the "Zapis gry" section ok with the persistence sentence and the three buttons, and the unreadable card with "Kod · Wersja" captured at 1440×900 and 1024×768 on 76cdea4; two discrepancies fixed (import step-2 focus moved to "Anuluj", "Salon" capitalised); "22 gwiazdki"/"7 gwiazdek" hand-checked; notYet, earlierFailures, persistence granted and share outcomes not reachable here (unit-tested / [human])
