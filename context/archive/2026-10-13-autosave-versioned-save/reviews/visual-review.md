# Visual review — autosave-versioned-save (S-11)

Step: visual gate of autonomous run 2026-10-13-s09-s11, after impl-review (`MERGE: CLEAR`). Frames at `9be4701`,
1440×900 and 1024×768, reached through the product; capture method, frame list and how each state was reached:
`screenshots/README.md`.

## Capture: Playwright fallback, Claude in Chrome not used

The card needs the e2e-only `?e2eSave=unreadable` seam of the hook build, the restore needs a reload inside one browser
context and the gear opens only after a 2 s hold (profile § 8: Claude in Chrome cannot drive the Phaser long press). As in
the S-10 gate, the whole matrix went through a throwaway Playwright spec in a gitignored `tests/e2e/visual.local/`
folder against the hook build on 4399, moved out of the repo before the lint gate. Chromium launched in this session.

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 5.6 | card | 01 | title large, body and note centred, two buttons side by side; "Graj dalej" is the filled teal main button and has the focus (visible ring); "Zachowaj kopię" is the quiet butter button. Not a destructive action in focus ✓. No frame around the card: it is mounted before the game, on the page background (DESIGN-GAP 42) |
| 5.6 | adult gate over the card | 02 | the same "Pytanie dla rodzica" dialog as on the welcome screen, scrim over the card, digit pad, "OK" / "Anuluj" ✓ |
| 5.6 | export path | 03 | headless Chromium has no share sheet, so the copy is a download `martynka-zapis.txt` (59 bytes, the raw v99 save: `"version": 99`, `"stars": 7`); the card stays, so the parent can still choose "Graj dalej" ✓. The share sheet on iPad / Android stays human row 5.7 |
| 5.6 | welcome after "Graj dalej" | 04 | the normal "Ile masz lat?" screen with "Rodzic"; hook `load: unreadable`, `blocked: true`, `writes: 0` ✓ |
| (step prompt) | restored game after a reload | 05/05b vs 06/07/08 | HUD 15 before and after; the striped butter floor (variant 2) in the same place; task button "Pomaluj ściany ★6" both times; stage "Klasa 2, I półrocze" selected and "Krok 8 z 8" in the parent panel both times; hook `load: fresh` before, `loaded` after; the reload landed on the task screen, not the welcome ✓ |

Both sizes show the same layout; at 1024×768 the card text wraps to two lines and everything stays on screen.

"Krok 8 z 8" on E3 in October is the S-07 rule D, not this slice: age 10 places on E6, so E3 is "behind" and opens fully
(`calendarStart`, progress 1). Same value before and after the reload, which is what this gate checks.

## Hand-checked number: the star balance across the reload

Rule: a purchase deducts the task cost once (`src/data/rooms.ts`: floor 5); a retype pays 0; the saved balance wins over
the `?e2eStars` seam on a reload (the address still carries `e2eStars=20`).

- Start `?e2eStars=20` → 20 (hook `stars` 20). First task: two misses, solution, retype → +0 → 20.
- Floor (cost 5, hook `currentTask.cost` 5): 20 − 5 = **15** (frame 05 HUD 15, hook `stars` 15, save `lastReason: now`,
  `dirty: false`).
- Reload: balance from the save = **15** (frame 06 HUD 15, hook `stars` 15, `counterText` "15", `load: loaded`); not 20
  from the seam. After one more retype (+0): 15 (frame 07). Same at both sizes. The next task costs 6 ("Pomaluj ściany ★6"),
  and 15 ≥ 6, so it is affordable, consistent with the full-colour button in both frames.

## Text read (DOM card; profile § 9 allows text checks)

Card text read from the DOM: "Nie udało się wczytać zapisu" / "Zapis gry został na tablecie bez zmian. Rodzic może
zachować jego kopię." / "Zachowaj kopię" · "Graj dalej" / "Tym razem gra nie zapisze postępów."

- As a parent: calm and factual; it says what happened (the save could not be read), that nothing was lost or changed
  ("został na tablecie bez zmian"), what the parent can do (keep a copy) and the one consequence (no saving this time).
  No blame on the child or the parent, no technical words, no alarm colour. Clear.
- As a primary-school teacher (and for a 7-year-old who reads it): short sentences, correct Polish ("wczytać zapisu"
  genitive after negation, "jego kopię" accusative, "postępów" genitive plural after negation). The child has one obvious
  big button, "Graj dalej", already in focus, and cannot get stuck. "Zachowaj kopię" is gated behind the adult check.
- Nit, not changed: a parent may wonder whether the card will come back next time (it does, at every start until the
  save is readable or S-12 adds import/reset). That belongs to the S-12 parent panel (follow-up "Trigger: S-12").

## Observations (not fixed)

- O1: after the export the gate closes and the focus is not returned to a card button (frame 03: no focus ring). The game
  is touch-only, so nothing a child or parent sees changes; recorded for the S-12 export/import work.
- O2: the card and the gate use the system sans-serif, not Atkinson Hyperlegible Next. All DOM overlays do
  (`src/style.css` `font-family: sans-serif`); this card is not different from the others. Art/typography slice.

## Gate in this step

No production code changed. lint OK; typecheck OK; vitest 1142 passed (baseline 1079 on main + 63, slice; this step +0);
deploy + ops tests OK; `sample` E1–E6 `Naruszenia: 0`; `npm run build` `e2e hook: absent (2 chunks checked)`;
`npx playwright test` (one plain command, this session, on `9be4701`) 29 passed (baseline 26 + 3).

VISUAL: PASS — failed-load card, adult gate over it, export (download of the raw copy) and welcome after "Graj dalej", plus salon/HUD/stage before and after a reload, captured at 1440×900 and 1024×768 and matching the plan within DESIGN-GAP 42; card text calm, blame-free and clear that the save is untouched; balance 20 − 5 = 15 before and 15 after the reload hand-checked; observations O1 (focus after export) and O2 (system font in DOM overlays) only
