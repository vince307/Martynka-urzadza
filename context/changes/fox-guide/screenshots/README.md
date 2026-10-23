# Screenshots for the fox-guide visual gate (plan rows 3.5 and 4.5)

Captured on 2026-10-23 on `b84b2cf` (the build id in the corner of every frame). Frames are JPEG (quality 82), viewport-sized: desktop 1440×900, tablet 1024×768. 32 frames per width, plus 1 kit frame.

## Route

Playwright on the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npx vite preview --config vite/config.prod.mjs --outDir dist-e2e --port 4399 --strictPort`. The flow was a throwaway spec in the gitignored `tests/e2e/visual.local/` folder, reusing `tests/e2e/support/{welcome,hook}.ts`, with its own config: no `webServer`, `hasTouch`, `pl-PL`, service workers blocked, and two projects (`desktop`, `tablet`). Every test ran in a fresh browser context, so no old service worker, cache or IndexedDB was involved. The voice is the fake Polish voice of `fakePolishVoice`, so the speaker shows in the HUD. Afterwards the folder was moved out of the repo and the server was stopped.

Claude in Chrome was tried first. My own tab opened `http://localhost:4399/`, but the game stopped at the "Zapis wczytuje się bardzo wolno" card and never created its canvas: another tab of the same origin was holding IndexedDB. I closed my tab and switched to Playwright.

Every state was reached through the product:
- the child path (age tap, `?e2eMonth=9`) or the parent path (adult gate, age, stage);
- real touch taps through the hook targets;
- nothing written to IndexedDB.

The e2e switches used: `?e2eSkills=<id>`, `?e2eVariant=off|word|dice|puzzle`, `?e2eDay=2026-10-14`, `?e2eArt=ui`.

## Kit reference

| Kit frame | Copied from |
|---|---|
| `kit-fox-poses.jpg` | `designs/martynka-fox-guide-v1/preview.png` (idle / cheer / think at full and 200 px scale) |

## Frames (`desktop-<state>.jpg` and `tablet-<state>.jpg`)

| State (plan row) | Frame `<state>` | How reached |
|---|---|---|
| Tiles task at its start, idle (3.5, 4.5) | `tiles-idle` | child age 6, `?e2eSkills=E1.1.compare_qty_10&e2eVariant=off` |
| Hand-check: `guide.rect` outlined over the canvas | `rect-check`, `rect-check-zoom` | same task; a magenta DOM outline at `toPage(guide.rect)`, removed afterwards |
| Right tap: the pop 110 ms in, then cheer at rest (3.5, 4.5) | `tiles-cheer-pop`, `tiles-cheer` | `answerRight` on task 1 |
| Settings hint bubble open (4.5) | `settings-hint` | one ordinary tap on the gear between tasks |
| Wrong tap, think (3.5, 4.5) | `tiles-think` | `answerWrong` on task 2 |
| Solution phase with step lines, think (4.5) | `solution-think`, `solution-step-2`, `solution-step-3` | a second wrong tile, then "Następny krok" |
| Retype, think (4.5) | `retype-think` | the end of the solution steps |
| `SummaryPanel`, cheer (4.5) | `summary-cheer` | the rest of that round right (4 stars, one retype) |
| Portrait overlay over the game (4.5) | `portrait-overlay` | the same page resized to 420×760 (Playwright can resize, so no iframe was needed) |
| Keypad, then second try (think) (4.5) | `keypad-idle`, `keypad-think` | parent path E2, `?e2eSkills=E2.7.add_sub_tens_100`, one wrong answer |
| Select, second try (4.5) | `select`, `select-think` | parent path E3, `?e2eSkills=E3.7.select_even_30` |
| Drag blocks, then cheer (4.5) | `drag-blocks`, `drag-blocks-cheer` | E3, `?e2eSkills=E3.6.place_build_30` |
| Clock to set (4.5) | `clock-set` | E3, `?e2eSkills=E3.3.clock_set_full` |
| Hint number line (4.5) | `hint-numberline` | E3, `?e2eSkills=E3.6.add_sub_30_nobridge`, one wrong answer |
| Tall picture with tiles, and its solution (4.5) | `tall-tiles`, `tall-solution` | E3, `?e2eSkills=E3.11.temperature_read_30`, two wrong answers |
| Coin wallet (4.5) | `coins` | parent path E1, `?e2eSkills=E1.11.money_pay_10` |
| Digits column (4.5) | `digits` | parent path E5, `?e2eSkills=E5.2.written_add_100` |
| Word round with letters, then `MinigameDoneCard` (cheer) (4.5) | `word`, `minigame-done` | parent path E1, `?e2eVariant=word`, every task right |
| Dice board (4.5) | `dice` | parent path E1, `?e2eVariant=dice` |
| Daily puzzle (4.5) | `puzzle` | parent path E4, `?e2eVariant=puzzle&e2eDay=2026-10-14` |
| Warm-up, 6 beads (4.5) | `warmup` | child age 8 (E3 warm-up) |
| Unlock card, no fox (4.5) | `unlock` | parent path E4 in September, rounds right until a step unlocks |
| `?e2eArt=ui`, no fox (4.5) | `no-fox-art` | child age 6, `?e2eArt=ui` |
