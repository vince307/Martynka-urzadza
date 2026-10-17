# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-implement save-truth phase 9` step. Phases 1 (66c6989), 2 (739d10c), 3 (d3c2f4b), 4 (0eb15a2), 5 (3714f3c), 6 (fc0f7f7), 7 (4801d61), 8 (b1a01c6) and 9 (cb217cd) are committed and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and no code path may delete or overwrite a `backup-v<N>` key (phase 9 only reads them); also a BroadcastChannel message alone never blocks the only live tab's write.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-8 as before, phase 9 = cb217cd (`feat(save-truth): Keep a copy of the old save from "Zapis gry" (p9)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 49 (`grep -c '^- \[ \]' plan.md`); 9.1-9.3 ticked, 9.4 [reviewer] and 9.5 [visual] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/autosave.ts` | `Autosaver.readBackups()`: read-only pass-through to `store.readBackups()`, never rejects (`[]` and a log on failure); no registry key (plan review F3) |
| `src/core/saveHealth.ts` | `newestBackup(copies)` (highest `from`); `saveHealthView(status, copies = [])`: an `uncertain` backup record with that version present in the store reads as `kept`, code null |
| `src/scenes/UIScene.ts` | `openSettings` `onPass` reads the copies once (when the panel opens, inside `session.run`, re-checks `session.active()`), passes versions to `saveHealthView`, `onBackupExport` only when a copy exists; `openBackupExport(copy, session)` -> `openSaveExportDialog` with `exportFileText({kind:'raw', reason:'backup-v<from>', raw})`, file name `pl.saveFailed.fileName` |
| `src/ui/dom/settingsPanel.ts` | `onBackupExport` option: button in the "Zapis gry" button row (closes panel, then the callback) |
| `src/data/pl.ts` | `settings.backupExport` = "Zachowaj kopię starego zapisu" |
| `docs/design-gaps.md` | row 131 |
| tests | `saveHealth.test.ts` (2), `deviceSaveWiring.test.ts` (2), `autosave.test.ts` (1), `saveFile.test.ts` (1: raw backup-v1 envelope -> `parseImport` -> v4 session); `dialogSessions.test.ts` expected count 10 -> 12 and `onBackupExport` added to the callback list (necessary, not a plan-named reversal) |

## 3. Verification

| command | result |
|---|---|
| RED (src stashed, tests kept) | 5 failures: uncertain->kept, `newestBackup`, `readBackups` pass-through, panel wiring, `openBackupExport` wiring |
| GREEN | `npm test` 3501 passed (branch baseline after p8: 3495, +6) |
| lint / typecheck / deploy scripts / sample E1-E6 / build | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 127 passed, 0 flakes (baseline 127, +0); run once after the last edit (a first run was killed because a `git stash` overlapped its build, then rerun clean) |
| Deliberate break | `kind: 'raw'` -> `'save'` in `openBackupExport`: wiring test "openBackupExport exports the raw copy…" red; restored. Meta-check: the round-trip test (`saveFile.test.ts`) exercises `exportFileText`/`parseImport` directly and does not see the UIScene call, so the wiring test is what proves the `raw` kind; the actual download is phase 15 |
| `SAVE_VERSION`, fixtures | 4; no fixture touched; backups only read |
| stray processes | `ps -U $(id -u) … | grep -E 'sleep|until|playwright|vite'` empty (outside sandbox) |

## 4. Next command

`/10x-implement save-truth phase 10`

## 5. Open

- Rows 9.4 [reviewer] and 9.5 [visual] not ticked. Also open: 2.5, 2.6, 3.6, 3.7, 3.8, 4.5, 4.6, 5.4, 6.4, 6.5, 7.4, 7.5, 8.4, 8.5.
- The copies are read when the gate is passed, so the panel opens a few ms later (one promise); a cancelled gate before then does nothing (`session.active()`).
- No DOM test for the new button (vitest has no DOM); phase 15 covers it in a browser (`?e2eSave=v1`).
- Phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Driver `impl` as planned. Panel button placed in the existing save-actions row (not inside the "Zapis gry" text section) to reuse `createButton` and the close-then-callback pattern; rejected: a second row. Would change: a visual review asking for it next to the migration line.
2. Newest copy only (highest `from`), per the plan's "newest `from`".
3. `uncertain` + present copy shows as kept; `lost` + present is left as `lost` (a record written before the write-once rule could contradict; not guessed).
4. `onPass` wraps `session.run` around the async read so `dialogSessions.test.ts` (every dialog callback in a session) still holds; the test's counts were updated.
5. Commit message and next-phase prompts decided in place; the run stops after this phase.
