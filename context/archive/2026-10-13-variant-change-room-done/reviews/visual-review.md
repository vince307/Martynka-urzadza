# Visual review — variant-change-room-done (S-10)

Step: visual gate of autonomous run 2026-10-13-s09-s11, after impl-review (`MERGE: CLEAR`). Frames at `a3dade4` (this
step's fix), 1440×900 and 1024×768, reached through the product; capture method, frame list and how each state was
reached: `screenshots/README.md`.

## Capture: Playwright fallback, Claude in Chrome not used

Profile § 8 records that Claude in Chrome cannot drive the Phaser long press (synthetic pointer/touch events are
ignored) and that its tab may report `visibilityState === 'hidden'` (the loop then advances only during a capture, seen
at the S-09 gate). Four of the states here need a held finger (outline, change panel by hold, reduced-motion hold) and
two need `prefers-reduced-motion`, which the extension cannot emulate. So the whole matrix went through the fallback the
profile names: a throwaway spec in a gitignored `tests/e2e/visual.local/` folder reusing `tests/e2e/support/*` against
the hook build on 4399 (raw CDP touch for the hold), moved out of the repo before the lint gate. Recorded in handoff §6.

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 4.6 | captions (V1) | 01, 06 | "podłoga" bottom left and "ściany" top left on their anchors, clear of every other caption ✓. **Found**: "dywan" at the rug centre sat on the sofa (the sofa is drawn above the rug), reading as a second label of the sofa → fixed in `a3dade4` (rug caption anchor 960/740, in the rug strip under the sofa; frames show the fixed state) |
| 4.6 | hold outline | 02 | 200 ms into the hold the rug gets a thick deep-teal rounded outline over the sofa and floor; static, no ring or timer (gap 37); the hook reports `hold: holding`, `heldSlot: rug` ✓ |
| 4.6 | change panel, no preview | 03 | the same tray as the purchase (3 thumbnails, "Wybieram" faded, "Zamknij"); "Wróć do notesu" and the task button hidden ✓. The current look (variant 1) is shown in the room but not marked among the thumbnails (observation V5) |
| 4.6 | change panel, preview | 04 | butter rug previewed in the room, thumbnail 3 lifted with the thick border, "Wybieram" full colour ✓ |
| 4.6 | V2 rug pop over the sofa | 05 | captured: for the pop (2 × 260 ms) the rug is drawn over the lower third of the sofa, then falls back under it (06). Cosmetic, transient; follow-up to S-16 (see Findings) |
| 4.6 | after the change | 06 | butter rug under the sofa, balance 5, task button unchanged "Postaw stolik ★10 / masz 5/10", `tasksDone` 5 ✓ |
| 4.7 | reduced motion | 11, 12 vs 05 | outline identical (it has no motion); ~120 ms after "Wybieram" the new rug is in place with no pop and no particles ✓ |
| 5.6 | card "Pokój gotowy!" | 07 | title, Salon tile (miniature of the current look, check mark in a circle: a shape, not colour only), dashed "Wkrótce" tile with no room name, "Dalej"; "Wróć do notesu" hidden behind it; speaker shows (it reads the card) ✓. Matches the kit's `unlock.png` look (ivory card, butter frame, deep-teal title, teal primary button); the kit dims the background, ours does not (the room shows around the card) — placeholder, gap 39 |
| 5.6 | done room | 08 | "Zmień wygląd" in the task button's band, right of "Wróć do notesu"; no speaker (no narration in a done room outside the mode) ✓ |
| 5.6 | change mode | 09 | the button reads "Gotowe" and the speaker appears; **no visible hint**: "Stuknij mebel, który chcesz zmienić." exists only as narration (gap 38, plan phase 5). See readability below (V4) |
| 5.6 | panel from a tap | 10, 10b | a plain tap on the sofa in the mode opens its change panel; after "Wybieram" the sofa is butter, balance 0, the mode stays ("Gotowe") ✓ |
| 5.7 | reduced motion card | 13 vs 07a | normal motion: 100 ms after the last "Wybieram" the picture pops and stars burst, no card yet (07a); reduced: the card is already there at 100 ms (hook `card` non-null) ✓ |

Both sizes show the same layout; at 1024 everything stays inside the canvas and readable.

## Hand-checked numbers: the balance across a change and across the last purchase

Rule: a change is free (FR-018, `stepPanel` returns the same stars); a purchase deducts the task cost once; the salon
tasks cost 5, 6, 7, 8, 9, 10, 11, 12, 13, 15 (`src/data/rooms.ts`).

- Change: start `?e2eStars=40`, retype pays 0 → 40. Five purchases: 40 − (5+6+7+8+9) = 40 − 35 = **5** (frame 01 HUD 5,
  hook `stars` 5). Rug change: 5 − 0 = **5** (frame 06 HUD 5, "masz 5/10", hook `stars` 5, `tasksDone` 5 before and after),
  at both sizes.
- Last purchase: start `?e2eStars=96` = 5+6+7+8+9+10+11+12+13+15 = 96. Nine purchases: 96 − 81 = **15** (hook before the
  last: `stars` 15, `cost` 15). Last: 15 − 15 = **0** (frame 07 HUD 0, hook `stars` 0, `counterText` "0"); the sofa change
  in the mode after it: 0 − 0 = **0** (frame 10b), at both sizes.

## Readability for a 7-year-old

- Card: "Pokój gotowy!" is large and short; "Salon" with a picture of their own room and a tick is clear; "Wkrótce" on an
  empty dashed tile is understandable as "something comes later"; one button "Dalej". Fine.
- Change mode (V4): after "Zmień wygląd" the room itself does not change; the only visible signals are the button now
  reading "Gotowe" and the speaker appearing. The instruction is spoken only when the child taps the speaker (it is not
  auto-read). A child who taps "Zmień wygląd" and waits sees nothing happen. Not a defect against the plan (gap 38 makes
  the hint narration by design), but a weak cue; recorded for the maintainer's UX row 6.7 together with F5 (the word
  "mebel"). Options: auto-read the hint on entering the mode, or draw the hint line above the room.
- Change panel (V5): nothing marks which thumbnail is the current look; the room shows it, so the child can compare. Same
  row 6.7.
- Captions (V3): "stolik" disappears on the deep-teal table variant (frame 07–10: deep-teal text on deep-teal fill) and
  "obraz" is faint on turquoise stripes over turquoise walls. Placeholder captions on placeholder colours; the furniture
  stays visible and tappable. Follow-up S-16 (art replaces the captions' background).

## Touch targets at 1024×768

Scale 0.533: "Zmień wygląd"/"Gotowe" 570×128 scene px → 304×68 CSS px; "Dalej" of the card ≥ 96 scene px high (layout
test 5.1) → ≥ 51 CSS px; thumbnails 200 → 107. All ≥ 48 CSS px.

## Findings and fixes

- **Rug caption on the sofa — FIXED in `a3dade4`.** `SALON_PLACEHOLDERS.rug.caption` = (960, 740): the rug spans y
  640–760 and the sofa ends at y 720, so the caption (y 724–756) sits in the visible strip of the rug with or without the
  sofa. Guard: `tests/roomsData.test.ts` "keeps every salon caption off the slots drawn above its slot" (red before the
  data change: "rug caption under sofa"; green after). Placed next to the existing caption test in `roomsData.test.ts`
  rather than `layout.test.ts`, because the anchors are room data (`src/data/rooms.ts`), not `ROOM_LAYOUT`.
- **V2 rug pop over the sofa — captured, not fixed.** `RoomScene.celebrate` adds the pop graphic on top of the room; the
  room is one `Graphics` (`RoomView.render`), so a correct fix needs per-slot objects with depth, which is what the art
  slice brings. Follow-up `Trigger: S-16`.
- **V3, V4, V5** — follow-ups (S-16 / human row 6.7), see above.

## Gate after the fix

lint OK; typecheck OK; vitest 1079 passed (baseline 1035 on main, +44: S-10 +43, this step +1); deploy + ops tests OK;
`sample` E1–E6 `Naruszenia: 0`; `npm run build` `e2e hook: absent (2 chunks checked)`; `npx playwright test` (one plain
command, this session) 26 passed (baseline 24, +2).

VISUAL: GAPS — every [visual] row (hold outline, change panel without/with preview, after change, card with Salon + Wkrótce, Zmień wygląd/Gotowe mode, panel from a tap, reduced motion for change and card) captured at 1440×900 and 1024×768 and matches the plan within DESIGN-GAP 37–41; rug caption on the sofa fixed in a3dade4; balance 5 − 0 = 5 across a change and 15 − 15 = 0 at the last purchase hand-checked; open: V2 rug pop over the sofa (S-16), V3 faint captions on matching colours (S-16), V4 change mode has no visible hint and V5 no current-variant mark (maintainer row 6.7)
