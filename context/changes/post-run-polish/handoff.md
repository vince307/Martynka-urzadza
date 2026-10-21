# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by `/10x-e2e` phase 9 of run 2026-10-21-post-run-polish: the heading e2e test, committed as 7b5bd55. Do not edit `src/data/balance.ts`, `curriculum.ts`, `mastery.ts`: shares are the contract.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | docs/plan + p1 `11f0c69`, p2 `3be7518`, p3 `8a0f76d`, p4 `ccf03af`, p5 `bb295b4`, p6 `91a1be1`, p7 `7004a50`, p8 `d7685b4`, p9 `7b5bd55` + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | `implemented` (epilogue, last phase) |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `CLAUDE.md` | variety sentence (whole round, rng-free repair), boot sentence (ordinary cut line, picture-only count), new sentence for this change |
| `src/core/round/prompt.ts` | header comment names `headingOf` |
| `context/changes/post-run-polish/follow-ups/review-fixes.md` | 15 `Trigger:` entries |
| `tests/e2e/narrator.spec.ts` | new test `#11 the heading above a sign task and above a calculation is drawn and read aloud before the task` |
| `context/changes/post-run-polish/plan.md` | rows 9.1, 9.3 ticked; 9.2 (orchestrator full suite), 7.4, 8.4, 8.5 [reviewer] open |

## 3. Verification

| command | result |
|---|---|
| `npx playwright test --config=<abs> tests/e2e/narrator.spec.ts` | 4 passed (new test green alone, 4.0 s) |
| break 1: `headingOf` returns `'calculate'` for string answers | RED: `Expected: "Wstaw znak"`, `Received: "Oblicz"` (heading assertion); restored |
| break 2: `TaskScene` narration options `headings: null` | RED: `expect(sign.narration?.startsWith(...)).toBe(true)` received false (heading assertion passed, narration failed); restored |
| lint, typecheck | OK |
| no servers left (4397/4398 not listening) | OK |
| full e2e suite | orchestrator's part; 9.2, 7.4, 8.4 open |

## 4. Next command

`/10x-impl-review post-run-polish`

## 5. Open

- Manual rows: 2.5 [reviewer], 2.6 [human], 3.5 [visual], 6.5 [visual], 8.5 [reviewer]; rows 7.4 and 8.4 wait for the orchestrator's e2e.
- Phase 9 done; epilogue run (status implemented).
- AGENTS.md had nothing untrue; variety.ts comment still accurate (draw order refers to the spread tie-break).

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
- P8-1 Skill tool not invoked separately; plan phase 8 followed directly (Driver impl). Reworded CLAUDE.md so the identifier `artCutBackground` does not appear (grep 8.1 must be empty). Stopped after the phase. Would change: n/a.
- P9-1 Skill tool not invoked separately; plan phase 9 followed directly (Driver e2e). One test with two alternating skills (compare_num_5, add_sub_5) in the E1 stage via the parent path instead of two contexts. Chromium launched in-agent. Mixed phase: browser-level part only; the pure rule `headingOf` and `spokenTask` are covered by unit tests of phases 2. Stopped after the phase. Would change: n/a.
