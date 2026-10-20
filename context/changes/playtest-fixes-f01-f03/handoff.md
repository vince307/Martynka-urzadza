# Handoff — `playtest-fixes-f01-f03` (slice fix:playtest-fixes-f01-f03)

Written by the `/10x-implement` step, phase 4 (F-02 a: the gear looks active, a tap shows a hint), run 2026-10-20-playtest-boot.
Phase 4 committed; local gate green; e2e left to the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/playtest-fixes-f01-f03` |
| Commits | phases 1-3 (49a682f, e6b1d9c, 9f0cb7c), phase 4 `feat(playtest-fixes-f01-f03): The gear looks active and answers a tap with a hint (p4)` 27227e3, a docs commit with this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 4.4 (e2e, orchestrator), 4.5, 4.6 [visual], 4.7 [reviewer], 1.6, 3.5 [reviewer]; phases 5-9 open |
| Working tree | clean after the commits |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/SettingsHint.ts` | new non-interactive bubble (`show`, `hide`, `visible`), text `pl.settings.hint` |
| `src/data/layout.ts` | `HUD_LAYOUT.settings` full colour (alpha 1, speaker family), `HUD_LAYOUT.settingsHint`, `REGISTRY_KEYS.settingsHintShown` (outside `SAVE_KEYS`) |
| `src/data/balance.ts` / `src/data/pl.ts` | `parentSettings.hintMs` 3000; `settings.hint` "Przytrzymaj, żeby otworzyć ustawienia rodzica" |
| `src/scenes/UIScene.ts` | `feed` shows the hint once on `tap`; hidden on `fire`, shutdown, after `hintMs`; `settingsHintVisible()` |
| `src/testing/e2eHook.ts` | snapshot field `settingsHint: boolean` (hook build only) |
| `docs/design-gaps.md` | rows 25, 28 rewritten, new row 151 |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck / npm test | OK / OK / 3674 passed (phase 3 3674, +0: canvas-only phase) |
| deploy scripts, sample E1-E6, build | OK, `e2e hook: absent (2 chunks checked)` |
| 4.1 / 4.2 greps | `alpha: 0.7` gone from layout; `settingsHintShown` only in `REGISTRY_KEYS`, not in `SAVE_KEYS` |
| deliberate break | none possible (canvas only, per row 4.3); proof is the phase-9 e2e and the [visual] rows |
| e2e | not run (orchestrator). Phases 2+3 gate: 138/139, SV2-10 flake green 3/3 alone; rows 2.3, 3.4 ticked for it |
| visual | not looked at (no screenshot taken) |

## 4. Next command

Phase 5 (`Driver: tdd`): `/10x-tdd playtest-fixes-f01-f03 phase 5`

## 5. Open

- Manual rows: 4.5, 4.6 [visual], 4.7 [reviewer], 1.6, 3.5 [reviewer].
- Row 4.4 waits for the orchestrator's e2e (`parent-settings.spec.ts` "#14" must stay green).
- Hint bubble geometry (right 1878, bottom 936, width 380, three lines) overlaps the notebook's lower right margin for 3 s; a visual check should confirm it covers no "Dalej"/keypad key and, in the room, no panel or task button.

## 6. Autonomous decisions

- T-1..T-3 from phase 3 stand.
- P4-1 Exec mode: implemented in this context, no subagent. Commit message: proposed one. Stopped after phase 4.
- P4-2 No new automated test (plan row 4.3: canvas only); the deliberate break is deferred to phase 9 as the plan says.
- P4-3 Hint position above the gear, right edge flush with it; fill `PLACEHOLDER_COLORS.hint` value, border `hintBorder` value copied as literals to match the neighbouring HUD tokens. Would change: visual gate finds an overlap.
