# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The `/10x-implement` phase 3 step of run `2026-10-14-save-s13b-s15-s14b` wrote this file; commit `5de4d76` holds the code. The next agent must not get this wrong: `main.ts` now passes `loadReason`, so `future` blocks import and reset in the browser; `UIScene` still calls `saver.replace(state)` without `force` until phase 4.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 10 (+ this handoff); phase 1 = `974cd90`, phase 2 = `815af40`, phase 3 = `5de4d76` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 29 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/main.ts` | `createAutosaver` gets `loadReason` for an unreadable outcome |
| `src/ui/dom/saveSummaryView.ts` | `blockedText(cause)`: the one cause to sentence map |
| `src/ui/dom/{saveImportDialog,saveResetDialog}.ts` | blocked branch uses `blockedText(device.cause)` |
| `src/data/pl.ts` | `saveTransfer.deviceFuture`, `deviceTimeout`, `deviceFatal` |
| `src/testing/e2eHook.ts` | seam `corrupt` (`{ version: 1, stars: 'many' }`) |
| `tests/e2eSave.test.ts`, `tests/e2eHookGuard.test.ts` | `corrupt decodes as corrupt`, guard case |
| `tests/e2e/save-transfer-blocked.spec.ts` | the "#2 an unreadable save warns" test now uses `?e2eSave=corrupt` |
| `docs/design-gaps.md` | row 70 |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| `npm test` | 1921 passed (baseline 1919, +2) |
| `sample` E1-E6, build | OK, `e2e hook: absent (2 chunks checked)`; e2e build contains `corrupt` |
| Deliberate break | seam value `version: 99`: `corrupt decodes as corrupt` red (AssertionError, got `future`), restored; meta: the test asserts reason `corrupt`, so a second `future` seam fails it |
| e2e | `save-transfer-blocked.spec.ts` ran green once (2 passed, includes the moved "#2 an unreadable save warns instead of showing the fresh session"); the full suite and `save-restart.spec.ts` then hit Chromium MachPortRendezvous crashes. e2e: not runnable in this session — orchestrator gate. Orchestrator: run the full suite, expect 52 passed (52 + 0); watch `save-transfer-blocked.spec.ts` (2 tests) and `save-restart.spec.ts` FR-021 |

## 4. Next command

/10x-implement save-reason-and-recovery phase 4

## 5. Open

- Row 3.4 (full e2e) left for the orchestrator; 3.5 [reviewer], 3.6 [visual], 3.7 [human] not mine.
- Row 2.3 ticked from the orchestrator note (52 passed on 815af40).
- Phase 4: the second confirmation for lasting `unavailable` and the `force` path in `UIScene`.

## 6. Autonomous decisions

1. Teacher read of `deviceFuture`/`deviceTimeout`/`deviceFatal`: kept the plan's wording verbatim (calm, adult, no codes).
2. The cause map lives in `saveSummaryView.ts` (DOM layer, imports `pl`), shared by both dialogs.
3. Seam `corrupt` value is a v1 record with a non-numeric `stars`, which `validateSave` rejects.
4. No `AskUserQuestion`; execution mode in this context, commit message as proposed.
