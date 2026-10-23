# Visual review for notebook-polish

This is the visual gate of run 2026-10-22-notebook-polish (slice `fix:notebook-polish`). It ran after `MERGE: CLEAR` (`reviews/impl-review.md`). The first pass ran on `30d51ee`. The fix `3c58eec` came out of it, and the final pass ran on `3c58eec`. The capture setup and every frame are listed in `screenshots/README.md`: Playwright on the hook build, port 4399, 1440×900 and 1024×768, 58 frames per width, plus 12 kit frames and 4 before-fix frames. Claude in Chrome was tried first and dropped (§ Decisions).

The frames were judged against:
- the `[visual]` rows 2.4-11.7 of `plan.md`;
- the kit frames `designs/martynka-maths-A-v1/screenshots/` (copied as `kit-*.jpg`) and `screen.css`/`maths.css`;
- the copy in `src/data/pl.ts`;
- the motion rules of `scope.md`: a correct answer turns green and bounces once, a wrong answer gets a slow "think" wobble and never red, every motion is off under reduced motion, and targets are ≥ 96 px.

## States

| Row | Frames | Verdict |
|---|---|---|
| 2.4 gradient | `task-tiles`, `welcome` | The WebGL face is flat `#fff8e7` from top to bottom. That is the p2 decision (`fillPaper` midpoint, commit 35aba94: two bands left a seam). The kit's face gradient spans 3 RGB units (232 to 229 on `kit-welcome`), invisible to the eye, so the flat face reads exactly as the kit's ivory. Canvas was not forced (source-proven in p2). |
| 2.5 notebook | `welcome`, `task-tiles` vs `kit-welcome`, `kit-task-tiles` | Notebook as in the kit: 8 stitch marks, a thin margin line, the butter ribbon top right over the frame, a darker bottom edge, the soft shadow below. Nothing of the notebook covers the HUD, the tiles, the prompt or "Rodzic". The sunflower sits bottom left, clear of the age buttons. Both widths. |
| 3.5 blur | `before-fix-backdrop-*` vs `task-tiles`, `welcome` | **Fixed.** The blur was baked in (no hard edges), but it was far stronger than the kit's: four passes at quarter scale turned the salon into colour blobs, with a pale band at the canvas edges. After `3c58eec` (`BACKDROP.blur` is one 1 px pass) the backdrop is soft and recognisably the child's salon, like the kit: the window, the wall frames, the sofa, the plants. The edge band is gone. |
| 3.6 backdrop | `welcome`, `task-tiles`, `summary`, `unlock`, `plain-page`, `backdrop-after-purchase`, `backdrop-after-sofa` | The backdrop sits behind every notebook screen, washed ivory as in the kit. With `?e2eArt=room` the page is plain (hook `backdrop` {mode plain, captures 0}). After buying the stage and going "Do zadań", `captures` goes 1 to 2. After the sofa, the backdrop shows the renovated walls. It matches `room-before` (the child's own salon), not a static picture: DESIGN-GAP 155. |
| 4.5 chunky | `task-tiles`, `task-keypad`, `press-held`, `solution-step-1/2`, `correct` | The tiles and keys have the kit lip (depth and pale green). A held "0" sits darker, down on its lip. "Już wiem" / "Następny krok" and "Dalej" have lips. The highlight paints synchronously in `AnswerTiles.press` (before any tween), and the held frame shows it at 200 ms. |
| 5.5 page buttons | `welcome`, `summary`, `unlock`, `wroc` | The age buttons, "Rodzic", "Kolejna runda"/"Do pokoju", "Dalej" on the unlock card and "Wróć" all have lips. None overlaps the notebook edge or the build id. |
| 6.5 HUD | `hud-between`, `gear-hint` | "Do pokoju", the speaker and the counter share the butter face, border and lip of `kit-task-tiles`. The gear is a static pill (DESIGN-GAP 158). Its hint bubble sits next to the gear, inside the right margin. |
| 7.5 motion | `correct-bounce`, `correct-flight`, `keypad-correct`, `wrong-wobble`, `second-try`, `*-wrong-wobble` (select, drag, clock, coins), `reduced-*` | **Fixed.** The correct tile was barely green: face `#e5f2d4` against tile `#e3f0d9`, with a pale lime outline (`before-fix-correct-tile-*`). `kit-correct` uses `.answer.selected` (`#d7ebc1`, outline `#547e3d`), so `3c58eec` paints the correct tile with those tokens. Now it reads as in the kit; the check mark is follow-up 17. The bounce shows at 90 ms. The star leaves from above the tile (keypad: from the entry field) and the counter already shows the new total. A wrong tile tilts slowly with no red, and the hint bar is yellow. The "OK" of select, drag, clock and coins wobbles visibly (fix `050b185` confirmed). With reduced motion: no tilt, no bounce, no flight, and the counter still changes at once (`reduced counter right after 1`). |
| 8.4 beads, entrance | every task frame, `stagger-1..4`, `reduced-entrance-000` | The beads are bigger: future ivory, current turquoise, done green. They do not overlap the HUD pills. The tiles rise and fade in one after another (video frames about 40 ms apart, 4 tiles over about 6 frames). With reduced motion everything is at rest at once. |
| 9.4 summary | `summary-pop-early/mid`, `summary`, `warmup-summary`, `room-slot-burst`, `reduced-summary` | Stars pop in one by one (3 of 5 at 150 ms). The burst comes at the end. "+4" matches `kit-summary`. The warm-up shows 6 stars centred, "+8" and "Runda bez błędu! +2". The sofa purchase in the room still bursts. With reduced motion the summary is static and complete. |
| 10.5 zero | `task-keypad` ("10 + 20" desktop, "70 − 10" tablet), the tile 0s, `warmup-summary` | Plain oval 0 everywhere: the key, the prompt, the tiles. 0 is narrower than the O of "Oblicz", and 1/7 are unchanged. Polish diacritics render in the welcome title ("urządza") and in prompts ("Zapłać", "Spróbuj", "zapełniono", "Już"). Hook `fontHealth: loaded` at both widths. |
| 11.7 full pass | all | Every state of the row is next to its kit frame. All chunky targets are ≥ 96 scene px (`tests/layout.test.ts` TOUCH_TARGETS, green in the gate). Measured: the clock "OK" is 72 px at 1440 = 96 scene px. Nothing red after a wrong answer in any mode. The long word prompt wraps right of the margin line (the content starts at x 314, the margin line is at x 290). The hint number line labels (10, 15, 20, −3; 20, 22, 25, 30, +5) are readable on desktop and small at 1024 (follow-up 13 stands). |

## Hand-checked values (mandatory)

- **Star counter after the tiles round**:
  - Hook outcomes `[first, retype, first, first, first]` with `balance.round.starPerTask` 1 and `cleanRoundBonus` 2, paid only without a mistake.
  - Earned 4 × 1 + 0 = **4**. Summary `{earned 4, bonus 0}`, star row `[★,☆,★,★,★]`.
  - The counter went from 0 to **4**, as drawn in `desktop-summary`/`tablet-summary`.
- **Warm-up**: 6 × 1 + 2 = **8** = summary `{earned 8, bonus 2}` = "+8" in the frame.
- **Room**:
  - Start with `?e2eStars=30`, then +1 for a right answer, for **31**.
  - The stage costs 5 (`ROOMS.salon` `renovate`): 31 − 5 = **26**, as drawn in `room-variant-panel`.
  - The sofa costs 7: 26 − 7 = **19**, as drawn in `room-slot-burst` and `backdrop-after-sofa`.

## Discrepancies fixed (`3c58eec`, `fix(notebook-polish): …`)

1. **Correct answer tile not visibly green.** In `AnswerTiles.paint` the correct tile now uses `PLACEHOLDER_COLORS.selected` and `selectedBorder` (the kit's `.answer.selected`). The token comment in `src/data/layout.ts` names that use. Shared `correct` users are unchanged: the feedback bar, the keypad field, the written column and the select tiles.
2. **Backdrop blurred far beyond the kit.** `BACKDROP.blur` went from `{x 2, y 2, steps 4}` to `{x 1, y 1, steps 1}` at the same quarter scale. The upscale and one pass give about the kit's softness.

Gate after the fix: lint, typecheck, unit 3781 (baseline 3736 + 45, no change from this fix), both deploy scripts, `sample` E1-E6, build (`e2e hook: absent`) were all green. Full e2e `--workers=2`: 149 of 150. The one failure was the known load flake `stale-tab` #2 B-1; the spec re-run alone with `--workers=1` passed 5/5. `--list` gives 150 = 144 + 6.

## Observed, not this slice

- After the first miss, the kit's second-try bar holds "Pokaż kroki". The game shows the hint text and offers steps after the second miss. That is the existing round flow, unchanged here.
- The kit welcome has a cushion at the bottom right; the game has "Rodzic" there (earlier gap).

## Decisions

- Claude in Chrome was tried first. My own tab loaded the build, but the canvas never appeared: another tab of the same origin was holding IndexedDB. The held key, the drags and the clock also need raw touch (profile § 8). I closed my tab and used the Playwright fallback with fresh contexts.
- The stagger was captured from a video. Screenshots arrive about 1.1 s after "Dalej" because of the hook polling, too late for a 400 ms entrance.

## Not covered

- Row 11.8 [human]: iPad Safari font, the feel of the motion, and decision D-1. Left open for the maintainer.
- A summary with "+10" did not occur (a clean round pays 7).

VISUAL: PASS — every [visual] state of rows 2.4-11.7 was captured at 1440 and 1024 through the product next to its kit frame. Two real discrepancies, a pale correct tile and an over-blurred salon backdrop, were fixed in 3c58eec and re-shot. The plain zero and diacritics render (`fontHealth` loaded), nothing turns red, motion is off under reduced motion, the hand-checked counter is 4 = 4 × 1 + 0.
