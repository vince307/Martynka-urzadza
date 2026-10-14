# E2E request — phase 11 (grid tasks by touch)

Chromium would not start in the phase session (3 plain tries: `MachPortRendezvousServer ... Permission denied (1100)`). Nothing is committed.
Uncommitted files: `tests/e2e/grid-tasks.spec.ts` (new), `playwright.config.ts` (`grid-tasks` added to `ROUND_SPEC`),
`e2e-break-p11a|b|c.patch` and this file in this folder, plan row 10.4 ticked from the orchestrator note.

Verified without a browser: `npx tsc --noEmit` OK, `eslint tests/e2e/grid-tasks.spec.ts` OK, each patch passes `git apply --check`.

## Green run (expected)
- `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts grid-tasks` -> 3 passed (project chromium-hook, serial describe).
- Full suite: `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` -> 60 passed (57 + 3).

## Breaks (apply, run the named test alone, expect red, then `git apply -R` or `git checkout <file>`)
Test names (use `-g`):
- (a) `#11 a magic square shows its cells and takes the keypad after a hint`
- (b) `#11 a grid task takes a text tile`
- (c) `#11 a perimeter figure stays drawn beside the keypad in the solution`

1. p11a: `git apply context/changes/drawn-grid-tasks-e3-e4/e2e-break-p11a.patch` (NumberCells.render no longer makes the drawing visible, so shown() is false).
   Run `... grid-tasks -g "magic square"`. Expect red at `expect.poll(... targets(page)).picture).not.toBeNull()` (first assertion on the picture, null forever).
   Meta-check: the hook reads shown(), not the layout rectangle; (b) and (c) stay green with this patch.
2. p11b: `git apply .../e2e-break-p11b.patch` (grid `where` choices lack the right cell label).
   Run `... -g "grid task takes a text tile"`. Expect red at `expect(tiles.map(...)).toContain(first.answer)` (or earlier, if the round rejects the task; either way red on the missing answer tile).
   Meta-check: only (b) goes red; it proves the text-tile path, not the drawing.
3. p11c: `git apply .../e2e-break-p11c.patch` (keypad task in the solution uses the tiles' picture/lines rectangles).
   Run `... -g "perimeter figure stays drawn"`. Expect red at `expect(picture.y + picture.height).toBeLessThanOrEqual(strip.lines.y)` (690 > 668).
   Meta-check: only (c) goes red.

If a break stays green, delete that test (or its assertion) and tell the phase agent; if all go red as expected, tick 11.1-11.4, run `npm run build` (expect `e2e hook: absent (`), commit
`test(drawn-grid-tasks-e3-e4): Zadania siatki dotykiem — e2e (p11)` with spec, config, plan rows; the patches may be kept or removed.
