<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Runda zadań dotykiem z gwiazdkami, podpowiedzią i drugą próbą

- **Plan**: context/changes/task-round-stars/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11
- **Date**: 2026-10-12
- **Verdict**: APPROVED (after fixes in 0c0baf4)
- **Findings**: 0 critical, 6 warnings, 6 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (3 undocumented minor extras, recorded as F7) |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F1, F2 fixed; F9 open) |
| Success Criteria | PASS |

## Verification (observed in this review)

| Command | Result |
|---|---|
| `npm run lint` | OK (before and after fixes) |
| `npm run typecheck` | OK |
| unit (contract command) | `Tests 588 passed` before fixes = baseline 441 + 147; after 0c0baf4 `590 passed` = 441 + 149 (+2: bar gap, hook marker); deploy + ops tests OK; `sample` E1–E6 `Naruszenia: 0` |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `grep -c __martynkaE2E -r dist/` 0 in every file |
| `npx playwright test` | 4 passed = baseline 1 + 3, before and after fixes; ports 4397/4398 empty afterwards |
| Break A (phase 3 tdd + phase 11 e2e) | `next` bonus on `o !== 'retype'` (second try counts as clean): `tests/round.test.ts` 2 failed ("a second-try answer pays 1 star but costs the bonus", property test); e2e test 2 red `Expected: 0 / Received: 2` (bonusEarned). Restored, tree clean. Meta: both layers catch the rule independently |
| Break B (new pick assertion) | `generateTask` skips tiles: `pick.test.ts` red `E1.9.add_sub_10 seed=1: expected undefined to be defined`; restored |
| Break C (new hook-marker test) | property renamed in `e2eHook.ts`: marker test red; restored |
| Break D (new bar-gap test) | `bar.bottom` back to 972: red `expected 4 to be >= 16`; restored |
| Hook bypass | `.claude/settings.json` mtime 2026-10-10 (before branch), hooks dated 2026-10-12 15:29 (before the first branch commit 21:10), three hooks wired; no `--no-verify` evidence. None found |

## Reviewer rows

- 1.5 teacher read E1 (`sample -- E1 --count 6`): PASS. Tiles hold the answer, 3–4 close distractors within the range (bonds of 2 get 3 tiles), numeral agreement correct ("1 poduszkę", "4 złote", "6 złotych"). One pre-existing S-03 context bug outside this slice's steps: "kupił jeszcze 2 złote" (F10, follow-up).
- 2.5 MISSING E1/E3/E4: PASS. First line "Policz w drugą stronę: 14 − 9" teaches the inverse operation without the result; the result is on line 2. `17 − 8 = □` keeps one leaking line and so shows only "Spróbuj jeszcze raz" (FR-008, decision row 10.6).
- 5.5 `pl.round`: PASS. "Oblicz", "Brawo!", "Brawo! +1 ★", "Dalej", "Spróbuj jeszcze raz", "Następny krok", "Już wiem", "kasuj", "OK", "Runda bez błędu! +2 ★", "Wynik: N": short, kind, no numeral agreement needed (symbol ★).
- 7.5: PASS. No red colour or ✗ in `layout.ts`/widgets (mistake = gentle camera shake + warm yellow bar), no timer, `round.test.ts` property: stars never decrease.
- 10.4 seam sweep: PASS after 0c0baf4 (F1–F5).
- 9.8 `[reviewer] (CI at ship)`: left open; names job `check`, step `Run npm run build`, regex `e2e hook: absent \([0-9]+ chunks checked\)`.

## Visual findings V1–V4

- V1 (text size): partly real. Kit `.solution-line` is 42–44 px → `FONT_SIZES.solutionLine` 40 → 44. Bar text 36 px is already above the kit's 34 px (`.feedback`); raising it is a design change → follow-up.
- V2 (buttons hug the border): real. Bar bottom 972 left 4 px to the notebook's inner edge (976). Fixed: `TASK_LAYOUT.bar.bottom` 960, `tiles.top` 712, so 16 px to the tiles and to the border; new test in `tests/geometry.test.ts`.
- V3 (slashed zero): not fixable in code. The TTF has no plain-zero alternate (GSUB: aalt, case, ccmp, frac, locl, ordn, pnum, sups, tnum; glyphs `zero`, `zero.tf`), canvas text has no font-feature control, and the kit style guide explicitly approves the slashed zero. Recorded for the maintainer (follow-up, Trigger S-16).
- V4 (star covers the tile): real. `TaskScene.flyStar` now starts `ANIMATION.starStartLift` (116 px) above the tapped tile or key.
- AGENTS.md body 412 → 400 words (trimmed redundant wording, no rule removed).

## Findings

### F1 — Duplicated colour constants and off-palette literals in widgets

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/{AnswerTiles,Keypad,FeedbackBar,ActionButton,StarCounter,SolutionSteps}.ts `TEXT_COLOR`, `PRESSED`, `FIELD_BORDER`; src/scenes/TaskScene.ts `toCssColor`
- **Detail**: `TEXT_COLOR` defined 5 times plus inline, `PRESSED`/border colour in two widgets, `'#fff5df'`, `0xffffff`, `0x8fb0a8` outside `layout.ts`.
- **Fix**: `TEXT_COLOR` and `PLACEHOLDER_COLORS.pressed/tileBorder/field/fieldPlaceholder` in `src/data/layout.ts`; widgets import them.
- **Decision**: FIXED (0c0baf4)

### F2 — Dead layout keys after the BootScene rewrite

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/data/layout.ts `FONT_SIZES.title/subtitle/hint`, `TASK_LAYOUT.dotCount` (duplicated `balance.round.length`), `PLACEHOLDER_FRAME.width`
- **Detail**: Phase 10's sweep removed only `pl.bootPlaceholder`.
- **Fix**: removed the keys. `pl.title` kept (game title, needed by S-05 screens).
- **Decision**: FIXED (0c0baf4)

### F3 — Hook guard could pass blindly after a one-sided rename

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: vite/e2eHookGuard.mjs `E2E_HOOK_MARKER` vs src/testing/e2eHook.ts `installE2EHook`
- **Detail**: The marker string is written twice; renaming the property only in `e2eHook.ts` would make the production check pass while CI never builds the e2e bundle.
- **Fix**: unit test in `tests/e2eHookGuard.test.ts` asserts the hook source installs `E2E_HOOK_MARKER` (break C red).
- **Decision**: FIXED (0c0baf4)

### F4 — `buildRound` test title promised more than it checked

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/pick.test.ts `buildRound`
- **Detail**: Only checked the answer is among choices when choices exist; a tile skill without choices passed.
- **Fix**: tile skills must carry 2..tileCount choices (break B red).
- **Decision**: FIXED (0c0baf4)

### F5 — TaskScene fields not reset in `create()`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/TaskScene.ts `create`
- **Detail**: `shownIndex`, `sessionStars`, `promptTexts` survive a scene restart (S-09 will add one); the first prompt would not be drawn.
- **Fix**: reset at the top of `create()`.
- **Decision**: FIXED (0c0baf4)

### F6 — Visual findings V1, V2, V4

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/data/layout.ts `FONT_SIZES.solutionLine`, `TASK_LAYOUT.bar/tiles`, `ANIMATION.starStartLift`; src/scenes/TaskScene.ts `flyStar`
- **Detail**: see "Visual findings" above.
- **Fix**: kit-grounded token changes plus a bar-gap test (break D red).
- **Decision**: FIXED (0c0baf4); V3 and the bar size recorded in follow-ups

### F7 — Undocumented minor extras

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/core/round/hints.ts `leaksAnswer` (open-expression exception), src/core/round/prompt.ts `isExpression`, src/ui/widgets/ActionButton.ts, `RoundState.rules`
- **Detail**: Not in the plan, all tested and beneficial (the leak exception keeps "Policz w drugą stronę: 18 − 9" as a hint).
- **Fix**: recorded here as the addendum.
- **Decision**: ACCEPTED

### F8 — DESIGN-GAP row 2 had no comment in `view.ts`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/round/view.ts `roundView` case `solution`
- **Fix**: comment added; stale "boot screen" comment in vite/config.shared.mjs `buildId` corrected.
- **Decision**: FIXED (0c0baf4)

### F9 — Input mode inferred from `task.choices`; ROUNDING exemption by id prefix

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Architecture
- **Location**: src/core/round/view.ts `roundView`; src/core/round/hints.ts `firstHint`
- **Detail**: Both are safe for today's data (a 300-draw probe of every playable skill found choices on every tile task) but break silently with future skills.
- **Fix**: carry answer mode and task type on `Task` · Strength: removes both inferences · Tradeoff: touches the task model and every generator test · Confidence: MED · Blind spot: S-13 may redesign the model anyway.
- **Decision**: DEFERRED (follow-up, Trigger S-13)

### F10 — "kupił jeszcze 2 złote"

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/data/wordTemplates.ts `contexts` (`złoty`) with the buy template
- **Detail**: Pre-existing S-03 content seen in the E1 teacher read; outside the changed steps.
- **Fix**: follow-up (Trigger S-17).
- **Decision**: DEFERRED

### F11 — E2E counter assertion reads the registry, not the drawn counter

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/task-round.spec.ts `counter`; src/ui/widgets/StarCounter.ts `value`
- **Fix**: follow-up (Trigger S-05).
- **Decision**: DEFERRED

### F12 — V3 slashed zero

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: public/fonts/AtkinsonHyperlegibleNext.ttf
- **Detail**: No plain-zero alternate in the font; the kit approves the slashed zero.
- **Fix**: maintainer decision (another numeral font or renamed modified font) · Strength: matches Polish school writing · Tradeoff: leaves the kit's font, OFL renaming · Confidence: HIGH that code cannot switch it · Blind spot: whether children are confused by it at all.
- **Decision**: DEFERRED (follow-up, Trigger S-16)

MERGE: CLEAR — no CRITICAL findings; all automated criteria green (unit 441 + 149, e2e 1 + 3, build guard absent); warnings fixed in 0c0baf4; remaining rows are [visual], [human] and CI-at-ship.
