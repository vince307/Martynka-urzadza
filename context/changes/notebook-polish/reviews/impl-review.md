<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Notebook polish (finished maths-A notebook, chunky controls, interface life, plain zero)

- **Plan**: context/changes/notebook-polish/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
- **Date**: 2026-10-23
- **Verdict**: APPROVED (after the review fix; NEEDS ATTENTION before it)
- **Findings**: 0 critical, 4 warnings (all fixed), 4 observations (1 fixed, 3 recorded as follow-ups 15 and 16)

Method: two read-only review agents (plan drift; safety, quality and patterns) plus my own reading of `chunky.ts`, `SalonBackdrop.ts`, `TaskScene.wobble/stopWobble/bounce/answerFace`, `ProgressDots`, `SummaryPanel`, and the font license. Lessons file: `context/foundation/lessons.md` is absent, so no lesson applied.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (F1 fixed) |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F2 fixed) |
| Architecture | PASS |
| Pattern Consistency | WARNING (F5, follow-up 15) |
| Success Criteria | PASS (F3, F4 fixed) |

## Suites re-run by the reviewer (this branch)

| suite | result |
|---|---|
| lint, typecheck, `npm test`, deploy scripts, `sample` E1-E6, build at review start (HEAD `6837a96`) | green; unit 3780 = baseline 3736 + 44; build `e2e hook: absent (2 chunks checked)` |
| full e2e at HEAD `6837a96`, `--workers=2` | 147 passed, 3 failed. All 3 were load timeouts: `adaptive` #13 hit the 180 s limit, and `stale-tab` #2 B-1 (two tests) reported `loading` after 5 s. The run took 44 min. |
| full e2e after the review fix, `--workers=2` | 144 passed, 3 failed. Two were load timeouts: `first-launch` #12 (canvas boundingBox at 90 s) and `stale-tab` B-1. The third was **not load**: `notebook-polish` "counter shows" read `input` `select` instead of `tiles`. That is a spec defect, see F3. |
| serial `--workers=1` re-run of `notebook-polish`, `stale-tab`, `first-launch`, `adaptive` after the F3 fix | 19 passed |
| total | `--list` gives 150 tests in 40 files = baseline 144 + 6 |
| local gate after all fixes | lint, typecheck, unit 3781 (= 3736 + 45: 44 from the branch, 1 review case), deploy scripts, `sample` E1-E6, build: all green |

## Deliberate breaks re-executed

- **tdd, phase 1.** `staggerDelays` spread over `spanMs` instead of `spanMs - itemMs`. Three cases in `tests/motionRules.test.ts` turned red with real assertions, e.g. `expected [ +0, 133, 267, 400 ] to deeply equal [ +0, 50, 100, 150 ]`. Restored, 6/6 green.
- **e2e, phase 12, break 2.** Removed the `onWake` re-capture in `TaskScene`. The test "#11 the backdrop is captured again after a purchase" turned red: `captures` expected > 1, received 1. Restored.
- **e2e, phase 12, break 1.** Moved `setValue` from `UIScene` `onStars` into the `starLanded` handler. With the skill now pinned, the test "#11 the counter shows the new total at once" turned red: expected `"1"`, received `"0"`. Restored.
- **Review fix.** Disabled the same-rect early return in `ChunkyFace.place`. The new case in `tests/motionWiring.test.ts` turned red. Restored, 8/8 green.

## Hard-limit checks

- **Save, balance and content untouched.** `git diff --stat main..HEAD` over `src/data/balance.ts`, `src/core/save.ts`, `src/core/migrations`, `src/data/curriculum`, `src/data/wordTemplates.ts`, `src/data/rooms.ts` and `tests/fixtures` is empty. Save stays v4.
- **No hook bypass.**
  - `.claude/settings.json` and `.claude/hooks/*` are unchanged since 10-12 Oct, before the run.
  - The diff adds no `eslint-disable`, `@ts-ignore`, `.skip` or `.only`.
  - The hooks fired on the review's own edits.
- **Renderer.** `SalonBackdrop.render` adds the blur only when `renderer.type === WEBGL`. No other filter use exists in `src`.
- **Wrong answers.** Nothing turns red on a wrong answer. The camera shake is gone (`motionWiring`).
- **Reduced motion.** Every new tween, timer and burst sits behind `prefersReducedMotion()`: `chunky.enter/moveTo`, `bounce`, `wobble`, `StarCounter.pop`, `ProgressDots.update`, `SummaryPanel` pops and burst, `RoomScene.celebrate`.
- **Star counter.** `onStars` sets the number synchronously. The pop only waits for `starLanded`.
- **Touch targets of 96 px or more.**
  - Tiles 136, keys 104, bar 96, "Wróć" 148 × 96.
  - HUD 104, gear 96.
  - Age buttons 190, summary buttons 128, card buttons 108.
- **Font.**
  - `make-font.py` refuses any fontTools but 4.61.1 and pins `head.modified`.
  - `OFL.txt` keeps the full license plus one modification line, and copyright ID 0 is kept.
  - The deploy smoke checks the precache for `FONT_URL`.

## Findings

### F1 — The "OK" bounce and wobble were killed by the render that follows submit

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: `src/ui/widgets/chunky.ts` `ChunkyFace.place`; `src/scenes/TaskScene.ts` `submit`
- **Detail**: Phase 7 and gaps 159/160 say a select, drag, coins or clock answer wobbles or bounces the "OK" face. The call chain is `submit` → `wobble(face)` → `render()`. `render()` reaches `SelectTiles.applyVisibility` and the `render` of `BlockMat`, `CoinWallet` and `ClockSet`, which call `ok.showCentered` → `ActionButton.place` → `ChunkyFace.place` → `reset()` → `killTweensOf(face)`. So the wobble died in the same call, and the feature was not delivered for four answer modes.
- **Fix**: `ChunkyFace.place` returns early when the rect is unchanged, so a running bounce or wobble survives the repaint. A face still sunk by a press is released, because `ActionButton.place` forgets the press and the later `pointerup` would otherwise leave the face on the lip. Guarded by a new case in `tests/motionWiring.test.ts`.
  - Strength: one place fixes all four modes.
  - Tradeoff: `place` is no longer a hard reset at the same rect; `hide()` still is.
  - Confidence: HIGH. The drawn-tasks, money-pay and clock-set e2e specs were green in the post-fix full run.
  - Blind spot: the feel of the OK wobble is for the visual gate.
- **Decision**: FIXED

### F2 — A wobble could leave a face drawn away from its tap zone (stale `restX`)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `src/scenes/TaskScene.ts` `wobble`, `stopWobble`; `src/ui/widgets/chunky.ts` `reset`
- **Detail**: `wobble` cached the rest x on the container with `setData('restX')` the first time and never refreshed it. A reused "OK" face moved to another x would sway around the old x and stop there, drawn away from its zone. Today this was latent, because the OK positions are fixed per widget. In addition, `ChunkyFace.reset` kept `face.x`, so a wobble cut by `hide()` left a 0-4 px offset, and a later `stopWobble` would set the stale x on an already-killed chain.
- **Fix**: the rest x is now read as `target.x` after `stopWobble()` and kept in `this.wobbling.rest`. `stopWobble` restores x only while the chain `isPlaying()`. `ChunkyFace.reset` restores both x and y (`baseX`).
- **Decision**: FIXED

### F3 — The phase-12 counter spec depended on a random first task

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `tests/e2e/notebook-polish.spec.ts` "#11 the counter shows the new total at once"
- **Detail**: The test asserted `input === 'tiles'` for the first E1 task of a child aged 6, but E1 also draws `select` skills (`E1.1.shapes_all`). In my second full run the draw was `select`, so the test went red for a reason unrelated to the product.
- **Fix**: the skill is pinned with `?e2eSkills=E1.1.compare_qty_10`, an E1 tiles skill. `passWelcomeAsChild` (`tests/e2e/support/welcome.ts`) gained an optional `query` that it passes on to `openWelcome`. Break 1 still turns the test red, see above.
- **Decision**: FIXED

### F4 — `tests/artLayout.test.ts` checked the pre-margin picture rects

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `tests/artLayout.test.ts` `AREAS`
- **Detail**: The rects were literal copies at x 236, widths 768 and 624. The margin fix `89b265e` narrowed the shipped areas to 690 and 546, so the art-fit cases no longer covered what ships.
- **Fix**: `AREAS` now reads `TASK_LAYOUT.picture.tiles`, `.keypadSolution.picture` and `.tilesSolution.picture`. 95/95 green on the narrower areas.
- **Decision**: FIXED

### F5 — Literals and borrowed tokens

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**:
  - `hudPill.ts` `PRESSED_FILL`
  - `TaskScene.bounce/wobble`, `StarCounter.pop` (ease names)
  - `notebook.ts` `SHADOW_STEPS`
  - `starBurst` speeds
  - `SummaryPanel` burst depth
  - `WELCOME_LAYOUT.flower.key`
  - `TASK_LAYOUT.starCounter.border`
  - `notebookGeometry().edge`
- **Detail**: Plan decision D-2 puts every number and ease in `layout.ts`. A few stayed in widgets, one token is unused, and one geometry field is computed but not drawn from. Nothing visible changes because of this.
- **Fix**: follow-up 15 (with a trigger).
- **Decision**: DEFERRED (follow-up 15)

### F6 — Stale comments and doc wording after the layout fixes

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: `src/data/layout.ts` (`expression`, `hint`, `starCounter` comments); `CLAUDE.md` "Notebook polish"; `docs/design-gaps.md` row 158
- **Detail**: Three kinds of stale wording:
  - **`layout.ts` comments.** They still cited 760, `x 226..1024` and "a butter border".
  - **`CLAUDE.md`.** It counted the gear among the `ChunkyFace` controls, but the gear is a static pill.
  - **Row 158.** It said "gradient face", but the face is flat.
- **Fix**: comments and wording corrected.
- **Decision**: FIXED

### F7 — `barSpan.keypad.x` 310 sits 4 px left of `CONTENT_LEFT`

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `src/data/layout.ts` `TASK_LAYOUT.barSpan.keypad`
- **Detail**: The margin fix did not move the bar span. It still clears the margin line (288-290).
- **Fix**: follow-up 16; the visual gate checks it.
- **Decision**: DEFERRED (follow-up 16)

### F8 — Small robustness seams

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: `starBurst.ts`, `Keypad.ts`, `WelcomeScene.backdropState`, `SalonBackdrop.render`
- **Detail**:
  - `starBurst` has no reduced-motion guard of its own.
  - `Keypad` has no `killTweensOf` on hide.
  - A JSDoc in `WelcomeScene` is misplaced.
  - The OK bounce of a correct answer is cut when the OK hides in the done phase.
  - `holder.destroy(true)` is assumed to free the filter camera.
- **Fix**: follow-up 16.
- **Decision**: DEFERRED (follow-up 16)

## Progress rows ticked by this review

- **E2E rows 4.4, 5.4, 6.4, 7.4, 8.3, 9.3, 10.4 and 11.5.** These cite the orchestrator's evidence (144 passed after p2, p4, p6, p8 and p10; 150 after p12), confirmed by my own full runs: 150 = 144 + 6, with every load timeout green when re-run serially. Row 10.4 also rests on the green p12 test that asserts `fontHealth === 'loaded'`.
- **Row 11.6 [reviewer].** Every symbol named in the CLAUDE.md block exists, v4 is stated, and rows 20, 25, 152 and 155-164 read correctly (158 after the fix).
- **Still open (13 rows).** The [visual] rows 2.4-11.7 and the [human] row 11.8 belong to the visual gate and the maintainer.

MERGE: CLEAR — no open CRITICAL; the four warnings are fixed with a red-proven guard; suites green (unit 3736 + 45, e2e 150 = 144 + 6 with load timeouts green when re-run serially); only the [visual] and [human] rows remain.
