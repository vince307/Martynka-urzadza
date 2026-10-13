# Handoff — `observability-c1-c2` (slice fix:observability-c1-c2, non-roadmap)

Written by `/10x-implement observability-c1-c2 phase 4` (autonomous run 2026-10-13-fix-observability).

## 1. State

| | |
|---|---|
| Branch | `feat/observability-c1-c2` |
| Commits | phase 1 = 6ad5d53, phase 2 = 1af1734, phase 3 = 478a100, phase 4 = b2affa1, then this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/ui/dom/errorBoundary.ts` | `installErrorBoundary(win, onFatal)`: `error` + `unhandledrejection`, bubbling, decision via `isFatalSignal`, re-entrancy flag, try/catch around `onFatal` |
| `src/ui/dom/errorCard.ts` | `mountErrorCard` (idempotent, role alertdialog, focus on button); `.overlay-error` z-index 18; `pl.errorCard`; DESIGN-GAP 29 row |
| `src/main.ts` | boundary before `createGame`; card, then suspend (never released), then `loop.sleep()`, each in its own try/catch; forced failure set in `preBoot` only under `__E2E_HOOK__` |
| `src/data/layout.ts` | `REGISTRY_KEYS.forcedFailure` (no marker text in name or value) |
| `src/scenes/{TaskScene,BootScene,UIScene,WelcomeScene}.ts` | sites `step` (`TaskScene.update`, once), `boot`, `settings` (`applySettings`) behind `__E2E_HOOK__`; Welcome/UI hold an `InputSession`, every dialog callback in `session.run`; F6 guard in `openParent` |
| `vite/e2eHookGuard.mjs`, `tests/e2eHookGuard.test.ts` | `E2E_REQUIRED_MARKERS` = full list; pin test + two tests reworked |

## 3. Verification

| Command | Result |
|---|---|
| lint / typecheck | OK / OK |
| unit | baseline 948 -> 972 after phase 3, phase 4 delta +0 (two guard tests reworked, pin changed): 972 passed; deploy scripts + sample E1-E6 no violations |
| build | `e2e hook: absent (2 chunks checked)`; grep dist for e2eFail, e2e-forced-failure, e2eMonth, __martynkaE2E: no match; `E2E_HOOK=1` build: `e2e hook: present (2 chunks checked)`; `grep releaseInput src` empty |
| break | main.ts without `installErrorBoundary` + `UIScene.onConfirm` outside `session.run`: unit stayed 972 green (expected, this phase claims no unit coverage of the wiring; proof is e2e phase 6 and review 4.6); restored. Meta-check: green is the honest result, the guard tests cover only the marker list |
| e2e | not runnable in this session (MachPort: `browserType.launch` closed, 6 failed/12 not run) - orchestrator gate; row 4.1 left open |
| teacher read | "Ups! Gra się zatrzymała." / "Dotknij przycisku, a gra uruchomi się od nowa." / "Zacznij od nowa" / "Wersja <id>": calm, no blame, no word "błąd", no promise of kept progress, short |

## 4. Next command

Phase 5 is `Driver: impl`:
/10x-implement observability-c1-c2 phase 5

## 5. Open

- Row 4.1 (e2e, baseline 18 + 0) awaits the orchestrator on b2affa1; phases 1-3 e2e per run-log.
- Manual: [reviewer] 2.5, 4.5, 4.6; [human] 2.6, 4.8, 5.9; [visual] 4.7, 5.8.
- Follow-up noted in plan Known risks: original boot exception does not reach console.error (Trigger: S-11 or next BootScene change).

## 6. Autonomous decisions

1. Stayed in this context, one commit, stopped after phase 4. Commit message as proposed.
2. Boundary reads the game through a `booted` holder object (lint prefer-const rejected a `let`). Would change: nothing.
3. `step` site clears its registry value before throwing (fires once). Would change: a spec needs repeated failures.
