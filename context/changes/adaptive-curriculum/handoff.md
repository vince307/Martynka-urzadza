# Handoff — `adaptive-curriculum` (slice S-07)

Written by `/10x-implement adaptive-curriculum phase 5`. Phase 5 committed (`0aedeff`); rows 5.1, 5.2 open for the e2e gate only.

## 1. State

| | |
|---|---|
| Branch | `feat/adaptive-curriculum`, cut from `main` at `fd68216` |
| Commits | phase 1 `8fd7bd0`, 2 `1c384c5`, 3 `ee93ff9`, 4 `dba1791`, 5 `0aedeff`; this handoff after it |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 5.1, 5.2 (e2e only), 5.5 [reviewer], phases 6-9 |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/placement.ts` | `PlacedLearner` (old shape, returned by `placeByChild`/`placeByParent`); `SessionLearner = PlacedLearner & Adaptation & { pendingUnlock }`; `needsPlacement(PlacedLearner \| null)` |
| `src/scenes/WelcomeScene.ts` | `start(placed)` builds the `SessionLearner` with `startLearning(stages, age, month, placementData, balance.curriculum)` |
| `src/scenes/TaskScene.ts` | `freshRound` -> `buildAdaptiveRound` + `roundWeights(learner, balance)`; `advance` calls new `finishRound()` once on the not-finished -> finished transition: `endRound(...)` (kind warmup/round), writes adaptation + `pendingUnlock` to the registry, then `finishWarmup()` for the warm-up. Unlock is silent (card is phase 7) |
| `src/testing/e2eHook.ts` | `learner()` = `deepFreeze(structuredClone(...))` |
| `src/ui/dom/stagePanel.ts`, `tests/placement.test.ts`, `src/data/layout.ts` | type/comment follow-ups |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| unit (npm test + deploy tests + sample E1-E6) | baseline 827 + 0 = 827 passed; deploy tests OK; `Naruszenia: 0` x6 |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| Break (no browser): remove `...startLearning(...)` from `WelcomeScene.start` | `tsc` red (unused imports and, with them used, missing `unlockedStep` etc.); restored. Weak proof: the e2e red of row 5.2 is left to the orchestrator |
| e2e `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate |

Orchestrator: run `npx playwright test` on `0aedeff`, expect 14 passed (seed, #11 x4 incl. room, #12 x6, narrator x3). Paths touched at runtime: every spec starts a round, so a break would show as a failed `Welcome -> Task` start (round building throws without `unlockedStep`). Optional break for 5.2: delete `...startLearning(...)` line in `WelcomeScene.start` and run `npx playwright test`; expect the #11/#12/narrator specs red. No known break needing a browser.

## 4. Next command

`/10x-tdd adaptive-curriculum phase 6`

## 5. Open

- Rows 5.1, 5.2 open for the orchestrator's e2e (tick on green with its sha). 5.5 is [reviewer].
- Phase 7 must read `learner.pendingUnlock` (set now, never cleared yet; current value is only overwritten by a later unlock).

## 6. Autonomous decisions

1. Skill questions decided in place: implement in this context, proposed commit message, stop after phase 5.
2. Kept `warmupResult`/`finishWarmup` untouched; `finishRound` runs `endRound` first, with `this.stage` still the pre-drop stage (warm-up only records mastery).
3. Transition detected with `wasFinished` captured before `next()` so `endRound` runs once per round.
4. `pendingUnlock: unlocked ?? learner.pendingUnlock` (an earlier pending card is not lost).
5. Break proof done by typecheck because Chromium cannot launch here (MachPort).
