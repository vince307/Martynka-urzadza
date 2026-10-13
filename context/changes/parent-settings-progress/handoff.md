# Handoff — `parent-settings-progress` (slice S-08)

Written by the phase 7 step (`/10x-implement` phase 7, autonomous run 2026-10-12-s04-s08). Phase 7 added the settings gear in the HUD (long-press machine from `core/longPress`) and the DOM settings panel (stage + auto-read, sticky actions). Phases 1-7 of 11 are committed; e2e is the orchestrator's gate (Chromium not launchable here). Do not forget: the panel has no progress preview yet (phase 8) and 7.3 stays open until the orchestrator runs e2e.

## 1. State

| | |
|---|---|
| Branch | `feat/parent-settings-progress`, cut from `main` at `bfbd18a` |
| Commits | p1-p6 as before (last `ebd0351`, handoff `6b8ee8b`), `b5efc5e` (p7), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `plan_reviewed` (status moves at the last phase) |
| `## Progress` rows remaining | 28 (7.3 open for e2e, 7.5 reviewer, 7.6 visual, 6.6, 6.7 human, plus phases 8-11) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/layout.ts` | `HUD_LAYOUT.settings` (1782,952, 96x96, muted colours, gear geometry) and `HUD_TOUCH_TARGETS.settings` |
| `src/data/pl.ts` | `pl.settings` (`title`, `autoReadHeading`, `autoReadOn`, `autoReadOff`); rest reused from `pl.parent` / `pl.stages` |
| `src/ui/widgets/SettingsIcon.ts` | gear drawn in code + zone on the icon only; reports pointerdown/up/out, no feedback |
| `src/scenes/UIScene.ts` | holds `LongPressState`; `feed`/`update` (clock `this.time.now`), `openSettings` (narrator cancel, suspend, reset hold, `openParentGate` then `openSettingsPanel`), `applySettings` (`changeStageByParent`, registry settings, `GAME_EVENTS.parentStage` only when the learner object changed), `closeSettings`, `settingsTarget()` |
| `src/ui/dom/stageChoices.ts` | shared stage button group (`createStageChoices`), used by both panels |
| `src/ui/dom/stagePanel.ts` | start panel now uses `createStageChoices` (same DOM roles, ids `parent-panel-stage`, behaviour unchanged) |
| `src/ui/dom/settingsPanel.ts` | `openSettingsPanel({ stage, autoRead, autoReadDefault(stage), onConfirm({stage, autoRead}), onCancel })`; reading choice stays `null` until On/Off is tapped; the pressed button shows the default of the chosen stage until then |
| `src/style.css` | `.parent-actions-sticky` (sticky bottom of the one overlay scroll) |
| `src/testing/e2eHook.ts` | `targets.settingsIcon` (task and room; welcome has none) |
| `tests/layout.test.ts` | gear: touch target, in scene, right of notebook and room panel, below counter/speaker/room switch |
| `context/changes/parent-settings-progress/plan.md` | rows 6.1, 7.1, 7.2, 7.4 ticked |

## 3. Verification

| Command | Result (observed in this step) |
|---|---|
| `npm run lint` / `npm run typecheck` | both clean |
| `npm test` + deploy tests + `sample` E1-E6 | exit 0; 948 passed (branch baseline 947, +1: layout gear test) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)`; `grep -rl __martynkaE2E dist/` empty |
| Deliberate break | gear `left: 1700` (over the notebook): `tests/layout.test.ts` red, "expected 1700 to be greater than or equal to 1740"; restored (diff clean, suite 948 green). Meta-check: it protects where the gear sits (outside the child's zones); the hold flow, suspension and panel are proved only by e2e phase 10-11 |
| e2e | `e2e: not runnable in this session (MachPort) — orchestrator gate`. `npx playwright test` died with MachPortRendezvous (5 failed to launch, 10 did not run). Orchestrator command: `npx playwright test` (expected 15 passed; specs unedited, `first-launch.spec.ts` exercises the refactored stage group in the start panel) |

## 4. Next command

/10x-implement parent-settings-progress phase 8

## 5. Open

- Row 7.3 and the e2e part of 7.4: orchestrator `npx playwright test` on `b5efc5e` (expected 15 passed). Read first if red: `first-launch.spec.ts` (start panel after the `createStageChoices` extraction; stage buttons found by role/name).
- Rows 7.5 [reviewer] (teacher read of `pl.settings`), 7.6 [visual] (screens at 1440x900 and 1024x768, panel with E3 and reading off), 6.6 [reviewer], 6.7 [human].
- DESIGN-GAPs for phase 9 (docs/design-gaps.md): settings gear icon, settings panel, sticky actions; comments already in `layout.ts` (`HUD_LAYOUT.settings`), `pl.ts` (`settings`), `settingsPanel.ts`.
- Panel width/height: the stage group is 2 columns; with phase 8's preview the dialog scrolls inside the overlay, actions are sticky (verify visually in phase 8 row 8.5).
- `[human]` rows: 6.7, 9.6, 9.7, 9.8 (a)-(e).

## 6. Autonomous decisions

1. `openSettingsPanel` takes `autoReadDefault` as a function of the stage (plan said a value): when the parent switches stage inside the panel with no reading choice yet, the pressed On/Off follows the new stage's default. Would change if the plan wants the display frozen at the opening stage.
2. `update()` ticks with `this.time.now` rather than the `update` argument, the same clock as `down`.
3. Sticky actions use a modifier class `parent-actions-sticky` only on the settings panel, so the S-06 start panel look is unchanged.
4. `UIScene` drops the open dialog and the input hold on `shutdown`; the hold machine is reset when the gate opens.
5. Commit message and stop-after-phase decided in place (contract rule 1); no AskUserQuestion.
