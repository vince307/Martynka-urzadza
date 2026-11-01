# Visual review for bathroom-room

This is the visual gate of run 2026-11-01-bathroom-polish-lab, slice S-31 `bathroom-room` (plan row 5.6), taken on the branch head `beed03f`. It found no discrepancy introduced by this slice; nothing was fixed.

Capture: Playwright fallback against the hook build (`E2E_HOOK=1`, built into a gitignored `dist-visual.local/`) served by `vite preview` on port 4399, desktop 1440×900 and tablet 1024×768. 16 shots, 32 game frames, plus 4 pack frames. Route, hook facts and every frame: `screenshots/README.md`.

The frames were judged against:
- plan row 5.6 (items 1-14);
- the pack frames `designs/martynka-bathroom-v1/screenshots/bathroom-before.png`, `bathroom-after-natural.png`, `bathroom-after-mint.png` and `house-four-rooms.png` (copied as `kit-*`), read only;
- the archived base frames `context/archive/2026-11-01-hangar-module/screenshots/*-0{1,5}-*room-done-card.png`;
- the copy source `src/data/pl.ts` (`room.names.bathroom`, the bathroom task labels, `room.variants['bathroom-*']`, `room.slots['bathroom-*']`) and the costs in `src/data/rooms.ts` (`BATHROOM.tasks`).

## States

| Item | Frames | Verdict |
|---|---|---|
| (1) Salon card | `*-01` | "Pokój gotowy!", four tiles: Salon ticked; Kuchnia, Pokój dziecięcy, Łazienka unticked with their before miniatures; "Dalej". All four tiles inside the card, the card inside the screen with a wide margin, the counter pill above the card. |
| (2) Kitchen card | `*-02` | Four tiles, Salon and Kuchnia ticked. Same geometry as (1). |
| (3) Children card | `*-03` | Four tiles, three ticked, Łazienka unticked; the longest caption "Pokój dziecięcy" sits inside its tile at both widths. |
| (4) Start | `*-04` | The before look matches `kit-bathroom-before.png` piece for piece (peeling walls, worn tub with the leaf curtain, sink with the oval mirror, towel shelf, ducks shelf, green rug, two cardboard boxes, windowsill plant). Task "Odnów ściany i podłogę ★ 5", "Wróć do notesu", "Dom" under the counter. |
| (5) After the stage | `*-05` | The empty after shell: fresh cream walls, teal tiles, the diamond floor, the window; task "Postaw wannę z zasłonką ★ 7". Same shell as the kit's after frames without furniture. |
| (6) Tub panel | `*-06` | Three thumbnails Naturalna, Słoneczna, Miętowa (green, yellow and teal curtains), the previewed natural tub placed in the room, "Wybieram" and "Zamknij"; the panel clears the gear. |
| (7) Furnished, natural | `*-10` | Matches `kit-bathroom-after-natural.png` piece for piece: tub with the leaf curtain, the plant left of it, the wooden sink cabinet with the oval mirror and sconces, the towel shelf, the ducks shelf, the green oval rug. Only the HUD differs. |
| (8) Mint via the change panel | `*-08`, `*-08b` | All six slots changed to Miętowa through change mode (tap on each slot, thumbnail 3, "Wybieram"): teal curtain, mint tub, teal cabinet and mirror frame, teal shelf and rug, teal pot. Matches `kit-bathroom-after-mint.png`. "Gotowe" while changing, "Zmień wygląd" after; the balance stays 0. |
| (9) Bathroom card | `*-09` | Four ticked tiles (Salon, Kuchnia, Pokój dziecięcy, Łazienka with its finished miniature), no "Wkrótce" teaser; nothing clipped at the card edges at either width. "Dom" hidden under the card. |
| (10) After "Dalej" | `*-10` | Still the bathroom, "Zmień wygląd" and "Dom" shown, "Wróć do notesu" left; no overlap with the counter or the gear. |
| (11) House, bathroom current | `*-11` | Same shell as `kit-house-four-rooms.png`: salon, kitchen, children finished; the bathroom in upper-right with the gold frame showing its empty after shell (the stage was bought). |
| (12) House, all done | `*-12` | Four finished miniatures, no "Wkrótce" shutter; the bathroom miniature matches the kit's upper-right cell. The salon fills its cell more than the other rooms (the known `[human]` P2 row on `martynka-house-1-polish-v1`, S-32's scope). |
| (13) Stand-ins | `*-13`, `*-13b` | Without room pictures the stage is the drawn wall and floor; bought pieces are turquoise boxes with the Polish caption and variant ("wanna z zasłonką / Naturalna", "umywalka i lustro / Naturalne", "regał z ręcznikami / Naturalny", the last one shrunk by `labelScale` to fit the narrow 178 px shelf box); next task "Połóż dywanik ★ 12" fits its pill. |
| (14) Base cards | `*-14`, `*-14b` | Mostek card: Mostek ticked, Hangar unticked; Hangar card: both ticked; "Dalej". Two tiles, 1144 card. |

Both widths show the same layout (`Scale.FIT` letterbox); no clipping or overlap at either width.

## Base cards against the hangar-module frames

The archived hangar-module frames (`context/archive/2026-11-01-hangar-module/screenshots/desktop-05-hangar-room-done-card.png`) show wider tiles (about 444 scene px) than today's 340. This is not this slice: S-25 (kids-room, already on `main` at `e451fa8`) set `ROOM_DONE_LAYOUT.tiles` to 340 for every card. On this branch `roomDoneCardRect(2, …)` gives the same card as `main`: width max(1144, 2·340 + 32 + 60 = 772) = 1144, left 388, tile lefts 960 − 356 = 604 and 976. So the base cards are unchanged against `main`; no action.

## Hand-checked numbers

**Card width.** `roomDoneCardRect` with `ROOM_DONE_LAYOUT` (`card.minWidth` 1144, `padding` 30, `tiles.width` 340, `gap` 32): four tiles span 4·340 + 3·32 = 1456; width = max(1144, 1456 + 2·30) = **1516**; left = 960 − 758 = **202**, right 1718; tile lefts 960 − 728 = 232, 604, 976, 1348, last tile right 1688 (30 inside the card edge). On the desktop frame (scale 1440/1920 = 0.75, letterbox 45 px top) the card border is drawn at x ≈ 151 and ≈ 1289 (202·0.75 = 151.5, 1718·0.75 = 1288.5); on the tablet frame (scale 0.5333) at x ≈ 108 and ≈ 916 (107.7, 916.3). The card ends 202 scene px from each screen edge, top 220 is below the counter pill (y 44-148), bottom 780 is above the gear (y 952).

**Stars.** Seed `?e2eStars=355` = salon 129 + kitchen 71 + children 84 + bathroom 71. Bathroom: 5 + 7 + 9 + 10 + 12 + 13 + 15 = **71**. The first task solved by the retype pays 0. Salon card 355 − 129 = **226** (01), kitchen card 226 − 71 = **155** (02), children card 155 − 84 = **71** (03, 04), after the stage 71 − 5 = **66** (05, 06, 11), then − 7 − 9 − 10 − 12 − 13 − 15 = **0** (09, 10, 12, 08). Route B: 71 − 5 − 7 − 9 − 10 = **40** (13b). Base: 100 + 100 = 200, Mostek card **100**, Hangar card **0**. The drawn counter (`counterText`) showed exactly these values at both widths.

## Observation (not fixed, already a follow-up)

- With a three-digit balance (226 on `*-01`, 100 on `*-14`) the star in the counter pill touches the first digit: `StarCounter`, follow-up 12 of `follow-ups/review-fixes.md` (kids-room 7, second half), not changed by this slice.

## Not covered

- Real touch on an installed tablet, offline (human row 5.11); the human acceptances 5.7-5.10.
- The sunny family (item 8 asked for sunny or mint; mint was captured).
- Canvas renderer: not part of row 5.6.

## Decisions

- **Playwright fallback without a Chrome attempt.** The step prompt allows reaching late states through Playwright: every frame needs a fresh device (Chrome's IndexedDB on 4399 may hold an old save), a run through four rooms means 35 purchases per width plus six change-mode taps, deterministic with the repository's hook helpers; profile § 8 also says Chrome cannot drive Phaser pointer gestures. Rejected: wiping Chrome's site data; mixing Chrome and Playwright frames. Would change: a defect visible only in the maintainer's Chrome profile.
- **A separate hook build folder** (`dist-visual.local/`, gitignored, moved to the scratchpad afterwards) so the orchestrator's `dist-e2e/` was never touched. Would change: nothing.
- **Item (7) judged on the frame after "Dalej"** (`*-10`): the card appears at the last purchase over the room, as in the kids-room and hangar gates. Would change: nothing.
- **Item (8) reached through change mode with taps**, not by a second run buying the mint family: it is the path the plan names ("via the change panel"). Would change: nothing.
- **Base cards judged against `main`, not the hangar-module frames**: the tile width changed in S-25, which is already shipped. Would change: a maintainer wish for wider tiles on two-tile cards (a new layout rule, outside S-31).

VISUAL: PASS — all fourteen row-5.6 items captured at 1440 and 1024 on the hook build: the salon, kitchen and children cards show four tiles inside a 1516 card (checked 4·340 + 3·32 + 2·30), the bathroom steps from the before look to the empty shell with the right task labels, the tub panel shows Naturalna, Słoneczna, Miętowa, the furnished room matches bathroom-after-natural and the change mode reaches bathroom-after-mint, the bathroom card shows four done tiles with no teaser and "Dalej" keeps "Zmień wygląd" and "Dom", the house frames the bathroom in upper-right and then shows four finished rooms like house-four-rooms, stand-ins carry Polish labels, the base cards are unchanged against main; stars checked 355 → 226 → 155 → 71 → 66 → 0.
