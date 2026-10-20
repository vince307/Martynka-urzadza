<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Boot limit counts only visible time, "Ups!" card with a code, no site-data advice after NewerSave

- **Plan**: context/changes/audit-boot-hidden-tab/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10
- **Date**: 2026-10-20
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings (both fixed in 5295e8a), 4 observations

Reviewed in one session (diff of 29 files, ~480 lines read in full; no subagents: the diff fits one read). Base `main` 48c2c7e, head 46bbd42, fixes 5295e8a.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | WARNING (F1, fixed) |
| Success Criteria | PASS |

## Verification observed in this review

| command | result |
|---|---|
| `npm run lint`, `npm run typecheck` | 0 / 0 |
| `npm test` + deploy scripts + `sample` E1–E6 + `npm run build` (head 46bbd42) | unit 3707 passed (baseline 3683, +24); deploy scripts OK; sample E1–E6 exit 0; build prints `e2e hook: absent (2 chunks checked)` |
| `npm test` after 5295e8a | 3710 passed (baseline 3683, +27: +24 phases, +3 review) |
| `npx playwright test --config=<abs> load-and-tab-guard error-boundary save-transfer-blocked --workers=4` | 18 passed (main 16 in these files, +2: `#15 H-1`, `#2 Z-8`; error-boundary tightened, no new test) |
| full e2e | not re-run by me (no product code changed in review); orchestrator on 46bbd42: 143 passed (baseline 141, +2) = +1 p8, +0 p9, +1 p10 |
| break e2e (H-1 RULE): `BootScene` passes `0` as hiddenMs to `bootLimitReached`/`bootLimitWait`/`bootLimitDue` | RED: `elapsedMs` expected `>= 6610`, received `3956`; restored. Meta-check: this removes the subtraction (the rule), not the visibility fake; "still loading while hidden" stays green under it by design (timers cleared on hide, A-2) and the elapsed assertion carries the proof — matches handoff D-8 |
| break unit: `skillFailure` without the `name` copy | 3 red in `tests/generateTaskFailure.test.ts` (`expected 'Error' to be 'RangeError'`); restored |
| break unit (F1 test): `bootLimitReached` ignoring hiddenMs | 2 red in `tests/bootLimits.test.ts`; restored |
| seeds / teacher read: `npm run sample -- E1..E6 --count 6` on the branch vs `src/core/tasks/{generateTask,visual}.ts` from main | all six outputs byte-identical (3098 lines); content unchanged, no task to re-read. New string `pl.settings.artCutBackground` read as a teacher: correct spelling, comma before "bo", calm, says a restart helps, no "internet" — OK |
| save format | `SAVE_VERSION` 4; `git diff main -- src/core/migrations tests/fixtures src/storage` empty; `src/core/save.ts` +6 lines (`errorCode` only) |
| hooks | `.claude/settings.json` and hooks untouched; no `--no-verify` in the branch |

## Findings

### F1 — `bootLimitReached`: unplanned, untested third copy of the visible-clock comparison

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/bootLimits.ts `bootLimitReached`; src/scenes/BootScene.ts `preload` (`arm`)
- **Detail**: Phase 1's contract named `bootLimitDue`/`bootLimitWait` with `hiddenMs`; phase 2 added `bootLimitReached` (EXTRA) for the early-fire re-check of `arm`. It repeats `wall - hiddenMs` a third time and had no unit test, so a drift between it and `bootLimitDue` (the cut guard) would show only in e2e.
- **Fix**: Unit tests pinning `bootLimitReached` and its agreement with `bootLimitDue`/`bootLimitWait` (incl. NaN); folding the three into one is a follow-up.
- **Decision**: FIXED — 5295e8a (`tests/bootLimits.test.ts` "bootLimitReached", break red, restored); fold recorded in follow-ups (F1 entry).

### F2 — Design-gap row 153 split its text across the columns

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: docs/design-gaps.md row 153
- **Detail**: "Wording by the agent;" ended the text cell and "the author may rephrase" sat in the files cell.
- **Fix**: Move the clause into the text cell.
- **Decision**: FIXED — 5295e8a.

### F3 — The refusal card takes focus while the reset/import dialog is still up

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/core/autosave.ts `replace` (now `refuseWrites`) → src/main.ts `onBlocked` → src/ui/dom/saveRefusedCard.ts `mountSaveRefusedCard` (`restart.focus()`)
- **Detail**: Seam of phase 6: `onBlocked` now fires during an open dialog; the card mounts under it (z-index 10 vs 15) and calls `restart.focus()`. Input sessions are reference-counted (`openInputSession`), so the switch is fine; only keyboard/screen-reader focus moves behind the dialog. Touch-only tablet: low risk. The Z-8 spec asserts the card `toBeVisible` with the dialog still open (Playwright does not check occlusion), so tapability after "Zamknij" is the [visual] row 6.5.
- **Fix**: Follow-up "Refusal-card focus after a dialog closes" rewritten with the exact mechanism and a trigger (the earlier text said focus is "not placed" — the code does place it).
- **Decision**: ACCEPTED — follow-up; visual gate row 6.5 checks it.

### F4 — `generateTask` failures now carry the cause's name

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/tasks/generateTask.ts `skillFailure`
- **Detail**: Every reader of `error.name` checked: `errorCode`/`errorName` (intended), `isFatalSignal` (`QUIET_REJECTIONS` applies only to promise rejections; generation is synchronous and pure generators cannot throw `AbortError`/`NotAllowedError`), `saveExport.isAbort` (not on this path), `drawUntil` (`RangeError`, no catcher by name). `main.ts` still passes `errorName(error)` to `saver.block('fatal', …)`. No caller changes behaviour.
- **Decision**: ACCEPTED — no action.

### F5 — CLAUDE.md cites the change folder, which moves at archive

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: CLAUDE.md "Boot hidden tab and error codes" sentence
- **Detail**: Points at `context/changes/audit-boot-hidden-tab/follow-ups/review-fixes.md`; earlier changes cite `context/archive/...`.
- **Fix**: Archive step rewrites the path and runs `validate-rule-files.sh` (follow-up with trigger).
- **Decision**: ACCEPTED — follow-up.

### F6 — BootScene lifecycle read (row 2.5)

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/scenes/BootScene.ts `preload` (`onVisibility`, `armSlow`, `armCut`, `cutNow`, `dropListener`)
- **Detail**: Seeded from `document.hidden` (no timer armed when hidden at start); hide opens the span and clears both timers; show acts only when a span was open, clears first, re-arms slow only in `loading` and cut only unless `over` (no double arming); the listener is removed on `Loader.Events.COMPLETE` (which `cutLoad` fires synchronously) and on `shutdown`; `cutNow` and `arm` ask the hidden-aware rule. `publish` adds rounded `hiddenMs`. No defect. Two `performance.now()` calls in one `bootLimitWait` argument list are harmless.
- **Decision**: ACCEPTED — row 2.5 ticked.

## Reviewer rows

- 2.5 lifecycle read — pass (F6).
- 3.4 teacher read of `artCutBackground` — pass.
- 7.5 CLAUDE.md sentences vs code — pass: `bootLimits.ts`, `hiddenMs`, `artCutBackground`, `artHealthLines`, `skillFailure`, `assertDrawable`, `errorCode`, `refuseWrites`, `deviceNewer` all exist; "save format stays v4" stated.

## Scope fidelity (scope.md § 2)

H-1 (visible-time limits, `hiddenMs`, background line), I-1 (`Kod:` on the card, skill id via `generateTask`/`assertDrawable`, C-1 `pictureLayout(…, task.skillId)`), Z-8 (`deviceNewer`, no `siteDataAdvice` after `NewerSave`) delivered; the rest of the audit deferred with `Trigger:` lines (15 in `follow-ups/review-fixes.md`). The `refuseWrites` call in `replace` goes beyond Z-8's literal text — recorded in the plan (Known risks, plan review F4).

MERGE: CLEAR — no open CRITICAL, every automated criterion met, suites green (unit 3683+27, changed e2e specs 18/18, orchestrator full e2e 141+2); only [visual] 3.5/5.4/6.5 and [human] 2.6 remain.
