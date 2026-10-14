<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Powód nieudanego odczytu zapisu do końca ścieżki, wyjście z trwałego „unavailable” i uczciwa kopia

- **Plan**: context/changes/save-reason-and-recovery/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-10-14
- **Verdict**: APPROVED (after the fixes in `02b8f42`)
- **Findings**: 0 critical, 2 warnings (both fixed), 5 observations

Reviewed `main..HEAD` at `92cbf33` (src diff of 14 files, tests of 9), with two read-only sub-agents (plan drift; safety and patterns) and my own read of every `src/` hunk. Lessons file: absent.

## Audit ids closed at the code level

| Id | Closed by (file + symbol) | Evidence |
|---|---|---|
| SIR-01 | `src/core/autosave.ts` `replaceGate` (`unreadable` + `loadReason === 'future'` → `Blocked`, also with `force`); `AutosaveStatus.loadReason`; `src/main.ts` `start` passes `loadReason`; `src/core/saveFile.ts` `deviceSaveView` → `blocked`/`future`, `forceable: false`; dialogs `blockedText` → `deviceFuture` | unit break below; e2e "#2 SIR-01 a save from a newer version is never offered for overwrite" red under the break, green restored |
| SIR-02 | `replaceGate` (`unavailable` → ok only with `force`, never on a timeout); `saveImportDialog.ts` / `saveResetDialog.ts` `blockedStep` → "Zastąp mimo to" → second step with `forcedWarning`; `UIScene.openImport`/`openReset` `apply: (state, force) => saver.replace(state, { force })`; `failureText` → `siteDataAdvice` only for a store error | e2e "#2 SIR-02 a save the browser never gives can be replaced after a second confirmation" and "… a read that timed out offers no overwrite" green |
| SIR-03 | `src/core/saveHealth.ts` `offState` (cause `future`/`timeout`, `code` from `loadReason`/`loadError`, `lastError` only for `fatal`); `saveHealthView.ts` muted `pl.saveFailed.detail(code, …)` line; `main.ts` `start` `detail` on the `unavailable` card | `save-restart.spec.ts` C-1 (`Kod: UnknownError`), M-S4 (`saveOff.timeout`) green |
| SIR-04 | `UIScene.openExport` → `warning: pl.saveTransfer.exportNotDevice` whenever `deviceSaveView` is not a summary; `saveExportDialog.ts` `warning` | e2e "#2 SIR-04 …" (both) green |
| ASL-01 | `tests/freshRoundWiring.test.ts` (AST over `TaskScene.freshRound`: `missingIds` in `buildAdaptiveRound`, `blocked` in `buildWarmup`, `REGISTRY_KEYS.artHealth`) | phase 5 break recorded; test present and green |

Save safety: no path found that overwrites a `future` save or a timed-out read (both refused in `core`, not only hidden in the UI). A forced overwrite needs `unavailable` (not a timeout), an explicit "Zastąp mimo to" and then "Wczytaj"/"Zacznij od nowa", with focus always on "Zamknij"/"Anuluj". Save format unchanged (`SAVE_VERSION` 1, no diff in `tests/fixtures/`, `src/core/save.ts`, `SAVE_KEYS`). No hook bypass: no diff in `.claude/`, no `--no-verify` in the log.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (after F1, F2) |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Verification observed in this step

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | OK, OK (before and after the fixes) |
| `npm test` | 1927 passed = main baseline 1905 + 22 (phase deltas 10 + 4 + 2 + 2 + 4); unchanged by the fixes (new assertions inside existing tests) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh`, `npm run sample -- E1`…`E6` | OK |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` (full, on `92cbf33`) | 57 passed (4.3 min) = main baseline 52 + 5 (plan said +4: SIR-04 is two tests, warning and its absence) |
| `npx playwright test` save-transfer-blocked + save-restart + save-transfer (after `02b8f42`) | 18 passed (1.7 min) |
| Break: `replaceGate` returns `ok` for every `unreadable` (future let through) | unit: 3 red (`a future save is never replaced, even with force…`, `replaceGate covers every combination`, `a future save is blocked, never forceable`); e2e `-g SIR-01`: red, `Zastąp mimo to` count Received 1, expected 0; restored |
| Break: `unavailable` gate ignores `timeout` | unit: 3 red (`a timeout read is blocked, never forceable`, `a timeout read is never replaced…`, combination test); restored |
| Break (phase 1's green one): `replace` passes `lastError` instead of `loadError` to the gate | stays green (88/88) — judged below (O1) |
| Fix F1, test-first | 3 assertions red before the code (`TimeoutError` forceable `ok`; `deviceSaveView` cause `unavailable`; `saveHealth` cause `unavailable`), green after |

## Findings

### F1 — IndexedDB's own `TimeoutError` was forceable

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/autosave.ts `replaceGate`; src/core/saveFile.ts `deviceSaveView`; src/core/saveHealth.ts `offState`
- **Detail**: The timeout test was `loadError === 'timeout'`, the name only our read limit (`loadSave`) gives. A real IndexedDB `DOMException` named `TimeoutError` (a transaction that ran out of time, the save behind it possibly healthy) counted as a plain `unavailable`, so it was offered "Zastąp mimo to" and the "browser did not give" sentence. Not CRITICAL: an overwrite still needed two explicit taps over a text that warns progress disappears.
- **Fix**: exported `isTimeoutError(name)` (`timeout` or `TimeoutError`) used by `replaceGate`, `deviceSaveView` and `offState`, so the one-rule design holds; tests extended in `tests/autosave.test.ts` (combination), `tests/saveFile.test.ts` (view + lockstep), `tests/saveHealth.test.ts`.
- **Decision**: FIXED in `02b8f42`

### F2 — A rejected `replace` promise showed the "delete site data" advice

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/dom/saveSummaryView.ts `failureText`
- **Detail**: The plan's phase 4 contract sent a rejected promise to `siteDataAdvice`. `Autosaver.replace` catches every store error and returns it as `{ ok: false, error }`, so a rejection can only be a bug (e.g. `validateSave` throwing) — exactly the non-storage case plan-review F2 kept the destructive advice away from.
- **Fix**: `result === null` → the plain line (`applyFailed` / `resetFailed`); plan addendum records the contract change.
- **Decision**: FIXED in `02b8f42`

### O1 — Phase 1's surviving break (`lastError` for `loadError` in the gate) is unreachable

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: src/core/autosave.ts `replace`; tests/autosave.test.ts "a timeout read is never replaced, and a failed forced write does not unlock it"
- **Detail**: Re-executed: green. Agreed it is unreachable today: `lastError` starts as `loadError`; while `blockedBy` is set, `writesOff` stops every normal write, and under a timeout every `replace` is refused before writing, so `lastError` can never move away from `timeout`. The test title overclaims (no forced write can happen under a timeout); the `unavailable` half proves `loadError` stays fixed. The `saveHealth` part of the same rule is guarded (`loadError ≠ lastError` tests).
- **Fix**: none needed; the reading-`loadError` rule is documented on `AutosaveStatus.loadError`.
- **Decision**: ACCEPTED

### O2 — Escape closes an import/reset dialog while `replace` is writing

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/ui/dom/saveImportDialog.ts, src/ui/dom/saveResetDialog.ts (`busy` disables buttons only; `finish` on Escape)
- **Detail**: Pre-existing behaviour (S-12). Nothing is lost: writes are off while `replacing`, a success reloads, a failure message lands in a closed dialog.
- **Fix**: ignore Escape while `busy` — follow-up with trigger.
- **Decision**: FOLLOW-UP (`follow-ups/review-fixes.md`)

### O3 — A forced overwrite is offered after one refused read

- **Severity**: OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/core/autosave.ts `replaceGate`; `pl.saveTransfer.deviceUnavailable`
- **Detail**: The text says "Jeśli to się powtarza przy każdym uruchomieniu", but the button appears on the first `unavailable` start; a transient `AbortError`/`UnknownError` over a healthy save could be overwritten after the two taps. This is the plan's decision 2 (counter rejected), covered by `[human]` 4.7 and the existing follow-up "A counter of `unavailable` starts".
- **Fix**: none in this change.
- **Decision**: ACCEPTED (product decision, `[human]` 4.7)

### O4 — Weak `openExport` wiring test; partial design-gap revisions

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: tests/deviceSaveWiring.test.ts (openExport case); docs/design-gaps.md rows 43, 45, 49
- **Detail**: The `openExport` test checks the method text contains `saver.status()` and `exportNotDevice`, not that they are the `deviceSaveView` argument and the `warning` option (the e2e p6c break covers the behaviour). Rows 43/45/51 are revised only through row 69's "rev." note; row 49 does not name `resetFailed` (row 71 does).
- **Fix**: follow-up with trigger.
- **Decision**: FOLLOW-UP

### O5 — Small leftovers

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/main.ts `start` (`detail` fallback `''`); tests/e2e/save-transfer-blocked.spec.ts (title)
- **Detail**: the `''` branch of the card `detail` is unreachable inside the `unreadable || unavailable` block (type narrowing smell, not a bug). The e2e title "#2 an unavailable save cannot be overwritten by import or reset" became false after SIR-02; renamed to "… is not overwritten by import or reset without a second confirmation" in `02b8f42` (body unchanged, re-run green). e2e count +5 vs planned +4 (harmless).
- **Decision**: title FIXED; rest ACCEPTED

## Copy read (as a parent; `[reviewer]` rows 2.4, 3.5, 4.5, 5.5)

`saveOff.future`, `saveOff.timeout`, `deviceFuture`, `deviceTimeout`, `deviceFatal`, `deviceUnavailable`, `force`, `forcedWarning`, `siteDataAdvice`, `resetFailed`, `exportNotDevice`: calm, adult, short, correct Polish (agreement: „Zapisu … nie udało się odczytać. Zostanie zastąpiony.”; „postępy … znikną”). `timeout` does not blame the browser. Minor style only: `saveOff.future` repeats „zapis” twice; `resetFailed` „zostały bez zmian” reads fine (alternative „pozostały”). No change made. Rows 69–72 present and consistent with 47/68.

## Reviewer rows

1.5, 2.4, 3.5, 4.5, 5.5, 5.6 performed and ticked. `[visual]` 2.5, 3.6, 4.6, 5.7 and `[human]` 3.7, 4.7, 4.8, 5.8 left open.

MERGE: CLEAR — SIR-01..04 and ASL-01 closed at the code level, both warnings fixed test-first, every suite green (unit 1905 + 22, e2e 52 + 5), no open CRITICAL.
