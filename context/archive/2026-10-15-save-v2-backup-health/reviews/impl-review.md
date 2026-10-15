<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Nieudana kopia `backup-v1` nie wyłącza zapisu, limity czasu zapisu i uczciwy panel „Zapis gry”

- **Plan**: context/changes/save-v2-backup-health/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6
- **Date**: 2026-10-15
- **Verdict**: APPROVED
- **Findings**: 0 critical, 2 warnings (both fixed in this step), 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS (after F1) |

## Save safety, checked at the code level

The run named save safety as the main risk (SV2-01 is CRITICAL and live on devices). Each point was checked by reading the symbol and, where marked, by a break that was run again.

| Claim | Where (file, symbol) | Result |
|---|---|---|
| The v1 save is never lost before v2 holds it | `src/core/autosave.ts` `createAutosaver` → `attempt`: the copy goes to its own key (`src/storage/idb.ts` `backup`, `:backup-v<from>`). The main key changes only in `store.write(encoded)`, and `encoded` has passed `validateSave` and holds `MIGRATIONS[1]` of v1 | PASS |
| After 3 failed copies v2 is written, and the log says so | `attempt`: a failure with `backupFails < backupAttempts` is rethrown, so the attempt fails and is retried. The 3rd failure calls `skipBackup` (`autosave: writing v2 without the v1 copy`, `{ from, backupError, attempts }`) and then writes. Test "the third failed copy…" counts the store ops `['backup','backup','backup','write']` and a single log line | PASS |
| A `hidden` flush skips the copy only after a failure | `attempt`: `reason === 'hidden' && backupFails > 0` → `skipBackup` with no new try. A first attempt that is `hidden` still tries the copy, and writes even if the copy fails (plan-review F5, `[human]` 2.5) | PASS |
| Backup, write and replace have a time limit | `withTimeLimit` (one helper; `loadSave` uses it too) via `limited` in `attempt` (backup, write) and `replace` (backup, write). `replace` waits on `inflight`, which is bounded because each attempt is | PASS (break re-run, F1) |
| The idb write guard stops an older state landing after a newer one (plan-review F1) | `src/storage/idb.ts` `createIdbSaveStore`: `writeSeq` plus `run(op, mayRetry)`. A write that loses its connection is retried only if no later `write` has started. `backup` and `read` retry as before | PASS (break re-run: `run` ignores `mayRetry` → "an abandoned write … is not retried once a newer write started" red, `expected 'ok' to be 'InvalidStateError'`; restored) |
| "Graj dalej" against a late read: one `settled` outcome, and the saver stays blocked (plan-review F2) | `src/main.ts` `start` → `slowCard`: one `settled` flag is shared by `onContinue` and `onWait`. A late read after "Graj dalej" only logs `save: late read ignored`. `playedOnFirst` keeps `outcome === first` (`unavailable`/`timeout`), so `createAutosaver` gets `blockedBy: 'unavailable'` and `replaceGate` stays `Blocked` for `timeout`. A late read can never unblock a fresh session over a healthy save | PASS (e2e (e) green; p6e red per orchestrator) |
| A `future` save is never written | A late `unreadable` from `waitLonger` resolves `outcome` and shows its own card, with `blockedBy: 'unreadable'` (`writesOff`). `replaceGate` still refuses `future`, even with force (the unit test is unchanged) | PASS |
| Frozen fixtures and the save format | `git diff --stat main..HEAD -- tests/fixtures src/core/save.ts` is empty; `SAVE_VERSION = 2`; `SAVE_KEYS` unchanged | PASS |
| The e2e seam timings exist only in the hook build | `src/testing/e2eHook.ts` `E2E_SLOW_READ_MS` 2500 and `E2E_SLOWER_LOAD_TIMEOUT_MS` 5000 are read only behind `__E2E_HOOK__ &&` in `main.ts`. `npm run build` prints `e2e hook: absent (2 chunks checked)`. `balance.save` keeps `debounceMs 500` and `loadTimeoutMs 5000` and only adds `writeTimeoutMs 5000`, `slowLoadTimeoutMs 20000` and `backupAttempts 3` | PASS |

## Reviewer rows (performed here)

- 1.5: `lastFailure` exists only in `AutosaveStatus` (`encodeSave(snapshot())` never sees it). There is one helper for time limits, with no second race in `replace` or `loadSave`. `idb.ts` changes only the retry guard on `write` (no `abort`, the keys are unchanged). PASS.
- 2.7: There is one source of truth for the copy (`backup` + `backupFails`, and `backedUp` is gone). On a healthy device the copy always comes before the first v2 write (test "copies the raw v1 once, BEFORE the first write" and e2e `save-migration` "#2 … with a v1 backup first" are green). The log says `autosave: backup failed`. PASS.
- 3.4 teacher read. `saveFailingDetail` uses `countNoun`, which gives the numeral agreement 1 nieudana próba / 2 nieudane próby / 5 nieudanych prób. `saveStage` reads calm. `saveMigrated.kept` ("…Stara kopia została na tym urządzeniu.") and `.lost` ("…ale starej kopii nie udało się zachować.") are honest and blame nobody. Rows 94–95 are consistent. PASS.
- 4.5 teacher read. The `saveSlow.*` lines are calm and short, and the `note` is true (after "Graj dalej" the saver is blocked, so the earlier save stays untouched). `stillSlow` is conditional and warns that the save is removed too. The `saveOff.timeout`/`deviceTimeout` advice said "pomoże", which promised a fix; it is softened to "może pomóc" (F2). Rows 96–97 are consistent. The focus stays on "Graj dalej": `mountSaveFailedCard` calls `continueButton.focus()`, and the wait button is `overlay-secondary`. There is one `settled` flag. PASS.
- 5.6 seam sweep. There is one helper and one source of truth for the copy. No key is dead: `saveMigrated` became an object, and its only test was updated. The comments are current (`attempt`, the seams in `main.ts`/`e2eHook.ts`, and the dialogs). Gaps 43 and 45 are made consistent with 94–97. Every follow-up has a `Trigger:`. `CLAUDE.md` has the sentence. PASS.

## Findings

### F1 — The phase-1 time-limit tests went red only through the vitest timeout

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: tests/autosave.test.ts — "a hung write is a timeout failure…", "replace behind a write that never answers…"
- **Detail**: I re-ran the break (`attempt` calls `store.write(encoded)` without `limited`). Three tests failed with `Error: Test timed out in 5000ms`. That is not an assertion, it costs 5 s per test, and the message does not name the cause.
- **Fix**: A helper `hasSettled(p)` and `expect(await hasSettled(…)).toBe(true)` before awaiting the promise. With the same break both tests now fail at once with `AssertionError: expected false to be true` (10 ms and 2 ms). "an abandoned write that rejects later reaches nobody" still times out under this break; its own break is `withTimeLimit` without the catch.
- **Decision**: FIXED (58cf156)

### F2 — The parent-facing advice promised that deleting site data would fix the problem

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality (copy honesty)
- **Location**: src/data/pl.ts — `pl.settings.saveOff.timeout`, `pl.saveTransfer.deviceTimeout`
- **Detail**: "Jeśli to się powtarza, pomoże usunięcie danych tej strony" stated as certain an outcome the game cannot know, and the step it advises also removes the save.
- **Fix**: "…może pomóc usunięcie danych tej strony (to usuwa też zapis gry)". No spec matches this literal text (the e2e specs go through the `pl` keys).
- **Decision**: FIXED (58cf156)

### F3 — `replace` marks the copy `skipped` after one failure, even when its own write then fails

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Plan Adherence
- **Location**: src/core/autosave.ts `createAutosaver` → `replace`
- **Detail**: This is what the plan asks for (decision 3, `[human]` 2.6). Still, if the copy and then the replace write both fail (a hung store), later ordinary writes take v2 without trying the copy again, after 1 failure instead of 3. No progress is lost (v2 ⊇ v1), only the raw v1 safety net.
- **Fix**: A follow-up with a trigger: keep the copy `failed` (still owed) when the replace write fails.
- **Decision**: FOLLOW-UP (`follow-ups/review-fixes.md`)

### F4 — In `replace` the skip log says `attempts: 0` and is written before the write is known

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/core/autosave.ts `skipBackup` (called from `replace`)
- **Detail**: `backupFails` is not counted in `replace`, so the log's `attempts` reads 0, and "writing v2 without the v1 copy" is printed even when the replace write then fails. This is cosmetic: only the console carries it.
- **Fix**: Folded into the F3 follow-up.
- **Decision**: FOLLOW-UP

### F5 — The e2e slow-read seam is timing-sensitive

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: src/testing/e2eHook.ts `E2E_SLOW_READ_MS`, tests/e2e/save-backup-health.spec.ts `SLOW_READ_MS`
- **Detail**: The orchestrator widened the seam from 800 to 2500 ms and from 1500 to 5000 ms after a race under load. The change is in the hook build only, and production `balance.save` is unchanged. It is green in this step's full run.
- **Fix**: None now. Raise both constants together if the test flakes (handoff §5).
- **Decision**: RECORDED

### F6 — There is no e2e test for the Escape guard on the import dialog

- **Severity**: 🔵 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: src/ui/dom/saveImportDialog.ts `show`
- **Detail**: Reset has the same `busy` guard and is covered (p6d). The import guard has the same structure but no test.
- **Fix**: Already a follow-up with `Trigger: the next change to saveImportDialog.ts`.
- **Decision**: RECORDED

MERGE: CLEAR — no CRITICAL; save safety verified symbol by symbol (copy before v2, 3-try then v2 with log, hidden rule, time limits, idb write-order guard, one `settled` outcome keeping the saver blocked, future never written, fixtures byte-identical, format v2); both WARNINGs fixed; local gate green (unit 2445+34), full e2e 82 = 77+5.
