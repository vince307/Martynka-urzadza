# Visual review for kids-room

This is the visual gate of run 2026-11-01-kids-room, slice S-25 `kids-room` (plan row 5.6), taken on the branch head after `bd9b024`. It found one discrepancy, fixed in `fix(kids-room): podpis zastępczego pudełka mieści się w wąskim pudełku`; the stand-in frames were captured again after it.

Capture: Playwright fallback against the hook build (`E2E_HOOK=1`, built into a gitignored `dist-visual.local/`) served by `vite preview` on port 4399, desktop 1440×900 and tablet 1024×768. 13 shots, 26 game frames, plus 3 pack frames. Route, hook facts and every frame: `screenshots/README.md`.

The frames were judged against:
- plan row 5.6 (items 1-13);
- the pack frames `designs/martynka-evolution-v1/screenshots/children-form-0.png`, `children-form-0-chooser.png` and `designs/martynka-house-1-polish-v1/screenshots/house-four-rooms.png` (copied as `kit-*`), read only;
- the copy source `src/data/pl.ts` (`room.names.children`, the children task labels, `room.variants['children-*']`, `room.slots['children-*']`) and the costs in `src/data/rooms.ts` (`CHILDREN.tasks`).

## States

| Item | Frames | Verdict |
|---|---|---|
| (1) Kitchen card | `*-01` | "Pokój gotowy!", three tiles: Salon and Kuchnia ticked, "Pokój dziecięcy" unticked with the before miniature; "Dalej". The three tiles fit inside the card at both widths, the long "Pokój dziecięcy" caption inside its tile. |
| (2) Start after "Dalej" | `*-02` | Stage-0 look (peeling walls, leaves and papers on the floor, empty room), task "Posprzątaj pokój ★ 5", "Wróć do notesu", "Dom" under the counter. |
| (3) After "Posprzątaj pokój" | `*-03` | Stage-1 look: the floor is swept (no leaves or papers), walls still cracked; task "Pomaluj ściany ★ 6". A visible step from (2). |
| (4) After "Pomaluj ściany" | `*-04` | Stage-2 look: fresh cream walls and teal wainscot, the old herringbone floor; task "Odnów podłogę ★ 7". |
| (5) After "Odnów podłogę" | `*-05` | The after look: new light parquet, the daisy rug on the platform, matches the empty shell of `kit-children-form-0.png` (arch, bay window, tulip frames, steps, two plants); task "Postaw łóżko ★ 7". |
| (6) Bed panel | `*-06` | Three thumbnails Baldachim, Domek, Z szufladami (the three forms of `kit-children-form-0-chooser.png`), the previewed canopy bed placed in the room, "Wybieram" and "Zamknij". The pack's chooser is a tabbed tray; the game uses its existing variant panel (design gap for the panel, no new gap). |
| (7) Fully furnished, natural | `*-09` (the room behind the card in `*-08`) | Matches `kit-children-form-0.png` piece for piece: canopy bed with the daisy rug, teal bookcase with house-shaped boxes, cream wardrobe with the yellow coat, desk and chair at the bay window, toy chest with the bear and rainbow, green reading armchair with footstool and floor lamp. Only the HUD differs. |
| (8) Children card | `*-08` | Three ticked tiles (Salon, Kuchnia, Pokój dziecięcy with its finished miniature), no "Wkrótce" teaser, "Dalej". |
| (9) After "Dalej" | `*-09` | Still the children's room, "Zmień wygląd" and "Dom" shown, "Wróć do notesu" left; no overlap with the counter or the gear. |
| (10) House, children current | `*-10` | Same shell as `kit-house-four-rooms.png`: salon (ground-left) and kitchen (ground-right) finished, the children's room in upper-left with the gold frame (stage-0 miniature), upper-right closed with the "Wkrótce" shutter (the pack shows the bathroom there, which is S-31). |
| (11) House after stage 2 | `*-11` | The upper-left miniature shows the stage-2 look (cream walls, teal wainscot, old floor), clearly different from (10). |
| (12) Stand-ins | `*-12`, `*-12b` | Without room pictures the stage is the drawn wall and floor (before colours, then the after colours); bought pieces are turquoise boxes with the Polish caption and variant ("łóżko / Baldachim", "regał na książki / Naturalny", "biurko i krzesło / Naturalne"); next task "Postaw skrzynię na zabawki ★ 12" fits its pill. |
| (13) Salon card | `*-13` | Three tiles: Salon ticked, Kuchnia and Pokój dziecięcy unticked with their before miniatures; "Dalej". |

Both widths show the same layout (`Scale.FIT` letterbox); no clipping or overlap at either width except the defect below.

## Discrepancy found and fixed

- **Stand-in caption wider than its box.** In the first capture of `*-12b` the caption "regał na książki / Naturalny" ran past both sides of the bookcase box (the slot's visible rectangle is 172 px wide, the caption about 220 px). `RoomLayer.show` placed the text without any fit. Fix: the caption now shrinks with the existing rule `labelScale` (`src/core/fitLabel.ts`, the one already used by `RoomTaskButton`), with a 16 px inset per side in a new token `ROOM_LAYOUT.standIn.textInset` (`src/data/layout.ts`). Files: `src/ui/widgets/RoomLayer.ts`, `src/data/layout.ts`. After the fix (`*-12b`, re-captured) the caption sits inside the box at both widths; wider boxes keep scale 1 ("łóżko / Baldachim", "biurko i krzesło / Naturalne" unchanged). Gate after the fix: lint OK, typecheck OK, `npm test` 228 files, 4215 passed (= baseline 4194 + 21, the fix adds no case; `labelScale` is covered by `tests/fitLabel.test.ts`).

## Observation (not fixed, follow-up)

- With a three-digit balance (155 on `*-13`) the star in the counter pill nearly touches the first digit. `StarCounter` is not changed by this slice and three-digit balances occurred before (the salon alone costs 129); recorded as follow-up 7 in `follow-ups/review-fixes.md`.

## Hand-checked number: the stars through the three rooms

Costs from `src/data/rooms.ts`: salon 5 + 7 + 9 + 10 + 12 + 13 + 15 + 8 + 10 + 12 + 13 + 15 = **129**; kitchen 5 + 7 + 9 + 10 + 12 + 13 + 15 = **71**; children 5 + 6 + 7 + 7 + 9 + 10 + 12 + 13 + 15 = **84**. Seed `?e2eStars=284` (129 + 71 + 84); the first task solved by the retype pays 0. Salon card: 284 − 129 = **155** (frame 13). Kitchen card: 155 − 71 = **84** (frame 01, and 84 at the children start, frame 02). Then 84 − 5 = **79** (03), − 6 = **73** (04, 11), − 7 = **66** (05, 06), − 7 − 9 − 10 = **40** (12b, route B), − 12 − 13 − 15 = **0** (08, 09). The drawn counter (`counterText`) showed exactly these values at both widths.

## Not covered

- Real touch on an installed tablet, offline (human row 5.11); the human acceptances 5.7-5.10.
- Change mode on a finished children's room (hold or tap on a furnished slot): the same `RoomScene` path as the salon and kitchen, not named by row 5.6.
- Canvas renderer: not part of row 5.6.

## Decisions

- **Playwright fallback without a Chrome attempt.** The step prompt allows reaching late states through Playwright up front: Chrome's IndexedDB on 4399 may hold an old save, every frame needs a fresh device, and a run through three rooms means 28 purchases per width, deterministic with the repository's hook helpers. Rejected: wiping Chrome's site data; mixing Chrome and Playwright frames. Would change: a defect visible only in the maintainer's Chrome profile.
- **A separate hook build folder.** The orchestrator's e2e suite was using `dist-e2e/` on 4397; the capture built into the gitignored `dist-visual.local/` and served it on 4399 only. Would change: nothing.
- **Item (7) judged on the frame after "Dalej".** The card appears at the last purchase over the room, so the fully furnished room without a card is the change-mode frame (09), as in the hangar gate. Would change: nothing.
- **Fixed the stand-in caption rather than recording it.** A two-line change through an existing pure rule; the defect is newly visible because the children's bookcase is the narrowest slot so far. Would change: a fit that needed a new rule or touched the real-art path.

VISUAL: PASS — all thirteen row-5.6 items captured at 1440 and 1024 on the hook build: the kitchen and salon cards show three tiles, the children's room steps through stage 0, 1, 2 and the after look with the right task labels, the bed panel shows Baldachim, Domek, Z szufladami, the furnished room matches children-form-0, the children card shows three done tiles and "Dalej" keeps "Zmień wygląd" and "Dom", the house frames the children's room in upper-left and shows its stage-2 miniature, stand-ins carry Polish labels (caption overflow fixed); stars checked 284 → 155 → 84 → 79 → 73 → 66 → 40 → 0.
