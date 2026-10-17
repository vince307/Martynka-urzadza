# Handoff — `health-lines-and-smoke` (slice fix:health-lines-and-smoke)

Written by the `/10x-tdd` phase 2 step of run `2026-10-16-audit-sweep` (slice 3 of 3). Phases 1 and 2 are committed. Do not get wrong: `src/core` never imports `src/data/pl.ts`, `registration.update()` runs once per launch only (no visibility or timer trigger), an `xhrLoader.status` 0 is the `network` cause, never "not on the server", `vite/config.shared.mjs` stays unchanged.

## 1. State

| | |
|---|---|
| Branch | `feat/health-lines-and-smoke`, cut from `main` at `dfc49ae` |
| Commits | identity, research, plan, plan-review, phase 1, handoff p1, phase 2 (`feat(health-lines-and-smoke): ... (p2)` bb650cc) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 63 (66 minus rows 2.1-2.3, ticked) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/swStatus.ts` | `OfflineLine` + `updateFailed`; `offlineView` ready+error gives it; `SwEvent` `waiting` tracks the worker |
| `src/pwa/registerServiceWorker.ts` | waiting worker tracked (`trackStates`), one `registration.update()` per launch with a warn, listener errors warned |
| `src/data/pl.ts`, `docs/design-gaps.md` | `settings.offline.updateFailed` (DESIGN-GAP 139) |
| `tests/swStatus.test.ts` | reversed "names a failed update ..." + new ready-without-error and waiting tests |

## 3. Verification

| command | result |
|---|---|
| first RED (stub `waiting`, old view) | `AssertionError: expected null to be 'InstallFailed'` (waiting case); `expected { line: 'ready', ...} to deeply equal { line: 'updateFailed', ...}` |
| `npx vitest run tests/swStatus.test.ts` | 14 passed |
| break 1: `offlineView` without the `error` branch | 1 failed (reversed case); restored. Break 2: `waiting` ignored (the sed also hit `installing`, 5 red incl. the waiting case); restored. Meta: proves view and reducer; the registration wiring is reviewed, not unit tested |
| lint / typecheck | OK / OK |
| `npm test` + deploy scripts + sample E1-E6 | Tests 3556 passed = baseline 3554 + 2 |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `git diff main -- vite deploy .github` empty |
| e2e `--workers=4` | 125 passed (10.2m), 0 failed, no flakes; seed and `health-lines` #8 P-1 green. Note: `playwright --list` says 132 and phase 1 handoff said 132 passed; this run executed 125 (1 chromium + 124 chromium-hook) with nothing skipped or failed. Not investigated |
| stray processes | `ps` is blocked in this sandbox (operation not permitted); no background job of mine remains (e2e run finished, `sleep 1` job finished) |

## 4. Next command

`/10x-tdd health-lines-and-smoke phase 3`

## 5. Open

- [reviewer] rows 1.6, 1.7, 2.4; [visual] 2.5; [human] 2.6, 4.6, 8.6, 11.8 not mine.
- e2e count 125 vs 132 discrepancy (see §3) for the orchestrator to check.

## 6. Autonomous decisions

1. **Commit only the planned set**, stop after phase 2, message as proposed. Would change: nothing.
2. **`waiting` reducer**: sets `tracking` like `installing` (ready if a worker is active), so a later `redundant` is a failed update and `activated` clears it. Would change: a review wanting a separate phase.
3. **`trackStates` split out of `track`** so a waiting worker gets the statechange listener without a second `installing` event.
4. **Break 2 was broader than planned** (sed matched two lines); the waiting case still went red. Would change: nothing.
