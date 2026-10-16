# e2e request — phase 7 (Chromium cannot launch in the agent sandbox: MachPortRendezvous Permission denied, 3 tries)

Spec written, NOT committed: new test appended to `tests/e2e/salon-extra-slots.spec.ts`
("#2 FR-019 S-16d a salon finished with seven tasks gets the five new ones and the done card again at the twelfth").
Verified without a browser: `tsc --noEmit` and ESLint on the spec clean; `git apply --check` on the patch ok.

## Green run
- `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 -g "#2 FR-019"` -> 1 passed
- `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 salon-extra-slots` -> 3 passed
- full `--workers=4` -> 120 passed (117 + 2 from p6 + 1)

## Break p7 (`e2e-break-p7.patch`, production code only: `roomDone` = `tasksDone >= 7`)
- `git apply context/changes/salon-extra-slots/e2e-break-p7.patch`, run the `-g "#2 FR-019"` command.
- Expected red: after the reload `expect(reopened.done).toBe(false)` receives true (or the earlier
  `reopened.card` / `modeText` assertions), and the done card appears at task 8 instead of 12.
- Restore: `git apply -R context/changes/salon-extra-slots/e2e-break-p7.patch`.
- If the poll for `currentTask.id === 'hang-curtains'` after the reload times out first, raise the cause (the test is not
  reaching the room), not the break.

## After green
Tick 7.1-7.3, commit `test(salon-extra-slots): zakończony salon wraca do zakupów i karta ponownie przy 12. zadaniu — e2e (p7)`
with the spec and this change dir's patch/request files.
