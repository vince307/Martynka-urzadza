# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-implement phase 5` step of run `2026-10-13-s12-s14`. Phase 5 is committed (`8c5bb41`, `feat(save-export-import-reset): Import z podsumowaniem (p5)`); rows 4.2, 4.3 ticked from the orchestrator's phase-4 e2e, rows 5.1, 5.2 ticked with sha. The next agent must not get wrong: the import dialog is `openSaveImportDialog({ current, summarize, roomName, maxBytes, apply, onClose })` and phase 6's reset dialog should mirror it (a step replaces the panel in the same `UIScene.session`; `onReset` and its `onClose` go through `session.run`).

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | phase 1 `2e435cf`, phase 2 `5debed5`, phase 3 `df18f2f`, phase 4 `2042dc8`, phase 5 `8c5bb41`, plus handoff docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` or `plan_reviewed` (not edited by this step) |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveImportDialog.ts` | new: step 1 (hidden file input, refusal lines, `console.warn` with reason and problem), step 2 ("Teraz" / "Z pliku", "Wczytaj" -> `apply` -> `reload()`; failure -> `applyFailed`, no reload) |
| `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts` | `onImport` option and button; `UIScene.openImport` (current from `decodeSave(saver.current())`, `apply: saver.replace`) |
| `src/data/pl.ts` | `pl.saveTransfer` import part (`importButton`, `importTitle`, `importBody`, `importPrivacy`, `choose`, `chooseOther`, `now`, `fromFile`, `stars`, `noStage`, `room`, `load`, `rejected.*`, `applyFailed`) |
| `docs/design-gaps.md` | row 48 (49-50 still for phase 6) |
| `tests/dialogSessions.test.ts`, `tests/saveTransferCopy.test.ts` | `onImport` in `DIALOG_CALLBACKS`, UIScene count 8; stars agreement 0/1/2/4/5/12/22/100, every rejection text, room line |
| `e2e-request-p5.md` | request for the orchestrator (full suite expect 33) |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck / `npm test` / deploy tests / sample E1-E6 / build | OK; unit 1248 passed (branch baseline 1238, +10); `e2e hook: absent (2 chunks checked)` |
| e2e `npx playwright test tests/e2e/save-restart.spec.ts` | NOT RUN OK: Chromium cannot start (all failed at launch). The orchestrator must run `e2e-request-p5.md` (full suite expect 33) and then tick 5.3 |
| Break B1: `onImport` without `session.run` | red: `onImport at line 152`; restored |
| Break B2: `future` text without "Zaktualizuj grę" | red: `expected ... to contain 'Zaktualizuj grę'`; restored |
| Meta-check | B1 proves only the session wiring, B2 only the copy. That `apply` is reachable only after step 2 and "Wczytaj", and that a refusal never touches the saver, is proven only by phase 7 e2e (as the plan says); by construction `apply` is called in one place, the "Wczytaj" handler |

## 4. Next command

`/10x-implement save-export-import-reset phase 6`

## 5. Open

- Orchestrator: run `e2e-request-p5.md`; then tick 5.3 (its build half, `e2e hook: absent`, already passed here).
- Rows 5.4 [reviewer], 5.5 [visual], 5.6 [human] and the older [reviewer]/[visual]/[human] rows are not mine.
- Carried to phase 6: DESIGN-GAP rows 49-50, follow-ups, `rawExportText`, `freshSession` out of `main.ts`.
- The room name in "Teraz"/"Z pliku" comes from `ROOMS[id].name` (UIScene), the dialog itself takes a `roomName` callback.

## 6. Autonomous decisions

- Driver `impl`, executed in this context (no subagent).
- Added `importPrivacy` ("Wybierz plik zapisany z tej gry. Plik nie jest nigdzie wysyłany.") instead of reusing the export privacy line, which warns about sending the file to strangers and reads wrongly on import. Flagged by DESIGN-GAP 48 for the [reviewer] row.
- `rejected['unknown-version']` text invented ("Nie rozpoznaję wersji tego zapisu. Obecne postępy zostały bez zmian."), the plan left it as "…".
- A file read error maps to the `not-json` refusal text; the "Zamknij" label replaces "Anuluj" after a refusal or a failed apply.
- `onImport` button shown only when the saver exists (like `onExport`).
- Manual gate, commit message, next-phase question decided in place; stopped after the phase.
