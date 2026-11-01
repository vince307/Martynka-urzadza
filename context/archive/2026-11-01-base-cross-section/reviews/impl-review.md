<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Base cross-section, the child stays in the base after Mostek, the "Baza" button

- **Plan**: context/changes/base-cross-section/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5
- **Date**: 2026-11-01
- **Verdict**: APPROVED (after the fixes below; was REJECTED on F1 before the fix)
- **Findings**: 1 critical (fixed), 2 warnings (fixed), 3 observations

Autonomous run `2026-10-31-space-base`, step `/10x-impl-review`, branch `feat/base-cross-section` (base `9a44799`). The diff
(31 files, about 200 lines of product code) was read in the main context instead of through the skill's two subagents:
it is small enough to read whole, and the contract asks this step to verify, not inherit.

## Suites re-run by this step (vs contract baseline on `main` 9a44799: unit 4171, e2e 184)

| suite | result | arithmetic |
|---|---|---|
| `npm run lint` | OK (0 warnings) | |
| `npm run typecheck` | OK | |
| `npm test` | `Tests  4185 passed (4185)`, 227 files | 4171 + 14 (phase 1 + 3 cases) = 4185 |
| `bash deploy/test-martynka-deploy.sh`, `bash deploy/ops/test-martynka-ops.sh` | OK | |
| `npm run sample -- E1..E6` | all rc 0 | |
| `npm run build` + `npm run check:build` | OK, `e2e hook: absent (2 chunks checked)` | |
| `npx playwright test --workers=3` (sandbox off) | `169 passed`, `12 failed`, `6 did not run` (41.9 m, machine loaded: timeouts, `cdpSession.detach` after timeout) | 169 + 12 + 6 = 187 = 184 + 3 |
| `npx playwright test --last-failed --workers=1` | `18 passed (14.1m)` | 169 + 18 = 187 green |
| after the fixes: lint, typecheck, `npx vitest run` | OK, `Tests  4185 passed` | unchanged count (one guard edited, none added) |
| after the fixes: `base-cross-section` + `house-cross-section` specs, `--workers=2` | `7 passed (2.5m)` | 3 + 4, unchanged count |
| after the fixes: `npm run build` | `e2e hook: absent (2 chunks checked)` | |

Fixed checks: `git diff 9a44799 -- src/core/save.ts src/core/migrations tests/fixtures` empty (save v6); `git diff --stat 9a44799 -- public`
= only `public/assets/house/base-1-shell.webp` (81 970 B) and `base-1-cell-closed.webp` (12 308 B) added, every other asset
byte-identical; `.claude/settings.json` and `.claude/hooks/*` last modified 2026-10-10/12 (before the run), no `--no-verify` in
any commit message: no hook bypass.

## Deliberate breaks re-executed

| break | before the fix | after the fix |
|---|---|---|
| tdd p1: delete `'base-1'` from `pl.house.open` | `tests/houseCells.test.ts` red: `base-1: expected undefined to be truthy`; restored | |
| tdd p3: drop `this.scene.stop(SCENE_KEYS.house)` in `TaskScene.backToChoice` | `tests/themeBackWiring.test.ts` red: `expected -1 to be greater than -1`; restored | |
| e2e p5 (handoff named): `RoomScene.redraw` shows `pl.house.open['house-1']` | **spec test 1 stayed GREEN** (`1 passed (30.0s)`, hook build rebuilt) → F1 | test 1 red: `Expected: "Baza"` / `Received: "Dom"`; restored, green |

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS (F2 fixed) |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F1 fixed) |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS (F1 fixed: the named break now turns the spec red) |

Teacher read of `src/data/pl.ts`: `house.open` = `{ 'house-1': 'Dom', 'base-1': 'Baza' }`. "Baza" is a correct, short
nominative button label parallel to "Dom", the PRD's word (FR-048); no numerals, no inflection issue. The comment above it cites
FR-048 and the gap rows 183, 184, 199. Pass.

`[reviewer]` rows: 2.7 and 4.10 are `(CI at ship)` and stay open for the ship step. 2.7 names job `deploy` (124716473458), step
`Smoke check (deploy)`, and the line `ok   precache covers house pictures — 3 of 3 house pictures precached` seen in Deploy run
41261590741 (expected after this slice: `5 of 5`); 4.10 names job `build` (124715797789) and the lines `Tests  4168 passed | 3 skipped (4171)`
and `e2e hook: absent (2 chunks checked)` from the same run (expected after this slice: `4182 passed | 3 skipped (4185)`). Both well formed.

## Findings

### F1 — The hook's `houseLabel` did not report the drawn label, so the spec survived its named break

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: `src/scenes/RoomScene.ts` `snapshot` (`houseLabel`), `src/ui/widgets/PageButton.ts`
- **Detail**: `RoomScene.snapshot` computed `houseLabel` as a second lookup, `pl.house.open[<saved house id>]`, gated only on
  `houseButton.target()`. A bug in which label `redraw` passes to the button (the handoff's named break: fixed to
  `pl.house.open['house-1']`) left the snapshot at "Baza", and test 1 of `tests/e2e/base-cross-section.spec.ts` stayed green on a
  rebuilt hook build. The handoff's § 3 claim "test 1 red (Expected "Baza", Received "Dom")" did not reproduce. The FR-048 label
  rule was proven by a source guard only.
- **Fix**: `PageButton.text()` returns the drawn label (null while hidden, like `target()`); `RoomScene.snapshot` reports
  `houseLabel: this.houseButton.text()`; `tests/roomVisitWiring.test.ts` pins that form. Re-ran the break: red (`Expected "Baza"`,
  `Received "Dom"`), restored, green.
- **Decision**: FIXED

### F2 — Test 2 did not assert that stars keep accumulating after Mostek (FR-046, plan phase 5 contract)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `tests/e2e/base-cross-section.spec.ts` test `#16 #2 S-29 FR-046 …`
- **Detail**: The plan asked "back in the notebook a right answer raises the stars"; the spec answered right after the reload but
  asserted only the phase (handoff § 5 noted the gap).
- **Fix**: read `counterText` before `answerRight` after the reload and poll it to be greater after.
- **Decision**: FIXED

### F3 — Follow-up 8 dropped the `FIRST_ROOM` part of first-building-choice 18 and its trigger clause

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `context/changes/base-cross-section/follow-ups/review-fixes.md` item 8
- **Detail**: The archived item 18 includes the `FIRST_ROOM` fallbacks with the trigger "a second building without a salon
  reaching a `FIRST_ROOM` fallback"; the re-record kept only the `ChoiceCard` half, so a later grep for that trigger would miss it
  (the plan says it is carried, research § 5).
- **Fix**: item 8 restored with the fallbacks and the full trigger.
- **Decision**: FIXED

### F4 — `src/testing/e2eHook.ts` listed in plan phase 1 §4 but not changed

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: `src/testing/e2eHook.ts`
- **Detail**: The hook passes `room().snapshot()` through, so `houseLabel` reaches the spec without a hook edit; only
  `tests/e2e/support/hook.ts` needed the type. No drift in intent.
- **Fix**: none.
- **Decision**: ACCEPTED

### F5 — E2E load timeouts on the full run

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: full suite, `--workers=3`
- **Detail**: 12 failures + 6 not run, all timeouts in specs this slice did not touch (adaptive, stale-tab, money-pay, …), every one
  green on `--last-failed --workers=1` (18 passed). Same pattern as the S-28 ship and phase 5. The new spec passed in the loaded run.
- **Fix**: none (machine load).
- **Decision**: ACCEPTED

### F6 — Roadmap row S-29 says `planning`

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Scope Discipline
- **Location**: `context/foundation/roadmap.md` S-29
- **Detail**: The archive/ship step moves it to `done`; nothing to change here.
- **Fix**: none.
- **Decision**: ACCEPTED

MERGE: CLEAR — the one CRITICAL (spec survived its named label break) is fixed and re-proven red→green, warnings fixed, all suites green against baseline (unit 4185 = 4171 + 14, e2e 187 = 184 + 3), save v6 and art unchanged beyond the two base pictures.
