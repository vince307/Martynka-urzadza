<!-- PLAN-REVIEW-REPORT -->
# Plan Review: Pierwsze uruchomienie: wiek, etap, bramka rodzica i rozgrzewka

- **Plan**: context/changes/first-launch-placement/plan.md
- **Mode**: Deep (claims checked directly against the code, no sub-agent)
- **Date**: 2026-10-13
- **Verdict**: SOUND after triage (REVISE before: 1 critical fixed in plan)
- **Findings**: 1 critical, 2 warnings, 3 observations

## Verdicts

| Dimension | Verdict |
|-----------|---------|
| End-State Alignment | PASS |
| Lean Execution | PASS |
| Architectural Fitness | PASS |
| Blind Spots | FAIL → PASS after F1 fix |
| Plan Completeness | WARNING → PASS after F2/F3 fixes |

## Grounding

Grounding: 7/7 paths ✓ (`src/scenes/BootScene.ts`, `src/scenes/TaskScene.ts`, `src/testing/e2eHook.ts`, `playwright.config.ts`,
`src/core/round/pick.ts`, `src/ui/narrator.ts`, `src/main.ts`; new files absent as planned), 6/6 symbols ✓ (`BootScene.create`,
`TaskScene.autoReadFirst`, `pickSkills`/`playable`, `installE2EHook`, `ROUND_SPEC`, `balance.defaultStage`), brief↔plan ✓.
Progress↔Phase: 9/9 phases, every criterion has a row, one `## Progress`, no checkboxes in phase bodies ✓.
Drivers: 1–3 `tdd` (modules absent, pure logic) ✓; 4–7 `impl` (scene/DOM glue, docs) ✓; 8–9 `e2e` after the seam sweep (7),
features built in 4–6, contract `E2E=on` ✓.

## Orchestrator decision (binding) — holes checked

- Child alone reaches play: age tap → `placeByChild` → `TaskScene`; no gate on that path ✓. Warm-up never blocks: it is a
  6-task round with the same no-fail rules (`startRound` slices to `rules.length` = 6), correction applied at `finished` so
  "Do pokoju" cannot skip it; E1 has no previous stage ⇒ no warm-up; `firstPlayableSteps` handles empty first steps ✓.
- Parent panel reachable only through `openParentGate` `onPass` (phase 5); no other entry, hook is read-only and never exposes
  the answer (plan decision 11, phase 6 helper reads the DOM) ✓. Wrong answer = new challenge, no lockout; 3-digit
  product, guessing negligible ✓.
- Input under the overlay: `WelcomeScene.input.enabled = false` before mounting, restored only on "Anuluj"; proven by phase 9
  test 6 with a deliberate break ✓. `[human]` 7.5 names the deviation from FR-012 ✓.
- Age × month table (`docs/ZADANIA.md` §1) vs plan bands: Sep–Jan = `getMonth()` 8–11, 0; Feb–Jun = 1–5; Jul–Aug = 6–7 ✓;
  age 6 → E1 every band (no warm-up), age 10 → E6 every band (warm-up from E5), age 7 Jul–Aug → E2 (literal table) ✓;
  boundary tests Jan/Feb, Jun/Jul, Aug/Sep in phase 1 ✓.
- Follow-ups with `Trigger: S-06` (`2026-10-12-narrator-round-summary/follow-ups/review-fixes.md`): `pl.title` + bare widget
  numbers → phases 4 and 7 ✓. Also triggered by "next change to `e2eHook.ts`": `nextRound`/`toRoom` null in the room →
  phase 4 ✓.

## Findings

### F1 — `page.clock.setFixedTime` freezes Phaser 4 tweens

- **Severity**: ❌ CRITICAL
- **Impact**: 🔎 MEDIUM — real tradeoff; pause to reason through it
- **Dimension**: Blind Spots
- **Location**: Key Discoveries; Phase 4 §3 (helper); Phases 8–9 (spec)
- **Detail**: Playwright 1.64 docs (context7, `docs/src/clock.md`): `setFixedTime` fixes `Date.now()`/`new Date()` and keeps
  timers running — the plan's claim is right about timers/rAF, but Phaser 4.2.1 `TweenManager.getDelta` computes the tween
  step from `Date.now()` (`node_modules/phaser/src/tweens/TweenManager.js`, `start`/`getDelta`; `step` returns on
  `delta <= 0`). With a fixed time every tween stands still: `TaskScene.shake` leaves `cameras.main.scrollX` at
  `-ANIMATION.shakeDistance` after a wrong answer (all later taps offset — phase 8 test 2 answers wrong on purpose),
  `flyStar` stars hang on screen. `page.clock.install` would also freeze rAF. The helper would also make #11 and the narrator
  spec run with frozen tweens from phase 4 on.
- **Fix ⭐ (applied)**: month from an e2e-build-only URL parameter: `e2eMonth(search)` in `src/testing/e2eHook.ts`;
  `main.ts` `callbacks.preBoot` sets `REGISTRY_KEYS.month = (__E2E_HOOK__ ? e2eMonth(location.search) : null) ??
  new Date().getMonth()`; `WelcomeScene` and the stage panel read the registry; helper and spec `goto('/?e2eMonth=9')`;
  row 4.3 adds `grep -rl e2eMonth dist/` empty. Rejected: `addInitScript` patching `Date.prototype.getMonth` (global
  monkeypatch, invisible in the app code). Strength: no `Date` in scenes, production path unchanged, stripped like the hook.
  Confidence: HIGH — read the Phaser source. Blind spot: none significant.
- **Decision**: FIXED (plan Key Discoveries, Phase 4 §1–§3 and 4.3, Phase 5 §3, Phase 8 overview, Phase 9 test 4, decision 9,
  Known risks; plan-brief rows)

### F2 — `tests/round.test.ts` asserts `balance.defaultStage`

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 §2
- **Detail**: `describe('balance')` in `tests/round.test.ts` expects `balance.defaultStage` to be `'E3'`; phase 4 removes the
  key and its criterion greps only `src/`, so typecheck and unit would go red with no file listed.
- **Fix**: `tests/round.test.ts` added to Phase 4 §2 files with the assertion removed.
- **Decision**: FIXED

### F3 — Hook getters call `UIScene` on the welcome screen

- **Severity**: ⚠️ WARNING
- **Impact**: 🏃 LOW — quick decision; fix is obvious and narrowly scoped
- **Dimension**: Plan Completeness
- **Location**: Phase 4 §3
- **Detail**: `installE2EHook` `snapshot` calls `ui().counterText()` / `ui().speakerTarget()` and `targets` calls
  `task().targets()`; at the welcome `UIScene` is not started (`counter`, `speaker` undefined), so the getter throws, the
  specs' `readHook` swallows it as `null`, and `passWelcome` would wait for `screen === 'welcome'` forever. The plan only said
  "skip `task().snapshot()`".
- **Fix**: Phase 4 §3 now states both getters skip `task()` and `ui()` while `WelcomeScene` is active.
- **Decision**: FIXED

### F4 — `narrator.speak` before `unlock` is harmless

- **Severity**: OBSERVATION
- **Dimension**: Blind Spots
- **Location**: Phase 6 (auto-read of the first task)
- **Detail**: `createNarrator` `speak` checks only `synth`/`voice`, defers through `setTimeout(cancelGapMs)` and wraps
  `synth.speak` in `safely`; the age `pointerup` bubbles to `#game-container` (`unlockSpeech` in `main.ts`) before
  `scene.start` creates `TaskScene` on a later step. On the parent path "Zatwierdź" is a DOM click that may not pass through
  `unlockSpeech`; worst case silence, never an error. Recorded in Known risks; `[human]` 6.5 covers the iPad.
- **Decision**: RECORDED

### F5 — Phase 4 size

- **Severity**: OBSERVATION
- **Dimension**: Lean Execution
- **Location**: Phase 4
- **Detail**: Two new UI components (`WelcomeScene`, `AgeButton`) — within the ≤ 2 limit; the rest is glue (Boot seam, hook,
  shared helper adopted by two specs, layout test). Splitting would leave a phase with the welcome on and both round specs
  red. Kept as one phase.
- **Decision**: RECORDED

### F6 — Seeded rng under a fixed clock (moot after F1)

- **Severity**: OBSERVATION
- **Dimension**: Blind Spots
- **Location**: `TaskScene` `createRng(Date.now() >>> 0)`
- **Detail**: Under `setFixedTime` every run would draw the same tasks; with the URL parameter `Date.now()` keeps running, so
  task variety in e2e stays as today.
- **Decision**: RECORDED

VERDICT: PROCEED — approach sound and implements the orchestrator's decision without holes; the one critical (frozen Phaser tweens under `page.clock`) and two completeness gaps are fixed in plan.md.
