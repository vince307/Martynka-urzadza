# Handoff — `load-and-tab-guard` (slice fix, non-roadmap)

The `/10x-tdd` step wrote this handoff for phase 1 (the pure boot-load rule and the numbers). Rows 1.1 and 1.2 are done; row 1.3 is left open because Chromium could not start in this session, so the e2e part of the gate belongs to the orchestrator. The next agent must not use the bare idb-keyval `update` in phase 5. Phase 5 uses `guardedPut` on the raw store, so a failing `get` still puts (F1). A cut must also expect break p7b to stay green (F2).

## 1. State

| | |
|---|---|
| Branch | `feat/load-and-tab-guard`, cut from `main` at `6f5644c` |
| Commits | 6 before this handoff commit: identity, research, plan, plan handoff fix, plan review, and `test(load-and-tab-guard): reguła ładowania i liczby (p1)` (0c31db4); then a plan-rows commit and this handoff |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 29 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/bootLoad.ts` | `bootLoadPhase` (`loading` / `slow` / `over`), `checkBootLimits`, `BootLimits`; pure |
| `src/data/balance.ts` | `balance.loader` gained `slowAfterMs: 8000` and `totalMs: 45000`, with the arithmetic in the comment (F4 precache competition named) |
| `tests/bootLoad.test.ts` | boundaries 0, slow-1, slow, total-1, total; NaN and negative elapsed; six bad-limit rejections |
| `tests/loaderBalance.test.ts` | total limit 30..60 s, above `(maxRetries + 1) × timeoutMs`, slow line 3..15 s, `checkBootLimits(balance.loader)` |
| `context/changes/load-and-tab-guard/plan.md` | rows 1.1 and 1.2 ticked with 0c31db4 |
| `context/changes/load-and-tab-guard/handoff.md` | this handoff |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/load-and-tab-guard` |
| RED (stubs returned `'loading'` and never threw) | `AssertionError: expected 'loading' to be 'slow'`, `expected 'loading' to be 'over'`, `expected [Function] to throw an error` (6 cases); 12 failed, 6 passed |
| GREEN `npx vitest run tests/bootLoad.test.ts tests/loaderBalance.test.ts` | 18 passed |
| Break 1: `elapsedMs >= slowAfterMs` changed to `>` | `is slow from the slow line until the total limit` red; restored |
| Break 2: `totalMs: 20000` | `keeps the total limit between 30 and 60 s` and `keeps the total limit above the worst case of one stalled file` red; restored |
| Meta-check | the breaks fail the rule and number tests only; they prove nothing about the loader ending (phase 7) |
| `npm run lint` / `npm run typecheck` | pass / pass |
| unit gate (`npm test`, deploy scripts, `sample` E1–E6) | 2940 passed (baseline 2925, +15); sample E1–E6 clean |
| `npm run build` | passes, prints `e2e hook: absent (2 chunks checked)` |
| e2e `npx playwright test --config=<abs> --workers=4` | e2e: not runnable in this session — orchestrator gate (Chromium `MachPortRendezvousServer … Permission denied`; baseline 101 expected, +0) |

## 4. Next command

`/10x-implement load-and-tab-guard phase 2` (phase 2, `Driver: impl`)

## 5. Open


- **Drivers by phase:**
  - Phase 1 `tdd`: `src/core/bootLoad.ts`, `balance.loader` (done, 0c31db4).
  - Phase 2 `impl`: `src/scenes/loaderCut.ts` `cutLoad`, `REGISTRY_KEYS.bootLoad`, `?e2eArt=stallall`, hook `screen: 'loading'`, `tests/phaserLoaderPin.test.ts`.
  - Phase 3 `impl`: `LoadingScreen.slow`, `pl.loading.slow`, gap 112.
  - Phase 4 `tdd`: `storedVersionNewer`, `BlockReason 'newer'`, `replaceGate`, `offState`, `deviceSaveView`, gap 113.
  - Phase 5 `tdd`: `guardedPut` in `src/storage/idb.ts`, `?e2eSave=newer`.
  - Phase 6 `impl`: `CLAUDE.md` and `follow-ups/review-fixes.md`.
  - Phase 7 `e2e`: `tests/e2e/load-and-tab-guard.spec.ts`, request-file protocol, patches p7a–p7d.
- **Risks carried** (plan `## Known risks`):
  - Phaser internals: `^4.2.1`, guarded by the tripwire plus e2e #15.
  - The cold first start competes with the SW precache (F4).
  - The `creates` guard and the font swap are belts with no red test (F6, and p7b is expected green).
  - The guard only protects from this build onwards.
  - Two tabs of the same version stay unguarded.
  - `guardedPut` + `preventDefault` on a failing `get` is unverified on WebKit/iOS.
- **Manual-only rows (human checklist):**
  - 2.5: Android on a throttled network starts in about 45 s or less.
  - 7.7: iPad/WebKit shows the cut and the slow line.
  - 3.3 [visual]: the slow line.
- **DESIGN-GAPs planned:** 112 (`pl.loading.slow`) and 113 (`saveOff.newer`), added in phases 3 and 4.
- **Follow-ups:** none yet. Phase 6 writes `follow-ups/review-fixes.md`.
- **Row 1.3** (full gate incl. e2e) is open: the orchestrator runs e2e (`--workers=4`, expect 101 passed) and ticks it. Row 1.4 is [reviewer].

## 6. Autonomous decisions

- **No AskUserQuestion was asked.** Between-phase prompt decided as "stop after phase 1".
- **Phase kept `Driver: tdd`, no inline part.** The whole phase is a pure rule plus numbers.
- **Stubs first, so the RED is an assertion.** `bootLoad.ts` shipped as a stub returning `'loading'`, which gave assertion failures, not a missing module. Would change: none.
- **`bootLoadPhase` uses `!(elapsed >= slowAfterMs)`** so NaN and negative values read as `loading`. Rejected: separate `Number.isNaN` guards. Would change: a caller needing NaN to be an error.
- **e2e not run here.** Chromium cannot launch in the subagent sandbox and the phase rules forbid bypassing it. Would change: a session where Chromium starts.
