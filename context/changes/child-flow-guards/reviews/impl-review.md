<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Child-flow guards for tasks, widgets and gestures

- **Plan**: context/changes/child-flow-guards/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14
- **Date**: 2026-10-16
- **Verdict**: NEEDS ATTENTION (no critical; F1 fixed, F2-F4 deferred with triggers, F5 accepted)
- **Findings**: 0 critical, 5 warnings, 4 observations

Reviewed by the autonomous run step (`/10x-impl-review`, run `2026-10-16-audit-sweep`), with two read-only sub-reviews: plan drift and safety/patterns.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | WARNING (F2, F3: known/partial deviations) |
| Scope Discipline | PASS (EXTRA: `factFamily`/`compareNum` bounded loops, `tests/reviewGuards.test.ts`; harmless) |
| Safety & Quality | PASS (no DB, no write endpoints, no external identifiers, no new storage keys or network calls) |
| Architecture | PASS (`src/core` without Phaser; boundaries lint green) |
| Pattern Consistency | WARNING (F1 fixed) |
| Success Criteria | PASS |

## Verification observed in this step

| command | result |
|---|---|
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` | `Tests 3416 passed` = baseline 3139 + 277 (phases 1-14); after the F1 fix still 3416 (one assertion added to an existing test) |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh` | OK, OK |
| `npm run sample -- E1..E6` | `Naruszenia: 0` each |
| `npm run build` | `e2e hook: absent (2 chunks checked)` (before and after the fix) |
| `npx playwright test --workers=4` | `127 passed (10.5m)` = baseline 125 + 2 (the two new specs), no flake |
| after the F1 fix: `child-flow-guards`, `drawn-tasks`, `money-pay`, `clock-set` specs | `14 passed` |
| Same-seed content | `scripts/sample.ts <stage> --count 6` on main (`git archive main`) vs branch: E2, E4, E5, E6 identical; E1 differs only in COMPARE_QTY tile order (PIC-06), E3 only in the HALF hint (new method line first) — exactly where the plan says |
| Save format | `git diff main...HEAD -- tests/fixtures src/core/save.ts` empty; `SAVE_VERSION = 4` |
| Hooks | no change under `.claude/`, no `--no-verify` in the branch log; hooks fired on this step's edits (related-tests red on the new assertion, as intended) |

Deliberate breaks re-executed here:
- **tdd (phase 6)**: `half.ts` without `pl.tasks.halfMethodHint` → `tests/hints.test.ts` red on `E3.10.half_30 seed 0: expected null to be '2 : 2 = 1'` and `E3.10.half_30 never shows 50 of 50 first hints`; restored.
- **e2e (phase 14, break b)**: `SolutionSteps.overflowed()` returning `true` → `#11 WNA-04` red `Expected: false / Received: true`; restored. Meta-check: proves the measured flag reaches the hook, not that every skill fits.
- **F1 fix**: new assertion in `tests/gestureWiring.test.ts` red before the `TaskScene` edit, green after.

Teacher read (content changed in moneyPay, compareQty, half; the other touched generators produce byte-identical samples): HALF first hint "Połowa to jedna z dwóch równych części." is correct Polish, teaches the idea and does not give the result; COMPARE_QTY tiles "Po lewej / Tyle samo / Po prawej" read naturally in spatial order; the wallet line "Kwota się zgadza. Spróbuj zapłacić mniejszą liczbą monet." is calm, no harsh word, does not give the answer (on E2.2 the tray also has a 10 zł note, but the existing prompt already says "monet"; wording acceptance stays with [human] 5.7). E6.3 perimeter_composite and E1.11/E2.2 money pay tasks read correctly.

## Findings

### F1 — Block mat "OK" not guarded by `canSubmit`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/scenes/TaskScene.ts `create` (`new BlockMat`); src/core/trayDrag.ts `canSubmit`
- **Detail**: `canSubmit`'s doc says "a coin, block or clock hand", the wallet and the clock asked it, the block mat did not.
- **Fix**: `new BlockMat(this, (value) => { if (canSubmit(this.dragState)) this.submit(value); })` plus a wiring assertion.
- **Decision**: FIXED — 03a597e

### F2 — `modeWidgets` moved but the boolean mode checks remain

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/scenes/TaskScene.ts `render`; src/core/round/view.ts `modeWidgets`
- **Detail**: Main already had a private exhaustive `widgetsOf`; phase 13 moved it to core and uses it for tiles/keypad/select visibility, but the `view.input === '…'` checks the plan wanted replaced are still there (same count as main). No behaviour defect.
- **Fix**: Finish the replacement in the next `render` change.
  - Strength: avoids a wide scene refactor at review time with a green e2e net already observed.
  - Tradeoff: WNA-10 stays partly open.
  - Confidence: HIGH — behaviour unchanged, map is tested.
  - Blind spot: None significant.
- **Decision**: DEFERRED — follow-up with trigger in `follow-ups/review-fixes.md`

### F3 — Cell floor is a test-time check only (p10 deviation)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/core/round/drawingFit.ts `drawingFit`; src/scenes/TaskScene.ts `render` (`belowPrompt`); src/ui/widgets/NumberCells.ts, CoordGrid.ts
- **Detail**: Known deviation: no `minScale` in `TASK_LAYOUT.cells`/`coord`. `minCell` is read in one place and every skill passes over `pictureLayout` rects, but at runtime `belowPrompt(..., minHeight)` can shrink the rect under a long prompt. Judged acceptable: the floor is proven for the real layouts, the runtime squeeze needs a visual check (row 10.5).
- **Fix**: Decide at the visual gate (10.5) whether a runtime clamp is needed.
- **Decision**: DEFERRED — follow-up with trigger

### F4 — A lost `up` can hold the clock hand against another pointer

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/core/clockSet.ts `stepClockSet` (`down` branch)
- **Detail**: Another pointer's `down` is ignored while a hand is carried and "OK" is blocked. On a touch-only tablet every touch is Phaser pointer 1 and the same-pointer `down` restarts the grab (S13-09), and `pointerupoutside` now cancels with its id, so the child recovers; only mixed mouse + touch can stay held until "Do pokoju".
- **Fix**: Escape rule (e.g. another pointer's `down` far from both tips cancels) if a device report appears.
- **Decision**: DEFERRED — follow-up with trigger

### F5 — Variant's clean-round bonus lost on a close before "Dalej"

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/scenes/TaskScene.ts `submit` / `advance`; src/core/round.ts `next`
- **Detail**: The variant is recorded at its last answer (SV2-10, intended), the clean-round bonus is still paid at "Dalej". Closing in between keeps the task stars and the day's record, loses only the bonus. Before, the whole round replayed (worse: ×2 twice).
- **Fix**: Accept; revisit with the variant rules.
- **Decision**: ACCEPTED — follow-up with trigger

### F6 — ORDINAL art rule vs generator pool (OBSERVATION)

- **Severity**: OBSERVATION
- **Location**: src/core/round/artFilter.ts `artBlocked` 'ORDINAL'
- **Detail**: Blocked only below `max` loaded icons; the generator shuffles all `ICONS`, so with many missing the redraw rarely helps (stand-ins show, the task stays answerable by position).
- **Decision**: RECORDED — follow-up

### F7 — Progress preview "began" rule (OBSERVATION)

- **Severity**: OBSERVATION
- **Location**: src/core/progress.ts `progressView`
- **Detail**: Warm-up misses of the previous stage are listed; a freshly raised stage lists none. Matches the handoff decision of phase 2.
- **Decision**: RECORDED — follow-up

### F8 — `forcedSkills` keeps a cross-stage id as null (OBSERVATION)

- **Severity**: OBSERVATION
- **Location**: src/testing/e2eHook.ts `forcedSkills`
- **Detail**: Known p13 deviation, forced by parent-settings #14 (pins an E3 skill then changes stage). Unknown and unplayable ids throw. Hook build only. Accepted.
- **Decision**: ACCEPTED

### F9 — Minor leftovers (OBSERVATION)

- **Severity**: OBSERVATION
- **Location**: tests/hints.test.ts (older tests keep try/catch); src/ui/widgets/CoinWallet.ts, BalanceScale.ts (`?.show` outside the plan's four widgets); `TaskScene.snapshot` `solutionOverflow` (field name in `dist/` like every snapshot field; exposure is hook-build only); p11 test placement in existing files (accepted).
- **Decision**: RECORDED

## Reviewer rows

Ticked after checking: 1.5, 2.5, 3.5, 4.4, 5.5, 6.5, 7.5, 8.4, 9.4, 10.4, 11.4, 12.4, 13.6. Left open: 13.7 `[reviewer] (CI at ship)` — proven by workflow `CI`, job `check`: step `npm test` prints `Tests +[0-9]+ passed`, step `npm run build` prints `e2e hook: absent ([0-9]+ chunks checked)`.

MERGE: CLEAR — no open CRITICAL, every automated criterion met, all suites green (unit 3139+277, e2e 125+2); warnings fixed or followed up.
