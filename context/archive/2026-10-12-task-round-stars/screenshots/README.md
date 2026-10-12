# Screenshots — task-round-stars (S-04) visual gate

Captured 2026-10-12 with Claude in Chrome against the dev server on the visual port 4399
(`npx vite --config vite/config.dev.mjs --port 4399 --strictPort`), after the gate fixes `daa513e` (weights, button
tokens, solution column and wrap, green dot, tile label scale) and `f0ec6d5` (keypad expression at the kit's height).
The build id in the corner says which code drew a frame: `daa513e` frames were drawn before `f0ec6d5`, `ec98195`
frames before both commits were *committed* but with the `daa513e` changes already in the working tree (the dev
server serves the working tree). Frames marked † show a bare expression beside the keypad at the old height
(scene y 560 instead of 456); everything else in them is current. The wrap of long solution lines was verified in
`tablet-16`.

- **Desktop**: Chrome window 1440×900, page viewport 1440×779 (the browser chrome takes the rest), so the game
  canvas is 1385×779 (scale 0.721).
- **Tablet**: same-origin iframe 1024×768 (profile § 9; Chrome cannot shrink its window), cropped to the iframe.
  Canvas 1024×576, scale 0.533, letterboxed 96 px top and bottom.
- **Portrait**: the same iframe resized to 420×760.

Every state was reached by tapping through the product (tiles, keypad, "Następny krok", "Już wiem", "Dalej");
tasks are random (seed `Date.now()`), so answers were computed by reading the task on screen. No state was
written, no IndexedDB touched, no console read of the scene was needed. Shots taken right after a wrong answer can sit a few pixels off
centre: the notebook's shake had not finished in the throttled frame loop. Chrome throttled the page's frame loop
while the tab was being screenshotted, so flying stars appear mid-flight in some frames (an artefact of the
capture, not a stuck star: the counter and later frames show them landing).

| State | Desktop (1440) | Tablet (1024×768) | How reached |
|---|---|---|---|
| Round start, keypad (font, dots) | `desktop-00-round-start-keypad.png` | `tablet-00-round-start-keypad.png` | fresh load; first task `11 + 16` / `16 : 4` |
| Round start, tiles (font, dots) | `desktop-01-round-start-tiles.png` | `tablet-01-task-tiles-words.png` | fresh load; first task a tiles task |
| task-keypad | `desktop-02-task-keypad.png` (sentence beside keypad), `desktop-00` (expression) | `tablet-00`, `tablet-04` † | as above |
| task-tiles | `desktop-01` (numbers), `desktop-03-second-try-tiles-words.png` (words) | `tablet-01`, `tablet-11` | as above |
| Hint without a line ("Spróbuj jeszcze raz") | `desktop-04-hint-no-line-second-try-tiles.png`, `desktop-05-hint-no-line-keypad.png` | `tablet-03-second-try-tiles-words.png` | one wrong tile / wrong number + OK |
| Hint with a line | `desktop-04b-hint-with-line-keypad.png` (`11 + 10 = 21`) | `tablet-04-hint-with-line-keypad.png` (`13 − 3 = 10`) † | wrong number + OK on `13 − 4` |
| Second try | `desktop-03`, `desktop-04`, `desktop-05` | `tablet-03`, `tablet-04` | after the first wrong answer the input stays active |
| Solution steps, first step | `desktop-06-solution-step-first.png` | `tablet-06-solution-step-first.png`, `tablet-15-solution-tiles-step-first.png` | second wrong answer |
| Solution steps, last step ("Już wiem") | `desktop-07-solution-step-last.png` | `tablet-07-solution-step-last.png` †, `tablet-16-solution-tiles-long-line-wrapped.png` | "Następny krok" until "Już wiem" |
| Retype | `desktop-08-retype.png` | `tablet-08-retype.png` †, `tablet-17-retype-tiles.png` | "Już wiem" |
| Correct after retype (no star) | `desktop-09-correct-retype-no-star.png` | `tablet-09-correct-retype-no-star.png` † | retype the result + OK / tap the outlined tile |
| Correct, +1 star | `desktop-10-correct-star-keypad.png` †, `desktop-11-correct-star-tiles.png` | `tablet-10-correct-star-keypad.png` †, `tablet-11-correct-star-tiles.png` | right answer on the first try |
| Round end with bonus (+2 ★, counter 7) | `desktop-12-round-end-bonus-7.png` | `tablet-12-round-end-bonus-7.png` † | fresh load, five first-try answers, "Dalej" ×4 |
| Round end without bonus (counter 5) | `desktop-13-round-end-no-bonus-5.png` | — | fresh load, task 1 wrong then right, tasks 2–5 first try |
| Missing-number blank (DESIGN-GAP 8) | — | `tablet-14-missing-box-glyph.png` † | task `2 + 9 = □` in a clean round |
| Drawn blank, box last (after the fix) | `desktop-14b-missing-box-last.png` (720×390, half scale) | `tablet-14b-missing-box-last.png` | `3 + 9 = □`; same-origin iframe with a fixed `Date.now` (seed 2) on the dev server, so the first task is known |
| Drawn blank, box in the middle | `desktop-14c-missing-box-middle.png` (720×390) | `tablet-14c-missing-box-middle.png` | `12 − □ = 9`, seed 121 |
| Drawn blank, box first | — | `tablet-14d-missing-box-first.png` | `□ + 4 = 11`, seed 17 |
| "Obróć tablet" over a running round | — | `portrait-420x760-rotate-overlay.png` (420×760) | iframe resized from 1024×768 during round 1 task 1; back to 1024×768 the round was unchanged (counter 1, "Dalej") |

Kit frames compared (read-only, `designs/martynka-maths-A-v1/screenshots/`): `task-tiles.png`, `task-keypad.png`,
`hint-tiles.png`, `second-try.png`, `solution-step-1.png`, `correct.png`, `tablet-1024.png`.
