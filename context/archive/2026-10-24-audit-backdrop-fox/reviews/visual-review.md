# Visual review for audit-backdrop-fox

This is the visual gate of run 2026-10-24-audit-backdrop-fox (slice `fix:audit-backdrop-fox`). It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `e8c1181`. The capture setup and every frame are listed in `screenshots/README.md`: Playwright on the hook build, port 4399, 1440×900 and 1024×768, 12 frames per width.

The frames were judged against:
- the `[visual]` row 4.9 of `plan.md`;
- `scope.md` items 2, 3, 5 and 6 (backdrop redrawn after a restore; the fox named truthfully in "Obrazki"; a fox with any pose missing never shown);
- `pl.settings.guideMissing` and `pl.settings.uiArtMissing` in `src/data/pl.ts`, DESIGN-GAP 168.
The kit has no frame for a context loss or for a missing fox, so each "after" frame is judged against its own "before" frame.

## States

| Row 4.9 state | Frames | Verdict |
|---|---|---|
| Welcome before / after lose + restore | `welcome-before`, `welcome-after-restore` | The blurred salon is back behind the age card: same window, plants, frames and floor, same blur and wash. Hook: `drawn true`, `blurred true`, `renderer webgl`, `redraws 0 → 1`, `captures 1 → 2`. |
| Task before / after lose + restore | `task-before`, `task-after-restore` | Same blurred salon around the notebook; the beads, counter, fox, keypad and gear are unchanged. Hook as above. |
| Task after a restore while the room was open | `room-task-before`, `room-after-restore`, `room-task-after-restore` | The room itself is fully drawn after the restore (salon art, task button, counter). The sleeping task scene redrew its backdrop (`redraws 1` while `screen: room`); back on the task ("Wróć do notesu") the backdrop is the blurred salon and the round is still in phase `done` with "Brawo! +1 ★". |
| "Obrazki" with `fox-think.webp` aborted | `settings-fox-missing` | Count line "1 z 8 obrazków ekranów nie wczytał się." without the "napis lub rysunek" sentence; the fox sentence below the network cause and advice, then "Kod: network". |
| "Obrazki" with `wallet-open.webp` aborted | `settings-wallet-missing` | Count line keeps "Na tych ekranach zamiast obrazka jest napis lub rysunek."; no fox sentence (the fox is drawn, visible in the tablet frame behind the panel). |
| Task with `fox-think.webp` aborted: idle, after a miss, after a right answer | `nofox-idle`, `nofox-miss`, `nofox-right` | No fox and no stand-in box in the margin in any of the three; the hook says `visible false`, `pose null`, with `requested` idle, think, cheer. The round plays normally ("Spróbuj jeszcze raz" + hint, then "Brawo! +1 ★"). |

## Hand-checked values (mandatory)

- **Backdrop identical before and after the restore.** For each of the 6 before/after pairs (welcome, task, room trip × 2 widths) the spec cropped the same backdrop-only strip of the canvas (scene x 10–160, y 300–900, left of the notebook at x 180) as PNG and compared them pixel by pixel in the browser: mean absolute difference **0**, maximum **0** in every pair. The strip's mean colour is **(224, 212, 175)**; the plain page colour `PAGE_BACKGROUND` `#FFF5DF` is (255, 245, 223), so the strip is the washed salon, not the plain fallback, before and after.
- **Hook pixel.** `backdropPixel` read **[156, 153, 113, 255]** before and after the restore in every pair: opaque and not (255, 245, 223). A lost texture would read [0, 0, 0, 0].
- **Redraw counter.** `backdrop.redraws` went **0 → 1** after one lose + restore in all 6 runs (`captures` 1 → 2, the restore counted as a capture, as documented on `BackdropSnapshot`).
- **Fox sentence.** The "Obrazki" section text (read from the DOM) contains exactly `Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka.` = `pl.settings.guideMissing`, once. It is the only fox-related line: the count line is `pl.settings.uiArtMissing(1, 8, false)` ("1 z 8 obrazków ekranów nie wczytał się." with no "napis lub rysunek"), and there is no "Zamiast obrazka gra rysuje: …" line. The record behind it: `artFallbacks: { guide: 'none' }` (fox case) and `{}` (wallet case).
- **Count arithmetic.** `UI_ART` has 8 rows; one aborted → "1 z 8"; `inflect(1, …)` → "nie wczytał się" (singular masculine with "1 z 8 obrazków" read as "jeden obrazek"), correct Polish.

## Designer's read

- **Restored backdrop**: indistinguishable from the original at both widths (pixel-identical crop). No flash of the plain colour remains in any after frame.
- **Parent text**: "Lisek w rogu zeszytu się nie pokazuje, bo brakuje jego obrazka." reads naturally, calm and true (it does not promise a replacement). It sits after the general network advice "Uruchom grę ponownie, gdy internet będzie lepszy.", which also covers the fox; the order reads fine. The reviewer's alternative "nie pokazuje się" stays with the maintainer (row 4.7).
- **Without the fox**: the right margin is plain backdrop, the counter pill and the ribbon stand alone; nothing looks broken or missing to a child.

## Discrepancies fixed

None.

## Observed, not this slice

- In the frames before the first round ends, the "Wróć" button (back to the age choice) overlaps the notebook's bottom-left frame; this is the playtest F-01..F-03 layout of `TaskScene.backToAge`, unchanged here.

## Decisions

- Playwright fallback used directly, as the step prompt fixed (Claude in Chrome got stuck on the slow-save card in the last run; the context loss needs `page.evaluate`). Would change: a Chrome profile with no other tab on the origin and a way to run the WebGL extension call there.
- "Before" vs "after" judged by a pixel diff of a backdrop-only crop plus the eye, not against a kit frame (the kit has none for these states). Would change: a kit frame for the error or missing-art states.

## Not covered

- Row 4.7 [human]: the parent wording. Row 4.8 [human]: the G-2 proof form. Row 4.10: CI at ship.
- A real tablet context loss (the forced `WEBGL_lose_context` in desktop Chromium stands in for it).

VISUAL: PASS — all row 4.9 states captured at 1440 and 1024; after every lose + restore (welcome, task, task while the room was open) the blurred salon is back pixel-identical to the before frame (crop diff 0, hook pixel [156,153,113,255] ≠ page colour, redraws 0 → 1), "Obrazki" names the missing fox with exactly `pl.settings.guideMissing` and no "napis lub rysunek" claim while the wallet case keeps it, and no fox or stand-in shows at idle, after a miss or after a right answer.
