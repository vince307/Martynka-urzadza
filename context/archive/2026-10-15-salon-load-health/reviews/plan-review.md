<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Zapis v3 z migracją starego salonu, limit czasu ładowania grafiki i zapis po migracji przy starcie

- **Plan**: context/changes/salon-load-health/plan.md
- **Mode**: Deep (code verified directly by the reviewer, no sub-agent)
- **Date**: 2026-10-15
- **Verdict**: REVISE → SOUND after the in-place fixes below
- **Findings**: 0 critical, 4 warnings, 4 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING |
| Plan Completeness | WARNING |

## Grounding

Grounding: 9/9 paths ✓ (`src/core/save.ts`, `src/core/autosave.ts`, `src/main.ts`, `src/testing/e2eHook.ts`, `src/storage/idb.ts`, `tests/e2eSave.test.ts`, `tests/idbStore.test.ts`, `tests/deviceSaveWiring.test.ts`, `tests/salonRemap.test.ts`), 8/8 symbols ✓ (`MIGRATIONS`, `decodeSave`, `replaceGate`, `createAutosaver` `attempt`/`skipBackup`/`replace`, `remapLegacySalon`, `legacySalonSession`, Phaser `loader.timeout`/`loader.maxRetries` in `Config.js`, `E2E_HOOK_MARKERS` `e2eArt`/`legacy-salon`), brief↔plan ✓. Progress↔Phase: 5 phases, criteria counts 6/6/5/5/5 match, no checkboxes outside `## Progress`, `Driver:` lines tdd/tdd/impl/impl/e2e (e2e last, after the features it tests) ✓.

## Save-format scrutiny (verified against the code)

- **`MIGRATIONS[2]` never throws on raw data**: the plan makes the step total (non-object `rooms`/`salon`/`chosen` or bad `tasksDone` → input with `version: 3` → `validateSave` → `corrupt`), with a `rooms: null` test and a deliberate break. `decodeSave` already catches a throwing step as `migration-failed`, so even a defect is not data loss (card + no write: `blockedBy 'unreadable'`). ✓
- **v1 → v2 → v3 chain, one backup**: `decodeSave` loops `from..SAVE_VERSION` and returns `migratedFrom = from`; `createAutosaver` copies `options.migrated.raw` under `backup-v${from}` (`src/storage/idb.ts` `backup`). v1 → one `backup-v1` of raw v1; v2 → `backup-v2`. ✓
- **Start write vs backup policy "wait"**: `attempt` runs `store.backup` before `store.write`; a failed copy below `backupAttempts` throws before the write and the `save` loop does not re-arm, so the v2 device save is untouched until the next change or flush (F8). A `hidden` flush with one failed copy writes without it — existing accepted policy SV2-01. ✓
- **`future` / `migration-failed` cards**: an older build (`SAVE_VERSION 2`) returns `future` for `version 3` before any step runs; `replaceGate` blocks `future`; `main.ts` `cardCopies` has `future` and `migrationFailed`. ✓
- **Frozen fixtures**: criterion `git diff --stat tests/fixtures` = two new files only; the legacy fixture is generated before the bump. ✓
- **Salon tables pinned to data**: `SALON_V3_TARGET` = first 7 `SALON.tasks` (permanent test); old list pinned to `LEGACY_SALON` in phase 1, literal after its deletion in phase 2 (frozen by definition). ✓

## Open follow-ups with a v3 / next-save-format trigger

All ten rows of `change.md` are either included (F3/F4 of `save-v2-backup-health`, `backup-v2`, rollback note M-S1, S-16a rollback risk closed by `future`), already closed (`replace` takes an owed copy), or re-triggered with a reason (two-build e2e: new server infra; backup readable in-app: separate UI; `migration-failed` overwritable: step proven total; mistake-example shape: v3 does not change it). The two-cards-one-origin item was missing from the phase 4 follow-up list (F6, fixed).

## Findings

### F1 — Start write breaks an existing e2e assert and existing autosave unit tests not listed in phase 2

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 2 — Zapis przy starcie po migracji
- **Detail**: `tests/e2e/save-backup-health.spec.ts` "#2 SV2-01" asserts `backup: 'pending'` right after the task screen appears. With M-3 the autosaver tries the copy ~500 ms after creation; under `?e2eSave=backupfail` it fails and `backup` becomes `'failed'`, so the assert is racy/red while phase 2 claims e2e `+0`. About ten `tests/autosave.test.ts` cases built with `migrated` will also see the start write after `advance`.
- **Fix**: Add both files to phase 2 (SV2-01: `pending` or `failed`; the `ops` assert stays).
- **Decision**: FIXED (plan phase 2 § 1 file list)

### F2 — `tests/saveFile.test.ts` validates v2 fixtures with `saveProblem`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 — Wersja 3
- **Detail**: "names %s" and "a valid save has no problem" call `saveProblem(fixture('save-v2.json'))`; after `version !== 3` they get `'version'`. Not in the phase 1 file list.
- **Fix**: List the file; those cases move to `save-v3.json`.
- **Decision**: FIXED

### F3 — Phase 5 asserts fields the welcome snapshot does not have

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 — Spec (a) and (c)
- **Detail**: `src/testing/e2eHook.ts` `snapshot` on the welcome screen returns only `screen`, `learner`, `settings`, `inputEnabled`, `save`, `artHealth` — no `room`, no `roomArtHealth` — and "Zapis gry" needs the HUD gear, absent on the welcome. (a) asserts room and settings and (c) `roomArtHealth` on the welcome (`legacySalonSession` has `learner: null`).
- **Fix**: Write log asserts on the welcome; room, "Zapis gry" and `roomArtHealth` after `passWelcome`.
- **Decision**: FIXED

### F4 — Break p5a cannot redden test (b)

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 5 — deliberate break p5a; Phase 2 § 3
- **Detail**: `tests/fixtures/save-v1.json` has `currentRoom` "living"; phase 2 makes `repairedFrom !== null` call `saver.markDirty()`, so the v1 start write happens even with the migration arm removed. Same `markDirty` re-arms with `'change'`, so `lastReason 'migration'` holds only without a repair.
- **Fix**: p5a expects only (a) red; the reason caveat goes to Known risks.
- **Decision**: FIXED

### F5 — `E2E_LOADER_TIMEOUT_MS = 500` applies to every file of the stall run

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 § 2
- **Detail**: Under 4 workers a healthy local file could exceed 500 ms and become a stand-in; the `≥ 1` assert survives, but it adds noise.
- **Fix**: 2000 ms (still far below the test limit with `maxRetries 0`).
- **Decision**: FIXED

### F6 — Two-cards-one-origin follow-up missing from the phase 4 list

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 § 3
- **Detail**: Its trigger "first save-format change" fired; "What We're NOT Doing" defers it but no follow-up row re-triggers it.
- **Fix**: Added with a new trigger.
- **Decision**: FIXED

### F7 — H-2 limits vs the save read limit

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3
- **Detail**: Verified: `loadSave` (`balance.save.loadTimeoutMs` 5000, `slow` card) completes before `createGame`; the loader limit (12 s × 2) runs after it with the `LoadingScreen` bar visible, so the limits never add up on a blank screen. SW-cached files answer at once; offline start is unaffected. `maxRetries 2 → 1` also applies to ordinary errors (recorded in decision 6).
- **Fix**: Recorded in Known risks.
- **Decision**: FIXED (Known risks)

### F8 — Start write waits for the copy

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 § 1
- **Detail**: A failed first copy at start leaves the v2 save and does not re-arm the timer; M-3's "no repeat on every launch" holds from a successful copy or the third failure. Correct priority (copy before overwrite), but worth stating.
- **Fix**: Recorded in Known risks.
- **Decision**: FIXED (Known risks)

VERDICT: PROCEED — the v3 migration, backup chain and loader limit are sound against the code; four completeness gaps (unlisted tests, welcome-snapshot asserts, a break that cannot redden one test) were fixed in plan.md.
