# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Phase 6 (offline status section in the parent's panel) written by `/10x-implement` in run `2026-10-16-fix-stale-tab-health`; code commit `05d13c6`. The next agent must not get wrong: the section is proved only in unit tests here; the browser proof (real service worker states in the panel) is phase 12, and `e2e-break-p12a.patch` is for that phase.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., `aed4d29` (p5), `781dbda` (p5 docs), `05d13c6` (p6 code), then a docs commit with this handoff and the ticks |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 6.2 (orchestrator e2e), 6.4 [reviewer], 5.5 [reviewer], 4.4 [reviewer], 3.5, 2.5, 1.6 [reviewer], phases 7-12 |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/swStatus.ts` | `offlineView(status)` -> `{ line, code, takenOver }` (`registering` maps to `installing`; a failed update behind an active worker stays `ready` with a code) |
| `src/ui/dom/offlineView.ts` | `createOfflineView`, section `.parent-offline`, `data-state` = line |
| `src/ui/dom/settingsPanel.ts`, `src/scenes/UIScene.ts` | `offline?` option; `openSettings` reads `REGISTRY_KEYS.swStatus` once; section after "Zapis gry", before "Obrazki"; absent without the key |
| `src/data/pl.ts`, `src/style.css`, `docs/design-gaps.md` | `settings.offline.*` strings, shared section style, DESIGN-GAP 118 row |
| `tests/swStatus.test.ts` | +3 view tests (12 total) |
| `context/changes/stale-tab-and-health/e2e-break-p12a.patch` | `offlineView` never `ready`; applies to the p6 commit (`git apply --check` OK) |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub `offlineView` always `installing`) | `AssertionError: expected 'installing' to be 'ready'`, `expected null to be 'SecurityError'` (3 of 12 red) |
| GREEN | `npx vitest run tests/swStatus.test.ts`: 12 passed |
| `npm run lint`, `npm run typecheck` | OK |
| `npm test` + deploy scripts + `sample` E1-E6 | OK; unit 3125 = branch baseline 3122 + 3 |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e `parent-settings.spec.ts` (single spec, sandbox off) | 4 passed; full suite is the orchestrator's |
| Deliberate break | `LINES.ready = 'installing'`: "maps each phase to a line" and "keeps a failed update ... as ready" red; restored, green |
| Meta-check | proves the phase-to-line mapping, not that the panel shows the section or that the browser reports `ready` (phase 12 applies the patch against the real service worker) |

## 4. Next command

`/10x-implement stale-tab-and-health phase 7`

## 5. Open

- Rows: 6.2 e2e (orchestrator), 6.4 [reviewer]; 5.5, 4.4, 1.6 [reviewer]; 3.5, 2.5.
- Specs to watch at the gate: `parent-settings.spec.ts` (green alone), `save-backup-health.spec.ts`, `save-restart.spec.ts`, `save-transfer*.spec.ts`, `art-stand-in.spec.ts`, `salon-load-health.spec.ts`: they read the panel by section class (`section.parent-save`, `.parent-art`), the new section has its own class `.parent-offline`, so none should shift.
- Not unit-tested: `createOfflineView` DOM (no DOM harness, as for the other views) and the `UIScene` wiring; phase 12 covers them.
- Carried: [human] rows 10.6, 11.4; [visual] 12.4; [reviewer] 10.7; DESIGN-GAPs 119-121 later; e2e phases 11-12 use the request-file protocol.

## 6. Autonomous decisions

- **Takeover line placement**: shown as a second sentence in the same section (not a separate section), after the code line.
- **Code line** reuses `pl.saveFailed.detail` (`Kod: ... · Wersja ...`) as `saveHealthView` does, shown whenever `code` is set, including a failed update behind a ready worker.
- **Wording** of the six strings is provisional (row 118), written in the calm style of the neighbouring sections.
- **Break patch** is the one-line `ready: 'installing'` change, written after the commit so it applies cleanly.
- Row 5.4 ticked with the orchestrator gate result. Commit message taken as proposed (Polish).
