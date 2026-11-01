# Visual review for house-1-polish

This is the visual gate of run 2026-11-01-bathroom-polish-lab, slice S-32 `house-1-polish` (plan row 5.6), taken on the branch head `1b6d4ed`. It found no discrepancy introduced by this slice; nothing was fixed and no design gap was added.

Capture: Playwright fallback against the hook build (`E2E_HOOK=1`, built into a gitignored `dist-visual.local/`) served by `vite preview` on port 4399, desktop 1440×900 and tablet 1024×768. 22 shots, 44 game frames, plus 7 pack frames. Route, hook facts and every frame: `screenshots/README.md`.

The frames were judged against:
- plan row 5.6 (items 1-17) and decisions D4, D5 (gaps 206, 207);
- the pack frames `designs/martynka-house-1-polish-v1/screenshots/kitchen-stage-{0,1,2,3}.png`, `salon-before-comparison.png`, `salon-after-comparison.png` and `house-four-rooms.png` (copied as `kit-*`), read only;
- the copy source `src/data/pl.ts` (kitchen task labels) and the costs in `src/data/rooms.ts` (`KITCHEN.tasks`, `SALON.tasks`).

## States

| Item | Frames | Verdict |
|---|---|---|
| (1) Kitchen before | `*-01` | Matches `kit-kitchen-stage-0.png` piece for piece (stained walls, teal cabinets, cream fridge, table with four chairs, island with coffee machine and mixer, cardboard boxes); task "Posprzątaj kuchnię ★ 5". Cream all around the diorama. |
| (2) Stage 1 | `*-02` | Matches `kit-kitchen-stage-1.png`: empty room, still stained walls and dull teal panelling, clean floor, window plant, pantry arch, two pots; task "Odnów ściany ★ 6". |
| (3) Stage 2 | `*-03` | Matches `kit-kitchen-stage-2.png`: fresh cream walls and bright teal panelling, the same floor; task "Odnów podłogę ★ 7". The step 2 → 3 is the floor only (warmer tiles), as in the pack (the 2.93 % difference named in scope.md). |
| (4) After | `*-04` | Matches `kit-kitchen-stage-3.png`: the warm floor; task "Postaw szafki ★ 7". |
| (5) Furnished | `*-05` | The six pieces in look 0 over the after picture (visit from the house), "Zmień wygląd", "Dom"; same composition as the kitchen in `kit-house-four-rooms.png`. |
| (6) Cross-fade | `*-06a`, `*-06b` | Normal motion: 200 ms after the tap the furniture of the before picture is half transparent over stage 1, the counter already shows 79. Reduced motion: 200 ms after the tap stage 1 is in full, no ghost. |
| (7) Salon before on cream | `*-07` | The pack's worn-v2 interior (peeling wall patches, scuffed floor) with the real furniture under the code grade: sofa, cushions, rug and pouf desaturated towards grey-green, wood dulled (the contact shadows were not judged separately; the e2e `salon-style.spec.ts` covers them). The corners outside the diorama are the pack cream. |
| (8) Salon after | `*-08` | Matches the right half of `kit-salon-after-comparison.png` (curtains, shelf books, all eleven pieces in look 0), cream corners. |
| (9) Salon before, Canvas | `*-09` | Under Canvas the furniture is ungraded (bright teal sofa) over the worn walls and floor; the hook records `artFallbacks.worn 'ungraded'` and `renderer 'canvas'` (the documented gap 173 path). The stage task still sells. |
| (10) House, kitchen at stage 2 | `*-10` | Salon done in ground-left, the kitchen at stage 2 in ground-right with the gold frame, both upper cells "Wkrótce". |
| (11) House, both done | `*-11` | Salon and kitchen finished, the children's room (before look) framed as current, bathroom "Wkrótce". Shell, staircase and cell positions match `kit-house-four-rooms.png`. |
| (12) Salon card | `*-12` | Four tiles, Salon ticked with its finished cream miniature, Kuchnia, Pokój dziecięcy, Łazienka with their before miniatures (the kitchen before is the new stage-0 picture). |
| (13) Kitchen card | `*-13` | Four tiles, Salon and Kuchnia ticked, the kitchen tile shows the furnished kitchen. Card inside the screen at both widths. |
| (14) Backdrop, salon | `*-14a`, `*-14b` | Behind the notebook the blurred salon: before (grey-green, `graded 10`) and renovated (curtains, bright green); about the whole margin around the notebook shows the room. |
| (15) Backdrop, kitchen | `*-15` | `currentRoom 'kitchen'`, backdrop drawn and blurred, but the margin around the notebook is plain cream: the kitchen diorama sits under the notebook. This is gap 182 unchanged (follow-up 7); the salon's cream backdrop does not change it. |
| (16) v6 kitchen | `*-16` | `save.load 'loaded'`, `migratedFrom 6`; after look (warm floor, bright walls), the counter in look 1 (cream cabinets with yellow tops) and the fridge in look 2 (teal), task "Postaw stół i krzesła ★ 10", `tasksDone 5`. Stars 23 from the fixture + 1 for the first-try answer = 24. |
| (17) Stand-ins | `*-17a`-`*-17d` | Without room pictures the before look is the drawn worn wall (sand) and floor (ochre); each stage task and the after look draw the fresh wall (cream) and floor (pale green); buttons "Posprzątaj kuchnię 5", "Odnów ściany 6", "Odnów podłogę 7", "Postaw szafki 7 / masz 0/7"; no error. The three post-stage frames differ only in the button (md5 differs by the label only, judged by eye). |

Both widths show the same layout (`Scale.FIT` letterbox); no clipping or overlap at either width.

## Judged questions

**The cream surround.** Sampled on the desktop frames: the pixel at (75, 90) is `(255, 245, 223)` on the salon before (07), salon after (08), kitchen before (01) and kitchen after (04); (1400, 840) on 07 and (100, 500) on 01 are the same; on the house frame (11) the cell background at (200, 530) and (820, 530) is the same cream. The salon surround matches the other rooms exactly.

**Salon in its house cell (D4, gap 207, for `[human]` row 5.9).** On `desktop-11` the non-cream part of the ground-left cell (scene 252, 636, 608 × 342) spans 98 % of the cell width and 96 % of its height (the 4 px inset of the measurement): the salon runs from the left post to the staircase and from the floor beam to the bottom beam. The kitchen in ground-right spans 71 % × 72 % with a cream margin on every side. The salon is not cut by the cell: its own picture already ends at the scene edges (frame 07), and the cell shows that picture whole. `kit-house-four-rooms.png` shows the salon the same way (filling its cell, cut at the bottom beam), so the game matches the pack; it reads as a larger, closer room next to three small dioramas. Nothing to fix under D4; P7's reversal condition ("the cell clipped") did not occur.

**Worn grade over the new background (D5, gap 206, for `[human]` row 5.10).** Frame 07 against `kit-salon-before-comparison.png`: the pack's before has stained, threadbare furniture textures; the game keeps the clean furniture and greys it (desaturation and a dull tint), while the walls and floor carry the pack's worn patches and scuffs. The two do not clash: no double wear on the furniture (the furniture art is clean), and the room reads as faded and neglected next to the bright after (08). The difference from the pack is that the neglect sits in colour, not in texture. P8's reversal condition ("frames 7/9 showing a clash") did not occur. Under Canvas (09) the furniture keeps its full colour, which is the documented gap 173 trade-off.

**Stage transitions.** Before → stage 1 removes all furniture and keeps the stained walls; stage 1 → 2 renews the walls; stage 2 → after warms the floor only. Each step is visible at both widths (the last one is the smallest, as in the pack). The fade frame (06a) shows the before furniture fading out over stage 1; under reduced motion (06b) the change is instant.

## Hand-checked numbers

**Kitchen total.** `KITCHEN.tasks` costs: stages 5 + 6 + 7 = 18, slots 7 + 9 + 10 + 12 + 13 + 15 = 66; 18 + 66 = **84**. Route A seeds `?e2eStars=213` = salon 129 (5 + 7 + 9 + 10 + 12 + 13 + 15 + 8 + 10 + 12 + 13 + 15) + kitchen 84. The first task by the retype pays 0. Drawn counter: 213 (14a, 07) → salon without the last slot 213 − (129 − 15) = **99** (14b) → salon card 99 − 15 = **84** (12, 01) → − 5 = **79** (06a, 02) → − 6 = **73** (03, 15, 10) → − 7 = **66** (04) → − 66 = **0** (13, 11, 05, 08). Route B: 134 − 129 = 5, − 5 = **0** (06b, "masz 0/6"). Route D: 147 − 129 = **18** (17a) → 13 → 7 → **0** (17d, "masz 0/7"). Route C: fixture 23 + 1 = **24**. The drawn counter (`counterText`) showed exactly these values at both widths.

**Migration step.** `save-v6-kitchen-mid.json` has kitchen `tasksDone 3` (v6 list: stage, counter, fridge); the v7 list inserts two stages after the first, so 3 + 2 = **5**, and the next task is the sixth entry, `place-kitchen-table` at 10 stars: the hook showed `tasksDone 5` and "Postaw stół i krzesła ★ 10".

## Not covered

- Real touch on an installed tablet, offline (human row 5.11); the human acceptances 5.7-5.10 stay open (this review describes what 5.9 and 5.10 are asked to accept).
- The salon card's Pokój dziecięcy and Łazienka tiles are S-25/S-31 art, not judged here.

## Decisions

- **Playwright fallback without a Chrome attempt.** As in the bathroom-room gate: every state needs a fresh device (Chrome's IndexedDB on 4399 may hold an old save), route A is 21 purchases per width, item 6 needs reduced-motion emulation and a frame at a fixed delay, item 9 needs Chromium started without WebGL, item 16 a hook-build seam; profile § 8 also says Claude in Chrome cannot drive Phaser pointer gestures. Rejected: wiping Chrome's site data; mixing Chrome and Playwright frames. Would change: a defect visible only in the maintainer's Chrome profile.
- **A separate hook build folder** (`dist-visual.local/`, gitignored, moved to the scratchpad afterwards) so the orchestrator's `dist-e2e/` was never touched. Would change: nothing.
- **Item (5) and (8) judged on house visits**, because the card appears over the room at the last purchase and "Dalej" moves on to the next room. Would change: nothing.
- **Item (14) "after" judged on the salon with every task but the last bought**: the salon stops being current at "Dalej", so a fully finished salon behind the notebook cannot be reached while it is current. Would change: nothing.
- **No fix and no new gap row**: every finding is either a match with the pack or an existing gap (173, 182, 206, 207). Would change: the maintainer rejecting row 5.9 or 5.10.

VISUAL: PASS — all seventeen row-5.6 items captured at 1440 and 1024 on the hook build: the kitchen steps before → stage 1 → stage 2 → after exactly as kitchen-stage-0..3 with "Posprzątaj kuchnię", "Odnów ściany", "Odnów podłogę", "Postaw szafki", the cross-fade shows mid-way and is instant under reduced motion, the salon before/after stand on the same cream (255, 245, 223) as the kitchen with the worn grade reading as faded, not doubly worn (D5), the salon fills 98 % × 96 % of its house cell like house-four-rooms without being cut (D4), the cards show four tiles, the kitchen backdrop is still plain (gap 182), the v6 save opens at tasksDone 5 on "Postaw stół i krzesła", stand-ins draw without error; stars checked 213 → 99 → 84 → 79 → 73 → 66 → 0 (kitchen 18 + 66 = 84).
