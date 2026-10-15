# Handoff — `salon-load-health` (slice fix salon-load-health, non-roadmap)

Written by the `/10x-plan-review` step: verdict PROCEED, four warnings fixed in `plan.md`, nothing built yet. The one thing
not to get wrong in phase 1: generate `tests/fixtures/save-v2-legacy-salon.json` from `encodeSave(legacySalonSession())`
BEFORE `SAVE_VERSION` becomes 3, keep `MIGRATIONS[2]` total (malformed rooms → `corrupt`), and move the `saveProblem` cases
of `tests/saveFile.test.ts` to `save-v3.json` (plan-review F2).

## 1. State

| | |
|---|---|
| Branch | `feat/salon-load-health`, cut from `main` at `7f831c5` |
| Commits | 4 on the branch after this step (identity, research, plan, `docs(salon-load-health): plan review`) |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` |
| `## Progress` rows remaining | 26 (all pending) |
| Working tree | clean after the commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `context/changes/salon-load-health/reviews/plan-review.md` | Plan review: 0 critical, 4 warnings, 4 observations, all FIXED; ends with `VERDICT: PROCEED` |
| `context/changes/salon-load-health/plan.md` | Fixes: phase 1 adds `tests/saveFile.test.ts`; phase 2 adds existing `migrated` cases of `tests/autosave.test.ts` and SV2-01 in `tests/e2e/save-backup-health.spec.ts`; phase 3 `E2E_LOADER_TIMEOUT_MS` 2000; phase 4 two-cards follow-up; phase 5 assert order after `passWelcome`, break p5a reddens (a) only (Progress 5.2 reworded); Known risks F4, F7, F8 |
| `context/changes/salon-load-health/change.md` | status `planned` → `plan_reviewed` |
| `context/changes/salon-load-health/handoff.md` | This file |

## 3. Verification

| Command | Result |
|---|---|
| `git branch --show-current` | `feat/salon-load-health` |
| Code checks (read in this step) | `src/core/save.ts` `decodeSave` (future before steps, throwing step → `migration-failed`), `src/core/autosave.ts` `attempt` (copy before write, no re-arm after a failed copy), `replaceGate` (blocks `future`), `src/storage/idb.ts` `backup` key `${key}:backup-v${from}`, `src/main.ts` `start` order and `cardCopies`, `src/testing/e2eHook.ts` welcome snapshot fields, Phaser `Config.js` `loader.timeout`/`loader.maxRetries` |
| Progress ↔ phase criteria | 6/6, 6/6, 5/5, 5/5, 5/5; `Driver:` tdd, tdd, impl, impl, e2e |
| lint / typecheck / unit / build / e2e | not run: docs-only step (baseline on main at `7f831c5`: unit 2939, e2e 98 — inherited, unverified) |

## 4. Next command

`/10x-tdd salon-load-health` (phase 1, `Driver: tdd`)

## 5. Open

- `[human]` Progress rows: 1.6 (v3 one-way door: rollback below v3 shows the `future` card; accepted at Step 0), 3.5 (iPad/WebKit: a stalled picture ends loading in ≤ 24 s).
- `[visual]` 2.6: "Zapis gry" under `?e2eSave=legacy-salon` needs `passWelcome` first (no HUD gear on the welcome), no round finished.
- Phase 1 changes existing e2e asserts (`writtenVersion` 3 in `tests/e2e/salon-art.spec.ts`, `tests/e2e/save-backup-health.spec.ts`, `tests/e2e/save-migration.spec.ts`); phase 2 changes SV2-01 in `tests/e2e/save-backup-health.spec.ts` (`backup` `pending|failed`): the orchestrator's e2e gate must run on phases 1 and 2.
- Phase 5 uses the request-file protocol (`e2e-request-p5.md`, patches `e2e-break-p5a..c.patch`), `serviceWorkers: 'block'` + a never-fulfilled `page.route`, and `salon-load-health` added to `playwright.config.ts` `ROUND_SPEC`.
- Known risks added to `plan.md`: start write waits for the copy (F8), `lastReason 'migration'` only without a room repair (F4), loader vs save-read limits (F7).
- Follow-ups land in `context/changes/salon-load-health/follow-ups/review-fixes.md` in phase 4. No `ARTIFACT GAP`. `context/foundation/lessons.md` does not exist.

## 6. Autonomous decisions

1. **Verdict PROCEED, findings fixed in place** (contract: triage myself, no AskUserQuestion). Rejected: RETHINK — the approach (frozen tables in core, step complete by default, autosaver-owned start write) matches the v1 → v2 pattern and the code. What would change it: a defect that lets a v3 write overwrite the v2 save before its copy, which the code reading ruled out.
2. **No CRITICAL**: the unlisted test breakages (F1, F2) would be caught by the gate, not lose progress, so WARNING. What would change it: a plan claim that a red gate is acceptable.
3. **F4 fixed by narrowing p5a to (a)**, not by changing the v1 seam. Rejected: a new v1 fixture without the "living" room (fixtures are frozen). What would change it: a v1 seam variant whose `currentRoom` is the salon.
4. **F5: `E2E_LOADER_TIMEOUT_MS` 500 → 2000** for headroom under 4 workers. What would change it: the phase 5 run showing the stall test near its time limit.
5. **Review done by reading the code directly instead of a sub-agent** (the risky claims were few and local). What would change it: a claim spanning many modules.
