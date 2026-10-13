# Screenshots — first-launch-placement (S-06) visual gate

Captured 2026-10-13 with Claude in Chrome against the dev server on the visual port 4399
(`npx vite --config vite/config.dev.mjs --port 4399 --strictPort`), branch `feat/first-launch-placement` at
`317926b` (the build id drawn in the corner of every frame), after the two fixes of this step (`aa34170`, `317926b`).
Month: the real one, **October 2026** (the dev build does not read `?e2eMonth`), so the placement band is
September–January.

- **Desktop**: Chrome window 1440×900, page viewport 1440×773, canvas 1374×773 (scale 0.716). DOM dialogs are in
  CSS px and do not scale with the canvas.
- **Tablet**: same-origin iframe 1024×768 (`src="/"`) on a blank page of the dev server (profile § 9; Chrome cannot
  shrink its window), cropped to the iframe. Canvas 1024×576, scale 0.533, letterboxed 96 px top and bottom.

Every state was reached by tapping: the age buttons, „Rodzic”, the gate digit keys (the problem read from the
dialog text, like an adult), OK, the panel buttons, „Zatwierdź”, the round keypad/tiles, „Dalej”, „Kolejna runda”.
Answers were computed from the task on screen. No scene was read, no state written, no IndexedDB touched; the only
script calls read the DOM dialog's text and button rectangles. The tab was hidden while driven, so Chrome throttled
the frame loop: flying stars can sit mid-flight until the next frames (they land: the summary frames were taken
after they did).

| State | Desktop (1440) | Tablet (1024×768) | How reached |
|---|---|---|---|
| welcome with „Rodzic” | `desktop-01-welcome-parent.png` | `tablet-01-welcome-parent.png` | fresh load |
| adult gate | `desktop-02-gate.png` (15 · 14) | `tablet-02-gate.png` (15 · 15) | „Rodzic” |
| gate after a wrong answer (new problem + calm message) | `desktop-03-gate-wrong.png` (16 · 19) | `tablet-03-gate-wrong.png` (17 · 17) | 200 + OK |
| stage panel, no age yet (Zatwierdź disabled) | `desktop-04-panel-no-age.png` | `tablet-04-panel-no-age.png` | right product (304 / 289) + OK |
| panel, age 8 → proposal marked | `desktop-05-panel-proposal-e3.png` | `tablet-05-panel-proposal-e3.png` | age „8” |
| panel, another stage chosen | `desktop-06-panel-other-stage-e5.png` (Klasa 3, I) | `tablet-06-panel-other-stage-e2.png` (Klasa 1, II) | stage button |
| confirmed override → plain round (5 dots, E5) | `desktop-07-round-after-override-e5.png` | — | „Zatwierdź” |
| warm-up, 6 dots | `desktop-08-warmup-6-dots.png` (child path: age 8) | `tablet-07-warmup-6-dots-after-confirm.png` (parent confirmed the proposal) | age „8” / proposal + „Zatwierdź” |
| warm-up summary, 6 stars centred, +8 | `desktop-09-warmup-summary-6-stars.png` | `tablet-08-warmup-summary-6-stars.png` | six first-try answers, „Dalej” |
| normal round after the warm-up (5 dots) | `desktop-10-round-after-warmup-5-dots.png` | `tablet-09-round-after-warmup-5-dots.png` | „Kolejna runda” |
| before the fixes (evidence) | `desktop-00-welcome-before-fix.png` („Rodzic” over the notebook border, build `ebe6ebc`), `desktop-00-panel-before-fix.png` (panel 845 px, buttons below the fold, build `aa34170`) | — | same taps |

Kit frames compared (read-only, `designs/martynka-maths-A-v1/screenshots/`): `welcome.png`, `summary.png`,
`task-keypad.png`, `task-tiles.png`, `tablet-1024.png`. The parent dialogs have no kit view (DESIGN-GAP rows 15–17).
