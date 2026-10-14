---
date: 2026-10-14T15:43:00+02:00
researcher: Claude (autonomous run 2026-10-14-save-s13b-s15-s14b, research step)
git_commit: 1c01e0c892d54a9dfc9140c04dea9a4b96e06ab3
branch: feat/drawn-grid-tasks-e3-e4
repository: Martynka-urzadza
topic: "S-13b drawn-grid-tasks-e3-e4: PUZZLE_GRID, GRID, PERIMETER and 'set the clock' by dragging hands; clock-hand gesture, non-numeric drag answers and the retype trap (S13-01..04), hints, ranges, unlock thresholds for live saves"
tags: [research, tasks, clock, drag, gesture, grid, perimeter, puzzle-grid, curriculum, unlock, e2e, design-gaps]
status: complete
last_updated: 2026-10-14
last_updated_by: Claude (autonomous run, research step)
---

# Research: S-13b drawn-grid-tasks-e3-e4

**Git Commit**: `1c01e0c` · **Branch**: `feat/drawn-grid-tasks-e3-e4` · Research only, no product code changed.
Anchors are file + symbol (run contract: no line numbers). `docs/zrodla/` was not read. `lessons.md` in
`context/foundation/` does not exist (checked), so no lesson applies. Four read-only workers covered (A) drag wiring,
gesture reducers, clock geometry, e2e helpers, Phaser input; (B) task model, `isCorrect`/retype, validator, hints,
mistake examples, audit items S13-01..09; (C) curriculum data, unlock rule, live-save effects, pinning tests;
(D) design kit, design gaps, copy keys, nouns, shared widgets. Decisive anchors were re-read in the main context.

## Research Question

From `change.md` (scope table, roadmap corrections, unknowns, triggered follow-ups): what does the code need so that
S-13b can ship PUZZLE_GRID (E3.5), GRID (E3.7), PERIMETER (E4.7, E5.12, E6.3) and CLOCK "set" by dragging hands
(E3.3, E3.11, E4.3)? Settle: the angle gesture on a tablet (snap 60 / 5 min) and how it composes with
`longPress`/`blockDrag`/`inputSuspend` and Phaser 4 input; the answer model for non-numeric answers (hand positions,
grid cell, magic-square cell) and the stuck-retry trap S13-01..04; what hints and solution steps teach; number
ranges per step; how the unlock-threshold change hits learners mid-step on live v1 saves; design sources and gaps.

## Summary

1. **Clock answer = the existing string `formatTime(h, m)`** ("3.30"), compared with `===` by `isCorrect`
   (`src/core/round.ts`). It is what CLOCK `read` already uses (`src/core/tasks/generators/clock.ts`), fits
   `MistakeExample.given: number|string` and `validExample` (`src/core/save.ts`) unchanged, so **save format stays
   v1** (change.md decision 6 holds). An `{h, m}` object or "minutes since 12" would break `captureFirstWrong`,
   `validExample` and `solutionSteps`. The dial reducer must emit hour 1–12 (never 0: `formatTime(0, …)` gives
   "0.00") and, for E3.11 `h24`, the answer is the dial form ("3.00" for a "15.00" prompt).
2. **The retype trap is real for any drag answer outside the reachable set.** `answer()` in `retype` returns the
   same state on a wrong input (`src/core/round.ts`), so an answer the widget cannot produce leaves the child with no
   "Dalej". Today `TaskScene.render` calls `dragKinds(typeof task0.answer === 'number' ? task0.answer : 0)` and
   `dragKinds(answer: number)` (`src/core/round/dragLayout.ts`) — a string clock answer would silently get the
   tens+ones tray (S13-04). Fix in scope: branch the drag widget by `task.visual.kind` (`clock` → hands, `blocks`/none
   → mat), throw in core on an unknown drag kind, and a per-skill "solvable in its own mode" test over E1–E6 via
   `generateTask` (S13-01/02/03), with `skill.id` in generator errors (S13-07).
3. **Gesture:** a new pure reducer in `src/core/` mirroring `stepBlockDrag` (`src/core/blockDrag.ts`: events
   `down/move/up/cancel/reset`, `pointerId` guard). Angle `atan2(dx, -dy)` clockwise from 12, snapped on every move;
   the finger's radius does not matter, only its angle. Laid out in the drag mat area (`TASK_LAYOUT.drag.mat`,
   944 × 460) the dial scale is about 460/300 ≈ 1.53, minute hand ≈ 162 scene px, 5-minute arc at the tip ≈ 85 scene
   px (≈ 45 CSS px on a 1024 px tablet) with ±15° capture per position — workable, so **change.md decision 4 stands
   (E4.3 gets "set" with a 5-minute snap)**. In the 600 × 294 tiles picture rect the same arc is only ≈ 53 scene px, so
   the clock-set task must not reuse `TASK_LAYOUT.picture.tiles`.
4. **Hands:** E3 (full hours) moves only the hour hand, minute hand fixed at 12. E4 moves both; recommended model:
   the child sets the minute hand (snap 5 min) and picks the hour with the short hand (snap to the nearest
   `h + m/60` position), the short hand is always *drawn* at `clockHandAngles(h, m)` so the face never shows an
   impossible time. Rejected: a fully coupled real-clock gear (changing the hour needs whole turns of the minute
   hand — slow for a child). Grab rule: nearer hand by angle, a tie broken by radius (beyond the midpoint of the two
   tips → minute). A ≥ 96 px handle at each tip is a DESIGN-GAP (kit `reference/clock.svg` has none).
5. **Other answers stay in existing modes:** magic square / pyramid = one empty cell, `keypad`, numeric answer;
   GRID = `tiles` with string choices ("B3" / item name); PERIMETER = `keypad` numeric. No new input mode is needed
   besides the clock branch of `drag`.
6. **Unlock:** re-evaluated at every normal round end and only forward (`unlockReady`/`endRound` in
   `src/core/curriculum.ts`; saved `unlockedStep` is a step number, never lowered; new skills start at mastery 0).
   No learner is ever re-locked; a learner still *on* E3.3, E3.11, E4.7 (and E3.5/E3.7 with two additions) needs one
   more mastered skill. E5.12 and E6.3 become playable, which shifts `calendarStart` choices (only upward for saved
   learners via `floorToCalendar`) and needs `childName` for the unlock card.
7. **Design:** the kit has only a static grid with polygons (`reference/square-grid.svg`, `helper-metadata.json`
   `grid`) and a static clock (`reference/clock.svg`, `clock`); nothing in any of the six `designs/` packs shows number
   cells, coordinate labels, side-length labels or hand handles → five DESIGN-GAP rows from 73.

## Detailed Findings

### A. Drag wiring today (S13-04, follow-ups)

- `TaskScene.create` registers scene-wide `pointerdown`/`pointermove`/`pointerup` → `feedDrag`, `pointerupoutside`
  → `{ type: 'cancel' }`, scene sleep → `reset` (`src/scenes/TaskScene.ts`). So the follow-up "`pointerupoutside` →
  `cancel`" is **already wired** for blocks; what is missing is a unit test proving `cancel` for the new reducer and
  routing the same listeners to it.
- `feedDrag` calls `stepBlockDrag(before, event, this.dragGeo, balance.blockDrag)`; `BlockMat` "OK" submits
  `matValue(mat)` (a number) through `TaskScene.submit`, which clears keypad/select/drag state when the phase is not
  `done` (`src/scenes/TaskScene.ts` `submit`).
- `stepBlockDrag` (`src/core/blockDrag.ts`): `BlockDragEvent` = down/move/up/cancel/reset with `pointerId`;
  `startDistance` from `balance.blockDrag`; a `down` while carrying with the same `pointerId` returns `state`
  (S13-09, low: a lost touchend leaves a block in the air). The clock reducer should treat `down` during a carry as
  a fresh grab instead of copying this.
- `dragKinds = (answer: number) => answer >= 100 ? […three] : ['ten','one']` (`src/core/round/dragLayout.ts`); the
  scene coerces a non-number to 0 (S13-04).
- `pictureLayout` (`src/core/round/pictureLayout.ts`) has branches only for `tall`, `keypad` and a default that
  sends `select`/`drag` to the tiles rect (`TASK_LAYOUT.picture.tiles`, top 396 + 294) — overlapping
  `TASK_LAYOUT.select.top` 600 (the S-13 follow-up "picture area for select/drag"). The clock-set task needs its own
  rect: recommended `TASK_LAYOUT.drag.mat` for the dial, `drag.ok` for "OK", `drag.solutionLines` for the solution
  (the tray is not shown).
- `belowPrompt` keeps the picture bottom and moves its top under the prompt with `Math.max(0, …)` height (S13-08).
  Grid prompts ("Co leży na polu B3?", "Jaki obwód ma ten prostokąt?") are one line; S13-08 only bites if the plan
  writes long prompts — recommend a unit test with the longest prompt of each new picture skill.
- `TASK_LAYOUT.picture.keypadSolution.picture` is 768 × 190 (`src/data/layout.ts`): an 8 × 5 kit grid at 48 px is
  240 px tall, so a PERIMETER/PUZZLE_GRID drawing must scale to ~0.79 in the solution phase; side labels at
  `textStyle` 28 px would drop to ≈ 22 scene px (≈ 12 CSS px). Plan decides: scale the grid (cell ≥ 36 px) or grow
  `keypadSolution` (O1/O2 follow-up, now triggered for keypad pictures).
- e2e: `src/testing/e2eHook.ts` snapshot exposes `mat`, `carrying` and `targets.drag` from `BlockMat.targets()`;
  `tests/e2e/support/hook.ts` `buildOnMat`/`dragTouch`/`cancelTouch` drive CDP touch events; `tests/e2e/adaptive.spec.ts`
  has `test.setTimeout(180_000)` and expects the E4.3 unlock from E4.2 ("E4.3 (the clock) became playable in S-13").
  A clock-set task in E4.3 means `answerRight`/`wrongAnswer` need a clock branch and the hook must expose the dial
  centre, hand tips and "OK" (interior points, profile § 9).

### B. Gesture composition and Phaser 4 input

- Existing pure gesture reducers: `src/core/longPress.ts` (hold timer driven by the loop clock), `src/core/roomGesture.ts`
  (built on `longPress`), `src/core/roomHit.ts` (`slotAt`/`holdPoint`), `src/core/blockDrag.ts`. Pattern: a pure
  `(state, event, geometry, rules) => state` in core, numbers in `balance`, the scene only feeds raw pointer events.
  Recommended: `stepClockSet(state, event, geo, rules)` with `geo` = centre, scale, hand lengths; `rules` =
  `minuteStep` (60 or 5), `grabRadius` (≥ 48 scene px = half a 96 px target), all from `balance`/`layout`.
- `inputSuspend` (`src/core/inputSuspend.ts`, created in `src/main.ts` with `pointer.reset()` on release): any DOM
  overlay switches input off and resets all pointers; a carry in progress gets no `up`. The clock reducer must accept
  `reset` (as blocks do on sleep) — no new rule beyond the blocks pattern.
- Phaser 4.2.1 (`node_modules/phaser/package.json`). `src/main.ts` sets no `input.activePointers`, so only Phaser's
  default pointers exist (types: more via `input.addPointer` or `activePointers`, `node_modules/phaser/types/phaser.d.ts`);
  second-finger branches are effectively dead, which suits a one-finger dial. `pointerupoutside` exists in the v4
  typings. context7 (`/websites/phaser_io_phaser4`) returned no input docs, so v3→v4 input differences were checked
  only against the installed typings, not documentation — **gap, low impact** (the blocks drag already proves the
  same events in v4 on the device).
- Geometry (`src/ui/widgets/ClockFace.ts` `DIAL`: outer 150, minute hand 106, hour hand 78; `clockHandAngles` in
  `src/core/round/pictureLayout.ts`: hour `((h % 12) + m/60)·30`, minute `m·6`). At scale 1.53 (dial in
  `drag.mat` height 460): minute tip r ≈ 162, hour tip r ≈ 119 (43 px apart — less than one 96 px target, hence the
  angle-first grab rule). `ClockFace.bounds()` returns only the rect; the reducer geometry needs centre and scale
  exported from the layout, not read back from the widget.
- Snap: minute `round(θ/30°·(60/step))`-style quantisation to `minuteStep`; hour = nearest of 12 positions to
  `θ_hour − m·0.5°` → `1..12`. E3: minute hand static at 12, only the hour hand moves (12 positions, 30°). E3.11 `h24`:
  same dial, prompt "Ustaw zegar na 15.00", answer "3.00".
- Start pose: the generator picks a start time ≠ answer, hands not overlapping, carried in the visual (e.g.
  `visual: { kind: 'clock', hour, minute, set: true }` or a new `clockSet` kind). `describeVisual` currently renders
  `[clock 3.30]`; `src/core/narration/spoken.ts` must not read the start pose as if it were the question.

### C. Answer model, validator, hints (S13-01..07)

- `Task` (`src/core/tasks/types.ts`): `answer: number | string | number[]`, `choices?`, `hint: string[]`,
  `check?: (input) => boolean`, `input?: AnswerMode`, `visual?: TaskVisual`. `isCorrect` = `task.check ? task.check(input)
  : input === task.answer` (S13-01: an array answer without `check` is never correct).
- `validateTask` (`src/core/tasks/validate.ts`) range/negative checks only for numeric answers, the answer-in-choices
  check skips arrays (S13-03); no mode awareness. `tests/generateTask.test.ts` loops only `tiles` skills and `continue`s
  on arrays; `tests/contentInvariants.test.ts` calls the raw generator, not `generateTask` (S13-02).
  `generateTask` adds `input: skill.answer` and wraps nothing (S13-07: parser errors such as `CLOCK params.variant …`
  name no `skill.id`).
- Recommended "solvable in its own mode" helper: `canonicalInput(task)` — tiles/keypad: `answer`; select: `answer`
  array (must be ⊆ choices and pass `check`); drag blocks: number ≤ 999 with digits ≤ `maxPerKind`; drag clock: the
  answer string must be in the reducer's reachable set for that `minuteStep`. Over every skill of E1–E6 via
  `generateTask` with the 20 × 50 seed harness (`tests/helpers.ts`): `validateTask` clean and
  `answer(startRound…, canonicalInput)` reaches `done`.
- Hints (`src/core/round/hints.ts`): `firstHint` returns `hint[0]` only if `hint.length ≥ 2` and `leaksAnswer` is
  false (numeric: last number = answer; text: answer as a token), with `FIRST_HINT_EXEMPT_TYPES` bypassing the leak
  test; `solutionSteps` = all hints + an answer line when the last hint lacks the answer. Note for clock "set": the
  answer string is already in the prompt by design, so hint[0] must avoid the token "3.30" (otherwise it is
  suppressed) and teach hand placement instead.
- Mistakes: `captureFirstWrong` stores only number/string (`src/core/round.ts`); a clock `given` string fits v1.

### D. What hints and solution steps should teach (plan `Martynka-urzadza.md` "Zła odpowiedź…": hint, second try, solution step by step, child re-enters the result)

| Type | hint[0] (method, no result) | later steps | retype |
|---|---|---|---|
| CLOCK set E3 | "Krótka wskazówka pokazuje godzinę; długa stoi na 12." (`clockHandsHint` exists) | "Krótką wskazówkę ustaw na 4." | set the hour hand again |
| CLOCK set E4 | which hand shows what; "30 minut to pół obrotu długiej wskazówki" | long hand on 6; short hand between 3 and 4 | set both hands again |
| PUZZLE_GRID magic | "Dodaj liczby w pełnym wierszu — tyle samo ma dać każdy wiersz i kolumna." | `a + b + c = S`; `S − x − y = ?` → result | keypad |
| PUZZLE_GRID pyramid | "Liczba w cegle to suma dwóch cegieł pod nią." | the addition / subtraction for the empty brick | keypad |
| GRID | "Najpierw litera kolumny, potem numer wiersza." | "Przedmiot stoi w kolumnie B, w wierszu 3." | tiles |
| PERIMETER E4 | "Obwód to suma długości wszystkich boków." | `3 + 5 + 3 + 5 = 16` (rectangle also `2 · (3 + 5)`) | keypad |
| PERIMETER E5 inverse | "Kwadrat ma 4 równe boki." / "Dwa boki prostokąta to połowa obwodu." | `20 : 4 = 5`; `P : 2 − a = b` | keypad |
| PERIMETER E6 composite | "Policz kratki wzdłuż każdego boku." | sum of side lengths | keypad |

ADD_SUB's school method (`docs/ZADANIA.md` § 4 ADD_SUB: E2–E3 "do 10 + reszta", E4+ tens and ones) is the model for
the arithmetic lines. All strings go to `src/data/pl.ts` `tasks.*` (existing clock keys: `clockRead`, `clockLater`,
`clockH24`, `clockHandsHint`, `clockShortHandHint`, `clockLongHandHint`, `clockAnswerHint`, …; no "set" key exists).

### E. Number ranges (docs/ZADANIA.md § 2 table, § 3 steps, § 4 types)

- E3: numbers to 30; time full hours and 24-h full hours; "siatka kwadratowa (A1)". E4: to 100, "minuty, kwadrans,
  pół godziny", measures include "obwód". E5: to 100 full, "obwód (też odwrotny)". E6: to 1000, composite figures.
- § 3: E3.3 "Zegar — pełne godziny"; E3.5 "Kwadrat magiczny, odcinki w cm"; E3.7 "Siatka kwadratowa i kodowanie";
  E3.11 "Zegar 24-godzinny…"; E4.3 "Zegar z minutami, pół godziny, kwadrans"; E4.7 "…obwód kwadratu, prostokąta,
  trójkąta"; E5.12 "obwody, także odwrotne (bok z obwodu)"; E6.3 "…obwody figur złożonych".
- **Silent in ZADANIA (recommendations):** magic-square magnitude — keep every cell and the magic sum ≤ 30 in E3
  (3 × 3 magic square has sum 3c with centre c ≤ 10); pyramid top ≤ 30. GRID size — 5 columns A–E × 4 rows 1–4
  (kit grid is 8 × 5 at 48 px; fewer, larger cells for 8-year-olds). PERIMETER E4 sides 1–20 cm, perimeter ≤ 100;
  E5 inverse with perimeter ≤ 100 and division in the table; E6 rectilinear figures on the grid, 1 cell = 1 cm,
  perimeter ≤ ~40 (counting, not large numbers). CLOCK "set" E4 uses `minuteStep` 30/15/5 like the read skills.
- The kit's `helper-metadata.json` `grid.verticesL` is already an L-shaped lattice polygon — the same
  "vertices on grid nodes + side labels" model covers E4 rectangles/squares, E6 composite figures, and (drawn
  off-lattice, labels only) E4 triangles. So **change.md decision 2 stands** (E6.3 needs no different figure model).
- GRID items: drawn in code (circle, square, triangle, star, heart) avoids `ArtImage` and the `artFilter` case;
  nouns needed in `src/data/nouns.ts` (none of bok, pole, kratka, wskazówka, kwadrat, prostokąt, trójkąt exists today,
  checked at entry start in `nouns`).

### F. Curriculum and unlock on live saves

Current data (`src/data/curriculum/E3.ts`–`E6.ts`): E3.3 2 skills (CLOCK read/later, tiles); E3.5 1 (LENGTH ruler);
E3.7 3 (EVEN_ODD tiles + select, NUMBER_WORDS); E3.11 4 (CLOCK h24, ROMAN, CALENDAR, TEMPERATURE); E4.3 3 (CLOCK read
30/15/5); E4.7 4 (2 LENGTH, 2 CAPACITY); E5.12 and E6.3 `skills: []`.

Rule (`src/core/curriculum.ts`): `unlockReady` runs in `endRound` for normal rounds only; ready when the count of
the current step's playable skills at mastery ≥ 4 reaches `unlockThreshold(n, 0.5) = ceil(0.5·n)`; then
`unlockedStep[stage]` moves to the next playable step. Nothing lowers `unlockedStep`; mastery never drops (H-7);
`floorToCalendar` takes max(saved, calendar start). Save (`validLearner`, `src/core/save.ts`) stores
`unlockedStep: Record<StageId, number>` and skill-keyed mastery — unknown/new ids are tolerated.

| Step | skills before → after (proposal) | threshold before → after |
|---|---|---|
| E3.3 (+1 clock set) | 2 → 3 | 1 → 2 |
| E3.5 (+1 magic) / (+2 magic, pyramid) | 1 → 2 / 1 → 3 | 1 → 1 / 1 → 2 |
| E3.7 (+1 grid) / (+2 grid) | 3 → 4 / 3 → 5 | 2 → 2 / 2 → 3 |
| E3.11 (+1 clock set 24 h) | 4 → 5 | 2 → 3 |
| E4.3 (+1 clock set) | 3 → 4 | 2 → 2 |
| E4.7 (+1 / +2 perimeter) | 4 → 5 / 4 → 6 | 2 → 3 |
| E5.12 (new playable, 1–2) | 0 → 1–2 | last step of E5, never unlocks further |
| E6.3 (new playable, 1) | 0 → 1 | 1 |

Effect: a learner already past a step stays past it; a learner on the step with the old threshold already met had
unlocked at the last round end (e.g. E3.5 with the ruler at 4); a learner on the step below the threshold needs the
new skills (start at 0) — slower, nothing lost, same trade-off the S-13 plan accepted (plan text: "…co zmieni próg `ceil(0.5·n)` — akceptowane",
`context/archive/2026-10-13-drawn-widget-tasks-e3-e4/plan.md`).
E6.3 inserted between playable 1 and 4: a learner at E6.1 now unlocks to 3, not 4; saved 2/3 cannot exist.
`playableSteps` grows to E5 1–12 and E6 [1, 3–10], so `calendarStart` (k = ceil(progress · count), min
`minStartSteps`) shifts for some months; saved learners only move up. Note: PRD FR-014 says "≥4 w większości
umiejętności"; `ceil(0.5·n)` is half, not a majority, for even n — existing behaviour, not changed here.

Pinned by tests (need updates): `tests/curriculumStart.test.ts` (`playableSteps` lists, month → start step),
`tests/curriculumPick.test.ts` ("unplayable unlocked step falls back" uses E5.12/E6.3-type gaps — needs another
example), `tests/progress.test.ts` (step totals), `tests/artFilter.test.ts` (threshold values, `E4.7.capacity_litres_half`),
`tests/contentInvariants.test.ts` (per-skill `minDistinct`), `tests/e2e/drawn-tasks.spec.ts` (E3.5 round),
`tests/e2e/adaptive.spec.ts` (E4.3). `UnlockCard` shows only with a `childName` (`TaskScene.unlockView` returns null
without one) — E5.12 and E6.3 need one; E3.5, E3.7 names need extending.

### G. Design sources and gaps (profile § 6)

- `designs/martynka-maths-A-v1/style-guide.md` § "Code-drawn helpers": 4 px contours, 2 px inner grid and minor ticks,
  ivory/teal/oak, active positions distinguished by geometry as well as colour; § "Font and spacing": targets ≥ 96 px
  (≥ 48 CSS px at 1024 × 768), prompts 64 px, calculations 112 px, real `−`/`×`.
- `reference/square-grid.svg` (8 × 5, 48 px cells, lines `#9bbba9` 2 px, L polygon and 2 × 2 square, 4 px teal
  stroke) and `helper-metadata.json` `grid` (`columns 8, rows 5, cell 48, verticesL, squareCells`); `reference/clock.svg`
  + `clock` (`hour 3, minute 30, hourAngleFrom12 105, minuteAngleFrom12 180`). Screens `screenshots/task-keypad.png`,
  `task-tiles.png`.
- Absent in all six packs (maths-A-v1, evolution-v1, expansion-v1, locations-v1/v2, more-locations-v1): number cells
  (magic square, pyramid), grid coordinate labels and items on cells, side-length labels, hand handles / "set the
  clock" screen. → DESIGN-GAP rows from **73** in `docs/design-gaps.md` (format `| # | Slice | Gap | Provisional
  behaviour | Code |`, marker `// DESIGN-GAP (docs/design-gaps.md row N): …`): magic square/pyramid cells;
  grid labels + items; side lengths on edges; clock-set handles, held state and "OK" placement; grid in the 190 px
  keypad solution rect.
- Shared widgets (`src/ui/widgets/`): `ClockFace` (display only; add handles), `BlockMat`/`ActionButton` (OK pattern
  and e2e `targets()`), `Ruler`/`Thermometer`/`ClockFace` (Graphics + `textStyle` for a new labelled grid widget),
  `Keypad`, `AnswerTiles`, `TaskPicture` (dispatcher by visual kind). New `TaskVisual` kinds need cases in
  `validateVisual`, `describeVisual` and the key function in `src/core/tasks/visual.ts` (exhaustive `never`), plus
  `screenBound` in `src/core/tasks/bounds.ts` (CLOCK is in `UNBOUNDED_TYPES`).

## Code References

- `src/scenes/TaskScene.ts` `create` (pointer listeners, `pointerupoutside` → cancel), `render` (`dragKinds` call), `submit`, `feedDrag`
- `src/core/blockDrag.ts` `stepBlockDrag`, `BlockDragEvent`, `matValue`
- `src/core/round/dragLayout.ts` `dragKinds`, `dragLayout`
- `src/core/round/pictureLayout.ts` `pictureLayout`, `belowPrompt`, `clockHandAngles`
- `src/data/layout.ts` `TASK_LAYOUT.picture`, `TASK_LAYOUT.drag`, `TASK_LAYOUT.select`
- `src/ui/widgets/ClockFace.ts` `DIAL`, `ClockFace`
- `src/core/round.ts` `isCorrect`, `answer`, `captureFirstWrong`
- `src/core/round/hints.ts` `firstHint`, `leaksAnswer`, `solutionSteps`, `FIRST_HINT_EXEMPT_TYPES`
- `src/core/tasks/validate.ts` `validateTask`; `src/core/tasks/registry.ts` `generators`, `parsers`; `generateTask`
- `src/core/tasks/generators/clock.ts` `parseClockParams`, `faceDistractors`; `src/core/text/time.ts` `formatTime`
- `src/core/tasks/visual.ts` `TaskVisual`, `validateVisual`, `describeVisual`; `src/core/tasks/bounds.ts` `screenBound`, `UNBOUNDED_TYPES`
- `src/core/curriculum.ts` `unlockThreshold`, `unlockReady`, `endRound`, `playableSteps`, `calendarStart`, `floorToCalendar`, `skillBuckets`
- `src/core/save.ts` `validLearner`, `validExample`; `src/core/types.ts` `MistakeExample`
- `src/core/inputSuspend.ts`, `src/core/longPress.ts`, `src/core/roomGesture.ts`
- `src/testing/e2eHook.ts`; `tests/e2e/support/hook.ts` `buildOnMat`, `dragTouch`, `cancelTouch`; `tests/e2e/adaptive.spec.ts`

## Architecture Insights

- Every gesture is a pure core reducer fed raw pointer events by the scene; numbers live in `balance`/`layout`.
  The clock-set reducer slots into the same `feedDrag` path once the scene branches by `visual.kind`.
- Answers stay display strings or numbers so that round, hints, mistake examples and the v1 save need no new shape.
- "Solvable in its own mode" belongs in core tests over `generateTask`, not in the scene.

## Historical Context (from prior changes)

- `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/plan.md` — S-13 decision 1 split grid and clock-set into S-13b;
  threshold increase from later skills accepted — **supported**, still the rule.
- `context/archive/2026-10-14-art-tasks-all-stages/research.md` — listed E5.12/E6.3 as empty and slower unlocks as a
  PR note — **supported** (still `skills: []`).
- Audit 2026-10-14 findings S13-01…S13-09 (cited by id) — S13-01..04 and 07 **still open** on this branch (anchors in C).

## Related Research

- `context/archive/2026-10-13-drawn-widget-tasks-e3-e4/research.md`
- `context/archive/2026-10-14-art-tasks-all-stages/research.md`

## Open Questions (choices for `/10x-plan`, with recommendation)

1. E3.5 one or two PUZZLE_GRID skills (magic only → threshold 1; magic + pyramid → 2). Recommend both, one empty cell each.
2. E3.7 one or two GRID skills ("where is X" → "B3", "what is on B3" → item). Recommend two (one variant per skill,
   as CLOCK does) → threshold 3.
3. Clock-set as `visual.kind: 'clock'` with a `set` flag vs a new kind. Recommend the flag (one widget), with
   `describeVisual`/spoken text branching on it.
4. Keypad solution phase with a grid: scale to 190 px vs grow `keypadSolution`. Needs the visual gate.
5. Phaser 4 input docs were not available through context7; typings only.
