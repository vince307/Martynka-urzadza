# Handoff — `parent-settings-progress` (slice S-08)

Written by the phase 6 step (`/10x-implement` phase 6, autonomous run 2026-10-12-s04-s08). Phase 6 glued the phase 2-5 logic into the scenes: one game-wide input suspender, welcome and install hint on it, `GAME_EVENTS.parentStage` with the stage change in `TaskScene`, `effectiveAutoRead` as a getter, read-only hook fields. Phases 1-6 of 11 are committed; e2e is the orchestrator's gate (Chromium not launchable here).

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | p1-p5 as before (last `6238cb6`), `ebd0351` (p6), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (status moves at the last phase) |
| `## Progress` rows remaining | 31 (6.1 open for e2e, 6.6 reviewer, 6.7 human, plus phases 7-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/layout.ts` | `GAME_EVENTS.parentStage`, `REGISTRY_KEYS.settings`, `REGISTRY_KEYS.inputSuspender` |
| `src/main.ts` | `preBoot` sets `initialSettings()` and `createInputSuspender(booting.input, onRelease = every pointer.reset())`; `contextmenu` preventDefault on `#game-container`; install hint gets `() => suspender.suspend()` |
| `src/pwa/installHint.ts` | `mountInstallHint(parent, platform, standalone, suspend?)` holds the suspension until `dismiss` (closes the S-06 tap-leak follow-up) |
| `src/scenes/WelcomeScene.ts` | `openParent` holds a suspender hold (`releaseInput`); `resumeInput()` in both `onCancel`, `start()` and `shutdown`; no `this.input.enabled` left |
| `src/scenes/TaskScene.ts` | `autoRead` is a getter on `effectiveAutoRead(registry settings, stage, balance.narrator.autoReadStages)`; `applyParentStage(read)` (same-stage guard, narrator cancel, camera tween kill, `sessionStars += state.starsEarned` before `freshRound()`, no restart); listener for `GAME_EVENTS.parentStage` (guarded by `isSleeping`) and `onWake` comparing `learner.stage` (no auto-read on wake); `finishRound` already used `roundResults` since p4 |
| `src/testing/e2eHook.ts` | `snapshot.settings` (frozen copy) and `snapshot.inputEnabled` (`game.input.enabled`), also on the welcome |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `npm run lint` / `npm run typecheck` | both clean |
| `npm test` + deploy tests + `sample` E1-E6 | exit 0; 947 passed (branch baseline 947, +0) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `grep -rl __martynkaE2E dist/` empty; `parentStage`/`inputSuspender` only in the app bundle `dist/_app/index-*.js` |
| `grep -n "this.input.enabled" src/scenes/WelcomeScene.ts` | empty |
| Deliberate break 1 | `WelcomeScene.openParent` without the suspend: unit stays 947 green (as the plan expects); proof only by e2e phase 10 |
| Deliberate break 2 | `autoRead` getter ignoring parent settings: unit stays green; `narrator.spec.ts` stays green too because settings cannot be changed yet (not run here); proof in e2e phase 11. Both restored (lint, typecheck clean) |
| Meta-check | both breaks are seams no unit covers (scenes), so phase 6 claims no coverage; they are the planned proof targets of phases 10-11 |
| e2e | `e2e: not runnable in this session (MachPort) — orchestrator gate`. `npx playwright test` died with MachPortRendezvous/SIGTRAP (5 failed to launch, 10 did not run). Orchestrator command: `npx playwright test` (expected 15 passed, the specs are unedited); no e2e break patch needed (no assertion depends on a browser-only change; file not written) |

## 4. Next command

/10x-implement parent-settings-progress phase 7

## 5. Open

- Row 6.1 and the e2e part of rows 4.3, 5.4, 6.5: orchestrator run of `npx playwright test` on `ebd0351` (expected 15 passed); if red, re-dispatch phase 6. Risk areas to read first: the welcome parent path and install hint suspension (`first-launch.spec.ts`), `narrator.spec.ts` (E1/E2 read, E3 silent).
- Rows 6.6 [reviewer] and 6.7 [human] (iPad/Android install hint tap leak) are not mine.
- No UI yet for the settings icon or panel (phase 7); nothing emits `GAME_EVENTS.parentStage` until then. `UIScene.create` still sets `this.input.enabled = true` on the scene plugin (per-scene flag, unrelated to the game switch).
- `[human]` rows: 6.7, 9.6, 9.7, 9.8 (a)-(e). DESIGN-GAPs 25-28 and follow-ups as planned for phase 9.

## 6. Autonomous decisions

1. `main.ts` reads the suspender from the registry right after `new Game` (Phaser boots synchronously in a module script, `preBoot` has run) and passes `undefined` to the install hint if it were absent, rather than throwing.
2. `applyParentStage(read)`: the live event reads (`autoReadFirst`), the wake path does not (plan).
3. `Settings` type imported into `TaskScene` for the registry cast; the hook falls back to `{ autoRead: null }` when the registry has none.
4. Commit message and stop-after-phase decided in place (contract rule 1); no AskUserQuestion.
