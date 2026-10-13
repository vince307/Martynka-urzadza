# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-implement phase 6` step of run `2026-10-13-s12-s14`. Phase 6 (reset dialog, design gaps, follow-ups, CLAUDE.md, seam sweep) is committed; the last impl phase is done. The next agent (phase 7, e2e) must not get wrong: the reset flow is `openSaveResetDialog({ current, roomName, fresh, apply, onClose })`, `apply` is `saver.replace(encodeSave(freshSession(FIRST_ROOM)))`, and "Anuluj" has the initial focus.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | phases 1-5 `2e435cf`, `5debed5`, `df18f2f`, `2042dc8`, `8c5bb41`; phase 6 `cc58e16` |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` (epilogue waits for phase 7) |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` (6.4 e2e half, 6.5-6.10 manual, phase 7) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveResetDialog.ts` | new reset dialog (summary, hint, "Anuluj" focused, plain "Zacznij od nowa" -> `apply` -> `reload()`; failure -> `applyFailed`) |
| `src/ui/dom/saveSummaryView.ts` | new shared `createSummaryList`, taken out of `saveImportDialog.ts` |
| `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts` | `onReset` button and `UIScene.openReset` (in `session.run`) |
| `src/data/pl.ts` | `saveTransfer.resetButton/resetTitle/resetBody/resetHint/resetConfirm` |
| `src/core/save.ts`, `tests/save.test.ts` | `rawExportText` removed (no callers since phase 4) with its test |
| `src/scenes/WelcomeScene.ts` | guard `this.session?.active()` like `UIScene` (F6) |
| `src/data/layout.ts` | `REGISTRY_KEYS.saver` comment updated |
| `docs/design-gaps.md` | rows 49, 50 added (46-51 now complete) |
| `follow-ups/review-fixes.md` | new, six items each with `Trigger:` |
| `CLAUDE.md` | S-12 sentence in Current state; "Not yet present" no longer lists S-12; `rawExportText` removed from the S-11 list |
| `tests/dialogSessions.test.ts`, `tests/saveTransferCopy.test.ts` | `onReset` in `DIALOG_CALLBACKS`, UIScene count 10; reset copy test |
| `e2e-request-p6.md` | request for the orchestrator (full suite expect 33) |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck / `npm test` / deploy tests / sample E1-E6 / build | OK; unit 1247 passed (branch baseline 1248 after phase 5, -1: the 3-case `rawExportText` describe (2 tests) removed, +1 reset copy test); `e2e hook: absent (2 chunks checked)` |
| `validate-rule-files.sh` | PASS (236 paths, 0 missing) |
| Break B1: `onReset` without `session.run` | red: `onReset at line 154`; restored |
| Break B2: CLAUDE.md names `src/core/savefilex.ts` | FAIL (`missing: 1`); restored. A first try with `savefile.ts` stayed PASS: the macOS filesystem is case-insensitive, so the plan's example path is not a valid break here |
| Meta-check | B1 proves only the session wiring (the test reads scene syntax), B2 only that the validator reads paths from rule files. That reset replaces the save only after the second tap, and the reload, is proven only by phase 7 e2e |
| `npx playwright test` | NOT RUN OK: Chromium cannot start in the subagent sandbox. The orchestrator must run `e2e-request-p6.md` (expect 33) and then tick the e2e half of 6.4 |
| Seam sweep | `rawExportText` removed; `freshSession` was already only imported in `main.ts` (defined in `core/save.ts`); import/reset summary lines now one helper; stale comments `saveExport.ts`, `saveHealth.ts` already correct, `REGISTRY_KEYS.saver` fixed; `WelcomeScene` guard aligned; file name has two sources by design (`pl.saveTransfer.fileName` dated vs `pl.saveFailed.fileName` raw copy), each used in one place |

## 4. Next command

`/10x-e2e save-export-import-reset phase 7`

## 5. Open

- Orchestrator: run `e2e-request-p6.md`, then tick the e2e half of row 6.4 (row 6.4 left unticked here).
- Rows 6.5 [reviewer], 6.6 [reviewer], 6.7 [visual], 6.8-6.10 [human] and the earlier [reviewer]/[visual]/[human] rows are not mine.
- DESIGN-GAP rows 46-51 exist in `docs/design-gaps.md`; comments `DESIGN-GAP 46/47/48/49/44/45/51` in code match.
- Follow-ups: `follow-ups/review-fixes.md` (`decodeSave` L-S1, `loadSave` N-7, `settings.empty` F7, two cards one origin, `saveProblem` path, import from the welcome screen).
- Phase 7 needs `reset` e2e: the reset dialog's hook targets are DOM (no hook needed); the confirm button text is `pl.saveTransfer.resetConfirm`, same as the panel button `resetButton` (use the dialog scope).

## 6. Autonomous decisions

- Driver `impl`, done in this context (no subagent); manual gate, commit message and next-phase question decided in place; stopped after the phase.
- Reset confirm button is a plain button (not `parent-primary`, no `overlay-secondary`: that class is styled only inside the save-failed card); "Anuluj" first in DOM so the dialog's default focus goes to it. Would change if the reviewer wants a visibly distinct destructive style.
- The dialog takes `fresh: () => SaveState` so the empty save is built at the tap; `UIScene` passes `encodeSave(freshSession(FIRST_ROOM))`.
- UIScene `DIALOG_CALLBACKS` count is 10 (the reset adds `onReset` and its `onClose`).
- Used `savefilex.ts` for break B2 because the case-insensitive filesystem makes `savefile.ts` resolve.
- Removed `rawExportText` rather than justify it (no callers).
