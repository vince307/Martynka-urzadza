<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Łączny limit ładowania, linia „jeszcze chwilka” i strażnik zapisu przed starszą kartą

- **Plan**: context/changes/load-and-tab-guard/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7
- **Date**: 2026-10-16
- **Verdict**: APPROVED (after fixes in 5a11370)
- **Findings**: 0 critical, 2 warnings (both fixed), 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (F1 fixed) |
| Architecture | PASS |
| Pattern Consistency | PASS (F2 fixed) |
| Success Criteria | PASS |

## Evidence

- Diff `main..HEAD` (30 files outside `context/`) matches the plan's file lists: `src/core/bootLoad.ts`, `src/scenes/loaderCut.ts`, `BootScene`, `LoadingScreen.slow`, `balance.loader`, `pl.loading.slow`, `LOADING_LAYOUT.slow`, `REGISTRY_KEYS.bootLoad`, `storedVersionNewer`/`NEWER_SAVE`, `BlockReason 'newer'`, `replaceGate`, `offState`, `deviceSaveView`, `blockedText` (`deviceNewer`, recorded phase 4 decision), `guardedPut`, seams `stallall`/`newer`, tripwire, spec. No change under `vite/`, `deploy/`, `tests/fixtures/` (`git diff --stat main..HEAD` empty); `SAVE_VERSION` 3; `package.json` untouched.
- `src/scenes/loaderCut.ts` against `node_modules/phaser` 4.2.1 (`LoaderPlugin.nextFile`, `fileProcessComplete`, `loadComplete`, `checkLoadQueue`; `File.onError`, `resetXHR`, `onProcessComplete`; `FontFile.onProcess`): `list` files moved to `inflight` first, so the `queue` loop cannot reach `loadComplete` early; `queue` files get the no-op `onProcessComplete` before `fileProcessComplete`, so a late `FontFace` resolve/reject calls the no-op (no throw, no second `COMPLETE`); `inflight` files get `retryAttempts = 0`, `resetXHR`, `ontimeout = null`, `abort()` only with an `xhrLoader`, then `nextFile(f, false)` → `_deleteQueue` → destroyed in `loadComplete`; aborted XHRs have no handler left (inert). `create()` runs once: `SceneManager` uses `loader.once(COMPLETE)`; the `creates` belt is in place. Loader internals touched only in `loaderCut.ts` (grep). Tripwire `tests/phaserLoaderPin.test.ts` pins `4.2.1` = installed.
- IndexedDB write path: `guardedPut` runs `get` + `put` in ONE `readwrite` transaction via the raw `UseStore`; refusal only when `storedVersionNewer` (numeric finite `version` strictly above); an unreadable record (`get` error) is `preventDefault`ed and overwritten (forced replace keeps working); `NewerSave` not in `LOST_CONNECTION` (no retry); the autosaver keeps `withTimeLimit` around every write (`limited`). Start write after migration (v2/v1 → v3) is allowed (stored version lower); import/reset `replace` refused only over a newer stored save and then blocks; `'newer'` lives only in `AutosaveStatus`, never in `SaveState`. `idb.ts` remains the only idb-keyval importer (ESLint boundary, lint green).
- Dist: `stallall`/`E2E_BOOT_LIMITS` absent from `dist/_app/*.js`; `NewerSave` present (expected, it is the production guard).

## Findings

### F1 — A prevented read error bubbles to `tx.onerror` and rejects a write that lands

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/storage/idb.ts `guardedPut`
- **Detail**: IndexedDB fires request `error` events with `bubbles: true` (fake-indexeddb `FDBTransaction` does too), so after `read.onerror` calls `preventDefault` and puts, the same event reached `tx.onerror`, which rejected with a made-up `UnknownError` (`tx.error` is still null). The put committed anyway. `run` treats `UnknownError` as a lost connection and retries, so the forced "Zastąp mimo to" over an unreadable record worked only through the retry, and every put failure (e.g. `QuotaExceededError`) was renamed `UnknownError` (wrong `Kod:` for the parent, a needless retry). Not progress-losing, hence WARNING. The phase 5 stand-in test had no transaction, so it did not see bubbling.
- **Fix**: drop `tx.onerror`; an unprevented put error aborts the transaction and `tx.onabort` rejects with `tx.error` (the put's own error). New test "a prevented read error that bubbles to the transaction does not reject the write" (RED before: `UnknownError: failed` from `tx.onerror`; GREEN after).
- **Decision**: FIXED — 5a11370

### F2 — The slow line was larger than the title and wider than the canvas

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: src/ui/widgets/LoadingScreen.ts `slow`; src/data/layout.ts `LOADING_LAYOUT.slow`
- **Detail**: `slow()` used `textStyle('expression')` (112 px), the title size; 34 characters at 112 px run past 1920 px.
- **Fix**: `textStyle('bar')` (36 px), centred like the title, `align: 'center'`, `wordWrap` at `LOADING_LAYOUT.slow.maxWidth` 800 (the bar width), top origin under the bar; gap row 112 updated. Visual confirmation stays with the visual gate (row 3.3).
- **Decision**: FIXED — 5a11370

### F3 — The slow-line timer asks the rule with a constant

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architecture
- **Location**: src/scenes/BootScene.ts `preload` (slow timer)
- **Detail**: `bootLoadPhase(limits.slowAfterMs, limits)` is always `'slow'` once `checkBootLimits` passed; the timer, not the core rule, decides. Harmless.
- **Fix**: follow-up with trigger in `follow-ups/review-fixes.md`.
- **Decision**: RECORDED (follow-up)

### F4 — Late-font belt and `creates` guard have no red test

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: src/scenes/loaderCut.ts; tests/e2e/load-and-tab-guard.spec.ts (b)
- **Detail**: p7b stays green by design (plan-review F2/F6); confirmed against Phaser source above.
- **Decision**: ACCEPTED (documented in plan)

### F5 — The guard protects from this build on, Chromium only

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/storage/idb.ts `guardedPut`
- **Detail**: Older builds still write without the guard (plan Migration Notes); `preventDefault` on a failing `get` unverified in WebKit (follow-up "WebKit for the loader cut", human row 7.7).
- **Decision**: ACCEPTED (follow-ups exist)

## Verification (observed in this review)

| Command | Result |
|---|---|
| `npm run lint`, `npm run typecheck` | pass |
| `npm test` (before fixes) | 2969 passed, 160 files (main baseline 2925, +44) |
| `npm test` (after 5a11370) | 2970 passed (baseline 2925, +45) |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh`, `sample` E1–E6 | pass, 0 violations |
| `npm run build` | `e2e hook: absent (2 chunks checked)` |
| `npx playwright test --config=<abs> --workers=4` (after 5a11370, run by this reviewer, Chromium launched) | 104 passed (baseline 101, +3), 7.7 min |
| Re-executed break (phase 5.2): `write` back to `set` | 2 red (`B v4, A v3 refused`, `refusal is not retried`); restored, diff clean |
| RED evidence phases 1, 4, 5 | quoted in handoffs 71337e3, 309aede, 80892a4 (assertion failures, not import errors) |

## Reviewer rows

- 1.4 PASS — `bootLoad.ts` imports nothing; numbers only in `balance.loader` with arithmetic.
- 2.4 PASS — internals only in `loaderCut.ts`; swap before `fileProcessComplete`; both timers removed on `COMPLETE`; seam under `__E2E_HOOK__`, absent from `dist/`.
- 3.4 PASS — no text or numbers in `BootScene`/`LoadingScreen` (only log lines); DESIGN-GAP 112 in `pl.ts`, widget docblock, `docs/design-gaps.md`.
- 4.4 PASS — `'newer'` only in `BlockReason`/`AutosaveStatus`; `saveOff`, `blockedText`, `DeviceSaveView` cover it (typecheck exhaustive).
- 5.4 PASS — `idb.ts` only importer; `NewerSave` not retried; read in the write transaction.
- 6.3 PASS — `CLAUDE.md` names (`loaderCut`, `phaserLoaderPin`, `bootLoad`, `guardedPut`, `stallall`, `e2eSave=newer`) exist; no `vite/`/`deploy/` change.

MERGE: CLEAR — no CRITICAL; two WARNINGs fixed in 5a11370 with a red-then-green test; full gate and e2e 104/104 observed; save format v3, fixtures byte-identical.
