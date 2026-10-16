<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Stale-tab save guard, UI art health, music status and service-worker install signal

- **Plan**: context/changes/stale-tab-and-health/plan.md
- **Mode**: Deep (codebase verified directly by the reviewer, no sub-agent)
- **Date**: 2026-10-16
- **Verdict**: SOUND after triage (REVISE before: 0 critical, 4 warnings, 3 observations; all warnings fixed in plan.md)
- **Findings**: 0 critical, 4 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (fixed) |
| Plan Completeness | WARNING (fixed) |

## Grounding

Grounding: 8/8 paths ✓ (`src/core/save.ts`, `src/storage/idb.ts`, `src/core/autosave.ts`, `src/pwa/registerServiceWorker.ts`, `src/pwa/installHint.ts`, `src/testing/e2eHook.ts`, `src/data/uiArt.ts`, `playwright.config.ts`), symbols ✓ (`guardedPut`, `storedVersionNewer` + its callers `idb.ts`/`e2eHook.ts`/tests, `NEWER_SAVE` in `attempt` and `replace`, `replaceGate`, `loadSave` single `store.read()`, `SAVE_KEYS`, `ROUND_SPEC`, `UI_ART.wallet`, `writtenVersion` 3 in exactly the four named specs), brief↔plan ✓. Progress↔Phase: 12 `## Phase N` ↔ 12 `### Phase N`, criteria map 1:1, no checkboxes outside Progress.

## B-1 special check (step prompt)

- **Self-refusal of a legitimate single tab**: none found on the paths the prompt names. Late-landing timed-out own write: stored `writer === mine` → put (no refusal); `base` moves on `tx.oncomplete` even when `withTimeLimit` abandoned the promise. Reload: one `store.read()` per page (`loadSave`, `waitLonger` reuses the SAME read) sets `base` before any write. Import/reset: `replace` mode skips the generation check, page reloads. Migration write: v3 record has no `generation` → 0, not `> base 0` → put 1. Backup copy: plain `set` on `:backup-vN`, never through `guardedPut`. Lost-connection retry: same store, same writer. One residual race (old document's late pagehide write after the new document's read) → Known risk F4, no data loss.
- **Stuck / invisible no-save state**: refusal → `blockedBy 'otherTab'` (parent line, phase 3) + child card once (phase 4); restart reads the newest record and gets a new writer, so writing resumes. Gap fixed: a throwing `onBlocked` would have broken `attempt`'s never-throws contract (F2). A v3 tab already running meets v4 as `newer` with no card (old code, Known risk, unreachable by any fix).
- **Fixtures v1/v2/v3 on populated data**: phase 1 decodes every frozen fixture (v1, v2, v2-legacy-salon, v3) with literal oracles from the pre-bump decode; `git diff --stat tests/fixtures` = one new file. ✓
- **`future`/`newer` for a v3 build meeting v4**: start → `decodeSave` `future` card, `replaceGate` blocks `future`; running v3 tab → `storedVersionNewer(4 > 3)` in its own `guardedPut` → `newer`, no write. ✓ The "E2E on two real builds" follow-up (trigger: v4) is deferred with a convincing reason: the old build's rule is the unchanged `storedVersionNewer`, proven by the version-3 store test; re-triggered in phase 10.

## Findings

### F1 — Store default writer is a shared constant

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2 — Store
- **Detail**: `IdbSaveStoreOptions.writer?` defaulted to "a constant only tests rely on". A `main.ts` that forgets the option makes every tab the same writer, so `writeVerdict` never refuses and the guard is silently off (only the phase-11 e2e would notice).
- **Fix**: default to a fresh random id per `createIdbSaveStore` call; tests pass explicit writers.
- **Decision**: FIXED (plan phase 2 contract)

### F2 — `onBlocked` can throw into `attempt`; replace path undefined

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 — Autosaver
- **Detail**: `onBlocked` is called from `attempt`'s `catch`; a throwing card mount would escape `attempt` ("Never throws"), reject `save` and could reach the error boundary. The plan also did not say whether a `NewerSave` from `replace` fires it.
- **Fix**: wrap the call in `try`/`catch` + `log`; fire only from `attempt` (the dialog reports a replace refusal to the parent).
- **Decision**: FIXED (plan phase 3 contract)

### F3 — Phase-11 trigger "answers a task" writes nothing

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 11 — Spec (a) and (b)
- **Detail**: `main.ts` marks dirty only on `SAVE_KEYS` changes (stars, rooms, currentRoom, learner, settings, variants); stars and learner change at round end, so one answer triggers no write and the spec would wait for a refusal that never comes.
- **Fix**: the stale page finishes a round (and is brought to front) before the `blockedBy` poll.
- **Decision**: FIXED (plan phase 11 intent)

### F5 — Phase-12 (b) `page.route` bypassed by a claiming worker

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 12 — Spec
- **Detail**: every existing spec that routes requests uses `test.use({ serviceWorkers: 'block' })` (`final-art-wallet.spec.ts` and others) because `clientsClaim` lets the worker bypass `page.route`; (a) needs a real worker. One file needs two describe blocks.
- **Fix**: (b) in its own `describe` with workers blocked, (a) with workers allowed; blocked specs now log `register-failed` (Known risk; no e2e spec asserts on console warnings, checked by grep).
- **Decision**: FIXED (plan phase 12 contract + Known risks)

### F4 — Reload race can show the card on a legitimate reload

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details / Known risks
- **Detail**: if the previous document's pagehide write (e.g. queued behind an in-flight backup copy) commits after the new document's read, the new writer's base is one behind and its first write is refused. No data loss (restart loads that write); rare; the e2e `+ 0` gate from phase 2 detects flakes in the many reloading specs.
- **Fix**: recorded in Known risks; no plan change.
- **Decision**: ACCEPTED (Known risk)

### F6 — Stale-window replace shows the window's own summary

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 2/3 — `replace` mode
- **Detail**: a window not yet refused can import/reset over a newer stored save (replace skips the generation check by design) while its summary shows its own stale load.
- **Fix**: recorded in Known risks.
- **Decision**: ACCEPTED (Known risk)

### F7 — Service-worker update with an active worker

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 5 — Reducer
- **Detail**: the contract left open what the panel says while an update installs (or fails) under an already active worker; "installing"/"install-failed" would be false, offline play still works.
- **Fix**: active worker keeps `ready` (error name kept), plus a test row.
- **Decision**: FIXED (plan phase 5 contract)

## Drivers and sizing

Drivers checked: 1, 2, 3, 5, 7, 8 `tdd` (new pure rules / store contract with exact oracles, no implementation yet); 4, 6, 9, 10 `impl` (DOM glue, small view, docs); 11, 12 `e2e` after the seam sweep (phase 10), features built in 1-4 and 5-7, contract `E2E=on`. All right; phase 6 and 9 also carry small pure helpers with red-first tests, which `/10x-implement` can do — not a wrong driver. Each phase is independently green (phase 2 alone: a stale tab's writes fail and retry, never overwrite). 12 phases kept: each is one fresh-agent session; merging 8+9 was considered and rejected (different files of the sound section, both small).

## Product decisions vs PRD

Child card (FR-020 calm feedback, one button, no fail state), `controllerchange` as a record not a prompt (FR-003), nothing leaves the device: consistent. v4 one-way door has the `[human]` row 10.6; orchestrator decisions (ship, `deploy/README.md` note) not re-opened.

VERDICT: PROCEED — v4 CAS design holds on every single-tab path checked against the code; four warnings fixed in plan.md, three observations recorded.
