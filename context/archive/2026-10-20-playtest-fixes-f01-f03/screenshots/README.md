# Screenshots for the playtest-fixes-f01-f03 visual gate (plan rows 4.5, 4.6, 6.4)

Captured on 2026-10-20 on `a7b1856` (the build id in every frame). The hint frames (`*-hint*`) were shot again after the VG-1 fix, on `a7b1856` plus the uncommitted fix; the build id is the HEAD at build time.

## Route

Playwright on the e2e-hook build (`E2E_HOOK=1 npm run build -- --outDir dist-e2e`), served by `npx vite preview --config vite/config.prod.mjs --outDir dist-e2e --port 4399 --strictPort`. The flow was a throwaway spec in `tests/e2e/visual.local/` (gitignored), reusing `tests/e2e/support/{welcome,hook}.ts`, with its own config (no `webServer`, `hasTouch`, `pl-PL`, `Europe/Warsaw`, service workers blocked) and two projects: `desktop` 1440×900 and `tablet` 1024×768. After the run the folder was moved out of the repo and the server stopped.

Claude in Chrome was not used: every state here needs canvas taps on Phaser targets and answered tasks, which the extension cannot drive (profile § 8). Every state was reached through the product: the gear tap is a real touch tap, "Wróć" a real tap, the rounds answered through the hook's read-only targets. Nothing writes to IndexedDB. The only e2e switches are `?e2eMonth=9`, `?e2eVariant=off`, `?e2eStars=100` (room) and `?e2eSkills=` (pinned tall drawing and keypad task).

Frames are JPEG q 80, viewport-sized.

## Kit reference

The kit frames are in `designs/martynka-maths-A-v1/screenshots/` (`task-keypad.png`, `task-tiles.png`, `summary.png`, `welcome.png`, `tablet-1024.png`). The kit has no settings gear, no hint and no "Wróć": DESIGN-GAP rows 25, 28, 151 and 152 in `docs/design-gaps.md`. The gear follows the kit's HUD button family (ivory fill, butter border, teal icon, like the speaker and "Do pokoju" in `task-keypad.png`).

## Frames

| State (row) | Desktop | Tablet | How reached |
|---|---|---|---|
| Task, gear idle at full colour, parent-placed learner: no "Wróć" (4.5, 6.4) | `desktop-task-idle-parent.jpg` | `tablet-task-idle-parent.jpg` | parent path (gate, age 10+, stage E3), first task |
| Task, hint after the first tap (4.5) | `desktop-task-hint.jpg` | `tablet-task-hint.jpg` | the same, one tap on the gear |
| Task, hint gone after `hintMs` (4.5) | `desktop-task-hint-gone.jpg` | `tablet-task-hint-gone.jpg` | the hook's `settingsHint` polled to false |
| Hint with "Dalej" on screen (4.5) | `desktop-task-hint-dalej.jpg` | `tablet-task-hint-dalej.jpg` | first task answered, then the first tap on the gear |
| Hint with the widest bar (tall drawing, tiles, "Dalej") (4.5) | `desktop-task-hint-tall-dalej.jpg` | `tablet-task-hint-tall-dalej.jpg` | `?e2eSkills=E3.11.temperature_read_30`, answered, gear tap |
| Hint over a keypad task (4.5) | `desktop-task-hint-keypad.jpg` | `tablet-task-hint-keypad.jpg` | `?e2eSkills=E3.2.add_sub_20_bridge`, gear tap |
| Room, gear idle (4.6) | `desktop-room-idle.jpg` | `tablet-room-idle.jpg` | `?e2eStars=100`, task answered, "Do pokoju" |
| Room, hint with the task button (4.6) | `desktop-room-hint.jpg` | `tablet-room-hint.jpg` | the same, gear tap |
| Room, variant panel open (4.6) | `desktop-room-panel.jpg` | `tablet-room-panel.jpg` | stage bought, task button, panel open |
| Room, hint with the variant panel (4.6) | `desktop-room-panel-hint.jpg` | `tablet-room-panel-hint.jpg` | the same, first gear tap of the page load |
| Warm-up E3 (age 8, October), keypad task with "Wróć" (6.4) | `desktop-warmup-keypad.jpg` | `tablet-warmup-keypad.jpg` | child path, tap "8" |
| Warm-up E3, tile task with "Wróć" (6.4) | `desktop-warmup-tiles.jpg` | `tablet-warmup-tiles.jpg` | child path on fresh contexts until a tile task was drawn (attempt 5 desktop, 3 tablet) |
| Warm-up, "Dalej" shown, "Wróć" clear of it (6.4) | `desktop-warmup-done-dalej.jpg` | `tablet-warmup-done-dalej.jpg` | first warm-up task answered |
| Warm-up summary with "Wróć" (6.4) | `desktop-warmup-summary.jpg` | `tablet-warmup-summary.jpg` | six tasks right |
| First ordinary round E3 with "Wróć" (6.4) | `desktop-round1-e3.jpg` | `tablet-round1-e3.jpg` | "Kolejna runda" |
| First ordinary round finished: "Wróć" gone (6.4) | `desktop-round1-summary.jpg` | `tablet-round1-summary.jpg` | five tasks right |
| Second ordinary round, no "Wróć" (6.4) | `desktop-round2-no-wroc.jpg` | `tablet-round2-no-wroc.jpg` | "Kolejna runda" |
| First ordinary round E1 (age 6), tiles, "Wróć" (6.4) | `desktop-e1-round1.jpg` | `tablet-e1-round1.jpg` | child path, tap "6" |
| E1 task answered, "Dalej" and "Wróć" (6.4) | `desktop-e1-round1-done.jpg` | `tablet-e1-round1-done.jpg` | right tile |
| Welcome after "Wróć": no star counter, no gear (6.4) | `desktop-welcome-after-wroc.jpg` | `tablet-welcome-after-wroc.jpg` | tap "Wróć" |
