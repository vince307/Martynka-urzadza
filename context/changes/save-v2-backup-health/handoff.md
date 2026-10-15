# Handoff — `save-v2-backup-health` (slice fix save-v2-backup-health, non-roadmap)

Written by the finishing step of `/10x-e2e` phase 6 (the last phase) of run `2026-10-15-fix-s14c-s14d`. All phases are committed and `change.md` is `implemented`; the next agent reviews, and must not touch production code except to fix review findings.

## 1. State

| | |
|---|---|
| Branch | `feat/save-v2-backup-health`, cut from `main` at `16848c6` |
| Commits | plan commits + p1 `8430945`, p2 `ccbfc11`, p3 `ec72589`, p4 `afbf9a8`, p5 `087d9de`, p6 `e7407b7`, handoff commits |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md`: only [reviewer], [visual], [human] rows (1.5, 1.6, 2.5-2.7, 3.4, 3.5, 4.5-4.8, 5.6, 5.7) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `tests/e2e/save-backup-health.spec.ts` | 5 tests (SV2-01, SV2-02, slow read can be waited, continuing while the slow read answers, plus the card test) |
| `tests/e2e/support/hook.ts`, `playwright.config.ts` | save type in the hook helper; `ROUND_SPEC` |
| `src/testing/e2eHook.ts` | e2e build only: `E2E_SLOW_READ_MS` 2500, `E2E_SLOWER_LOAD_TIMEOUT_MS` 5000 |
| `context/changes/save-v2-backup-health/e2e-break-p6{a..e}.patch`, `e2e-request-p6.md` | deliberate-break patches and the phase request |
| `plan.md` | rows 5.5, 6.1-6.7 ticked with shas |

## 3. Verification

| Command | Result |
|---|---|
| lint, typecheck | OK |
| `npm test` | 2479 passed (128 files) |
| `npm run build` | OK, `e2e hook: absent (2 chunks checked)` |
| Playwright | not run by me (sandbox); orchestrator evidence below |
| Orchestrator spec fix 1 | test "#2 SRR-02 continuing while the slow read is still answering never overwrites it" asserted `counterText < 7` after a whole round, but a clean round pays 5 + 2 bonus = 7, so it could not tell a fresh session from an adopted late read (first run: Expected < 7, Received 7). Now it plays ONE task (`playTaskRight`) and polls `counterText` = '1' (an adopted read would show 8) |
| Orchestrator fix 2 (e2e build only, `src/testing/e2eHook.ts`) | `E2E_SLOW_READ_MS` 800 -> 2500 and `E2E_SLOWER_LOAD_TIMEOUT_MS` 1500 -> 5000, mirrored in the spec (`SLOW_READ_MS`, new `SLOWER_LIMIT_MS`) with matching expect timeouts. Reason: under load the spec's two taps ("Poczekaj dłużej", then "Graj dalej") took longer than 800 ms, the slow read answered first (correct product behaviour) and the card closed — a test-timing race (seen 1 of 2 repeats). Production timings (`balance.save`) unchanged; build prints `e2e hook: absent` |
| Green after the fixes | save-backup-health x3 with --workers=4 = 15 passed (1.0 min) |
| Breaks (each alone, --workers=1) | p6a (copy never gives up) -> SV2-01 red `toBe` Expected 2, Received null; p6b (replace without limit) -> SV2-02 red `toBeVisible` element not found; p6c (no wait button) -> "slow read can be waited" red (tap timeout, button absent); p6d (Escape without busy guard) -> SV2-02 red `toBeVisible` element not found; p6e ("Graj dalej" resolves fresh) -> "continuing while the slow read" red `toMatchObject` (load/blocked differ). All restored; the only src diff left is fix 2 |
| Full suite after restore (--workers=4) | 82 passed (5.4 min) = 77 + 5. Unit 2479 |
| Meta-check p6e | breaks the rule (a fresh outcome unblocks the saver), not the `settled` flag (a no-op once "Graj dalej" resolved); plan row 6.6 worded accordingly |

## 4. Next command

Next: `/10x-impl-review save-v2-backup-health`

## 5. Open

- Reviewer rows 1.5, 2.7, 3.4, 4.5, 5.6; visual 1.6, 3.5, 4.6, 5.7; human 2.5, 2.6, 4.7, 4.8 (checklist in `plan.md` Progress).
- Follow-ups with `Trigger:` in `context/changes/save-v2-backup-health/follow-ups/review-fixes.md` (includes: no e2e for Escape on the import dialog).
- The e2e slow-read constants in `src/testing/e2eHook.ts` are timing-sensitive; if flaky again, raise `E2E_SLOW_READ_MS` with the spec's `SLOW_READ_MS`.

## 6. Autonomous decisions

- Ticked 6.7 on observed build/lint/typecheck/unit plus orchestrator suite run; "servers killed" taken as true because none were started by this step. Would change if a leftover process on 4397/4398 is found.
- Commit messages as proposed; no subagent used.
- Wording of row 6.6 changed per the orchestrator (p6e breaks the unblock rule, not `settled`).
