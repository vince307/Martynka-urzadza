# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Phase 8 (music status line) written by `/10x-tdd` in run `2026-10-16-fix-stale-tab-health`; code commit `ae33f85`. The next agent must not get wrong: `'waiting-unlock'` is now a music state (service, e2e hook type) and `stopMusic` decides "was waiting" from it.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., `1d835ac` (p7 docs), `ae33f85` (p8 code), then a docs commit with this handoff and the ticks |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 8.3 (orchestrator e2e), 8.4 [reviewer], 7.5 [reviewer], 6.4, 5.5, 4.4 [reviewer], 3.5, 2.5, 1.6 [reviewer], phases 9-12 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/sound.ts` | `MusicState`, `MusicLine`, pure `musicLine(prefs, music)` |
| `src/ui/sound.ts` | `SoundStatus.music` adds `'waiting-unlock'`; `start` wrapped in `try` -> `'missing'` + warn (name only) |
| `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts` | `sound.music` option; muted line `.parent-music-status` under the music group |
| `src/data/pl.ts`, `docs/design-gaps.md` | `settings.musicStatus.{loading, waitingUnlock, missing}`, DESIGN-GAP 120 |
| `tests/sound.test.ts`, `tests/e2e/support/hook.ts`, `tests/e2e/final-sound.spec.ts` | 3 tests; hook type; poll regex also accepts `waiting-unlock` |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub `musicLine` returning null) | `AssertionError: expected null to be 'loading'` |
| GREEN | `tests/sound.test.ts` 20 passed |
| lint, typecheck, `npm test`, deploy scripts, `sample` E1-E6, build | OK; unit 3136 = branch baseline 3133 + 3; build `e2e hook: absent (2 chunks checked)` |
| e2e | not run by me (orchestrator gate) |
| Deliberate break | `musicLine` without the `prefs.music` check: "music switched off" red (`expected 'loading' to be null`); restored, green |
| Meta-check | proves the view rule only, not Phaser's unlock nor the service transitions |

## 4. Next command

`/10x-implement stale-tab-and-health phase 9`

## 5. Open

- Rows: 8.3 e2e (orchestrator), 8.4 [reviewer]; earlier [reviewer] rows; 3.5, 2.5.
- Spec to watch: `final-sound.spec.ts` (line ~129 poll regex widened to `loading|waiting-unlock|playing`, since a locked context now reports `waiting-unlock`); `final-sound-failure.spec.ts` has no music-state assertions.
- Carried: [human] 10.6, 11.4; [visual] 12.4; [reviewer] 10.7; DESIGN-GAP 121 later.

## 6. Autonomous decisions

- Skill prompts (gate, commit message, next phase) decided in place; phase stops after commit.
- Mixed phase: TDD for `musicLine`; the service state change and panel wiring were done inline, phase keeps `Driver: tdd`.
- Wording of `musicStatus` is provisional (row 120), for a teacher read.
- `stopMusic` now reads `musicState === 'waiting-unlock'` instead of `musicSound !== undefined`; a playing sound still ends as `off`.
