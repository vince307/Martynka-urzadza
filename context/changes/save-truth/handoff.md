# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-implement save-truth phase 10` step. Phases 1 (66c6989), 2 (739d10c), 3 (d3c2f4b), 4 (0eb15a2), 5 (3714f3c), 6 (fc0f7f7), 7 (4801d61), 8 (b1a01c6), 9 (cb217cd) and 10 (1859bdd) are committed and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and no code path may delete or overwrite a `backup-v<N>` key; also a BroadcastChannel message alone never blocks the only live tab's write.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-9 as before, phase 10 = 1859bdd (`feat(save-truth): Export says what happened (p10)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 46 (`grep -c '^- \[ \]' plan.md`); 10.1-10.3 ticked, 10.4 [reviewer] and 10.5 [visual] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/dom/saveExport.ts` | `ExportOutcome` = `shared \| downloadStarted \| cancelled \| failed`; a link-click download returns `downloadStarted` (`downloaded` is gone, no path produces it) |
| `src/ui/dom/saveExportDialog.ts` | `file()` may return `null`: the dialog shows `pl.saveTransfer.exportInvalid`, shares nothing, buttons stay; `downloadStarted` takes the done branch ("Zamknij") |
| `src/scenes/UIScene.ts` | `openExport` `file()` runs `saveProblem(saver.current())` first; on a problem logs `console.error('export refused: …', { problem })` and returns null (`saver.current()` is already a `SaveState`) |
| `src/data/pl.ts` | `saveTransfer.exportOutcome.downloadStarted` = "Pobieranie pliku się zaczęło. Sprawdź folder Pobrane." (gap 132); `saveTransfer.exportInvalid` = "Tej kopii nie da się zapisać: stan gry jest uszkodzony." (gap 133) |
| `docs/design-gaps.md` | rows 132-133 |
| tests | `deviceSaveWiring.test.ts` (+1; O4 assertion on the exact `deviceSaveView` argument and the warning), `saveTransferCopy.test.ts` (+1), e2e `save-restart.spec.ts` #2 asserts `downloadStarted` (deliberate reversal: a link click cannot know the file landed) |

## 3. Verification

| command | result |
|---|---|
| Deliberate break | `const problem = saveProblem(saver.current())` -> `const problem: string \| null = null` in `openExport`: "openExport validates the state before it builds the file" red (`expected -1 to be greater than -1`); restored, green. Meta-check: it proves the source wiring (validation present and before `exportFileText`), not a browser download or the dialog's null branch (no DOM in vitest; phase 15 / visual 10.5) |
| `npm test` | 3503 passed (branch baseline after p9: 3501, +2) |
| lint / typecheck / deploy scripts / sample E1-E6 / build | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 127 passed (baseline 127, +0), 0 flakes; run once after the last source edit |
| `SAVE_VERSION`, fixtures | 4; no fixture touched |
| stray processes | `ps … | grep -E 'sleep|until|playwright|vite'` empty after the run (outside sandbox) |

## 4. Next command

`/10x-tdd save-truth phase 11`

## 5. Open

- Rows 10.4 [reviewer] and 10.5 [visual] not ticked. Also open: 2.5, 2.6, 3.6, 3.7, 3.8, 4.5, 4.6, 5.4, 6.4, 6.5, 7.4, 7.5, 8.4, 8.5, 9.4, 9.5.
- No DOM test of the dialog's invalid branch (vitest has no DOM); a corrupt state is hard to reach in the browser, so visual 10.5 shows the `downloadStarted` line only.
- Phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Driver `impl` as planned.
2. The invalid line lives at `saveTransfer.exportInvalid` (not `exportOutcome.invalid`): `exportOutcome` is indexed by the `ExportOutcome` union, and invalid is not a share/download outcome. Would change: a reviewer wanting the planned key.
3. The invalid branch keeps "Zapisz plik" and "Anuluj" visible (the state may heal; nothing leaves meanwhile).
4. Validation uses `saveProblem(saver.current())` directly: `current()` already returns the encoded `SaveState`.
5. Commit message and next-phase prompts decided in place; the run stops after this phase.
