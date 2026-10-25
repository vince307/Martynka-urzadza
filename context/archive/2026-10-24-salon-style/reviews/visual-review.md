# Visual review for salon-style

This is the visual gate of run 2026-10-24-salon-style (slice `fix:salon-style`). It ran after `MERGE: CLEAR` (`reviews/impl-review.md`), on `8c36703`. The capture setup and every frame are listed in `screenshots/README.md`: Playwright on the hook build, port 4399, 1440×900 and 1024×768, 17 frames per width plus one comparison sheet. Impl-review F2 says no automated test sees the worn look or the contact shadows; this gate is the proof of the look.

The frames were judged against:
- the `[visual]` row 5.10 of `plan.md`;
- `scope.md` items 2, 3, 5 and 6 (the before state in the same clay style, only worn; the board recoloured; contact shadows after the stage; nothing in geometry or text changed);
- the art review's comparison (`context/runs/2026-10-24-salon-style/art-review/compare-screens.png`, put beside the new frames in `screenshots/compare-art-review-vs-now.jpg`) and the research montage m9 (`m9-proposed-flow.png`, scratchpad);
- the kit's `welcome.png`. The kit has no room frame (DESIGN-GAP rows 169-172).

## States

| Row 5.10 state | Frames | Verdict |
|---|---|---|
| (a) Room before, fresh device | `room-before` | Reads as the same room and the same clay/glossy furniture as after the renovation, only faded, matte and slightly sepia: sofa grey-teal, armchair dull cream, pouf khaki, rug and frames muted, cabinet greyed. The old gouache furniture with grain is gone. Nothing is clipped. The layering is right: the coffee table sits in front of the rug and the pouf in front of the armchair. Hook: 10 worn keys, `graded true`, no contact shadows. |
| (b) Stage cross-fade | `xfade-0…700ms`, `rm-stage-before/after` | At 0 ms the frame equals the before room, with no flash. At 150, 300 and 450 ms the worn set, the old background and its shadows fade together over the empty after room. No piece blinks or jumps, and the before pieces never sit on top of the after decoration. At 700 ms the frame is the same as `room-after-stage` (byte-identical JPEG). Under reduced motion the room switches in one step and the after frame is byte-identical too. |
| (c) Empty after room | `room-after-stage` | Clean `architecture-after` with the lamp on its stool, both plants and the yellow pouf. The contact shadows are soft and darkest at the foot of each piece (measured below). They show as a light darkening around the pot bases and the stool legs, enough to put the pieces on the floor without a visible ellipse edge. |
| (d) First purchase (sofa) | `sofa-panel`, `room-sofa` | As the plan says, the worn set is already gone after the stage. The sofa ("Morska") stands on the empty room beside the fixed decoration, and the contact shadows stay. Panel, thumbnails and labels are unchanged. |
| (e) Finished room | `room-done-card`, `room-done` | The "Pokój gotowy!" card shows the live miniature of the child's salon. After "Dalej" the room has all pieces and the whole `shadows` layer, with no contact-shadow ellipses (hook `contactShadows []`) and no worn piece. |
| (f) Task backdrop, before and after | `task-backdrop-before`, `task-backdrop-after` | Before: the blurred, washed salon with the graded furniture faint behind the notebook (`graded 10`). After the stage and sofa: the renovated room (`graded 0`, `captures 2`). Both read calm, and the notebook, fox, beads and counter are unchanged. |
| (g) Welcome backdrop | `welcome-backdrop` | Same washed salon behind the age card (`graded 10`). It matches the kit's `welcome.png` mood: pale green board, cream, blurred plants and frames. |
| (h) `?e2eArt=room` | `room-standin` | The drawn stand-in backdrop with the "Odnów ściany i podłogę" button and no worn piece (`worn.keys []`, `graded false`). No page error. |
| (i) Board `#BCD799` | every room frame, comparison sheet | The saturated green (about rgb 106,175,97) is now a muted pale green that sits next to the cream page and the notebook frames. The rim around the diorama is clean, with no green fringe. |

## Hand-checked values (mandatory)

- **Worn grade = `gradeMatrix(ROOM_LAYOUT.worn.grade)`.** The matrix printed by `node --import tsx` from `src/core/colorGrade.ts`: R row (0.579393, 0.1842264, 0.0941382), G row (0.1208034, 0.6284142, 0.0917568), B row (0.1120716, 0.1575774, 0.5411610), offset 16.8 (= (1 − 0.90)·128 + 4). The cabinet is a non-soft piece, so only this one grade applies. A cabinet-door pixel at canvas (360,345) at 1440 is (209,129,64) in the finished room, where the cabinet is ungraded variant 0, and (168,129,95) in the before room. Expected R = 0.579393·209 + 0.1842264·129 + 0.0941382·64 + 16.8 = 121.09 + 23.77 + 6.02 + 16.8 = **167.7** (measured 168). Expected G = **129.0** (measured 129). Expected B = **95.2** (measured 95). Three more points (another door patch, the coffee-table top, a frame mat) are within **0.7** of the formula in every channel. So the WebGL ColorMatrix is applied exactly once, with the right numbers, to the pixels on screen.
- **Board colour.** The recolour keeps the lighting: board = `#BCD799` (188,215,153) × (L / mean L)^0.5. A board pixel at canvas (5,200) is (196,224,160). Divided by the target that gives 1.043, 1.042 and 1.046, one common factor, so it is the target hue lit 4 % brighter. Canvas (1430,500) is (179,204,145), which gives 0.952, 0.949 and 0.948 (4.9 % darker). Both rendered pixels equal the resampled `architecture-after.webp` exactly, so the game draws the board untouched.
- **Contact shadows.** The rendered after-stage room was solved against the resampled `architecture-after.webp` for the blend `out = bg·(1−a) + #5F462B·a` on the floor beside the lamp stool, at the ellipse centre row from `contactShadowPieces` (lamp-table cx 897, cy 487, width 155.25). The three channels agree to a std of 0.002–0.011. The result is a = 0.158 at 0.3 of the half-width, 0.116 at 0.5 and 0.075 at 0.7. The ring model (8 rings at 0.25/8) predicts 0.173, 0.147 and 0.091. Visible but soft, as planned, about 0.015–0.03 under the model, which is in the range of sub-pixel resampling at 0.75 scale. Plant-left and plant-right outside their pots give the same profile (0.104→0.077 and 0.115→0.074 at 0.6→0.7).

## Designer's read

- **Main goal met (scope item 2).** In the art review the before sofa was a painted, grainy, sepia object of another style. Now the before sofa is the after sofa, faded. The purchase reads as "renewed" and not as "a different style". The child sees one family of objects from the first frame on.
- **Grade strength.** The before state reads as "faded / dusty" rather than "old and broken": there are no stains, and the coffee table keeps its vase and books. Whether that is enough is row 5.6 [human], so the maintainer judges on `room-before` and `compare-art-review-vs-now.jpg`. The left plant and the lamp stay quite green and alive in the before frame (the grade only mutes them), which is the weakest "worn" cue.
- **Empty after room (scope item 5).** The contact shadows do their job without being noticed. The plain wall is still flat (the optional paper texture was not done, per plan).

## Discrepancies fixed

None. No real discrepancy was found. The measured grade, board and shadow numbers match the code and data.

## Observed, not this slice

- The pouf's contact shadow (cy 932) and the bottom of the pouf sit behind the "Wróć do notesu" button at both widths, so that one shadow is not visible. The button position is the S-05/S-09 room layout, which this slice does not change. Its effect on the look is nil.
- The HUD speaker is absent in these frames because the spec silences speech (no Polish voice). It is not a regression.

## Decisions

- **Playwright fallback.** Chosen: Playwright. Rejected: Claude in Chrome. Why: Claude in Chrome was tried first and its new tab on `localhost:4399?e2eMonth=9` met the slow-save card (`Kod: timeout`), the same failure as the last two runs, because another tab on that origin holds the IndexedDB save. The gate needs fresh devices, which means new browser contexts. Would change: a Chrome profile with no other tab or data on the origin.
- **Fake clock for the cross-fade.** Chosen: Playwright's `page.clock`. Rejected: a real-time burst, whose first shot came 2.2 s after the tap. Why: a frozen clock gives known times inside the 600 ms tween. Would change: nothing; the reduced-motion ends were captured as well.
- **Hand-checks on the 1440 canvas PNG with 3×3 patch means.** Chosen: flat interior points. Why: the 0.75 scale resamples edges, and flat interior points avoid that. Would change: a DPR-2 capture if a value were borderline.

## Not covered

- Rows 5.6–5.9 [human] (accept the worn look, the grade strength, the turquoises, the board colour and Python step). Row 5.11: CI at ship.
- The Canvas-renderer wash (WebGL is the only renderer in headless Chromium here). It is code-reviewed only, as in impl-review.
- Nested per-image ColorMatrix inside the backdrop holder: now seen. The welcome and task backdrops show the faint graded furniture and the hook says `graded 10`, so the "Unverified" item of the previous handoff is closed by eye. The blur hides the detail, so no number was taken there.

VISUAL: PASS — all row 5.10 states captured at 1440 and 1024: the before room is the same clay furniture graded exactly by `gradeMatrix` (cabinet pixel 167.7/129.0/95.2 expected vs 168/129/95 measured), the stage cross-fades cleanly with no blink and lands on the empty room, whose contact shadows are soft (a ≈ 0.16→0.08), the sofa, finished room, task and welcome backdrops and the `?e2eArt=room` stand-in render correctly, and the board is `#BCD799` with its lighting kept (factor 1.043 on all channels).
