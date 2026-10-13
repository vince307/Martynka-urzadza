# e2e request, phase 7 (select mode, `?e2eSkills` seam)

Chromium cannot start in the implementing session (MachPortRendezvousServer ... Permission denied). Run outside it:

1. Full suite: `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` -> expected 37 passed (branch baseline 37, +0). `select` is now in the pool (E1.6, E3.7), so the random-task specs exercise `answerRight`/`answerWrong` for it only by chance.
2. One-off proof of the helper (do not commit): in `tests/e2e/task-round.spec.ts` change the welcome call to `passWelcome(page, { e2eSkills: 'E3.7.select_even_30' })` (passWelcome already takes `query`), run `npx playwright test tests/e2e/task-round.spec.ts` -> green (a clean round of five select tasks, star flies from "OK"). Then `git checkout tests/e2e/task-round.spec.ts`.
3. Parent-settings spec was changed in this phase: a first task of mode `select` is answered right (a marked set has no example in the preview).
