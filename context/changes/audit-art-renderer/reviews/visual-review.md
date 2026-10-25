# Visual review for audit-art-renderer

This is the visual gate of run 2026-10-25-audit-art-renderer (slice `fix:audit-art-renderer`). It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `47da815`.

Capture: Playwright fallback on the hook build, port 4399, at 1440×900 and 1024×768. The Canvas projects use the WebGL-disabling Chromium flags of `tests/e2e/canvas-renderer.spec.ts`. The setup and every frame are listed in `screenshots/README.md`: 7 frames per width, 14 in all.

The frames were judged against:
- the `[visual]` row 4.9 of `plan.md`;
- `scope.md` items 3 and 4: one short, true Polish sentence in "Obrazki", with no stand-in claim, and the pouf left as a gap row;
- the copy source `src/data/pl.ts`.

The kit has no settings-panel or room frame (DESIGN-GAP rows 173 and 174).

## States

| Row 4.9 state | Frames | Verdict |
|---|---|---|
| "Obrazki" under Canvas | `*-canvas-settings-pictures` | The section shows its three "Wszystkie obrazki … są wczytane." lines and then the `wornPlain` sentence as the fourth line. It is not labelled a stand-in, and the "Zamiast obrazka gra rysuje …" line does not appear. The text wraps inside the panel at both widths, and nothing is clipped. |
| "Obrazki" under WebGL | `*-webgl-settings-pictures` | Same section, three lines, no `wornPlain` line. |
| Room before, Canvas | `*-canvas-room-before` | The worn set is drawn in full colour: turquoise sofa, yellow pouf, bright frames. The faded `architecture-before` wash is behind it. This is the expected Canvas fallback, which looks "not old", the same thing the sentence tells the parent. The layering, buttons and counter are the same as under WebGL. |
| Room before, WebGL | `*-webgl-room-before` | The same set is graded: grey-teal sofa, khaki pouf, muted rug and frames. This matches the salon-style gate's `room-before`. |
| Welcome backdrop, Canvas vs WebGL | `*-welcome-backdrop` | Under Canvas the salon behind the card is washed but sharp, because there is no blur filter. Under WebGL it is blurred. The age card, the title and "Rodzic" are identical, and both read calm. |
| Empty after room, WebGL (gap 174) | `*-webgl-room-after-stage` | Unchanged from the salon-style gate. The pouf's lower half and its contact shadow sit behind "Wróć do notesu" at both widths. This is left as DESIGN-GAP 174 for the maintainer (row 4.7 [human]). |

## Hand-checked facts (one per state)

- **Canvas "Obrazki" line = `pl.settings.wornPlain`.** `panel.getByText(pl.settings.wornPlain, { exact: true })` counted 1 under Canvas and 0 under WebGL, at both widths. The section's `innerText` ends with exactly "Przeglądarka rysuje grę w prostszym trybie, więc meble przed remontem nie wyglądają na stare.", the string at `src/data/pl.ts` `settings.wornPlain`.
- **Renderer line.** In every Canvas test the console carried exactly one `Renderer: Canvas (no filters: the worn salon look is off)`. In every WebGL test it carried exactly one `Renderer: WebGL`. These are the two strings of `BootScene`. The hook agrees: `backdrop.renderer` is `canvas` or `webgl`, and `artFallbacks.worn` is `'ungraded'` under Canvas and absent under WebGL.
- **Room before.** The hook reports `worn.keys` = the same 10 pieces in both renderers. `graded` is `false` under Canvas and `true` under WebGL, which matches what the frames show.
- **Welcome backdrop.** `graded 0` and `blurred false` under Canvas. `graded 10` and `blurred true` under WebGL, which is the 10 worn pieces graded once each.
- **Pouf frame (arithmetic).** The frame starts from `?e2eStars=40`, and the stage costs 5 (`src/data/rooms.ts`, `renovate`), so 40 − 5 = **35**. The counter in the frame shows 35. The hook's `contactShadows` is `[lamp-table, plant-left, pouf, plant-right]`. The `resume` target is at (480, 950), and the pouf's bottom and shadow are hidden there, as gap 174 records.
- No `pageerror` in any of the 14 tests.

## Discrepancies fixed

None. No real discrepancy was found.

## Observed, not this slice

- The "Gra bez internetu … Kod: TypeError" line in the settings frames comes from the capture blocking service workers. A control run with service workers allowed shows "Gra jest gotowa do działania bez internetu." So it is not a product defect.
- The HUD speaker is missing because the spec silences speech (no Polish voice), as in earlier gates.

## Decisions

- **Playwright and not Claude in Chrome.** Claude in Chrome cannot launch a browser with WebGL off, and every pair here needs a Canvas twin. Rejected: Claude in Chrome for the WebGL half only, because mixing two capture routes would make the pairs harder to compare. Would change: nothing for Canvas. A WebGL-only gate could use Claude in Chrome.
- **Service workers blocked.** This follows the salon-style gate and keeps every test on a fresh, uncached page. Its side effect is the "Gra bez internetu" line described above. Would change: a gate about the offline section.
- **No pixel measurement of the grade.** The salon-style gate measured the WebGL grade exactly, and this change does not touch the grade. The Canvas frame shows the ungraded pieces by eye, and the hook flag confirms it. Would change: a change to `gradeMatrix` or `applyWornGrade`'s filter path.

## Not covered

- Rows 4.6–4.8 [human]: the wording of `wornPlain`, the pouf decision and the `drawRoomMiniature` boolean. Row 4.10 is CI at ship.
- The room-done miniature and the stage ghosts under Canvas are not framed. They go through the same `applyWornGrade`, and that is covered by unit and e2e tests (#16 canvas-renderer).

VISUAL: PASS — all row 4.9 states captured at 1440 and 1024: under Canvas, "Obrazki" ends with exactly `pl.settings.wornPlain`, the console says `Renderer: Canvas …` once, and the room and backdrop are ungraded (`graded false` / `0`). Under WebGL the line is absent, the renderer is WebGL, and the worn set is graded (`true` / `10`). The empty after room shows the pouf under "Wróć do notesu", unchanged (gap 174, stars 40 − 5 = 35).
