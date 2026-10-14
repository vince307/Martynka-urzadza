# E2E request — phase 12 (clock set by touch)

Chromium would not start in the phase session (3 plain tries: `MachPortRendezvousServer ... Permission denied (1100)`). Nothing is committed.
Uncommitted: `tests/e2e/clock-set.spec.ts` (new), `playwright.config.ts` (`clock-set` added to `ROUND_SPEC`), `e2e-break-p12a|b|c.patch` and this file.
Verified without a browser: `npx tsc --noEmit` OK, eslint on the spec and config OK, each patch passes `git apply --check`.

## Green run (expected)
- `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts clock-set` -> 3 passed (chromium-hook, serial describe, target < 60 s). Record the time.
- Full suite: `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` -> 63 passed (60 + 3). Record the time of the full suite and of `adaptive.spec`.

## Breaks (apply, run the named test alone, expect red, then `git apply -R`)
Test names (use `-g`, the describe is serial so run each alone):
- (a) `#11 setting the hour hand answers a full-hour clock` (and also the second test goes red)
- (b) `#11 a quarter needs both hands and a wrong setting gets a hint and a second try`
- (c) `#11 a drag the system cancels leaves the hands where they were`

1. p12a: `git apply context/changes/drawn-grid-tasks-e3-e4/e2e-break-p12a.patch` (TaskScene.feedDrag no longer feeds the clock reducer; every event reaches `stepBlockDrag` instead).
   Run `... clock-set -g "setting the hour hand"`. Expect red at `expect.poll(... clock?.hour).toBe(want.hour)` (hour never changes).
2. p12b: `.../e2e-break-p12b.patch` (`clockRules()` snapMinutes fixed to 60, as if E4 snapped to the hour).
   Run `... -g "a quarter needs both hands"`. Expect red at the poll `clock?.minute` `toBe(want.minute)` after the offset drag (the minute hand cannot be held with snap 60, the start minute differs from the answer's by construction). Meta-check: test (a) stays green (full-hour clock uses 60 anyway).
3. p12c: `.../e2e-break-p12c.patch` (a cancelled pointer is read as a normal `up`, the pose is kept).
   Deviation from the plan text: the plan names `pointerupoutside`, but a CDP `touchCancel` reaches Phaser as `pointerup` with `wasCanceled` (touch.target is the canvas), so removing the `pointerupoutside` handler would not turn this test red; the rule broken here is "a cancel restores the pose".
   Run `... -g "system cancels"`. Expect red at `expect(...clock).toMatchObject({ hour: start.hour, minute: start.minute })` (hour moved).

If a break stays green, delete that test (or assertion) and tell the phase agent. If all go red: tick 12.1-12.4, run `npm run build` (expect `e2e hook: absent (`), commit
`test(drawn-grid-tasks-e3-e4): Zegar ustawiany dotykiem — e2e (p12)` with spec, config, plan rows, then set change.md status `implemented`.
