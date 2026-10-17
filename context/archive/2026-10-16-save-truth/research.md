---
date: 2026-10-16T23:15:24+02:00
researcher: Claude (autonomous run 2026-10-16-audit-sweep, research step)
git_commit: 2ee9d924aec0d89d9db68a08ef7398ad6280b55c
branch: feat/save-truth
repository: Martynka-urzadza
topic: "save-truth: what the parent is told about save, import/reset and a stale tab (15 MEDIUM + 12 LOW audit ids)"
tags: [research, save, autosave, idb, import, export, stale-tab, broadcastchannel, saveHealth]
status: complete
last_updated: 2026-10-16
last_updated_by: Claude (autonomous run, research step)
---

# Research: save-truth

**Date**: 2026-10-16T23:15:24+02:00
**Git Commit**: `2ee9d92` (branch `feat/save-truth`, cut from main `24b3e4b`; only a docs commit on top)
**Repository**: Martynka-urzadza

## Research Question

From `change.md` (no interview, autonomous run): for every in-scope finding (15 MEDIUM: SVB-01..04, SRR-01, SRR-08,
SRR-09, SV2-04, V-1, P-1, V-4, S12-07, S12-08, T-2, R-4; 12 LOW: T-1, T-3, T-5, FU-3/P-8, S12-04, S12-05, SRR-10,
SRR-11, SV2-07, SV2-11, C-2r, L-S1), what is the root cause (file + symbol), the smallest fix, the test that fails
first (unit or e2e), and the risk to existing behaviour, above all to saves already on children's devices (the v1–v4
fixtures must still load, and backups must never be lost). Also: answer the open unknowns in `handoff.md` §5, prove
that every new piece of storage sits outside the save, and check BroadcastChannel on the iPadOS versions the game runs on.

## Summary

- **The save format stays v4.** No fix needs a new field in the save record:
  - `encodeSave` in `src/core/save.ts` builds the record field by field.
  - `SAVE_KEYS` in `src/data/layout.ts` lists exactly six registry keys, and `tests/saveKeys.test.ts` pins that list.
  - Every new piece of state below is either a separate IndexedDB key, Web Storage, a channel message, or a runtime
    `AutosaveStatus` field.
- **Every root cause is confirmed in the current code** (table in § Findings). Most fixes are small and live in pure
  `core`, so a unit test fails first. Four need a browser to prove: T-2 and T-5 (`stale-tab.spec.ts`), SVB-02 (a new
  seam `slowfail`) and SVB-04 (the existing `writehang` test changes its assertion).
- **Two earlier decisions are reversed on purpose and need the plan to say so:**
  1. SRR-09 makes `migration-failed`/`unknown-version` saves need the force step. The existing tests
     `tests/autosave.test.ts` "a %s save is still replaced (the way out)" and `tests/saveFile.test.ts` "an unreadable
     (%s) save is named, never summarised (overwriting stays allowed)" fail first, by design.
  2. SRR-01 must **not** rename the reason of a v2 save that was already invalid to `migration-failed`.
     `tests/legacySalonMigration.test.ts` "the step is total: … gives corrupt, never migration-failed" pins that
     decision. Recommendation: keep `reason: 'corrupt'`, add `from` and `problem` to the result, and let the gate and the
     card treat "corrupt after a migration" (`from < SAVE_VERSION`) like `migration-failed`.
- **A new insight for SVB-01, P-1, V-6 and V-7: the copy does not have to come before the write.**
  - The raw old save stays in memory for the whole session (`AutosaverOptions.migrated.raw`).
  - So when the page is being hidden after a failed copy, the autosaver can write the v4 progress now and keep the copy
    owed, retrying it after the write until `backupAttempts` is used up.
  - Only killing the page loses that copy. Today a single failed copy while the page is hidden loses it for good.
  - The order "copy before write" only protects against a crash in the middle of a write. The single-key IndexedDB
    write is already atomic, so that protection buys little.
- **Write-once `backup-v<N>` (FU-3/P-8).** The idb-keyval 6.3.0 `update` always puts, so it cannot skip an existing
  key. Recommended instead: a custom `s('readwrite', os => …)` callback that runs `os.count(key)` and, only when the key
  is absent, puts the copy and the `backup-status` record in the same transaction, in the style of `guardedPut`. Use
  `count`, not `getKey`: the build targets `safari14`, and `getKey` needs Safari 15+ (recall, not verified).
- **SRR-08: keep the `localStorage` counter (change.md decision 3 holds), best-effort.** localStorage keeps working in
  some cases where IndexedDB fails: iOS Lockdown Mode, hung or lost IDB connections, and old Firefox private mode. It
  fails together with IndexedDB when Chrome blocks site data (the getter throws `SecurityError`). In that case the
  counter stays at 0, nothing can be forced, and the copy "Jeśli to się powtarza…" is false only in that one branch.
  The plan must word the 0-counter branch (see Open Questions).
- **T-2: BroadcastChannel is available from Safari/iPadOS 15.4** (MDN: Baseline since March 2022). The project states
  no minimum version: Vite's default target is `safari14`, and `randomWriter` in `idb.ts` already falls back when
  `crypto.randomUUID` is missing. Plan:
  - feature-detect with `typeof BroadcastChannel === 'function'`;
  - wrap the constructor and `postMessage` in try/catch;
  - when the channel is missing, keep today's behaviour (the refusal at the next write in `guardedPut`);
  - treat the channel as a hint only: `writeVerdict` stays the authority.
  A Safari tab and a home-screen app do not share storage, so they cannot clash and need no channel.
- **T-3: a writer id in sessionStorage alone would break B-1.** Duplicating a tab copies sessionStorage, and
  `writeVerdict` never refuses an equal `writer`, so two duplicated tabs would never refuse each other. Recommended: a
  two-part id `tabId:loadNonce`, where `tabId` lives in sessionStorage and `loadNonce` is drawn fresh on every load. On
  `pagehide` the page records its nonce as "ended" in sessionStorage. A stored record counts as the same tab's previous
  document only when its `tabId` matches and its nonce is in the ended list. A duplicated tab copies that list too, but
  the original's live nonce is not in it, so the original is still refused.

## Detailed Findings

### A. Load path and decode (V-1, SV2-07, C-2r, L-S1, SRR-01, SVB-02)

- `decodeSave` (`src/core/save.ts`) returns `{unreadable, reason:'corrupt'}` in three places, with no field and no
  `from`:
  - the shape check at the top;
  - `!validateSave(current)` after the migration loop (SRR-01);
  - the final `catch` (L-S1).
  The `migration-failed` variant carries `step`.
- `loadSave` (`src/core/autosave.ts`) maps the result to `LoadOutcome` `{kind:'unreadable', reason, raw}` and drops
  `step` (SV2-07).
- `main.ts` `start` shows `pl.saveFailed.detail(reason …)`, which reads only "Kod: corrupt", and warns
  `Save unreadable (${reason})` (C-2r).
- **Smallest fix.**
  - Widen the unreadable `DecodeResult` with `from: number | null` and `problem: string | null`. Fill `problem` with
    `saveProblem(current)` after the migration loop, or with `'exception'` plus an error name in the final catch.
  - Carry the same fields, plus `step`, in `LoadOutcome`.
  - `detail` becomes `Kod: corrupt/<problem>`.
  - The warn and the autosaver `InvalidSave` log in `attempt` add `saveProblem(encoded)` (C-2r).
  - `importProblem` in `save.ts` stays for the import path. `parseImport` already uses it.
- **SRR-01.** Keep `reason: 'corrupt'`, because `tests/legacySalonMigration.test.ts` pins "never migration-failed" for a
  v2 save that was already bad. Downstream:
  - `cardCopyFor` (`src/core/saveHealth.ts`) treats `corrupt` with `from !== null && from < SAVE_VERSION` like
    `migration-failed`, so the parent sees "stary zapis nietknięty + eksport", which is FR-021;
  - `replaceGate` gets a `loadMigrated` input, or a derived reason, so the SRR-09 force rule covers it.
- **Tests that fail first:**
  - `tests/save.test.ts`: the cases that expect `toEqual({kind:'unreadable', reason:'corrupt'})` after a migration;
  - `tests/legacySalonMigration.test.ts`: the "step is total" cases;
  - `tests/e2eSave.test.ts` `corrupt`.
  All of them use exact `toEqual`, so adding fields makes them fail by design. Then add a new case that expects
  `problem: 'stars'`.
- **Risk to devices.** The decode stays total (it never throws) and the set of accepted saves does not change. Only the
  report changes. The v1–v4 fixtures decode exactly as before (`ok` branch untouched).
- **SVB-02.**
  - In `main.ts` `start`, `slowCard`'s `onWait` does `if (late.kind === 'unavailable') return 'still-slow'`. Core
    (`loadSave`'s `settle(ms,false)`) already returns the real error name.
  - Fix: return `still-slow` only when `isTimeoutError(late.error)`. Otherwise `console.warn` the name, settle, remove
    the card and `resolve(late)`. The normal card path (`cardCopyFor` → `pl.saveUnavailable`, `Kod: <name>`) follows,
    because `outcome !== first`.
  - Optionally extract a pure helper `lateReadVerdict` (core) so a unit test fails first.
  - E2E: no seam produces a late *error* today. `unavailable` rejects at once, `hang` never answers, and `slow` resolves
    a valid save after `E2E_SLOW_READ_MS`. Add the seam `slowfail`:
    - it rejects `UnknownError` after `E2E_SLOW_READ_MS`;
    - add it to `E2ESaveSeam`/`E2E_SAVE_SEAMS` in `src/testing/e2eHook.ts` and to the two `seam === 'hang' || seam ===
      'slow'` checks in `start`;
    - the `e2eSave` marker in `vite/e2eHookGuard.mjs` already covers it;
    - `tests/e2eSave.test.ts` and `tests/e2eHookGuard.test.ts` list the seams and need the new value;
    - the spec goes in `save-backup-health.spec.ts`, next to `openSlowCard`.
  - Risk: low. The `hang` path still ends in `stillSlow`, because its second limit is `error:'timeout'`.

### B. Autosaver copy, retry and timeouts (SVB-01, SVB-03, P-1, V-6/V-7, SRR-10, SRR-11, T-1)

- **SVB-01, cause.** In `src/core/autosave.ts` `attempt`, catch branch `if (reason !== 'hidden' && backupFails <
  options.backupAttempts) throw e`: when the page is hidden, the first failure gives up. Also
  `if (reason === 'hidden' && backupFails > 0) giveUpCopy = true`. On a tablet, hiding is the common flush, so "3
  attempts" is in practice 1 (audit 1314, SVB-01). `skipBackup` only logs. `migrationOf` (`src/core/saveHealth.ts`)
  needs `status.migratedFrom` and `status.writes`, both session-only, so the fate of the copy is gone at the next start.
- **SVB-01, fix.**
  1. When a copy fails while the page is hidden, write the v4 progress and leave `backup = 'failed'` (still owed). Do
     not call `skipBackup`.
  2. The next attempts retry the copy after their write, while the raw value is in memory, until `backupFails >=
     backupAttempts`; then `skipped`. This also fixes V-7: once skipped, never retry, whatever the write result. Count a
     failed copy once per attempt (V-6), with no second `failures++` when the write fails too.
  3. Persist the copy's fate in IndexedDB key `profile:default:backup-status`: `{from, result: 'kept'|'lost'|'uncertain',
     error, at}`.
     - `kept` is written in the same transaction as the copy.
     - `lost` is written best-effort (catch and log) at `skipBackup`.
     - `uncertain` when the last copy error is `timeout`, since the copy may still land (the SVB-01 timeout part).
  4. At start, `main.ts` reads the record and the presence of `backup-v1..v3` through a new store method (for example
     `readBackups()`). An `uncertain` record with the copy present is shown as kept. A runtime `AutosaveStatus.backupRecord`
     feeds `migrationOf`, so the line survives later launches.
- **SVB-01, tests that fail first:**
  - `tests/autosave.test.ts`: a new case "a hidden flush after a failed copy writes progress and keeps the copy owed", and
    the existing cases "after a failed copy the page-hide flush writes v2 without trying the copy again" and "the
    third failed copy in a session writes v2 without the copy, once, … (SV2-01)" change;
  - `tests/saveHealth.test.ts`: the migration line comes from the record without `writes`;
  - `tests/idbStore.test.ts` (fake-indexeddb): the record written with the copy.
- **SVB-01, risk.**
  - Today's comment in `attempt` ("the child's progress is worth more than the raw old bytes") is kept and even
    strengthened: the progress is written earlier, never later.
  - The copy can only be lost by a kill before a later successful copy, which is today's outcome as well.
  - Backups are never overwritten (write-once, below).
- **P-1 (= 2217 P-1/P-2, F8), cause.** `save`'s loop stops when `attempt` returns false. `arm` is called only from
  `markDirty` and the start branch, so a failed first write after a migration waits for the next change or hide.
- **P-1, fix.**
  - In `save`, after a failed attempt and only while `!writesOff() && options.migrated && migrationWrittenAt === null`,
    call `arm()`. Bound it by a retry count, for example `balance.save.backupAttempts + 1`, so the copy gets its tries
    and then the write goes ahead without it. A store that never works then stops retrying, as today.
  - `migrationOf` gets a third state, `pending` ("przenoszenie w toku"), when `migratedFrom !== null` and
    `migrationWrittenAt === null`.
  - Test that fails first: `tests/autosave.test.ts`, fake timers, `store.backup` rejecting once: a second attempt with no
    `markDirty`.
  - Risk: more log lines while a store is broken. They are bounded by the cap.
- **SVB-03, cause.** `withTimeLimit` drops a late success ("a late success is dropped"). `attempt` counts a timeout as an
  ordinary failure. `stateOf` turns it into `failing`, and `pl.settings.saveFailing` is one sentence for both a timeout
  and a rejection.
- **SVB-03, fix.**
  - Add an optional `onLate(outcome)` observer to `withTimeLimit`, attached to `work` only after the limit fired. It only
    observes, so the abandoned write stays abandoned, and `idb.ts`'s `mayRetry` rule is unchanged.
  - The autosaver records a runtime `lateWrite: 'landed'|'failed'|null`.
  - `saveHealthView` gives `failing` with `stage` and `error === 'timeout'` its own copy, "mogło się zapisać" (new pl
    key, DESIGN-GAP).
  - Test that fails first: `tests/autosave.test.ts` with a store write that resolves after the limit (fake timers), and
    `tests/saveHealth.test.ts` for the copy key.
  - Risk: none to stored data. The store's own `base` is already advanced inside `createIdbSaveStore.write` when the late
    write lands.
- **SRR-10.** `replace` returns `Busy` and `InvalidSave` without `log`. Fix: add `log` with `saveProblem(state)` for
  InvalidSave. Unit test: the `t.logs` count.
- **SRR-11.** `Autosaver.block(reason)` keeps no error, and `offState` for fatal shows `status.lastError`.
  - Fix: `block(reason, error?)` with a runtime `fatalError`. The error boundary in `main.ts` passes `errorName(error)`
    (its callback receives the error).
  - Test that fails first: `tests/saveHealth.test.ts` "a fatal block carries lastError as code, or null" (rewritten).
- **T-1.** In `writeVerdict` (`src/core/save.ts`), a stored record without `generation` counts as generation 0 and is
  put without a word.
  - Fix: a third outcome, still a put, `{kind:'put', generation, olderWriter: true}`, when
    `storedVersion < page.version && page.base > 0`.
  - The condition `base > 0` excludes the legitimate first write after a migration, because a migrated v3 is read with
    base 0. A page that loaded v4 and then saw a v3 written by an older build has `base >= 1`, so it is detected.
  - `guardedPut` resolves with the flag. The store surfaces it, and the autosaver sets a runtime `olderWriterSeen`, one
    `console.warn` and one "Zapis gry" line.
  - Gap that stays: a v3 written over a v3 that this page has not written yet (both base 0) goes undetected. That is a
    migration-time race, acceptable for detection only.
  - Tests that fail first: `tests/saveV4.test.ts`/`save.test.ts` `writeVerdict` cases, and `tests/idbStore.test.ts`.
  - The audit is `2026-10-16_1419` (it marks T-1 medium; `change.md` lists LOW).

### C. Store: readable, write-once backups and the status record (SV2-04, FU-3/P-8, SVB-01)

- `createIdbSaveStore.backup` (`src/storage/idb.ts`) is `run(s => set(key:backup-v${from}, raw, s))`: a plain set,
  which overwrites on a second migration (P-8). There is no read path (SV2-04). `SaveStore` in `autosave.ts` has only
  `backup`.
- Check of idb-keyval 6.3.0 (`node_modules/idb-keyval/dist/index.js` `update`): it runs `get` and then **always** runs
  `put(updater(old))`, so it cannot skip a write.
- Recommended shape: `backup` becomes a `s('readwrite', os => …)` callback, like `guardedPut`. It runs `os.count(k)` and,
  only when the count is 0, puts the raw copy and the `backup-status` record `kept`. It resolves `'written'|'kept'` on
  `tx.oncomplete`.
- New `SaveStore` methods:
  - `readBackups(): Promise<{from:number; raw:unknown}[]>`: plain `get` of `backup-v1..v{SAVE_VERSION-1}`;
  - `backupStatus()` read;
  - `noteBackup(result)` write.
  The in-memory e2e store (`e2eSaveStore` in `src/testing/e2eHook.ts`) and the test stores in `tests/autosave.test.ts`
  must implement them. `SaveStore.backup` is "required, so a store can never skip it", so the new methods should be
  required too.
- **SV2-04, UI.** A "Zachowaj kopię starego zapisu" button in "Zapis gry" (DESIGN-GAP), shown only when
  `readBackups()` found one. It exports through the existing `exportFileText({kind:'raw', reason:'backup-v<N>', raw})`
  and `openSaveExportDialog`. Such a file can be imported again: `parseImport` reads `parsed.raw` for `kind:'raw'` and
  migrates it through `decodeSave`. This is the direct reading of FR-021 "możliwość eksportu" and was the rejected
  option B of save-v2-backup-health, now fired.
- **Risk.**
  - Write-once means a second migration (P-5/T-1 scenario) keeps the **first** copy. The later raw bytes of that version
    are then not kept. `stale-tab-and-health` plan-brief had chosen "latest raw v3 is more recent progress"; this change
    reverses it per FU-3/P-8.
  - Existing backup keys stay readable and untouched (no migration of keys).
  - The status record never gates a save write: a failure there is logged only.

### D. Replace, gate and dialogs (SRR-08, SRR-09, SVB-04, S12-04, S12-05, S12-07, S12-08, R-4)

- **SRR-09.**
  - `replaceGate` (`src/core/autosave.ts`): `blockedBy === 'unreadable'` gives `loadReason === 'future' ? 'Blocked' :
    'ok'`, so `migration-failed` and `unknown-version` are replaced with no warning.
  - `deviceSaveView` (`src/core/saveFile.ts`) returns `{kind:'unreadable'}` for them. The dialogs then show
    `pl.saveTransfer.deviceUnreadable` and replace on "Wczytaj" without the force step.
  - Fix: return `force ? 'ok' : 'Blocked'` for `migration-failed`, `unknown-version` and migrated-corrupt (SRR-01).
    `deviceSaveView` maps them to `blocked` with a new cause and `forceable: true`, which reuses the existing two-step
    "Zastąp mimo to" and `forcedWarning`.
  - Tests that fail first (intended reversals): the two tests named in the Summary.
- **SRR-08.**
  - Gate: `unavailable` (not a timeout) is forceable on the first start.
  - Fix:
    - a small `src/storage/startCounter.ts` (pattern: `src/storage/soundPrefs.ts` `deviceStorage()`, every access in
      try/catch, `write` returns false) with the `localStorage` key `martynka:unavailableStarts`;
    - `main.ts` increments it on an `unavailable` (non-timeout) outcome and resets it on `loaded`/`fresh`;
    - the value goes into the autosaver as runtime `unavailableStarts`, and `replaceGate` allows force only when it is
      2 or more.
  - Tests that fail first: `tests/autosave.test.ts` "unavailable needs force…" (needs a count) and the e2e
    `save-transfer-blocked.spec.ts` #2, which forces on the first start (noted in save-v2-backup-health research). That
    spec would need two starts, or a seeded count through an e2e seam.
- **SVB-04.**
  - `failureText` (`src/ui/dom/saveSummaryView.ts`) returns `applyFailed`/`resetFailed` ("…bez zmian") for every
    unforced failure, and `siteDataAdvice` for a forced one, including `timeout`.
  - Fix: a first branch `isTimeoutError(result.error)` that returns a new `pl.saveTransfer.replaceUnconfirmed`.
  - Test that fails first: e2e `save-backup-health.spec.ts` "#2 SV2-02 a write that never answers is a named failure and
    the reset dialog comes back", which today asserts `resetFailed` under `writehang`. A unit test of `failureText` looks
    feasible: `overlay.ts` touches `document` only inside its functions (not run).
  - This edit to `saveSummaryView.ts` fires visual O2 (the colon in the reset lead line) and V2 (focus during the busy
    write: give the status line `tabindex=-1`).
- **S12-07.**
  - `saveFileToDevice` (`src/ui/dom/saveExport.ts`) returns `'downloaded'` after `link.click()`.
  - Fix: a new outcome `downloadStarted` with "sprawdź Pobrane", keeping the dialog's done branch.
  - Test that fails first: e2e `save-restart.spec.ts`, which asserts `exportOutcome.downloaded`.
- **S12-04.**
  - `UIScene.openExport` → `file()` exports `saver.current()` without `validateSave`.
  - Fix: validate first. If it fails, show the new `exportOutcome.invalid` and log `saveProblem`. The dialog needs an
    invalid path (a nullable `file()` result).
  - Test that fails first: `tests/deviceSaveWiring.test.ts`, a new syntax assertion. That also closes the fired O4
    follow-up (assert the `deviceSaveView` argument and `warning`).
- **S12-05.**
  - `UIScene.openImport`/`openReset`: `device.kind === 'broken'` → `closeSettings()` silently.
  - Fix: log `saveProblem(saver.current())` and show one line (a new `pl.saveTransfer.deviceBroken` through the dialogs'
    blocked branch).
  - Test that fails first: `tests/deviceSaveWiring.test.ts`.
- **S12-08.**
  - `saveImportDialog.ts` `stepOne`: a `file.text()` rejection → `refuse('not-json', null)`.
  - Fix: add `'unreadable-file'` to `ImportRejection` (`saveFile.ts`) and `refuse('unreadable-file', errorName(e))`.
    The exhaustive `rejected` record in `pl.ts` forces the key.
  - Test that fails first: `tests/saveTransferCopy.test.ts`, which lists every rejection reason.
- **R-4.**
  - `validRoom` checks shape only.
  - `src/core/rooms.ts`: `roomDone` is `tasksDone >= tasks.length`, so an over-count shows as done. `shownVariant`
    reads `chosen[slot]` without regard to `tasksDone`. That is the audit's example: `chosen.curtains` with `tasksDone:
    7` shows the curtains as bought and still asks to pay.
  - `saveSummary` clamps silently.
  - Fix: a pure `roomStateProblems(rooms, catalogue) → {room, kind}[]` in `src/core/rooms.ts`, report only, with these
    kinds: `unknown-room`, `tasks-overflow`, `unknown-slot`, `chosen-not-bought`, `variant-out-of-range`.
    - At load: one `console.warn` and a runtime registry key (never in `SAVE_KEYS`) for a "Zapis gry" line.
    - At import preview: `saveSummary` gains a `mismatch` flag, giving one preview line.
    - It works on a validated `SessionSave`, so it needs no `isRecord`; the "fourth copy" trigger does not fire.
  - **Caution:** every v1–v4 fixture holds a `living` room that the catalogue does not have. `unknown-room` would flag
    them all, and since 2026-10-13 real devices could hold `living` from S-09 placeholder builds. The plan should either
    leave `unknown-room` out of the parent-facing line (log only) or accept the line on those devices.
  - Tests that fail first: `tests/rooms.test.ts`, `tests/saveFile.test.ts`.

### E. Stale tab (T-2, T-3, T-5)

- **T-2.** No channel exists (`grep BroadcastChannel src` is empty). Fix:
  - `src/storage/saveChannel.ts`: feature-detect, try/catch around the constructor and `postMessage`, name
    `martynka-save`, message `{writer, generation}`.
  - The store (or `main.ts`) posts after every successful `guardedPut`, `replace` included.
  - On a message with `writer !== mine` and `generation > base`, a new autosaver entry (for example
    `noticeOtherWriter()`) shares the `first`/`onBlocked` logic of `attempt`'s refusal branch, so the card shows once
    and writes stop.
  - The message is never stored.
  - E2E: extend `tests/e2e/stale-tab.spec.ts` #2. After window B's `playSavedRound`, window A's `blockedBy` becomes
    `otherTab` and the card shows **without** `staleWork` (Playwright Chromium pages of one context share the channel).
  - Unit: autosaver `noticeOtherWriter` blocks and calls `onBlocked` once.
  - Risk: a false positive could block a healthy tab. The guard compares against the page's `base` (a known, written
    generation), and the T-3 same-tab rule applies to the channel too.
- **T-3.**
  - `randomWriter` per `createIdbSaveStore` call: a reload is a new writer, and a late write from the previous document
    refuses the new page ("inne okno" with no other window).
  - Fix: the two-part id from the Summary. `writeVerdict` gets `page.endedWriters`. The id lives in `src/storage/` (a
    `sessionStorage` key `martynka:writer`, best-effort; a throwing `sessionStorage` falls back to today's random id).
  - Tests that fail first: `writeVerdict` unit cases (same `tabId`, ended nonce → put; same `tabId`, live nonce → refuse).
    The plan-review F4 follow-up names an e2e reload race; it is hard to make deterministic, so keep it unit-first.
- **T-5.**
  - `mountSaveRefusedCard` (`src/ui/dom/saveRefusedCard.ts`) has no detail line, and `onBlocked` in `main.ts` ignores
    `reason`.
  - Fix: an optional `detail`, reusing `pl.saveFailed.detail(reason === 'newer' ? NEWER_SAVE : OTHER_WRITER_SAVE,
    __BUILD_ID__)` and the `overlay-muted` line from `saveFailedCard`.
  - Test that fails first: e2e `stale-tab.spec.ts` / `load-and-tab-guard.spec.ts`, a new `Kod:` assertion.
  - This answers the follow-up "Settings panel unreachable under the refusal card".

### F. Small items (V-4, SV2-11)

- **V-4.** No frozen v1 fixture of the old salon exists. Every v1–v4 fixture has `living`, and only
  `save-v2-legacy-salon.json` has the old salon.
  - Add `tests/fixtures/save-v1-legacy-salon.json`: v1 shape from `save-v1.json`, `currentRoom:'salon'`, old keys from
    `LEGACY_SALON_V2` (`src/core/migrations/legacySalon.ts`), including at least one old-only key and one renamed key
    (`table`).
  - Example: `tasksDone: 6` (old spend 45) gives prefix 6 under rule B (43 < 45, then 56): the armchair is a gift and
    `table` becomes `coffee-table`.
  - Assert in `tests/save.test.ts` next to the v2 legacy-salon case: `migratedFrom: 1`, `generation: 0`, `writer: ''`,
    stars unchanged.
  - Tests only. The fixture is frozen from day one.
- **SV2-11.** In `TaskScene.freshRound`, a null `buildWordRound` falls through to dice with no log. Fix: a
  `console.warn` in the word branch. Test: `tests/freshRoundWiring.test.ts` style (TS syntax parse, the `calls('console.warn')` helper).

## Storage outside the save: proof per key

| new state | where | in the save? | when its storage throws |
|---|---|---|---|
| `profile:default:backup-status` | IndexedDB, same `saves` object store, its own key | No. `store.read` reads only `profile:default` (`createIdbSaveStore.read` → `get(key)`), and `decodeSave` never sees it. Not a registry key, so not in `SAVE_KEYS` | Written in the copy's transaction (`kept`) or best-effort (`lost`/`uncertain`). A failure is logged and never blocks `write`. When IndexedDB is gone, the save is `unavailable` anyway |
| `profile:default:backup-v<N>` (now readable, write-once) | IndexedDB, existing keys | No (same reason) | A failed read leaves the button hidden. A failed write is today's copy failure path |
| `martynka:unavailableStarts` | `localStorage` | No. Not a registry key, and `encodeSave` builds the record field by field | Getter or `setItem` throws (Chrome site data blocked, quota): the counter reads 0, nothing becomes forceable, play goes on. Pattern: `soundPrefs.ts` `deviceStorage` |
| `martynka:writer` (`tabId` + ended nonces) | `sessionStorage` | No | Throws: fall back to a fresh random writer per load (today's behaviour, T-3 unfixed on that device) |
| `BroadcastChannel('martynka-save')` | in-flight message | never stored | Missing (Safari < 15.4) or throws: no early signal; `guardedPut` still refuses at the next write |
| runtime status fields (`backupRecord`, `lateWrite`, `fatalError`, `olderWriterSeen`, `unavailableStarts`, room problems) | `AutosaveStatus` / a registry key | No. `status()` is never encoded. Any new registry key must stay out of `SAVE_KEYS` (`tests/saveKeys.test.ts` pins the exact six) | n/a |

## Recommended phase grouping (for `/10x-plan`)

1. **Decode truth** (unit, `tdd`): V-1, SV2-07, L-S1, C-2r, SRR-01 (reason kept, `from`/`problem` added), V-4 fixture.
2. **Replace gate** (unit, `tdd`): SRR-09, SRR-08 (counter module + gate), SRR-10. Includes the deliberate rewrites of
   the two "still replaced" tests.
3. **Store backups** (unit with fake-indexeddb, `tdd`): FU-3/P-8 write-once, `backup-status`, `readBackups`, e2e store
   parity.
4. **Copy accounting and retry** (unit, `tdd`): SVB-01 (hidden writes first, record), P-1 (bounded retry + `pending`
   line), V-6/V-7, SVB-03 (`onLate`, timeout line), SRR-11.
5. **Writer identity and T-1** (unit, `tdd`): T-3 two-part writer, T-1 `olderWriter` verdict.
6. **Panel and dialogs copy** (`impl` with unit wiring tests): SV2-04 button, S12-04/05/07/08, SVB-04, R-4 report,
   DESIGN-GAP rows from 126, O2/V2 if touched.
7. **Load card** (`e2e`): SVB-02 + seam `slowfail`.
8. **Stale tab early signal** (`e2e`): T-2 channel + T-5 code line, `stale-tab.spec.ts`.
9. Small: SV2-11 (`impl`), and it may fold into phase 1 or 6.

## Code References

- `src/core/save.ts`: `decodeSave`, `saveProblem`, `importProblem`, `writeVerdict`, `validRoom`, `MIGRATIONS`, `encodeSave`
- `src/core/autosave.ts`: `LoadOutcome`, `replaceGate`, `withTimeLimit`, `loadSave`, `createAutosaver` (`attempt`, `save`, `arm`, `skipBackup`, `replace`, `block`)
- `src/core/saveHealth.ts`: `migrationOf`, `offState`, `stateOf`, `cardCopyFor`
- `src/core/saveFile.ts`: `ImportRejection`, `parseImport`, `saveSummary`, `deviceSaveView`
- `src/storage/idb.ts`: `guardedPut`, `randomWriter`, `createIdbSaveStore` (`backup`, `write`, `read`); `src/storage/soundPrefs.ts`: `deviceStorage`
- `src/main.ts`: `start` (`slowCard`/`onWait`, unreadable card, `onBlocked`), the error boundary's `block('fatal')`
- `src/scenes/UIScene.ts`: `openExport`, `openImport`, `openReset`; `src/scenes/TaskScene.ts`: `freshRound`
- `src/ui/dom/`: `saveExport.ts` `saveFileToDevice`, `saveImportDialog.ts` `stepOne`, `saveSummaryView.ts` `failureText`, `saveRefusedCard.ts` `mountSaveRefusedCard`, `saveFailedCard.ts`
- `src/testing/e2eHook.ts`: `E2ESaveSeam`, `E2E_SAVE_SEAMS`, `e2eSaveStore`; `vite/e2eHookGuard.mjs` marker `e2eSave`
- `src/data/layout.ts`: `SAVE_KEYS`; `tests/saveKeys.test.ts`
- `node_modules/idb-keyval/dist/index.js`: `update` (always puts)

## Architecture Insights

- `core` stays pure. Browser storage (localStorage, sessionStorage, BroadcastChannel) belongs in `src/storage/`, like
  `soundPrefs.ts`, and is wired in `main.ts`. The autosaver gets plain values or callbacks.
- One rule per decision is the existing convention (`replaceGate` shared by `replace` and `deviceSaveView.forceable`;
  `writeVerdict` shared by every write). SRR-01, SRR-08 and SRR-09 should all go through `replaceGate`, never through a
  second check in the dialogs.
- Every new parent-facing line is a DESIGN-GAP. The kit has no parent views, and the last row is 125.

## Historical Context (from prior changes)

- `context/archive/2026-10-15-save-v2-backup-health/` (plan, research, follow-ups):
  - the copy policy "3 tries, hidden gives up after one": SVB-01 revises it (supported as history, reversed now);
  - option B, the readable copy, was rejected then: now fired as SV2-04;
  - the SRR-08 counter was deferred, with the note that it changes `save-transfer-blocked.spec.ts` #2.
- `context/archive/2026-10-15-salon-load-health/`: `backup-v2` under the same policy, the follow-up "`isRecord` copied
  three times" (still three: `save.ts`, `saveFile.ts`, `migrations/legacySalon.ts`), and the BroadcastChannel follow-up.
- `context/archive/2026-10-16-stale-tab-and-health/`:
  - plan-brief "a later migration overwrites `backup-v3`": reversed by FU-3/P-8;
  - follow-ups "Earlier stale signal" (T-2), "Reload race F4" (T-3) and "P-8".
- Audit sources:
  - S12-* in `2026-10-14_0445`;
  - SV2-*, SRR-*, C-2r, L-S1 in `2026-10-15_0253`;
  - SVB-* in `2026-10-15_1314`;
  - V-*, P-1, P-8 in `2026-10-15_2217`;
  - R-4 in `2026-10-16_0915`;
  - **T-1..T-5 in `2026-10-16_1419`** (`change.md` names 0915 for T-1..T-5; the rows are in 1419).

## Related Research

- `context/archive/2026-10-15-save-v2-backup-health/research.md`
- `context/archive/2026-10-16-stale-tab-and-health/` (plan-brief, follow-ups)

## Open Questions (decisions for `/10x-plan`, with recommendation)

1. **SRR-08 when localStorage is blocked together with IndexedDB.** The counter stays at 0 and force never unlocks.
   Recommend: show `deviceUnavailable` without the "możesz go zastąpić" promise while the count is below 2, with a
   wording variant (one pl key), so the copy is true in both branches.
2. **R-4 `unknown-room` for the `living` room** on early devices: log-only (recommended) or parent line.
3. **SRR-01 card copy** for migrated-corrupt: reuse `saveMigrationFailed` (recommended; FR-021) or a new copy.
4. **P-1 retry cap**: `backupAttempts + 1` (recommended) or its own `balance.save.migrationRetries`.
5. **The e2e seam for SRR-08** (`?e2eSave=` seeding the counter, or two page loads in the spec). Recommend two loads,
   with no new seam.
6. **Platform facts recalled, not verified:**
   - BroadcastChannel behaviour inside an iPadOS home-screen app (no source found saying it fails);
   - the Safari version for `IDBObjectStore.getKey` (use `count`);
   - localStorage under Lockdown Mode.
   None of them blocks a decision, because every use is feature-detected or best-effort.
7. **The Phaser 4 minimum Safari version is undocumented**, so the game's real floor is unknown. The silence is noted;
   the recommendation is to feature-detect, not to state a floor in this change.

Plan and PRD silence (checked: `Martynka-urzadza.md` § 8 "Zapis postępu", § 9, M5; `prd.md` FR-020..FR-022): nothing
on keeping old-version backups after a **successful** migration, multiple tabs, timeouts, counting unavailable starts,
or catalogue checks on import. FR-021 ("nieudane przeniesienie zostawia stary zapis nietknięty i pokazuje rodzicowi
możliwość eksportu") is the one binding sentence, and it backs SRR-01, SRR-09 and SV2-04. The rest are recommendations.
