# Handoff — `stale-tab-and-health` (slice fix:stale-tab-and-health)

Phase 12 (e2e, risks #8 and #14), the last phase, written by `/10x-e2e` in run `2026-10-16-fix-stale-tab-health`; spec `tests/e2e/health-lines.spec.ts`. The change is `implemented`; open rows are [reviewer], [visual], [human] and the orchestrator's full-suite gate for 12.1/12.3. Do not tick those without observing them.

## 1. State

| | |
|---|---|
| Branch | `feat/stale-tab-and-health`, cut from `main` at `9a64fd6` |
| Commits | ..., p11 `12347a5`, `5867533`, p12 test `207d599`, then this close-out |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | 12.1 and 12.3 (orchestrator gate), 12.4 [visual], 11.4 [human], earlier [reviewer] rows, 10.5, 10.7, 6.4, 5.5, 3.5, 2.5 |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/health-lines.spec.ts` | (a) "#8 P-1 after the worker installs the panel says the game starts offline", (b) "#14 G-1 a screen picture that did not load is named in the pictures section" |
| `playwright.config.ts` | `health-lines` added to `ROUND_SPEC` only |
| `context/changes/stale-tab-and-health/e2e-break-p12b.patch` | `BootScene` no longer sets `REGISTRY_KEYS.uiArtHealth` |
| `context/changes/stale-tab-and-health/e2e-break-p12a.patch` | `swStatus.ts` maps `ready` to `installing` (phase 6) |
| `plan.md`, `change.md`, `handoff.md` | ticks 11.1/11.3 (orchestrator gate 5867533, 123 passed), 12.2; status implemented |

## 3. Verification

| Command | Result |
|---|---|
| `npx playwright test tests/e2e/health-lines.spec.ts` | 2 passed (about 24 s), run three times |
| break p12a, (a) alone | red: `expect(panel.getByText(pl.settings.offline.ready)).toBeVisible()` "element(s) not found"; reverted with `git apply -R` |
| break p12b, (b) alone | red: `expect(panel.getByText(pl.settings.uiArtMissing(1, total))).toBeVisible()` "element(s) not found"; reverted |
| meta-check | (a) the hook build is a production build, so Chromium really installs the worker; `sw.phase` reached `ready` and the reducer line reached the DOM. (b) the aborted file went through the real loader into `uiArtHealth` and the panel; the task-picture line stays "all loaded" |
| eslint on spec and config, `npm run typecheck`, `npm run build` | OK; `e2e hook: absent (2 chunks checked)`; ports 4397/4398 free |
| full `--workers=4` suite | not run by me (orchestrator gate, expect baseline 121 + 4 = 125) |

## 4. Next command

`/10x-impl-review stale-tab-and-health`

## 5. Open

- 12.1 and 12.3: the full suite and full local gate are the orchestrator's.
- Manual: 12.4 [visual] panel states at 1440 and 1024; 11.4 [human] iPad card.
- Earlier [reviewer] rows and 10.5, 10.7, 6.4, 5.5, 3.5, 2.5 unchanged.

## 6. Autonomous decisions

- Service worker: the `chromium-hook` project (`dist-e2e/`, port 4397) is a production build, so the worker registers there; no other project or webServer used, config touched only in `ROUND_SPEC`.
- (a) runs with workers allowed; (b) sits in its own `describe` with `serviceWorkers: 'block'` so `page.route` reaches the loader.
- Row 12.2 ticked; 12.1/12.3 left for the orchestrator's gate (as in phase 11). Rows 11.1/11.3 ticked with the orchestrator's gate result.
- Epilogue: `change.md` set to `implemented` despite open [reviewer]/[visual]/[human] rows, per the run prompt. A sed slip wrote "- [x] - [ ]" into rows 11.1/11.3 in `207d599`; fixed in the close-out commit (no amend).
