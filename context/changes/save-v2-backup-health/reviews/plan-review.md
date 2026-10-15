<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Nieudana kopia `backup-v1` nie wyłącza zapisu, limity czasu zapisu i uczciwy panel „Zapis gry”

- **Plan**: context/changes/save-v2-backup-health/plan.md
- **Mode**: Deep
- **Date**: 2026-10-15
- **Verdict**: REVISE → SOUND after the in-place fixes below
- **Findings**: 2 critical, 3 warnings, 2 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | FAIL → PASS after F1, F2 |
| Plan Completeness | WARNING → PASS after F3, F4 |

## Grounding

Grounding: 9/9 paths ✓ (`src/core/autosave.ts`, `src/core/save.ts`, `src/core/saveHealth.ts`, `src/storage/idb.ts`, `src/main.ts`, `src/testing/e2eHook.ts`, `src/ui/dom/saveImportDialog.ts`, `src/ui/dom/saveResetDialog.ts`, `playwright.config.ts`), 10/10 symbols ✓ (`createAutosaver`, `attempt`, `save`, `replace`, `inflight`, `backedUp`, `loadSave`, `replaceGate`, `ROUND_SPEC`, `E2E_SAVE_SEAMS`), brief↔plan ✓.

Code facts checked against the plan (not the plan's word):
- `MIGRATIONS[1]` in `src/core/save.ts` is spread + `version: 2` + `variants`, and `decodeSave` runs `validateSave` before `ok`. So v2 ⊇ v1 holds, and option A loses no v1 content.
- `src/main.ts` `start` runs in this order: `loadSave` → start card (a promise resolved by `onContinue`) → `createGame` → `createAutosaver`. "Graj dalej" in `saveFailedCard.ts` has no disabled state.
- idb-keyval 6.3.0 `set` resolves on transaction `complete`. `createStore` caches one `dbp` and runs callbacks in registration order. Readwrite transactions on the store `saves` are serialised in creation order, and `backup` and the main key share that store.
- `src/storage/idb.ts` `run` retries an operation on a fresh connection after `InvalidStateError`/`UnknownError`.
- `future` is never overwritten: `writesOff` covers `blockedBy 'unreadable'` and `replaceGate` → `Blocked`. The plan keeps both.
- A half state is impossible: one `put` per key in one transaction.
- `replace` waits on `inflight`. The `save` loop stops after the first failure, or whenever `replacing` makes `writesOff()` true, so `await inflight` is bounded by one attempt.
- `createAutosaver` call sites are `src/main.ts`, `tests/autosave.test.ts` (helper `setup` plus one direct call) and `tests/saveFile.test.ts`.
- `pl.settings.saveMigrated` is also asserted in `tests/saveTransferCopy.test.ts`.
- `tests/idbStore.test.ts` uses `fake-indexeddb` and already tests `requestPersistence`.
- Vitest fails on unhandled rejections (no override in `vitest.config.mts`, and `tests/autosave.test.ts` listens to `unhandledRejection`).
- `ROUND_SPEC` does not yet contain `save-backup-health`, and phase 6 adds it.

Lessons file: `context/foundation/lessons.md` does not exist.

## Findings

### F1 — A timed-out write can retry itself after a newer write and leave the OLDER state last

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 1 / Critical Implementation Details ("Kolejność po limicie `replace`")
- **Detail**: The plan's ordering argument is that an abandoned transaction lands before any later one, which holds for idb-keyval itself. It misses `src/storage/idb.ts` `run`.
  - Today `inflight` serialises writes, so a write A that fails with `InvalidStateError`/`UnknownError` retries before write B even starts.
  - With `withTimeLimit`, A can hang in a live transaction, be abandoned, and have B queued behind it. If A is then aborted with `UnknownError` (the iOS flake this retry exists for), B commits and A's `run` retries `set(key, A)` on a fresh connection. A lands last.
  - For `attempt`: the device keeps the older state while the session believes B was saved. A `flush('hidden')` with `dirty === false` writes nothing, so closing the page loses B's round.
  - For `replace`: the import or reset R lands after the covering session write S, although the dialog said "bez zmian". A reset then loses all progress after the next reload.
  - The hazard is new: it exists only because this plan lets a second write start while the first is unresolved.
- **Fix (applied)**: Phase 1 change #4 adds a write sequence counter in `createIdbSaveStore`. `run(op, mayRetry)` retries a main-key `write` only if no later `write` started since. Otherwise it rejects with the original error, which is safe because core has already abandoned it. `read` and `backup` (another key) are unchanged. The change comes with:
  - a red-first test in `tests/idbStore.test.ts`;
  - a deliberate break in 1.2;
  - reviewer row 1.5 updated, replacing "idb.ts nietknięty";
  - a new paragraph in Critical Implementation Details.
  - Strength: smallest change that restores newest-last without `abort`, and stays inside the only IndexedDB module.
  - Tradeoff: a write abandoned on the lost-connection path gives up its retry. Acceptable, because the newer write carries a newer state.
  - Confidence: HIGH — the ordering argument is from idb-keyval's code and the IndexedDB transaction ordering rule.
  - Blind spot: an iPad hang that later aborts was not observed in the field. The fix costs nothing if it never happens.
- **Decision**: FIXED (autonomous; see handoff §6)

### F2 — "Graj dalej" during "Poczekaj dłużej" lets a late read race the started game

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 4 §3 (start wiring), Phase 6
- **Detail**: Phase 4 disables only the wait button while waiting. "Graj dalej" stays live, and its `onContinue` resolves the start promise. Then `createGame` and `createAutosaver` run with the `unavailable` outcome.
  - The plan says the late `waitLonger` result "replaces `outcome` in the rest of `start`". It never says what happens when the result arrives after the parent continued.
  - An implementation that applies it late, by unblocking the autosaver or swapping `load`/`migrated`, writes the fresh 0-star session over a healthy, slowly read save. That is loss of the whole saved progress.
- **Fix (applied)**: Phase 4 §3 now requires a single `settled` flag. Whichever comes first wins:
  - after "Graj dalej", a late result is only logged (`save: late read ignored`). It never changes `outcome`, unblocks the autosaver or starts a second game;
  - a late result that arrives before "Graj dalej" replaces `outcome` before `createGame`/`createAutosaver`.
  - Reviewer row 4.5 is extended. Phase 6 gets test (e) "continuing while the slow read is still answering never overwrites it", which checks `store.ops` for no `write` and the counter stays 0. Break patch p6e and Progress row 6.6 are added, and the e2e delta is now +5.
- **Decision**: FIXED

### F3 — Required new options break call sites the plan does not list

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 1 §2, Phase 2 §1, Phase 3 §2
- **Detail**: `writeTimeoutMs` and `backupAttempts` are required. `createAutosaver` is also called in `tests/saveFile.test.ts` and directly in `tests/autosave.test.ts` outside `setup`, so typecheck turns red there. `pl.settings.saveMigrated(1)`, which phase 3 turns into an object, is asserted in `tests/saveTransferCopy.test.ts`. The plan said "żaden spec go nie używa", which is true only for e2e.
- **Fix (applied)**: Added `tests/saveFile.test.ts` and the second call in `tests/autosave.test.ts` to Phase 1's file list, and `tests/saveTransferCopy.test.ts` to Phase 3's. Worst-case dialog busy time (~20 s) is recorded in `## Known risks`.
- **Decision**: FIXED

### F4 — Met follow-up triggers on `saveFailedCard.ts` / `saveResetDialog.ts` not addressed

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 5 §4 (follow-ups)
- **Detail**: The archive `2026-10-14-save-reason-and-recovery` has follow-ups whose triggers this change meets, and the plan was silent on them:
  - visual-gate O1, the `future` body of the start card ("next change to saveFailedCard.ts"; Phase 4 changes that file);
  - visual-gate O2, the reset dialog colon without a list ("next change to saveResetDialog.ts"; Phase 5 changes it);
  - O4, the `deviceSaveWiring` openExport case and rows 43–51 ("next change … to docs/design-gaps.md rows 43-51"; Phase 5 aligns rows 43/45/50).
  - Every other met trigger is handled: S12-02/12 closed; S12-07/08/13/03/11 and the start counter deferred with new triggers; SRR-04, SRR-12 and O2 included; F3 seam closed; L-S3 not met (handler untouched); impl-review F1 already implemented (`deviceUnreadable` line in both dialogs).
- **Fix (applied)**: Phase 5 §4 now defers O1, O2 and O4 explicitly with new concrete triggers and the reason each is out of scope (copy/design, not save safety).
- **Decision**: FIXED

### F5 — `hidden` exception drops the copy after a single transient failure

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 2 §1
- **Detail**: On a healthy device, one transient copy failure exactly at `flush('hidden')` writes v2 without the copy. That holds on the first attempt too, not only "after ≥ 1 earlier failure" as the overview first suggests. v2 ⊇ v1 (verified), so content is safe and only the raw-v1 safety net is lost. This is a product choice within `[human]` 2.5. The PRD guardrail "Postęp nigdy nie ginie" favours writing, so the decision is not overturned.
- **Fix**: Recorded in `## Known risks`. It stays under `[human]` 2.5.
- **Decision**: ACCEPTED (Known risks)

### O1 — Phase 4 is the largest phase

- **Severity**: OBSERVATION
- **Dimension**: Lean Execution
- **Location**: Phase 4
- **Detail**: Phase 4 holds core `waitLonger`, the DOM card, `main.ts`, the `slow` seam and two changed specs. Splitting it would leave `waitLonger` without a consumer in a phase that must stay green on its own, so it stays one `impl` phase with the core part first. Driver lines are correct for all six phases: 1–3 `tdd`, 4–5 `impl`, 6 `e2e` after the seam sweep. Each phase leaves e2e green, and phase 4 updates the two specs it changes.
- **Decision**: RECORDED (Known risks)

### O2 — Abandoned writes pile up on a permanently hung store

- **Severity**: OBSERVATION
- **Dimension**: Blind Spots
- **Location**: Phase 1
- **Detail**: Each attempt after a `timeout` queues another pending transaction holding a snapshot of tens of KB, about 7–12 per round. That is negligible in memory and they all fail or land in order (F1 guard). There is no action.
- **Decision**: RECORDED

## Autonomous triage

No human in the loop (run contract rule 1): every CRITICAL and every obvious WARNING was fixed in `plan.md`, F5 went to `## Known risks`, and observations were recorded. Product decisions against the PRD were checked:
- `[human]` 2.5: v2 without the copy goes beyond FR-021, but the guardrail and FR-020 support it, and v2 ⊇ v1 holds in the code.
- `[human]` 2.6: SRR-04 reverses "bypass by design".
- `[human]` 4.7: no `localStorage` counter.
- `[human]` 4.8: the N-7 measurement.
None of them is clearly wrong, so none was overturned.

VERDICT: PROCEED — approach sound (option A is safe because v2 ⊇ v1 is verified in `MIGRATIONS[1]` + `validateSave`; `future` never overwritten); the two save-safety holes (late retry landing an older state, late slow read after "Graj dalej") are fixed in plan.md with tests and e2e breaks.
