# Handoff — `salon-load-health` (slice fix salon-load-health, non-roadmap)

Written by `/10x-implement salon-load-health phase 3`: the game config now carries a loader time limit from `balance.loader`, with an e2e-only `?e2eArt=stall` seam that shortens it (commit 903c70a). The one thing not to get wrong: e2e was NOT runnable in this session (Chromium dies on MachPortRendezvous), so rows 3.1 and 3.3 stay open for the orchestrator.

## 1. State

| | |
|---|---|
| Branch | `feat/salon-load-health`, cut from `main` at `7f831c5` |
| Commits | identity, research, plan, plan review, 826150c (p1), 6922792 + 5009efd (p2), 903c70a (p3) + this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (unchanged; phase 5 closes it) |
| `## Progress` rows remaining | 15 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/data/balance.ts` | `balance.loader = { timeoutMs: 12000, maxRetries: 1 }` with the time-budget comment |
| `src/main.ts` | `createGame` sets `loader: { timeout, maxRetries }`; under `__E2E_HOOK__ && forcedArt === 'stall'` the e2e values |
| `src/testing/e2eHook.ts` | `E2EArtSeam` + `'stall'`, `E2E_LOADER_TIMEOUT_MS = 2000`; `BootScene` unchanged (an unknown seam queues the normal files) |
| `tests/loaderBalance.test.ts` | new: limit 5000..20000, retries 0..2, (retries+1) x limit <= 30000 |
| `tests/e2eSave.test.ts`, `tests/e2eHookGuard.test.ts` | `e2eArt` parsing cases; guard case for `stall` (marker `e2eArt` already covers it) |
| `plan.md` | rows 2.4 (orchestrator note, 98 passed) and 3.2 ticked |

## 3. Verification

| Command | Result |
|---|---|
| `npm run lint` / `npm run typecheck` | pass / pass |
| `npm test` | 2925 passed (p2 baseline 2919 + 6: 3 loader, 2 e2eArt, 1 guard) |
| deploy + ops shell tests, `sample` E1-E6 | pass |
| `npm run build` | pass, `e2e hook: absent (2 chunks checked)`; `grep -c E2E_LOADER_TIMEOUT dist/_app/*.js` = 0 in both chunks |
| `npx playwright test` | e2e: not runnable in this session — orchestrator gate (baseline 98, expect +0) |
| Break (`maxRetries: 3`) | red: "allows at most two retries" (3 > 2) and the budget test (48000 > 30000); restored |
| Meta-check | the budget test fails on the time product, not on key existence; the behaviour itself (a stalled file ends the load) is proven only in phase 5 e2e |

## 4. Next command

`/10x-implement salon-load-health phase 4` (phase 4, `Driver: impl`)

## 5. Open

- Rows 3.1 and 3.3 (orchestrator e2e, `--workers=4`, expect 98 + 0); [reviewer] 3.4, 2.5, 1.5; [human] 3.5, 1.6; [visual] 2.6.
- Not verified without a browser: Phaser 4 honours `loader.timeout`/`maxRetries` from the game config (phase 5 `stall` spec proves it).

## 6. Autonomous decisions

1. **No TDD for the config glue** (plan driver `impl`); only the numbers and seam parsing got tests.
2. **`stall` needs no `BootScene` change**: the scene only branches on `missing`, `corrupt`, `room`, so `stall` queues every file as normal.
3. **Row 3.1/3.3 left open** because their gate includes e2e; 3.2 ticked.
