# Visual review for post-run-polish

This is the visual gate of run 2026-10-21-post-run-polish (slice `fix:post-run-polish`). It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `f6c3fb4`. The frames and the route are in `screenshots/README.md`: Playwright on the hook build, port 4399, at 1440×900 and 1024×768, 7 states per width (14 frames).

The frames were judged against:
- the `[visual]` rows 3.5 and 6.5 of `plan.md`;
- the kit frames `designs/martynka-maths-A-v1/screenshots/task-tiles.png` (the question line at the top of the task card, tiles below) and `tablet-1024.png`; the kit has no "Wstaw znak"/"Uzupełnij" heading (DESIGN-GAP 154) and no settings panel (DESIGN-GAP 67, 140, 153);
- the copy in `src/data/pl.ts` (`round.heading.{calculate,sign,fill}`, `settings.artCut`, `settings.artMissing`, `settings.roomArtMissing`, `settings.uiArtMissing`, `settings.artFolders`);
- the heading rule `headingOf` (`src/core/round/heading.ts`): not an expression → none; a sign answer → "Wstaw znak"; a box that is not the single trailing result slot → "Uzupełnij"; else "Oblicz".

## States

| Row | Frames | Verdict |
|---|---|---|
| 3.5 sign | heading-sign, heading-sign-expr, heading-sign-op | "Wstaw znak" sits where "Oblicz" sat (top of the card, the same style and size as the kit's question line), over "5 □ 3", "4 + 2 □ 1 + 5" and "6 □ 4 = 2"; tiles < > = and − + below. The widest prompt (COMPARE_EXPR) keeps clear margins at 1024; no overlap of heading, prompt and tiles at either width. "Wstaw znak" also fits MISSING_OP: + and − are signs in the school wording. |
| 3.5 fill | heading-fill | "Uzupełnij" over "4 + □ = 5" (tablet) and "□ − 1 = 3" (desktop). On desktop the first task of the forced round had the hidden number in the result slot ("a − b = □", MISSING `slots` includes `result`) and correctly read "Oblicz"; the second was the box-inside case. Correct Polish, one word, no collision. |
| 3.5 calculate | heading-calculate | "Oblicz" over "1 + 1" / "3 + 2" exactly as before the change. |
| 3.5 word | heading-word | No heading: the sentence prompt starts at the top line of the card ("W ogrodzie jest 1 kwiatek. Dołożono jeszcze 7 kwiatków. …"), as before. Numeral agreement correct (1 kwiatek, 7 kwiatków, 2 klocki, 1 klocek). |
| 6.5 | art-cut | "Obrazki" shows the ordinary cut line `artCut` ("Część obrazków nie zdążyła się wczytać. Przy lepszym internecie uruchom grę ponownie."); `getByText('w tle')` count 0 at both widths; the rest of the section (three count lines, the folder line, the skip line, the labels, the font line, `Kod: cut · Wersja f6c3fb4`) is in the same order and style as the 2026-10-20 frames (`context/archive/2026-10-20-audit-boot-hidden-tab/screenshots/*-art-cut.png`). Readable at both widths inside the scrolling panel; "Zatwierdź"/"Anuluj" stay in the footer. |

## Hand-checked values (mandatory)

- **Pictures-only cut count (H-2)**: the hook's `bootLoad.cutByTable` after the cut start (both widths identical): task 15 + room 38 + ui 3 = **56 pictures**; sound 12 and font 1 are also cut, so the old count (`cut.length`) would have been 56 + 12 + 1 = **69** (= `bootLoad.cut.length`, 69 entries). `pictureCutCount` returns 56 > 0, so the cut line shows; the cut line itself carries no number (`artCut` takes none), so the numbers the parent reads are the per-table lines: "15 z 41" = `artHealth` {missing 15, total 41} ✓ = the 15 money files of `cutByTable.task` ✓; "38 z 38 obrazków pokoju" = `roomArtHealth` {missing 38, total 38} ✓ = `cutByTable.room` 38 ✓; "3 z 5 obrazków ekranów" = `cutByTable.ui` 3 (wallet-open, skill-notebook, salon-after) ✓; "pieniądze: brak 15 obrazków" ✓. No line counts sounds or the font as pictures; the font has its own line ("Litery w zadaniach są w zastępczym kroju pisma.").
- **Numeral agreement in the frames**: "15 z 41 obrazków nie wczytało się", "38 z 38 … nie wczytało się", "3 z 5 … nie wczytały się", "brak 15 obrazków" — correct for 15/38/3.
- **Heading rule on the drawn prompts**: "5 □ 3" answer string → sign ✓; "4 + □ = 5" one box, not trailing `= □` → fill ✓; "a − b = □" (desktop, first fill-skill task) single trailing result box → calculate ✓; "3 + 2" no box → calculate ✓.

## Keyboard and focus

The settings panel opens with the focus on its first focusable element, the stage button "Klasa 1, I półrocze" (`document.activeElement` at both widths). A stage is applied only by "Zatwierdź" (`openSettingsPanel` `onConfirm`), so the initial focus is not on a destructive action; "Zacznij od nowa" is not focused. The task screen is canvas-only (no DOM focus).

## Discrepancies

None in this slice's views. No fix commit.

## Observed, not this slice

- The word prompt at 1440 breaks "Tomkowi 1 / klocek" with the number at the end of the line (Polish typography keeps a number with its noun). The wrap comes from `wrapBlankLines`/Phaser word wrap, unchanged by this slice; follow-up with a trigger in `follow-ups/review-fixes.md`.
- The folder line starts lower-case ("pieniądze: brak 15 obrazków."), as in the 2026-10-20 frames; earlier change, not this slice.

## Not covered

- Row 2.6 [human] (a tablet with a Polish voice, "Wstaw znak" pronounced) stays open; the capture silences speech, the narration text itself is pinned by `tests/e2e/narrator.spec.ts` #11.
- The heading on the fill skill `E2.4.fact_swap_20` was not captured (the E1 MISSING frame covers the "Uzupełnij" state); `tests/heading.test.ts` covers its rule.

VISUAL: PASS — all [visual] states of rows 3.5 and 6.5 captured at 1440 and 1024 through the product; "Wstaw znak", "Uzupełnij" and "Oblicz" sit where "Oblicz" sat with no overlap, word tasks have none, "Obrazki" shows the ordinary cut line without the background sentence and its counts are pictures only (56 = 15 + 38 + 3, not 69), initial focus is not on a destructive action.
