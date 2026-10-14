# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The `/10x-tdd` phase 2 step of run `2026-10-14-save-s13b-s15-s14b` wrote this file; commit `815af40` holds the code. The next agent must not get this wrong: `main.ts` still must NOT pass `loadReason` before phase 3 (so `future` is not yet visible in the browser), and `UIScene` still calls `saver.replace(state)` without `force` until phase 4.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 8 (+ this handoff); phase 1 = `974cd90`, phase 2 = `815af40` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 31 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/saveHealth.ts` | `off` state has `cause` (adds `future`, `timeout`) and `code`; `offState` helper reads `loadReason`/`loadError`, `lastError` only for `fatal` |
| `src/ui/dom/saveHealthView.ts` | muted `Kod: … · Wersja …` line under the off sentence |
| `src/data/pl.ts` | `settings.saveOff.future`, `settings.saveOff.timeout` |
| `src/main.ts` | `detail` on the start card now also for `unavailable` (error name) |
| `docs/design-gaps.md` | row 69 |
| `tests/saveHealth.test.ts` | 4 new cause/code tests |
| `plan.md` | rows 1.4 (orchestrator note), 2.1, 2.2 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub: `code: null`, old causes) | `AssertionError: expected { kind: 'off', …(3) } to match object { kind: 'off', cause: 'future', …(1) }` (4 failed) |
| lint / typecheck | OK / OK |
| `npm test` | 1919 passed (baseline 1915, +4) |
| deploy tests, `sample` E1-E6 | OK |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| Deliberate break 1 | `timeout` treated as `unavailable`: 1 failed, restored; meta: the test sets `loadError: 'timeout'` with a different `lastError` |
| Deliberate break 2 | `unavailable` code from `lastError`: 1 failed, restored |
| e2e | e2e: not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied); expected 52 + 0 |

## 4. Next command

/10x-implement save-reason-and-recovery phase 3

## 5. Open

- Row 2.3 e2e part left for the orchestrator; 2.4 [reviewer], 2.5 [visual] not mine.
- Phase 3 starts passing `loadReason` from `main.ts` and adds the `?e2eSave=corrupt` seam.
- The `unavailable` card `detail` is `Kod: <error>`; for an unreadable save unchanged.

## 6. Autonomous decisions

1. Mixed phase: TDD for `stateOf`; the DOM line, `pl.ts` strings, `main.ts` detail and design-gaps row were done inline. Phase keeps `Driver: tdd`.
2. Teacher read of the two new strings: calm, addressed to an adult, `timeout` does not blame the browser; accepted as the plan words them.
3. Existing `save-restart.spec.ts` checks keys not text per plan; not runnable here, expected unchanged.
4. No `AskUserQuestion`; commit message accepted as proposed.
