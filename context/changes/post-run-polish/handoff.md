# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by `/10x-tdd` phase 7 of run 2026-10-21-post-run-polish: drawing limits fail at generation with the skill id, committed as 7004a50. Do not edit `src/data/balance.ts`, `curriculum.ts`, `mastery.ts`: shares are the contract.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | docs/plan + p1 `11f0c69`, p2 `3be7518`, p3 `8a0f76d`, p4 `ccf03af`, p5 `bb295b4`, p6 `91a1be1`, p7 `7004a50` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | not changed by this step |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/tasks/visual.ts` | `assertDrawable` gains `money` pay tray limit (`TASK_LAYOUT.coinDrag.maxKinds`) and `column` (`columnMarks(v, 'all')`) |
| `tests/generateTaskFailure.test.ts` | 3 cases: tray over limit, carry off last column, `faceLabel` on a non-face code |
| `tests/coinLayout.test.ts` | invariant `ART_LIMITS.trayKinds <= coinDrag.maxKinds` |
| `context/changes/post-run-polish/plan.md` | rows 4.5, 5.5, 6.4 ticked (orchestrator e2e 143+0), 7.1-7.3 ticked; 7.4 open |

## 3. Verification

| command | result |
|---|---|
| RED (before the change) | money and column cases: `TypeError: Cannot read properties of undefined (reading 'skillId')` at `expect(e.skillId)` (generateTask did not throw); faceLabel case already green (generator throws itself, pinned) |
| GREEN | `generateTaskFailure` + `coinLayout` 35 passed |
| `npm test` | 3736 passed (phase-6 3732, +4) |
| break | drop `column` case -> column test red; drop `money` check -> tray test red; `trayKinds` 5 -> invariant red; each restored |
| meta-check | each fixture first passes to `columnMarks(.., 'all')` / `coinLayout(TASK_LAYOUT.coinDrag, tray)` inside the test and throws there |
| `npm run sample` E1-E6 vs saved before-output | `cmp` identical for all six |
| lint, typecheck, deploy scripts, build | OK (`e2e hook: absent`) |
| e2e full suite | orchestrator's part; row 7.4 open |

## 4. Next command

`/10x-implement post-run-polish phase 8`

## 5. Open

- Manual rows: 2.5 [reviewer], 2.6 [human], 3.5 [visual], 6.5 [visual], 8.5 [reviewer]; row 7.4 waits for the orchestrator's e2e.
- Phase 8: CLAUDE.md still names `artCutBackground` (grep 8.1 includes CLAUDE.md); rewrite there. Follow-ups in `follow-ups/review-fixes.md`: COMPARE_EXPR three-directive narration (trigger: teacher read 2.5 / playtest).

## 6. Autonomous decisions


- P2-1 Gate: phase fully TDD'able, no mixed-phase question. Commit message as proposed (`test(post-run-polish): the narrator reads the heading (p2)`); stopped after the phase. Would change: n/a.
- P2-2 Added `pl.round.heading` before the tests (kept nothing of `round.calculate`; the red came from the old signature taking the object), so the RED is a real assertion. Would change: n/a.
- P2-3 The existing "prefers the task speak" test used a numeric fake answer for a sign prompt; it now uses answer `'<'` (a real COMPARE_NUM shape) and expects the heading. Would change: n/a.
- P3-1 Row 3.2: no canvas unit test exists, so no break was run; recorded as the plan says. Hook `heading` is read from the scene field. Stopped after the phase. Would change: n/a.
- P4-1 Gate: phase fully TDD'able; commit message in Polish as the profile asks; stopped after the phase. Would change: n/a.
- P4-2 Test names via `it.each` tuples with `%s` (object `$id` form printed undefined). Would change: n/a.
- P5-1 The Skill tool was not invoked separately; plan phase 5 followed directly (Driver impl). Spec run in-agent, Chromium started. Stopped after the phase. Would change: n/a.
- P6-1 Skill tool not invoked separately; plan phase 6 followed directly (Driver tdd, fully testable, no mixed question). Stub summed all five lists (the planned break) so RED was a real assertion. Commit message as planned; stopped after the phase. Would change: n/a.
- P7-1 Skill tool not invoked separately; plan phase 7 followed directly (Driver tdd kept, fully testable, no mixed question). The faceLabel case was green before the change (documented in the test as a pin). `visual.ts` imports `TASK_LAYOUT` from `data/layout` (core may import data). Commit message as planned; stopped after the phase. Would change: n/a.
