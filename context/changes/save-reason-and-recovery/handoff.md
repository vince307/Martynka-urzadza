# Handoff — `save-reason-and-recovery` (slice fix, non-roadmap)

The `/10x-tdd` phase 1 step of run `2026-10-14-save-s13b-s15-s14b` wrote this file; commit `974cd90` holds the code. The next agent must not get this wrong: phase 2 is still invisible except the "Zapis gry" lines, `main.ts` must NOT pass `loadReason` before phase 3, and `UIScene` still calls `saver.replace(state)` without `force` until phase 4.

## 1. State

| | |
|---|---|
| Branch | `feat/save-reason-and-recovery`, cut from `main` at `16a0abd` |
| Commits | 6 (+ this handoff) ; phase 1 = `974cd90` |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| `## Progress` rows remaining | 35 |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` | `LoadReason`, `replaceGate`, `AutosaveStatus.loadReason/loadError`, `AutosaverOptions.loadReason`, `replace(state, { force })` with SIR-05 log lines |
| `src/core/saveFile.ts` | `deviceSaveView(status, …)`; `blocked` has cause future/timeout/unavailable/fatal and `forceable` |
| `src/scenes/UIScene.ts` | only the argument of the two `deviceSaveView` calls (`saver.status()`) |
| `tests/autosave.test.ts`, `tests/saveFile.test.ts` | new gate, lockstep and view tests |
| `tests/deviceSaveWiring.test.ts`, `tests/saveHealth.test.ts` | literal changed to `saver.status()`; status fixture got the two fields |
| `context/changes/save-reason-and-recovery/plan.md` | Progress rows 1.1-1.3 ticked |

## 3. Verification

| Command | Result |
|---|---|
| RED (before code, stubs only) | `AssertionError: expected { ok: true } to deeply equal { ok: false, error: 'Blocked' }` (future save replaced); `expected { kind: 'unreadable' } to deeply equal { kind: 'blocked', … }` |
| lint / typecheck | OK / OK |
| `npm test` | 1915 passed (baseline 1905, +10) |
| deploy tests, `sample` E1-E6, build | OK |
| Deliberate break 1 | `replaceGate` lets `future` through: 3 failed, restored; meta: tests count store writes |
| Deliberate break 2 | `timeout` ignored (`force` alone): 3 failed, restored. Break "read `lastError` instead of `loadError`" stayed green: unreachable, because `lastError` can only change through writes and those are blocked while `unavailable`; `loadError` stays an immutable field anyway |
| e2e | e2e: not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied); expected 52 + 0 |

## 4. Next command

/10x-tdd save-reason-and-recovery phase 2

## 5. Open

- Row 1.4 (e2e part of the gate) left unticked for the orchestrator; 1.5 is [reviewer].
- Phases 2-6 as in plan; phase 3 starts passing `loadReason` from `main.ts`; dialogs ignore `forceable`/new causes until phases 3-4 (they render `deviceUnavailable` for every `blocked`).
- Behaviour note: a `future` save now yields `blocked`/`future` in the view (dialogs show the unavailable text) only once `main.ts` passes `loadReason`.

## 6. Autonomous decisions

1. Mixed phase: TDD for core logic; the `UIScene` argument change and test-fixture field additions were done inline. Phase keeps `Driver: tdd`.
2. `replaceGate` placed in `autosave.ts` and used by `saveFile.ts` (already imported from it). Rejected: a separate module. Would change if a cycle appeared.
3. Log lines for a refused replace and for replacing an unread save are single `log` calls with names only (no message), per SIR-05.
4. No `AskUserQuestion`; commit message accepted as proposed.
