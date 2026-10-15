# E2E request — phase 11 (number line, arrow graph, jumps; spec NOT committed)

Chromium cannot launch in the phase session (MachPortRendezvous Permission denied, 3 plain tries, one with --workers=4). Spec finished, uncommitted:
`tests/e2e/number-line.spec.ts`, `number-line` added to `ROUND_SPEC` in `playwright.config.ts`, `hintPicture` added to `Targets` in `tests/e2e/support/hook.ts` (the scene already publishes it). Verified without a browser: tsc, eslint on the three files, `git apply --check` of all three patches.

## Green run (no env prefix)
1. `npx playwright test tests/e2e/number-line.spec.ts --workers=4` -> 3 passed.
2. `npx playwright test --workers=4` -> 77 passed (baseline 74 + 3); record the time.

Spec choices: age 10+ proposes E6, so E2 ("Klasa 1, II półrocze") and E3 ("Klasa 2, I półrocze") are overrides and skip the warm-up; `?e2eSkills=<skill>&e2eVariant=off`.
If a spec assertion (not a break) is red on the green run, fix the spec; likely candidates: (a) `hintPicture` toEqual `TASK_LAYOUT.picture.hint.keypad.picture`, (c) `first.input` 'tiles'.

## Breaks (apply, run the single test with -g, expect RED, then `git apply -R <patch>`), ports 4397/4398 free before each
- p11a: `git apply context/changes/number-line-written-arrows/e2e-break-p11a.patch` (view.ts gives hintPicture in phase `first`).
  `npx playwright test tests/e2e/number-line.spec.ts -g "shows only after a miss" --workers=4` -> RED on `expect((await targets(page)).hintPicture).toBeNull()` (received a rectangle).
- p11b: `...e2e-break-p11b.patch` (ArrowGraph.shown() returns false).
  `-g "arrow graph takes the keypad"` -> RED on `expect.poll(targets.picture).not.toBeNull()` (stays null). Meta-check: the hook reads shown(), not the layout rectangle.
- p11c: `...e2e-break-p11c.patch` (jumps choices drop the right expression).
  `-g "jumps take an expression tile"` -> RED on `expect(tiles.map(value)).toContain(first.answer)`.

A test that stays green through its break is deleted, not committed. Then commit `test(number-line-written-arrows): Oś, grafy i oś-podpowiedź dotykiem - e2e (p11)` with spec + playwright.config.ts + hook.ts + patches + request, tick rows 11.1-11.5, and run the epilogue (change.md status `implemented`, commit `chore(number-line-written-arrows): close out plan (epilogue)`).
