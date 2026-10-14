# Handoff — `drawn-grid-tasks-e3-e4` (slice S-13b)

Phase 7 (impl) done and committed as eacf9e0. The clock-to-set branch exists in `TaskScene` (no data uses it yet) with the hook fields and e2e helpers. Row 7.4 (e2e) and the `[reviewer]` row 7.5 are open; 6.5 ticked from the orchestrator note.

## 1. State

| | |
|---|---|
| Branch | `feat/drawn-grid-tasks-e3-e4` |
| Commits | eacf9e0 (phase 7) on ab1fa91 (p6) on c01c12e (p5) on e69e6e8 (p4) on 3cb42cc (p3) on 2166514 (p2) on c84ece8 (p1) |
| Pushed / PR / merged | no / no / no |
| `change.md` status | `implementing` |
| Progress rows remaining | 7.4 (e2e), 7.5 `[reviewer]`; 6.6, 6.7, 5.6, 5.7, 4.4, 3.5, 2.5, 1.5 open; phases 8-12 open |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/ui/widgets/ClockSet.ts` (new) | dial (a `ClockFace`) + rings on the holdable hand tips (held = larger, butter) + "OK"; `render(state, snap, active, okShown)`, `targets()` (centre, hourTip, minuteTip or null, ok, radius) |
| `src/scenes/TaskScene.ts` | `clockTask` from `dragMode`; `clockState`/`clockStart`/`clockSnap`; `feedDrag` routes to `stepClockSet` or `stepBlockDrag`; "OK" -> `submit(clockValue)`; wrong answer, sleep, `pointerupoutside` restore the pose; snapshot `clock`, targets `clock`; the static picture is skipped for a clock to set |
| `src/data/layout.ts` | `TASK_LAYOUT.clockSet.dial` is now the ONE dial geometry (carry-forward from phase 4): `ClockFace` reads it, `clockSetLayout` and the scene use it; plus `handleBorder`, `heldGrow` |
| `tests/e2e/support/hook.ts` | `Snapshot.clock`, `Targets.clock`, `setClock(page, "3.15")` (minute hand first, then hour hand aimed with the minute drift), `tapClockOk`, clock branch in `answerRight`/`answerWrong` (wrong = hour + 1) |
| `tests/clockSet.test.ts` | + 1 test: handle >= 96 px, every tip pose with its grab radius inside the mat |

## 3. Verification

| command | result |
|---|---|
| lint / typecheck | OK / OK |
| unit | branch baseline 2195 + 1 = 2196 passed; deploy and ops scripts OK; `sample` E1-E6 exit 0 |
| build | OK, `e2e hook: absent (2 chunks checked)`. No new `?e2e*` seam this phase; the `clock` fields sit in the scene's snapshot/targets (like `mat`/`drag`), only the hook that publishes them is hook-build-only |
| e2e | not runnable in this session — orchestrator gate (Chromium MachPortRendezvous Permission denied, plain command); expected branch baseline 57 + 0. Row 6.5 ticked from the orchestrator note (57 passed on ab1fa91) |
| Deliberate break | the plan's break (drop `clock` from the snapshot) would NOT turn typecheck red: `Snapshot` in `hook.ts` is hand-written, not derived from the scene. Meta-check failed, so I broke the unified dial constant instead (`hourLength` 78 -> 300 in `TASK_LAYOUT.clockSet.dial`): `tests/clockSet.test.ts` 2 failed ("expected 100.05 to be greater than or equal to 380" in the new tips-inside-mat test, and the tie-by-radius grab test); restored, 20 passed |
| Not proven | the canvas behaviour of the branch (touch -> hands -> OK) has no test until phase 12; `setClock` is untested until then |

## 4. Next command

`/10x-implement drawn-grid-tasks-e3-e4 phase 8`

## 5. Open

- 7.4 e2e (orchestrator: 57 + 0), 7.5 `[reviewer]`; earlier 6.6, 6.7, 5.6, 5.7, 4.4, 3.5, 2.5, 1.5.
- `docs/design-gaps.md` rows 73-77 are referenced from comments; phase 10 writes them (77 = handles on the clock hands).
- Phase 8 adds the first `set` skills, so the new canvas branch runs for the first time in the e2e suite (the full suite, incl. `adaptive.spec`, must be run by the orchestrator after phase 8; phase 12 adds the dedicated spec). `setClock` assumes: a drag from a tip grabs that hand (both tips overlapping resolves by radius), the minute hand goes first.
- Hand ring handles are drawn only while the task takes input (not in the solution phase); the dial stays in the mat rect even if a long prompt would push other drawings down.

## 6. Autonomous decisions

1. Dial constants unified in `TASK_LAYOUT.clockSet.dial` (flat `hourLength`/`minuteLength` kept because `DialSpec` and the phase 4 tests use them). Would change: a second dial size.
2. The dial is drawn by `ClockSet` (own `ClockFace`) in `TASK_LAYOUT.drag.mat`, and `TaskPicture` gets `null` for a clock to set; the reducer geometry and the drawing share `clockSetLayout`. The `picture` bounds target is therefore null for such a task (the hook publishes `clock` instead).
3. Plan break replaced (see §3) because its meta-check failed.
4. After a wrong time the hands return to the start pose (like the mat is emptied after a wrong build).
