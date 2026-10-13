# Handoff — `observability-c1-c2` (slice fix:observability-c1-c2, non-roadmap)

Written by `/10x-tdd observability-c1-c2 phase 3` (autonomous run 2026-10-13-fix-observability).

## 1. State

| | |
|---|---|
| Branch | `feat/observability-c1-c2` |
| Commits | phase 1 = 6ad5d53, phase 2 = 1af1734, phase 3 = 478a100, then this handoff |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after this commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/errorSignal.ts` | `ErrorSignal`, `isFatalSignal` (foreign and opaque noise ignored, `hasError` makes it fatal, rejections fatal except Abort/NotAllowed) |
| `src/testing/e2eHook.ts` | `e2eFail(search)`, `E2E_FORCED_FAILURE`, `E2EFailSite` (no registry key yet: phase 4) |
| `vite/e2eHookGuard.mjs`, `.d.mts` | `E2E_HOOK_MARKERS` (4), `E2E_REQUIRED_MARKERS` (`__martynkaE2E` only), `checkE2EHook(chunks, expectHook, required?)` |
| `tests/errorSignal.test.ts`, `tests/e2eFail.test.ts`, `tests/e2eHookGuard.test.ts` | +6, +4, +9 tests (958 -> 972 incl. it.each) |

## 3. Verification

| Command | Result |
|---|---|
| RED | `AssertionError: expected null to be 'step'` (e2eFail stub); isFatalSignal stub threw `not implemented`; guard test errored on missing exports (collection) |
| lint / typecheck | OK / OK |
| unit | 954 + 18 = 972 passed; deploy scripts and sample E1-E6 OK |
| build | `e2e hook: absent (2 chunks checked)`; grep dist for e2eFail, e2e-forced-failure, e2eMonth, __martynkaE2E: no match; `E2E_HOOK=1` build: `e2e hook: present (2 chunks checked)` |
| break | no `hasError` rule: "keeps the same message a failure" red; guard checking only first marker: 3 tests red; restored. Meta-check: cases come from research noise sources |
| e2e | not runnable in this session (MachPort) - orchestrator gate |
| teacher read | no Polish strings in this phase |

## 4. Next command

Phase 4 is `Driver: impl`:
/10x-implement observability-c1-c2 phase 4

## 5. Open

- e2e gate for phases 1-3 (baseline 18; this phase adds no browser behaviour, expect 18) awaits the orchestrator.
- Phase 4 must widen `E2E_REQUIRED_MARKERS` to the full list when e2eFail/E2E_FORCED_FAILURE get callers, and add `REGISTRY_KEYS.forcedFailure`.
- Manual: [reviewer] 2.5, [human] 2.6, 4.8, 5.9; [visual] 4.7, 5.8; teacher reads 4.5, 5.6.

## 6. Autonomous decisions

1. Phase kept Driver: tdd; commit message as proposed; stopped after phase 3. Would change: nothing.
2. Repeated `?e2eFail=` uses the first value (like `e2eMonth`); case-sensitive. Would change: a spec needs another rule.
3. Guard `.d.mts` extended (tracked typings file). The registry key is left to phase 4 (no caller yet).
