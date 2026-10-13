# Handoff — `save-observability-c1-c2` (slice fix, non-roadmap)

Written by `tdd` phase 2: `loadSave` error name + read limit and the four `?e2eSave=` seams landed test-first (commit 11b492c). e2e was NOT run here (Chromium MachPort), so it is the orchestrator's gate on 11b492c; the abandoned-read `.catch` is redundant with the race today and guarded only against refactors (see §3).

## 1. State

| | |
|---|---|
| Branch | `feat/save-observability-c1-c2`, cut from `main` at `4698110` |
| Commits | phase 1 `fb2e7bb`, phase 2 code `11b492c` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 27 (`grep -c '^- \[ \]' plan.md`; 1.5 is `[reviewer]`) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` | `LoadOutcome` `unavailable` carries `error`; `loadSave(store, limit?)` races the read against injected timers, clears the timer, catches the abandoned read |
| `src/data/balance.ts` | `save.loadTimeoutMs: 5000` |
| `src/testing/e2eHook.ts` | `E2ESaveSeam`, `e2eSave` (4 values), `e2eSaveStore(seam)`, `E2E_LOAD_TIMEOUT_MS = 300` |
| `src/main.ts` | seam + limit wiring (`hang` uses 300 ms, hook build only), `console.warn` for `unavailable`, `loadError` to the autosaver, shared `timers` |
| `tests/autosave.test.ts`, `tests/e2eSave.test.ts` | new describe `loadSave failure cause and read limit`, parser and store seam tests |
| `plan.md` | rows 2.1-2.4 ticked, 1.4 note fixed |

## 3. Verification

| Command | Result |
|---|---|
| RED (no stubs needed: new args/values ignored at runtime) | 9 failed, e.g. `expected { kind: 'unavailable' } to deeply equal { kind: 'unavailable', error: 'Error' }`, `expected undefined to deeply equal { kind: 'unavailable', error: 'timeout' }`, `unavailable: expected null to be 'unavailable'` |
| `npx vitest run` / `npm test` | 1162 passed (phase 1 branch 1152, +10; main 1142) |
| lint, typecheck, deploy tests, `sample` E1-E6 | clean / OK |
| `npm run build` | `e2e hook: absent (2 chunks checked)`; `grep -rl e2eSave dist/` empty |
| `E2E_HOOK=1 npm run build` | `e2e hook: present (2 chunks checked)` |
| Deliberate leak (`const seam = e2eSave(...)` without `__E2E_HOOK__` in main.ts) | build FAILED: `e2e hook leaked into the production bundle (e2eSave in _app/index-….js)`; restored, build absent again |
| `npx playwright test` | not runnable in this session (MachPort) — orchestrator gate |
| Break: no `clearTimeout` | "faster than the limit ... no timer" red; restored |
| Break: `error: 'Error'` always | name tests red (4 failed); restored |
| Break: no `.catch` on the abandoned read | STAYED GREEN (the `Promise.race` already subscribes to the read, so the late rejection is handled); restored |
| Break: race replaced by `read.then(ok)` without `.catch` (the refactor the test guards) | "rejects after the limit ... unhandled rejection" red by the test's own `unhandledRejection` listener assertion (`expected [ Error: late ] to deeply equal []`), not vitest's global report; restored |
| Meta-check | the plan's `.catch` break is not red on its own; the equivalent break through the refactor path is, via the listener |

## 4. Next command

`/10x-tdd save-observability-c1-c2 phase 3`

## 5. Open

- Row 1.5 `[reviewer]` (phase 1). e2e on 11b492c: orchestrator gate.
- Note for impl-review: the `.catch` in `loadSave` is defensive (race already handles the read); kept because the plan requires it at race start.
- Karta dla `unavailable` is phase 4; the outcome is already logged and `loadError` reaches the autosaver.

## 6. Autonomous decisions

- No stubs for RED: the new parameters and seam values fail on assertions at runtime. Reversal: none.
- Timeout is signalled by rejecting the race with an `Error` named `timeout` (lint forbids non-Error rejections), turned into `error: 'timeout'` by `errorName`. Reversal: if a typed timeout is wanted.
- The plan's `.catch` break stays green; recorded honestly, the refactor-path break is the proof. Reversal: drop the `.catch` if impl-review calls it dead code.
- `timers` hoisted in `start` and shared between `loadSave` and `createAutosaver`.
