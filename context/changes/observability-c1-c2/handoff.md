# Handoff — `observability-c1-c2` (slice fix:observability-c1-c2, non-roadmap)

Written by `/10x-implement observability-c1-c2 phase 5` (autonomous run 2026-10-13-fix-observability).

## 1. State

| | |
|---|---|
| Branch | `feat/observability-c1-c2` |
| Commits | phase 1 = 6ad5d53, phase 2 = 1af1734, phase 3 = 478a100, phase 4 = b2affa1, phase 5 = 799a75f, then this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/settingsPanel.ts` | `watchVoice` option: subscribes at open, unsubscribes in the single `close` (confirm, cancel, Escape, shutdown); muted paragraph `pl.settings.noVoice`, hidden while a voice is available, visible without a narrator; DESIGN-GAP 30 |
| `src/scenes/UIScene.ts` | passes `watchVoice` from the narrator |
| `src/data/pl.ts` | `settings.noVoice` |
| `docs/design-gaps.md` | row 30 (row 29 existed from phase 4) |
| `context/changes/observability-c1-c2/follow-ups/review-fixes.md` | follow-ups, each with `Trigger:` |
| `CLAUDE.md` | Current state: error boundary, input sessions, `?e2eFail=`, mastery rule, no-voice line |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| unit | 972 passed (baseline 948 + 24 from phases 1-3, phase 5 delta +0); deploy scripts OK; sample E1-E6 no violations |
| validate-rule-files | PASS; break (CLAUDE.md path `errorCardX.ts`) -> FAIL missing: 1; restored -> PASS. Note: `errorcard.ts` (case only) passes on case-insensitive APFS, so the plan's literal break needed a different name |
| build | `e2e hook: absent (2 chunks checked)`; grep dist for e2eFail, e2e-forced-failure, e2eMonth, __martynkaE2E: empty; `grep releaseInput\|a miss = -1 src` empty |
| break | UIScene without `watchVoice`: unit stayed 972 green (expected; proof is e2e phase 7); restored |
| e2e | not runnable in this session (MachPort: 6 failed/12 not run) - orchestrator gate; 4.1 ticked from the run log (18/18 on e753365) |
| teacher read | `pl.settings.noVoice` "Na tym urządzeniu nie ma polskiego głosu. Polecenia będą czytane, gdy głos się pojawi.": clear to a parent, no jargon, correct Polish |
| seam sweep | no stale `releaseInput`, `loss`, single-marker or -1 wording left in `src/`; headers of `inputSuspend.ts`, `mastery.ts`, `e2eHookGuard.mjs` already current |

## 4. Next command

Phase 6 is `Driver: e2e`:
/10x-e2e observability-c1-c2 phase 6

## 5. Open

- Row 5.2 (e2e baseline 18 + 0) awaits the orchestrator on 799a75f.
- Manual: [reviewer] 2.5, 4.5, 4.6, 5.6, 5.7; [human] 2.6, 4.8, 5.9; [visual] 4.7, 5.8.
- Follow-ups are in `follow-ups/review-fixes.md`.

## 6. Autonomous decisions

1. Stayed in this context, one commit, stopped after phase 5; commit message as proposed.
2. `noVoice` is hidden until the first `watchVoice` callback (called synchronously on subscribe). Would change: nothing.
3. Row 5.2 left open (e2e orchestrator gate).
