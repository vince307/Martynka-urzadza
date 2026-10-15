# Handoff — `salon-load-health` (slice fix salon-load-health, non-roadmap)

Written by `/10x-tdd salon-load-health phase 2`: the autosaver writes a migrated save at start, the copy policy is version-neutral, and the old remap is gone (commits 6922792 = only the `tests/salonRemap.test.ts` deletion, 5009efd = everything else). The one thing not to get wrong: e2e was NOT runnable in this session (Chromium dies on MachPortRendezvous), so row 2.4 is open for the orchestrator, who must also confirm the edited SV2-01 spec.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-load-health`, cut from `main` at `7f831c5` |
| Commits | identity, research, plan, plan review, 826150c (p1), 6922792 + 5009efd (p2) + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 5 closes it) |
| `## Progress` rows remaining | 19 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` | `WriteReason` + `'migration'`, `AutosaveStatus.migrationWrittenAt`, start arm when `migrated` and not blocked, copy given up only after the save is written (F3/F4), logs with `SAVE_VERSION` and the real `from` |
| `src/main.ts`, `src/scenes/UIScene.ts` | no remap; `Save migrated from v<N>` log; `markDirty()` after a room repair; import preview `saveSummary(s, ROOMS)` |
| `src/core/rooms.ts`, `src/core/types.ts`, `src/data/rooms.ts` | `remapLegacySalon`, `LegacyRoomLayout`, `LEGACY_SALON` removed |
| `tests/autosave.test.ts` | new describe "write at start after a migration (audit M-3)", 9 cases |
| `tests/legacySalonMigration.test.ts`, `tests/roomsData.test.ts` | pins now against the frozen literal `LEGACY_SALON_V2` |
| `tests/saveHealth.test.ts` | status helper has `migrationWrittenAt` |
| `tests/salonRemap.test.ts` | deleted (cases live in `legacySalonMigration.test.ts`) |
| `tests/e2e/save-backup-health.spec.ts` | SV2-01: `backup` is `pending` or `failed` right after start (plan-review F1) |
| `plan.md` | Progress 2.1-2.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (first run, before `autosave.ts` changed) | 8 failed; first: `a migrated start writes without a change`, `expected [] to deeply equal [ 'backup', 'write' ]`-style op assertions, plus `migrationWrittenAt` missing and the F3/F4 cases |
| `npm run lint` / `npm run typecheck` | pass / pass |
| `npm test` | 2919 passed (p1 baseline 2972; +9 new autosave cases, -62 removed with `salonRemap.test.ts`, whose cases `legacySalonMigration.test.ts` already covers) |
| deploy + ops shell tests, `sample` E1-E6 | pass |
| `npm run build` | pass, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test` | e2e: not runnable in this session — orchestrator gate (baseline 98, expect +0) |
| fixtures | no frozen v1/v2 fixture changed (only p1's 2 new files differ from main); grep `remapLegacySalon|LEGACY_SALON\b|LegacyRoomLayout` in `src/` only hits `LEGACY_SALON_V2` in the migration module |
| Break 1 (arming at start disabled) | red: 5 tests (start write, failed copy, hidden flush, F4 log, F3); restored |
| Break 2 (F3 undone: `skipBackup` before the write) | red: the owed-copy test; restored |
| Meta-check | the cases count fake-store operations (`ops`, `backups`, `value`), not just the status field |

## 4. Next command

`/10x-implement salon-load-health phase 3` (phase 3, `Driver: impl`)

## 5. Open

- Row 2.4 e2e (orchestrator, `--workers=4`, expect 98 + 0); [reviewer] 2.5; [visual] 2.6 (`?e2eSave=legacy-salon`, "przeniesiono z wersji 2" at 1440 and 1024); earlier [human] 1.6, [reviewer] 1.5.
- Commit 6922792 holds only the deletion (a wrong path in `git add` aborted the staging); no amend per contract.
- Unproven without a browser: SV2-01 still gets exactly three `backup` ops then `write` (the start attempt counts as the first try); other e2e specs that read `writes` after load were grepped and do not assert counts.

## 6. Autonomous decisions

1. **Mixed phase**: autosaver logic TDD'd; `main.ts`/`UIScene` wiring and deletions inline. Driver stays `tdd`.
2. **Start write carries reason `migration` only for the debounced timer**; a `markDirty` re-arm keeps it until the first migrated write succeeds (`migrationWrittenAt === null`). Rejected: a separate flag in `main.ts` (second decision point). Would change: a need to tell the first write apart from a later one.
3. **`replace` counts a failed copy in `backupFails` and leaves it `failed`; `skipped` only after its write succeeds.** Same deferral in `attempt`. Would change: a product wish to show "skipped" on a failed write.
4. **`migrationWrittenAt` is also set by a successful `replace`** of a migrated save (the save on the device is then the current version). Would change: if import should not count as the migration write.
5. **Repaired room → `markDirty()` in `main.ts`** (plan item), not a start arm in the saver.
