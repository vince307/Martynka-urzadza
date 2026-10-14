# Visual review: save-reason-and-recovery

This is the visual gate of autonomous run `2026-10-14-save-s13b-s15-s14b`, after impl-review (`MERGE: CLEAR`, fixes in
`02b8f42`). It captured 22 states × 2 widths = 44 frames on `49e468e`. The frame list and routes are in `screenshots/README.md`.
It found no discrepancy that needed a code fix, and it records two observations as follow-ups.

## Capture

The capture used Playwright only, as in the S-13, S-14 and art-stand-in gates. Claude in Chrome was not used. Every
state except the start card sits behind the 2 s gear long press, and Claude in Chrome cannot drive it (profile § 8).
Splitting the cards into a Chrome run would only have mixed two renderers for the same slice.

- The spec was a throwaway in the gitignored `tests/e2e/visual.local/`. It had its own config: `webServer` built
  `dist-e2e` with `E2E_HOOK=1` and served it on 4399, `reuseExistingServer: false`.
- It reused `tests/e2e/support/{welcome,hook}.ts` and ran as one plain `npx playwright test --config=…` command.
  Chromium launched in this subagent session.
- Viewports were 1440×900 and 1024×768 (profile § 9), both with touch.
- States were reached only through the `?e2eSave=unavailable|hang|unreadable|corrupt` seams and the real UI. IndexedDB
  was never written.
- The first pass cut the "Zapis gry" section under the sticky "Zatwierdź / Anuluj" bar, because `scrollIntoViewIfNeeded`
  stops at the edge. That was a capture problem, not a product one: the panel scrolls. The second pass centres the section,
  and those frames are the ones kept.
- For each frame the spec logged the initial focus (`document.activeElement`), the dialog box against the viewport, and
  the document width against the viewport width.

## States (judged)

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 2.5 | "Zapis gry", `unavailable` | 02 | "Zapis jest wyłączony: przeglądarka nie udostępniła zapisu." + muted `Kod: UnknownError · Wersja 49e468e` under it ✓ |
| 2.5 | "Zapis gry", `timeout` | 11 | Its own sentence: "…odczyt zapisu trwał za długo. Uruchom grę ponownie." + `Kod: timeout` ✓ |
| 2.5 | start card, `unavailable` / `hang` | 01, 10 | Detail line `Kod: UnknownError · Wersja 49e468e` / `Kod: timeout · …` under "Tym razem gra nie zapisze postępów." The card body is the same for both causes. That is planned: a separate `timeout` body is a follow-up triggered by the N-7 measurement ✓ |
| 3.6 | import / reset, `future` | 22, 23 | Only `deviceFuture` ("…pochodzi z nowszej wersji gry, więc ta wersja go nie zastąpi. Zaktualizuj grę: zapis wczyta się bez zmian.") and "Zamknij". No file choice, no confirmation, no "Zastąp mimo to" ✓ |
| 3.6 | import / reset, `corrupt` | 32, 33 | The warning (`deviceUnreadable`) stands where "Teraz" would be. Import offers "Wybierz plik" / "Anuluj", and reset offers "Anuluj" / "Zacznij od nowa". There is no "0 gwiazdek" ✓ |
| 3.6 | import / reset, `timeout` | 12, 13 | Only `deviceTimeout` and "Zamknij". No "Zastąp mimo to" (a slow read is never forceable) ✓ |
| 3.6 | "Zapis gry", `future` | 21 | "…zapis na tym urządzeniu pochodzi z nowszej wersji gry. Zaktualizuj grę, a postępy wrócą." + `Kod: future · Wersja 49e468e` ✓ |
| 4.6 | import / reset, `unavailable`, blocked step | 03, 05 | `deviceUnavailable` (it names the repeat condition and says the earlier progress disappears), then "Zastąp mimo to" and "Zamknij". The initial focus is on "Zamknij" ✓ |
| 4.6 | import after "Zastąp mimo to" | 04 | `forcedWarning` ("Zapisu z tego urządzenia nie udało się odczytać. Zostanie zastąpiony."), then the file-choice step with "Wybierz plik" (focus) and "Anuluj". The overwrite still needs the summary step and "Wczytaj" ✓ |
| 4.6 | reset after "Zastąp mimo to" | 06 | The `forcedWarning` sits in the summary place, with "Anuluj" (focus) and "Zacznij od nowa" ✓ (see O2 about the colon) |
| 5.7 | export, `unavailable` / `corrupt` | 07, 34 | The muted `exportNotDevice` line ("…ta kopia zawiera tylko obecną grę, bez wcześniejszych postępów.") above the privacy line ✓ |
| 5.7 | export, healthy | 41 | No warning, as in S-12 ✓ |

The reference frames 30 (corrupt card) and 40 (healthy "Zapis gry": "Postępy zapisują się…", "Ostatni zapis", the
persistence line) did not change from earlier slices.

Layout: every dialog lies fully inside the viewport at both widths, and nothing scrolls inside it. The tallest dialog is
`corrupt` import, 513 px at 1440 and 435 px at 1024. `scrollWidth` equals the viewport width in every frame, so there is
no horizontal scroll. The settings panel scrolls inside its box above the sticky "Zatwierdź / Anuluj" bar, as before. The
`Kod: …` line is smaller and muted, so it does not compete with the sentence.

## Keyboard and focus

The initial focus comes from the log of every frame. It is never on a destructive or overwriting action:

- "Zamknij" in every blocked step (03, 05, 12, 13, 22, 23).
- "Wybierz plik" on an import's first step (04, 32). This step only opens the picker.
- "Anuluj" on every reset with a confirmation (06, 33).
- "Zapisz plik" on export, which is not destructive.
- "Graj dalej" on the start cards.

"Zastąp mimo to" never receives the initial focus.

## Hand check (numeric)

These views show no computed numbers. The checkable values are the code lines, and each matches its seam:

| Seam | Code line |
|---|---|
| `unavailable` | `UnknownError`, the error name the seam throws |
| `hang` | `timeout`, after `balance.save.loadTimeoutMs` = 5000 ms. The card appeared inside the spec's 15 s wait (not timed exactly) |
| `unreadable` | `future` |
| `corrupt` | `corrupt` |

`Wersja 49e468e` equals HEAD's short SHA (`git rev-parse --short HEAD`), which is the `__BUILD_ID__` in the corner.

## Discrepancies and fixes

None needed a code change, and no `fix(...)` commit was made.

## Observations (not fixed; follow-ups with triggers in `follow-ups/review-fixes.md`)

- O1: the start card for `future` (frame 20) keeps the generic `pl.saveFailed` title and body ("Nie udało się wczytać
  zapisu"). Only its code line says `future`, while the panel and the dialogs say "z nowszej wersji gry". SIR-01's scope
  was the autosaver status and `deviceSaveView`, not the card, so the card is consistent with the plan. A `future` body
  would steer the parent to update rather than copy.
- O2: in the reset dialog the lead line "Znikną wszystkie postępy z tego urządzenia:" ends with a colon. Under
  `unavailable` + "Zastąp mimo to" (frame 06) and under `corrupt` (frame 33), the warning line follows it instead of a
  list. This pattern comes from the previous change (`corrupt`) and reads acceptably, but a lead without the colon would
  be cleaner when no list follows.

## Kit

`designs/` has no frame for these dialogs, the "Zapis gry" section or the card's code line. DESIGN-GAP rows 69–72 in
`docs/design-gaps.md` record this, and this step added no gap. Tokens and components are unchanged: the dialogs reuse the
S-12 DOM dialog, buttons and muted line classes, with no new colour.

## Gate (working tree = `49e468e` + docs only; the throwaway spec moved out first)

| Gate | Result |
|---|---|
| lint | OK |
| typecheck | OK |
| vitest | 1927 passed = main baseline 1905 + 22, unchanged from impl-review |
| deploy + ops tests | OK |
| `sample` E1–E6 | exit 0 each |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |

The full `npx playwright test` suite was not re-run, because no source changed in this step. The capture spec's 10 runs
(5 flows × 2 viewports) passed on the hook build.

VISUAL: PASS — every [visual] state of rows 2.5, 3.6, 4.6 and 5.7 was captured at 1440 and 1024 and matches the plan, with the initial focus never on "Zastąp mimo to" or an overwrite. Two copy observations (the `future` start card, the reset lead's colon) are follow-ups; the kit has no frames for these views (gaps 69–72).
