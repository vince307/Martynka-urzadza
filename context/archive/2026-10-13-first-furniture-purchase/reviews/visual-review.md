# Visual review — first-furniture-purchase (S-09)

Step: visual gate of autonomous run 2026-10-13-s09-s11, after impl-review (`MERGE: CLEAR`, fix `4f63d28`).
Frames at `9096a52` (this step's fix), 1440×900 and 1024×768, reached through the product; capture method, frame list
and how each state was reached: `screenshots/README.md`.

## Capture: Claude in Chrome tried first, Playwright fallback

Claude in Chrome answered (`tabs_context_mcp`, own tab, closed at the end; no browser selected or switched). On the
visual port the tab first served a stale service-worker build (`5656e25`); after unregistering that origin's worker and
cache it loaded `31e80d7`, but the extension's tab reported `document.visibilityState === 'hidden'`: the Phaser loop
advanced only while a screenshot was taken (the hook's welcome check failed until a capture woke a frame). Driving
two clean rounds, a retype, the panel and timed animation frames through a paused loop is not reliable, and
`prefers-reduced-motion` (row 6.6) cannot be emulated from the extension. So the matrix was captured with the
Playwright fallback (profile § 8: a throwaway spec in a gitignored `*.local` folder reusing `tests/e2e/support/*`
against the hook build on 4399, moved out before the lint gate). Recorded in handoff §6.

## States

| Plan row | State | Frames | Verdict |
|---|---|---|---|
| 4.6 | summary with mistakes, "Do pokoju" plain (balance 4 < 5) | 02 | "Brawo!", 4 of 5 stars lit, "+4", no bonus line; "Do pokoju" in the kit's secondary look (ivory, oak border) as in `summary.png` ✓ |
| 4.6 | clean summary, "Do pokoju" highlighted (balance 7 ≥ 5) | 04 | "+7", "Runda bez błędu! +2 ★"; "Do pokoju" gets the thick yellow border (FR-010: highlighted when the stars cover the current task). Highlight is a border, not colour only on text; visible at 1024 ✓. FR-010 asks for the highlight, not for the cost on the button, so no cost is shown there |
| 5.5 | salon at 0 stars | 01 | empty slots as dashed outlines with captions; task button ivory "Napraw podłogę ★5" + "masz 0/5" (gap 31); speaker and counter "0" in the HUD; room switch hidden (the room has "Wróć do notesu") ✓ |
| 5.5 | salon at 7 stars | 05 | same room, task button teal (active) "Napraw podłogę ★5", no "masz" line ✓ |
| 6.5 | panel, no preview | 06 | tray over the lower floor; 3 floor thumbnails; "Wybieram" faded (alpha), "Zamknij" ivory; "Wróć do notesu" and the task button hidden ✓ |
| 6.5 | previews 1/2/3 | 07 ×3 | the floor slot shows oak / butter (stripes) / terracotta (dots) in the room; the chosen thumbnail lifts and gets the thick deep-teal border (the choice never rests on colour alone); "Wybieram" full colour ✓ |
| 6.5 | purchase frame | 08 | ~120 ms after "Wybieram": the new floor pops (scale 1.08) and code-drawn stars burst from the slot; the panel is already closed and the next task's button ("Pomaluj ściany ★6 / masz 2/6") is in place — the moment F1 was about ✓ |
| 6.5 | after purchase | 09 | butter floor in the room, counter 2, "Pomaluj ściany ★6 / masz 2/6" ✓ |
| 6.6 | reduced motion | 10, 11 vs 03, 08 | normal motion: a star flies toward the counter 300 ms after a right answer (03); reduced: no flying star (10), the counter still shows 1. Purchase: normal has pop + burst (08); reduced shows the new floor at once, no particles, no scale (11) ✓ |

Kit comparison (`preview.html` view "Pokój", read-only): the kit shows a finished painted room, a star note top left and
"Wróć do notesu" centred at the bottom. Ours: code-drawn wall/floor and slots (gap 32), counter top right as on every
HUD screen, "Wróć do notesu" bottom left beside the task button (gaps 12/31), tray (gap 33), animation (gap 34), no
sound (gap 35). Copy from `pl.room` (teacher read PASS in impl-review). Colours only from `PLACEHOLDER_COLORS`.

## Hand-checked number: the balance before and after the purchase

Rule: a first-try answer pays 1 star, a clean round adds the bonus 2 (`balance.ts`); the first salon task "fix-floor"
costs 5 and the next, "paint-walls", 6 (`src/data/rooms.ts`); a confirm deducts the cost once.
Clean round: 5 × 1 + 2 = **7** (frame 04 "+7", HUD 7; frame 05 HUD 7). Purchase: 7 − 5 = **2** — HUD "2" and
"masz 2/6" (2 < 6, so the button is short) in frame 09; the hook's registry balance read 7 before and 2 after at both
sizes. Mistake round (frame 02): retype 0 + 4 first tries × 1 = 4, no bonus → "+4", 4 < 5 → not highlighted ✓.

## Touch targets at 1024×768

Scale 1024 / 1920 = 0.533. "Wybieram" 480×100 scene px → 256×53 CSS px; "Zamknij" 480×96 → 256×51; thumbnail 200 → 107;
task button 720×128 → 384×68. All ≥ 48 CSS px (`MIN_TOUCH_TARGET` 96 scene px in `tests/layout.test.ts`).

## Findings and fixes

- **F1 (impl-review) — FIXED in `9096a52`.** Before: "Wybieram" y 800–908 and the task button y 880–1008 overlapped in a
  28 px strip (x 1100–1580), so the second tap of a fast double tap could open the panel of the next task (frame 08
  shows the next button appearing in the same step). Now `ROOM_LAYOUT.choose` is y 792–892 (height 100) and
  `ROOM_LAYOUT.taskButton` starts at y 892, aligned with `resume`; `close` moved to y 908–1004. New layout test
  "keeps \"Wybieram\" clear of the task button and \"Wróć do notesu\"…" (red before the data change, green after);
  the existing rules (≥ 96 px, inside the tray, disjoint, clear of the HUD and gear) still pass. "Zamknij" still shares
  the task button's place by design: a double tap there re-opens the same panel, never the next task — strictly
  disjoint tray targets would need a re-layout of the room's bottom band (resume on the left, task button on the
  right leave no 480 px column for two buttons above y 880). Follow-up F1 marked resolved.
- **Thin floor/walls thumbnails — FIXED in `9096a52` (cheap).** Before (first capture, `31e80d7`): the 1560×340 floor
  became a 160×35 strip (≈ 85×19 CSS px at 1024), readable as a colour but hardly as a texture for a 7-year-old. Now
  `ROOM_LAYOUT.thumbs.minAspect` 0.5 keeps a wide slot's thumbnail at least half as high as wide (160×80), so stripes and
  dots read as swatches (frames 06–07). Test "gives every variant thumbnail a readable height…"; gap row 33 updated.
- **V1 — slot captions collide (follow-up, not fixed).** "podłoga" and "dywan" are drawn on top of each other (floor
  centre 960/690, rug 960/700), and "ściany" sits on the "obraz" outline. Placeholder captions at the slot centre;
  fixing needs a caption anchor in room data or art (S-16). Trigger: S-16 or the next `RoomView` change (S-10).
- **V2 — rug pop over the sofa (impl-review F7) not captured.** The rug is the 5th task (5+6+7+8+9 = 35 stars); code-reviewed only. Trigger: S-10 visual gate.

## Gate after the fix

lint OK; typecheck OK; vitest 1035 = baseline 974 + 61 (S-09 59 + 2 layout tests from this step); deploy + ops tests OK;
`sample` E1–E6 `Naruszenia: 0`; `npm run build` `e2e hook: absent (2 chunks checked)`; `npx playwright test` (one plain
command, this session) 24 passed = baseline 23 + 1, including `room-purchase.spec.ts` (double tap on "Wybieram").

VISUAL: GAPS — every [visual] row (summary with/without highlight, salon 0/7, panel without preview, previews 1/2/3, purchase frame, after purchase, reduced motion) captured at 1440×900 and 1024×768 and matches the plan within DESIGN-GAP 31–35; F1 overlap and thin thumbnails fixed in 9096a52; 7 − 5 = 2 hand-checked; open: slot captions podłoga/dywan overlap (V1) and rug-over-sofa pop not capturable (V2), both follow-ups
