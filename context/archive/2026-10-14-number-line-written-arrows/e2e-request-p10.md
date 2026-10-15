# E2E request — phase 10 (written column, spec NOT committed)

Chromium cannot launch in the phase session (MachPortRendezvous Permission denied, 3 plain tries with --workers=4). Spec finished, uncommitted:
`tests/e2e/written-column.spec.ts` (+ `written-column` added to `ROUND_SPEC` in `playwright.config.ts`). Verified without a browser: tsc, eslint, `npm run build` (`e2e hook: absent (2 chunks checked)`), `git apply --check` of all three patches.

## Green run (workers=4; no env prefix)
1. `npx playwright test tests/e2e/written-column.spec.ts --workers=4` -> 3 passed.
2. `npx playwright test --workers=4` -> 74 passed (baseline 71 + 3).

Spec choices: age 8 + September (proposal E3) so E5 / E6 buttons are not the proposal and the warm-up is skipped; `?e2eSkills=<skill>&e2eVariant=off`.

## Breaks (apply, run the single test with -g, expect RED, then `git apply -R` / `git checkout` the file)
Run each alone, port 4398/4397 free before each:
- p10a: `git apply context/changes/number-line-written-arrows/e2e-break-p10a.patch` (stepDigitBoxes prepends -> boxes fill from the left).
  `npx playwright test tests/e2e/written-column.spec.ts -g "takes digits ones-first" --workers=4` -> RED on `expect.poll(snapshot.digits.filled).toEqual(typed.slice(0, i + 1))` at i = 1 (received [tens, ones]).
- p10b: `git apply ...e2e-break-p10b.patch` (TaskScene.submit no longer empties the boxes after a wrong row).
  `-g "wrong column gets a hint"` -> RED on `expect.poll(digits.filled).toEqual([])` (received the full wrong row). Meta-check: the pure reducer is untouched, so only the scene's reset is proven.
- p10c: `git apply ...e2e-break-p10c.patch` (pictureLayout digits solution takes keypadSolution).
  `-g "solution keeps the column"` -> RED on `expect(during.width).toBe(before.width)` (768 vs 440), or the x/right-edge assertion.

If a test stays green through its break, delete it (do not commit). Then commit: `test(number-line-written-arrows): Slupek pisemny dotykiem - e2e (p10)` with spec + playwright.config.ts + plan.md ticks 10.1-10.5.
Note: p10a also turns unit tests red (digitBoxes) - irrelevant, only the e2e assertion matters.
