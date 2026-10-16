# E2E request, phase 6 (Chromium cannot launch in the agent session: MachPortRendezvous ... Permission denied, 3 plain tries)

Spec written, NOT committed: `tests/e2e/salon-extra-slots.spec.ts` (2 tests) and `salon-extra-slots` added to `ROUND_SPEC` in `playwright.config.ts`.
Verified without a browser: `npx tsc --noEmit` and ESLint clean on the spec and config; both patches `git apply --check` on the tree.

## Green run (orchestrator, outside the sandbox)
1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 salon-extra-slots` -> expected 2 passed (project chromium-hook).
2. Full `npx playwright test --config=... --workers=4` -> expected 119 passed (117 + 2).

## Deliberate breaks (apply, run the test alone, expect red, then `git apply -R` / `git checkout` the file)
- p6a: `git apply context/changes/salon-extra-slots/e2e-break-p6a.patch` (RoomView draws only `chosen`; `shown` follows it).
  `... salon-extra-slots -g "old look"` -> red on `expect(state.shown[slot]).toBe(0)` (lamp-table: received undefined).
- p6b: `git apply context/changes/salon-extra-slots/e2e-break-p6b.patch` (a slot purchase deducts the cost of the NEXT task).
  `... salon-extra-slots -g "costs its price once"` -> red on `stars` toBe(starsBefore - task.cost) (first new task: curtains 8, deducted 10).
Meta-check: (a) observes `snapshot.room.shown` (the layer record), so the break changes what the spec observes; it also makes the earlier old-task buys unaffected.
Risk for the green run: a 15 s poll on `shown[slot] === 1` after the preview tap, and the final `card` poll; the old six tasks are bought with variant 0 each.
After the green run tick rows 6.1-6.3 of plan.md and commit `test(salon-extra-slots): five new purchases by touch with the variant panel (p6)`.
