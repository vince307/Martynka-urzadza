# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by `/10x-implement` phase 3 of run 2026-10-21-post-run-polish: the task screen draws the heading from `headingOf`, phase 3 committed as 8a0f76d.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | docs/plan commits + `11f0c69` (p1) + `3be7518` (p2) + `8a0f76d` (p3) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | not changed by this step |
| `## Progress` rows remaining | 32 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/scenes/TaskScene.ts` | `drawPrompt` draws `pl.round.heading[headingOf(task)]` (none in a word round), field `drawnHeading`, `TaskSnapshot.heading` |
| `tests/e2e/support/hook.ts` | snapshot type gains `heading: string \| null` |
| `context/changes/post-run-polish/plan.md` | rows 3.1-3.3 ticked with sha |

## 3. Verification

| command | result |
|---|---|
| grep headingOf / round.heading in TaskScene | `drawPrompt` and `currentNarration`; `'Oblicz'` literal only in `src/data/pl.ts` |
| deliberate break (row 3.2) | none run: no unit test renders the canvas (node); proof is phase 9's spec (draw `heading.calculate` for every kind -> red) plus [visual] row 3.5 |
| lint, typecheck | OK |
| `npm test` | 3727 passed (baseline 3710 + 17; delta this phase 0) |
| deploy scripts, build | OK, `e2e hook: absent (2 chunks checked)` |
| sample E1-E6 | run, no violations |
| e2e | not run: orchestrator's part, rows 2.4 and 3.4 left open (expected branch baseline + 0) |

## 4. Next command

`/10x-tdd post-run-polish phase 4`

## 5. Open

- Manual rows: 2.5 [reviewer], 2.6 [human], 3.5 [visual], 6.5 [visual], 8.5 [reviewer]; rows 2.4 and 3.4 wait for the orchestrator's e2e.
- DESIGN-GAP 153 rewrite (phase 5); follow-ups in phase 8 (`follow-ups/review-fixes.md`): COMPARE_EXPR three-directive narration (trigger: teacher read 2.5 / playtest).

## 6. Autonomous decisions

- P2-1 Gate: phase fully TDD'able, no mixed-phase question. Commit message as proposed (`test(post-run-polish): the narrator reads the heading (p2)`); stopped after the phase. Would change: n/a.
- P2-2 Added `pl.round.heading` before the tests (kept nothing of `round.calculate`; the red came from the old signature taking the object), so the RED is a real assertion. Would change: n/a.
- P2-3 The existing "prefers the task speak" test used a numeric fake answer for a sign prompt; it now uses answer `'<'` (a real COMPARE_NUM shape) and expects the heading. Would change: n/a.
- P3-1 Row 3.2: no canvas unit test exists, so no break was run; recorded as the plan says. Hook `heading` is read from the scene field. Stopped after the phase. Would change: n/a.
