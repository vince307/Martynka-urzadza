# Handoff — `narrator-round-summary` (slice S-05)

Phase 9 (HUD "Do pokoju" switch) is committed in `a9504c9`. Next is phase 10 (seam sweep, docs, follow-ups). The e2e gate was NOT run green in this session: the orchestrator must run `npx playwright test` on this commit.

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary` |
| Commits | docs, p1..p8, p9 (`a9504c9`), this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 23 |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/widgets/RoomSwitchButton.ts` | new HUD widget (316x104, house icon drawn in code + `pl.summary.toRoom`); pointerup with a press guard; `setVisible`, `target` |
| `src/data/layout.ts` | `HUD_LAYOUT.roomSwitch`, `HUD_TOUCH_TARGETS.roomSwitch`, `REGISTRY_KEYS.roomSwitch` |
| `src/scenes/UIScene.ts` | creates the switch, follows the registry key, emits `GAME_EVENTS.toRoom`; `roomSwitchTarget()` |
| `src/scenes/TaskScene.ts` | `render()` sets `roomSwitch` from `view.switchVisible`; the `toRoom` handler ignores taps while sleeping, clears `roomSwitch` and narration before `scene.switch`; wake re-renders |
| `src/testing/e2eHook.ts` | `targets.roomSwitch` (getter, from `UIScene`) |
| `tests/layout.test.ts` | new test: switch is a touch target, left of the speaker and the progress dots |
| `docs/design-gaps.md` | row 4 rewritten (kit draws it always, FR-011 hides it while solving) |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| unit (`npm test`) | 670 passed (baseline 669, +1) |
| deploy + ops shell tests, `sample` E1-E6 | OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| Deliberate break | `switchVisible` = `state.phase !== 'solution'` in `src/core/round/view.ts`: 3 tests red in `tests/roundView.test.ts`; restored with git checkout. Meta-check: proves the rule only; drawing and the tap path are proved by e2e in phase 11 |
| `npx playwright test` | not runnable in this session (Chromium MachPort Permission denied; 2 failed, 2 did not run) — orchestrator gate |

## 4. Next command

/10x-implement narrator-round-summary phase 10

## 5. Open

Rows [reviewer] 1.5, 2.5, 6.5, 7.4, 10.4; [visual] 5.4, 6.6, 7.5, 9.4; [human] 10.5-10.9; phase 11 e2e (spec uses the registry `counter` field until then; should also cover the HUD switch: visible after a correct answer, hidden on the first try and in the room, tap leads to the room and back to phase `done`); phase 12 e2e. Phase 10 must not revert the `docs/design-gaps.md` row 4 rewrite and should drop the S-09 follow-up for the switch (it is built).

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
