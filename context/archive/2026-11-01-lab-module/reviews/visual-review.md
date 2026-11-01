# Visual review for lab-module

This is the visual gate of run 2026-11-01-bathroom-polish-lab, slice S-33 `lab-module` (plan row 4.6), taken on the branch head `b35554b`. It found no discrepancy introduced by this slice; nothing was fixed and no design gap was added.

Capture: Playwright fallback against the hook build (`E2E_HOOK=1`, built into a gitignored `dist-visual.local/`) served by `vite preview` on port 4399, desktop 1440×900 and tablet 1024×768. 12 shots, 24 game frames, plus 4 pack frames. Route, hook facts and every frame: `screenshots/README.md`.

The frames were judged against:
- plan row 4.6 (items 1-11) and the risks named in the plan (lab miniature near the roof line, mint frame weaker than butter on the base shell);
- the pack frames `designs/bystrow-space-base-v3/screenshots/{lab-before,lab-after-natural,base-with-three-modules}.png` and `designs/bystrow-space-base-v5/screenshots/base-cell-frame.png` (copied as `kit-*`), read only;
- the copy source `src/data/pl.ts` (`pl.room.tasks`, `pl.room.slots`, `pl.room.variants`, gap 208) and the costs in `src/data/rooms.ts` (`LAB.tasks`).

## States

| Item | Frames | Verdict |
|---|---|---|
| (1) Mostek card | `*-01` | "Pokój gotowy!", three tiles: Mostek ticked with its furnished miniature, Hangar and Laboratorium with their before miniatures, "Dalej". Inside the screen at both widths. |
| (2) Hangar card | `*-02` | Mostek and Hangar ticked (rocket and rover in the Hangar miniature), Laboratorium before. |
| (3) Laboratorium before | `*-03` | Matches `kit-lab-before.png` piece for piece (moon poster and three cards, wooden rock cabinet with boxes on top, desk with the old microscope and lamp, flask table with crates, the moon globe, the green stool, boxes and rocks on the floor, the leaning board); task "Odnów ściany i podłogę ★ 6", "Baza" under the counter. Cream all around the diorama. |
| (4) Microscope panel | `*-04` | After the stage: the empty after room (clean wall panels, window with the Earth, lit floor), the panel with three thumbnails of the microscope desk in natural (green), sunny (yellow) and mint (teal), captions "Naturalny", "Słoneczny", "Miętowy" (masculine, agreeing with "mikroskop"), "Wybieram" dimmed until a preview, "Zamknij". |
| (5) After, natural family | `*-05-07` | Matches `kit-lab-after-natural.png`: magnetic board with Earth, moon, Saturn and shapes; the slim rock showcase; the green microscope on its desk; the stool; the flask table with three flasks and the test-tube rack; the moon globe on its gold stand. Positions and depth order are the pack's. |
| (6) Laboratorium card | `*-06` | Three ticked tiles (Mostek, Hangar, Laboratorium with the furnished miniature), no "Wkrótce" teaser, only "Dalej"; no "Baza" button on the card. |
| (7) After "Dalej" | `*-05-07` | The card is gone, the room stays the Laboratorium in change mode ("Zmień wygląd") with "Baza" and "Wróć do notesu". Frames (5) and (7) are one state: the furnished after look is reached only through the card, and "Dalej" keeps the child in it. |
| (8) Base, lab current | `*-08` | Mostek (ground-left) and Hangar (ground-right) done, the Laboratorium before in upper-left inside the mint frame, upper-right "Wkrótce". Shell, lift shaft and cell positions match `kit-base-with-three-modules.png`; the frame matches `kit-base-cell-frame.png` (thin mint line with cream corners around the whole cell). |
| (9) Base, Hangar current | `*-09` | The Hangar before in ground-right in the same mint frame; upper cells "Wkrótce"; Mostek done. |
| (10) House 1 | `*-10` | The salon before in ground-left in the butter `cell-frame`, three cells with teal shutters "Wkrótce": unchanged by this slice. |
| (11) Stand-ins | `*-11a`-`*-11c` | Without room pictures the before look is the drawn worn wall (sand) and floor (ochre), the after look the fresh wall (cream) and floor (pale green); the microscope is a teal box labelled "mikroskop / Naturalny"; buttons "Odnów ściany i podłogę 6", "Postaw mikroskop 10", "Postaw gablotę z kamieniami 13 / masz 0/13"; no error. |

Both widths show the same layout (`Scale.FIT` letterbox); no clipping or overlap at either width. The microscope stand-in box (11c) reaches down to the top edge of the task button; that is the slot frame of the pack manifest (488 × 472) drawn as a box, only on the no-art path, the same kind as gap 174 — not a new defect.

## Judged questions

**Lab miniature and the roof line (plan risk).** On `*-08` the Laboratorium miniature sits in the middle of the upper-left cell with a cream margin above it; the roof beam does not touch it. Same composition as `kit-base-with-three-modules.png`. No re-export needed.

**Mint frame on the base shell (plan risk).** The mint frame on `*-08` and `*-09` reads clearly against the white and teal shell (a bright line on all four sides of the cell, different from the butter frame on `*-10`). The rendered pixel assert of `tests/e2e/lab-module.spec.ts` #2 already pins its colour; the tablet `[human]` row 4.11 stays open for a real screen.

## Hand-checked numbers

**Laboratorium total.** `LAB.tasks` costs: stage 6, slots 10 + 13 + 14 + 17 + 19 + 21 = 94; 6 + 94 = **100**. Route A seeds `?e2eStars=300` (three modules × 100). Drawn counter: 300 → retype pays 0 → after Mostek 300 − 100 = **200** (01, 09) → after the Hangar 200 − 100 = **100** (02, 03, 08) → after the stage 100 − 6 = **94** (04) → after the six slots 94 − 94 = **0** (06, 05-07). Route C: 216 − 200 = **16** (11a) → − 6 = **10** (11b) → − 10 = **0** (11c, "masz 0/13" on the next task). The drawn counter (`counterText`) showed exactly these values at both widths.

## Not covered

- Real touch on an installed tablet, offline (human row 4.11); the human acceptances 4.8-4.10 stay open.
- The variant panels of the five other lab slots and the sunny/mint families in the room (the pack frames `lab-after-sunny.png`, `lab-after-mint.png`) were not captured; row 4.6 names only the microscope panel and the natural family.

## Decisions

- **Playwright fallback without a Chrome attempt.** As in the house-1-polish and bathroom-room gates: every state needs a fresh device (Chrome's IndexedDB on 4399 may hold an old save), route A is 21 purchases per width, item 11 needs a hook-build seam (`?e2eArt=room`); profile § 8 also says Claude in Chrome cannot drive Phaser pointer gestures. Rejected: wiping Chrome's site data; mixing Chrome and Playwright frames. Would change: a defect visible only in the maintainer's Chrome profile.
- **A separate hook build folder** (`dist-visual.local/`, gitignored, moved to the scratchpad afterwards) so the orchestrator's `dist-e2e/` was never touched. Would change: nothing.
- **Items (5) and (7) in one frame**: the furnished after look appears with the card over it at the last purchase; after "Dalej" it is the same room in change mode. Would change: nothing.
- **Route C extended by one slot** (a second run of route C only) because the first run stopped at the stage and showed no labelled box. Would change: nothing.
- **No fix and no new gap row**: every finding is a match with the pack or an existing gap (174, 208). Would change: the maintainer rejecting row 4.8 or 4.9.

VISUAL: PASS — all eleven row-4.6 items captured at 1440 and 1024 on the hook build: the base cards show three tiles after Mostek, after the Hangar and after the Laboratorium (all ticked, no teaser, no "Baza" on the card), the Laboratorium before and natural after match lab-before and lab-after-natural piece for piece, the microscope panel shows three thumbnails "Naturalny / Słoneczny / Miętowy", "Dalej" leaves the child in change mode with "Baza", the base cross-section wears the mint frame on the module in renovation (Hangar ground-right, then Laboratorium upper-left) as in base-cell-frame, house 1 keeps its butter frame, stand-ins draw labelled boxes without error; stars checked 300 → 200 → 100 → 94 → 0 (lab 6 + 94 = 100).
