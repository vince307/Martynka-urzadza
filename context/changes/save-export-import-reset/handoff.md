# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-implement phase 4` step of run `2026-10-13-s12-s14`. Phase 4 is committed (`2042dc8`, `feat(save-export-import-reset): … (p4)`); rows 3.3, 4.1, 4.4 ticked with sha. The next agent must not get wrong: e2e for phase 4 (rows 4.2, 4.3 e2e part) waits for the orchestrator; the export dialog is `openSaveExportDialog({ file, onClose })` and phases 5-6 should mirror it (a step replaces the panel in the same `UIScene.session`).

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | phase 1 `2e435cf`, phase 2 `5debed5`, phase 3 `df18f2f`, phase 4 `2042dc8`, plus handoff docs commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` or `plan_reviewed` (not edited by this step) |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the docs commit |


## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/saveExport.ts` | `saveFileToDevice(text, fileName, nav?, doc?) : Promise<'shared'\|'downloaded'\|'cancelled'\|'failed'>`, `RAW_FILE_NAME`; `exportRawSave` removed |
| `src/ui/dom/saveExportDialog.ts` | new: confirmation dialog, nothing leaves before "Zapisz plik" (L-S2) |
| `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts` | `onExport` option, "Zapisz kopię" row; `UIScene.openExport` builds the file from `saver.current()` |
| `src/ui/dom/saveFailedCard.ts`, `src/main.ts` | `detail` line "Kod: … · Wersja …" (M-S3), raw export through the dialog with the envelope (`kind: 'raw'`, reason, build) |
| `src/data/pl.ts` | `pl.saveTransfer` (export part), `pl.saveFailed.detail` |
| `docs/design-gaps.md` | rows 44 (rewritten), 46, 47, 51 (48-50 still for phase 6) |
| `tests/dialogSessions.test.ts`, `tests/e2e/save-restart.spec.ts` | `onExport`/`onClose` in `DIALOG_CALLBACKS`, UIScene count 6; FR-021 through the dialog |
| `e2e-request-p4.md`, `e2e-break-p4.patch` | request file and break patch for the orchestrator |


## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck / `npm test` / deploy tests / sample E1-E6 / build | OK; unit 1238 passed (branch baseline 1238, +0: only an existing test changed); `e2e hook: absent (2 chunks checked)` |
| e2e `npx playwright test tests/e2e/save-restart.spec.ts` | NOT RUN OK: Chromium cannot start (7 failed at launch). The orchestrator must run `e2e-request-p4.md` (full suite expect 33) |
| Break B1: `onExport` without `session.run` | red: `onExport at line 148`; restored |
| Break B2: `onClose` without `session.run` | red: `onClose at line 162`; restored |
| e2e break `e2e-break-p4.patch` (download right after the gate) | NOT RUN (orchestrator): expect FR-021 red on the `dialog` "Kopia zapisu"; `git apply --check` passes |
| Meta-check | B1/B2 prove only the session wiring; L-S2 (no download before the tap) is proven only by e2e, as the plan says |


## 4. Next command

`/10x-implement save-export-import-reset phase 5`


## 5. Open

- Orchestrator: run `e2e-request-p4.md` (spec, full suite = 33, break patch red then `git checkout -- src/main.ts`); then tick 4.2 and 4.3.
- Rows 4.5 [reviewer], 4.6 [visual], 4.7 [human], 3.4/2.4/1.5 [reviewer] are not mine.
- 4.3 left unticked (its e2e half is pending).
- Carried: DESIGN-GAP rows 48-50 and follow-ups in phase 6; `balance.save.importMaxBytes` for phase 5.


## 6. Autonomous decisions

- Driver `impl`, executed in this context (no subagent): small, wiring-heavy phase.
- Escape in the export dialog behaves like "Anuluj" (`finish`: close, then `onClose` -> `closeSettings`).
- After "cancelled"/"failed" the "Zapisz plik" button stays so the parent can retry; only after "shared"/"downloaded" it becomes "Zamknij". Rejected: always closing (a cancelled share sheet would end the flow).
- Outcome texts invented within the plan's key names (`shared`, `downloaded`, `cancelled`, `failed`), flagged by the DESIGN-GAP 46/47 comments for the [reviewer] row.
- Unavailable-store card gets no `detail` (nothing to quote but the error name; the plan specifies the line for the unreadable reason only).
- Manual gate, commit message, next-phase question decided in place; stopped after the phase.
