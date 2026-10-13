<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Granica błędów, zwalnianie wejścia po wyjątku, stan lektora w ustawieniach i opanowanie bez kary

- **Plan**: context/changes/observability-c1-c2/plan.md
- **Mode**: Deep (claims checked in the code directly, no sub-agent)
- **Date**: 2026-10-13
- **Verdict**: REVISE → SOUND after triage (all findings fixed in plan.md or recorded under `## Known risks`)
- **Findings**: 2 critical, 4 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | WARNING (F5) |
| Architectural Fitness | PASS |
| Blind Spots | FAIL → fixed (F1, F3, F4, F6) |
| Plan Completeness | FAIL → fixed (F2, F7, F8) |

## Grounding

Paths 8/8 ✓ (`src/core/inputSuspend.ts`, `src/main.ts`, `vite/e2eHookGuard.mjs`, `src/testing/e2eHook.ts`,
`src/ui/dom/{dialog,overlay,settingsPanel}.ts`, `playwright.config.ts`, `tests/e2e/support/{hook,welcome}.ts`); symbols ✓
(`createInputSuspender` without `finally`, `checkE2EHook` single marker, `e2eMonth`, `REGISTRY_KEYS`, `ROUND_SPEC`,
`silenceSpeech`, `openWelcome(page, month?)`, `MasteryRules.loss`/`balance.mastery.loss` only in `mastery.ts`, `balance.ts`,
`tests/mastery.test.ts`, `tests/curriculumEnd.test.ts`); Phaser 4.2.1 internals read (`FontFile.onProcess`,
`File.destroy`, `LoaderPlugin.fileProcessComplete`/`loadComplete`, `SceneManager.bootScene` `loader.once`,
`TimeStep.sleep`/`pause`/`resume`, `Game.onHidden`/`onVisible`); brief↔plan ✓ (brief updated with the phase split).
Progress↔Phase ✓ before and after edits (37 rows; every criterion bullet has a row; no checkboxes in phase bodies).
Drivers: 1–3 `tdd` (absent code / behaviour change led by failing tests), 4–5 `impl` (DOM glue, no DOM in vitest),
6–7 `e2e` after the seam sweep in phase 5 (features built in 4 and 5, `E2E=on`) — all correct.

## Findings

### F1 — `REGISTRY_KEYS.e2eFail` would ship the guard marker to `dist/`

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details „Miejsca wyzwolenia e2e”, Phase 4 § 3
- **Detail**: `REGISTRY_KEYS` (`src/data/layout.ts`) is a production object literal; terser does not mangle property names,
  so a key `e2eFail: 'e2eFail'` lands in the production chunk even when every use sits behind `__E2E_HOOK__`. Phase 3
  adds `e2eFail` to the forbidden marker list → `npm run build` fails in phase 4. (`e2eMonth` works today only because
  its registry key is `month`.)
- **Fix**: key renamed `REGISTRY_KEYS.forcedFailure`, with the rule „name and value contain no guard marker”; scenes
  import only `E2E_FORCED_FAILURE` from `src/testing/e2eHook.ts`, used only behind `__E2E_HOOK__`.
- **Decision**: FIXED

### F2 — Phase 3 not independently green: e2e build would fail the extended guard

- **Severity**: ❌ CRITICAL
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 3 § 3 (strażnik), Phase 4
- **Detail**: Phase 3 requires every marker present in the `E2E_HOOK=1` build, but `e2eFail(...)` and
  `E2E_FORCED_FAILURE` have no caller until phase 4 → tree-shaken out of the e2e build → the guard fails the e2e build
  and `npx playwright test` (part of the phase 3 gate) goes red.
- **Fix**: phase 3 adds the forbidden list (all 4 markers) but keeps the required-in-e2e list at `['__martynkaE2E']`
  (`E2E_REQUIRED_MARKERS`); new phase 4 § 3a extends it to the full list with a pin test (4.2/4.4 rows updated).
- **Decision**: FIXED

### F3 — The failure handler could recurse if the card mount itself throws

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details „Kolejność w `main.ts`”
- **Detail**: Only the steps *after* the card were in `try/catch`; a throw from `mountErrorCard` inside the `error`
  listener is reported as another `error` event. (Planner check d.)
- **Fix**: every step including `mountErrorCard` in its own `try/catch`; `installErrorBoundary` calls `onFatal` in
  `try/catch` with a re-entrancy flag (re-entry only logs).
- **Decision**: FIXED

### F4 — Boot carrier: card shows, but the original boot exception is lost

- **Severity**: ⚠️ WARNING
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Known risks (boot carrier, „Dwukrotne `create`”)
- **Detail**: Verified in Phaser source: `LoaderPlugin.loadComplete` destroys files (`File.destroy` → `loader = null`)
  before `emit(COMPLETE)`, and `SceneManager` listens with `once`. A throw in `BootScene.create` is caught by
  `FontFile`'s `.catch` (`console.warn('Font failed to load')`, no error object); the second `onProcessComplete` throws
  `TypeError` on `this.loader === null` → `unhandledrejection` carrying the *secondary* TypeError. So the plan's carrier
  inference is right (card appears, no second `create` — the old risk text was wrong), but the boundary's
  `console.error` never sees the real cause.
- **Fix A ⭐ Recommended (applied)**: keep the plan's design; correct the Known-risks text; follow-up „move the
  `BootScene` hand-over out of the font promise” with `Trigger: S-11 or the next change to BootScene` (S-11 rewrites
  boot to load the save anyway).
  - Strength: no extra scope now; the card (the C-1 goal) works on this path.
  - Tradeoff: boot root cause stays console-invisible until S-11.
  - Confidence: HIGH — mechanism read line by line in `node_modules/phaser/src/loader`.
  - Blind spot: runtime trace still pending (break 6.2 settles it).
- **Fix B**: defer the hand-over to the first `update` now (moves boot throws to the RAF `error` carrier with the
  original error) and add a `page.evaluate(Promise.reject)` test for the rejection listener.
  - Strength: full root cause at boot today. Tradeoff: changes boot timing and the phase-6 break design.
  - Confidence: MED. Blind spot: start-queue semantics inside a scene update not traced.
- **Decision**: FIXED (Fix A)

### F5 — `?e2eFail=welcome` exists only for a screenshot that adds nothing

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Lean Execution
- **Location**: Critical Implementation Details, Phase 3 § 2, Phase 4 § 4, row 4.7, decision 7
- **Detail**: The card is built on `createOverlay` → `.overlay` has an opaque background (`#FFF5DF`), so a screenshot over
  the welcome equals one over the task. The site costs a trigger in `WelcomeScene.start` and a parser value; the welcome
  release is proven by vitest (phase 1) plus review row 4.6. (Planner check b.)
- **Fix**: dropped `welcome`; visual 4.7 now shows the card after a frame failure (`step`) and a boot failure (`boot`).
- **Decision**: FIXED

### F6 — `AbortError`/`NotAllowedError` as noise: safe today, not after S-11

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Phase 3 § 1, decision 4
- **Detail**: Planner check a. Today nothing real is hidden: `src/` has no promise of its own (grep `.then(`/`await`/
  `new Promise` empty), `registerServiceWorker` and the install `prompt()` already `.catch`, speech has no promises,
  the app loads no audio/video (Phaser's `Video` is the only `NotAllowedError` user). But IndexedDB reports an aborted
  transaction as `AbortError` — from S-11 a real save failure would be classed as noise (`console.warn` only).
- **Fix**: Known-risks entry + phase-5 follow-up `Trigger: S-11 or the first promise the app itself awaits`.
- **Decision**: FIXED

### F7 — Phase 6 (5 e2e tests, 3 break patches, two specs) too big for one fresh agent

- **Severity**: 💡 OBSERVATION (planner flagged it)
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 6
- **Detail**: Two unrelated risks (#15 boundary, #14 H-6), two spec files, a support helper, three break patches, and a
  likely request-file round-trip with the orchestrator.
- **Fix**: split — Phase 6 = `error-boundary.spec.ts` (4 tests, breaks 6.2/6.3), Phase 7 = H-6 test in
  `parent-settings.spec.ts` (break 7.2). Progress updated (6.1–6.4, 7.1–7.3), brief and decision 9 updated.
- **Decision**: FIXED

### F8 — `openWelcome`/`passWelcome` cannot carry `?e2eFail=` today

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 6 § 1
- **Detail**: `tests/e2e/support/welcome.ts` `openWelcome(page, month?)` builds the URL with the month only.
- **Fix**: phase 6 § 1 extends `openWelcome`/`passWelcome` with an optional query object; existing calls unchanged.
- **Decision**: FIXED

### F9 — Other checks that passed (recorded, no change)

- **Severity**: 💡 OBSERVATION
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Architectural Fitness
- **Location**: whole plan
- **Detail**:
  - (c) Input switch: the card's hold is one more ref-counted `suspend()`; the install hint (`.overlay` z 10, own hold)
    releasing later leaves the card's hold → input stays off; the rotate overlay (z 20) is CSS-only and holds nothing.
    No fight. Residual: a non-callback failure while a parent dialog is open leaves `openDialog`'s Tab trap under the
    card — keyboard only, terminal card; recorded in Known risks.
  - `game.loop.sleep()` holds: `Game.onHidden`/`onVisible` call `TimeStep.pause`/`resume`, which never restart RAF.
  - (e) Production absence: guard list + `grep -rlE "e2eFail|e2e-forced-failure|e2eMonth|__martynkaE2E" dist/` in 4.2
    and 6.4; current `dist/` has none of them. Guard success message kept literally.
  - H-7: plan's FR-013 and ZADANIA § 1 sentences are the only −1 statements (grep of PRD, ZADANIA, Martynka-urzadza.md,
    roadmap, test-plan, CLAUDE.md); FR-007 („druga próba nie liczy się do opanowania”) stays consistent; `[human]` 2.6
    names the maintainer decision. E2E specs do not depend on −1 (`parent-settings` asserts `opanowanie \d+ z \d+`).
  - Triggered follow-ups: F6 (WelcomeScene guard) in scope; F5 (hold state under a foreign overlay) deferral justified
    (card is terminal); F4 `src/pwa` untouched; e2e-hook room targets already fixed in `installE2EHook` (phase 5 closes
    it); check-deploy marker follow-up not triggered (hook stays behind `__E2E_HOOK__`, deploy uses `npm run build`).
  - Phase 4 (~10 files, one new UI component) is at the upper bound but cohesive; not split.
- **Decision**: RECORDED

## Triage summary

Fixed: F1, F2, F3, F4 (Fix A), F5, F6, F7, F8 · Recorded: F9 · Verdict after fixes: SOUND.

VERDICT: PROCEED — approach is sound; two build-breaking details (registry key leaking a guard marker, phase-3 e2e guard too early) and the oversized e2e phase are fixed in plan.md, the rest recorded as risks/follow-ups.
