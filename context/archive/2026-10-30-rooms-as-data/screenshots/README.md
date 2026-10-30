# Screenshots for the rooms-as-data visual gate (plan row 6.6)

Captured on 2026-10-30 on `17d3756` (the build id drawn in the corner of the task frames; the working tree was clean, so every frame shows that commit). PNG, desktop 1440×900 and tablet 1024×768, 7 frames per width.

## Route

The capture used Claude in Chrome, the browser the maintainer selected at preflight. It ran against the e2e-hook dev server on the visual port: `E2E_HOOK=1 npx vite --config vite/config.dev.mjs --port 4399 --strictPort`. The server was killed at the end. Playwright was not used, and ports 4397/4398 were not touched because the orchestrator's e2e run held them.

- **Fresh device.** `http://localhost:4399` already held a `martynka` IndexedDB from earlier sessions. The game was therefore opened on the origin `http://[::1]:4399`, which had no databases and no localStorage. This was checked with `indexedDB.databases()`, which only reads. Nothing was written to IndexedDB by hand.
- **Viewports.** The Chrome viewport was 1512×717 and does not resize (profile § 8). The game ran in a same-origin `<iframe>` of exactly 1440×900 (scaled 0.78 on screen) or 1024×768 (scaled 0.93). The iframe was switched between the two sizes at each state, so both widths of a state show the same game state. Each frame is a `zoom` capture of the iframe region, resampled to its native size (1389×868 → 1440×900 and 1269×952 → 1024×768). Small resampling softness is expected; layout is unaffected.
- **Reaching the states.** These are real clicks on the canvas, at points mapped from the hook's read-only `targets`:
  1. Open `?e2eStars=129&e2eVariant=off&e2eSkills=E3.2.add_sub_20_bridge`. 129 is the sum of the salon task costs in `src/data/rooms.ts`.
  2. Tap "Rodzic", then answer the adult gate from the dialog (17 · 19 = 323). Choose "10+" and "Klasa 2, I półrocze".
  3. Answer the first task right (9 + 8 = 17, +1 star, so the balance is 130). Then tap the HUD room switch.
  4. Buy the stage, the sofa (first look) and the rug (second look). Then buy the other 9 tasks with the first look each. "Pokój gotowy!" opens.
  5. Tap "Dalej", then "Zmień wygląd". Tap the sofa, preview the third look, and tap "Wybieram".
  6. Tap "Wróć do notesu".
- **Speaker.** The HUD speaker shows because this machine has a Polish voice. It is hidden on the finished room in normal mode because there is nothing to read there (`RoomScene` narration is null without a task, the same code as on `main`).

## Frames

| # | State (row 6.6) | Desktop 1440 | Tablet 1024 | How reached / hook facts |
|---|---|---|---|---|
| 01 | Salon before the stage (worn set graded) | `desktop-01-room-before.png` | `tablet-01-room-before.png` | room switch after the first task; `tasksDone 0`, stars 130, `worn.keys` 10 pieces, `graded true` |
| 02 | Salon after the stage with some furniture (sofa first look, rug second look) | `desktop-02-room-after-stage-sofa-rug.png` | `tablet-02-room-after-stage-sofa-rug.png` | stage, sofa, rug bought; `tasksDone 3`, stars 109, `worn.keys []`, `contactShadows` lamp-table, plant-left, pouf, plant-right; next task "Postaw stolik ★10" |
| 03 | "Pokój gotowy!" card (salon tile with the check mark and live miniature, the next tile a "Wkrótce" teaser without a padlock) | `desktop-03-room-done-card.png` | `tablet-03-room-done-card.png` | last purchase (pouf); `card.items` = `{room salon, done}`, `{teaser}`; `house` = house-1 with salon (0,0) and kitchen (0,1); stars 1 |
| 04 | Finished salon after "Dalej" (mode button "Zmień wygląd") | `desktop-04-room-done.png` | `tablet-04-room-done.png` | `card null`, `mode normal` |
| 05 | "Zmień wygląd" mode (button reads "Gotowe") | `desktop-05-change-mode.png` | `tablet-05-change-mode.png` | `mode change`, panel closed |
| 06 | Change panel on the sofa, third look ("Listkowa") previewed | `desktop-06-change-panel-sofa.png` | `tablet-06-change-panel-sofa.png` | tap on the sofa in change mode; `panel {open, change, sofa, preview 2}`; "Wybieram" kept stars at 1 and set `rooms.salon.chosen.sofa 2` |
| 07 | Task screen with the finished salon blurred behind the notebook | `desktop-07-task-backdrop-finished.png` | `tablet-07-task-backdrop-finished.png` | "Wróć do notesu"; `backdrop {mode salon, drawn, blurred, webgl, graded 0}` |

## Compared with `main`

The baseline is the salon-style gate frames (`context/archive/2026-10-24-salon-style/screenshots/`: `*-room-before`, `*-room-done-card`, `*-room-done`), taken on the same layout code. The F-04 diff to `RoomScene` changes only where the done-card list comes from (`houseRoomList`) and how `doneCard.show` is called. The kit (`designs/martynka-maths-A-v1/`) has no room or done-card frame (gaps 31–41).

## Not captured

- Welcome backdrop: this origin's save already had a learner once the run started, so the welcome screen was not shown again. It was only seen behind the adult gate, and that frame was not kept.
- Settings "Zapis gry" after `?e2eSave=v4-salon`, and the export/import/reset summaries ("Salon" capitalised): the settings panel opens only after a 2 s hold on the gear. Claude in Chrome cannot drive the Phaser long press (profile § 8), and this step was told not to use Playwright.
