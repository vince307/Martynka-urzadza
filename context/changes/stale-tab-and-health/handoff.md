# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Phase 7 (screen pictures in "Obrazki") written by `/10x-tdd` in run `2026-10-16-fix-stale-tab-health`; code commit `8c2e3e2`. The next agent must not get wrong: `uiArtHealth` is a separate registry key and never feeds `artFilter`; the section `data-state` is now the worst of its lines.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., `05d13c6` (p6), `c43f201` (p6 docs), `8c2e3e2` (p7 code), then a docs commit with this handoff and the ticks |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 7.4 (orchestrator e2e), 7.5 [reviewer], 6.4, 5.5, 4.4 [reviewer], 3.5, 2.5, 1.6 [reviewer], phases 8-12 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/artHealth.ts` | `sectionState(views)`: `missing` if any line is missing, else `ok` (`unknown`/absent ignored) |
| `src/scenes/BootScene.ts`, `src/data/layout.ts` | `REGISTRY_KEYS.uiArtHealth` = `artHealth(UI_ART ...)` + one `console.warn`; not in `SAVE_KEYS` |
| `src/ui/dom/artHealthView.ts`, `settingsPanel.ts`, `UIScene.ts` | third line `.parent-ui-art`; section `data-state` from `sectionState` |
| `src/data/pl.ts`, `docs/design-gaps.md` | `settings.uiArtOk`, `uiArtMissing` (verb agreement), DESIGN-GAP 119 |
| `tests/artHealth.test.ts`, `tests/artHealthText.test.ts` | `sectionState` (5 cases), `uiArtMissing` for 1, 2, 5 |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub `sectionState` always `ok`, stub `uiArtMissing`) | `AssertionError: expected 'ok' to be 'missing'`, `expected false to be true` (6 red) |
| GREEN | `tests/artHealth.test.ts`, `tests/artHealthText.test.ts` green |
| `npm run lint`, `typecheck`, `npm test`, `npm run build` | OK; unit 3133 = branch baseline 3125 + 8; build `e2e hook: absent (2 chunks checked)`; deploy scripts and `sample` E1-E6 ran OK in the first full pass |
| `grep uiArtHealth` in `TaskScene.ts`, `artFilter.ts` | empty |
| e2e | not run by me (orchestrator gate) |
| Deliberate break | `views.slice(0, 1).some(...)` (task line only): "only UI missing" and "only room missing" red; restored, green |
| Meta-check | proves the view rule, not that the loader records UI textures (phase 12) |

## 4. Next command

`/10x-tdd stale-tab-and-health phase 8`

## 5. Open

- Rows: 7.4 e2e (orchestrator), 7.5 [reviewer]; 6.4, 5.5, 4.4, 1.6 [reviewer]; 3.5, 2.5.
- Spec to watch: `art-stand-in.spec.ts` reads only the "Obrazki" heading text (unaffected); `salon-load-health.spec.ts` no `parent-art` reads found by grep.
- Carried: [human] 10.6, 11.4; [visual] 12.4; [reviewer] 10.7; DESIGN-GAPs 120-121 later.

## 6. Autonomous decisions

- Wording of `uiArtOk`/`uiArtMissing` provisional (row 119), same style as the salon line.
- Third line is hidden when the record is absent (like the salon line).
- Row 6.2 ticked with the orchestrator gate; 7.4 left for the orchestrator's e2e.
- A mistaken `git checkout` of `src/core/artHealth.ts` during the break dropped the uncommitted helper; rewritten identically before the commit.
