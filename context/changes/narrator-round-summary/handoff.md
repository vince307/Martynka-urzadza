# Handoff — `narrator-round-summary` (slice S-05)

Phase 12 (the last, e2e: narrator by touch on a fake synthesizer) is committed in `03dfa1c`; all implementation phases are done and `change.md` is `implemented`. Next is the implementation review; do not re-run Playwright from a sandboxed session.

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary` |
| Commits | docs, p1..p12 (p12 = `03dfa1c`), handoff commits |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` (updated 2026-10-13) |
| `## Progress` rows remaining | 14 (reviewer, visual and human rows only) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/narrator.spec.ts` | 3 tests on a fake `speechSynthesis` (init script): silent at cold start and after "Dalej" (E3 auto-read off); speaker reads on pointerup only, Polish voice, no answer leak, retry prompt after a wrong answer; no Polish voice: speaker hidden, round to summary |
| `playwright.config.ts` | `ROUND_SPEC` = `/(task-round|narrator)\.spec\.ts/`; the app `webServer` entry is untouched |
| `context/runs/2026-10-12-s04-s08/e2e-request-p12.md` | orchestrator's run outputs |
| `context/changes/narrator-round-summary/{plan.md,change.md}` | rows 12.1-12.3 ticked, status implemented |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| unit (`npm test`) | 670 passed (baseline 670, +0) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| `npx playwright test tests/e2e/narrator.spec.ts` | orchestrator run 2026-10-13: 3 passed (27.1s) |
| `npx playwright test` | orchestrator run: 8 passed (42.7s) = baseline 5 + 3 |
| Deliberate break | orchestrator applied `e2e-break-p12.patch` (SpeakerButton narration request on `pointerdown` instead of `pointerup`): `-g "pointerup only"` -> 1 failed at `tests/e2e/narrator.spec.ts` `expect(await spokenSoFar(page)).toEqual([])`, Received `[{ lang: "pl_PL", rate: 0.85, text: "Oblicz. dziesięć plus osiemnaście" }]`; reverted with `git apply -R`. Meta-check: unit stays green (670), so the spec proves the touch gesture rule. Optional auto-read break not run |
| Playwright in this session | not run (finishing agent; evidence is the orchestrator's) |

## 4. Next command

/10x-impl-review narrator-round-summary

## 5. Open

Rows [reviewer] 1.5, 2.5, 6.5, 7.4, 10.4; [visual] 5.4, 6.6, 7.5, 9.4; [human] 10.5-10.9 (iPad/Android listening, gesture, auto-read after "Kolejna runda"). Follow-up: `/10x-test-plan refresh` to give the narrator risk a number. The plan said +2 e2e tests, the spec has +3 (cold-start check and pointerup/retry check are separate).

## 6. Autonomous decisions

1. **Switch fires in pointerup only when the press began on it** (as `PageButton`), not in pointerdown like `ActionButton`. Would change: S-04's <100 ms reaction target is extended to HUD buttons.
2. **Guard in `TaskScene`'s `toRoom` handler via `this.sys.isSleeping()`** plus zeroing `REGISTRY_KEYS.roomSwitch` before `scene.switch`; wake re-renders it from `roundView`. Per the plan review (game.events listeners survive sleep). Would change: Phaser stops running scene listeners while sleeping.
3. **Hook exposes `roomSwitch` from `UIScene` (in `e2eHook.ts`), not via `TaskTargets`**, since the button lives in the HUD scene. Would change: nothing.
4. **Label font role `barButton` (40 px), icon+label centred** in the 316 px box; kit has no exact spec for this size. Would change: kit adds one.
5. **Gate prompts decided in place; stopped after phase 9.** Phases 1-8 decisions (below) remain in force.
6. Earlier decisions, phase 1: one test file `tests/taskSpeech.test.ts` over the real curriculum (would change: reviewer wants per-generator files); ROMAN draws the context index with `rng.int` so spoken and written contexts match; Roman reading says "zapis rzymski X" (would change: teacher read prefers "cyfry rzymskie").
7. Phase 2: "Oblicz." prefix added in `spokenTask`/`narrationOf` for bare calculations (not in `spokenText`, so hints stay unprefixed); number words only inside pure-calculation segments, sentences keep digits; no-leak invariant runs on the command, an answer form already on the screen exempts the task; sample line prints `czyta:`.
8. Phase 3: `createNarrator` takes injected timers (`visibilitychange` wiring is in phase 5); voices poll counted in `voicePollMs` ticks; `isPolishLang` exported; `unlock` is a no-op without a known Polish voice.
9. Phase 4: `starsTotal` is passed by the caller; `switchVisible` is also true after a retype (`done` without star), because FR-011 says "between tasks".
10. Phase 5: narrator set in `callbacks.preBoot`; auto-read only after "Dalej", never at a cold start; the first agent's uncommitted work was reviewed and committed by a re-dispatch.
11. Phase 6: `PageButton` fires only when pressed on itself (the fifth "Dalej" pointerup lands on the new zone); `starsTotal` = session total incl. this round, `nextRoomTaskCost: null` until S-09; star row butter vs pale (DESIGN-GAP 11).
12. Phase 7: room panel height 840 (resume box ends below the notebook edge); `PageButton.show` takes an optional size; wake handling re-renders the task and re-shows the room button; DESIGN-GAP row 12 for the caption.
13. Phase 8: hook extended read-only with frozen copies; scenes never import it; guard proved with an unconditional `installE2EHook` (build fails).
14. Phase 10: kept `TaskSnapshot.counter` and `pl.round.next` (still used); no duplicate roman spelling found (`spellRoman` is the single place); validator break changed from profile to a rule file (the validator does not read the profile). Rows 13-14 numbered after 12.
15. Phase 11: the spec was written by an earlier session (Chromium could not launch), reviewed here against the plan and the e2e quality rules (getByRole not applicable: canvas game driven through the hook and `touchscreen.tap`; no `waitForTimeout`; polls via `expect.poll`; titles carry `#11`) with no defect found, so it was committed unchanged. `TaskSnapshot.counter` removed as the plan says (spec reads `counterText`). Silent `speechSynthesis` stub in `beforeEach`. Phase 11 commit message decided in place.
16. Phase 12: the spec was written by an earlier session (Chromium could not launch); reviewed here against the plan and the e2e quality rules, no defect found (canvas driven through the hook and touch events, no `waitForTimeout`, `frames()` via rAF, titles carry `#narrator`), committed unchanged. Config diff touches only `ROUND_SPEC`. Three tests instead of two; break moved from `UIScene` input to the `pointerdown` rule (orchestrator). Would change: reviewer wants the plan's +2 count kept.
