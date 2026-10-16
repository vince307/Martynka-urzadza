# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-tdd save-truth phase 4` step. Phases 1 (66c6989), 2 (739d10c), 3 (d3c2f4b) and 4 (0eb15a2) are committed and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and no code path may delete or overwrite a `backup-v<N>` key.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phase 1 = 66c6989, phase 2 = 739d10c, phase 3 = d3c2f4b, phase 4 = 0eb15a2 (`feat(save-truth): write-once readable backups and the backup record (p4)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 64 (`grep -c '^- \[ \]' plan.md`); 4.1–4.4 ticked, 4.5 [reviewer], 4.6 [human] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/autosave.ts` | `SaveStore.backup` now `Promise<'written'\|'kept'>`; new required `readBackups()`, `backupRecord()`, `noteBackup(record)`; exported `BackupRecord { from, result: 'kept'\|'lost'\|'uncertain', error, at }`. The autosaver does not use the new methods yet (phases 5, 6, 9) |
| `src/storage/idb.ts` | exported `putBackupOnce` (one readwrite transaction: `os.count(copy key)`, put the copy only at 0, always put the record `kept`); `createIdbSaveStore` `backup`/`readBackups` (`backup-v1..v{SAVE_VERSION-1}`, absent skipped)/`backupRecord`/`noteBackup` over key `profile:default:backup-status` |
| `src/testing/e2eHook.ts` | `e2eSaveStore` keeps in-memory copies (write-once) and the record; `backupfail`/`backuphang` unchanged |
| tests | `tests/idbStore.test.ts` (5 new in "IndexedDB backup copy"), `tests/e2eSave.test.ts` (1 new), `tests/helpers.ts` `backupExtras` (no-op store methods), `tests/autosave.test.ts` and `tests/saveFile.test.ts` (store literals use `backupExtras`, `'written'`) |

## 3. Verification

| command | result |
|---|---|
| RED (stub: `backup` as before returning `'written'`, `readBackups`/`backupRecord`/`noteBackup` no-ops) | 5 failures, all assertions, `tests/idbStore.test.ts`: `AssertionError: expected 'written' to be 'kept'` (second backup, and the copy made earlier), `expected null to deeply equal { from: 3, result: 'kept', … }`, `expected [] to deeply equal [ { from: 1, raw: { n: 1 } }, … ]`, `expected null to deeply equal { from: 1, result: 'lost', … }` |
| Deliberately reversed existing tests | none; existing tests only changed mechanically (store literals gained the new methods) |
| GREEN | `npm test` 3436 passed (branch baseline after p3: 3430, +6) |
| `npm run lint` / `typecheck` | OK |
| deploy scripts, `sample` E1–E6, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | 127 passed (baseline 127, +0); `save-backup-health` and `save-migration` green; no flake |
| `SAVE_VERSION`, fixtures | 4; `git diff --stat tests/fixtures` empty |
| Deliberate break | `putBackupOnce` writing the copy always (`count >= 0`): 2 tests red (`expected 'written' to be 'kept'`); restored. Meta-check: proves the store contract on fake-indexeddb, not Safari's IndexedDB (a `[human]` row covers the tablet); it also proves the record is written for an old copy |

## 4. Next command

`/10x-tdd save-truth phase 5`

## 5. Open

- Rows 4.5 [reviewer] and 4.6 [human] (later migration keeps the FIRST old copy) not ticked. Also open: 2.5, 2.6, 3.6, 3.7, 3.8.
- Phase 5 will use `backup`'s result, `noteBackup` and the record; `backup` still ignored by the autosaver (`await limited(store.backup(...))`). `main.ts` does not read `backupRecord()` yet (phase 6).
- Phases 5, 10, 11 keep their listed reversals; plan.md is the source.
- Follow-ups: phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. No mixed-phase question: whole phase TDD (Driver stays `tdd`); the e2e seam store and test-store updates were done inline after RED.
2. A shared `backupExtras` in `tests/helpers.ts` supplies the three new required methods to the many test store literals, so the contract stays required for production stores. Would change: a wish for per-test fakes.
3. `at` of the record is `Date.now()` taken in `createIdbSaveStore.backup` (the store has no injected clock). Would change: phase 6 needing a deterministic clock.
4. `readBackups` reads each key with a separate `get` (up to 3) instead of one transaction; it runs only at panel open. Would change: a consistency need.
5. Commit message and next-phase prompts decided in place; the run stops after this phase.
