---
date: 2026-10-15T03:11:31+02:00
researcher: Claude (autonomous run 2026-10-15-fix-s14c-s14d, research step)
git_commit: 52e777a
branch: feat/save-v2-backup-health
repository: Martynka-urzadza
topic: "save-v2-backup-health: SV2-01 backup policy, SV2-02 write/backup/replace time limit, SV2-03 honest 'Zapis gry' panel, SRR-02 way out of a permanent read timeout"
tags: [research, save, autosave, saveHealth, saveFile, idb, e2e, dialogs]
status: complete
last_updated: 2026-10-15
last_updated_by: Claude (research step)
---

# Research: save-v2-backup-health

**Date**: 2026-10-15T03:11:31+02:00
**Researcher**: Claude (autonomous run, research step)
**Git Commit**: 52e777a (branch cut from `main` at 16848c6; the only extra commit is the change identity)
**Branch**: feat/save-v2-backup-health
**Repository**: Martynka-urzadza

Anchors are file + symbol (run contract: never line numbers). Finding ids come from the observability audit
2026-10-15_0253 (PR #52) and, for S12-*, the audit of 2026-10-14 04:45 (PR #42, unmerged); both are cited by id only.

## Research Question

From `change.md` (scope SV2-01, SV2-02, SV2-03, SRR-02) and the step prompt:

1. SV2-01: which of options A–D keeps the v1 save safe AND stops the silent loss of progress; how many backup
   attempts; is writing v2 without a backup acceptable, given the raw v1 is readable at every start until the first v2
   write and could be exported?
2. SV2-02: a time limit for backup, write and `replace` — value (into `balance.save`), and how IndexedDB behaves
   when a transaction is abandoned.
3. SV2-03: what the panel can truthfully say (backup state, error code, stage).
4. SRR-02: a start counter for `unavailable`/`timeout` outside the save (localStorage), or another honest way out.
5. Side questions from the handoff: attempts per session, e2e specs that pin today's behaviour, S12-07/08/12/13
   status, whether `MIGRATIONS[1]` carries every v1 field.

## Summary

- **SV2-01 → option A, N = 3 backup attempts per session, plus one exception: a `hidden` flush after at least one
  failed backup writes v2 without the copy.** Evidence: (a) the PRD guardrail "Postęp nigdy nie ginie" and FR-020
  ("po ponownym otwarciu stan jest identyczny") are violated by today's behaviour on every start; option D keeps
  that violation. (b) FR-021 speaks of a *failed migration* ("nieudane przeniesienie zostawia stary zapis
  nietknięty"); a failed *backup* after a successful, validated migration is not covered — the PRD is silent, so this
  is a recommendation. (c) Everything a v1 build ever wrote reaches v2: `MIGRATIONS[1]` is a spread plus
  `variants: startingVariants()`, `decodeSave` validates the result with `validateSave` before the session starts,
  and `encodeSave`/`toSession` copy every field of the v1 schema. The backup only protects against a migration bug
  that is not visible today (fixtures `save-v1*.json` load). (d) A first round makes roughly 7–12 write attempts, so
  N = 3 is reached in the first minute of play. Options C (separate key, changes the read path, likely fails under the
  same quota) and B (an extra export button) are not needed: the existing "Zapisz kopię" export already writes the
  full v2 state, which contains all v1 content.
- **SV2-02 → race backup, write and `replace` against a timer exactly like `loadSave`'s `limit`; new
  `balance.save.writeTimeoutMs = 5000`; a short e2e override like `E2E_LOAD_TIMEOUT_MS`.** An abandoned IndexedDB
  transaction is not cancelled by dropping its promise: idb-keyval `set` resolves on the transaction's `complete`
  and offers no abort, and readwrite transactions on one store run in creation order, so a hung one makes every later
  write (including `replace`) wait behind it. Consequences the plan must handle: a timed-out attempt keeps `dirty`
  true and must free `inflight`; a late completion lands *before* any later write, so the final value stays the
  latest write; a timed-out `replace` must re-mark the game dirty so a queued autosave restores "Obecne postępy
  zostały bez zmian" if the hung import later completes.
- **SV2-03 → runtime-only status fields** `backup: 'none' | 'pending' | 'done' | 'failed' | 'skipped'` and
  `backupError`, plus `lastFailure: { stage: 'encode' | 'backup' | 'write'; error }`. The panel can truthfully say:
  "moved from version 1" only after the first successful v2 write *in this session*; "the old copy is kept" only when
  `backup` resolved in this session; "the old copy could not be kept (Kod: …)" when v2 was written without it; and in
  `failing` the error name, count and stage. It cannot truthfully say anything about the copy at a later start (no
  read path, SV2-04) or after eviction (the copy lives in the same database, SV2-15).
- **SRR-02 → no cross-start counter; an in-start way out instead.** The previous fix rejected a `localStorage`
  counter (session-only in Safari private mode, no evidence it survives a broken IDB backing store) and nothing new
  contradicts it. Honest alternative: the start card for `timeout` (SRR-12) gets its own copy and a "wait longer"
  action that keeps awaiting the *same* read with a longer limit (`balance.save.slowLoadTimeoutMs`, e.g. 20 000);
  if that also expires, the card and the import/reset dialogs show the site-data advice (conditional wording, with
  the warning that it deletes the save) instead of "Uruchom grę ponownie" in a loop. A forced write is not a way out
  for `timeout`: the write would queue behind the hung transaction.

## Detailed Findings

### SV2-01 — the failing backup, today

- `src/core/autosave.ts` `createAutosaver` → `attempt`: `encodeSave` → `validateSave` → `dirty = false` →
  `if (!backedUp && options.migrated) { await store.backup(...); backedUp = true; }` → `await store.write`. One
  `catch` logs `autosave: write failed` and counts `failures`/`consecutiveFailures`; `backedUp` stays false, so every
  later attempt repeats the backup first (confirmed by reading; pinned by `tests/autosave.test.ts` "a failing copy
  writes nothing, counts as a failure with the copy error, and stays retryable").
- `save` does not re-arm after a failure: the loop ends (`next = null`), `dirty` stays true, and the next
  `markDirty` (registry `changedata`/`setdata` on any `SAVE_KEYS` key, `src/main.ts` `start` → `onChange`) or
  `flush` tries again. So failures are counted per attempt, and attempts follow the child's actions.
- `src/storage/idb.ts` `createIdbSaveStore` → `backup` writes `${key}:backup-v${from}` through `run`, which retries
  once on `InvalidStateError`/`UnknownError` with a fresh connection (WebKit bug 197050). That retry is inside one
  attempt; it does not change the policy question.
- `src/main.ts` `start` passes `migrated: { from, raw }` whenever `outcome.migratedFrom !== null`; the main key keeps
  v1 until a v2 write succeeds, so every start migrates again and retries the copy (audit claim confirmed).

### SV2-01 — does v2 carry everything v1 had? (bears on option A)

- `src/core/save.ts` `MIGRATIONS[1]`: `({ ...raw, version: 2, variants: startingVariants() })` — cannot throw, adds
  one block.
- `decodeSave` validates the migrated value (`validateSave` → `saveProblem`) before `toSession`; `encodeSave` writes
  `version, profileId, stars, rooms, currentRoom, settings.autoRead, learner (all fields), variants`.
- Differences between the stored v1 and the first v2 write, on this inspected path: (1) unknown top-level keys are
  dropped (the top-level check in `saveProblem` does not reject extras, `encodeSave` does not copy them) — no v1 build
  wrote any, since v1's `encodeSave` had the same field list; (2) `pendingUnlock` of another stage becomes null in
  `toSession` (same rule in v1); (3) `src/main.ts` `start` applies `floorToCalendar` and `repairCurrentRoom` before
  the first write — also done by every v1 build since S-11. None loses the child's progress.
- Conclusion: the copy is a net against a *future* migration bug only (the reason given in the minigame-daily-puzzle
  research: "the only protection when a migration bug is found after the v2 save was written (FR-021)").

### SV2-01 — attempts per session (for N)

- Callers: `TaskScene.syncStars` sets `stars` on every `submit` and `advance` (Phaser's DataManager emits change
  without an equality check), round end sets `learner`/`variants` and calls `flush('now')` (`TaskScene.finishRound`,
  `finishVariant`), `RoomScene` `dispatch` flushes after a purchase, `WelcomeScene` sets `learner`. Visibility
  `hidden` and `pagehide` call `flush('hidden')` (`src/main.ts` `start`).
- Estimate (subagent read, not measured): a first round of 5 tasks makes roughly 7–12 write attempts, depending on
  whether the child pauses 500 ms between taps. N = 3 is reached within the first 1–2 tasks.
- Where a session is shorter than N attempts (child closes after one answer), the `hidden` flush is the last chance;
  hence the recommended exception: a `hidden` flush after ≥ 1 failed backup skips the copy and writes v2.

### SV2-01 — options weighed

| Option | Keeps v1 content | Stops silent loss | Verdict |
|---|---|---|---|
| A: retry N, then write v2 without copy | content yes (v2 ⊇ v1); raw v1 bytes no | yes, from attempt N (or the first `hidden` after a failure) | **recommended** |
| B: A + "save v1 copy" button while raw is in memory | as A + manual net | yes | not needed: "Zapisz kopię" (`UIScene.openExport`) already exports the full state; extra DESIGN-GAP and button for a net against a bug that does not exist → follow-up (SV2-04 trigger) |
| C: v2 under a new key, v1 untouched | yes | only if the new key writes (quota → likely not) | rejected: changes the storage layout and `read` path; risk to "format stays v2" |
| D: block with a named cause | yes | **no** | rejected: violates "Postęp nigdy nie ginie" for the child |

- N value: 3 (`balance.save.backupAttempts`). Whether a backup `timeout` (SV2-02) counts the same: yes — a hung
  backup and a rejected one are equally unhelpful, and a hung one would otherwise block the whole session.
- Order alternative considered: write v2 first, then the backup from the in-memory `migrated.raw`. Rejected as the
  default: a page killed between the two writes loses the raw v1 with no copy, which is what backup-first avoids;
  under A the difference only matters on devices where the backup fails anyway.
- SRR-04 (`replace` never takes the pending backup, `tests/autosave.test.ts` "replace never copies"): under A the
  cheap consistent rule is "replace attempts the pending backup once, with the time limit; a failure is recorded in
  `backup`/`backupError` and logged but does not block the parent's confirmed action". The minigame-daily-puzzle
  plan-review stated replace bypasses the copy "by design — explicit parent action behind confirmation"; the plan
  chooses between that and the once-and-non-blocking rule.

### SV2-02 — time limits and abandoned IndexedDB transactions

- Today: `attempt` awaits `store.backup`/`store.write` with no limit; `save` returns the same `inflight` to every
  `flush`, so `flush('hidden')` of a hung write never settles; `replace` does `await inflight; await store.write`
  with no limit.
- idb-keyval 6.3.0 (`node_modules/idb-keyval/dist/index.js`): `set` = `customStore('readwrite', store => { put;
  return promisifyRequest(store.transaction) })` — resolves on `complete`, rejects on `abort`/`error`; no handle to
  abort. `createStore` caches the `indexedDB.open` promise (`dbp`), so a hang can be in `open` (no transaction exists
  to abort) or in the transaction.
- Ordering: readwrite transactions with overlapping scope run in creation order (recorded in the
  save-export-import-reset research: "IndexedDB transactions on one store run in creation order, so awaiting is
  enough"). A hung transaction therefore delays every later write; a retry after a timeout will usually time out too
  until the first one settles. This is a correct, named `failing` (`timeout`), not a reason to stop counting.
- Late completion: a timed-out write that later completes lands before any write created after it, so the store ends
  with the newest write. Late rejection: the abandoned promise needs its own `.catch` (save-observability-c1-c2
  research: otherwise it reaches the error boundary's `unhandledrejection` and shows the fatal card) — same pattern as
  `loadSave` (`read.catch(() => undefined)`).
- `replace` timeout: the dialog then says "Obecne postępy zostały bez zmian" (`pl.saveTransfer.applyFailed`,
  `resetFailed`). If the hung write completes later, the imported/reset state would land silently. Mitigation inside
  the pure core: after a `replace` timeout mark the game dirty and let the debounce write the current session — it
  queues behind the hung transaction and restores the stated outcome. `replace` must also bound its wait for
  `inflight` (a dead `inflight` must not hold it).
- Abort: possible only by replacing `set` with a custom `UseStore` callback in `src/storage/idb.ts` that keeps the
  transaction and calls `abort()`; it does not help a hang in `open`. Recommendation: no abort in this fix.
- Value: `balance.save.writeTimeoutMs = 5000`. Rationale: same order as `loadTimeoutMs` (5000, "a cold IndexedDB
  open on an older iPad"); a write is tens of KB on an already open connection, so 5 s is generous; one constant for
  backup, write and replace keeps it simple. The e2e build needs a short override (pattern `E2E_LOAD_TIMEOUT_MS = 300`
  under `?e2eSave=hang`).
- Dialogs (`src/ui/dom/saveImportDialog.ts` `stepTwo`, `src/ui/dom/saveResetDialog.ts` `confirmStep`): both disable
  the action and "Anuluj" until `apply` settles; with a bounded `replace` the `failed` branch always runs, so
  "Zamknij" comes back. Escape (`src/ui/dom/dialog.ts` `openDialog` → `onEscape` = `finish`) is not guarded by `busy`:
  closing during `replace` leaves a pending `reload()` that fires mid-game on success (impl-review O2). With a
  bounded `replace` the cheap fix is to ignore Escape while `busy`.

### SV2-03 — what the panel can truthfully say

- Today: `status().migratedFrom` = `options.migrated?.from` (intent, set at start); `src/ui/dom/saveHealthView.ts`
  `createSaveHealthView` draws `pl.settings.saveMigrated` whenever it is non-null; `src/core/saveHealth.ts`
  `stateOf` → `failing` with no code; `pl.ts` comment at `saveMigrated` claims "the old copy is kept on the device".
- Truthful statements, each from a fact the saver observed in this page load:

| Fact (runtime status) | Line the panel may show |
|---|---|
| migrated, no successful v2 write yet | nothing about migration (or "not yet moved"); `notYet`/`failing` covers it |
| migrated, `backup: 'done'`, writes > 0 | moved from v1; the old copy is kept on this device |
| migrated, `backup: 'failed'`/`'skipped'`, writes > 0 | moved from v1; the old copy could not be kept (Kod: `backupError`) |
| `consecutiveFailures > 0` | `failing` + error name + count + stage (`backup` / `write` / `encode`) |
| a timed-out attempt with zero writes | `failing` with `timeout`, never `notYet` |

- Limits to state in the copy or the plan: the copy's existence is known only for the session that wrote it (no read
  path in `SaveStore`, SV2-04); eviction removes save and copy together (SV2-15). Stage names: `encode` covers
  `encodeSave`/`validateSave` (`InvalidSave`), `backup` the copy, `write` the main key.
- Log: a separate `autosave: backup failed` line (audit) so the console no longer says `write failed` for a copy.
- New copy needs DESIGN-GAP rows from 94 (last row in `docs/design-gaps.md` is 93); related rows 43, 50, 69.

### SRR-02 — a way out of a permanent `timeout`

- Today: `replaceGate` (`unavailable` + `isTimeoutError(loadError)` → `Blocked`), `deviceSaveView` → `cause:
  'timeout', forceable: false`; copy `pl.saveTransfer.deviceTimeout` and `pl.settings.saveOff.timeout` say "Uruchom
  grę ponownie"; the start card uses `pl.saveUnavailable` for every `unavailable` (`cardCopyFor`), only the muted
  "Kod: timeout" differs (SRR-12). `failureText` shows `pl.saveTransfer.siteDataAdvice` after any forced `replace`
  store error, never for `timeout` (replace is `Blocked`). No `localStorage`/`sessionStorage` anywhere in `src/` or
  `tests/` (subagent grep).
- Prior decision (save-reason-and-recovery research and plan decision 2): counter in `localStorage` rejected —
  "Safari private mode keeps localStorage for the session only, and nothing documents localStorage surviving a broken
  IDB backing store", with a field report of both empty; reversal condition: N-7 (`[human]` iPad cold-open
  measurement) showing a common permanent `timeout` → "a counter or a second read with a longer limit". N-7 is still
  unmeasured. Home-screen apps have storage separate from Safari (WebKit bug 181849).
- Why a forced write is no way out for `timeout`: if the store is hung, the write queues behind the hung read's
  connection/transaction and hangs too; if the store is merely slow, the save is healthy and must not be overwritten
  (the prior plan's reason for `timeout` never being forceable still holds).
- Honest way out without cross-start state: (1) a `timeout`-specific card (closes SRR-12) with a "wait longer" action
  that keeps awaiting the original read (today `loadSave` drops it on timeout; a new read would queue behind it) with
  `balance.save.slowLoadTimeoutMs` (recommend 20 000); a late success loads the save normally; (2) when the long wait
  also expires, the card, `saveOff.timeout` and `deviceTimeout` show the site-data advice — conditional ("jeśli to
  się powtarza") and with the warning that it deletes the save — instead of "Uruchom grę ponownie". This is the
  "second read with a longer limit" the prior reversal condition named, needs no storage, and is truthful in private
  mode.
- A `localStorage` counter as an optional escalation (show the advice only from the 2nd timed-out start) is possible
  with try/catch, but it would be the first browser-storage path in the game, it is unreliable exactly in the private
  mode case, and the in-start long wait already provides the evidence it would collect. Not recommended now.
- SRR-08 (force offered at the first `unavailable`) needs that counter; it would also change
  `tests/e2e/save-transfer-blocked.spec.ts` "#2 SIR-02 a save the browser never gives can be replaced after a second
  confirmation". Recommend: stays a follow-up.

### Tests and seams that pin today's behaviour (plan must update deliberately)

- `tests/autosave.test.ts` (fakes `makeStore` with `backupFails`/`hold`/`release`, `makeClock` with `advance`):
  "copies the raw v1 once, BEFORE the first write, and never again"; "a failing copy writes nothing, counts as a
  failure with the copy error, and stays retryable" (changes under A); "replace never copies" (changes if SRR-04);
  "waits for a write in flight, then writes the given state after it" (changes under a bounded `replace`); "the status
  says which version the save was moved from" (changes under SV2-03).
- `tests/saveHealth.test.ts`: "no write yet, no block and no failure is notYet", "no write yet but a failed attempt is
  failing, not notYet", "keeps migratedFrom from the status…" (shape changes under SV2-03).
- `tests/saveFile.test.ts` lockstep of `forceable` with `replace({ force: true })`, "a timeout read is blocked, never
  forceable" — stays green under the recommended SRR-02 (no force for timeout).
- `failureText` (`src/ui/dom/saveSummaryView.ts`) has no unit test.
- E2E: `tests/e2e/save-migration.spec.ts` "#2 after a round the migrated save is written as v2 with a v1 backup first"
  (`ops.slice(0,2)` = `['backup','write']`, one backup) — stays green under A; `tests/e2e/save-restart.spec.ts`
  (`hang` → `saveOff.timeout`, `writefail` → `failing`) and `tests/e2e/save-transfer-blocked.spec.ts` (`hang` →
  `deviceTimeout`, force count 0) — copy assertions change if SRR-02 changes those texts. No spec asserts `saveNotYet`.
- Seams: `src/testing/e2eHook.ts` `E2ESaveSeam` = `unreadable | corrupt | unavailable | hang | writefail | v1`;
  `e2eSaveStore` `backup` always resolves. New seams (`backupfail`, `backuphang` with the v1 read, `writehang`) fit
  under the existing `e2eSave` marker in `vite/e2eHookGuard.mjs`. The hook's `save` snapshot is the full
  `AutosaveStatus`, so new runtime fields reach specs automatically; the type in `tests/e2e/support/hook.ts` is stale
  (lacks `loadReason`, `loadError`, `replace`, `persistence`).

### S12-07 / S12-08 / S12-12 / S12-13 (trigger: next change to the dialogs or `replace` — met)

| Id | Finding (audit 2026-10-14 04:45) | Repo now | Cost / recommendation |
|---|---|---|---|
| S12-07 | `saveFileToDevice` returns `downloaded` after `link.click()` even when nothing was saved (iOS standalone) | open: `src/ui/dom/saveExport.ts` `saveFileToDevice` unchanged | file not touched by this change → re-file with a new trigger |
| S12-08 | `file.text()` rejection (`NotReadableError`) refused as `not-json` | open: `saveImportDialog.ts` `stepOne` → `refuse('not-json', null)` | cheap (new rejection + copy + DESIGN-GAP); candidate |
| S12-12 | `requestPersistence` `catch { return 'error' }` without a log | open: `src/storage/idb.ts` `requestPersistence` | trivial `console.warn` with the error name; candidate |
| S12-13 | `apply` and button handlers outside `session.run` | open: `src/scenes/UIScene.ts` `openImport`/`openReset` `apply: (state, force) => saver.replace(...)` | cheap wrap; candidate |

## Code References

- `src/core/autosave.ts` — `createAutosaver` (`attempt`, `save`, `replace`, `status`), `loadSave` (`limit` race
  pattern), `replaceGate`, `isTimeoutError`, `AutosaveStatus`
- `src/core/saveHealth.ts` — `stateOf`, `offState`, `saveHealthView`, `cardCopyFor`
- `src/core/saveFile.ts` — `deviceSaveView`, `exportFileText` (kind `raw`), `parseImport` (accepts kind `raw`)
- `src/core/save.ts` — `MIGRATIONS`, `decodeSave`, `encodeSave`, `toSession`, `saveProblem`
- `src/storage/idb.ts` — `createIdbSaveStore` (`run`, `backup`), `requestPersistence`
- `src/main.ts` — `start` (load limit, `migrated`, card, `visibilitychange`/`pagehide` flush)
- `src/ui/dom/saveHealthView.ts` — `createSaveHealthView`
- `src/ui/dom/saveImportDialog.ts` — `stepOne`, `stepTwo`; `src/ui/dom/saveResetDialog.ts` — `confirmStep`;
  `src/ui/dom/dialog.ts` — `openDialog` (Escape); `src/ui/dom/saveSummaryView.ts` — `failureText`, `blockedText`
- `src/scenes/UIScene.ts` — `openImport`, `openReset`, `openExport`
- `src/data/balance.ts` — `save` (`debounceMs`, `loadTimeoutMs`, `importMaxBytes`)
- `src/data/pl.ts` — `settings.saveMigrated` (comment), `saveFailing`, `saveNotYet`, `saveOff.timeout`,
  `saveTransfer.deviceTimeout`, `siteDataAdvice`, `saveUnavailable`
- `src/testing/e2eHook.ts` — `E2ESaveSeam`, `e2eSaveStore`, `E2E_LOAD_TIMEOUT_MS`
- `node_modules/idb-keyval/dist/index.js` (6.3.0) — `createStore`, `set`, `promisifyRequest`

## Architecture Insights

- Every new state stays runtime (`AutosaveStatus`) or derived (`saveHealthView`); the save format stays v2 and
  `tests/fixtures/` byte-identical — none of the recommendations needs a `SaveState` field.
- The time-limit race belongs in pure `core` (`autosave.ts`, injected timers), not in `idb.ts`, so the fake-store
  tests (`makeClock().advance`) can prove it; `idb.ts` stays a thin adapter.
- One helper for "race a store promise with a timer and swallow the late rejection" can serve `loadSave`, backup,
  write and `replace` — today the pattern exists once in `loadSave`.

## Historical Context (from prior changes)

- `context/archive/2026-10-14-minigame-daily-puzzle/plan.md` phase 2 "Kopia przed pierwszym zapisem": "nieudana kopia
  blokuje ten zapis … kolejna próba ponawia kopię" — the design that SV2-01 corrects; plan-review F5 accepted the risk
  as a follow-up ("a device where the copy always fails loses each session's post-update progress") — supported,
  now judged critical.
- `context/archive/2026-10-14-save-reason-and-recovery/research.md` + plan decision 2 — `localStorage` counter
  rejected, `timeout` never forceable, reversal via N-7 or "a second read with a longer limit" — still supported; this
  research takes the second-read branch.
- `context/archive/2026-10-13-save-observability-c1-c2/research.md` — the abandoned read needs its own `.catch` —
  supported, applies to every new race.
- `context/archive/2026-10-13-save-export-import-reset/research.md` — transactions on one store run in creation order
  — supported; it is why a hung write blocks later ones.

## Related Research

- `context/archive/2026-10-14-save-reason-and-recovery/research.md`
- `context/archive/2026-10-14-minigame-daily-puzzle/research.md`
- `context/archive/2026-10-13-save-observability-c1-c2/research.md`

## Open Questions

- Whether `QuotaExceededError`/`UnknownError` on the backup key, or a hung IDB write, happens on a real iPad is
  unproven (audit, runtime proof not run); N-7 remains `[human]`.
- Plan decides: SRR-04 rule (non-blocking single attempt vs. bypass by design); whether the `hidden`-flush exception
  is taken; exact copy for the new panel lines and the `timeout` card (DESIGN-GAP from 94); whether S12-08, S12-12,
  S12-13 and O2 (Escape while `busy`) ride along; S12-07, SRR-08, SV2-04 re-filed with triggers.
