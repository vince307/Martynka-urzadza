# Handoff — `parent-settings-progress` (slice S-08)

Written by the phase 3 step (`/10x-tdd` phase 3, autonomous run 2026-10-12-s04-s08). Phase 3 added `effectiveAutoRead`, `initialSettings` and `changeStageByParent` as pure `src/core` code, test-first. Phases 1-3 of 11 are committed; the orchestrator's e2e on 7087b16 was 15/15.

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | `db487d2`, `965c602`, `d355ca0`, `33a40d3`, `d72768a` (p1), `6616124`, `7087b16` (p2), `6616124`..., `8f53d98` (p3), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (status moves at the last phase) |
| `## Progress` rows remaining | 43 (phases 1-3 fully ticked) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/types.ts` | `Settings.autoRead: boolean | null` (null = no parent choice, stage default applies) |
| `src/core/narration/voice.ts` | `effectiveAutoRead(settings, stageId, autoReadStages)` = `settings.autoRead ?? defaultAutoRead(...)` |
| `src/core/placement.ts` | `initialSettings()` -> `{ autoRead: null }`; `changeStageByParent(learner, stage)`: same stage returns the same object, else new stage, `stageOverriddenByParent: true`, `warmupPending: false`, `pendingUnlock: null`, `weakStreak: 0`, `easedRounds: 0`; keeps age, `unlockedStep`, `mastery`, `streak`, `history` (same references) |
| `tests/narratorVoice.test.ts`, `tests/placement.test.ts` | +2 and +6 tests (`effectiveAutoRead`, `initialSettings`, `changeStageByParent`) |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| RED (stubs returning wrong values) | `AssertionError: expected false to be true` (effectiveAutoRead, null + E1), `expected 'E3' to be 'E4'` (changeStageByParent); 4 red, then green |
| `npm run lint` / `npm run typecheck` | both clean |
| `npm test` + deploy tests + `sample` E1-E6 | exit 0; 59 files, 910 passed (baseline 881 + 29) |
| `npm run build` | OK, `e2e hook: absent` |
| Deliberate break | `pendingUnlock` kept + `||` instead of `??`: 2 tests red (parent choice `false` + E1 / fields reset); restored |
| Meta-check | oracles are plan decisions 1, 2, 9 (null default, parent choice wins, follow-up S-07 clears pendingUnlock, S-06 no warm-up after a parent override); no test reads the implementation |
| e2e | `npx playwright test` ran in this session on the pre-commit tree: 15 passed |

## 4. Next command

/10x-tdd parent-settings-progress phase 4

## 5. Open

- The orchestrator brief mentioned adding the open round's stars to the session total in `changeStageByParent`; the plan puts this in the scene (phase 6, `sessionStars += state.starsEarned` before `freshRound()`), because the learner type has no stars. Not a core concern.
- Wiring is phase 6/7: `UIScene.update` feeds `tick(time.now)`; `main.ts` passes `onRelease`; `REGISTRY_KEYS.settings` holds `initialSettings()`; `TaskScene` uses `effectiveAutoRead` and the same-stage guard.
- `[human]` rows: 6.7, 9.6, 9.7, 9.8 (a)-(e). Phase 8: "Zatwierdź"/"Anuluj" visible without scrolling at 1024x768 (row 8.5).
- DESIGN-GAPs 25-28 and follow-ups as planned for phase 9 (including the S-12 export privacy note).
- Every `Trigger: S-08` follow-up is in scope (list in reviews/plan-review.md Grounding).

## 6. Autonomous decisions

1. `initialSettings()` lives in `placement.ts` next to `SessionLearner` (plan's file list), not a new module.
2. `changeStageByParent` returns the input object for the same stage (plan-review F3 guard), a spread copy otherwise; array/record fields keep identity (`toBe` in tests).
3. Commit message and stop-after-phase decided in place (contract rule 1); no AskUserQuestion.
