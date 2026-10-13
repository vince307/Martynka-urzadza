<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Ustawienia rodzica: zmiana etapu, auto-czytanie i podgląd postępów za bramką

- **Plan**: context/changes/parent-settings-progress/plan.md
- **Mode**: Deep (claims checked directly against the code and `node_modules/phaser` 4.2.1; no sub-agent)
- **Date**: 2026-10-13
- **Verdict**: REVISE → SOUND after triage (all fixes applied to plan.md in this step)
- **Findings**: 1 critical, 3 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | FAIL → fixed (F1, F3) |
| Plan Completeness | WARNING → fixed (F2, F4) |

## Grounding

Paths 9/9 ✓ (`src/scenes/{UIScene,TaskScene,WelcomeScene}.ts`, `src/main.ts`, `src/pwa/installHint.ts`, `src/testing/e2eHook.ts`,
`src/style.css`, `tests/e2e/support/{hook,welcome}.ts`); symbols ✓ (`TaskScene.beginRound/finishRound/finishWarmup/syncStars`,
`onWake`, `toRoom` guard `isSleeping`, `round.ts answer` `case 'first'`, `Task.prompt/answer`, `formatNumber`, `HUD_LAYOUT`,
`ROOM_LAYOUT.panel` right edge 1740 < icon left 1782, `REGISTRY_KEYS`); brief↔plan ✓; Progress↔Phase ✓ (11 phases, 54 rows after
triage, every criterion has a row, no checkboxes outside Progress); Drivers ✓ (1 impl, 2–5 tdd, 6–9 impl, 10–11 e2e after the
seam sweep in 9 — all correct). Lessons file: absent.

Follow-ups with `Trigger: S-08` (all included): autoRead switch (narrator, phases 3/6/7); stage change behind the gate
(first-launch, phases 3/6/7); e2e helper de-dup F2 (first-launch, phase 1); history example (adaptive, phase 4); `pendingUnlock`
cleared on stage change (adaptive impl-review, phase 3); install-hint leak (first-launch, trigger "next change to src/pwa", phase 6).

## Focus-point answers

- **(a) `booting.input` at preBoot** — valid. `Game` constructor creates `this.input = new InputManager(...)`; `preBoot` runs
  later in `Game.boot` (`this.config.preBoot(this)`), and `DOMContentLoaded` boots synchronously for a module script
  (readyState `interactive`), so the registry holds the suspender before `mountInstallHint` runs in `main.ts`. One switch covers
  every scene: `InputPlugin.isActive` requires `manager.enabled`; every `TouchManager`/`MouseManager` window and canvas listener
  checks `manager.enabled`. **But see F1** — switching it off while a finger is down kills touch afterwards.
- **(b) stage change from the room** — sound. Sleeping TaskScene ignores the event (guard like `toRoom`), `onWake` compares
  stages and applies without `autoReadFirst`; `sessionStars += state.starsEarned` once is right in every state (mid-round,
  summary — `finishRound` already ran, unlock card — shown before `beginRound`, warm-up). Gap: event emitted on an
  autoRead-only confirm would discard the round (F3, fixed).
- **(c) 1024×768** — the panel without the progress view fits (~640 px); with 3 items and long word prompts it is ~1400 px and
  the plan's nested `max-height` scroll would leave "Zatwierdź" below the fold, the exact S-06 visual-gate bug (F2, fixed).
- **(d) long press vs Phaser events** — for touch end/cancel `InputPlugin.update` runs `processUpEvents` then `processOutEvents`
  (`TOUCH_END`/`TOUCH_CANCEL` share the branch), so a tap yields `up` then `cancel` → both `idle`, harmless; `touchcancel` sets
  `pointer.wasCanceled` (`Pointer.touchcancel`). Drift off the 96 px icon fires `pointerout` before 30 px from an off-centre
  press — stricter, acceptable. `holdTouch` over raw CDP is consistent with `page.touchscreen.tap` (same CDP input path);
  timing of the negative assertion fixed (F4).
- **(e) phase-1 de-dup** — copies compared: identical apart from formatting (narrator's inline `fromHook` evaluate and
  `answer(page, right)` select the same tile/value as `answerRight`/`answerWrong`). Moved assertions are only those inside
  helpers: `expect(box).not.toBeNull()` (`tapScene`/`toPage`), `expect.poll(...).toBe(true)` (`fromHook`), `expect.poll(phase)`
  (`phaseIs`), `expect(next).not.toBeNull()` (`tapNext`), `expect.poll(screen)` (`screenIs`), gate steps' `toBeVisible()` ×2,
  `expect(factors).not.toBeNull()`, `expect(parent).toBeDefined()`, `expect.poll(screen).toBe('welcome')`. No assertion inside a
  `test(...)` body changes. List written into phase 1's Contract (F5).
- **(f) privacy** — `src/` has no `console.*` call; the hook (with `learner.history` and therefore examples) exists only in the
  e2e build, guarded by `vite/e2eHookGuard.mjs`; nothing leaves the device. Not stated in the plan → Known risk + S-11/S-12
  follow-up note added (F6).

## Findings

### F1 — Lost `touchend` under the suspended manager leaves the only touch pointer stuck

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details „Wstrzymanie wejścia”; phases 2, 6, 10
- **Detail**: The hold fires in `UIScene.update` while the finger is still down; `openSettings` then sets
  `game.input.enabled = false`. The later `touchend` is dropped by `TouchManager.onTouchEnd` (`manager.enabled` check), so
  `InputManager.onTouchEnd` never calls `pointer.touchend` and `pointers[1].active` stays `true`. With the default
  `input.activePointers` = 1 there is no other touch pointer: `InputManager.onTouchStart` loops `pointers[1..]` for
  `!pointer.active` and finds none — after closing the gate/panel the whole game ignores touch. (S-06's welcome never hit this:
  `PageButton` fires on `pointerup`, the finger is already up.) Phase 10's "next tap works" would turn red with no design
  answer in the plan.
- **Fix (applied)**: `createInputSuspender(target, onRelease?)` calls `onRelease` exactly once when the count returns to zero,
  before re-enabling; `main.ts` passes `() => booting.input.pointers.forEach((p) => p.reset())` (what
  `InputPlugin.resetPointers` does). Unit test in phase 2, wiring in phase 6, third deliberate break + Progress row 10.4 in
  phase 10 (old 10.4 → 10.5).
  - Strength: one place, covers gate, panel, welcome and install hint alike; uses Phaser's own reset.
  - Tradeoff: a pointer genuinely down at release would be reset — impossible here (dialogs cover the canvas).
  - Confidence: HIGH — read from `InputManager.onTouchStart/onTouchEnd`, `TouchManager.startListeners`, `Pointer.reset`.
  - Blind spot: real iPad behaviour (WebKit may deliver `touchcancel` instead) — also dropped, same fix applies.
- **Decision**: FIXED

### F2 — Settings panel blows the 768 px height; nested scroll hides „Zatwierdź”

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 8 — Komponent; Known risks
- **Detail**: Dialog font `clamp(20px, 2.4vw, 32px)` ≈ 24.6 px at 1024 wide. Title + stage grid (3 rows × 64 + gaps) +
  auto-read + actions ≈ 640 px; three weakest items with two long word-problem examples each add ≈ 800 px. The plan's
  `max-height` + `overflow-y` on the content adds a second scroller inside `.overlay-parent` (already `overflow-y: auto`) and
  says nothing about the action row — S-06's visual gate failed on exactly "Zatwierdź below the fold".
- **Fix (applied)**: budget written into phase 8; single scroller (the overlay), `.parent-actions` sticky at the bottom on the
  paper background, examples at 0.8em, progress below the decisions; visual criterion 8.5 now requires the buttons visible
  without scrolling in every state.
- **Decision**: FIXED

### F3 — Confirming only the auto-read choice would throw away the open round

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Blind Spots
- **Location**: Critical Implementation Details „Kolejność zmiany etapu”; phases 6, 7
- **Detail**: Phase 7 emits `GAME_EVENTS.parentStage` on every „Zatwierdź”; the awake listener only checks `isSleeping`, so a
  parent who toggles auto-read (or confirms the current stage) gets a fresh round of the same stage. `onWake` compares stages,
  the event path did not.
- **Fix (applied)**: `applyParentStage` returns early when `learner.stage === this.stage.id`; `UIScene` emits only when
  `changeStageByParent` returned a new object; reviewer row 6.6 checks the guard.
- **Decision**: FIXED

### F4 — Negative assertion after the short hold needs time past the threshold

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 10 — Spec
- **Detail**: "checked after the threshold" contradicted "the only fixed wait is the hold itself".
- **Fix (applied)**: the negative check follows the 2300 ms drifting hold, so > 2000 ms have passed since the 1500 ms press
  began, without an extra `waitForTimeout`.
- **Decision**: FIXED

### F5 — Phase 1 assertion inventory (observation)

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Plan Completeness
- **Location**: Phase 1
- **Detail**: Verified the copies are behaviour-identical; the moved in-helper assertions are listed under focus point (e) and
  now in phase 1's Contract, together with updating the stale header of `support/hook.ts`. `openWelcome` changes signature from
  `(page, search)` to `(page, month?)` — `passWelcomeAsParent` is its only caller.
- **Decision**: RECORDED

### F6 — Privacy of mistake examples not stated (observation)

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Blind Spots
- **Location**: Known risks; phase 9 follow-ups
- **Detail**: Verified memory-only, hook e2e-only, no logging. Added a Known risk (with a `console.` grep for the seam sweep)
  and an S-12 note that the export will carry the child's answers.
- **Decision**: RECORDED (plan text added)

### F7 — Phase 6 is the largest glue phase (observation)

- **Severity**: OBSERVATION
- **Impact**: 🏃 LOW
- **Dimension**: Lean Execution
- **Location**: Phase 6
- **Detail**: Five files across `main.ts`, `pwa`, two scenes and the hook, but no new component and each change is a few lines
  around already-tested core functions; sized for one fresh agent. No split.
- **Decision**: RECORDED

## Triage summary

Fixed: F1, F2, F3, F4 · Recorded: F5, F6, F7 · Verdict after fixes: SOUND. Product decisions (immediate stage change,
"3 weakest" only with first-try mistakes, step title as skill name, current stage only, icon in the HUD) are consistent with
FR-015/US-03 and Access Control and are all named in `[human]` row 9.8; none overturned.

VERDICT: PROCEED — the approach fits the code; the one critical gap (stuck touch pointer after a hold-opened dialog) and three warnings are fixed in plan.md.
