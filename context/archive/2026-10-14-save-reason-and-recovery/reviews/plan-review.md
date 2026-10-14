<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Powód nieudanego odczytu zapisu do końca ścieżki, wyjście z trwałego „unavailable” i uczciwa kopia

- **Plan**: context/changes/save-reason-and-recovery/plan.md
- **Mode**: Deep (claims checked directly against the code at `c1177ce`, no sub-agent: the risky claims were few and local)
- **Date**: 2026-10-14
- **Verdict**: SOUND (after the fixes below)
- **Findings**: 0 critical, 2 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F2, F3) |
| Plan Completeness | WARNING (F1) |

## Grounding

Paths 18/18 ✓ (`src/core/{autosave,saveFile,saveHealth}.ts`, `src/ui/dom/{saveHealthView,saveImportDialog,saveResetDialog,saveExportDialog}.ts`, `src/testing/e2eHook.ts`, `tests/{autosave,saveFile,saveHealth,saveKeys,e2eSave,e2eHookGuard,deviceSaveWiring,dialogSessions}.test.ts`, `tests/e2e/{save-transfer-blocked,save-restart}.spec.ts`); symbols ✓ (`Autosaver.replace` refuses `fatal`/`unavailable` only, `AutosaveStatus.replace`, `createAutosaver` `lastError = options.loadError`, `stateOf`, `deviceSaveView` called only from `UIScene.openImport`/`openReset` and `tests/saveFile.test.ts`, `blockedStep`/`stepOne`/`stepTwo`, `E2E_SAVE_SEAMS`, `e2eSaveStore` v99, `main.ts` `start` `detail` only when `reason !== null`, `TaskScene.freshRound` `missingIds`/`blocked`, `typescript` already used by AST tests); brief↔plan ✓.

## Checks the step prompt asked for

- **Phase greenness incl. full e2e.** Phase 1: `main.ts` does not pass `loadReason` yet, `UIScene` calls `replace(state)` without `force`, every dialog still renders `blocked` with one sentence → browser unchanged. Phase 2: `?e2eSave=hang` now shows `saveOff.timeout`, but M-S4 never opens the panel and C-1 matches `saveOff.unavailable` (unchanged) by `getByText` on its own element → green. Phase 3: `?e2eSave=unreadable` (v99 = `future`) becomes non-overwritable; the only spec relying on overwrite under it ("#2 an unreadable save warns…") moves to `?e2eSave=corrupt` in the same phase; FR-021 test in `save-restart.spec.ts` touches only the start card → green. Phase 4: `deviceUnavailable` text changes but specs use the key; the existing "#2 an unavailable save cannot be overwritten…" asserts absence of `choose`/`resetConfirm`/`now` in the first step, which still holds (the force button is a new name) → green. Phase 5: no browser-visible change except the export line. Phase 6 adds +4.
- **Drivers.** 1 and 2 `tdd` (new pure behaviour: `replaceGate`, `loadReason`, `stateOf` causes and `code`, none implemented) — right. 3, 4, 5 `impl` (glue, DOM, AST test for existing wiring) — right. 6 `e2e`, risk #2, after the seam sweep in 5, features built in 1–5, E2E=on — right. No change.
- **Sizing.** Each phase touches 3–6 files around one concern; fits one fresh agent. No split/merge.
- **Product decisions vs PRD.** `future` refusal: PRD guardrail „Postęp nigdy nie ginie” and FR-021 favour it; FR-022 says nothing about a newer device save; a `[human]` row exists (3.7). Forced overwrite of an unread `unavailable` save after a second confirmation: the run contract's SIR-02 scope names „an explicit second confirmation” as an acceptable way out; the text warns that progress disappears and `timeout` is excluded; it partly reverses decision 6.7 of art-stand-in-and-load-signal and a `[human]` row says so (4.7). Neither is clearly wrong → not overturned.
- **Triggered follow-ups.** SIR-03 (N-7 text part, S12-10), SIR-04 (S12-04), SIR-05, SIR-06, S12-06 and the `future` part of "Import or reset over an unreadable save (impl-review F1)" are included. N-7 measurement deferred to a `[human]` row (cannot be done by an agent). "Import from the welcome screen" trigger not met. The two-tabs/v2 items belong to S-15. S12-03, S12-05, S12-11 were deferred with triggers this very change meets → F1 (fixed).

## Findings

### F1 — Three deferred follow-ups keep triggers this change already meets

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 5 §4 Follow-upy
- **Detail**: S12-03 and S12-11 were re-deferred with `Trigger: the next change to saveHealth.ts stateOf`, S12-05 with `Trigger: the next change to UIScene.openImport/openReset`. Phase 2 rewrites `stateOf`, phase 1 changes `replace`, phases 1 and 4 change `openImport`/`openReset`: the triggers are spent by this change — exactly the SIR-07 pattern the audit flagged. Code check: S12-03 is invisible today because both dialogs call `reload()` right after a successful `replace` (`saveResetDialog.ts`, `saveImportDialog.ts` `stepTwo`); S12-11 shows `off` anyway while blocked; S12-05's `broken` needs `validateSave` to reject the in-memory session. Deferral is justified, the triggers were not.
- **Fix**: New concrete triggers written into phase 5 §4 (a replace path without reload / S-15 import outside the dialog; S-15 v2 writing through replace or a "failing" report after import; a `broken` view seen anywhere).
- **Decision**: FIXED (plan.md phase 5 §4)

### F2 — „Usuń dane strony” could be shown for a non-storage refusal

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 §1 Contract; Phase 6 break p6b
- **Detail**: The plan said "porażka wymuszonego zapisu → `siteDataAdvice`". `replace` also returns `Busy`, `Blocked` and `InvalidSave` without touching the store (`Autosaver.replace`). Advising a parent to delete site data (which destroys the save) on a bug or a double tap is destructive advice for a non-storage cause.
- **Fix**: `siteDataAdvice` only for a store error (error outside `Busy`/`Blocked`/`InvalidSave`, or a rejected promise); the others show `applyFailed`/`resetFailed`. Phase 6 p6b expectation updated: without `force` the reset shows `resetFailed` and no reload, so (b) still turns red.
- **Decision**: FIXED (plan.md phase 4 Contract, phase 6 p6b line)

### F3 — A permanent `timeout` gets neither a way out nor the named site-data advice

- **Severity**: OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 3 `deviceTimeout`; Known risks
- **Detail**: The contract's SIR-02 fallback is "otherwise name 'wyczyść dane strony'". For `timeout` the plan names neither; deliberate, because a slow read may hide a healthy save and the advice destroys it. Depends on the N-7 iPad measurement (`[human]` 5.8) and the start-counter follow-up.
- **Fix**: None now; recorded in `## Known risks`.
- **Decision**: ACCEPTED (Known risks)

### F4 — The lockstep test is partly tautological

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 1 §2
- **Detail**: `forceable` is defined as `replaceGate(status, true) === 'ok'`; the lockstep test's value is that `replace` really goes through `replaceGate` (counted store writes), not that two rules agree. The deliberate break in 1.2 already covers it.
- **Fix**: None; recorded in `## Known risks` so the tdd agent keeps counting store writes.
- **Decision**: ACCEPTED (Known risks)

VERDICT: PROCEED — the approach is sound and grounded in the code, every phase stays green in full e2e with correct drivers; two warnings fixed in plan.md (follow-up triggers, site-data advice scope), two observations recorded as known risks.
