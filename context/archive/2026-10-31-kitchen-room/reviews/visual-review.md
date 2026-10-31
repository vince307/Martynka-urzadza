# Visual review for kitchen-room

This is the visual gate of run 2026-10-30-rooms-kitchen, slice S-22 `kitchen-room`. It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `7e1441f`.

Capture: Claude in Chrome against the hook dev server on port 4399. The game ran in a same-origin iframe of 1440×900 and 1024×768, on the fresh origin `http://127.0.0.1:4399`. 16 states, 28 frames. The route, the hook facts and every frame are listed in `screenshots/README.md`.

The frames were judged against:
- plan rows 4.5 and 7.6;
- the pack's kitchen frames (`designs/martynka-locations-v2/previews/kitchen-before.png`, `screenshots/kitchen-room-1.png`), read only;
- the F-04 gate frames (`context/archive/2026-10-30-rooms-as-data/screenshots/`) for the salon side;
- the copy source `src/data/pl.ts`.

The kit has no frame for the room card, the visit button or the change mode (gaps 31–41, 176, 180).

## States

| Row | Frames | Verdict |
|---|---|---|
| 7.6 (1) / 4.5 salon card | `*-01-salon-done-card` | "Pokój gotowy!", the salon tile with the live miniature and the check mark, and the kitchen tile. The kitchen tile is the live miniature of the pack's worn "before" kitchen (it matches `previews/kitchen-before.png`, gap 177), with no check and no padlock, and "Dalej". The kitchen miniature is smaller in its tile than the salon's, because the diorama sits on a wide cream margin. It reads as a room, not as a defect. |
| 7.6 (2) kitchen before | `*-02-kitchen-before` | The before picture is in the same place and at the same scale as the pack frame. Measured at 1440: the diorama spans scene x ≈ 290–1645 and y ≈ 217–985, against the pack's 290–1640 and 215–990. "Odnów ściany i podłogę ★5" and "Wróć do notesu" sit under the floor tip, as in the salon. The "Salon" visit button sits under the star counter, clear of the speaker and the counter. |
| 7.6 (3) after the stage | `*-03-kitchen-after-stage` | The empty after architecture: walls, wainscot, tiles, the pantry arch and two fixed plants from the background. No slot is drawn before it is bought. The next task is "Postaw szafki ★7". |
| 7.6 (4) some furniture, bench join | `*-04-kitchen-some-furniture`, `*-06-kitchen-bench-joined` | The counter, fridge and table sit where they sit in `kitchen-room-1.png`. Layering: the counter (z 20) is in front of the bench (z 18), and the rack (z 10) is behind the bench, as in the pack. The bench's back meets the counter's end panel without a seam or a gap (checked in a close zoom). The bench is always bought after the counter (task order), so "bench without counter" does not occur in play (gap 181, closed with this note). |
| buy panel | `*-05-kitchen-buy-panel-coffee` | The salon's panel shows the kitchen thumbnails "Naturalny / Słoneczny / Miętowy" for "kącik kawowy" (masculine). The preview swaps the piece in place. The visit button is hidden while the panel is up, so there is no overlap with "Wybieram" or "Zamknij". |
| 7.6 (5) kitchen card, finished kitchen, change panel | `*-12-kitchen-done-card`, `desktop-13-kitchen-done`, `*-14-kitchen-change-panel-fridge`, `tablet-15-kitchen-change-mode` | The card has two done tiles (the salon miniature already shows the yellow sofa chosen during the visit) and no teaser, because the house has two rooms. After "Dalej": "Zmień wygląd" and "Salon". The fridge change panel reads "Naturalna / Słoneczna / Miętowa" (feminine, agreeing with "lodówka"). The change was free (stars stayed at 2). |
| 7.6 (6) task-screen backdrop | `*-07-task-backdrop-kitchen` | **Gap 182.** The backdrop is drawn from the kitchen (`backdrop.drawn`, `blurred`, and the texture's middle pixel is the floor colour [221, 206, 183]). It cannot be seen, because the diorama lies entirely under the notebook and the pack's cream margin is the page colour. For a child the task screen looks plain while the kitchen is current. With the salon, the green board filled the screen. This is not a code fault: the capture works, and how to frame a room behind the notebook is a design decision. Follow-up 19. |
| 7.6 (7) forced miss | `*-16-kitchen-forced-miss-standins` | `?e2eArt=room`: all 21 kitchen pictures are missing. The drawn stand-in floor shows, plus one labelled box per bought slot in the slot's variant colour ("szafki / Słoneczne", "lodówka / Naturalna", "stół i krzesła / Naturalne", "kącik kawowy / Miętowy", "ławka", "naczynia"), with the buttons, counter and "Salon" intact. Nothing is broken. The rack and bench captions are partly covered by the counter box (pack z order), and the fridge caption fills its narrow box. Both are acceptable for a fallback (follow-up 20). |
| 7.6 (8) visit button | `tablet-08-kitchen-visit-button-gear-hint`, `*-09-salon-visited`, `*-10-salon-visited-change-mode`, `desktop-11-salon-visited-change-panel` | The gear hint bubble ("Przytrzymaj, żeby otworzyć ustawienia rodzica") sits left of the gear at the bottom right, far from "Salon" at the top right and clear of the task button. The visited salon shows "Kuchnia" under the counter, with no task button and "Zmień wygląd" in the mode place. In change mode "Gotowe" takes that place. "Kuchnia" overlaps only the third wall picture of the art, never a control. With the change panel open, the visit button is hidden. Nothing overlaps at either width. |

## Pack comparison: slot positions, layering, captions

- **Positions.** All six slots are where `kitchen-room-1.png` has them: the counter along the back wall, the fridge right of the hood, the table in the middle front, the coffee island at the front right, the bench under the window and the rack on the left wall. This is consistent with the manifest geometry that the implementation review checked number by number (row 5.7).
- **Layering.** The order is rack < bench < counter < fridge < table < coffee. No piece cuts into another wrongly in frames 04, 06 and 13. The bench join was checked in a close zoom.
- **Captions.** On the art no caption is drawn, the same as in the salon. Captions show only on stand-ins (frame 16) and in the panel thumbnails, where each label agrees with its noun.

## Hand-checked number: stars across purchases

The costs are from `src/data/rooms.ts`: salon 5+7+9+10+12+13+15+8+10+12+13+15 = **129**, and kitchen 5+7+9+10+12+13+15 = **71**.

- Seed `?e2eStars=200`, plus 1 for the first task right, gives **201**. The counter showed 201.
- Salon, step by step: 201 − 5 = 196, −7 = 189, −9 = 180, … after 9 tasks **112**, after 11 tasks **87**, after the pouf (15) **72** = 201 − 129. The counter showed 72 at the card, which equals the kitchen total 71 + 1.
- Kitchen: 72 − 5 (stage) = **67**; − 7 − 9 − 10 = **41**; − 12 − 13 = **16**; plus 1 (a right answer after the reload) = **17**; − 15 (rack) = **2** = 72 − 71 + 1. The counter and the hook agreed at every step.
- The free changes ("Wybieram" in change mode, salon sofa and kitchen fridge) left 17 and 2 unchanged.

## Discrepancies fixed

None. No code fault was found. The one visible problem (the backdrop) needs a design answer, so it became gap 182 and follow-up 19, not a fix.

## Not covered

- **Reduced motion** (rows 4.5 and 7.6 (1)). Claude in Chrome cannot emulate `prefers-reduced-motion`. It is covered by `tests/reducedMotionWiring.test.ts` and the celebration unit tests, and could be captured with Playwright's `reducedMotion: 'reduce'`.
- **The pop, the burst in flight and the hold of a finished room** (row 4.5). A capture follows the hook state, after the 1.2 s reveal. A long press cannot be driven from Claude in Chrome (profile § 8).
- **The gear hint at 1440.** The hint shows once per page load. Its scene geometry is the same at both widths (`Scale.FIT`).
- Rows 5.8, 7.7, 7.8 and 7.9 [human] and 7.10 [reviewer] are not part of this gate. Gap 182 adds a question for 7.8: whether the plain task screen with the kitchen is acceptable until the design answers it.

## Decisions

- **`127.0.0.1:4399` as the fresh device.** `localhost` and `[::1]` were used by earlier gates and could hold a save. The parent tab showed a static file (`favicon.png`), so the game ran only once, inside the iframe, and no second tab could take the save (`otherTab`). Would change: a server bound to IPv6 only.
- **Synthetic pointer events, not screen clicks.** These are the same input path as a tap, at the hook's interior points, and they cost far fewer round trips over about 40 purchases. Rejected: clicking screen coordinates, which needs the same mapping and a screenshot per tap. Would change: a defect that shows only with real touch. The Playwright spec `kitchen-room.spec.ts` covers touch.
- **Row 4.5 left open, 7.6 ticked with its exceptions** (the F-04 precedent). Row 4.5 is mostly animation, which this tool cannot capture. Row 7.6's eight states were captured, with only reduced motion missing.
- **Gap 182 instead of a fix.** Any change (crop, zoom, a board behind the kitchen) would be invented design. The scope forbids that.

VISUAL: GAPS — the kitchen before, after the stage, furnished (bench join clean), finished with its two-tile card, its buy and change panels, the forced-miss stand-ins, the "Salon"/"Kuchnia" visit (with the gear hint, no overlap) and the salon card with the kitchen tile were captured at 1440 and 1024 and match the pack's frames, with star arithmetic checked (201 → 72 → 2, free changes 0); gaps: the task-screen backdrop is invisible while the kitchen is current (gap 182), and reduced motion, the burst in flight and the hold were not captured (tool limits).
