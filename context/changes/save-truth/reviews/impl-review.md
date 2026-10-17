<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Save truth — what the parent is told about save, import/reset and a stale tab

- **Plan**: context/changes/save-truth/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15
- **Date**: 2026-10-17
- **Verdict**: APPROVED (after the review fixes below; no open CRITICAL)
- **Findings**: 0 critical, 6 warnings, 4 observations

## Verification (re-run by the reviewer, branch feat/save-truth)

| suite | before fixes (ea71beb) | after fixes |
|---|---|---|
| lint, typecheck | OK | OK |
| unit `npm test` | 3535 passed = baseline 3416 + 119 | 3545 passed = baseline 3416 + 129 (+8 `tests/fixtureLoadPath.test.ts`, +2 `tests/autosave.test.ts`) |
| deploy scripts, `sample` E1-E6 | OK, OK, no violation | OK, OK, no violation |
| build | `e2e hook: absent (2 chunks checked)`; `grep -r "slowfail\|e2eSave" dist/` empty | same |
| e2e `--workers=4` | 132 passed = baseline 127 + 5 (p14: +3 incl. orchestrator test c; p15: +2) | see handoff §3 |

Deliberate breaks re-executed by the reviewer:
1. `putBackupOnce` writing whatever `count` says (`count === 0 || true`) → red: `idbStore` "a second backup for the same version keeps the first bytes and answers kept" (`expected 'written' to be 'kept'`) and 7 of 8 new fixture cases; restored. Meta: proves write-once on fake-indexeddb, not Safari.
2. p15b re-run with the new guard (`settingsPanel.ts` backup button never added) → red at `expect(keepCopy).toBeVisible()` "element(s) not found" in 5 s instead of the 120 s test timeout; restored.
3. The two new review tests were red before the production fix (assertion: `expected 'still waiting' to deeply equal []`; `expected { ok: true } to deeply equal { ok: false, error: 'Blocked' }`).

Frozen fixtures through the real load path (`tests/fixtureLoadPath.test.ts`, new): v1, v1-fresh, v1-legacy-salon, v2, v2-fresh, v2-legacy-salon, v3, v4 stored raw in fake IndexedDB → `createIdbSaveStore` → `loadSave` → `loaded`; stars, settings, learner stage and history length, puzzles and every room kept (legacy salon: `tasksDone` never shorter); the first write and a reload give the same session; the migrated raw save is kept as `backup-v<N>` byte-equal and a second copy answers `kept`. Nothing dropped.

Save format: `git diff main...HEAD -- src/core/save.ts` leaves `SAVE_VERSION` 4, `encodeSave` and `MIGRATIONS` unchanged (`decodeSave` uses `saveProblem`, and `validateSave` is `saveProblem === null`, so the accepted set is the same); `tests/fixtures` only gains `save-v1-legacy-salon.json`; the new keys (`profile:default:backup-status`, `martynka:unavailableStarts`, `martynka:writer`, channel `martynka-save`, `REGISTRY_KEYS.roomProblems`) are outside `SAVE_KEYS` and `encodeSave`.

No DB server, no write endpoint, no network call and no external identifier in this slice: everything stays on the device (IndexedDB, localStorage, sessionStorage, BroadcastChannel); the writer id is a random per-tab UUID and `encodeSave` writes `writer: ''`.

Hooks: no change to `.claude/settings.json` or hooks, no `--no-verify` in the branch history.

Parent-facing Polish copy (gaps 126-138) read as a parent: calm, honest, short, grammatical. "Tej kopii nie da się zapisać: stan gry jest uszkodzony." (133) is the sharpest. It is accurate because nothing is exported. No change.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | WARNING |
| Architecture | PASS |
| Pattern Consistency | WARNING |
| Success Criteria | PASS |

## Findings

### F1 — `readBackups` had no time limit and could freeze the settings panel

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/autosave.ts `createAutosaver` → `readBackups`; src/scenes/UIScene.ts `openSettings`
- **Detail**: `UIScene.openSettings` waits for `saver.readBackups()` after the adult gate. A store that never answers (the `hang` case after "Graj dalej") kept the panel closed with the input switch held, which blocked the parent's only way to "Zapis gry", import and reset. The e2e stores answer at once, so no spec caught it.
- **Fix**: `limited(store.readBackups())` (write limit) + test "a store that never answers gives no copies after the write limit".
- **Decision**: FIXED

### F2 — The first old-version copy now follows the first v4 write

- **Severity**: ⚠️ WARNING
- **Impact**: 🔬 HIGH — architectural stakes; think carefully before deciding
- **Dimension**: Safety & Quality
- **Location**: src/core/autosave.ts `attempt`, `startCopy`
- **Detail**: Phase 5 made every write go before the copy, including the first one after a migration. Before that, the copy went first. If the page dies between the v4 write commit and the copy commit (a window of a few ms, most likely on a hidden flush right after launch), the raw old save is gone. The progress is safe and complete; the backup is not. The stored record already says `lost`. The plan accepts this explicitly (Known risks "Copy after write", decision 8, "copy-before-write rejected"), so it is a policy risk, not drift. The reviewer tried copy-first on the first attempt: 16 unit tests that phase 5 built on the plan's order went red (plus 2 e2e specs). Reverted.
- **Fix**: none in review. Follow-up 23 asks for a [human] decision at ship.
- **Decision**: ACCEPTED (plan decision 8), follow-up 23

### F3 — `replace` checked its gate only before waiting for the write in flight

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/autosave.ts `replace`
- **Detail**: If an autosave in flight was refused with `OtherWriterSave` (or the page went fatal) while the parent confirmed an import or reset, `replace` still wrote in `replace` mode over the other window's newer save. The dialogs promise no replace under `otherTab`. This existed before the slice, but phase 8 made `otherTab` reachable earlier.
- **Fix**: the gate is asked again after `await inflight` + test "a write refused by another window while the parent confirmed blocks the replace too" (only one `normal` write reaches the store).
- **Decision**: FIXED

### F4 — Seam sweep missed stale text (row 13.6 failed before the fix)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: CLAUDE.md (S-15 and save-v2-backup-health sentences), src/data/balance.ts `save.backupAttempts` comment, src/main.ts `start` seam comment, src/data/pl.ts DESIGN-GAP 129/131 comments
- **Detail**: CLAUDE.md still said "a failed copy blocks the write and the v1 save stays" and "a `hidden` flush after one failure gives up at once". The second is a phrase the plan's sweep named. The balance comment still said "written without the copy". The main.ts seam list lacked `slowfail`. In `pl.ts` the 129 comment sat above `olderWriter`, and the 131 comment pushed gap 50's comment onto `backupExport`.
- **Fix**: text corrected in all five places.
- **Decision**: FIXED

### F5 — `unavailableStarts` counts restarts of one failure episode

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/storage/startCounter.ts `bump`; src/main.ts `start`
- **Detail**: Any two non-timeout `unavailable` starts reach `forceAfterStarts`: a reload, or a second tab during one wedged-IndexedDB episode. The counter is not reset on an `unreadable` start. A storage that can read but not write returns a stale count. The force step still needs two parent taps, so this is not a silent loss.
- **Fix**: follow-up 24 (time-separated count, reset on any answered read).
- **Decision**: DEFERRED, follow-up 24

### F6 — `guardedPut` overwrites on a failed read in normal mode (pre-existing)

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/storage/idb.ts `guardedPut` `read.onerror`
- **Detail**: This dates from load-and-tab-guard. A read error inside an ordinary autosave puts without a verdict, which bypasses the new `OtherWriterSave`/`PreviousPageSave` refusal. It is not introduced by this slice.
- **Fix**: follow-up 25 (reject `StoreReadFailed` in normal mode).
- **Decision**: DEFERRED, follow-up 25

### F7 — `putBackupOnce` puts after a promise hop; a forced replace takes no copy

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Safety & Quality
- **Location**: src/storage/idb.ts `putBackupOnce`; src/core/autosave.ts `replace`, `noteOwed`
- **Detail**: The put depends on the transaction staying active across a microtask. That is unproven on Safari 14; on failure the copy is always `skipped` and recorded. A forced replace over migration-failed or unknown-version saves takes no write-once copy of the raw value. `noteBackup` retries through `run` and may overwrite a fresher `kept` record.
- **Fix**: follow-up 26.
- **Decision**: DEFERRED, follow-up 26

### F8 — p15b went red only by the 120 s test timeout

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/e2e/save-backup-health.spec.ts "#2 #7 SV2-04 …"
- **Detail**: `tap()` on a missing button waited out the whole test.
- **Fix**: `await expect(keepCopy).toBeVisible()` before the tap; break re-run red at that assertion.
- **Decision**: FIXED

### F9 — Unnamed small drift: `mountSaveRefusedCard` takes `detail` positionally

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/ui/dom/saveRefusedCard.ts `mountSaveRefusedCard`
- **Detail**: The plan said `{ …, detail? }`; the code takes a 4th positional argument. It works, and its one caller is in `main.ts`. Other key drifts (p6 `settings.saveMigrated.*`, p10 `saveTransfer.exportInvalid`, p7 `onOlderWriter` callback, p9 button in `settingsPanel.ts`) are named in their handoffs, and gap rows 126-138 cite the real keys.
- **Fix**: record only.
- **Decision**: RECORDED

### F10 — `olderWriter` stays a put

- **Severity**: 🔍 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/core/save.ts `writeVerdict`
- **Detail**: This is by design (plan decision 11, T-1 detection only). Only builds older than the v3 guard can trigger it.
- **Fix**: follow-up 27 (same as 21).
- **Decision**: RECORDED

## Reversed tests

Every changed expectation vs main is named in the plan or a phase handoff. That covers p2, p3, p5 (about 14 unit + `salon-load-health` ×2 + `save-migration`), p6, p7 (`saveV4` malformed generation), p8 (stale-tab #2, write-time coverage restored by p14 test c), p9 (`dialogSessions` 10→12), p10 and p11. No unnamed reversal was found.

## [reviewer] rows

1.6, 2.5, 3.6, 4.5, 5.4, 6.4, 7.4, 8.4, 9.4, 10.4, 11.4, 12.4 PASS (evidence above and in the subagent checks). 13.6 PASS after F4. 13.7 `(CI at ship)` stays open: workflow `CI`, job `check`, log lines `Tests +[0-9]+ passed` and `e2e hook: absent \([0-9]+ chunks checked\)`.

MERGE: CLEAR — no open CRITICAL after the fixes (209afe3), every automated criterion met, all suites green (unit baseline 3416 + 129, e2e baseline 127 + 5); warnings fixed or deferred with triggers.
