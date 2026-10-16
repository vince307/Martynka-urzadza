# e2e request — phase 8 (Chromium cannot launch in the agent sandbox: MachPortRendezvous Permission denied, 3 tries)

Spec written, NOT committed: new test appended to `tests/e2e/salon-extra-slots.spec.ts`
("#16 S-16d the curtains reaching above the scene are held for a free change"; also imports `holdTouch`, `balance`).
Verified without a browser: `tsc --noEmit` and ESLint on the spec clean; `git apply --check` on the patch ok.

## Green run
- `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 -g "curtains reaching"` -> 1 passed
- `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=3 salon-extra-slots` -> 4 passed
- full `--workers=4` -> 121 passed (117 + 2 from p6 + 1 from p7 + 1)

## Break p8 (`e2e-break-p8.patch`, production code only: `holdPoint` scans from `full.top` again, no scene clip)
- `git apply context/changes/salon-extra-slots/e2e-break-p8.patch`, run the `-g "curtains reaching"` command.
- Expected red: `expect(at!.y).toBeGreaterThan(0)` (the hook's curtains target lies above the canvas, y <= 0), or the
  hold never opens the panel (`panel` stays closed, poll times out).
- Restore: `git apply -R context/changes/salon-extra-slots/e2e-break-p8.patch`.
- If the test fails EARLIER (purchase of the first eight tasks), the cause is not the break.

## After green
Tick 8.1-8.3, epilogue (change.md status `implemented`), commit
`test(salon-extra-slots): kotary nad sceną trzymane do darmowej zmiany — e2e (p8)` with the spec, request and patch.
