# Screenshots for the notebook-polish visual gate (plan rows 2.4-11.7)

Captured on 2026-10-23 on `3c58eec` (the build id in the corner of every frame), after the visual-gate fix. Frames are JPEG (quality 82), viewport-sized: desktop 1440×900, tablet 1024×768. The four `before-fix-*` frames were taken on `30d51ee`, before that fix.

## Route

Playwright on the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npx vite preview --config vite/config.prod.mjs --outDir dist-e2e --port 4399 --strictPort`. The flow was a throwaway spec in the gitignored `tests/e2e/visual.local/` folder, reusing `tests/e2e/support/{welcome,hook}.ts`, with its own config: no `webServer`, `hasTouch`, `pl-PL`, service workers blocked, and two projects (`desktop`, `tablet`). Every test ran in a fresh browser context, so there was no stale service worker and no old IndexedDB. The voice is the fake Polish voice of `fakePolishVoice`, so the speaker shows in the HUD. Afterwards the folder was moved out of the repo and the server was stopped.

Claude in Chrome was tried first. My own tab opened `http://localhost:4399/`, but the game never created its canvas: another tab of the same origin was holding the old IndexedDB. The gestures (held key, drags, the clock) also need raw touch. So I closed the tab and switched to Playwright.

Every state was reached through the product:
- the child path (age tap, `?e2eMonth=9`) or the parent path (adult gate, age "10+", stage);
- real touch taps and drags through the hook targets;
- nothing written to IndexedDB.

The e2e switches used:
- `?e2eSkills=<id>`: forces the skill, which must belong to the learner's stage;
- `?e2eVariant=off`;
- `?e2eStars=5|30`;
- `?e2eArt=room`;
- `emulateMedia({ reducedMotion: 'reduce' })`.

The entrance stagger was too fast for screenshots: the hook polling takes about 1.1 s before "Dalej" returns. So `*-stagger-1..4` are frames from a Playwright video of the same flow, sampled with `ffmpeg -vf fps=25`, which puts about 40 ms between frames.

## Kit reference (copies of `designs/martynka-maths-A-v1/screenshots/`)

| Kit frame | Copied from |
|---|---|
| `kit-welcome.jpg`, `kit-task-tiles.jpg`, `kit-task-keypad.jpg`, `kit-correct.jpg`, `kit-second-try.jpg` | welcome.png, task-tiles.png, task-keypad.png, correct.png, second-try.png |
| `kit-hint-tiles.jpg`, `kit-hint-keypad.jpg`, `kit-solution-step-1.jpg`, `kit-solution-step-2.jpg` | hint-tiles.png, hint-keypad.png, solution-step-1.png, solution-step-2.png |
| `kit-summary.jpg`, `kit-unlock.jpg`, `kit-tablet-1024.jpg` | summary.png, unlock.png, tablet-1024.png |

## Frames (`desktop-<state>.jpg` and `tablet-<state>.jpg`)

| State (plan row) | Frame `<state>` | How reached |
|---|---|---|
| Welcome over the salon backdrop, sunflower, chunky age buttons, "Rodzic" (2.5, 3.6, 5.5) | `welcome` | fresh context, `?e2eMonth=9` |
| Task with tiles; "Wróć" before the first round (2.5, 4.5, 5.5) | `task-tiles`, `wroc` | age 6, `?e2eSkills=E1.3.add_sub_5` (`wroc`: age 8, warm-up) |
| Correct tile: bounce frame, star in flight, at rest (7.5) | `correct-bounce` (90 ms), `correct-flight` (440 ms), `correct` | `answerRight` on task 1 |
| Entrance stagger (8.4) | `stagger-1..4` | "Dalej" after task 1, video frames |
| Wrong answer, wobble, then second try (7.5) | `wrong-wobble` (250 ms), `second-try` | one wrong tile on task 2 |
| Solution steps (4.5) | `solution-step-1`, `solution-step-2`, `solution-end` | a second wrong tile, then "Następny krok" |
| Summary with the star pops, burst (9.4) | `summary-pop-early` (150 ms), `summary-pop-mid` (750 ms), `summary` | the end of that round (4 stars, one retype) |
| Warm-up summary, 6 stars centred (9.4) | `warmup-summary` | age 8 (E3), 6 tasks right |
| "Nowa umiejętność!" (3.6, 5.5) | `unlock` | parent path E4 in September, rounds right until step 3 unlocks |
| Keypad with zeros, held "0", hint, correct (4.5, 7.5, 10.5) | `task-keypad`, `press-held`, `hint-keypad`, `keypad-correct` | parent path E2, `?e2eSkills=E2.7.add_sub_tens_100` |
| Hint number line labels (row 11.7 list) | `hint-numberline` | E3, `?e2eSkills=E3.6.add_sub_30_nobridge`, one wrong answer |
| HUD between tasks, gear hint (6.5) | `hud-between`, `gear-hint` | E3, `?e2eStars=5`, after a right answer; one tap on the gear |
| Room purchase, then back to the task (3.6, 9.4) | `room-before`, `room-purchase-burst`, `room-after`, `backdrop-after-purchase` | same, "Do pokoju", buy the stage, "Wróć do notesu" |
| Slot purchase burst, new piece in the backdrop (3.6, 9.4) | `room-variant-panel`, `room-slot-burst`, `backdrop-after-sofa` | `?e2eStars=30`, stage, then the sofa |
| Select / drag blocks / set the clock / pay coins: OK idle, OK wobble, second try, correct (7.5) | `select*`, `drag-blocks*`, `clock-set*`, `coins*` | `?e2eSkills=E3.7.select_even_30`, `E3.6.place_build_30`, `E3.3.clock_set_full`, `E1.11.money_pay_10` (parent path E1) |
| Long wrapped word prompt (11.7 list) | `word-long` | E3, `?e2eSkills=E3.10.word_share_30` |
| Without the salon pictures: plain page (3.6) | `plain-page` | `?e2eArt=room` |
| Reduced motion: correct, entrance, wrong, summary (7.5, 8.4, 9.4) | `reduced-correct`, `reduced-entrance-000`, `reduced-wrong`, `reduced-summary` | `emulateMedia({ reducedMotion: 'reduce' })`, age 6 |
| Before the fix (on `30d51ee`) | `before-fix-backdrop-{desktop,tablet}`, `before-fix-correct-tile-{desktop,tablet}` | the old blur, and the old pale correct tile |
