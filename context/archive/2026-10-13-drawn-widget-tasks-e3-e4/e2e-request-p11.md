# e2e request — phase 11 (`drawn-widget-tasks-e3-e4`)

Chromium cannot start in the agent session (`MachPortRendezvousServer ... Permission denied`, 3 plain tries). Nothing is committed for phase 11.
Uncommitted, ready for the orchestrator: `tests/e2e/drawn-tasks.spec.ts` (new, 5 tests), `tests/e2e/support/hook.ts` (types `Snapshot.visual`, `Targets.picture`), `playwright.config.ts` (`drawn-tasks` in `ROUND_SPEC`), plan row 10.1 note. The four patches below touch production code only.

## Green runs (outside the sandbox)
1. `npx playwright test tests/e2e/drawn-tasks.spec.ts` -> `5 passed` (drag tests are slow; per-test timeouts 60/60/120/90/240 s).
2. `npx playwright test` -> `42 passed` (37 + 5).
Verified without a browser: `npx tsc --noEmit` and ESLint on the spec, hook.ts and config are clean.

## Breaks (apply with `git apply`, run the single spec, expect red, then `git apply -R` / `git checkout -- <file>`)
| Patch | Break | Expected red |
|---|---|---|
| `e2e-break-p11a.patch` | `SelectTiles` "OK" submits an empty set | (b) select task: `phaseIs(done)` never reached after `answerRight` (phase stays `solution`); (e) round: `playTaskRight` stuck on the select task |
| `e2e-break-p11b.patch` | `TaskScene` maps a cancelled touch to `up` | (d) cancelled touch: `snapshot.mat` is `{ten: 1}` instead of empty after `cancelTouch`. Meta-check: phase 8 unit tests stay green (they test the reducer, not the scene glue) |
| `e2e-break-p11c.patch` | `TaskScene.render` hides the picture | (a) clock task: `expect(picture).toBeTruthy()` fails (null); (e) is unaffected (no picture assertion). Meta-check: the hook reads widget visibility, not pixels |
| `e2e-break-p11d.patch` | a tray block dropped off the mat is placed anyway | (c) drag task: `mat` is `{ten: 1, one: 1}` after the drop outside the mat. Phase 8 unit tests cover this rule too (`blockDrag`); this proves the scene hands the event to the reducer |

Run each as: `git apply context/changes/drawn-widget-tasks-e3-e4/e2e-break-p11X.patch`, then `npx playwright test tests/e2e/drawn-tasks.spec.ts`, then `git apply -R <same patch>`.

## Orchestrator results (2026-10-14, on 93dc80f + the uncommitted spec)

- `npx playwright test --config=… drawn-tasks`: 5 passed (51.1s).
- p11a (OK sends an empty set): RED — (b) `phaseIs(page, 'done')` → Expected "done", Received "solution" (drawn-tasks.spec.ts:69); serial mode skipped the rest. Reverted.
- p11b (cancel counted as up): RED — (d) `expect(mat).toEqual({hundred:0,ten:0,one:0})` received `ten: 1` (spec:119). Reverted.
- p11c (picture hidden): RED — (a) `expect(picture).toBeTruthy()` received null (spec:33). Reverted.
- p11d (tray block dropped off the mat is placed): RED — (c) `expect(mat).toEqual({hundred:0,ten:1,one:0})` received `one: 1` (spec:94). Reverted.
- Full suite: 42 passed (37 + 5), 3.4m. Tree back to the uncommitted spec only.
