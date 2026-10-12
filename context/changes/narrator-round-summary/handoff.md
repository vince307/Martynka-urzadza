# Handoff — `narrator-round-summary` (slice S-05)

The impl-review step reviewed phases 1–12. Verdict: APPROVED, `MERGE: CLEAR`. Two warnings were fixed in `3f372ca`: the speech unlock is kept until a voice is known, and the comments and DESIGN-GAP rows were aligned. That commit changes code after `03dfa1c`, but this session re-ran e2e on it with Chromium: 8/8. The visual gate is next. Do not tick the [visual] or [human] rows without screenshots or a maintainer.

## 1. State

| | |
|---|---|
| Branch | `feat/narrator-round-summary` (cut from `main` at `8467431`) |
| Commits | docs, p1..p12, `3f372ca` fix (impl-review), then the review docs commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `impl_reviewed` (updated 2026-10-13) |
| `## Progress` rows remaining | 9 (all [visual] or [human]) |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/narrator-round-summary/reviews/impl-review.md` | Full-plan review. F1–F10; ends with `MERGE: CLEAR` |
| `context/changes/narrator-round-summary/reviews/teacher-read.md` | Teacher read for rows 1.5, 2.5, 6.5 and 7.4 |
| `context/changes/narrator-round-summary/follow-ups/review-fixes.md` | Five new follow-ups with `Trigger:` lines. The "Oblicz" item now also covers the commutativity equation |
| `context/changes/narrator-round-summary/plan.md` | Rows 1.5, 2.5, 6.5, 7.4 and 10.4 ticked |
| `src/ui/narrator.ts` | `Narrator.unlock(): boolean` |
| `src/main.ts` | `unlockSpeech` keeps the DOM listeners until `unlock()` returns true. Scene-list comment updated |
| `tests/narrator.test.ts` | New test: a tap before the voices load does not unlock |
| `src/scenes/TaskScene.ts`, `src/scenes/RoomScene.ts` | `wake` listeners removed on `shutdown`. TaskScene class doc updated |
| `src/scenes/UIScene.ts`, `src/data/layout.ts` (`GAME_EVENTS.toRoom`, `SUMMARY_LAYOUT.bonus`, `ROOM_LAYOUT.resume`), `src/ui/widgets/SummaryPanel.ts`, `src/core/round/summary.ts` (`SummaryView.roomHighlighted`), `docs/design-gaps.md` | Comments and DESIGN-GAP rows 9–13 aligned |
| `AGENTS.md` | Body trimmed to 400 words |

## 3. Verification

Everything below was observed in this step.

| Command | Result |
|---|---|
| lint, typecheck | OK on `690847b` and on `3f372ca` |
| unit (contract command: `npm test`, deploy scripts, `sample` E1–E6) | `690847b`: 670 passed (main baseline 596, +74). `3f372ca`: 671 (596 + 75, the extra one is the unlock test). `Naruszenia: 0` for all six stages |
| build | `e2e hook: absent (2 chunks checked)`. `grep -rl __martynkaE2E dist/` is empty |
| `npx playwright test` (one plain command; Chromium launched in this session) | `690847b`: 8 passed (main baseline 4, +4). `3f372ca`: 8 passed. Ports 4397 and 4398 were free afterwards |
| `validate-rule-files.sh` | PASS |
| Deliberate break, no browser | Restored `roman.ts` and `compareNum.ts` to their main versions (no `speak`). 8 tests went red in `tests/taskSpeech.test.ts` and `tests/spoken.test.ts` (`expected undefined to be defined`; a Roman numeral token matched). Restored; the tree was clean. Meta-check: the phase 1 tests fail against the generators as they were before the slice. So the RED was real, even though the phase 1 agent wrote the production code first and stashed it |
| F1 test-first | The new unlock test was red before the change (`unlock()` returned undefined) and green after |
| Hook bypass check | `.claude/settings.json` and `.claude/hooks/*` were last modified before `ad5535b`. No bypass found |

## 4. Next command

visual gate (orchestrator), then /10x-archive narrator-round-summary and ship

## 5. Open

- [visual] rows:
  - 5.4: speaker shown and hidden
  - 6.6: summary for a clean round and for a retyped round
  - 7.5: the room, and the summary after coming back
  - 9.4: HUD switch shown and hidden; room and task after coming back
- [human] rows, for the maintainer:
  - 10.5: decision — auto-read is a session default until S-08
  - 10.6: decision — "Do pokoju" not highlighted until S-09
  - 10.7: decision — the room returns to the screen the child left
  - 10.8: decision — no auto-read at a cold start
  - 10.9: iPad and Android listening test (voice quality, numbers in sentences, Roman letters, one unlock per session)
- Follow-ups are in `follow-ups/review-fixes.md`:
  - `Narrator.unlock` with an empty utterance on WebKit (Trigger: row 10.9)
  - Shared HUD button for `SpeakerButton`/`RoomSwitchButton`/`PageButton` (Trigger: S-09)
  - `romanContexts`/`romanSpeakContexts` pairs (Trigger: the next change to them)
  - `romanHint` first step gives the result (Trigger: S-17)
  - Hook `targets` in the room (Trigger: the next change to `e2eHook.ts`)
  - From earlier phases: S-08, S-09, S-11, S-06, `/10x-test-plan refresh`
- Recorded only (F5): a `toRoom` emitted twice in the same frame could restart `RoomScene`. Not reachable today.

## 6. Autonomous decisions

Impl-review step:

1. **Fixed F1 (unlock) and F2 (comments and DESIGN-GAP rows, `wake` cleanup, AGENTS.md) now; deferred F3 (shared HUD button) to S-09.** Both fixes were cheap. F3 would change three widgets that already have e2e evidence, for maintainability only. Would change: S-09 adds HUD buttons, or the art (S-16) replaces these placeholders.
2. **Ticked 10.4 (seam sweep) after the fixes, with the remaining duplication recorded as a follow-up.** Would change: a reviewer counts the duplication as a seam defect that blocks the row.
3. **Kept the teacher-read notes as follow-ups, not content changes:**
   - „pasuje w okienku” stays, consistent with the existing `pl.tasks.missing`.
   - „zapis rzymski” is correct Polish.
   - Digits stay in sentences.
   - The ROMAN hint gives the result away, but that content predates this slice.

   Would change: the iPad listening test (row 10.9) shows bad reading.
4. **Ran Playwright myself** because Chromium launched in this session. The orchestrator does not need to re-run it for `3f372ca`, but may. Would change: nothing.

Earlier steps:

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
