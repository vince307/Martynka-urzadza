<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Polski stand-in obrazka, sygnał nieudanego wczytania dla rodzica i import/reset po nieudanym odczycie

- **Plan**: context/changes/art-stand-in-and-load-signal/plan.md
- **Mode**: Deep (claims checked directly against the code, no sub-agent)
- **Date**: 2026-10-14
- **Verdict**: REVISE → SOUND after the in-plan fixes below
- **Findings**: 0 critical, 3 warnings, 6 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | WARNING (F2) |
| Blind Spots | WARNING (F3) |
| Plan Completeness | WARNING (F1) |

## Grounding

Grounding: 17/17 paths ✓ (`ArtImage.ts`, `taskArt.ts`, `BootScene.ts`, `curriculum.ts`, `round/pick.ts`, `round/warmup.ts`, `autosave.ts`, `saveFile.ts`, `saveImportDialog.ts`, `saveResetDialog.ts`, `settingsPanel.ts`, `e2eHook.ts`, `e2eHookGuard.mjs`, `tests/taskArt.test.ts`, `tests/spoken.test.ts`, `tests/dialogSessions.test.ts`, `tests/e2eHookGuard.test.ts`); symbols ✓ (`skillBuckets`, `pickRoundSkills`, `pickSkills`, `buildWarmup`, `buildAdaptiveRound`, `unlockReady` with `Math.ceil(rules.unlockShare * skills.length)`, `createAutosaver.replace` `blockedBy === 'fatal'`, `writesOff`, `getParser`, `parseMoneyCountParams`, `inflect`, `forcedSkills`, `E2E_HOOK_MARKERS`, `openSettings` e2e helper); skill ids `E4.1.money_count_100`, `E3.4.mass_dag_100`, `E2.2.*`, `E5.5.*` ✓; brief↔plan ✓ (brief updated for the split).

## Step-prompt judgments

1. **Filter scope (MONEY_COUNT, MASS, CAPACITY `toLitres`) is right.** MONEY_CHANGE: `pl.tasks.moneyChange(name, feminine, had, thing, price, question)` carries both amounts in the text; the coins are decoration, and labelled boxes ("5 zł") agree with the text. CAPACITY `howMany`: `capacityHowMany(jug, litres)` names the jug kind and the litres. COUNT / MULT_GROUPS: one icon id per task, boxes stay countable, `countPrompt` names the noun. TEMPERATURE: `Thermometer` draws the scale and the column in code (`face` Graphics) over the frame `ArtImage`, so an empty frame box still reads. MASS with only `balance-scale` missing: the item and weights are separate `ArtImage`s, solvable. No change.
2. **Unlock-threshold rule is sound.** `skillBuckets.current` is exactly the playable skills of the step `unlockReady` checks, so filtering only when ≥ `ceil(unlockShare · n)` remain guarantees the remaining skills can reach the threshold; otherwise stand-ins stay. E2.2 (coins + jug missing: 1 of 3 < 2 → unfiltered; coins only: 2 of 3 → filtered, still unlockable) and E5.5 (0 of 2 → unfiltered) check out. Formula duplication → F2. `[human]` row 7.7 names the FR-013 deviation.
3. **S12-01**: `unavailable` → refuse is consistent with the spirit of FR-022 ("przed nadpisaniem rodzic widzi podsumowanie" cannot be met for an unread save); `[human]` row 6.7 names it. `unreadable` → the start card's "Zachowaj kopię" **is reachable** after "Graj dalej": `createAutosaver` `writesOff()` is true for any `blockedBy`, so the unreadable save is never overwritten by autosave and `main.ts` `start()` shows `mountSaveFailedCard` with `raw` again at every launch. The remaining trap is the panel's own export → F3.

## Findings

### F1 — Phase 3 too big for one fresh agent

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3
- **Detail**: Phase 3 bundled five parts (`TaskArtEntry.id`, `BootScene` record + log, `?e2eArt` seam across `e2eHook.ts`/`main.ts`/`BootScene`/guard, `TaskScene` filter, new DOM `artHealthView` + `settingsPanel` + `UIScene.openSettings` + `pl.ts` + gap 67) over ~15 files, plus a guard break, a text break, a teacher read and a 3-state × 2-size visual gate.
- **Fix**: Split into Phase 3 (signal, seam, filter; no visual gate) and Phase 4 ("Obrazki" panel line with its teacher read and screenshots); later phases renumbered 5–9, Progress, cross-references, decisions 6 and 10, `[human]` rows (now 6.7 and 7.7) and the brief updated.
- **Decision**: FIXED

### F2 — Unlock-threshold formula duplicated while "unlockReady untouched"

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: Phase 1 §3, Phase 7 seam sweep, What We're NOT Doing, row 1.5
- **Detail**: Phase 1 computes `minCurrent = ceil(unlockShare · n)` in `buildAdaptiveRound` and the NOT-doing list and row 1.5 say `unlockReady` stays untouched, but the sweep demands "one helper used by `unlockReady` and the filter" — a contradiction that pushes a refactor into the sweep.
- **Fix**: Phase 1 introduces exported `unlockThreshold(n, share)` in `src/core/curriculum.ts`, used by `unlockReady` (behaviour unchanged, guarded by its tests) and the filter; NOT-doing, 1.5 and the sweep text reworded.
- **Decision**: FIXED

### F3 — "Zapisz kopię" in the panel exports the fresh session under `unreadable`

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Phase 6 §2 (`deviceUnreadable`), Known risks
- **Detail**: `UIScene.openExport` exports `saver.current()` (the in-memory fresh session). The new `deviceUnreadable` line points to "Zachowaj kopię", a name one word away from the panel's "Zapisz kopię"; a parent may export the fresh session believing it is the device save, then reset. Making the export dialog device-aware is S12-04 (out of scope by the contract).
- **Fix**: `deviceUnreadable` copy now names "na pierwszej karcie … „Zachowaj kopię”" and says the panel's "Zapisz kopię" saves only the current game (final wording after the teacher read); residual risk recorded in `## Known risks`; S12-04 follow-up stays.
  - Strength: no new code path, keeps the scope agreed in Step 0.
  - Tradeoff: the export dialog itself still does not warn.
  - Confidence: MED — depends on the parent reading the line.
  - Blind spot: none significant.
- **Decision**: FIXED (copy) + Known risk

### F4 — Wrong step for the `toLitres` screenshot

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 5 Manual (visual)
- **Detail**: "dzbanki (E4.7 `toLitres`)" — `E4.7.capacity_litres_half` is `howMany`; `toLitres` skills are `E2.2.capacity_litres` and `E5.5.capacity_quarter_l`.
- **Fix**: Row text corrected.
- **Decision**: FIXED

### F5 — `ROUND_SPEC` registration for the #2 spec is required, not optional

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 9 §1
- **Detail**: `chromium-hook` has `testMatch: ROUND_SPEC` and `chromium` ignores it; `save-transfer-blocked.spec.ts` does not match `save-transfer\.spec`, so without the entry it would run on the production build without the hook. The handoff's "unverified helpers" are resolved: `openSettings` (`tests/e2e/support/welcome.ts`) and `page.goto('/?e2eSave=unavailable')` as in `save-restart.spec.ts`.
- **Fix**: Phase 9 file line says "wymagane" and names the helpers.
- **Decision**: FIXED

### F6 — Triggered follow-ups not all named

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 7 §2, Phase 3 §3
- **Detail**: Open follow-ups whose trigger fires on files this change edits: (a) audit M-1/M-2/M-13/H-3/H-4 "Trigger: next change to TaskScene / narrator" (`2026-10-13-observability-c1-c2`) — this change only edits arguments in `TaskScene.freshRound`, not `beginRound`/`finishRound`/`applyParentStage`; deferral justified, now recorded in the sweep; (b) S-11 F4 explicit guard cases "Trigger: next change to vite/e2eHookGuard.mjs" — closed for `e2eSave`, but the new `e2eArt` marker should get the same explicit cases → added to Phase 3 §3. Already resolved in code (no action): "BootScene hand-over out of the font promise" (`BootScene.create` uses `time.delayedCall`), parent-settings F6 (`WelcomeScene.openParent` has the `| undefined` guard), narrator-summary hook targets (closed earlier). Included as planned: art-tasks "BootScene.preload loaderror" and S-12 impl-review F1.
- **Fix**: As described.
- **Decision**: FIXED

### F7 — Drivers checked

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: all phases
- **Detail**: 1 tdd (new pure `artHealth`/`artFilter`; spoken timeouts are a test-only change noted as such), 2 tdd (`replace` behaviour change: a test of `unavailable` → `Blocked` fails today; `deviceSaveView` new), 3–7 impl (scene/DOM/widget wiring, sweep; no DOM test harness exists — no jsdom/happy-dom in `vitest.config.mts`), 8–9 e2e after the sweep, each risk built earlier (#11 by 3–5, #2 by 2 and 6), contract `E2E=on`. All correct.
- **Decision**: no change

### F8 — `corrupt` seam and the error boundary

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 §3, Phase 8 (d)
- **Detail**: Phaser decodes through a detached `Image`, so its `error` event does not reach `window`; spec (d) asserting "no error card" is the right guard should that change.
- **Decision**: no change

### F9 — Phase 1 seed-identity test is the main regression guard

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: End-State Alignment
- **Location**: Phase 1 §3
- **Detail**: `pickRoundSkills` filters empty buckets itself, so an empty-set filter returning the same arrays without rng calls keeps every seed-pinned test and `adaptive.spec` stable; the plan's deliberate break covers it.
- **Decision**: no change

VERDICT: PROCEED — approach sound and claims hold in code; Phase 3 split for agent size, unlock-threshold helper unified, `unreadable` export trap mitigated in copy and recorded as a known risk.
