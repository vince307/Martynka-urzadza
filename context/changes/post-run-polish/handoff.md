# Handoff — `post-run-polish` (slice fix:post-run-polish)

Written by `/10x-tdd` phase 2 of run 2026-10-21-post-run-polish: the narrator reads the heading, phase 2 committed as 3be7518.
Screen still draws "Oblicz" only (`pl.round.heading.calculate`); phase 3 wires `headingOf` into `drawPrompt`.

## 1. State

| | |
|---|---|
| Branch | `feat/post-run-polish`, cut from `main` at `ba3a7c4` |
| Commits | docs/plan commits + `11f0c69` (p1) + `3be7518` (p2) + this handoff commit |
| Pushed / PR / merged | no / none / no |
| `change.md` status | not changed by this step |
| `## Progress` rows remaining | 35 (`grep -c '^- \[ \]' plan.md`) |
| Working tree | clean after the handoff commit |

## 2. Artifacts

| path | what it is |
|---|---|
| `src/core/narration/spoken.ts` | `spokenTask(task, words, headings \| null)`, `NarrationOptions.headings` |
| `src/data/pl.ts` | `round.heading {calculate, sign, fill}` replaces `round.calculate` |
| `src/scenes/TaskScene.ts` | narration passes `headings` (null for a word round); `drawPrompt` reads `heading.calculate` |
| `scripts/sample.ts` | `czyta:` passes `pl.round.heading` |
| `tests/spoken.test.ts` | 4 new cases + 2 updated (sign task, Uzupełnij/Oblicz, sentence, word round) |
| `docs/design-gaps.md` | row 154 |
| `context/changes/post-run-polish/plan.md` | rows 2.1-2.3 ticked with sha |

## 3. Verification

| command | result |
|---|---|
| RED (heading words added to pl, tests first) | `AssertionError: expected 'Jaki znak pasuje w okienku? trzy okienko pięć' to be 'Wstaw znak. Jaki znak pasuje w okienku? trzy okienko pięć'` (received: no prefix at all = meta-check); also `expected '[object Object]. trzydzieści…' to be 'Oblicz. …'`; 7 failed |
| GREEN | `tests/spoken.test.ts` 30 passed |
| break 1 (old `isExpression(speak ?? prompt)` gate) | 3 red: speak-over-prompt, sign-task heading, Uzupełnij/Oblicz; restored |
| break 2 (ignore `headings: null`) | 1 red: word-round case; restored |
| meta-check | break 1 shows the sign case sees the missing prefix (received had no heading), not a vacuous pass |
| sample diff E1-E6 (scratchpad before/after) | 34 changed lines, all `      czyta:`, body identical after stripping prefix (script-checked, 0 bad): none->`Wstaw znak.` 18, none->`Uzupełnij.` 8, `Oblicz.`->`Uzupełnij.` 7, none->`Oblicz.` 1; no prompt/answer/choice/hint line changed (one `5 − 2 □ 3 + 4` line shows in raw diff but is byte-identical, a diff alignment artefact) |
| teacher read (agent, new strings) | "Wstaw znak." and "Uzupełnij." are short imperatives; "Wstaw znak. Porównaj wyniki. Jaki znak pasuje w okienku? …" (COMPARE_EXPR) reads three directives, as the plan's known risk says; MISSING_OP gets "Wstaw znak. Jakiego znaku działania brakuje w okienku? …" (sign answer, fine); "Oblicz. Jaka liczba pasuje w okienku? 17 − 8 = □" as planned (P-1). Reviewer row 2.5 still owed |
| lint, typecheck | OK |
| `npm test` | 3727 passed (baseline 3710 + 17; phase 1 3723, p2 +4) |
| deploy scripts, `sample` E1-E6, `npm run build` | OK, `e2e hook: absent` |
| `grep -rn "round.calculate" src scripts tests` | empty |
| e2e | not run: orchestrator's part, row 2.4 left open (expected branch baseline + 0) |

## 4. Next command

`/10x-implement post-run-polish phase 3`

## 5. Open

- Manual rows: 2.5 [reviewer], 2.6 [human], 3.5 [visual], 6.5 [visual], 8.5 [reviewer]; row 2.4 waits for the orchestrator's e2e.
- DESIGN-GAP 153 rewrite (phase 5); follow-ups in phase 8 (`follow-ups/review-fixes.md`): COMPARE_EXPR three-directive narration (trigger: teacher read 2.5 / playtest).
- Phase 3 must draw the heading from `headingOf` and `pl.round.heading` (no drawing yet beyond "Oblicz").

## 6. Autonomous decisions

- P2-1 Gate: phase fully TDD'able, no mixed-phase question. Commit message as proposed (`test(post-run-polish): the narrator reads the heading (p2)`); stopped after the phase. Would change: n/a.
- P2-2 Added `pl.round.heading` before the tests (kept nothing of `round.calculate`; the red came from the old signature taking the object), so the RED is a real assertion. Would change: n/a.
- P2-3 The existing "prefers the task speak" test used a numeric fake answer for a sign prompt; it now uses answer `'<'` (a real COMPARE_NUM shape) and expects the heading. Would change: n/a.
