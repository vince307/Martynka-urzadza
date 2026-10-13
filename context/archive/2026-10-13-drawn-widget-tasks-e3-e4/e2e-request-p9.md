# e2e request, phase 9 (drag mode, helpers `dragTouch`/`cancelTouch`/`buildOnMat`)

Chromium cannot start in the implementing session (MachPortRendezvousServer ... Permission denied). Run outside it:

1. Full suite: `npx playwright test --config=/Users/kamilp/Dev/Martynka-urzadza/playwright.config.ts` -> expected 37 passed (branch baseline 37, +0). `drag` is now in the pool (E3.6 `place_build_30`, E4.1 `place_build_100`), so the random-task specs exercise `answerRight`/`answerWrong` for it only by chance.
2. One-off proof of the helper (do not commit): in `tests/e2e/task-round.spec.ts` change line 36 to `await passWelcome(page, { e2eSkills: 'E3.6.place_build_30' });` (`passWelcome` is parent path, stage E3) and run `npx playwright test tests/e2e/task-round.spec.ts` -> green (a clean round of five build tasks: tens and cubes dragged from the tray to the mat by CDP touch, "OK", the star flies from "OK"). Then `git checkout tests/e2e/task-round.spec.ts`.
3. Optional wrong-answer proof in the same one-off: call `answerWrong(page)` once at the start of a task (hint bar appears, mat is emptied, `snapshot.mat` all 0), then `answerRight`.
4. If the proof is red, look first at: `targets.drag.tray` (interior point of the tray tile), `targets.drag.mat`, `snapshot.mat` polls after each drag, and whether `Input.dispatchTouchEvent` moves reach Phaser as `pointermove` (the scene feeds `stepBlockDrag` from `input.on('pointerdown'|'pointermove'|'pointerup'|'pointerupoutside')`).
