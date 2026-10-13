# Handoff — `save-export-import-reset` (slice S-12)

Written by the `/10x-tdd phase 1` step of run `2026-10-13-s12-s14`. Phase 1 is committed (`2e435cf`); rows 1.1-1.3 ticked, 1.4 left open because e2e could not start here. The next agent must not get wrong: `replace` never calls `block()`; one `writesOff()` predicate guards `save`, `markDirty` and the `save` loop.

## 1. State

| | |
|---|---|
| Branch | `feat/save-export-import-reset`, cut from `main` at `f3088d4` |
| Commits | 6 on the branch: 4 docs steps, `2e435cf` phase 1, plus this handoff/Progress docs commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `plan_reviewed` (left; not edited by this step) |
| `## Progress` rows remaining | 40 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the docs commit |

## 2. Artifacts

| Path | What it is |
|---|---|
| `src/core/autosave.ts` | `Autosaver.replace`, `current`, `ReplaceResult`, `AutosaveStatus.replace`, `writesOff()` |
| `src/core/save.ts` | `freshSession(firstRoom, stars = 0)` (imports `emptyRoomState` from `./rooms`, `initialSettings` from `./placement`) |
| `src/main.ts` | local `freshSession` removed; calls `freshSession(FIRST_ROOM, seeded ?? 0)` |
| `tests/autosave.test.ts` | new `describe('Autosaver.replace …')`, 10 tests |
| `tests/save.test.ts` | new `describe('freshSession …')`, 2 tests |
| `tests/saveHealth.test.ts` | status helper gets `replace: 'idle'` (type only) |
| `context/changes/save-export-import-reset/plan.md` | Progress 1.1-1.3 ticked with sha |

## 3. Verification

| Command | Result |
|---|---|
| RED (stub `replace` returning `{ok:false,error:'stub'}`, `freshSession` throwing) | 11 failed: `AssertionError: expected { ok: false, error: 'stub' } to deeply equal { ok: true }`; `Error: stub` for freshSession. Not a missing-import failure |
| GREEN | `npx vitest run`: 1188 passed (baseline 1176, +12) |
| lint / typecheck | OK / OK |
| unit gate (`npm test`, deploy tests, `sample` E1-E6) | OK, Tests 1188 passed (+12) |
| build | OK, `e2e hook: absent (2 chunks checked)` |
| e2e `npx playwright test` | NOT RUN: Chromium cannot start in this session (`MachPortRendezvousServer … Permission denied`). **The orchestrator must run e2e** (affects 1.4). Phase 1 touches `main.ts` only by moving `freshSession` |
| `git diff --stat tests/fixtures` | empty; `SAVE_VERSION` still 1 |
| Break B1: remove `await inflight` in `replace` | first attempt stayed green (test too weak: both writes held in order). Test sharpened (snapshot write held, replace write instant) then red: "waits for a write in flight, then writes the given state after it"; restored, green |
| Break B2: remove `replaced = true` | red: "turns every later write off after a success", "a second replace … is Busy"; restored |
| Break B3: no `replacing = false` on failure | red: "after a failed write … autosave resumes", "a failed replace of a dirty game lets the debounce timer write …"; restored |
| Meta-check | the breaks target the plan's contract (research option C: replaced save must not be overwritten by the old game), not implementation details. The "no write after replace" proof lives in this unit test, as the plan says |

## 4. Next command

`/10x-tdd save-export-import-reset phase 2`

## 5. Open

- Orchestrator: run `npx playwright test` (33 expected) before ticking 1.4; then 1.4 may be ticked with the sha.
- 1.5 `[reviewer]` row not mine.
- Phase 1 test note: `replace` takes an encoded `SaveState` (tests use `encodeSave(session(n))`); a raw `SessionSave` is `InvalidSave`.
- Carried from earlier handoff: DESIGN-GAP rows 46-51, e2e request-file protocol for phases 4-7, human checklist, follow-ups to write in phase 6.

## 6. Autonomous decisions

- TDD gate: implementation absent (`replace`, `current`, `freshSession` did not exist) and testable; driver stays `tdd`. Mixed-phase prompt: the `main.ts` move of `freshSession` was done inline as scaffolding, phase keeps `Driver: tdd`.
- Stub first (wrong values / throw) so RED is an assertion failure; stubs replaced by the real code in GREEN.
- 1.4 left unticked: the full local gate was not observed in full (no e2e). Rejected: ticking on the strength of unit+build. Would change: orchestrator's green e2e.
- Manual confirmation gate, commit message, next-phase question: decided in place; committed the planned set only (six paths + plan.md), stopped after the phase.
- Break B1 initially did not go red; strengthened the test rather than accepting a vacuous break.
