# Handoff — `narrator-round-summary` (slice S-05)

Phase 10 (seam sweep, docs, follow-ups) is committed in `8a16196`. Next is phase 11 (e2e). The e2e gate was NOT run green in this session: the orchestrator must run `npx playwright test` on this commit.

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary` |
| Commits | docs, p1..p9, p10 (`8a16196`), this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 20 |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `docs/design-gaps.md` | rows 13 (no voice -> speaker hidden) and 14 (HUD counter above summary/room) added; row 4 untouched; row 5 was already gone |
| `src/scenes/UIScene.ts` | DESIGN-GAP comments point at rows 13 and 14 |
| `CLAUDE.md`, `AGENTS.md` | Current state / structure: narrator, summary, `RoomScene`, HUD, hook |
| `context/changes/narrator-round-summary/follow-ups/review-fixes.md` | new; each item has `Trigger:` (S-09 cost, numberToWords >1000, "Oblicz" for comparisons, test-plan refresh, parent autoRead S-08/S-11, S-04 carry-overs); the HUD-switch follow-up is dropped (built) |

## 3. Verification

| Command | Result |
|---|---|
| `validate-rule-files.sh` | PASS (122 paths, 0 missing) |
| lint, typecheck, deploy + ops shell tests, `sample` E1-E6 | OK |
| unit (`npm test`) | 670 passed (baseline 670, +0) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| Deliberate break | the plan's break (profile points at a missing file) stayed PASS: the validator reads the rule files (CLAUDE.md etc.), not the profile, so that was the wrong break (meta-check). Real break: `CLAUDE.md` pointing at `src/ui/narratorz.ts` -> `FAIL ... missing: 1`; restored, PASS |
| `npx playwright test` | not runnable in this session (Chromium MachPort Permission denied; 2 failed, 2 did not run) - orchestrator gate |

## 4. Next command

/10x-e2e narrator-round-summary phase 11

## 5. Open

Rows [reviewer] 1.5, 2.5, 6.5, 7.4, 10.4 (seam sweep: no stale comments or dead keys found; `pl.round.next` and `TaskSnapshot.counter` are still used, the latter by the phase 11 spec until it moves to the hook counter); [visual] 5.4, 6.6, 7.5, 9.4; [human] 10.5-10.9; phase 11 e2e (spec uses the registry `counter` field until then; should also cover the HUD switch: visible after a correct answer, hidden on the first try and in the room, tap leads to the room and back to phase `done`); phase 12 e2e.

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
