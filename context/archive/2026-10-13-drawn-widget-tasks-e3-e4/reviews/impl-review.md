<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Zadania z rysunkami w kodzie dla E3–E4 (zegar, linijka, klocki, diagram) i tryby `select`/`drag`

- **Plan**: context/changes/drawn-widget-tasks-e3-e4/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- **Date**: 2026-10-14
- **Verdict**: APPROVED (after the fixes below; before them: REJECTED, F1 and F2)
- **Findings**: 2 critical, 5 warnings, 5 observations

Method: the full local gate and the full e2e suite were re-run by this step (Chromium launched in this session); two
subagents read the diff for plan drift and for safety/quality/patterns; the reviewer did the teacher read of
`npm run sample -- E3 --count 6`, `-- E4 --count 6` and `-- E1 --count 6` for every new/changed step. Triage was
decided in place (autonomous run, no human): every CRITICAL and every cheap WARNING fixed in commit
`fix(drawn-widget-tasks-e3-e4): poprawki z przeglądu implementacji`; the rest are follow-ups with a `Trigger:` line
in `follow-ups/review-fixes.md`.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (F4 drift fixed) |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F1, F2 fixed) |
| Architecture | PASS |
| Pattern Consistency | WARNING (F7 fixed in part; O-items are follow-ups) |
| Success Criteria | PASS (gate and e2e green after fixes) |

## Findings

### F1 — The clock face is never drawn, and the e2e spec could not see it

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/widgets/ClockFace.ts `ClockFace.render`; src/ui/widgets/TaskPicture.ts `TaskPicture.render`/`bounds`; tests/e2e/drawn-tasks.spec.ts test (a)
- **Detail**: `TaskPicture.render` calls `hide()` first (`clock.setVisible(false)`), and `ClockFace.render` never set its graphics and digits visible again (Ruler, BaseTenBlocks and BarChart do). Every CLOCK task (E3.3, E3.11, E4.3) showed only the prompt and three time tiles: confirmed by the screenshot of the failing spec (no dial). Spec (a) "a clock task shows the face" passed anyway because `TaskPicture.bounds()` returned the layout rectangle, not the widget's visibility — the p11c break hid the whole picture but never this widget alone. A spec that survives its break.
- **Fix**: `ClockFace.render` ends with `this.setVisible(true)`; each picture widget exposes `shown()` (graphics visible) and `TaskPicture.bounds()` returns the rectangle only while the drawn widget is `shown()`. Proven: with the fix reverted, `drawn-tasks.spec.ts` (a) is RED (`expect(picture).toBeTruthy()` received null, spec:33); with the fix, 5/5 green.
- **Decision**: FIXED

### F2 — Full e2e suite red: adaptive.spec times out on E4 rounds with drag builds

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Success Criteria
- **Location**: tests/e2e/support/hook.ts `buildOnMat`, `dragGesture`; tests/e2e/adaptive.spec.ts
- **Detail**: two full runs on HEAD in this step: 41 passed, 1 failed — `adaptive.spec.ts` #13 exceeded 180 s (`cdpSession.detach: Target page … closed` inside `buildOnMat` ← `playRoundRight`). E4.1 now holds `place_build_100` (`drag`), and `buildOnMat` opened a new CDP session and sent 8 touch moves per block (up to 17 blocks per task). The orchestrator's 42/42 on 93dc80f was at the edge.
- **Fix**: `buildOnMat` reuses one CDP session for the whole build (`dragOn`) with `BUILD_STEPS = 3` moves per block (still past `startDistance`); `dragTouch`/`cancelTouch` unchanged for the drag specs. Result: adaptive 37 s alone, 1.8 min under 6 workers; full suite 42 passed. Residual margin → follow-up.
  - Strength: keeps the real touch path (drag, not tap) and the per-block poll.
  - Tradeoff: 1.8 min of 3 min under load is still a thin margin.
  - Confidence: MED — two green full runs after the fix.
  - Blind spot: slower CI-like machines (e2e is local only today).
- **Decision**: FIXED (+ follow-up)

### F3 — Clock hint says the short hand is "at 3" at 3.40

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/data/pl.ts `pl.tasks.clockShortHandHint`; src/core/tasks/generators/clock.ts `generateClock`
- **Detail**: teacher read of E4.3: at 3.40, 7.40, 11.40, 12.45 the drawn hour hand is nearer the next number, but the solution step said "Krótka wskazówka jest przy 3." — it teaches the exact misreading the hand angle invites.
- **Fix**: past the full hour the step reads "Krótka wskazówka jest między 3 a 4, więc godzina to 3." (12.45 → "między 12 a 1"). New test in tests/clock.test.ts (RED before: received "Krótka wskazówka jest przy 4.", GREEN after).
- **Decision**: FIXED

### F4 — `pointerupoutside` was a drop, the plan says cancel

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/scenes/TaskScene.ts `create` (drag wiring)
- **Detail**: plan Critical Implementation Details: "`pointerupoutside` i `wasCanceled` → `cancel`". The scene mapped `pointerupoutside` through `lift()` to `up`, so a finger lifted in the letterbox removed a mat block.
- **Fix**: `pointerupoutside` → `{ type: 'cancel' }`. Not e2e-coverable (CDP touch stays on the canvas) → follow-up; the reducer rule is unit-tested.
- **Decision**: FIXED

### F5 — Millimetre ruler segments started on any millimetre

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/core/tasks/generators/length.ts `generateLength`
- **Detail**: E4.7 `length_ruler_mm_10` shifted starts were drawn at any mm (e.g. 15–38 mm): both ends read to ~3.5 CSS px per mm on a 1024 px iPad — too hard for grade 2.
- **Fix**: a shifted start is a whole centimetre on both rulers (the end is still read to the mm). tests/length.test.ts asserts `fromMm % 10 === 0` for both units (RED before: `expected 9 to be +0`, GREEN after).
- **Decision**: FIXED

### F6 — Bar labels can overlap in a 4-bar chart

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/widgets/BarChart.ts `BarChart.render`
- **Detail**: labels ("Truskawka", "Niebieski") at the chart label size are wider than the column pitch (barWidth + barGap); the `most`/`least` tiles name those labels.
- **Fix**: a label wider than `barWidth + barGap/2` is scaled down to fit. Visual proof left to the visual gate (row 6.8).
- **Decision**: FIXED (visual confirmation pending)

### F7 — Seam leftovers across phases (duplicate cap, literals, stale comments, doc mismatch)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/layout.ts `TASK_LAYOUT.drag.maxPerKind` vs src/data/balance.ts `blockDrag.maxPerKind`; src/ui/widgets/BlockMat.ts `cellScale` (1.5), radius 28; src/ui/widgets/BarChart.ts axis gap 12; src/core/round/pictureLayout.ts header ("until phases 7 and 9"); src/ui/widgets/BaseTenBlocks.ts `blockSize` doc; docs/design-gaps.md row 55 ("the mat keeps the child's build")
- **Detail**: the cap 9 lives in two files tied only by a comment; widget literals instead of `layout.ts`; two stale phase comments; row 55 describes a mat that is in fact emptied by a wrong answer (`TaskScene.submit`).
- **Fix**: test `drag mat capacity` (tests/dragLayout.test.ts) pins layout = balance; `TASK_LAYOUT.blocks.maxScale`, `TASK_LAYOUT.drag.radius`, `TASK_LAYOUT.chart.axisLabelGap`; comments rewritten; row 55 corrected. Not done: `BlockMat.fitted` still recomputes the block size instead of `blockSize` (observation).
- **Decision**: FIXED (in part)

### F8 — h24 prompt "Jak zapisać ją w zapisie 24-godzinnym?"

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (content)
- **Location**: src/data/pl.ts `pl.tasks.clockH24`, `clockH24Speak`; `lengthFromZeroHint`
- **Detail**: "zapisać … w zapisie" repeats; "zaczyna się w 0 i kończy na 4" mixes prepositions.
- **Fix**: "Która to godzina w zapisie 24-godzinnym?"; "zaczyna się na 0 i kończy na 4".
- **Decision**: FIXED

### F9 — Drag/select feel details

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/BlockMat.ts `render` (lifted block); src/ui/widgets/SelectTiles.ts (toggle on `pointerdown`)
- **Detail**: touching a mat block hides the last block of that kind, not the touched one; select tiles toggle on down without a pressed state.
- **Fix**: follow-ups (triggers: visual gate 9.7 / tablet 9.8).
- **Decision**: DEFERRED (follow-up)

### F10 — Texts recreated each render; listeners not `off`'d at shutdown

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/widgets/Ruler.ts, BarChart.ts `render`; src/scenes/TaskScene.ts `create` (raw input listeners)
- **Detail**: GC churn, no leak (Phaser clears its input emitter on shutdown).
- **Fix**: follow-up (trigger: frame drops on iPad).
- **Decision**: DEFERRED (follow-up)

### F11 — Unlock pacing for learners saved before the change

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/data/curriculum/E3.ts step 6, E4.ts steps 1 and 8; src/core/mastery.ts unlock threshold
- **Detail**: those steps gain skills, so `ceil(0.5·n)` mastered skills are needed; nothing is lost (`floorToCalendar` keeps the saved step; save v1 untouched, fixtures untouched).
- **Fix**: mention in the PR body (follow-up).
- **Decision**: ACCEPTED

### F12 — Sample seeding shows only full hours for `clock_read_half`

- **Severity**: 💬 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: scripts/sample.ts (seeds), src/core/tasks/generators/clock.ts `randomMinute`
- **Detail**: all 6 sampled half-hour tasks were full hours; 2000 draws give 994 × .00 / 1006 × .30 — a seeding artefact of `sample`, not a generator bias. The half/quarter skills do include full hours by design (follow-up for the [human] text acceptance).
- **Decision**: ACCEPTED

## Teacher read (reviewer rows)

`npm run sample -- E3 --count 6`, `-- E4 --count 6`, `-- E1 --count 6` (0 violations each), every task of E3.3, E3.4,
E3.5, E3.6, E3.7 (select), E3.11, E4.1, E4.3, E4.7, E4.8 and E1.6 (select) read:

- Numeral agreement: "Jest 1 dziesiątka." / "Są 2 dziesiątki." / "Są 3 dziesiątki." (orchestrator's fix holds); sibling
  forms checked — "1 dziesiątka i 2 jedności", "2 dziesiątki i 1 jedność", "7 dziesiątek i 6 jedności", "1 setka to 100",
  "5 setek to 500", "15 minut", "45 minut", "za 1 godzinę", "za 2 godziny", "za 3 godziny"; no "<noun> jest N" form left
  (`placeValueHundredsLine`/`TensLine` use `countNoun`; there is no ones/minutes "… jest N" template).
- Accusative after verbs: "zagłosowało na jabłko / gruszkę / konia / królika / kota / rybę / truskawkę / śliwkę",
  "na kolor żółty"; "Zbuduj z klocków liczbę 23."
- First hints teach without the result: "Najpierw spójrz na krótką wskazówkę…", "Porównaj wysokość słupków.", "Znajdź
  słupek … i zobacz, do której kreski sięga.", "Sprawdź, gdzie odcinek się zaczyna…", "Policz osobno dziesiątki i
  jedności.", "Długie klocki to dziesiątki. Policz je.", "Po południu do godziny z zegara dodaj 12." (the leak rule holds
  back a first hint with the time). Fixed: F3 (short hand between two numbers), F8 (wording).
- Distractors: clock ±1 h, ±step, swapped hands (e.g. 3.40 → 8.15), all distinct; h24 always has the "without 12" tile and
  a neighbouring afternoon hour; DATA values distinct (no ties at top/bottom); labels unique.
- Spoken text names the drawing without the answer ("Popatrz na zegar. Która godzina?").
- `childName`: "Zegar: pełne godziny", "Diagramy", "Mierzenie odcinków", "Zegar: minuty i kwadrans", "Metry, centymetry,
  milimetry" — clear for an 8-year-old.
- Save: `git diff --stat b57433c...HEAD -- src/core/save.ts tests/fixtures` empty; v1 fixtures load (unit suite).

## Triage summary

```
Fixed:     F1, F2, F3, F4, F5, F6, F7 (in part), F8   (8)
Deferred:  F9, F10 (follow-ups with Trigger:)          (2)
Accepted:  F11, F12                                    (2)
```

MERGE: CLEAR — both CRITICAL findings fixed and proven (spec (a) red on the clock bug, green with the fix; full e2e 42 passed = 37 + 5), unit 1477 = 1247 + 230, content fixes test-backed; remaining items are follow-ups with triggers and the [visual]/[human] rows.
