# E2E request, phase 10 (final-art-salon)

Chromium cannot launch in the phase session (MachPortRendezvous ... Permission denied, 3 plain tries). Nothing is committed.
Uncommitted, ready to commit after the orchestrator run: `tests/e2e/salon-art.spec.ts` (new, 4 tests), `tests/e2e/support/hook.ts`
(Snapshot gained `roomArtHealth`), `playwright.config.ts` (`salon-art` added to ROUND_SPEC), this file, `e2e/*.patch`.
Verified without a browser: `npm run typecheck` and ESLint on the three files pass, the three patches pass `git apply --check`.

## Green run
`npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 salon-art` -> 4 passed.
Full suite: 94 + 4 = 98 passed.

Things to watch if a test is red for a non-rule reason (not yet observed in a browser):
- test 3 (`#2 ... carried over`): after the room it taps `roomSwitch` and expects the task screen in phase `done`, then `tapNext` and `playRoundRight(4)`; if the return lands elsewhere, adjust that tail only. The assertions on the carried state come before it.
- test 1: the second quick tap either opens the sofa panel or hits nothing; both are handled.

## Breaks (each alone, `-g` the named test, then `git checkout -- <file>`)
1. `git apply context/changes/final-art-salon/e2e/break-1-stage-twice.patch` (stage purchase charges stars but does not advance the state, so a second tap buys again). Run `-g "stage is bought by one tap"`. Expected red: `expect(staged.room.tasksDone).toBe(1)` (received 0) or the stars `toBe(7)` assertion.
2. `git apply .../break-2-no-remap.patch` (`main.ts` skips `remapLegacySalon`). Run `-g "carried over at load"`. Expected red: `expect(carried.room.tasksDone).toBe(4)` (received 4 with old keys is possible; then `chosen` `toEqual({ sofa: 2, rug: 0, 'coffee-table': 0 })` fails: received the old floor/walls/curtains/sofa keys).
3. `git apply .../break-3-missing-texture-throws.patch` (`RoomLayer.show` throws on a missing texture). Run `-g "salon pictures missing"`. Expected red: the room never opens (`screenIs room` times out, error card shown).
Each patch touches production code only; each rebuilds the hook build on the next playwright run (webServer builds).
