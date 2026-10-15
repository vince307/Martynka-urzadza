# E2E request — phase 11 (text-measure-time-types)

Chromium did not launch in the phase session (3 plain tries, one without and two with `--workers=4`: `MachPortRendezvousServer ... Permission denied`).
Spec finished, NOT committed. Uncommitted files: `tests/e2e/review-round.spec.ts` (new), `tests/e2e/support/saveImport.ts` (new; `chooseFile`, `jsonFile`, `openImport`, `reloadedBy` moved out of `save-transfer.spec.ts`), `tests/e2e/save-transfer.spec.ts` (imports them, no other change), `playwright.config.ts` (`review-round` in `ROUND_SPEC`), the two patches below, this file.
Verified without a browser: `npm run lint` OK, `npm run typecheck` OK, both patches pass `git apply --check` on a clean tree.

## Green runs (expected)
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 tests/e2e/review-round.spec.ts` -> 2 passed (project chromium-hook), target < 90 s each.
2. Also `tests/e2e/save-transfer.spec.ts` -> its 3+ tests unchanged green (helper extraction).
3. Full suite `npx playwright test --workers=4` -> 86 passed (baseline 84 + 2). Record the duration.

Spec notes (possible spec defects to fix first if red): test (a) starts as a parent on E6 (age 8, September = E3 proposal), imports a v2 save (`unlockedStep.E6 = 10`, mastery 4 on the three E6.10 skills) through the panel, reload keeps `?e2eMonth&e2eVariant=off`; one round -> "Kolejna runda" -> `screen 'unlock'` with `{step: 11, name: 'Powtórka roku'}` -> "Dalej" -> `unlockedStep.E6 = 11`; then up to 3 review rounds, tasks in E5/E6.1-10 and at least 2 distinct E6 steps. Test (b) forces `E6.10.place_value_1000000`, plays tasks (up to 15) until a keypad task with answer >= 100000, answers it, expects outcome 'first' and a star.

## Breaks (apply on a clean tree except the uncommitted spec files, run the named test alone, then `git apply -R` the patch)
- p11a: `git apply context/changes/text-measure-time-types/e2e-break-p11a.patch` (`stepPlayable` without `review === true`)
  `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 -g "the year review step unlocks"`
  Expected RED: `await screenIs(page, 'unlock')` times out (screen stays 'task': `unlockReady` finds no later playable step); (b) stays green.
- p11b: `git apply context/changes/text-measure-time-types/e2e-break-p11b.patch` (`balance.keypad.maxDigits` 7 -> 5)
  `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 -g "six-digit place-value answer"`
  Expected RED: `expect(done.outcomes[done.index]).toBe('first')` (or `phaseIs(page, 'done')` times out): the sixth digit is dropped, the answer is wrong, phase `second`. (a) stays green.
After the breaks: `git status --short` shows only the uncommitted files above; then commit `test(text-measure-time-types): Runda powtórkowa z zapisu i sześciocyfrowa odpowiedź (p11)`, tick rows 11.1-11.4, set `change.md` status `implemented`.
