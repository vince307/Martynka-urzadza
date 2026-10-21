# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by `/10x-implement` phase 5 of run 2026-10-21-post-run-polish: "Obrazki" drops the background line, committed as bb295b4. Do not edit `src/data/balance.ts`, `curriculum.ts`, `mastery.ts`: shares are the contract.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | docs/plan + `11f0c69` (p1) + `3be7518` (p2) + `8a0f76d` (p3) + `ccf03af` (p4) + `bb295b4` (p5) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | not changed by this step |
| `## Progress` rows remaining | see `grep -c '^- \[ \]' plan.md` |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/artHealth.ts`, `src/ui/dom/artHealthView.ts`, `src/scenes/UIScene.ts`, `src/data/pl.ts` | background input, field, branch, caller and `artCutBackground` removed; cut line is `{ kind: 'cut'; count }` |
| `tests/artHealthLines.test.ts`, `tests/artHealthText.test.ts` | three background cases -> one `toEqual` case; `artCutBackground` describe removed |
| `tests/e2e/load-and-tab-guard.spec.ts` | `#15 H-1` title and last assertions adapted (artCut visible, no "w tle") |
| `docs/design-gaps.md` | row 153 rewritten as closed by post-run-polish |
| `context/changes/post-run-polish/plan.md` | rows 5.1-5.4 ticked with sha; 5.5 open |

## 3. Verification

| command | result |
|---|---|
| grep background code | none left (only the UIScene input-zone comment); `hiddenMs` still in the `BootScene` record and `layout.ts` |
| `npm test` | 3728 passed (phase-4 3731, -3: 3 cases -> 1, describe -1) |
| spec `load-and-tab-guard.spec.ts` (Chromium started) | 6 passed |
| break 1 | cut line gets `background: true` -> 2 unit cases red; restored |
| break 2 | `case 'cut'` -> `artRestart` -> `#15 H-1` and `#14 B-4` red; restored |
| break 3 (hidden-time RULE) | `hiddenMsAt` returns 0 -> adapted `#15 H-1` red (hiddenMs assertion); restored |
| meta-check | break 3 shows the adapted test still guards the rule, not only the text |
| `git diff --stat main -- save.ts migrations fixtures` | empty |
| lint, typecheck, deploy scripts, sample E1-E6, build | OK (`e2e hook: absent`) |
| teacher read | pl.ts only lost a string; no new Polish text; gap 153 row is docs |
| e2e full suite | orchestrator's part; row 5.5 open |

## 4. Next command

`/10x-tdd post-run-polish phase 6`

## 5. Open

- Manual rows: 2.5 [reviewer], 2.6 [human], 3.5 [visual], 6.5 [visual], 8.5 [reviewer]; rows 4.5 and 5.5 wait for the orchestrator's e2e.
- Phase 8: CLAUDE.md still names `artCutBackground` (grep 8.1 includes CLAUDE.md); rewrite there. Follow-ups in `follow-ups/review-fixes.md`: COMPARE_EXPR three-directive narration (trigger: teacher read 2.5 / playtest).

## 6. Autonomous decisions


- P2-1 Gate: phase fully TDD'able, no mixed-phase question. Commit message as proposed (`test(post-run-polish): the narrator reads the heading (p2)`); stopped after the phase. Would change: n/a.
- P2-2 Added `pl.round.heading` before the tests (kept nothing of `round.calculate`; the red came from the old signature taking the object), so the RED is a real assertion. Would change: n/a.
- P2-3 The existing "prefers the task speak" test used a numeric fake answer for a sign prompt; it now uses answer `'<'` (a real COMPARE_NUM shape) and expects the heading. Would change: n/a.
- P3-1 Row 3.2: no canvas unit test exists, so no break was run; recorded as the plan says. Hook `heading` is read from the scene field. Stopped after the phase. Would change: n/a.
- P4-1 Gate: phase fully TDD'able; commit message in Polish as the profile asks; stopped after the phase. Would change: n/a.
- P4-2 Test names via `it.each` tuples with `%s` (object `$id` form printed undefined). Would change: n/a.
- P5-1 The Skill tool was not invoked separately; plan phase 5 followed directly (Driver impl). Spec run in-agent, Chromium started. Stopped after the phase. Would change: n/a.
