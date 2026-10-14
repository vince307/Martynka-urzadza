# Handoff — `minigame-daily-puzzle` (slice S-15)

Written by the `/10x-tdd` phase 2 step (autonomous run 2026-10-14-save-s13b-s15-s14b). The `backup-v1` copy and the `migration-failed` reason are built and committed; phases 3-13 are untouched. The e2e half of gate row 2.4 is NOT run (Chromium cannot start in this session): the orchestrator must run the full suite (expect baseline 63).

## 1. State

| | |
|---|---|
| Branch | `feat/minigame-daily-puzzle`, cut from `main` at `1441161` |
| Commits | 4 docs + phase 1 `b0ad4ba` + handoff p1 + phase 2 commit + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md`; phase 2: 2.1-2.3 ticked, 2.4 open (e2e), 2.5 [reviewer] open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/save.ts` | `DecodeResult` has `{ reason: 'migration-failed', step }`; `decodeSave` separates a throwing step (migration-failed) from a failing validation (corrupt) |
| `src/core/autosave.ts` | `SaveStore.backup(raw, from)` required; `LoadOutcome.loaded.raw`; `AutosaverOptions.migrated`; backup before the first write in `attempt`; `AutosaveStatus.migratedFrom` |
| `src/storage/idb.ts` | `backup` writes key `profile:<id>:backup-v<from>`; still the only idb-keyval importer |
| `src/testing/e2eHook.ts`, `src/main.ts` | in-memory store gets a no-op `backup`; `main.ts` passes `migrated` from the loaded outcome |
| `src/core/saveFile.ts`, `src/data/pl.ts` | `ImportRejection` + `pl.saveTransfer.rejected['migration-failed']` (own calm text; phase 3 may reword) |
| `tests/autosave.test.ts`, `idbStore.test.ts`, `save.test.ts`, `saveFile.test.ts`, `saveHealth.test.ts`, `saveTransferCopy.test.ts` | new tests (describe "backup before the first write after a migration", "IndexedDB backup copy") and updated fakes |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run) | 7 red: `AssertionError: expected [ 'write', 'write' ] to deeply equal [ 'backup', 'write', 'write' ]`; `expected { kind: 'unreadable', …(1) } to deeply equal { kind: 'unreadable', …(2) }` (migration-failed); `main.backup is not a function` (idb) |
| `npm run lint` / `npm run typecheck` | OK / OK |
| `npm test` + deploy scripts + `sample` E1-E6 | unit 2251 passed (baseline 2239, +12); sample no violations |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=...` | e2e: not runnable in this session — orchestrator gate (MachPortRendezvous Permission denied, 2 tries); expected 63 (+0) |
| `git diff --stat main -- tests/fixtures/save-v1*` | empty |
| Break A: copy after the write | 2 red (order test, retry test); restored. Meta: the order test records store calls in sequence, not just counts |
| Break B: copy failure swallowed (`.catch(() => undefined)`) | 1 red (failing-copy test: write happened); restored |
| Break C: migration-failed reported as `future` | 2 red (save.test step test, loadSave test); restored |

## 4. Next command

`/10x-implement minigame-daily-puzzle phase 3` (Phase 3: Teksty zapisu i szew `?e2eSave=v1`; `Driver: impl`)

## 5. Open

- 2.4 e2e half (orchestrator), 2.5 [reviewer]; also phase 1 rows 1.5 [reviewer], 1.6 [human].
- `replace` does not copy (tested); an import of a v1 file writes v2 without a backup by design (the file is the backup).
- A load that is `migration-failed` blocks writes (`blockedBy: unreadable`, old bytes untouched) and is replaceable like `corrupt`; phase 3 owns the texts for it.
- Backup copy overwrites an existing `backup-v1` key (only reachable after a re-migration of a v1 value).

## 6. Autonomous decisions

1. **`backup(raw, from)` has two arguments** (plan contract: `backup(raw)`): the key needs the version, and the store cannot know it. Rejected: a backup key fixed to `v1` (breaks at v3). Would change: plan-review preferring the version in a wrapper object.
2. **Backup is run inside `attempt`** (retry path = the normal write path), flag `backedUp` set only after success; `dirty` stays true on failure. Rejected: a separate pre-write step with its own status.
3. **`migration-failed` text added to `pl.ts` now** only because the `ImportRejection` record is exhaustive; wording is phase 3's.
4. **Existing test changed**: "a throwing step is a corrupt save" became migration-failed (the plan's new behaviour); a new test keeps "validation failure after a step = corrupt".
5. `LoadOutcome.unreadable` does not carry `step` (only `DecodeResult` does); nothing consumes it yet.
