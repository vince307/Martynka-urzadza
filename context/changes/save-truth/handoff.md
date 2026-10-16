# Handoff — `save-truth` (slice fix:save-truth, audit sweep 2 of 3)

Written by the `/10x-tdd save-truth phase 5` step. Phases 1 (66c6989), 2 (739d10c), 3 (d3c2f4b), 4 (0eb15a2) and 5 (3714f3c) are committed and green. The next agent must not get two things wrong: the save format stays v4 (`SAVE_VERSION` 4, existing `tests/fixtures/` never edited), and no code path may delete or overwrite a `backup-v<N>` key.

## 1. State

| | |
|---|---|
| Branch | `feat/save-truth`, cut from `main` at `24b3e4b` |
| Commits | phases 1-4 as before, phase 5 = 3714f3c (`feat(save-truth): copy after the write, bounded retry of the first write (p5)`), plus handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | unchanged (`plan_reviewed`) |
| `## Progress` rows remaining | 61 (`grep -c '^- \[ \]' plan.md`); 5.1-5.3 ticked, 5.4 [reviewer] left |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/autosave.ts` | `attempt` now writes first: `noteOwed()` (once, before the first write that leaves the copy owed, never awaited, failures logged) -> `store.write` -> `startCopy(reason)` (detached `tryCopy(false)`, one at a time via `copying`, skipped on a `hidden` flush after a failed copy). `tryCopy` counts a failure once per try, at `backupAttempts` (or `final`) calls `skipBackup()` and `noteOwed()` (`uncertain` when `backupError` is a timeout, else `lost`). `replace`: `noteOwed` -> write -> `await copying` -> `tryCopy(true)`. A failed first write after a migration re-arms (`migrationRetries` < `balance.save.migrationWriteRetries`) |
| `src/data/balance.ts` | `save.migrationWriteRetries: 4` (= `backupAttempts` + 1, commented) |
| tests | `tests/autosave.test.ts` new describe "copy after the write, bounded retry of the first write (save-truth p5)" (11 tests); `makeStore` records `state.all` (note/write/backup order), `state.notes`, `noteHangs`, `noteFails`; e2e `save-backup-health.spec.ts` #2 SV2-01, `save-migration.spec.ts` #2, `salon-load-health.spec.ts` (both #2 tests) moved to write-then-copy |

## 3. Verification

| command | result |
|---|---|
| RED (implementation stashed, new tests in place) | 8 failures, all assertions in `tests/autosave.test.ts`: `expected [ 'backup' ] to deeply equal [ 'noteBackup', 'write', 'backup' ]`, `expected [ 'backup', 'write' ] to deeply equal [ 'noteBackup', 'write', 'backup' ]` (replace), `expected [] to have a length of 1 but got +0` (retry), `expected undefined to match object { from: 2, result: 'lost', … }`; two hang cases timed out (`Test timed out in 30000ms`) |
| Deliberately reversed existing tests | named in the plan: "after a failed copy the page-hide flush writes v2 without trying the copy again" (now "writes progress and keeps the copy owed") and "the third failed copy … writes v2 without the copy" (now: progress every time, copy given up at 3). Also changed because the copy order moved to after the write (consequence of the plan's "order becomes write-then-copy", not new behaviour): "copies the raw v1 once, BEFORE the first write", "a failing copy before the attempt limit writes nothing", "a copy that fails once…", "a page-hide flush that is the first attempt…", "a copy that hangs…", both `replace` copy tests, "a migrated start writes…: the copy first", "a failed copy keeps the device save untouched…", "a hidden flush before the timer", F3 (replace whose own write fails: copy now untried), F4 log attempts (3), "a hung copy … writes nothing"; e2e SV2-01, save-migration #2, salon-load-health #2 x2 (third reversal named in the plan: SV2-01 op order) |
| GREEN | `npm test` 3447 passed (branch baseline after p4: 3436, +11) |
| `npm run lint` / `typecheck` | OK |
| deploy scripts, `sample` E1–E6, `npm run build` | OK; build prints `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --workers=4` | full run: 125 passed, 2 failed (`salon-load-health` x2, op order, fixed after); those three spec files rerun green (10 passed); effectively 127 (baseline 127, +0). No flakes |
| `SAVE_VERSION`, fixtures | 4; `git diff --stat tests/fixtures` empty |
| Deliberate break | (a) `arm()` removed from the first-write retry: 2 red (`a failed first write … retried without markDirty`, `a retried first write that works stops the retries`); (b) hidden flush gives the copy up on first failure: 3 red (the hidden cases); both restored. Meta-check: proves the scheduler over a scripted store, not real IndexedDB timing or Safari |

## 4. Next command

`/10x-tdd save-truth phase 6`

## 5. Open

- Row 5.4 [reviewer] not ticked. Also open: 2.5, 2.6, 3.6, 3.7, 3.8, 4.5, 4.6.
- The `noteBackup` record is stored by the store (phase 4); `main.ts` still does not read `backupRecord()` (phase 6: `AutosaverOptions.backupRecord`, `saveHealthView`).
- `AutosaveStatus.backup` after the first write is still `pending`/`failed` until the detached copy ends (tests need a `settle()`); phase 6 view code must not read `backup === 'done'` as "write finished".
- `failures` now counts a failed copy once per try even when the write succeeded (`consecutiveFailures` stays 0).
- Phases 10, 11 keep their listed reversals; plan.md is the source. Phase 13 writes `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. No mixed-phase question: whole phase TDD (Driver stays `tdd`). The implementation was written once before the tests by mistake, then stashed to observe RED with the final tests (quoted in §3), then restored; no driver redirect.
2. The copy runs detached (`copying` promise) rather than awaited inside `attempt`, so a hanging copy cannot hold the next progress write or a hidden flush (child's-progress rule). Would change: a need for `inflight` to cover the copy.
3. A `hidden` flush after a failed copy skips the copy (stays owed); a first hidden flush writes, then tries the copy once.
4. `replace` is final for the copy: one try after the write, a failure gives it up (`skipped` plus record), as before.
5. e2e specs assertion order moved by the plan's rule; SV2-01 e2e now polls `backup === 'skipped'` instead of `writtenVersion`.
6. Commit message and next-phase prompts decided in place; the run stops after this phase.
