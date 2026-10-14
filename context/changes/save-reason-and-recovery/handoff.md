# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The `/10x-implement` phase 4 step of run `2026-10-14-save-s13b-s15-s14b` wrote this file; commit `5884958` holds the code. The next agent must not get this wrong: the import and reset dialogs now take `apply(state, force)` and `UIScene` passes `{ force }` to `saver.replace`; "Zastąp mimo to" appears only when `deviceSaveView(...).forceable` (refused read, not `timeout`/`future`/`fatal`).

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 12 (+ this handoff); phase 3 = `5de4d76`, phase 4 = `5884958` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 22 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveImportDialog.ts`, `saveResetDialog.ts` | blocked step with `force` button, second step, forced `apply`; reset rebuilt with `show`/`blockedStep`/`confirmStep` |
| `src/ui/dom/saveSummaryView.ts` | `failureText(result, forced, plain)`: `siteDataAdvice` only for a forced store failure or a rejected promise |
| `src/scenes/UIScene.ts` | `apply: (state, force) => saver.replace(state, { force })` in `openImport` and `openReset` |
| `src/data/pl.ts` | `deviceUnavailable` (new text), `force`, `forcedWarning`, `siteDataAdvice`, `resetFailed` |
| `tests/deviceSaveWiring.test.ts` | two tests: both `apply` pass `{ force }` to `saver.replace` |
| `docs/design-gaps.md` | row 71 |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` | 1923 passed (baseline 1921, +2) |
| `sample` E1-E6, deploy scripts, build | OK, `e2e hook: absent (2 chunks checked)` |
| `tests/dialogSessions.test.ts` | green, callback counts unchanged |
| Deliberate break | `UIScene` `saver.replace(state)` without `force`: both new wiring tests red (`expected undefined to be '{force}'`), restored; meta: proves the wiring only, the refusal itself is proven by `replaceGate` unit tests and phase 6 e2e |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous, 3 plain tries). Orchestrator: run the full suite, expect 52 passed (52 + 0); watch `save-transfer-blocked.spec.ts` "#2 an unavailable save cannot be overwritten by import or reset" (first step still has no choose/resetConfirm, still has the `deviceUnavailable` key text; the new text is a different string but the spec uses the key) and `save-transfer.spec.ts` (import/reset normal path, `apply` now gets `force=false`) |

## 4. Next command

/10x-implement save-reason-and-recovery phase 5

## 5. Open

- Row 4.4 (full e2e) left for the orchestrator; 4.5 [reviewer], 4.6 [visual], 4.7-4.8 [human] not mine.
- Row 3.4 ticked from the orchestrator note (51 passed + adaptive.spec #13 load flake, passed alone).
- Phase 5: export warning (SIR-04), `freshRound` wiring test (ASL-01), seam sweep, docs.

## 6. Autonomous decisions

1. Teacher read: used the plan's wording for `deviceUnavailable`, `force`, `forcedWarning`, `siteDataAdvice`, `resetFailed` verbatim (calm, adult, no codes).
2. Forced failure text decided by `failureText`: `Busy`/`Blocked`/`InvalidSave` give the plain line, any other error or a rejected promise gives `siteDataAdvice` (plan-review F2).
3. In the forced import flow the `deviceUnreadable` line is replaced by `forcedWarning` for every non-summary device view.
4. No `AskUserQuestion`; execution mode in this context, commit message as proposed.
