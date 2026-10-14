# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The impl-review step of run `2026-10-14-save-s13b-s15-s14b` wrote this file. The verdict is `MERGE: CLEAR`, and two warnings were fixed in `02b8f42`. The next agent must not get this wrong: the `[visual]` rows (2.5, 3.6, 4.6, 5.7) are the visual gate's job, and the `[human]` rows stay open for the maintainer.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 20 commits `ef8f950`..HEAD; this step added `02b8f42` (fix) + the review docs commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` |
| `## Progress` rows remaining | 8 (`[visual]` 2.5, 3.6, 4.6, 5.7; `[human]` 3.7, 4.7, 4.8, 5.8) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` (`isTimeoutError`, `replaceGate`) | F1: IndexedDB `TimeoutError` treated like the read limit's `timeout` (never forceable) |
| `src/core/saveFile.ts` (`deviceSaveView`), `src/core/saveHealth.ts` (`offState`) | the same `isTimeoutError` rule for the cause |
| `src/ui/dom/saveSummaryView.ts` (`failureText`) | F2: a rejected `replace` promise gets the plain line, never `siteDataAdvice` |
| `tests/autosave.test.ts`, `tests/saveFile.test.ts`, `tests/saveHealth.test.ts` | `TimeoutError` cases (red first, then green) |
| `tests/e2e/save-transfer-blocked.spec.ts` | title of the first test made true ("… without a second confirmation") |
| `context/changes/save-reason-and-recovery/reviews/impl-review.md` | review report, ends `MERGE: CLEAR` |
| `context/changes/save-reason-and-recovery/plan.md` | reviewer rows 1.5, 2.4, 3.5, 4.5, 5.5, 5.6 ticked; addendum for F1/F2 |
| `context/changes/save-reason-and-recovery/follow-ups/review-fixes.md` | two new items (O2, O4) with `Trigger:` |
| `context/changes/save-reason-and-recovery/e2e-break-p6a.patch` | regenerated so it applies on the new HEAD (same break) |
| `context/changes/save-reason-and-recovery/change.md` | status `impl_reviewed` |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| lint / typecheck | OK / OK, before and after the fix |
| `npm test` | 1927 passed = main baseline 1905 + 22; unchanged after the fix (assertions added inside existing tests) |
| deploy scripts, `sample` E1-E6 | OK |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` full, on `92cbf33` | 57 passed (4.3 min) = baseline 52 + 5 |
| save-transfer-blocked + save-restart + save-transfer, after `02b8f42` | 18 passed |
| Break: `replaceGate` lets `future` through | 3 unit tests red; e2e `-g SIR-01` red (`Zastąp mimo to` count 1, expected 0); restored. Meta: proves the refusal in `core` and in the browser dialog |
| Break: `unavailable` gate ignores `timeout` | 3 unit tests red; restored |
| Break: gate reads `lastError` (phase 1's green break) | green; judged unreachable (impl-review O1) |
| F1 test-first | 3 assertions red before `isTimeoutError`, green after |
| Patches p6a/b/c | `git apply --check` OK on HEAD |
| Servers 4397/4398 | none listening after the runs |

## 4. Next command

visual gate

## 5. Open

- `[visual]` 2.5, 3.6, 4.6, 5.7: screenshots at 1440 and 1024 (`?e2eSave=unavailable|hang|unreadable|corrupt`, healthy export).
- `[human]` checklist:
  - 3.7: `future` is never overwritten.
  - 4.7: a forced overwrite after the second confirmation. Note impl-review O3: the button already shows on the first `unavailable` start.
  - 4.8: `siteDataAdvice` checked on an iPad and on Android.
  - 5.8: the N-7 iPad cold-read measurement.
- Follow-ups in `follow-ups/review-fixes.md`, new from this step:
  - Escape while `busy` in `saveImportDialog.ts` / `saveResetDialog.ts`.
  - The weak `openExport` wiring test, and design-gap rows 43/45/49.
- DESIGN-GAPs 69-72 (implement phases). This step added none.

## 6. Autonomous decisions

1. **F1 fixed rather than deferred.** Chosen: `isTimeoutError` shared by `replaceGate`, `deviceSaveView` and `offState`. Rejected: an allow-list of forceable error names. Why: the fix is cheap, keeps the one-rule design, and errs toward not overwriting. Would change if the maintainer wants force restricted to named errors such as `UnknownError` and `InvalidStateError`.
2. **F2 changes the plan's phase 4 contract** (a rejection no longer gives `siteDataAdvice`). Recorded in the plan addendum. Why: `replace` catches every store error, so a rejection is never storage, and the advice destroys the save. Would change if `replace` ever let a store error escape as a rejection.
3. **O3 (force after one refused read) accepted**, not fixed. Why: it is the plan's decision 2 and is covered by `[human]` 4.7 and the counter follow-up. Would change if the maintainer rejects 4.7.
4. **Copy unchanged.** The repeated „zapis” in `saveOff.future` and „zostały” in `resetFailed` are style, not errors. Would change on the maintainer's read.
5. **No `AskUserQuestion`.** Triage was decided in place, following the step prompt.
