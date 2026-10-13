# Handoff — `observability-c1-c2` (slice fix:observability-c1-c2, non-roadmap)

Written by the phase-6 finishing step of `/10x-e2e observability-c1-c2` (autonomous run 2026-10-13-fix-observability); phase 6 is committed and green. Do not re-run Playwright for it: the evidence is the orchestrator's run recorded in `e2e-request-p6.md`.

## 1. State

| | |
|---|---|
| Branch | `feat/observability-c1-c2` |
| Commits | phase 1 = 6ad5d53, phase 2 = 1af1734, phase 3 = 478a100, phase 4 = b2affa1, phase 5 = 799a75f, then handoff p5; handoff p5, phase 6 = b672e74, then handoff p6 |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 13 (phase 7 and manual rows) |
| Working tree | clean after the handoff commit (`context/runs/` untracked as always) |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/settingsPanel.ts` | `watchVoice` option: subscribes at open, unsubscribes in the single `close` (confirm, cancel, Escape, shutdown); muted paragraph `pl.settings.noVoice`, hidden while a voice is available, visible without a narrator; DESIGN-GAP 30 |
| `src/scenes/UIScene.ts` | passes `watchVoice` from the narrator |
| `src/data/pl.ts` | `settings.noVoice` |
| `docs/design-gaps.md` | row 30 (row 29 existed from phase 4) |
| `context/changes/observability-c1-c2/follow-ups/review-fixes.md` | follow-ups, each with `Trigger:` |
| `tests/e2e/error-boundary.spec.ts` | phase 6: 4 tests (project chromium-hook), risk #15 proposed |
| `tests/e2e/support/welcome.ts`, `tests/e2e/parent-settings.spec.ts`, `playwright.config.ts` | optional `query` on welcome helpers, `openSettings` moved to support, `ROUND_SPEC` += error-boundary |
| `CLAUDE.md` | Current state: error boundary, input sessions, `?e2eFail=`, mastery rule, no-voice line |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| unit | 972 passed (baseline 948 + 24 from phases 1-3, phase 5 delta +0); deploy scripts OK; sample E1-E6 no violations |
| validate-rule-files | PASS; break (CLAUDE.md path `errorCardX.ts`) -> FAIL missing: 1; restored -> PASS. Note: `errorcard.ts` (case only) passes on case-insensitive APFS, so the plan's literal break needed a different name |
| build | `e2e hook: absent (2 chunks checked)`; grep dist for e2eFail, e2e-forced-failure, e2eMonth, __martynkaE2E: empty; `grep releaseInput\|a miss = -1 src` empty |
| break | UIScene without `watchVoice`: unit stayed 972 green (expected; proof is e2e phase 7); restored |
| e2e (orchestrator run, not observed by this agent) | `error-boundary.spec.ts` 4/4; full suite 22 = 18 + 4 |
| break a | `e2e-break-p6.patch` (no `unhandledrejection` listener): test (b) red at spec:42 `toBeVisible`, (a) green; restored |
| break b | `e2e-break-p6b.patch` (`isFatalSignal` always true): (d) red at spec:66 `toHaveCount(0)` (Expected 0, Received 1), (a)-(c) green; meta: `tests/errorSignal.test.ts` 4 failed, so the unit test also catches it; restored |
| build / dist | `e2e hook: absent`, grep dist for e2eFail, e2e-forced-failure clean (orchestrator gate) |
| this step: lint / typecheck / unit | OK / OK / 972 passed (delta +0); Playwright not run (by design) |
| teacher read | `pl.settings.noVoice` "Na tym urządzeniu nie ma polskiego głosu. Polecenia będą czytane, gdy głos się pojawi.": clear to a parent, no jargon, correct Polish |
| seam sweep | no stale `releaseInput`, `loss`, single-marker or -1 wording left in `src/`; headers of `inputSuspend.ts`, `mastery.ts`, `e2eHookGuard.mjs` already current |

## 4. Next command

/10x-e2e observability-c1-c2 phase 7

## 5. Open

- Phase 6 hypotheses held: boot carrier is `unhandledrejection` (break a red), so no Known-risks note needed.
- Manual: [reviewer] 2.5, 4.5, 4.6, 5.6, 5.7; [human] 2.6, 4.8, 5.9; [visual] 4.7, 5.8.

## 6. Autonomous decisions

1. Chromium cannot launch here (MachPort, 3 tries): request-file protocol; spec left uncommitted.
2. Query switches go through an optional `query` record on `openWelcome`/`openGate`/`passWelcomeAsParent`/`passWelcome`; `openSettings` moved from parent-settings.spec into `support/welcome.ts` (no duplicate); `ROUND_SPEC` += error-boundary.
3. Rows 6.1-6.4 ticked from the orchestrator's recorded run (Chromium unavailable to agents), sha b672e74.
4. Row 5.2 ticked from the orchestrator's 18/18 on f97228a.
