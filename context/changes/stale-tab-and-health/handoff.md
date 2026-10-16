# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Phase 9 (sound section honesty) written by `/10x-implement` in run `2026-10-16-fix-stale-tab-health`; code commit `6b6365d`. The next agent must not get wrong: `REGISTRY_KEYS.soundPrefsKept` is runtime only and set only after the parent confirms settings; the BootScene `catch` still never rethrows.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., `b45963e` (p8 docs), `6b6365d` (p9 code), then a docs commit with this handoff and the ticks |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 9.2 (orchestrator e2e), 9.4 [reviewer], 8.4 [reviewer], 7.5 [reviewer], 6.4, 5.5, 4.4 [reviewer], 3.5, 2.5, 1.6 [reviewer], phases 10-12 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/sound.ts` | pure `allEffectKeys(defs)` (boot entries only, no music) |
| `src/scenes/BootScene.ts` | sound `catch` calls `setMissing(allEffectKeys(SOUNDS))` inside its own try/catch (warn only) |
| `src/data/layout.ts`, `src/scenes/UIScene.ts` | `REGISTRY_KEYS.soundPrefsKept` set from `createSoundPrefStore(...).write` result; passed as `sound.prefsKept` |
| `src/ui/dom/settingsPanel.ts`, `src/data/pl.ts`, `docs/design-gaps.md` | muted line `soundPrefsNotKept` when `prefsKept === false`; DESIGN-GAP 121 |
| `tests/sound.test.ts` | 2 rows for `allEffectKeys` |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck, `npm test`, deploy scripts, `sample` E1-E6, build | OK; unit 3138 = branch baseline 3136 + 2; build `e2e hook: absent (2 chunks checked)` |
| e2e | not run by me (orchestrator gate); phase 8 gate: 121 passed on b45963e |
| Deliberate break | `allEffectKeys` without the `boot` filter (music key included): 2 rows red (`to deeply equal`, `length 12 but got 13`); restored, 22 passed |
| Meta-check | proves the key list only; the one-line `catch` wiring and the `prefsKept` plumbing are read by the reviewer (9.4) |

## 4. Next command

`/10x-implement stale-tab-and-health phase 10`

## 5. Open

- Rows: 9.2 e2e (orchestrator), 9.4 [reviewer]; earlier [reviewer] rows; 3.5, 2.5.
- Specs to watch: none expected (no e2e change; `prefsKept` hidden until a failed write in the session).
- Carried: [human] 10.6, 11.4; [visual] 12.4 (now also `soundPrefsNotKept`); [reviewer] 10.7.
- No unit test for the `prefsKept` false path (pure store `write` already covered; the line is view glue).

## 6. Autonomous decisions

- Skill prompts (gate, commit message, next phase) decided in place; phase stops after commit.
- `soundPrefsKept` is set only on a confirmed settings write, so the line appears when the panel is reopened after a failed write in the same session (as the plan says); chosen over also probing storage at boot (more code, plan did not ask).
- Wording of `soundPrefsNotKept` is provisional (row 121), for a teacher read.
- Row 8.3 ticked with the orchestrator's gate result.
