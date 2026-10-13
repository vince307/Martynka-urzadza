<!-- IMPL-REVIEW-REPORT -->
# Implementation Review: Autozapis w IndexedDB i wersjonowany zapis z migracjami

- **Plan**: context/changes/autosave-versioned-save/plan.md
- **Scope**: Full plan
- **Reviewed phases**: 1, 2, 3, 4, 5, 6, 7
- **Date**: 2026-10-13
- **Verdict**: APPROVED (after fixes in b59e247)
- **Findings**: 0 critical, 2 warnings (both fixed), 4 observations

Diff base `git diff f67b9f4...HEAD`. Run by an autonomous step: triage was decided in place (agent contract rule 1).

## Verification (observed in this step)

| Check | Result |
|---|---|
| `npm run lint` | OK (before and after the fix) |
| `npm run typecheck` | OK |
| `npm test` | 1142 passed = baseline 1079 (f67b9f4) + 63 (save 230-line suite, autosave, idbStore, curriculumStart, lint-boundaries, e2eSave, saveKeys, e2eHookGuard); +0 from the fix commit |
| `deploy/test-martynka-deploy.sh`, `deploy/ops/test-martynka-ops.sh` | OK |
| `npm run sample -- E1..E6` | 0 violations |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -rlE "e2eSave\|e2eStars\|__martynkaE2E" dist/` → no file (exit 1) |
| `npx playwright test` (one plain run) | Chromium died in the agent sandbox (`mach_port_rendezvous ... Permission denied`), 13 failed at `browserType.launch`, none at an assertion. Evidence used instead: orchestrator round 2 on a403b21 (run-log: spec 3 passed, breaks p7a-p7d RED, full suite 29 = 26 + 3). Production code changed in b59e247 (`src/main.ts` `start`, `src/data/pl.ts` `saveFailed.note`): **e2e: orchestrator re-runs on the review's final commit**. |
| Deliberate break (core, "no write without a successful read") | `createAutosaver`: `let blocked = false && options.blocked` → `tests/autosave.test.ts` RED: "after a unreadable load nothing is ever written", "after a unavailable load nothing is ever written" (2 failed / 12); restored → 12 passed, `git diff` clean. Meta-check: proves the core rule only; the wiring `blocked: outcome.kind === 'unreadable' \|\| 'unavailable'` in `main.ts` is proven in the browser for `unreadable` (break p7c) and not for `unavailable` (F3). |
| Hook bypass | `.claude/settings.json` unchanged since 10 Oct, hooks present; no `--no-verify` in the run; none found. |

## Paths that could overwrite a good save (walked)

- First launch: nothing is written until a save key changes; `preBoot` sets before the listeners exist.
- Slow load vs first registry writes: the game is created only after `loadSave` resolves; listeners attach synchronously after `new Game`, scenes start later (texture ready), so no write precedes the read.
- Unreadable / newer save: `decodeSave` → `future`/`corrupt`/`unknown-version`, autosave blocked from creation; card; e2e test 3 + break p7c.
- Unavailable read (iOS lost connection): one retry with a fresh store in `createIdbSaveStore`, then `unavailable` → blocked, never writes an empty game over the stored one.
- Fatal error: handler blocks the saver. **Gap found (F1, fixed)**: a fatal signal during `await loadSave` or while the unreadable card waits used to let `start()` go on and run an unblocked game under the error card.
- Welcome/placement: the first `set` of the learner emits `setdata`, listened to; saved after 500 ms.
- Parent stage change / settings: `registry.set` → debounce.
- `?e2eStars`: only on `fresh` (break p7d). `?e2eSave`: hook build only, in-memory store, never IndexedDB; absent from `dist/`.
- Two tabs: last writer wins (known, follow-up with Trigger, plan-review F5).
- iPad pagehide/visibility: `visibilitychange` hidden and `pagehide` → `flush('hidden')`, writes only when dirty; purchase and round end are immediate.
- Write errors: `attempt` catches everything, `flush` always resolves, `requestPersistence` swallows sync throw and rejection, `exportRawSave` never rejects; nothing reaches `isFatalSignal`, so `QUIET_REJECTIONS` needs no new entry. `navigator.storage.persist()` called once via `onFirstWrite`.
- v2 migration readiness: `version` checked first; `MIGRATIONS` keyed by source version, applied in a loop to `SAVE_VERSION`; a throwing step → `corrupt` (old save kept, blocked); unknown fields dropped on decode, not rejected; frozen fixtures `save-v1.json` (real-state shape) and `save-v1-fresh.json`. The p1 relaxation (`unlockedStep` not requiring all six stages) is sound: a missing stage is filled by `floorToCalendar` at load, so the validator is not stricter than the game needs.

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| Plan Adherence | PASS |
| Scope Discipline | PASS |
| Safety & Quality | PASS (after F1 fix) |
| Architecture | PASS |
| Pattern Consistency | PASS |
| Success Criteria | PASS |

## Findings

### F1 — A fatal error before the game exists let the game start under the error card, with the autosave unblocked

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Safety & Quality
- **Location**: src/main.ts `start`, `installErrorBoundary` handler (`booted`)
- **Detail**: Before S-11 the game was created synchronously after the boundary. Now `start()` awaits `loadSave` and, for an unreadable save, the card (open for as long as the parent likes). A fatal signal in that window mounted the error card while `booted.game`/`booted.saver` were undefined, so neither `loop.sleep()` nor `block('fatal')` applied; `start()` then created the game and an unblocked autosaver behind the card, against plan "Critical Implementation Details: Blokada przy wyjątku fatalnym".
- **Fix**: the handler sets `booted.failed = true`; `start()` returns before building the session when it is set.
- **Decision**: FIXED — b59e247

### F2 — `pl.saveFailed.note` promised more than the code does

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria (teacher read, row 5.5)
- **Location**: src/data/pl.ts `saveFailed.note`
- **Detail**: "Dziś gra nie zapisze postępów." suggests saving resumes tomorrow; the card returns and the autosave stays blocked at every launch while the save is unreadable. The other strings read correctly (accusative "jego kopię", genitive after negation "postępów", imperatives "Zachowaj", "Graj dalej"; no numerals).
- **Fix**: "Tym razem gra nie zapisze postępów."
- **Decision**: FIXED — b59e247

### F3 — The `unavailable` branch of the start is not proven in the browser

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Success Criteria
- **Location**: src/main.ts `start` (`blocked:`), src/testing/e2eHook.ts `e2eSaveStore`
- **Detail**: Unit tests prove a blocked autosaver never writes; break p7c proves `unreadable` reaches it; nothing proves `unavailable` does.
- **Fix**: `?e2eSave=unavailable` seam + spec — follow-up with Trigger.
- **Decision**: FOLLOW-UP (review-fixes.md)

### F4 — Guard cases for `e2eSave` covered only through the marker list

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: tests/e2eHookGuard.test.ts
- **Detail**: plan phase 5 named two explicit cases; the list-driven tests cover them indirectly, and this step observed `dist/` free of the marker.
- **Fix**: add the two cases — follow-up with Trigger.
- **Decision**: FOLLOW-UP (review-fixes.md)

### F5 — `exportRawSave` falls back to a download after a failed share

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Adherence
- **Location**: src/ui/dom/saveExport.ts `exportRawSave`
- **Detail**: plan said log and keep the card; the code logs, then tries a download (safer for the parent), using `window.setTimeout`/`URL` globals beside the injected `doc`.
- **Fix**: confirm on the device export check (row 5.7) — follow-up with Trigger.
- **Decision**: FOLLOW-UP (review-fixes.md)

### F6 — Design-gap row 42 said "over the canvas"

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Pattern Consistency
- **Location**: docs/design-gaps.md row 42
- **Detail**: the card is mounted before the game exists.
- **Fix**: wording corrected.
- **Decision**: FIXED — b59e247

Recorded, not findings: `tests/saveKeys.test.ts` (extra, pins `SAVE_KEYS`) and the `tests/e2e/parent-settings.spec.ts` fresh-context change (needed once IndexedDB persists inside one context) are benign; the save-restart spec polls instead of importing `balance.save.debounceMs` (no fixed delay at all, better). Two same-origin instances (last writer wins) stay a known risk with a follow-up.

MERGE: CLEAR — no critical findings; both warnings fixed in b59e247 with lint, typecheck, 1142 unit, sample and build green and dist/ free of e2e seams; e2e re-run on the final commit is the orchestrator's (Chromium cannot start in the agent sandbox).
