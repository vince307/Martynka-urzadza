# Visual review — save-observability-c1-c2 (fix C-1, C-2, M-S4)

Step: visual gate of autonomous run 2026-10-13-fix-save-observability, after impl-review (`MERGE: CLEAR`). Frames at
`8af55af`, 1440×900 and 1024×768, reached through the product and the hook-build `?e2eSave=` seams; capture method,
frame list and how each state was reached: `screenshots/README.md`.

## Capture: Playwright fallback, Claude in Chrome not used

The states need the e2e-only `?e2eSave=` seams of the hook build, every state needs a fresh device (a new browser
context), and the settings gear opens only after a 2 s hold (profile § 8: Claude in Chrome cannot drive the Phaser long
press). As in the S-10/S-11 gates, the matrix went through a throwaway Playwright spec in a gitignored
`tests/e2e/visual.local/` folder against the hook build on 4399, moved out of the repo before the lint gate. Chromium
launched in this session.

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 4.6 | "save unavailable" card | 01 | same layout as the unreadable card: large title, centred body, one filled teal "Graj dalej" with the focus ring (no destructive action in focus), muted note. No "Zachowaj kopię": there is nothing to keep ✓. At 1024 the title wraps to two lines, everything on screen ✓ |
| 4.6 | the same card after the load timeout (M-S4) | 02 | identical to 01; hook after "Graj dalej": `load: unavailable`, `blockedBy: unavailable`, `lastError: timeout` ✓ |
| 4.6 | "Graj dalej" → welcome | 02b, 03 | the normal "Ile masz lat?" screen with "Rodzic"; no trace of the card ✓ |
| 4.6 | unreadable card (regression, consistency) | 04 | unchanged from S-11: "Zachowaj kopię" (quiet butter) + "Graj dalej" (main, focused). Side by side with 01: same title size, body width, button style, same note text ✓ |
| 5.8 | panel ok | 05 | "Zapis gry" heading (same style as "Postępy") between the reading choice and the progress preview; "Postępy zapisują się na tym urządzeniu." + "Ostatni zapis: 17:34" (desktop) / "17:35" (tablet); "Zatwierdź" / "Anuluj" stay in view (sticky) ✓ |
| 5.8 | panel failing (`?e2eSave=writefail`) | 06 | "Ostatnie próby zapisu się nie udały. Postępy z tej gry mogą nie zostać zachowane." No alarm colour, same text style ✓; hook `consecutiveFailures: 1`, `lastError: QuotaExceededError`, `writes: 0` |
| 5.8 | panel off (unavailable) | 07 | "Zapis jest wyłączony: przeglądarka nie udostępniła zapisu." ✓; hook `blockedBy: unavailable`, `skipped: 1`, `writes: 0` |
| 5.8 | panel off (unreadable) | 08 | "Zapis jest wyłączony: starego zapisu nie udało się wczytać." ✓; hook `blockedBy: unreadable`, `writes: 0` |

The `fatal` cause has no seam: code-reviewed (`createSaveHealthView` picks `pl.settings.saveOff[view.cause]`) and
unit-tested (`tests/saveHealth.test.ts`), not captured.

## Hand-checked value: "Ostatni zapis" against the hook's `lastWriteAt`

Rule: `createSaveHealthView` shows `new Date(lastWriteAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })`
in the device's time zone (the capture context pins `Europe/Warsaw`; on 2026-10-13 that is CEST, UTC+2).

Desktop frame 05: hook `lastWriteAt = 1791905692543` ms.
- 1791905692543 ms → 1791905692 s (floor).
- Midnight UTC of 2026-10-13: 2026-01-01 is day 56·365 + 14 leap days = 20454 since 1970; 13 October is day-of-year 286
  (31+28+31+30+31+30+31+31+30 = 273, +13), so day 20454 + 285 = 20739; 20739 · 86400 = 1791849600 s.
- 1791905692 − 1791849600 = 56092 s = 15 h (54000) + 34 min (2040) + 52 s → 15:34:52 UTC.
- +2 h (CEST) = **17:34**, truncated to minutes. Panel text: "Ostatni zapis: 17:34" ✓.

Tablet frame 05: `1791905721450` → 1791905721 − 1791849600 = 56121 s = 15:35:21 UTC → **17:35**; panel "Ostatni zapis: 17:35" ✓.
(Cross-check with Node: `new Date(1791905606008).toISOString()` = `2026-10-13T15:33:26.008Z`, pl-PL Warsaw `17:33`, from the first capture run.)

## Text read (DOM overlays; profile § 9 allows text checks)

Card text read from the DOM: "Gra nie może teraz zapisywać postępów" / "Przeglądarka nie udostępniła zapisu gry. Można
grać dalej. Jeśli to się powtarza, sprawdź, czy przeglądarka nie blokuje danych stron." / "Graj dalej" / "Tym razem gra
nie zapisze postępów."

- As a parent: says what happened (the browser gave no storage), that play goes on, the one consequence (nothing saved
  this time) and one thing to check if it repeats. No blame, no error codes, no stack trace, no alarm colour.
- As a primary-school teacher: correct Polish ("zapisywać postępów" genitive after negation, "nie udostępniła zapisu",
  "czy przeglądarka nie blokuje danych stron"); short sentences.
- Would a child be scared? No: nothing says "błąd" or that something broke or was lost; the big focused button is "Graj
  dalej" and is the only one. A 7-year-old who reads "Gra nie może teraz zapisywać postępów" learns only that today does
  not count, which the note repeats calmly. The "sprawdź" sentence plainly addresses an adult.
- On a timeout (frame 02) "nie udostępniła" is still true in the parent's terms (the storage did not answer); no
  separate wording is needed.

Panel ("Zapis gry", behind the adult gate): "Postępy zapisują się na tym urządzeniu." / "Ostatni zapis: 17:34" /
"Ostatnie próby zapisu się nie udały. Postępy z tej gry mogą nie zostać zachowane." / "Zapis jest wyłączony:
przeglądarka nie udostępniła zapisu." / "Zapis jest wyłączony: starego zapisu nie udało się wczytać." — factual,
grammatical, no numbers (so no numeral agreement), no jargon. Not seen by the child unaided (2 s hold + 13–19 × 13–19 gate).

## Observations (not fixed)

- O1: "Ostatnie próby zapisu się nie udały" uses the plural even after a single failed write (frame 06:
  `consecutiveFailures: 1`). Natural in Polish as a general statement and accurate as soon as the debounced retries run;
  left for the [human] 5.10 copy acceptance.
- O2: the panel opens scrolled to the top; at 1024×768 the "Zapis gry" sentence starts just under the sticky actions and
  needs a scroll (as the progress preview already did since S-08; the sticky bar's shadow hints at more). Frames are
  scrolled to show it. Not a defect of this change; ordering of sections is a [human] 5.9 form question.
- O3 (carried from S-11): DOM overlays use the system sans-serif, not Atkinson Hyperlegible Next.

## Gate in this step

No production code changed. lint OK; typecheck OK; vitest 1176 passed (baseline 1142 on main + 34, slice; this step
+0); deploy + ops tests OK; `sample` E1–E6 `Naruszenia: 0`; `npm run build` `e2e hook: absent (2 chunks checked)`;
`npx playwright test` (one plain command, this session, on `8af55af`) 33 passed (baseline 29 + 4).

VISUAL: PASS — unavailable card (rejected read and load timeout), "Graj dalej" → welcome, the unreadable card for consistency, and the "Zapis gry" panel section ok (with time) / failing / off (unavailable, unreadable) captured at 1440×900 and 1024×768 with "Zatwierdź"/"Anuluj" in view; copy calm and child-safe; "Ostatni zapis 17:34" = lastWriteAt 1791905692543 → 15:34:52 UTC + 2 h hand-checked; fatal cause code-reviewed only; observations O1–O3
