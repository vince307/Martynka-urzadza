# Visual review for audit-boot-hidden-tab

This is the visual gate of run 2026-10-20-playtest-boot, slice 2 of 2. It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `fa37a67`. The frames and the route are in `screenshots/README.md`: Playwright on the hook build, port 4399, at 1440×900 and 1024×768, 10 states per width.

The frames were judged against:
- the `[visual]` rows 3.5, 5.4 and 6.5 of `plan.md`;
- the kit frames `designs/martynka-maths-A-v1/screenshots/unlock.png`, `summary.png` (card look) and `tablet-1024.png`; the kit has none of these views (DESIGN-GAP rows 29, 51, 67, 117, 153);
- the copy in `src/data/pl.ts` (`settings.artCut`, `settings.artCutBackground`, `errorCard.*`, `saveFailed.detail`, `saveTransfer.deviceNewer`, `saveTransfer.siteDataAdvice`, `saveRefused.*`).

## States

| Row | Frames | Verdict |
|---|---|---|
| 3.5 | art-cut, art-cut-background | The ordinary cut reads "Część obrazków nie zdążyła się wczytać. Przy lepszym internecie uruchom grę ponownie." After a hidden span (hook `bootLoad.hiddenMs` 3736 desktop / 3642 tablet, `elapsedMs` 6792 / 6687) the same place reads "Część obrazków nie zdążyła się wczytać, bo gra była w tle podczas uruchamiania. Uruchom grę ponownie.": two short sentences, correct Polish, and no word about the internet. Only the one line changes; the rest of the section (counts, folder, labels, font, `Kod: cut`) is the same in both, which is the plan's intent. Readable at both widths inside the scrolling panel; "Zatwierdź"/"Anuluj" stay below it. |
| 5.4 | error-step, error-boot | Title, one sentence, the teal "Zacznij od nowa" and under it `Kod: Error · Wersja fa37a67` in the muted style (lighter teal, smaller than the sentence). One line at both widths (measured height = one line-height: 42.6 px at 1024, 49.9 px at 1440). The focus is on "Zacznij od nowa" in both states (visible focus ring in the boot frame). That button reloads the page; it is the card's only action and not destructive (the save is kept), so the rule "initial focus never on a destructive action" holds. |
| 6.5 | reset-dialog, reset-refused-dialog, reset-refused-card, import-summary, import-refused-dialog, import-refused-card | Before the confirmation the reset dialog's focus is on "Anuluj" (import step two likewise), never on "Zacznij od nowa"/"Wczytaj". After the refused write the dialog swaps its buttons for one "Zamknij" and shows `deviceNewer` ("Nowsza wersja gry zapisała już postępy na tym urządzeniu, więc ta karta ich nie zastąpi. Uruchom grę ponownie."); the site-data advice is absent (`siteDataAdvice` count 0). The refusal card is already up behind the dialog, its button covered by the dialog (hit test at the button's centre lands in the dialog), so it is not tappable until "Zamknij" — the dialog stays on top and offers that one way out, so the parent is not trapped. After "Zamknij" the card shows "Zacznijmy grę jeszcze raz", one sentence, `Kod: NewerSave · Wersja fa37a67` (muted, one line) and "Zacznij od nowa"; a tap on it reloaded the page at both widths, for reset and for import. |

## Keyboard and focus (impl-review F3)

Recorded with `document.activeElement` at each step:
- dialog open after the refusal: the focus is on the `deviceNewer` line inside the dialog (the failure line takes the focus, `tabIndex -1`), not on the card behind it. The card's `restart.focus()` at mount is overridden by the dialog's failure handler, so F3's "focus moves to the card behind the dialog" did not happen;
- after "Zamknij": the focus was on `<body>` (lost) — the dialog gave it back to the element that opened it, the settings button that no longer exists. That is F3's trigger "lost after Zamknij": fixed as VG-1 below.

## Hand-checked values (mandatory)

- **Hidden span vs. the cut**: the e2e seam's total limit is 3000 ms of visible time. Desktop: `elapsedMs` 6792 − `hiddenMs` 3736 = 3056 visible ms ≥ 3000 ✓, so the cut came only after 3 s of visible time and the hidden 3.7 s did not count. Tablet: 6687 − 3642 = 3045 ≥ 3000 ✓.
- **Numeral agreement in the frames**: "15 z 41 obrazków nie wczytało się", "3 z 5 obrazków ekranów nie wczytały się", "brak 15 obrazków", "0 gwiazdek", "7 gwiazdek" — all correct for 15/41/3/5/0/7.
- **Import summary**: the file holds 7 stars, stage E4 → "7 gwiazdek", "Klasa 2, II półrocze" (E4 = grade 2 × semester 2) ✓; "Salon: 0 z 12" = 0 tasks of the 12 salon renovation tasks ✓.

## Discrepancies

- **VG-1 (fixed, 9f1988d).** After a refused replace, "Zamknij" in the import or reset dialog left the focus on `<body>`: the dialog restored it to the element that opened it, which was gone.
  - Fix: `openDialog`'s `close` (`src/ui/dom/dialog.ts`) gives the focus to a card (`[role="alertdialog"]`) still on screen unless the opener is alive and inside that card; otherwise it restores the opener as before.
  - Test: `tests/e2e/save-transfer-blocked.spec.ts` "#2 Z-8 …" now taps "Zamknij" and expects the card's "Zacznij od nowa" to be focused. Red without the fix ("Expected: focused, Received: inactive"), green with it.
  - Full local gate after the fix: lint, typecheck OK; unit 3710 passed (baseline 3683, +27, unchanged by the fix); deploy scripts, `sample` E1–E6, build OK (`e2e hook: absent`); full e2e 143 passed of 143 listed (baseline 141, +2), 12.4 min, 4 workers.
  - Follow-up F3 in `follow-ups/review-fixes.md` is closed by this.

## Observed, not this slice

- The `Kod: cut · Wersja …` line of "Obrazki" is drawn in the body style, while the same `Kod:` line of "Gra bez internetu" and "Zapis gry" is muted (`createArtHealthView` gives the `code` line no class). It came with health-lines-and-smoke, not with this change; follow-up with a trigger.
- "Gra bez internetu" shows `Kod: TypeError` in the settings frames because the capture blocks service workers.

## Not covered

- Row 2.6 [human] (a real tablet with a hidden tab for over a minute) stays open.
- The refusal card raised outside a dialog (a refused autosave write) is the earlier stale-tab-and-health flow, not captured here.

VISUAL: PASS — all [visual] states of rows 3.5, 5.4 and 6.5 captured at 1440 and 1024 through the product; the background line never mentions the internet, `Kod:` lines are muted and one line, initial focus is never on a destructive action, and one focus defect (VG-1: focus lost on `<body>` after "Zamknij" over the refusal card) was fixed with a red-first e2e assertion.
