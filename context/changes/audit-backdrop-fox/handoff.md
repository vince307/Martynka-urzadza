# Handoff — `audit-backdrop-fox` (slice fix:audit-backdrop-fox)

Written by the `/10x-e2e` step, phase 5, of run 2026-10-24-audit-backdrop-fox: the context-restore spec for the blurred salon backdrop. Rows 5.2 (full e2e count) and 5.3 (full gate incl. e2e) are the orchestrator's.

## 1. State

| | |
|---|---|
| Branch | `feat/audit-backdrop-fox` |
| Commits | abadce5 (spec, p5), plus this handoff commit |
| Pushed / PR / merged | no / no / no |
| `change.md` status | unchanged |
| `## Progress` rows | 5.1 ticked with abadce5; 5.2, 5.3 left; earlier open rows as in the p4 handoff (1.5, 2.4, 3.5, 4.6-4.10) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `tests/e2e/backdrop-restore.spec.ts` | 3 tests: `#12 the welcome backdrop is drawn again after a WebGL context restore`, `#11 the task backdrop ...`, `#11 a restore while the room is open redraws the sleeping task backdrop` |
| `playwright.config.ts` | `ROUND_SPEC` regex gained `backdrop-restore` (hook build) |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test tests/e2e/backdrop-restore.spec.ts --workers=1` | 3 passed |
| break 1: remove `WelcomeScene`'s `renderer.on(RESTORE_WEBGL, ...)` | welcome test red (`redraws` Expected 1, Received 0); task tests green; restored |
| break 2: same in `TaskScene` | both task tests red (`redraws` Expected 1, Received 0); welcome green; restored |
| break 3: `TaskScene` handler returns early when `this.sys.isSleeping()` | only the room test red (`redraws` 0); restored |
| lint, typecheck, npm test (3915 passed, delta +0), deploy scripts, sample E1-E6, build | green; `e2e hook: absent (2 chunks checked)` |
| full e2e | not run (orchestrator) |

The `redraws` poll comes before the pixel poll in each test, so the breaks went red on `redraws`, not on the pixel; the pixel check is a second line of defence (still asserted, not break-proven).

## 4. Next command

`/10x-e2e audit-backdrop-fox phase 6`

## 5. Open

- Rows 5.2, 5.3 and the earlier 1.5, 2.4, 3.5, 4.6-4.10 wait for the orchestrator's full e2e / human / visual / reviewer. Expected total: branch e2e baseline + 3 for this phase. `ARTIFACT GAP`: none.

## 6. Autonomous decisions

- **E-1 Lose handle**: `getExtension('WEBGL_lose_context')` returns null on a lost context, so the extension object is kept from the loss call and reused for `restoreContext()`. Would change: never (browser rule).
- **E-2 ROUND_SPEC**: new spec added to the regex so it runs on the hook build (port 4397), as earlier runs did.
- **E-3 Welcome tap**: the age tap after restore uses the hook's `ages` targets directly (not `passWelcomeAsChild`, which reloads the page).
