# Follow-ups — audit-art-renderer

Source: plan phases 1-4 of the run 2026-10-25-audit-art-renderer. New items first, then items re-recorded because this change touched their code.

## 1. Pouf under "Wróć do notesu" (DESIGN-GAP 174)
The pack's pouf slot puts the bottom 46 px of the painted pouf and its contact shadow under the kit's return button. Shipped as a gap row, no code fix.
Trigger: the maintainer's choice (move the pouf slot, move the button, or accept) or the author's worn pack touching the pouf.

## 2. `make-task-art.mjs` runs Python without `-I`
`recolour-board.py` is called through it; the pinned-library check does not isolate the interpreter from the current directory.
Trigger: the next change to `scripts/make-task-art.mjs`.

## 3. Canvas look itself (salon-style 3)
Still open: under Canvas the worn pieces get a flat wash (gap 169). The new signal is `artFallbacks.worn = 'ungraded'` and the "Obrazki" line `wornPlain` (gap 173).
Trigger: a report of a Canvas-renderer device, or the line showing in a real playtest.

## 4. Pixel guard of the worn look (salon-style impl-review F2)
Fired: `applyWornGrade` was edited. Re-recorded open; the Canvas e2e checks the record, not pixels.
Trigger: the next change to `applyWornGrade`, `gradeMatrix` or `RoomView` `drawContactShadows`, or a visual gate finding the grade wrong.

## 5. `artHealth.ts` / `artHealthView.ts` group
Fired by the new `worn` line. Re-recorded open: final-art-salon F4, salon-load-health L-6 / L-8 (no DOM test of `createArtHealthView`), audit-boot-hidden-tab L-8, the "Obrazki" `Kod:` line not muted (post-run-polish), audit-backdrop-fox F5 (generic group).
Trigger: the next change to `src/core/artHealth.ts` or `src/ui/dom/artHealthView.ts`.

## 6. `pixel()` is null under Canvas (audit-backdrop-fox F1)
The new Canvas e2e checks the record, not pixels. Re-recorded open.
Trigger: the next change to `SalonBackdrop` or a pixel proof under Canvas.

## 7. `drawRoomMiniature` drops the grade boolean
The result is recorded inside `applyWornGrade` (decision P-3), not at the caller.
Trigger: the next change to `drawRoomMiniature`.

## 8. Python test skips in CI
`tests/recolourBoard.test.ts` skips where Pillow/numpy are absent, so CI never proves M-1; only a local gate does.
Trigger: a CI image that ships the pinned Pillow and numpy, or a change to `scripts/recolour-board.py`.

Not re-recorded (unfired): final-art-salon F3 (closed in code), salon-style F4, final-art-salon F2, salon-extra-slots F2, L-R8/L-R11, notebook-polish 16, G-3, VO2/F5/F7.
