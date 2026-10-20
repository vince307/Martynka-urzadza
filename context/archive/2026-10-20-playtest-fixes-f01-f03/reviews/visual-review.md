# Visual review for playtest-fixes-f01-f03

This is the visual gate of run 2026-10-20-playtest-boot, slice 1 of 2. It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `a7b1856`. The frames and the route are in `screenshots/README.md`: Playwright on the hook build, port 4399, at 1440×900 and 1024×768, 20 states per width.

The frames were judged against:
- the `[visual]` rows 4.5, 4.6 and 6.4 of `plan.md`;
- the kit frames `designs/martynka-maths-A-v1/screenshots/task-keypad.png`, `task-tiles.png`, `summary.png`, `welcome.png`;
- the copy in `src/data/pl.ts` (`settings.hint`, the "Wróć" label);
- DESIGN-GAP rows 25, 28, 151 and 152 in `docs/design-gaps.md`.

The kit has no settings gear, no hint and no way back to the age choice, so the gear is judged against the kit's HUD button family (speaker, "Do pokoju").

## States

| Row | Frames | Verdict |
|---|---|---|
| 4.5 | task-idle-parent, task-hint, task-hint-gone, task-hint-dalej, task-hint-tall-dalej, task-hint-keypad | The gear is at full colour: ivory fill, butter border, teal icon. This matches the kit's speaker and "Do pokoju" buttons, so it no longer looks disabled. Before the fix the hint bubble was an empty yellow box (VG-1) and covered "Dalej", the fourth answer tile and the bar (VG-2). After the fix the bubble reads "Przytrzymaj, / żeby / otworzyć / ustawienia / rodzica" in the right margin, and every tile, keypad key, "OK", the tray and "Dalej" stay clear of it, including the widest bar (tall thermometer drawing with 4 tiles). The bubble is gone after `hintMs`, checked through the hook (`settingsHint` false), and the frame shows no remnant. |
| 4.6 | room-idle, room-hint, room-panel, room-panel-hint | Before the fix the bubble covered the right end of "Wybieram" and of the task button "Odnów ściany i podłogę ★ 5". After it, the bubble sits right of the panel (the panel ends at x 1620) and of the task button (it ends at 1620). It covers only the fixed right plant decoration, and it has no input zone. The gear does not overlap the panel or any button at either width. |
| 6.4 | warmup-keypad, warmup-tiles, warmup-done-dalej, warmup-summary, round1-e3, round1-summary, round2-no-wroc, e1-round1, e1-round1-done, welcome-after-wroc, task-idle-parent | "Wróć" shows on the E3 warm-up with a keypad task and with a tile task (COMPARE_NUM, drawn on a fresh device at the 5th try on desktop and the 3rd on tablet), on the warm-up summary and on the first ordinary round of E3. It also shows on the first ordinary E1 round (age 6, no warm-up). It is gone from the summary of the first ordinary round onward (the second round has none) and for a parent-placed learner (task-idle-parent). The welcome screen reached by "Wróć" has no star counter, no gear and no "Do pokoju": only the build id. "Wróć" sits in the left margin, x 16-164 and y 880-976 in scene units. That keeps it clear of the notebook (from x 180), and so of every tile, key and "Dalej", and above the build id caption at both widths. |

## Hand-checked values (mandatory)

- **Warm-up stars**: 6 tasks right on the first try give 6 stars, plus the no-mistake bonus of 2 (`balance`), so 8. The summary frame shows "+8" and "Runda bez błędu! +2 ★", and the counter reads 8 ✓.
- **First ordinary round**: 5 + 2 = 7. The summary shows "+7", and the counter reads 8 + 7 = 15 ✓. The second round starts at 15 (desktop-round2-no-wroc) ✓.
- **Room balance**: `?e2eStars=100` plus 1 star for the first task makes 101 (room-hint frame). Buying the stage costs 5, which leaves 96 (room-panel frame) ✓.
- **Bubble geometry after the fix**: left = right − width = 1912 − 212 = 1700 (scene units). The widest control right edges are:
  - the tall-drawing bar: 520 + 1180 = 1700;
  - the drag tray: 1240 + 440 = 1680;
  - the keypad: 1040 + 516 = 1556;
  - the tile bar: 355 + 1270 = 1625;
  - the room task button: 900 + 720 = 1620.

  All are ≤ 1700 ✓. The wrap width is 212 − 2·12 = 188. The longest word "Przytrzymaj," measured 183 px in the real font at 32 px / 650 (canvas `measureText` in the hook build), and 183 ≤ 188 ✓.

## Keyboard and focus

There is no keyboard path: the gear, the hint and "Wróć" live on the canvas, and the game is touch only. The bubble has no zone, so it never takes the input switch. The adult gate's focus was unchanged by this slice.

## Discrepancies

- **VG-1 (fixed, e259870).** The hint bubble showed no text at either width.
  - Cause: `SettingsHint` added the label first and the box graphics after it, so the box was drawn over the text (display order = creation order).
  - Fix: the box is created before the label.
  - Test: none can see the canvas draw order. The fixed frames are the proof (`*-task-hint*.jpg`, `*-room-*hint.jpg`).
- **VG-2 (fixed, e259870).** The 380 px bubble (x 1498-1878, y about 724-936) covered "Dalej" (tablet frame), the fourth answer tile, the bar, and in the room "Wybieram" and the task button. That breaks the row 4.5/4.6 rule.
  - Fix: `HUD_LAYOUT.settingsHint` is now right 1912, width 212 and padding 12, with a new font role `FONT_SIZES.settingsHint` of 32 px / 650. The result is a narrow five-line bubble in the right margin that overlaps only the notebook's right border.
  - Gap row 151 now says so.
  - Test: `tests/layout.test.ts` "keeps the gear hint bubble above the gear, inside the screen and right of every answer control and room control". It was red on the old values ("hint clear of keypad: expected 1498 to be greater than or equal to 1556") and is green after the fix.

- **VG-3 (fixed, test only, 69a2eb4).** The gate's full e2e run failed `first-launch.spec.ts` "#12 "Wróć" …" once (140 passed). Run alone on the unchanged base `a7b1856`, it failed 4 times in 6 tries, so the failure was already there before this gate.
  - Symptoms: after the reload the screen was `welcome`, not `task` (3 of the 4), or `save.dirty` was true right after "Wróć" (1 of the 4).
  - Cause: the spec waited on `save.dirty === false`, but `dirty` turns false when a write *starts*. The reload then cut the IndexedDB write in flight. This is impl-review follow-up F2.
  - Fix: the spec now waits on finished writes. The hook's `save.writes` counts writes that landed, and `lastReason` tells them apart.
    - After "Wróć", the next finished write must carry `'now'` (the flush).
    - Before each reload, a write must have finished after the choice, with `'now'` at the round end.
  - Result: 8 of 8 green with `--repeat-each=8`. The F2 break (no `flush('now')` in `TaskScene.backToAge`) made it red 2 of 2 at the new `'now'` assertion (received `'change'`). Restored.
  - No product code changed.

## Not covered

- A hint over a coin-wallet task or a digits column was not captured. Their controls sit in the same tray/keypad column (right edge ≤ 1680), which the layout test pins.
- The tile task in the warm-up depends on the draw: it came from E2.7 `compare_num_100`. A run where no tile task is drawn still passes the gate, because the frame shows only that the button and the tiles do not meet.

VISUAL: PASS — all [visual] states of rows 4.5, 4.6 and 6.4 captured at 1440 and 1024 through the product. Two defects of the gear hint were fixed with a red-first layout test: VG-1, the text was drawn under its box, and VG-2, the bubble covered "Dalej", a tile, "Wybieram" and the room task button. "Wróć" appears and disappears as planned and covers nothing.
