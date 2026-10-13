---
date: 2026-10-13T00:00:00+02:00
researcher: Claude (autonomous run 2026-10-13-s12-s14, research step)
git_commit: e3fa4f81c2837e709b7711413e81b7b2268793fa
branch: feat/drawn-widget-tasks-e3-e4
repository: Martynka-urzadza
topic: "S-13 drawn-widget-tasks-e3-e4: what the code needs for code-drawn task pictures (clock, ruler, base-ten blocks, bar chart) and the select/drag answer modes in E3–E4"
tags: [research, tasks, curriculum, round, TaskScene, widgets, e2e, narrator, drag, select]
status: complete
last_updated: 2026-10-13
last_updated_by: Claude (autonomous run, research step)
---

# Research: S-13 drawn-widget-tasks-e3-e4

**Git Commit**: `e3fa4f8` · **Branch**: `feat/drawn-widget-tasks-e3-e4` · Research only, no product code changed.
Anchors are file + symbol (the run contract forbids line numbers). `docs/zrodla/` was not read. `lessons.md` in
`context/foundation/` does not exist (checked), so no lesson applies.

## Research Question

From `change.md` (`## Scope`, `## Migration expected?`, `## Autonomous decisions`) and the step prompt: how should
S-13 model and render code-drawn task pictures for CLOCK, LENGTH, PLACE_VALUE and DATA in E3–E4, enable the
`select` and `drag` answer modes, and what do the five newly playable steps (E3.3, E3.4, E3.5, E4.3, E4.7) do to
curriculum, placement, uniqueness, mastery, saves and the tests (unit + e2e)? Settle the proposed S-13b split.

## Summary

1. **`Task.visual` is `unknown` and read by nothing** (`src/core/tasks/types.ts` `Task`; no reader in `src/` found
   by grep). Recommended model: a discriminated union `TaskVisual` in `src/core/tasks/visual.ts`
   (`clock | ruler | blocks | bars`, plain numbers only), a pure `visualKey(visual)` for uniqueness, and widgets in
   `src/ui/widgets/` that take the visual plus a rect. Input mode moves onto the task (`Task.input`, filled by
   `generateTask` from `SkillDef.answer`) because `roundView` derives it from `task.choices` today.
2. **Three uniqueness checks ignore `visual`** and would reject or mis-handle a fixed prompt like "Która godzina?":
   `src/core/round/unique.ts` `distinctTasks` (key `task.prompt`), `tests/contentInvariants.test.ts` (key
   `prompt|choices`, `MIN_DISTINCT` 12, `MAX_TOP_SHARE` 0.15), and the parent preview `MistakeExample` (prompt only).
   The first two must include `visualKey`; the third stays as is (save v1, see 6).
3. **Curriculum adapts by itself** — every consumer goes through `src/core/round/pick.ts` `playable` — but data-pinned
   unit tests break (list in Detailed Findings § 3) and the calendar start, earlier bucket and unlock order shift.
   Each new step needs a `childName` or `TaskScene.unlockView` shows no card.
4. **Layout room exists**: keypad mode has a left column ≈ 770×470 (x 236–1004, y 380–848) under the prompt; tiles mode
   has a strip ≈ 1500×324 (y 376–700) between prompt and tiles — exactly the kit's `task-tiles.png` picture box
   (x 661–1261, y 356–690). Conflict: `SolutionSteps` draws solution lines in that same area today.
5. **Drag**: use a pure core reducer driven by raw pointer events (the `longPress`/`roomGesture` pattern), not Phaser's
   built-in drag — Phaser counts a cancelled touch as a drop and `Pointer.reset()` from the input switch does not
   clear its drag state (read from source, not run). E2E drives it with a CDP touch helper next to `holdTouch`.
6. **Save v1 stays v1**: `validLearner` checks shapes only; no list of steps or skill ids is stored; an old learner at
   E3.6 loads and keeps step 6 (steps 3–5 join its earlier bucket). No migration.
7. **Split settled**: keep change.md decision 1 (S-13 = picture infrastructure + CLOCK read, LENGTH, PLACE_VALUE read
   and build, DATA, `select`, `drag`; PUZZLE_GRID, GRID, PERIMETER and clock-hand dragging → S-13b). The
   infrastructure cost found here is larger than change.md assumed, so the "pull the grid back" reversal does not
   fire; `drag` is feasible and stays, as the last feature phase, with a fallback to S-13b.

## Detailed Findings

### 1. Task model, input mode, answer check

- `Task` (`src/core/tasks/types.ts`): `visual?: unknown`, `answer: number | string | number[]`, `choices?`, `check?`,
  `hint: string[]`, `speak?`, `tileRange?`. ZADANIA § 7 defines `visual?: unknown // opis rysunku`, so a typed union is
  a narrowing, not a contradiction.
- `SkillDef.answer` (`src/core/types.ts`) is already `'tiles' | 'keypad' | 'drag' | 'select'`.
- `roundView` (`src/core/round/view.ts`) sets `input: task.choices ? 'tiles' : 'keypad'`; `RoundView.input` knows only
  those two. A `select` task (it has `choices`) would render as single-tap tiles. This is follow-up "carry the mode on
  Task" (archive `2026-10-12-task-round-stars/follow-ups/review-fixes.md`, `Trigger: S-13`).
- `isCorrect` (`src/core/round.ts`) = `task.check ? task.check(input) : input === task.answer`. Strings and numbers work
  with strict equality (clock tiles with string choices are fine); arrays need `check` — the EVEN_ODD select variant
  already supplies `check` via `sameSet` (`src/core/tasks/generators/evenOdd.ts`). A drag answer (blocks on the mat)
  should submit a number (the built value), so it needs no `check`.
- `captureFirstWrong` (`src/core/round.ts`) records only number/string `given`; `validExample` (`src/core/save.ts`)
  requires number|string. **Keep array misses unrecorded** — an array `given` in a save would make `validateSave`
  reject the whole save.
- `keypadInput` (`src/core/round/keypad.ts`) submits numbers only, so a clock answer must be tiles (string choices)
  or a number (e.g. "Która godzina? → 15" for full hours).
- `TaskScene.submit(value: unknown)` already takes any value; `answerSpot` and `snapshot` need select/drag branches;
  `snapshot` returns `answer` by reference (follow-up `Trigger: S-13`: copy before drawing array answers).

**Recommended visual model** (pure, in core, no Phaser):

| kind | fields | widget | answer |
|---|---|---|---|
| `clock` | `hour` 0–23, `minute` 0–59 (step 5/15/30 per skill) | `ClockFace` | tiles, string choices `"15.00"` style |
| `ruler` | `unit: 'cm' \| 'mm'`, `maxCm`, segment `from`/`to` (in 0.5 cm or mm) | `Ruler` | keypad (number) or tiles |
| `blocks` | `hundreds`, `tens`, `ones` | `BaseTenBlocks` | keypad/tiles (read); drag (build: visual = target number only, mat starts empty) |
| `bars` | `bars: {label, value}[]`, `scaleMax`, `step` | `BarChart` | tiles/keypad |

Plus `visualKey(v): string` (stable JSON of the fields) used by `distinctTasks` and the content invariants, and a pure
layout helper (rects in 1920×1080 space, like `src/ui/widgets/geometry.ts` `tileRow`/`keypadGrid` and
`src/core/roomHit.ts` `slotBox`) so hit targets and e2e interior points come from one function.

### 2. Generators, validation, content invariants, sample

- Registry `src/core/tasks/registry.ts`: two maps, `generators[TYPE]` and `parsers[TYPE]` (parser throws `TypeError`);
  `tests/contentInvariants.test.ts` asserts identical keys. New types: CLOCK, LENGTH, PLACE_VALUE, DATA, each with
  parser + `forEachDraw` 1000-draw test (`tests/helpers.ts`, 20 seeds × 50).
- `generateTask` (`src/core/tasks/generateTask.ts`) adds number tiles only for `'tiles'` skills with a numeric answer
  and no `choices` — the natural place to also stamp `input` from `skill.answer`.
- `validateTask` (`src/core/tasks/validate.ts`) ignores `visual`; a task with a visual passes. It checks numeric range,
  negatives, choices (duplicates, answer among them; skipped for arrays), non-empty hint, noun agreement.
  **Recommend** a pure `validateVisual` (hands within 0–11/0–59, segment inside the ruler, bars ≤ scaleMax, blocks
  consistent with the answer) called from `validateTask` when `visual` is set.
- Content invariants: every skill of every stage is iterated (playable or not), so new types are covered
  automatically. Traps: (a) distinct key `prompt|choices` ignores the visual → include `visualKey`; (b) every number in
  prompt/hints must be ≤ `boundOf(skill)` unless the type is in `UNBOUNDED_TYPES` (`src/core/tasks/bounds.ts`:
  CALENDAR, ROMAN, NUMBER_WORDS) — "15.00", "45 minut" would trip CLOCK → add CLOCK to `UNBOUNDED_TYPES` (bounded
  by its own params); LENGTH, PLACE_VALUE, DATA carry `max`.
- `scripts/sample.ts` prints prompt → answer, choices, hints, spoken text, **not `visual`** → add a one-line visual
  summary (e.g. `[clock 15:00]`, `[ruler 0–12 cm, 3–8.5]`) so the teacher read sees what the child sees.
- `src/data/nouns.ts` has `klocek`, `dziesiątka`, `jedność`, `cyfra`; missing: `godzina`, `minuta`, `centymetr`,
  `metr`, `milimetr`, `setka`, `kwadrans`, and any DATA nouns (e.g. `głos`, `dziecko` — whatever the plan picks).
- No time-formatting helper exists (`src/core/text/` has formatNumber, numberWords, plural, roman). ZADANIA § 4 CLOCK
  writes "15.00" (dot) — recommend a pure `formatTime(h, m)` in `src/core/text/` using the dot. The kit caption in
  `reference/clock.svg` shows "3:30"; the catalogue (school notation) wins for player text; record the difference.

**Catalogue facts (docs/ZADANIA.md § 3, § 4, § 7)**: CLOCK — read (1 of 3) or drag hands; E3 full hours + 24-h
("15.00 to która na tarczy?"), E4 minutes by 5, half and quarter hours. LENGTH — read a drawn ruler, cm↔m, mm (E4).
PLACE_VALUE — tens/ones, build from blocks by drag, decompose 23 = 20 + 3; E3 up to 30, E4 up to 999. DATA — bar
chart/pictogram/table, most/fewest/how many more; **no number range given** (plan must fix one, e.g. values ≤ 20 in
E3) and **not in § 7 group 2** nor plan § 11 M6 (in scope via FR-023 "słupek" and change.md decision 3). DATA, GRID,
PERIMETER appear in no § 7 group. E3.4 is MASS + DATA (MASS = art → S-14), E3.5 PUZZLE_GRID + LENGTH, E4.7 CAPACITY +
LENGTH + PERIMETER — those steps become playable but partial. E4 has no DATA step. E3.11 lists 24-h CLOCK; it is
already playable (ROMAN, CALENDAR), so adding CLOCK there needs no curriculum change beyond the skill.
FR-006 (PRD) still names only tiles and keypad; no FR covers drag/select explicitly (roadmap S-13 Risk does).

### 3. Curriculum, placement, mastery after the five steps become playable

All consumers go through `playable` (`src/core/round/pick.ts`): `firstPlayableSteps`, `pickSkills`,
`playableSteps`/`calendarStart`/`skillBuckets`/`unlockReady` (`src/core/curriculum.ts`), `progressView`
(`src/core/progress.ts`). Playable steps go E3 [1,2,6,7,8,9,10,11] → [1..11], E4 [1,2,4,5,6,8] → [1..8] (assuming each
new step gets at least one tiles/keypad/select/drag skill that `playable` accepts).

- **(a) `calendarStart`** (rule D: `k = min(n, max(minStartSteps, ceil(progress·n)))`), for an 8-year-old
  (`src/data/placement.ts`: E3 in autumn, E4 in spring), computed by the worker and spot-checked for October:

  | Stage | Sep | Oct | Nov | Dec | Jan | Feb | Mar | Apr | May | Jun+ |
  |---|---|---|---|---|---|---|---|---|---|---|
  | E3 now → after | 2→2 | 6→4 | 7→6 | 9→8 | 11→10 | 11 | 11 | 11 | 11 | 11 |
  | E4 now → after | 2 | 2 | 2 | 2 | 2 | 2→2 | 2→3 | 4→4 | 6→6 | 8→8 |

  A stage behind the calendar stage starts at its last playable step (11 for E3), unchanged.
- **(b) earlier bucket** (`skillBuckets`): a learner at E3 step ≥ 6 now draws steps 3–5 (CLOCK, DATA, LENGTH) in the
  30 % earlier share (50 % while eased) without having had them as current. Accept: they are easy reading tasks and
  mastery starts at 0 (no unlock pressure). The plan may note it as a known effect, not a bug.
- **(c) unlock** (`unlockReady` = next playable step): E3 2→6 becomes 2→3; E4 2→4 becomes 2→3, 6→8 becomes 6→7.
  `src/core/mastery.ts` rule unchanged. `TaskScene.unlockView` returns null without `childName` → the five steps need
  child-facing names (teacher read).
- **(d) warm-up** (`buildWarmup` in `src/core/round/warmup.ts`): current-stage half uses `firstPlayableSteps(stage,2)`
  = steps 1–2 for E3 and E4, unchanged; the E4 warm-up's previous-stage half (all E3 playable skills) now includes
  CLOCK/DATA/LENGTH. `warmupResult` unchanged.

### 4. Tests that depend on today's step order (to update in the plan)

Unit (vitest), per worker read of each file:
- `tests/curriculumStart.test.ts`: "lists the steps with at least one playable skill" (E3/E4 arrays), the `ORACLE` rows
  for E3/E4, `startLearning` expecting `unlockedStep.E3` = 6 (becomes 4).
- `tests/curriculumPick.test.ts`: "E3 step 6 … earlier = playable steps 1-2" (becomes 1–5); "an unplayable unlocked
  step falls back…" uses E3 step 4 → move to a step that stays empty (E2.2, E2.8, E1.1, E1.8, E1.10, E5.5, E6.2 remain
  `skills: []`, checked by grep).
- `tests/curriculumEnd.test.ts`: "next playable step 8, 7 has none" (→ 7), "E3 step 2 leads to step 6" (→ 3),
  "an unplayable unlocked step is judged by…" (E3 at 4).
- `tests/progress.test.ts`: "E3 has 8, step 11 is the 8th", "starts at 1 of 8" (→ 11), "an unplayable unlocked step (4)".
- `tests/pick.test.ts`: "never returns 'select' or 'drag' skills" and the eligible filter hardcoding tiles/keypad.
- `tests/roundView.test.ts`: `input` pinned to tiles/keypad.
- `tests/save.test.ts` / fixture `tests/fixtures/save-v1.json`: learner E3 `unlockedStep` 3 with `pendingUnlock {E3, 3}`
  — still valid; after S-13 step 3 is real and its card would show. The fixture file must not change (one-way door).

E2E (`tests/e2e/`):
- `support/hook.ts`: `Snapshot.input` is `'tiles' | 'keypad'`; `answerRight`/`answerWrong`/`playTaskRight` know only
  tiles (value equality) and keypad (number). `passWelcome` (age 10 + parent E3 = behind → step 11, earlier 1–10)
  means `task-round`, `narrator`, `parent-settings`, `save-restart`, `save-transfer`, `error-boundary` will draw CLOCK,
  DATA, LENGTH and (once playable) select tasks at random → the helpers must learn every new input mode
  (select: tap the correct set + OK; drag: build via the hook's interior points) before any new mode becomes playable.
- `first-launch.spec.ts`: age 8 in October now starts at E3 step 4 (DATA) after the warm-up.
- `adaptive.spec.ts`: E4 in September, start step 2 holds; next unlock becomes 3 (CLOCK); `expectedName` is read
  dynamically, so it needs E4.3 `childName`.
- `playwright.config.ts`: new specs must match the `ROUND_SPEC` regex to run on the hook build (port 4397).

### 5. Task screen layout and widgets

- `TaskScene` (`src/scenes/TaskScene.ts`): widgets built once in `create`; `render` redraws the prompt only on index
  change; `hideTaskLayer` hides every task-layer object (a picture widget must join it); `drawPrompt` has three forms
  (bare expression, sentence with `□`, plain sentence at `TASK_LAYOUT.prompt` for tiles or `promptBeside` for keypad);
  `promptBottom` feeds `SolutionSteps.show`.
- `TASK_LAYOUT` (`src/data/layout.ts`): notebook inner x 196–1724, y 220–976; prompt (960,290) w 1300; promptBeside
  (620,290) w 800; tiles top 712, 254×136; keypad left 1040, top 342 (x 1040–1556); bar y 864–960.
- Picture areas: keypad mode → left column ≈ x 236–1004, y 380–848 (the empty area of kit `task-keypad.png`; style
  guide "Keep prompts and pictures visible while the keypad is used"); tiles mode → strip y ≈ 376–700 (kit
  `task-tiles.png` `.pictures` box x 661–1261, y 356–690). A 300 px clock card fits both.
- **Conflict**: `SolutionSteps` writes solution lines under the prompt, in the picture area. Recommend: with a visual,
  solution lines go beside the picture (tiles mode: right part of the strip; keypad mode: under a shrunk picture) —
  the plan must choose; kit `solution-step-2.png` places steps under the expression in the left column.
- Hint on the drawing: kit `hint-tiles.png` / `screen.css` `.cup.counted` highlight the counted objects (leaf
  `#e5f2d1`, 4 px `#547e3d` border, numbered badge). Precedent for a `highlight` field in the round view (e.g. hour
  hand, segment ends, a block column). Optional for S-13; text hints suffice without it.
- Widget pattern (`src/ui/widgets/*`): `constructor(scene, ...callbacks)`, long-lived Graphics, `render(view)` clears
  and redraws, `setVisible`, `targets()` in scene space; taps via `scene.add.zone(...).setInteractive()`; colours from
  `PLACEHOLDER_COLORS`/`*_LAYOUT`. Pure-view precedents: `roundView`, `summaryView`, `stepPanel`, `roomHit`.
- Kit geometry (`designs/martynka-maths-A-v1/reference/`, read-only): `clock.svg` card 500×420, rim r150, face r138,
  4 px teal stroke, 60 ticks (5-min 4 px, minute 2 px), numerals 28 px, hour hand 78/10 px teal, minute hand 106/7 px
  `#54BEB4`, hub r10; `ruler.svg` 704×200, body 658×104 butter `#F1CE6B`, 1 cm = 56 px, cm ticks 34 px/4 px, half-cm
  20 px/2 px, no measured-segment reference; `base-ten.svg` flat 180×180 `#d9edd3` with 18 px cells, rod 22×180
  `#a6ddd2`, unit 22×22 butter, 4 px teal outline; `helper-metadata.json` (stroke 4, grid 2, clock 3:30, ruler
  0–10 cm step 0.5). **Not in the kit**: bar chart, multi-select view, drag tray/mat, measured segment on the ruler.
  Closest select reference: `screen.css` `.answer.selected` (bg `#d7ebc1`, border `#547e3d`, ✓).
- `docs/design-gaps.md`: highest row 51; S-13 rows start at 52. Row 7 (no `select` view) is closed/revised by S-13.

### 6. Saves (one-way door)

- `validLearner` (`src/core/save.ts`) checks shapes only (`unlockedStep`, `mastery`, `streak` = records of counts,
  `pendingUnlock {stage, step}`); no step or skill list is stored. `floorToCalendar` (`src/core/curriculum.ts`, called
  from `src/main.ts` on load) only raises steps: no E3 save is raised by the new floors; an E4 save at step 2 loaded in
  March rises to 3 (expected effect of rule D).
- An old learner at E3.6 keeps step 6; steps 3–5 are never "current" for it (they enter the earlier bucket). Sane.
- No migration. `SAVE_VERSION` stays 1; fixtures `tests/fixtures/save-v1*.json` untouched. Drag/select state is
  session-only. `MistakeExample` keeps `prompt` + `given` (number|string): a parent preview of a clock miss shows
  "Która godzina?" without the face — accept and record a DESIGN-GAP/follow-up rather than extend the save.

### 7. Drag on the Phaser canvas (touch) and e2e

- Phaser 4.2.1 (`node_modules/phaser`) has `setInteractive({draggable})`, `input.setDraggable`,
  `dragDistanceThreshold`, `dropZone`, `DRAG_START` (types `phaser.d.ts`); no input changes in the v4 changelog
  (context7 had no v4-specific input pages; checked against 4.2.1 source).
- Built-in drag pitfalls (from `InputPlugin.js` source, not run): touch cancel runs `processDragUpEvent` → emits `drop`
  over a zone (a system gesture would place a block); `Pointer.reset()` (used by the input switch in `src/main.ts`
  via `createInputSuspender` release) does not clear `InputPlugin` drag state; `pointerout` fires on touch lift.
- **Recommendation**: pure reducer `src/core/blockDrag.ts` (idle → carrying `{pointerId, kind, x, y}` → dropped on mat
  | returned; events `down/move/up/cancel/reset`; second finger cancels like `longPress`; start threshold in
  `balance.ts`), pure hit helpers `trayAt`/`matAt` + interior points like `roomHit.holdPoint`; scene wiring as in
  `RoomScene.create`/`update` (scene-wide `pointermove`/`pointerup`, `wasCanceled` → cancel, `cancel` while
  `inputSuspend` is held, reset on sleep/wake). "Take back" = drag a block off the mat (or tap it) — cheap with the
  same reducer; addresses change.md decision 2's reversal risk.
- E2E: `playwright.config.ts` uses Desktop Chrome 1280×720 `hasTouch: true`; `tests/e2e/support/hook.ts` `toPage`
  maps scene → page via the canvas box, `tapScene` uses `page.touchscreen.tap`, `holdTouch` sends CDP
  `Input.dispatchTouchEvent`. Add `dragTouch(page, from, to, steps)` beside `holdTouch`; hook targets
  (`src/testing/e2eHook.ts` `targets`) gain `trayBlocks`, `mat`, `selectOk`, select tiles; snapshot gains `visual`
  kind, selected set, mat contents. No new URL seam is needed, so no new marker in `vite/e2eHookGuard.mjs`.

### 8. Narrator

- `spokenTask` (`src/core/narration/spoken.ts`) reads `task.speak ?? task.prompt` (prefix "Oblicz." for bare
  expressions); never reads `choices` or `visual`. A visual task's prompt ("Która godzina pokazuje zegar?") is safe as
  long as the time lives only in `visual`/`answer`. Recommend: optional `speak` that names the picture without the
  answer ("Popatrz na zegar. Która godzina?").
- `firstHint` (`src/core/round/hints.ts`) suppresses a first hint that leaks the answer only via `leaksAnswer`
  (numeric); string answers such as "15.00" are not checked → extend the leak check to string answers (or make the
  CLOCK hints never contain the time; the content invariant "last hint contains a numeric answer" must accept the
  string form for CLOCK).

## Code References

- `src/core/tasks/types.ts` `Task` — `visual?: unknown`, answer union
- `src/core/types.ts` `SkillDef.answer`, `StepDef.childName`
- `src/core/round/view.ts` `roundView` — `input` from `task.choices`
- `src/core/round/pick.ts` `playable`, `firstPlayableSteps`, `pickSkills`
- `src/core/round/unique.ts` `distinctTasks` — prompt-only key
- `src/core/round.ts` `isCorrect`, `captureFirstWrong`
- `src/core/curriculum.ts` `playableSteps`, `calendarStart`, `skillBuckets`, `unlockReady`, `floorToCalendar`
- `src/core/round/warmup.ts` `buildWarmup`
- `src/core/save.ts` `validLearner`, `validExample`
- `src/core/tasks/{registry,generateTask,validate,bounds}.ts`; `src/core/tasks/generators/evenOdd.ts` (select variant)
- `src/core/narration/spoken.ts` `spokenTask`; `src/core/round/hints.ts` `firstHint`
- `src/core/longPress.ts`, `src/core/roomGesture.ts`, `src/core/roomHit.ts` `holdPoint`; `src/core/inputSuspend.ts`
- `src/scenes/TaskScene.ts` `create`, `render`, `hideTaskLayer`, `drawPrompt`, `promptBottom`, `unlockView`,
  `submit`, `answerSpot`, `snapshot`, `targets`; `src/data/layout.ts` `TASK_LAYOUT`
- `src/ui/widgets/SolutionSteps.ts`, `FeedbackBar.ts`, `AnswerTiles.ts`, `geometry.ts`
- `src/testing/e2eHook.ts` `installE2EHook`; `tests/e2e/support/hook.ts` `toPage`, `tapScene`, `holdTouch`,
  `answerRight`, `answerWrong`; `playwright.config.ts` `ROUND_SPEC`
- `tests/contentInvariants.test.ts` (distinct key, `MIN_DISTINCT`, `MAX_TOP_SHARE`); `tests/helpers.ts` `forEachDraw`
- `scripts/sample.ts` (no visual output); `src/data/nouns.ts`

## Architecture Insights

- The house pattern for anything gesture-like is a pure reducer in `src/core` fed with raw pointer events by the
  scene, plus pure geometry shared by drawing, hit-testing and e2e interior points. `select` (toggle set + OK) and
  `drag` fit the same shape and become vitest-testable before any scene work.
- One filter (`playable`) gates every curriculum consumer; widening it to `select`/`drag` is a single-line change
  whose blast radius is the e2e answer helpers, not the core.
- Identity of a task is currently "its prompt"; visual tasks make identity = prompt + `visualKey`.

## Historical Context (from prior changes)

- `context/archive/2026-10-12-generators-e3-e4/plan.md` — group 2–3 types allowed "no generator" and drawn types
  deferred to S-13/S-14; EVEN_ODD select built in the generator with UI deferred (supported, still true).
- `context/archive/2026-10-12-task-round-stars/follow-ups/review-fixes.md` — three `Trigger: S-13` items (select/drag
  UI, input mode on Task, snapshot answer copy): all still open and confirmed by the code above.
- `context/archive/2026-10-12-generators-remaining-stages/follow-ups/review-fixes.md` — BONDS pairs / CHOOSE_OP
  picture `Trigger: S-13`: out of scope, re-trigger to S-13b/S-14 at archive.
- `context/archive/2026-10-13-variant-change-room-done/` — hold gesture as a core reducer + e2e `holdTouch`: the model
  for `drag`.

## Related Research

- `context/archive/2026-10-12-generators-e3-e4/research.md`

## Autonomous decisions (research step)

1. **Split kept (S-13b confirmed).** Chosen: S-13 = picture infrastructure (`TaskVisual`, `visualKey`, `Task.input`,
   picture area, uniqueness/invariants/sample updates, e2e helpers) + CLOCK read (E3.3, E3.11, E4.3), LENGTH (E3.5,
   E4.7), PLACE_VALUE read (E3.6, E4.1, E4.8) and build by `drag`, DATA (E3.4), `select` (E1.6, E3.7). Rejected:
   pulling grid + PERIMETER back (the infrastructure found here — two uniqueness keys, input mode, solution-line
   conflict, five data-pinned test files, e2e answer helpers — adds ~1–2 phases on top of change.md's estimate);
   moving `drag` out (a reducer + CDP helper mirrors existing `longPress`/`holdTouch`, so it is not risky). Reverses
   if: the plan exceeds ~9 phases → `drag` (PLACE_VALUE build) moves to S-13b first; or the plan finds a phase budget
   left after `drag` → nothing pulled back in this slice anyway (grid is a separate widget family).
2. **Custom drag reducer over Phaser built-in drag.** Why: touch-cancel = drop and stale drag state after the input
   switch (source reading). Reverses if a runtime check shows Phaser clears drag state on `Pointer.reset()` and the
   cancel path can be intercepted cheaply.
3. **CLOCK answers as tiles with string times ("15.00")**, keypad only for full-hour numbers. Reverses if the teacher
   read prefers word forms ("piętnasta").
4. **No save change**; parent preview of visual misses stays prompt-only (DESIGN-GAP/follow-up). Reverses if the
   maintainer wants the visual in the preview — that would need a save field and therefore a v2 migration.
5. **Ordering rule for the plan**: e2e answer helpers learn a mode before `playable` admits it (otherwise random draws
   break six existing specs). Not reversible by preference — a correctness constraint.

## Open Questions

- DATA value range and labels (catalogue gives none) — the plan picks one (recommend ≤ 20, 3–5 bars, labels from
  existing dictionary nouns/names) and records it.
- Where solution lines go when a picture is shown (beside vs under) — plan + DESIGN-GAP.
- Whether to add an on-picture hint highlight in S-13 or leave text hints (kit precedent exists; optional).
- Runtime confirmation of the Phaser drag pitfalls was not done (Chromium cannot start in the sandbox); not blocking
  because the recommendation does not use built-in drag.
