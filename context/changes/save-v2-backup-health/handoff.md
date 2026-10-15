# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by the `/10x-tdd` phase 1 step of run `2026-10-15-fix-s14c-s14d`. Phase 1 code is committed (8430945); only the e2e part of row 1.4 and the [reviewer]/[visual] rows remain. The next agent must keep the write sequence guard in `src/storage/idb.ts` `createIdbSaveStore` intact.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | plan commits + `8430945` (phase 1) + handoff p1 |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implementing` is not set by this step (left as `plan_reviewed`) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` (1.1-1.3 done; 1.4 open for e2e; 1.5, 1.6 not mine) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` | `withTimeLimit`, `writeTimeoutMs` option, `FailureStage`, `lastFailure` in status, backup/write/replace limited, replace timeout sets dirty and re-arms, log names the stage |
| `src/storage/idb.ts` | `run(op, mayRetry)` and a write sequence counter: an abandoned write is not retried after a newer one |
| `src/data/balance.ts`, `src/main.ts` | `balance.save.writeTimeoutMs` 5000, wiring, `E2E_WRITE_TIMEOUT_MS` under `writehang` |
| `src/testing/e2eHook.ts` | seam `writehang` (hook build only, covered by the existing `e2eSave` marker) |
| `tests/autosave.test.ts`, `tests/idbStore.test.ts`, `tests/e2eSave.test.ts`, `tests/e2eHookGuard.test.ts`, `tests/saveFile.test.ts`, `tests/saveHealth.test.ts` | 6 new autosave tests, 2 idb tests, 1 seam test, guard case, option/status field fixes |
| `context/changes/save-v2-backup-health/plan.md` | rows 1.1-1.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| `npm test` | 2455 passed (baseline 2445, +10) |
| deploy/ops shell tests, `sample` E1-E6 | OK |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied); expected baseline 77 + 0 |
| RED | new autosave tests hang until the vitest 5000 ms limit (`Test timed out`, as the plan foresees for a never-answering store); idb test: `AssertionError: expected 'ok' to be 'InvalidStateError'` |
| Break 1 (`run` ignores `mayRetry`) | idb abandoned-write test red, restored |
| Break 2 (`attempt` writes without `withTimeLimit`) | 3 timeout tests red, restored |
| Break 3 (no `work.catch`) | stayed GREEN: meta-check says wrong break, `Promise.race` already subscribes to the abandoned promise, so the extra catch was dead code and was removed; the late-rejection test stays as regression |
| `git diff --stat tests/fixtures` | empty; `SAVE_VERSION` 2 |

## 4. Next command

`/10x-tdd save-v2-backup-health phase 2` (Driver: tdd)

## 5. Open

- Row 1.4 e2e part (orchestrator: `npx playwright test --workers=4`, expect 77).
- Rows 1.5 [reviewer], 1.6 [visual] (needs `?e2eSave=writehang` build at 1440 and 1024).
- Earlier open items unchanged: [human] 2.5, 2.6, 4.7, 4.8; DESIGN-GAP 94-97; follow-ups in phase 5.

## 6. Autonomous decisions

- Failing tests that hang until the vitest limit accepted as RED for the never-answering store (plan says so); chosen over a fake-timer harness inside vitest. Would change: a flaky CI limit.
- Dropped `work.catch` from `withTimeLimit` (dead code, see break 3) instead of keeping it as the plan wrote. Would change: a runtime where race does not subscribe, none known.
- Mixed phase: seam, balance, wiring done inline; the phase keeps Driver: tdd.
- Did not set change.md status (left to the existing flow).
