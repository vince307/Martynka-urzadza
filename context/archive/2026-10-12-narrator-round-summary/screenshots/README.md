# Screenshots — narrator-round-summary (S-05) visual gate

Captured 2026-10-13 with Claude in Chrome against the dev server on the visual port 4399
(`npx vite --config vite/config.dev.mjs --port 4399 --strictPort`), branch `feat/narrator-round-summary` at
`184da15` (the build id drawn in the corner of every frame). Stage E3 (the default until S-06), random seed.

- **Desktop**: Chrome window 1440×900, page viewport 1440×773, canvas 1374×773 (scale 0.716).
- **Tablet**: same-origin iframe 1024×768 on a page of the dev server (profile § 9; Chrome cannot shrink its
  window), cropped to the iframe. Canvas 1024×576, scale 0.533, letterboxed 96 px top and bottom.
- **Without a Polish voice**: Chrome on this Mac has two Polish voices (Zosia, Google polski), so the speaker
  shows by default. For the hidden-speaker frames the iframe was created empty, its
  `speechSynthesis.getVoices` replaced by `() => []`, and the game's own `index.html` (fetched from the dev
  server) written into it with `document.write`, so the override was in place before `main.ts` ran. No game
  code was changed or injected; the iframe check printed `getVoices().length = 0`.

Every state was reached by tapping the canvas (keypad, tiles, "Dalej", "Następny krok", "Już wiem",
"Do pokoju", "Wróć do notesu", "Kolejna runda"). Answers were computed from the task on screen; no scene was
read, no state written, no IndexedDB touched. The tab was hidden while being driven, so Chrome throttled the
frame loop: flying stars appear mid-flight in some frames (they land: the counter and the next frames show it),
and a frame right after a wrong answer can sit a few pixels off centre (the notebook shake).

| State | Desktop (1440) | Tablet (1024×768) | How reached |
|---|---|---|---|
| task-keypad with the speaker | `desktop-01-task-keypad-speaker.png` | `tablet-01-task-keypad-speaker.png` | fresh load; `3 + 8` / `12 − □ = 4` |
| correct, HUD "Do pokoju" shown | `desktop-02-correct-hud-switch.png` | `tablet-02-correct-hud-switch.png` | right answer + OK on task 1 |
| room from the HUD (counter above) | `desktop-03-room-from-hud.png` | `tablet-03-room-from-hud.png` | HUD "Do pokoju" |
| task after returning (same round, `done`) | `desktop-04-task-after-room.png` | `tablet-04-task-after-room.png` | "Wróć do notesu" |
| task-tiles with the speaker | `desktop-05-task-tiles-speaker.png` | `tablet-05-task-tiles-speaker.png` | "Dalej" to task 2 (ROMAN / CALENDAR) |
| summary, clean round (+7, bonus line) | `desktop-06-summary-clean-bonus-7.png` | `tablet-06-summary-clean-bonus-7.png` | five first-try answers, "Dalej" after the fifth |
| room from the summary | `desktop-07-room-from-summary-7.png` | `tablet-07-room-from-summary-7.png` | summary "Do pokoju" |
| summary after returning (same result) | `desktop-08-summary-after-room.png` | `tablet-08-summary-after-room.png` | "Wróć do notesu" |
| hint, no HUD switch | `desktop-09-hint-no-switch.png` | `tablet-09-hint-no-switch.png` | "Kolejna runda", wrong answer + OK |
| retype done, switch shown, no star | `desktop-10-retype-done-switch-no-star.png` | `tablet-10-retype-done-switch-no-star.png` | second wrong answer, steps, "Już wiem", retype + OK |
| summary after a retype (+4, pale first star) | `desktop-11-summary-retype-4.png` | `tablet-11-summary-retype-4.png` | tasks 2–5 first try, "Dalej" |
| task-keypad without a Polish voice | — | `tablet-12-task-keypad-no-voice.png` | no-voice iframe, fresh load (`24 : 8`) |
| task-tiles without a Polish voice | `desktop-12-task-tiles-no-voice.png` (iframe 1440×773) | `tablet-13-task-tiles-no-voice.png` | no-voice iframe, first-try answers until a tiles task |

Kit frames compared (read-only, `designs/martynka-maths-A-v1/screenshots/`): `summary.png`, `task-tiles.png`,
`task-keypad.png`, `correct.png`, `tablet-1024.png`; tokens from `screen.css` (`.hud button`, `.speaker`,
`.room-button`, `.page-button`, `.resume`).
