# Visual review — first-launch-placement (S-06)

Step: visual gate of autonomous run 2026-10-12-s04-s08, after impl-review (`MERGE: CLEAR`, fix `a6f091b`).
Capture: Claude in Chrome (browser selected at preflight; own tab, closed at the end), dev server on port 4399,
desktop 1440×900 window (viewport 1440×773), tablet 1024×768 through a same-origin iframe (profile § 9). Final
frames at `317926b`. Month: the real one, October 2026 (dev build, no `?e2eMonth`). All states reached by taps;
nothing written, no IndexedDB. Frames and how each was reached: `screenshots/README.md`. Kit:
`designs/martynka-maths-A-v1/screenshots/welcome.png`, `summary.png`, `task-keypad.png`, `task-tiles.png`.

## States

| Plan row | State | Desktop | Tablet | Verdict |
|---|---|---|---|---|
| 4.7 | welcome vs `welcome.png` | `desktop-01` | `tablet-01` | brand, „Ile masz lat?”, five 218×190 age buttons at left 363 / top 526 in the kit's green tile style, notebook 180–1740; sunflower and cushion left out (DESIGN-GAP 20). **Fixed**: „Rodzic” straddled the notebook's bottom-right border (`desktop-00-welcome-before-fix`) |
| 5.6 | welcome with „Rodzic” | `desktop-01` | `tablet-01` | secondary page button (`#fff6dc`/`#c0a363`, kit `.page-button.secondary`) inside the notebook, where the kit draws the cushion (DESIGN-GAP 15) |
| 5.6 | adult gate | `desktop-02` | `tablet-02` | „Pytanie dla rodzica”, „Ile to jest a · b?”, readout, 3×4 digit pad with ⌫, OK / Anuluj; paper/ink/border tokens from the kit palette; focus on „1” (not destructive) |
| 5.6 | gate after a wrong answer | `desktop-03` | `tablet-03` | new problem, readout cleared, „To nie ta liczba. Spróbuj z nowym działaniem.” — calm, no lockout, no red |
| 5.6 | panel, no age | `desktop-04` | `tablet-04` | „Ustawienia startowe”, „Wiek dziecka” 6–10+, „Etap nauki” six stages, „Zatwierdź” disabled. **Fixed**: the panel was 845 px tall and „Zatwierdź”/„Anuluj” fell below the fold of 773/768 px (`desktop-00-panel-before-fix`) |
| 5.6 | panel, proposal marked | `desktop-05` | `tablet-05` | age 8 pressed, „Klasa 2, I półrocze (propozycja)” pressed, „Zatwierdź” enabled |
| 5.6 | panel, another stage chosen | `desktop-06` | `tablet-06` | the chosen stage pressed, the proposal keeps its tag but is released |
| 5.6 | confirmed (override) | `desktop-07` | — | plain round of 5 dots on E5 (`4 · 9`), no warm-up (decision 7.6) |
| 6.4 | warm-up, 6 dots | `desktop-08` | `tablet-07` | six dots of the kit kind, row centred (DESIGN-GAP 18); child path on desktop, parent-confirmed proposal on the tablet |
| 6.4 | warm-up summary | `desktop-09` | `tablet-08` | six stars centred on the kit row's axis (scene x 953, as the 5-star row), „+8”, bonus line, kit buttons (DESIGN-GAP 19, 9) |
| 6.4 | round after the warm-up | `desktop-10` | `tablet-09` | five dots, counter 8 kept, a normal E3 task |

## Hand-checked numbers

- **Placement** (`docs/ZADANIA.md` §1, table row „8 lat | E3 | E4 | E4”): age 8, month October = `getMonth()` 9,
  in the band September–January (`placementData.monthBands.autumn` = 8, 9, 10, 11, 0) → **E3** = „klasa 2,
  I półrocze” (ZADANIA §1 „Etapy”). The panel marks „Klasa 2, I półrocze (propozycja)” (`desktop-05`, `tablet-05`),
  and the child path's warm-up opens on an E3 task (`80 − 30`, `desktop-08`).
- **Gate product**: desktop `15 · 14 = 210` (`desktop-02`); typed 200 → new problem `16 · 19` (`desktop-03`);
  `16 · 19 = 16 · 20 − 16 = 320 − 16 = 304` typed → panel opened (`desktop-04`). Tablet: `17 · 17 = 289` opened the
  panel. All factors in 13–19 (decision 7.9).
- **Warm-up stars**: six first-try answers → 6 × 1 + 2 (round without a mistake) = **8**; summary „+8” and HUD 8
  on both sizes; the next round starts with the counter at 8.

## Touch targets at 1024×768

Canvas scale 1024 / 1920 = 0.533; DOM rectangles measured with `getBoundingClientRect` inside the iframe.

| Target | Size | CSS px at 1024×768 |
|---|---|---|
| Age buttons (canvas) | 218×190 scene | 116×101 |
| „Rodzic” (canvas) | 260×110 scene | 139×59 |
| Gate digit keys / ⌫ | DOM | 96×64 |
| Gate OK / Anuluj | DOM | 85×64 / 124×64 |
| Panel age buttons (6–9 / 10+) | DOM | 64×64 / 90×64 |
| Panel stage buttons | DOM | 326×64 |
| Panel Zatwierdź / Anuluj | DOM | 161×64 / 124×64 |

All ≥ 48 CSS px. The panel at 1024×768 is 585 px tall, top 91, so every button is on screen without scrolling.

## Findings and fixes

1. **„Rodzic” over the notebook border** (`WELCOME_LAYOUT.parent` at 1596–1856 × 922–1032 against the notebook's
   1740/992 edge). Fixed in `aa34170`: left 1420, top 834, inside the notebook's bottom-right corner (44 px from the
   inner border on the right, 32 px at the bottom, where the kit draws the cushion). `tests/layout.test.ts` now
   asserts the button sits inside the notebook (red on the old values: `expected 1856 to be less than or equal to
   1724`, green after). Gap row 15 updated.
2. **Stage panel taller than a tablet screen** (845 px; „Zatwierdź”/„Anuluj” at y 777 in a 773 px viewport, so a
   parent had to discover a scroll). Fixed in `317926b` (CSS only, `src/style.css`): stages in two columns, one row
   per grade, labels 0.85em on one line, „(propozycja)” on a second line of the button; the dialog is centred with
   `margin-block: auto` (the overlay's `flex-start` still keeps the top reachable if it ever scrolls). Panel now 617 px
   (desktop) / 585 px (tablet). Gap row 17 updated.

After each fix: full local gate green (lint, typecheck, unit 765 = baseline 671 + 94, unchanged by the fixes, deploy
and ops scripts OK, `sample` E1–E6 `Naruszenia: 0`, build `e2e hook: absent`) and `npx playwright test` 14 passed
(Chromium launched in this session).

Kept, recorded, not changed:

- DESIGN-GAP 15–21: the frames show the provisional behaviour each row describes. The parent dialogs have no kit view;
  they read as calm (paper `#FFF5DF`, ink `#245C59`, no red, „To nie ta liczba…” in a muted size), legible (body text
  ≥ 20 px at 1024 wide) and use the kit's button border/fill pair.
- Art the kit has and the placeholders do not (room background, sunflower, cushion, ribbon, ruled margin): S-16.

Observations, recorded as follow-ups (`follow-ups/review-fixes.md`, „From the visual gate”):

- O1 A `□` inside a **sentence** prompt (the FACT_FAMILY check variant, „5 − 1 = 4. Sprawdź: 4 + 1 = □”, seen in an
  age-8 warm-up through its E2 part) is drawn as the font's tiny fallback glyph: `TaskScene` draws boxes only for
  expression prompts (`isExpression` → `drawExpression`, DESIGN-GAP 8). S-06 is the first slice that plays E2, so a
  child now meets it. Not fixed here: it is the S-04 prompt renderer, not a view this slice owns, and the fix (boxes
  inside wrapped text) needs its own test. Trigger: S-07.
- O2 With the tab hidden, Chrome throttles the frame loop and flying stars sit mid-flight across the summary until
  frames run (the same note as the S-05 gate). Capture artefact, not a product defect.

VISUAL: GAPS — every [visual] state of rows 4.7, 5.6, 6.4 captured at 1440 and 1024×768 and matches the kit within DESIGN-GAP 15–21 after two fixes (aa34170 „Rodzic” inside the notebook, 317926b panel fits 768 px); E3 for age 8 in October, 304 = 16 · 19, +8 = 6 × 1 + 2, targets ≥ 48 CSS px; open: O1 tiny □ glyph in E2 sentence prompts (follow-up, Trigger: S-07)
