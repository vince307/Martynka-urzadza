# E2E request, phase 11 (orchestrator run)

Chromium cannot start in the agent session (MachPortRendezvous ... Permission denied, three plain tries). Nothing is committed.
Uncommitted files: `tests/e2e/final-art-room-done.spec.ts` (new, 3 tests), `playwright.config.ts` (spec added to ROUND_SPEC),
this file. Verified without a browser: `tsc --noEmit` clean, eslint on the spec clean, `git apply --check` of the break OK.

## Green run

1. `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts --workers=4 final-art-room-done` -> 3 passed
   (live / thumbnail / drawn). The spec reads `snapshot.room.doneMiniature` with explicit timeouts (15 s, 30 s for the room);
   if (a) or (b) fail on a timing wait, widen that timeout, not the assertion.
2. Full `npx playwright test --config=... --workers=4` -> 114 + 3 = 117 passed.

## Break p11a (tile always `live`)

`git apply context/changes/final-art-p2/e2e-break-p11a.patch`, then run command 1.
Expected red: test (b) "with salon pictures missing the done card shows the pack thumbnail":
`expect(received).toBe(expected)` Expected "thumbnail", Received "live"; (c) is red too (Expected "drawn", Received "live").
(a) stays green. Revert with `git apply -R context/changes/final-art-p2/e2e-break-p11a.patch`.
Meta-check: the break changes the value the hook observes (the card's recorded mode), not only the paint.

## After green

Commit `test(final-art-p2): room-done miniature and thumbnail fallback e2e (p11)` with the spec, config and plan Progress rows
(SHA appended), then the epilogue (change.md `implemented`) as last phase, then handoff p11.
