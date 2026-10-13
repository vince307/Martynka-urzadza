<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Autozapis w IndexedDB i wersjonowany zapis z migracjami

- **Plan**: context/changes/autosave-versioned-save/plan.md
- **Mode**: Deep (claims checked directly against the code; no sub-agent, the riskiest claims were few and local)
- **Date**: 2026-10-13
- **Verdict**: REVISE → SOUND after triage (all fixes applied in plan.md)
- **Findings**: 1 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | FAIL → PASS after F1 |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | WARNING (F4, F5 recorded as known risks) |
| Plan Completeness | WARNING → PASS after F2, F3 |

## Grounding

Grounding: 6/6 paths ✓ (`src/main.ts`, `eslint.config.mjs`, `src/scenes/{RoomScene,TaskScene,WelcomeScene,UIScene}.ts`; new files absent as expected: `src/storage/` empty, `tests/fixtures/` absent), 7/7 symbols ✓ (`preBoot`, `finishRound`, `finishWarmup`, `syncStars`, `changeStageByParent`, `SessionLearner`, `installErrorBoundary`), brief↔plan ✓, Progress↔Phase ✓ (39 rows = 3+3+4+6+8+9+6; every phase has `Driver:` + `Driver why:`), npm registry: `idb-keyval@6.3.0` and `fake-indexeddb@6.2.5` exist (`npm view`).

Drivers checked: 1–3 `tdd` correct (pure modules/adapter absent, failing tests lead); 4–6 `impl` correct (glue, one DOM card + pure parser, docs); 7 `e2e` correct (browser-only risks #2/#10/#16, built in 4–5, after the seam sweep in 6, `E2E=on`).

Follow-ups `Trigger: S-11` (first-furniture-purchase ×2, variant-change-room-done, adaptive-curriculum ×4, narrator-round-summary, parent-settings-progress ×3, first-launch-placement ×2, observability-c1-c2 ×5): all included or convincingly deferred (F3/F4/F7 carried with unchanged triggers; error-card copy decided `[human]` 6.9; test-plan #13/#14 already closed).

Run-specific checks:
1. Overwriting a good save with defaults — walked first launch (`fresh`, nothing written until a change), slow load (game is created only after `await loadSave`, so no default-registry autosave can race it), corrupt/future save (`unreadable` → blocked + card), `unavailable` (blocked), fatal error (`block('fatal')`), welcome/placement (skipped when loaded), `?e2eStars` (fresh only, break D), `?e2eSave` (in-memory store, hook build only), parent stage change (intended progress). Rule is enforced in core (`createAutosaver` `blocked`) and proven failing-first (phase 2 break "autosave ignores `blocked`"). One remaining residual path, two same-origin instances, is F5.
2. v1 completeness — stars, rooms, currentRoom, settings, learner incl. mastery/streak/unlockedStep/history(+example)/weakStreak/easedRounds/warmupPending/pendingUnlock. Nothing restorable lives only in a scene field (round in progress is out of scope by decision; "Pokój gotowy!" is event-based). Gap found: the welcome's learner was never marked dirty (F1).
3. E2E non-vacuity — breaks A, B, D are production patches visible to their assertions; break C was not (F1), fixed.
4. ESLint override — plan names the flat-config override hazard, repeats the phaser/data restrictions, and the deliberate break proves the existing `src/core` Phaser rule still fires; `lint-boundaries.test.ts` keeps the `src/data` cases.
5. Dependencies — versions exact in the command but `npm install` writes `^` (F2), fixed; lockfile committed; `registry.npmjs.org` named.

## Findings

### F1 — Welcome's first `learner` set emits `setdata`, never `changedata-learner`

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 4 §1 (listeners), Phase 7 test 3, Key Discoveries
- **Detail**: Phaser `DataManager.setValue` emits `changedata`/`changedata-<key>` only for an existing key; a new key emits only `setdata`. `preBoot` never sets `learner` before the welcome, so `WelcomeScene.start`'s `registry.set(REGISTRY_KEYS.learner, …)` is a `setdata`. With listeners on `changedata-<key>` only: (a) the child's age/stage choice is not saved until some other key changes — killing the app during the warm-up before the first star loses placement; (b) phase 7 test 3 ("age tap → poll `skipped ≥ 1` → `writes === 0`") would time out on the correct implementation, and under break C `writes` stays 0 as well, so the spec could never show break C on `writes`.
- **Fix**: Listen to the generic `changedata` and `setdata` registry events filtered by one `SAVE_KEYS` constant in `src/data/layout.ts` (also used by the snapshot); test 3 polls `skipped + writes ≥ 1`, then asserts `writes === 0` and `skipped ≥ 1`.
- **Decision**: FIXED (plan.md: Key Discoveries, Critical Implementation Details, Phase 4 §1 + Contract, Phase 7 test 3)

### F2 — Dependencies would be recorded with `^`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 §1, criterion 3.1
- **Detail**: `npm install idb-keyval@6.3.0` writes `"^6.3.0"` (the repo's existing style, `"phaser": "^4.2.1"`). The lockfile pins it, but a later `npm install <other>` can move the storage library of a one-way format without review.
- **Fix**: `--save-exact` on both installs; criterion 3.1 checks `package.json` has no `^` for them.
- **Decision**: FIXED

### F3 — `flush('now')` position in `finishRound` ambiguous for the warm-up

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 §2
- **Detail**: `TaskScene.finishRound` sets the learner, then calls `finishWarmup()`, which sets it again (stage, `warmupPending: false`). A flush placed after the first `set` would write the warm-up end before the stage settles; the debounce would repair it, but a kill in the 500 ms window would replay the warm-up.
- **Fix**: Flush at the very end of `finishRound`, after `finishWarmup()`.
- **Decision**: FIXED

### F4 — A frozen v1 fixture is the only guard against tightening validation later

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 1 §4, Known risks
- **Detail**: Strict `validateSave` is right for v1, but any later build that tightens it without a migration turns real saves into "unreadable" (card at every launch). `save-v1.json` protects this only if it resembles what the game really writes.
- **Fix**: Known risk added: validation never tightens for v1 without a migration; the fixture must come from a real game state (round-trip on `core` functions).
- **Decision**: FIXED (recorded in Known risks)

### F5 — Two same-origin instances: last writer wins

- **Severity**: 💡 OBSERVATION
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Known risks, Phase 6 follow-ups
- **Detail**: On Android the home-screen app and a Chrome tab share IndexedDB; a stale instance's next autosave can roll back progress. Out of scope for one child on one window; a fix (BroadcastChannel, write counter) touches the format.
- **Fix**: Known risk + follow-up with the v2 trigger.
- **Decision**: FIXED (recorded)

### F6 — Settings persistence has no browser-level proof

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7
- **Detail**: Unit round-trip covers `settings`, and with F1's single `SAVE_KEYS` list the listener cannot miss one key alone; no e2e reloads after a settings change. Acceptable: same code path as the learner/stars keys proven by tests 1–2.
- **Fix**: None required.
- **Decision**: ACCEPTED

VERDICT: PROCEED — approach sound; one critical (welcome `setdata` not observed, making test 3 unprovable) and two warnings fixed in plan.md, residual risks recorded.
